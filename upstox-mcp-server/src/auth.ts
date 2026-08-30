import {
  UPSTOX_AUTH_DIALOG_URL,
  UPSTOX_TOKEN_URL,
  getClientId,
  getClientSecret,
  getRedirectUri,
  writeStoredToken,
} from "./config.js";

export function buildLoginUrl(state?: string): string {
  const url = new URL(UPSTOX_AUTH_DIALOG_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getClientId());
  url.searchParams.set("redirect_uri", getRedirectUri());
  if (state) url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  email?: string;
  user_name?: string;
  user_type?: string;
}> {
  const body = new URLSearchParams({
    code,
    client_id: getClientId(),
    client_secret: getClientSecret(),
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });

  const res = await fetch(UPSTOX_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      `Failed to exchange code for token (${res.status}): ${JSON.stringify(json)}`
    );
  }
  if (!json.access_token) {
    throw new Error(`No access_token in response: ${JSON.stringify(json)}`);
  }

  writeStoredToken(json.access_token);
  return json;
}
