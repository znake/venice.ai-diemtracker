export async function fetchBalance(apiKey) {
  try {
    const response = await fetch("https://api.venice.ai/api/v1/api_keys/rate_limits", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      return { usd: null, diem: null, error: "Invalid API Key" };
    }

    if (response.status === 429) {
      return { usd: null, diem: null, error: "Rate limit exceeded" };
    }

    if (!response.ok) {
      return { usd: null, diem: null, error: `HTTP error! status: ${response.status}` };
    }

    const json = await response.json();
    const balances = json?.data?.balances;

    if (!balances) {
      return { usd: null, diem: null, error: "No balance data in response" };
    }

    const formatBalance = (val) => val != null ? Number(val).toFixed(2) : null;

    return {
      usd: formatBalance(balances.USD),
      diem: formatBalance(balances.DIEM),
      error: null,
    };
  } catch {
    return { usd: null, diem: null, error: "Network error" };
  }
}

const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

const normalizeError = (status, fallback) => {
  if (status === 401) return "Invalid API Key";
  if (status === 429) return "Rate limit exceeded";
  if (status) return `HTTP error! status: ${status}`;
  return fallback || "Network error";
};

export const parseModelFromSku = (sku) => {
  if (!sku || typeof sku !== "string") return "Unknown";
  if (sku.includes("-llm-")) return sku.split("-llm-")[0];
  if (sku.includes("-image-")) return sku.split("-image-")[0];
  if (sku.includes("-audio-")) return sku.split("-audio-")[0];
  const model = sku.split("-").slice(0, -3).join("-");
  return model || sku;
};

const MAX_PAGES = 15;
// Retry 5xx briefly per page, then abort pagination for this currency —
// retrying the SAME cursor repeatedly just burns ~2.3s on a page that will
// 500 again (Venice backend occasionally serves broken cursor pages).
// NOTE: hard upper bound so a permanently broken cursor can never wedge
// a refresh into an infinite retry loop.
const RETRY_DELAYS_MS = [750, 1500];

