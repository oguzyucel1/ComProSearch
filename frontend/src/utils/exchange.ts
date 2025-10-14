const CACHE_KEY = "exchange_try_usd";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function getTryToUsdRate(): Promise<number | null> {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    const now = Date.now();
    if (cached && cached.rate && cached.ts && now - cached.ts < CACHE_TTL) {
      return cached.rate;
    }

    // Try multiple free APIs in order
    const apis = [
      // 1. Frankfurter (free, no key, maintained by ECB)
      async () => {
        const res = await fetch("https://api.frankfurter.app/latest?from=TRY&to=USD");
        if (!res.ok) return null;
        const data = await res.json();
        return data?.rates?.USD ? Number(data.rates.USD) : null;
      },
      // 2. ExchangeRate-API (free tier, no key needed for basic)
      async () => {
        const res = await fetch("https://open.er-api.com/v6/latest/TRY");
        if (!res.ok) return null;
        const data = await res.json();
        return data?.rates?.USD ? Number(data.rates.USD) : null;
      },
      // 3. Fallback: use approximate rate (1 USD ≈ 32-34 TRY as of Oct 2024)
      async () => {
        // This is a fallback static rate, not ideal but better than nothing
        return 0.031; // approximately 1 TRY = 0.031 USD
      }
    ];

    // Try each API in sequence until one works
    for (const apiFn of apis) {
      try {
        const rate = await apiFn();
        if (rate && rate > 0) {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, ts: now }));
          return rate;
        }
      } catch (e) {
        console.warn("Exchange API attempt failed:", e);
        continue;
      }
    }

    return null;
  } catch (e) {
    console.error("Exchange rate fetch error:", e);
    return null;
  }
}
