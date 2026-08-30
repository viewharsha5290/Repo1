import { UPSTOX_API_BASE, readStoredToken } from "./config.js";

export class UpstoxAuthError extends Error {}

function requireToken(): string {
  const token = readStoredToken();
  if (!token) {
    throw new UpstoxAuthError(
      "No Upstox access token found. Call upstox_get_login_url, complete login in your browser, " +
        "then call upstox_exchange_code with the resulting authorization code."
    );
  }
  return token;
}

async function request<T = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  options: { query?: Record<string, string | undefined>; body?: unknown } = {}
): Promise<T> {
  const token = requireToken();
  const url = new URL(UPSTOX_API_BASE + path);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      `Upstox API error ${res.status} ${res.statusText}: ${JSON.stringify(json)}`
    );
  }
  return json as T;
}

export const upstox = {
  getProfile: () => request("GET", "/user/profile"),
  getFundsAndMargin: (segment?: "SEC" | "COM") =>
    request("GET", "/user/get-funds-and-margin", { query: { segment } }),
  getPositions: () => request("GET", "/portfolio/short-term-positions"),
  getHoldings: () => request("GET", "/portfolio/long-term-holdings"),
  getOrderBook: () => request("GET", "/order/retrieve-all"),
  getOrderDetails: (orderId: string) =>
    request("GET", "/order/details", { query: { order_id: orderId } }),
  getTradeBook: () => request("GET", "/order/trades/get-trades-for-day"),
  getMarketQuote: (instrumentKeys: string[]) =>
    request("GET", "/market-quote/quotes", {
      query: { instrument_key: instrumentKeys.join(",") },
    }),
  getLtp: (instrumentKeys: string[]) =>
    request("GET", "/market-quote/ltp", {
      query: { instrument_key: instrumentKeys.join(",") },
    }),
  placeOrder: (order: {
    quantity: number;
    product: "D" | "I" | "CO" | "MTF";
    validity: "DAY" | "IOC";
    price: number;
    tag?: string;
    instrument_token: string;
    order_type: "MARKET" | "LIMIT" | "SL" | "SL-M";
    transaction_type: "BUY" | "SELL";
    disclosed_quantity?: number;
    trigger_price?: number;
    is_amo?: boolean;
  }) => request("POST", "/order/place", { body: order }),
  cancelOrder: (orderId: string) =>
    request("DELETE", "/order/cancel", { query: { order_id: orderId } }),
};
