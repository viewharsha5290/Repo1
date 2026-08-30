import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buildLoginUrl, exchangeCodeForToken } from "./auth.js";
import { upstox } from "./upstoxClient.js";

const server = new McpServer({
  name: "upstox-mcp-server",
  version: "0.1.0",
});

function text(content: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof content === "string" ? content : JSON.stringify(content, null, 2),
      },
    ],
  };
}

function errorResult(err: unknown) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: err instanceof Error ? err.message : String(err),
      },
    ],
  };
}

server.registerTool(
  "upstox_get_login_url",
  {
    title: "Get Upstox login URL",
    description:
      "Generates the Upstox OAuth authorization URL. Open it in your own browser, log in with your " +
      "Upstox credentials/TOTP, and approve access. Upstox will redirect you to your configured " +
      "redirect URI with a `code` query parameter — pass that code to upstox_exchange_code next. " +
      "This tool never sees or handles your Upstox password.",
    inputSchema: {},
  },
  async () => {
    try {
      const url = buildLoginUrl();
      return text(
        `Open this URL in your browser and log in to Upstox:\n\n${url}\n\n` +
          `After approving, you'll be redirected to your redirect URI with a "code" query parameter. ` +
          `Copy that code and call upstox_exchange_code with it.`
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_exchange_code",
  {
    title: "Exchange Upstox authorization code for access token",
    description:
      "Exchanges the OAuth authorization code (obtained after you log in via upstox_get_login_url) " +
      "for an access token, and stores it locally for subsequent Upstox tool calls. Upstox access " +
      "tokens expire daily (around 3:30 AM IST) — you'll need to repeat the login flow each day.",
    inputSchema: {
      code: z.string().describe("The authorization code from the redirect URI"),
    },
  },
  async ({ code }) => {
    try {
      const result = await exchangeCodeForToken(code);
      return text(
        `Login successful. Access token stored locally.\nUser: ${result.user_name ?? "unknown"} (${
          result.email ?? "n/a"
        })`
      );
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_get_profile",
  {
    title: "Get Upstox profile",
    description: "Fetches the logged-in user's Upstox profile.",
    inputSchema: {},
  },
  async () => {
    try {
      return text(await upstox.getProfile());
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_get_funds_and_margin",
  {
    title: "Get Upstox funds and margin",
    description: "Fetches available funds and margin. Optionally scope to a segment (SEC or COM).",
    inputSchema: {
      segment: z.enum(["SEC", "COM"]).optional(),
    },
  },
  async ({ segment }) => {
    try {
      return text(await upstox.getFundsAndMargin(segment));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_get_positions",
  {
    title: "Get Upstox short-term positions",
    description: "Fetches current intraday/short-term positions.",
    inputSchema: {},
  },
  async () => {
    try {
      return text(await upstox.getPositions());
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_get_holdings",
  {
    title: "Get Upstox long-term holdings",
    description: "Fetches current long-term equity holdings.",
    inputSchema: {},
  },
  async () => {
    try {
      return text(await upstox.getHoldings());
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_get_order_book",
  {
    title: "Get Upstox order book",
    description: "Fetches all orders placed today.",
    inputSchema: {},
  },
  async () => {
    try {
      return text(await upstox.getOrderBook());
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_get_order_details",
  {
    title: "Get Upstox order details",
    description: "Fetches details/status for a specific order id.",
    inputSchema: {
      order_id: z.string(),
    },
  },
  async ({ order_id }) => {
    try {
      return text(await upstox.getOrderDetails(order_id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_get_trade_book",
  {
    title: "Get Upstox trade book",
    description: "Fetches all executed trades for the day.",
    inputSchema: {},
  },
  async () => {
    try {
      return text(await upstox.getTradeBook());
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_get_market_quote",
  {
    title: "Get Upstox market quote",
    description:
      "Fetches full market quotes (OHLC, depth, etc.) for one or more instrument keys, " +
      'e.g. "NSE_EQ|INE848E01016".',
    inputSchema: {
      instrument_keys: z.array(z.string()).min(1),
    },
  },
  async ({ instrument_keys }) => {
    try {
      return text(await upstox.getMarketQuote(instrument_keys));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_get_ltp",
  {
    title: "Get Upstox last traded price",
    description: "Fetches the last traded price for one or more instrument keys.",
    inputSchema: {
      instrument_keys: z.array(z.string()).min(1),
    },
  },
  async ({ instrument_keys }) => {
    try {
      return text(await upstox.getLtp(instrument_keys));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_place_order",
  {
    title: "Place an Upstox order",
    description:
      "Places a live order on Upstox. This uses real money — double-check quantity, price, and " +
      "transaction_type before calling. Requires a valid stored access token.",
    inputSchema: {
      instrument_token: z.string().describe('Instrument key, e.g. "NSE_EQ|INE848E01016"'),
      quantity: z.number().int().positive(),
      product: z.enum(["D", "I", "CO", "MTF"]).describe("D=Delivery, I=Intraday, CO=Cover, MTF=Margin trading"),
      validity: z.enum(["DAY", "IOC"]),
      price: z.number().nonnegative().describe("0 for market orders"),
      order_type: z.enum(["MARKET", "LIMIT", "SL", "SL-M"]),
      transaction_type: z.enum(["BUY", "SELL"]),
      disclosed_quantity: z.number().int().nonnegative().optional(),
      trigger_price: z.number().nonnegative().optional(),
      is_amo: z.boolean().optional(),
      tag: z.string().optional(),
    },
  },
  async (order) => {
    try {
      return text(await upstox.placeOrder(order));
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.registerTool(
  "upstox_cancel_order",
  {
    title: "Cancel an Upstox order",
    description: "Cancels an open order by order id.",
    inputSchema: {
      order_id: z.string(),
    },
  },
  async ({ order_id }) => {
    try {
      return text(await upstox.cancelOrder(order_id));
    } catch (err) {
      return errorResult(err);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting upstox-mcp-server:", err);
  process.exit(1);
});
