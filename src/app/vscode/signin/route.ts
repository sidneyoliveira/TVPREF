import { NextRequest, NextResponse } from 'next/server';

type OAuthLikeParams = Record<string, string | undefined>;

function buildCallbackUrl(callbackUrl: string, params: OAuthLikeParams): string {
  // callbackUrl is expected to be a custom scheme deep link (e.g. vscode://.../auth)
  // and may already contain query params. We append/merge safely.
  const hasQuery = callbackUrl.includes('?');
  const search = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      if (typeof v === 'string' && v.length > 0) acc[k] = v;
      return acc;
    }, {}),
  );

  if ([...search.keys()].length === 0) return callbackUrl;

  return `${callbackUrl}${hasQuery ? '&' : '?'}${search.toString()}`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callback_url');

  if (!callbackUrl) {
    // Helpful for debugging misconfigured callback links.
    return NextResponse.json(
      { ok: false, error: 'Missing callback_url query param', received: Object.fromEntries(url.searchParams.entries()) },
      { status: 400 },
    );
  }

  const oauthParams: OAuthLikeParams = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (k === 'callback_url') continue;
    oauthParams[k] = v;
  }

  const redirectTo = buildCallbackUrl(callbackUrl, oauthParams);

  // Sixth/VSC extension expects the deep link to be opened.
  return NextResponse.redirect(redirectTo);
}

export async function POST(request: NextRequest) {
  // Some providers POST during sign-in. We support both query-string and JSON body.
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callback_url');

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const oauthParams: OAuthLikeParams = {};

  for (const [k, v] of url.searchParams.entries()) {
    if (k === 'callback_url') continue;
    oauthParams[k] = v;
  }

  for (const [k, v] of Object.entries(body)) {
    if (typeof v === 'string') oauthParams[k] = v;
  }

  if (!callbackUrl) {
    return NextResponse.json(
      { ok: false, error: 'Missing callback_url query param', received: { query: Object.fromEntries(url.searchParams.entries()), body } },
      { status: 400 },
    );
  }

  const redirectTo = buildCallbackUrl(callbackUrl, oauthParams);
  return NextResponse.redirect(redirectTo);
}
