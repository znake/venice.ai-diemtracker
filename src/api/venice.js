export async function fetchBalance(apiKey) {
  try {
    const response = await fetch("https://api.venice.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (response.status === 401) {
      return { usd: null, diem: null, vcu: null, error: "Invalid API Key" };
    }

    if (response.status === 429) {
      return { usd: null, diem: null, vcu: null, error: "Rate limit exceeded" };
    }

    if (!response.ok) {
      return { usd: null, diem: null, vcu: null, error: `HTTP error! status: ${response.status}` };
    }

    const usd = response.headers.get("x-venice-balance-usd");
    const diem = response.headers.get("x-venice-balance-diem");
    const vcu = response.headers.get("x-venice-balance-vcu");

    return { usd, diem, vcu, error: null };
  } catch (err) {
    return { usd: null, diem: null, vcu: null, error: "Network error" };
  }
}
