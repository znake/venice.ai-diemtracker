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

const parseModelFromSku = (sku) => {
  if (!sku || typeof sku !== "string") return "Unknown";
  if (sku.includes("-llm-")) return sku.split("-llm-")[0];
  if (sku.includes("-image-")) return sku.split("-image-")[0];
  if (sku.includes("-audio-")) return sku.split("-audio-")[0];
  const model = sku.split("-").slice(0, -3).join("-");
  return model || sku;
};

const MAX_PAGES = 15;

export async function fetchUsageForCurrency(apiKey, currency, { days = 7, limit = 500, maxPages = MAX_PAGES } = {}) {
  try {
    const endDate = new Date();
    const startDate = new Date();

    if (days === 1) {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(endDate.getDate() - days);
    }

    const allUsage = [];
    let page = 1;
    let hasMore = true;
    let totalRecords = null;

    while (hasMore && page <= maxPages) {
      const params = new URLSearchParams({
        currency,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: String(limit),
        page: String(page),
      });

      const response = await fetch(`${VENICE_BASE_URL}/billing/usage?${params.toString()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return { usage: [], totalRecords: null, error: normalizeError(response.status) };
      }

      const json = await response.json();
      const pageUsage = Array.isArray(json?.data) ? json.data : [];
      const pageUsageWithCurrency = pageUsage.map(item => ({ ...item, _fetchedCurrency: currency }));
      allUsage.push(...pageUsageWithCurrency);

      if (totalRecords == null && json?.pagination?.total != null) {
        totalRecords = json.pagination.total;
      }

      const totalPages = json?.pagination?.totalPages;
      if (totalPages != null) {
        hasMore = page < totalPages;
      } else {
        hasMore = pageUsage.length === limit;
      }
      page += 1;
    }

    return { usage: allUsage, totalRecords, error: null };
  } catch {
    return { usage: [], totalRecords: null, error: normalizeError(null) };
  }
}

const MULTI_CURRENCY_DELAY_MS = 300;

export async function fetchUsage(apiKey, { currency = "DIEM", currencies = null, days = 7, limit = 500, maxPages = MAX_PAGES } = {}) {
  const requestedCurrencies = currencies || [currency];
  
  if (requestedCurrencies.length === 1) {
    return fetchUsageForCurrency(apiKey, requestedCurrencies[0], { days, limit, maxPages });
  }

  const allUsage = [];
  let totalRecords = 0;
  let firstError = null;

  for (let i = 0; i < requestedCurrencies.length; i++) {
    if (i > 0) {
      await new Promise(r => setTimeout(r, MULTI_CURRENCY_DELAY_MS));
    }
    const result = await fetchUsageForCurrency(apiKey, requestedCurrencies[i], { days, limit, maxPages });
    allUsage.push(...result.usage);
    if (result.totalRecords != null) {
      totalRecords += result.totalRecords;
    }
    if (result.error && !firstError) {
      firstError = result.error;
    }
  }

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

export function aggregateUsage(usage = []) {
  const perModel = new Map();
  const perDay = new Map();
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

    if (isUsd) {
      totalCostUsd += amount;
    } else {
      totalCostDiem += amount;
    }
    totalTokens += tokens;
    totalRequests += 1;

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
      modelEntry.tokens += tokens;
    }
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
