# Upstox MCP Server

An MCP (Model Context Protocol) server that exposes the [Upstox API v2](https://upstox.com/developer/api-documentation/open-api)
as tools, so Claude can check your profile, positions, holdings, funds, and market quotes,
and place/cancel orders on your behalf — with your explicit approval on every call.

**Claude never sees or handles your Upstox password.** Login happens in your own browser
against Upstox's own login page (including your 2FA/TOTP/PIN); this server only ever
receives the short-lived authorization `code` Upstox redirects back with, exchanges it for
an access token, and stores that token locally.

## 1. Create an Upstox developer app (one-time, must be done by you)

1. Go to https://developer.upstox.com and sign in with your Upstox account.
2. Create a new app. You'll need to supply a **Redirect URI** — for local/manual use,
   something like `http://localhost:3000/callback` works fine even though nothing is
   listening there; you'll just copy the `code` param out of the browser's address bar
   after redirect.
3. Note the app's **API Key** (client ID) and **API Secret** (client secret).

## 2. Configure credentials

```bash
cp .env.example .env
# edit .env and fill in UPSTOX_API_KEY, UPSTOX_API_SECRET, UPSTOX_REDIRECT_URI
```

These are read from environment variables (`UPSTOX_API_KEY`, `UPSTOX_API_SECRET`,
`UPSTOX_REDIRECT_URI`), so however you run the server (Claude Code's MCP config, a
shell, a process manager) needs them set — see step 4.

## 3. Install and build

```bash
npm install
npm run build
```

## 4. Register the server with Claude Code

Add it as an MCP server, e.g. in your Claude Code MCP config:

```json
{
  "mcpServers": {
    "upstox": {
      "command": "node",
      "args": ["/absolute/path/to/upstox-mcp-server/dist/index.js"],
      "env": {
        "UPSTOX_API_KEY": "your_client_id",
        "UPSTOX_API_SECRET": "your_client_secret",
        "UPSTOX_REDIRECT_URI": "http://localhost:3000/callback"
      }
    }
  }
}
```

(Or run `claude mcp add upstox -- node /absolute/path/to/upstox-mcp-server/dist/index.js`
with the same env vars.)

## 5. Log in (do this every day — Upstox tokens expire daily)

Once the server is registered, in a Claude conversation:

1. Ask Claude to call **`upstox_get_login_url`**. It returns an Upstox login URL.
2. Open that URL in your own browser, log in with your Upstox credentials/TOTP, and
   approve access.
3. Upstox redirects you to your configured redirect URI with a `?code=...` query
   parameter. Copy that `code` value out of the address bar (the page itself doesn't
   need to load anything).
4. Ask Claude to call **`upstox_exchange_code`** with that code. The access token is
   exchanged and stored locally in `.upstox-token.json` (gitignored, not committed).

After that, all other tools (positions, holdings, quotes, place/cancel order, etc.)
will work until the token expires (Upstox tokens expire daily around 3:30 AM IST —
repeat this login flow each trading day).

## Available tools

| Tool | Description |
|---|---|
| `upstox_get_login_url` | Get the OAuth login URL to open in your browser |
| `upstox_exchange_code` | Exchange the redirect `code` for an access token |
| `upstox_get_profile` | Get user profile |
| `upstox_get_funds_and_margin` | Get available funds/margin |
| `upstox_get_positions` | Get short-term/intraday positions |
| `upstox_get_holdings` | Get long-term holdings |
| `upstox_get_order_book` | Get all orders for the day |
| `upstox_get_order_details` | Get details/status for one order |
| `upstox_get_trade_book` | Get executed trades for the day |
| `upstox_get_market_quote` | Get full market quote for instrument key(s) |
| `upstox_get_ltp` | Get last traded price for instrument key(s) |
| `upstox_place_order` | Place a live order (real money) |
| `upstox_cancel_order` | Cancel an open order |

## Security notes

- The access token is stored in plaintext at `.upstox-token.json` in this directory
  (mode `0600`). It's gitignored — never commit it.
- `upstox_place_order` places **real, live orders**. Review quantity, price, and
  transaction type carefully before approving any such tool call.
- Treat `UPSTOX_API_SECRET` and the stored access token like passwords.
