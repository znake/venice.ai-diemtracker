export async function fetchBalance(apiKey) {
  try {
    const response = await fetch("https://api.venice.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { usd: null, diem: null, vcu: null, error: "Invalid API Key" };
    }

    if (response.status === 429) {
      return { usd: null, diem: null, vcu: null, error: "Rate limit exceeded" };
    }

    // 304 Not Modified is technically not "ok" but is a valid response
    if (!response.ok && response.status !== 304) {
      return { usd: null, diem: null, vcu: null, error: `HTTP error! status: ${response.status}` };
    }

    const usd = response.headers.get("x-venice-balance-usd");
    const diem = response.headers.get("x-venice-balance-diem");
    const vcu = response.headers.get("x-venice-balance-vcu");

    return { usd, diem, vcu, error: null };
  } catch {
    return { usd: null, diem: null, vcu: null, error: "Network error" };
  }
}
