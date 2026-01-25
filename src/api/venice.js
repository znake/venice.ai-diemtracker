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
      return { usd: null, diem: null, vcu: null, error: "Invalid API Key" };
    }

    if (response.status === 429) {
      return { usd: null, diem: null, vcu: null, error: "Rate limit exceeded" };
    }

    if (!response.ok) {
      return { usd: null, diem: null, vcu: null, error: `HTTP error! status: ${response.status}` };
    }

    const json = await response.json();
    const balances = json?.data?.balances;

    if (!balances) {
      return { usd: null, diem: null, vcu: null, error: "No balance data in response" };
    }

    const formatBalance = (val) => val != null ? Number(val).toFixed(2) : null;

    return {
      usd: formatBalance(balances.USD),
      diem: formatBalance(balances.DIEM),
      vcu: formatBalance(balances.VCU),
      error: null,
    };
  } catch {
    return { usd: null, diem: null, vcu: null, error: "Network error" };
  }
}