export async function fetchUsageForCurrency(apiKey, currency, { days = 7, pageSize = 1000, maxPages = MAX_PAGES, onPage = null } = {}) {
  const allUsage = [];
  try {
    const endDate = new Date();
    const startDate = new Date();

    if (days === 1) {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(endDate.getDate() - days);
    }

    let cursor = null;
    let page = 0;

    do {
      page += 1;
      const params = new URLSearchParams();
      if (cursor) {
        // Continuation requests send the cursor only; the filters travel inside it.
        params.set("cursor", cursor);
      } else {
        params.set("currency", currency);
        params.set("startTimestamp", startDate.toISOString());
        params.set("endTimestamp", endDate.toISOString());
        params.set("pageSize", String(pageSize));
      }

      let response = null;
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
        try {
          response = await fetch(`${VENICE_BASE_URL}/billing/usage-history?${params.toString()}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          });
        } catch {
          response = null;
        }
        const retryable = response === null || (response.status >= 500 && response.status <= 599);
        if (!retryable || attempt === RETRY_DELAYS_MS.length) break;
        await sleep(RETRY_DELAYS_MS[attempt]);
      }

      if (response === null || !response.ok) {
        const error = normalizeError(response ? response.status : null);
        if (allUsage.length > 0) {
          return { usage: allUsage, totalRecords: null, error: `${error} (showing partial data)` };
        }
        return { usage: [], totalRecords: null, error };
      }

      const json = await response.json();
      const pageUsage = Array.isArray(json?.data) ? json.data : [];
      const pageUsageWithCurrency = pageUsage.map(item => ({ ...item, _fetchedCurrency: currency }));
      allUsage.push(...pageUsageWithCurrency);

      // Progressive rendering: hand each finished page to the caller so the
      // dashboard can fill up while later pages are still loading.
      if (onPage !== null && pageUsageWithCurrency.length > 0) {
        onPage(pageUsageWithCurrency);
      }

      cursor = typeof json?.nextCursor === "string" && json.nextCursor ? json.nextCursor : null;
    } while (cursor && page < maxPages);

    // usage-history reports no result totals, so totalRecords stays null.
    return { usage: allUsage, totalRecords: null, error: null };
  } catch {
    if (allUsage.length > 0) {
      return { usage: allUsage, totalRecords: null, error: `${normalizeError(null)} (showing partial data)` };
    }
    return { usage: [], totalRecords: null, error: normalizeError(null) };
  }
}

const MULTI_CURRENCY_DELAY_MS = 300;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchUsage(apiKey, { currency = "DIEM", currencies = null, days = 7, pageSize = 1000, maxPages = MAX_PAGES, onPage = null } = {}) {
  const requestedCurrencies = currencies || [currency];

  if (requestedCurrencies.length === 1) {
    return fetchUsageForCurrency(apiKey, requestedCurrencies[0], { days, pageSize, maxPages, onPage });
  }

  // Currencies are independent requests — fetch them in PARALLEL. A small
  // stagger keeps the burst size identical to the old sequential behavior's
  // steady state (2 concurrent), while cutting total wall time roughly in half.
  const tasks = requestedCurrencies.map((requestedCurrency, index) => (async () => {
    if (index > 0) {
      await sleep(MULTI_CURRENCY_DELAY_MS * index);
    }
    return fetchUsageForCurrency(apiKey, requestedCurrency, { days, pageSize, maxPages, onPage });
  })());

  const results = await Promise.all(tasks);
  const allUsage = [];
  let totalRecords = 0;
  let firstError = null;

  results.forEach((result) => {
    allUsage.push(...result.usage);
    if (result.totalRecords != null) {
      totalRecords += result.totalRecords;
    }
    if (result.error && !firstError) {
      firstError = result.error;
    }
  });

  return { usage: allUsage, totalRecords, error: firstError };
}

export async function fetchRateLimits(apiKey) {
  try {
    const response = await fetch(`${VENICE_BASE_URL}/api_keys/rate_limits`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return { balances: null, nextEpoch: null, error: normalizeError(response.status) };
    }

    const json = await response.json();
    const balances = json?.data?.balances ?? null;
    const nextEpoch = json?.data?.nextEpochBegins ?? json?.data?.next_epoch ?? json?.data?.nextEpoch ?? null;
    return { balances, nextEpoch, error: null };
  } catch {
    return { balances: null, nextEpoch: null, error: normalizeError(null) };
  }
}

export async function fetchUsageAnalytics(apiKey, { days = 7 } = {}) {
  try {
    const params = new URLSearchParams();
    if (days === 1) {
      const today = new Date().toISOString().slice(0, 10);
      params.set("startDate", today);
      params.set("endDate", today);
    } else {
      params.set("lookback", `${days}d`);
    }

    const response = await fetch(`${VENICE_BASE_URL}/billing/usage-analytics?${params}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return { byKey: [], error: normalizeError(response.status) };
    }

    const json = await response.json();
    return {
      byKey: Array.isArray(json?.byKey) ? json.byKey : [],
      error: null,
    };
  } catch {
    return { byKey: [], error: normalizeError(null) };
  }
}

export function aggregateUsage(usage = []) {
  const perModel = new Map();
  const perDay = new Map();
  const seenRequestIds = new Set();
  let totalCostDiem = 0;
  let totalCostUsd = 0;
  let totalTokens = 0;
  let totalRequests = 0;
  let lastUpdated = null;

  usage.forEach((item) => {
    const amount = Math.abs(Number(item?.amount ?? 0));
    const currency = item?._fetchedCurrency || item?.currency || "DIEM";
    const isUsd = currency === "USD";
    const tokens =
      Number(item?.inferenceDetails?.promptTokens ?? 0) +
      Number(item?.inferenceDetails?.completionTokens ?? 0);
    const model = parseModelFromSku(item?.sku);
    const timestamp = item?.timestamp ? new Date(item.timestamp) : null;
    const dateKey = timestamp && !Number.isNaN(timestamp.getTime())
      ? timestamp.toISOString().slice(0, 10)
      : "unknown";
    const requestId = item?.inferenceDetails?.requestId;

    if (isUsd) {
      totalCostUsd += amount;
    } else {
      totalCostDiem += amount;
    }
    totalTokens += tokens;

    if (requestId) {
      if (!seenRequestIds.has(requestId)) {
        seenRequestIds.add(requestId);
        totalRequests += 1;
      }
    } else {
      totalRequests += 1;
    }

    if (timestamp && (!lastUpdated || timestamp > lastUpdated)) {
      lastUpdated = timestamp;
    }

    const modelEntry = perModel.get(model) || {
      model,
      costDiem: 0,
      costUsd: 0,
      tokens: 0,
      lastUsed: null,
    };
    if (isUsd) {
      modelEntry.costUsd += amount;
    } else {
      modelEntry.costDiem += amount;
    }
    modelEntry.tokens += tokens;
    if (timestamp && (!modelEntry.lastUsed || timestamp > modelEntry.lastUsed)) {
      modelEntry.lastUsed = timestamp;
    }
    perModel.set(model, modelEntry);

    const dayEntry = perDay.get(dateKey) || { date: dateKey, totalDiem: 0, totalUsd: 0, totalsByModel: {} };
    if (isUsd) {
      dayEntry.totalUsd += amount;
    } else {
      dayEntry.totalDiem += amount;
    }
    if (!dayEntry.totalsByModel[model]) {
      dayEntry.totalsByModel[model] = { diem: 0, usd: 0 };
    }
    if (isUsd) {
      dayEntry.totalsByModel[model].usd += amount;
    } else {
      dayEntry.totalsByModel[model].diem += amount;
    }
    perDay.set(dateKey, dayEntry);
  });

  const perModelSorted = Array.from(perModel.values()).sort((a, b) => (b.costDiem + b.costUsd) - (a.costDiem + a.costUsd));
  const perDaySorted = Array.from(perDay.values())
    .filter((day) => day.date !== "unknown")
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => ({
      ...day,
      label: day.date.slice(5),
    }));

  return {
    summary: {
      totalCostDiem,
      totalCostUsd,
      totalTokens,
      totalRequests,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
    },
    perModel: perModelSorted,
    dailySeries: perDaySorted,
  };
}
