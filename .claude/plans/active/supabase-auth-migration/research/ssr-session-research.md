# Research: Supabase Auth sessions in Next.js App Router

> Phase-1 report produced on 2026-09-16 while preparing `../PLAN.md`. It reflects branch `test` at `fcee862` and read-only queries on the TEST project. Where it disagrees with `../PLAN.md`, the plan wins.

Scope: official `@supabase/ssr` patterns and the Supabase Auth, Next.js and Vercel docs, checked against the installed packages in `node_modules`, the npm registry, and read-only SELECTs on the TEST project. No files were edited and no DDL or DML was run. Repo citations use `file:line`.

---

## 0. Baseline and versions (verified)

| Item | Installed / repo | Latest (npm, 2026-09-16) | Notes |
|---|---|---|---|
| `@supabase/ssr` | 0.5.2 (`package.json:59`) | **0.12.7** (peer `@supabase/supabase-js ^2.114.0`) | 0.10.0 added a 2nd `headers` arg to `setAll`. 0.8.1 added lazy init (`skipAutoInitialize`). 0.12.x "full rewrite", dedupes cookie writes and flushes PKCE verifier removals. |
| `@supabase/supabase-js` / `auth-js` | 2.105.3 | **2.116.0** | `getClaims()` exists in 2.105.3, but an expired explicit JWT **throws** a plain `Error` (`node_modules/@supabase/auth-js/dist/main/lib/helpers.js:293-300`). Fixed in 2.107.0 (supabase-js PR #2395). |
| `next` | 15.5.16 | 16.3.5 (latest), 15.5.25 (`backport`) | Next 16 renamed `middleware.ts` to **`proxy.ts`** (function `proxy`, always Node runtime). Codemod: `npx @next/codemod@canary middleware-to-proxy .` |
| Env keys | `.env.local` has `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…` (value redacted) | – | Already on the **new** publishable key. There is no secret key in the app yet. |
| TEST JWKS | `https://imhinsgyzzyblghwnedk.supabase.co/auth/v1/.well-known/jwks.json` publishes one **EC P-256 / ES256** key (kid `a3b5f3ec-…`) | – | JWKS also lists *standby* keys. Confirm in Dashboard > JWT Keys that ES256 is **in use**. If it is, `getClaims()` verifies locally. |
| TEST DB | Postgres **17.6**, `auth.users` = 0 rows, `public.users` = 3 rows | – | `supabase/config.toml:16` says `major_version = 15`, which does not match. |

The upgrade path for everything below is `@supabase/ssr@^0.12.7` plus `@supabase/supabase-js@^2.116.0`. Under 0.5.2, a `setAll(cookies, headers)` with two parameters will not type-check, because 0.5.2's `SetAllCookies` takes one parameter (`node_modules/@supabase/ssr/dist/main/types.d.ts`).

---

## 1. Official `@supabase/ssr` setup

### 1.1 What the repo has today
- `utils/supabase/server.ts:1` starts with **`"use server"`**. That turns `createClient` into a Server Function (reachable by POST if a client bundle ever references it). It is a helper, not an action, so use `import "server-only"` instead.
- `utils/supabase/server.ts:4-18` is a cookie-less branch (`getAll: []`). Lines 21-44 are the official cookie branch: `setAll` wrapped in try/catch, comment "called from a Server Component".
- All **7 call sites** use the cookie branch (none pass `false`):
  - `app/api/items/route.ts:11`
  - `app/api/items/[name]/route.ts:11`
  - `app/api/dashboard/analytics/route.ts:8`
  - `app/api/clerk/route.ts:51`
  - `utils/paddle/process-webhook.ts:62` and `:217`
  - `lib/users/fetchUserData.ts:53`

  With no Supabase session cookie present, they all run as `anon` today.

### 1.2 `utils/supabase/server.ts` (target shape)
Official source: `supabase/supabase` `examples/auth/nextjs/lib/supabase/server.ts`.

```ts
// utils/supabase/server.ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Request-scoped, cookie-bound client. Postgres role = `authenticated` when a
 * valid session cookie is present, otherwise `anon`. Calling this opts the
 * route into dynamic rendering (cookies()). Create one per request; never
 * store it at module scope (Vercel Fluid compute reuses instances).
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet /*, headers: cache headers, only applicable where you own the Response */) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Thrown when called during Server Component render (cookies are
          // read-only there). Safe ONLY because middleware.ts refreshed the
          // session before render.
        }
      },
    },
  });
}

/**
 * Cookie-less anon client for PUBLIC data (catalogue pages, /api/items).
 * Never reads or writes the session, so it cannot make a route dynamic,
 * cannot emit Set-Cookie, and always runs as `anon` under RLS.
 */
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
```

### 1.3 Browser client

```ts
// utils/supabase/client.ts
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // In a browser this returns a module singleton
  // (createBrowserClient.js: isSingleton defaults to true when isBrowser()).
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

The browser client uses `document.cookie` and has `autoRefreshToken` and `detectSessionInUrl` on. It is PKCE-only: `flowType: "pkce"` is forced in both factories.

### 1.4 Middleware `updateSession` (Next 15, `middleware.ts`)
Official source: `examples/auth/nextjs/lib/supabase/proxy.ts` (fetched raw). Adapted for this repo: the redirect applies **only** to `/admin`, because the official sample redirects *every* non-`/login`/`/auth` path, which would lock out `/catalogues/*`. The login page stays `/auth`, matching `signInUrl="/auth"` at `components/wrappers/PageWrapperClient.tsx:18`.

```ts
// utils/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/admin"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // 1) make refreshed tokens visible to Server Components of THIS request
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          // 2) send refreshed tokens to the browser
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          // 3) ssr >= 0.10: Cache-Control/Expires/Pragma so no CDN caches Set-Cookie
          for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!claims && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie); // keep cookie changes
    return redirect;
  }
  return response; // must return THIS object (or copy its cookies)
}
```

```ts
// middleware.ts  (Next 15). On Next 16: rename to proxy.ts and `export async function proxy`.
import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // skip static assets, the PostHog proxy (next.config.ts:55-69) and server-to-server webhooks
    "/((?!_next/static|_next/image|favicon.ico|ingest|api/paddle|api/clerk|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|webmanifest)$).*)",
  ],
};
```

This replaces `middleware.ts:1-14`: `clerkMiddleware` plus `auth.protect()` on `/admin(.*)`, with a matcher that includes `/(api|trpc)(.*)`.

Next 15 middleware runs on Edge by default. Node runtime has been stable since 15.5.0. `getClaims()` needs only WebCrypto, so both runtimes work. Next 16 proxy is Node-only.

### 1.5 Cookie names and format (verified in source)
- **Storage key:** `sb-<first label of the Supabase URL hostname>-auth-token` (`node_modules/@supabase/supabase-js/dist/index.cjs:369`).
  - TEST: `sb-imhinsgyzzyblghwnedk-auth-token`
  - PROD: `sb-uhfbapjuzvlyzyodxhqn-auth-token`
  - Local CLI (`http://127.0.0.1:54321`): **`sb-127-auth-token`**
  - With a custom domain such as `api.quicktalog.app`, the name becomes `sb-api-auth-token`.
- **Value:** `base64-` + base64url(JSON session) by default (`cookieEncoding: "base64url"`, `BASE64_PREFIX = "base64-"` in `ssr/src/cookies.ts`). A value that fails base64url or JSON decoding is treated as absent (0.10.3+).
- **Chunking:** if the URI-encoded value exceeds `MAX_CHUNK_SIZE = 3180` (`node_modules/@supabase/ssr/dist/main/utils/chunker.js:4`), it is split into `…-auth-token.0`, `.1`, …. Readers try the unsuffixed name first, then `.0..n`.
- **PKCE verifier:** `sb-<ref>-auth-token-code-verifier`. The server client writes it immediately on `setItem` (`cookies.ts`). The optional experimental per-flow slots are `-flow-<id>-code-verifier`.
- **Contents:** access token (JWT), refresh token, expiry, and the user object. The experimental `cookies.encode: "tokens-only"` shrinks the cookie by keeping the user object out, but then `getSession().user` is unavailable. Keep this setting identical in the browser and server clients.

### 1.6 Cookie options, httpOnly, SameSite, Secure, maxAge
Defaults are `{ path: "/", sameSite: "lax", httpOnly: false, maxAge: 400 days }` (`ssr/src/utils/constants.ts`; same in 0.5.2 `dist/main/utils/constants.js`). **No `Secure` and no `Domain`**, so the cookie is host-only. Override with `cookieOptions` and keep it identical in the server, middleware and browser clients.

**Why not HttpOnly.** Supabase's position (advanced guide FAQ): "This is not necessary. Both the access token and refresh token are designed to be passed around… The browser-based side of your application needs access to the refresh token." The sessions guide adds that HttpOnly works only for server-only apps.

**Security delta vs Clerk.** Clerk's long-lived `__client` cookie is HttpOnly on the FAPI domain, and its `__session` cookie is JS-readable but lives only 60s (Clerk docs). Supabase puts the **refresh token**, a session-long credential, into a **JS-readable** cookie. Any XSS, or any third-party script, can steal the whole session.

**Is it acceptable?** Yes, if XSS is treated as account takeover:
- Keep `sandbox="allow-scripts"` **without** `allow-same-origin` on author custom code (`components/catalogue/sections/CustomCode.tsx:201-202`). That opaque origin is now load-bearing.
- Treat Google Tag Manager and Clarity (root `app/layout.tsx:45-46`) and PostHog as privileged code that can read `document.cookie`.
- Consider a CSP.
- Pro plan and above can bound stolen sessions with time-box, inactivity timeout and single-session limits.
- Refresh-token reuse detection protects against a leaked token that is reused after the legitimate one. The docs say it "does not guard against the case where a user's session is stolen from their device".

**SameSite / Secure.** Supabase recommends `Lax` and notes that `Secure` can be a problem on localhost. Passing `cookieOptions: { secure: process.env.NODE_ENV === "production" }` to all three clients is optional hardening.

**maxAge.** Supabase recommends against short `Max-Age`, because the session lifetime lives on the server: "setting a short Max-Age… only results in a degraded user experience".

### 1.7 Refresh token rotation and reuse interval
- Refresh tokens never expire but are **single-use**. A reuse is tolerated when it comes (a) within the reuse interval (**default 10s**, "we do not recommend changing this value", meant for SSR) or (b) from the *parent* of the active token.
- Any other reuse revokes the whole session.
- Local config: `supabase/config.toml:25-27` (`jwt_expiry = 3600`, `enable_refresh_token_rotation = true`, `refresh_token_reuse_interval = 10`).
- Recommended JWT expiry is 1h. Do not go below 5 min.
- ssr README: two concurrent requests with the same expired cookie mean the second refresh fails. Middleware mitigates this for navigations. Parallel `fetch()` calls must tolerate a `null` session.

### 1.8 What happens when `setAll` runs from a Server Component
- Next forbids setting cookies during render: "Setting cookies is not supported during Server Component rendering" (cookies API docs).
- `cookieStore.set` throws. The try/catch swallows it, so a refresh done during render is **not persisted**. The browser keeps the old refresh token and the next request refreshes again, relying on the 10s reuse or parent-token exception.
- That is the source of the documented "random logouts". The fix is that middleware must call `getClaims()` first for every route that renders session-dependent server code, and pass the refreshed cookie forward via `request.cookies.set` so Server Components never need to refresh.
- ssr types note: the cache headers are delivered **once per server client** (the `hasSentHeaders` guard in `cookies.ts`), which is another reason to create a client per request.

---

## 2. `getClaims()` vs `getUser()` vs `getSession()`, signing keys, API keys

| Method | Network | Trust on server | Use for |
|---|---|---|---|
| `getClaims()` | **None** with an asymmetric key (JWKS cached). A `getUser` round-trip with HS256. | **Yes**: signature and `exp` verified | Page/action/route protection, getting `sub` |
| `getUser()` | Always calls the Auth server | **Yes**, and it reflects deletion, bans and sign-out | Sensitive ops (delete account, billing, email/password change) |
| `getSession()` | None (reads cookie, may refresh) | **No**: "must not be trusted" from cookies | Getting raw `access_token` to forward |

`getClaims` internals (installed `auth-js/dist/main/GoTrueClient.js:4821-4884`):
1. Without an explicit JWT it calls `getSession()`, which refreshes if the token is near expiry. That is why middleware calls it.
2. It decodes the JWT and runs `validateExp`.
3. If `alg` starts with `HS`, or there is no `kid`, or there is no WebCrypto, it calls **`getUser(token)`**, a network call.
4. Otherwise it calls `fetchJwk(kid)`: `GET {url}/auth/v1/.well-known/jwks.json`, cached in a module-global `GLOBAL_JWKS` keyed by storage key for `JWKS_TTL = 10 min` (`lib/constants.js:30`). Supabase's edge also caches the endpoint for 10 min.
5. It then runs `crypto.subtle.verify`.

Caveat from Supabase docs: getClaims "doesn't verify with the auth server whether the session is still valid or if the user has logged out". A deleted, banned or globally signed-out user keeps passing until `exp`, which is ≤1h here. For those operations use `getUser()`, or check the `session_id` claim against `auth.sessions`.

Returned claims (`JwtPayload`, types.d.ts:1633-1668): `iss, sub, aud, exp, iat, role, aal, session_id`, plus optional `email, phone, is_anonymous, app_metadata, user_metadata, amr`. The return type also includes `{ data: null, error: null }` when there is no session.

Minimum versions:
- A Supabase maintainer comment (supabase/ssr#120) says getClaims needs "at least supabase-js v2.49.2" (not in official docs).
- Non-experimental plus the global JWKS cache arrived in auth-js#1078.
- Use **≥2.107.0** for the expired-JWT error-shape fix, and ≥2.114.0 for ssr 0.12.7.

### 2.1 Migrating from legacy HS256 to signing keys (docs: auth/signing-keys)
1. Dashboard > JWT signing keys > **Migrate JWT secret**. This imports the legacy secret and creates a standby asymmetric key. TEST already publishes ES256, so check its state there.
2. Make sure nothing verifies JWTs with the legacy secret. The app has no `jose`/`jsonwebtoken` usage in `app lib utils actions` (grep). Edge Functions with "Verify JWT" need to be switched off.
3. **Rotate keys**. New tokens are signed ES256, old unexpired ones remain valid, and nobody is signed out.
4. Wait ≥ `jwt_expiry + 15 min` (1h15m here) before **revoking** the legacy secret.
5. Revoking the legacy secret **requires disabling `anon` and `service_role` keys first**, because they are JWTs signed with it. Impact here:
   - The sibling Cloudflare worker (`../quicktalog-backend`, service_role via supabase-js) must move to `sb_secret_…` first.
   - The TEST DB trigger function `public.call_edge_function_with_vault_secret()` reads Vault secret `service_role_key` and sends it as `Authorization: Bearer` to **PROD** edge functions (`https://uhfbapjuzvlyzyodxhqn.supabase.co/functions/v1/…`, verified via SELECT on TEST). That breaks when legacy keys are disabled. Also, `sb_secret_` keys are not JWTs, so functions must use the `@supabase/server` SDK or `verify_jwt=false`.
6. Key state changes are throttled about 5 min. JWKS cache clears within about 20 min.

### 2.2 New API keys vs legacy
- `sb_publishable_…` replaces `anon`. `sb_secret_…` replaces `service_role`. Legacy keys are "deprecat[ed] by the end of 2026". Both systems work side by side.
- Mapping to Postgres roles:

  | Key | User signed in? | Role |
  |---|---|---|
  | publishable | no | `anon` |
  | publishable | yes (user JWT in `Authorization`) | `authenticated` |
  | secret | n/a | `service_role` (BYPASSRLS) |

- The API Gateway checks the `apikey` header against the key list and "mints a temporary, short-lived JWT" that it forwards to PostgREST, Storage and so on.
- Send new keys in `apikey`, not `Authorization: Bearer`. They are not JWTs.
- **Secret keys are refused from browsers**: "Supabase matches on the `User-Agent` header and returns HTTP 401". Server-side `fetch` in Node or Workers is fine.
- Grants are evaluated before RLS. A missing grant is a permission error; a policy that matches nothing returns an empty result. The lockdown migration granted `authenticated` nothing, so grants for `authenticated` must be added alongside policies.
- Env naming: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` plus server-only `SUPABASE_SECRET_KEY`. Never prefix the secret with `NEXT_PUBLIC_`.

---

## 3. Auth flows in App Router

### 3.1 PKCE basics
- The code is valid **5 minutes**, is single-use, and must be exchanged **in the same browser**, because the verifier lives in that browser's cookie.
- PKCE applies to `signInWithOtp`, `signInWithOAuth`, `signUp` and `resetPasswordForEmail`.
- Email links should use **`token_hash` + `verifyOtp`**, which needs no verifier and works cross-device, rather than `?code=` + `exchangeCodeForSession`.

### 3.2 Shared helpers

```ts
// lib/auth/redirects.ts
import "server-only";
import { headers } from "next/headers";

/** Only same-origin relative paths. Rejects `//evil.com` and `/\evil.com`. */
export function safeNext(raw: string | null | undefined, fallback = "/admin/dashboard") {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

/** Origin for emailRedirectTo/redirectTo. Server Actions already enforce Origin === Host. */
export async function getRequestOrigin() {
  const h = await headers();
  return h.get("origin") ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}
```

Supabase still enforces its redirect allow-list; a non-listed URL is replaced by the Site URL (inferred behaviour).

### 3.3 Server actions: password, sign-up, Google, sign-out, reset, update

```ts
// actions/auth.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getRequestOrigin, safeNext } from "@/lib/auth/redirects";
import { requireUserForAction } from "@/lib/auth/session";

export type AuthState = { error?: string; message?: string } | undefined;

export async function signInWithPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password." }; // do not leak which one
  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next") as string | null)); // never inside try/catch
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const origin = await getRequestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin,              // template uses {{ .RedirectTo }}/auth/confirm?...
      data: { full_name: String(formData.get("name") ?? "") }, // -> raw_user_meta_data (user-writable, untrusted)
    },
  });
  if (error) return { error: error.message };
  return { message: "Check your email to confirm your account." }; // enable_confirmations = true
}

export async function signInWithGoogle(formData: FormData) {
  const origin = await getRequestOrigin();
  const next = safeNext(formData.get("next") as string | null);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  // The PKCE verifier cookie was already written via setAll (server action can set cookies).
  if (error || !data.url) redirect("/auth?error=oauth");
  redirect(data.url);
}

export async function signOut(formData?: FormData) {
  const everywhere = formData?.get("scope") === "global";
  const supabase = await createClient();
  // JS default is 'global' (GoTrueClient.js:3176), which revokes ALL devices' refresh tokens.
  await supabase.auth.signOut({ scope: everywhere ? "global" : "local" });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const origin = await getRequestOrigin();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: origin }); // never reveals existence
  return { message: "If that address has an account, a reset link is on its way." };
}

export async function updatePassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const { supabase } = await requireUserForAction();
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.updateUser({ password }); // USER_UPDATED -> setAll persists cookies
  // Optionally require current_password (supabase-js >= 2.102.0) when not in a recovery session.
  if (error) return { error: error.message };
  await supabase.auth.signOut({ scope: "others" }); // kill other devices after a password change
  redirect("/admin/dashboard");
}

export async function updateEmail(_: AuthState, formData: FormData): Promise<AuthState> {
  const { supabase } = await requireUserForAction();
  const origin = await getRequestOrigin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: origin });
  if (error) return { error: error.message };
  return { message: "Confirm the change from your inbox." }; // template type=email_change
}
```

### 3.4 `/auth/callback` (OAuth code exchange)
Based on the docs' Next.js tab (Sign in with Google page), with a stricter `next` check. The docs version only checks `startsWith('/')`, which accepts `//evil.com`.

```ts
// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { safeNext } from "@/lib/auth/redirects";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`); // cookies set via cookies() in route handler
  }
  return NextResponse.redirect(`${origin}/auth?error=callback`);
}
```

Routing note: `app/auth/callback/` and `app/auth/confirm/` are static segments, which take precedence over the existing Clerk catch-all `app/auth/[[...rest]]/page.tsx`. Replace that catch-all with `app/auth/page.tsx` when Clerk is removed.

### 3.5 `/auth/confirm` (signup confirmation, magic link, recovery, email change, invite)

```ts
// app/auth/confirm/route.ts
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { safeNext } from "@/lib/auth/redirects";

// EmailOtpType is an open string union (types.d.ts:704), so whitelist it.
const ALLOWED = new Set<EmailOtpType>(["signup", "email", "recovery", "email_change", "invite", "magiclink"]);

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = type === "recovery" ? "/auth/update-password" : safeNext(url.searchParams.get("next"));

  const redirectTo = url.clone(); // strip the secret from the URL we redirect to
  redirectTo.search = "";
  if (tokenHash && type && ALLOWED.has(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      redirectTo.pathname = next;
      return NextResponse.redirect(redirectTo);
    }
  }
  redirectTo.pathname = "/auth";
  redirectTo.searchParams.set("error", "link");
  return NextResponse.redirect(redirectTo);
}
```

Email templates to set per project (Dashboard > Auth > Templates; locally in `config.toml` plus HTML files). `{{ .RedirectTo }}` is needed so that preview deployments receive their own links; with a single domain, `{{ .SiteURL }}` also works.

| Template | href |
|---|---|
| Confirm signup | `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` |
| Magic link | `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` |
| Reset password | `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery` |
| Change email | `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change` |
| Invite | `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite` |

**Email prefetching.** Microsoft Defender Safe Links and similar scanners GET links, which consumes the one-time token ("Token has expired or is invalid"). Docs options are an OTP code (`{{ .Token }}`) or an interstitial page with a button. With the interstitial, `/auth/confirm` renders a page and a POST server action calls `verifyOtp`. Recommended for B2B inboxes.

**SMTP.** The default Supabase SMTP is limited to **2 emails/hour**. Configure custom SMTP (Brevo is already in the stack) before launch.

### 3.6 Google OAuth setup
1. In Google Auth Platform, create an OAuth client of type **Web application**.
   - Authorized JavaScript origins: app origins (`https://www.quicktalog.app`, `https://test.quicktalog.app`, `http://localhost:3000` in dev only).
   - Authorized redirect URI: **`https://<project-ref>.supabase.co/auth/v1/callback`**, one per project (TEST and PROD), plus `http://127.0.0.1:54321/auth/v1/callback` for the local CLI.
   - Scopes: `openid` (add manually), `userinfo.email`, `userinfo.profile`.
   - Set up consent-screen branding. Consider a Supabase custom domain so users do not see `<ref>.supabase.co`.
2. Paste the client id and secret into Supabase > Auth > Providers > Google, per project. The Management API equivalent is `external_google_enabled`, `external_google_client_id`, `external_google_secret`.

### 3.7 Redirect allow-list and Site URL per environment
Wildcards: `*` matches non-separator characters (separators are `.` and `/`), `**` matches anything. The docs recommend exact paths in production.
- **TEST project** `imhinsgyzzyblghwnedk`:
  - Site URL `https://test.quicktalog.app`
  - Additional: `https://test.quicktalog.app/**`, `http://localhost:3000/**`, `https://*-<vercel-team-or-account-slug>.vercel.app/**`
- **PROD project** `uhfbapjuzvlyzyodxhqn`:
  - Site URL `https://www.quicktalog.app`
  - Additional: `https://www.quicktalog.app/auth/callback**` (query string carries `next`)
  - Bare origin `https://www.quicktalog.app` if you use `{{ .RedirectTo }}` with the origin
- `supabase/config.toml:21-23` only affects the **local** CLI stack (or `supabase config push`). Today it points `site_url` at prod and lacks localhost, paths and previews.

---

## 4. Protecting routes

1. **Middleware** redirect for `/admin` (section 1.4) is an optimistic UX check.
2. **Re-check at every entry point.** Next docs:
   - "A page-level authentication check does not extend to the Server Actions defined within it. Always re-verify inside the action."
   - Server Functions "are handled as POST requests to the route where they are used, so a Proxy matcher that excludes a path will also skip Server Function calls".
   - Layouts "don't re-render on navigation, meaning the user session won't be checked on every route change".
3. **CVE-2025-29927.** An internal `x-middleware-subrequest` header let requests skip middleware. Patched in 15.2.3, 14.2.25, 13.5.9 and 12.3.5. Vercel-hosted apps were not affected. Postmortem: "We do not recommend Middleware to be the sole method of protecting routes". This repo is on 15.5.16 (patched), but the principle stands.

```ts
// lib/auth/session.ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type SessionUser = { id: string; email: string | null; sessionId: string; aal: string };

/** Verified identity from the JWT (local ES256 verify). Deduped per RSC render via React cache. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const c = data.claims;
  return { id: c.sub, email: c.email ?? null, sessionId: c.session_id, aal: c.aal };
});

/** Pages / layouts: redirect to /auth. */
export async function requireUser(next = "/admin/dashboard") {
  const user = await getSessionUser();
  if (!user) redirect(`/auth?next=${encodeURIComponent(next)}`);
  return user;
}

export class UnauthorizedError extends Error {}

/** Server Actions / Route Handlers: throw (map to 401). Returns the cookie-bound client for RLS queries. */
export async function requireUserForAction() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) throw new UnauthorizedError("Unauthorized");
  return { supabase, userId: data.claims.sub, claims: data.claims };
}

/** Sensitive ops: round-trip to Auth so deleted/banned/signed-out users fail immediately. */
export async function requireFreshUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new UnauthorizedError("Unauthorized");
  return { supabase, user: data.user };
}
```

Route handler usage:

```ts
// e.g. app/api/dashboard/analytics/route.ts
export async function GET() {
  try {
    const { supabase, userId } = await requireUserForAction();
    const { data, error } = await supabase.from("analytics").select("*").eq("user_id", userId); // RLS also enforces
    // ...
  } catch (e) {
    if (e instanceof UnauthorizedError) return new Response(null, { status: 401 });
    throw e;
  }
}
```

**CSRF**
- Server Actions: POST-only, and Next compares `Origin` against `Host`/`X-Forwarded-Host` and aborts on mismatch. Use `experimental.serverActions.allowedOrigins` only behind a different-origin proxy.
- Route handlers get **no** Origin check. Cookie-authenticated mutating handlers rely on `SameSite=Lax` (no cookies on cross-site POST/fetch) plus not using GET for side effects. An explicit `Origin` check is cheap hardening for `app/api/update-consent/route.ts`, `app/api/dashboard/*` and similar.
- `next.config.ts:26-31` sets `Access-Control-Allow-Origin: *` **and** `Access-Control-Allow-Credentials: true` on all `/api/*`. That combination is invalid for credentialed CORS, so browsers refuse it. It is misleading; restrict it before cookie auth lands.

**Existing authorization holes to fix during the migration (verified in source)**
- `actions/users.ts:9-13`: `getUserData(userId?)` uses `userId ?? profile?.id` and never checks that the caller *is* `userId`. It is called from a client context (`context/UserContext.tsx:36`), so any visitor can POST it with another user id and receive `fetchUserData` output. That output includes the `users` row (email, `customer_id`, plan) and usage (`lib/users/fetchUserData.ts:136-153`). Fix: take no argument and derive the id from `requireUserForAction()`.
- `app/api/users/[id]/route.ts:11-49`: GET returns `fetchUserData` for **any** id, with no caller check. The only caller is the backend worker (`../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:29`, unauthenticated fetch).
- User ids are discoverable: `app/api/items/route.ts:13-15` does `select("*")` on `catalogues`, which includes `created_by`. Protect the route with a shared secret header, or have the worker read via its secret-key client.

---

## 5. Next.js caching interactions

- `cookies()` "is a Request-time API… Using it in a layout or page will opt a route into dynamic rendering". `createClient()` calls it, so any page that uses it is dynamic.
- **Do not read the session in `app/layout.tsx`.** The root layout (`app/layout.tsx:50`) wraps ISR `app/catalogues/[name]/page.tsx:10-12` (`revalidate = 86400` plus `generateStaticParams`) and static `articles`/`docs`. Reading cookies there would make every page dynamic. Read claims in a new `app/admin/layout.tsx`, or in pages that are already `force-dynamic` (`app/admin/dashboard/[[...rest]]/page.tsx:11`, `app/admin/[name]/analytics/page.tsx:6`).
- `unstable_cache` / `"use cache"`: "Accessing uncached data sources such as headers or cookies inside a cache scope is not supported." Never wrap a cookie-bound Supabase client call in a cache: the result would be keyed without the user and served to others. If you must cache per-user data, resolve the user **outside**, pass `userId` as an argument (part of the key), and query with an explicit filter. In Next 16, `unstable_cache` is replaced by `"use cache"`.
- **Public data must use `createPublicClient()`.** `app/api/items/route.ts:11` and `app/api/items/[name]/route.ts:11` feed the ISR catalogue page (`app/catalogues/[name]/page.tsx:14-24`) and currently use the cookie client. After migration, a signed-in browser calling them would run as `authenticated` (different RLS results) and might emit `Set-Cookie` on a public API response. Server-to-server ISR fetches carry no cookies, so they stay anon either way.
- **ISR/CDN session leak (Supabase advanced guide).** If a cached response carries `Set-Cookie` from a refresh, the next visitor is signed in as the wrong user.
  - Mitigations: no Supabase cookie client inside ISR pages; the middleware applies the `headers` passed to `setAll` (`Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`, `Expires: 0`, `Pragma: no-cache`); `export const dynamic = "force-dynamic"` on authenticated pages.
  - Middleware responses are per-request, not part of the ISR cache.
- **Vercel Fluid compute**: "Always initialize the Supabase client inside the request handler, not at module level."
- Matcher tradeoff: middleware on `/catalogues/*` costs one Edge/Node invocation per view, but no network for anonymous visitors (no cookie means no refresh). Excluding public static routes is fine: the browser client refreshes tokens itself, and those pages do not read the session on the server.

---

## 6. Client-side session state (replacing Clerk `useUser`)

Clerk surface to replace (every import, from grep):
- `ClerkProvider`: `components/wrappers/PageWrapperClient.tsx:6,16-20`
- `useUser`: `context/UserContext.tsx:4,23`, `context/CatalogueContext.tsx:9,73,285-287`, `components/navigation/AuthLinks.tsx:3,15`, `components/general/CookieBanner.tsx:13,21`, `components/modals/CookiePreferencesModal.tsx:13,23`
- `SignIn`/`SignUp`: `components/auth/Auth.tsx:3`
- `UserButton`: `AuthLinks.tsx:3`
- `SignOutButton`/`UserProfile`: `components/dashboard/Settings.tsx:6`
- server `currentUser`: `actions/catalogue.ts:14`, `actions/themes.ts:3`, `actions/users.ts:5`, `app/admin/[name]/builder/page.tsx:5`, `app/admin/[name]/qr-editor/page.tsx:6`, `app/api/dashboard/{analytics,catalogues,newsletter}/route.ts`, `app/api/users/[id]/route.ts:3`, `lib/ai/access.ts:5`
- `auth`/`clerkClient` with publicMetadata cookie consent: `app/api/update-consent/route.ts:4`
- webhook: `app/api/clerk/route.ts:15`
- middleware: `middleware.ts:1`
- tests: `tests/e2e/auth.setup.ts:1`, `tests/e2e/global.setup.ts:1`, `tests/unit/context/CatalogueContext.test.tsx:6`, `tests/unit/server_actions/ai.test.ts:11`

```tsx
// context/AuthContext.tsx
"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export type AuthUser = { id: string; email: string | null };
type AuthContextValue = { user: AuthUser | null; isLoaded: boolean; isSignedIn: boolean };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * initialUser:
 *  - AuthUser | null  -> passed from a Server Component (verified with getClaims): no loading flash
 *  - undefined        -> unknown (public/static pages): isLoaded=false until INITIAL_SESSION
 */
export function AuthProvider({ initialUser, children }: { initialUser?: AuthUser | null; children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [isLoaded, setIsLoaded] = useState(initialUser !== undefined);
  const lastUserId = useRef<string | null | undefined>(initialUser === undefined ? undefined : initialUser?.id ?? null);

  useEffect(() => {
    const supabase = createClient();
    // Callback must stay synchronous: auth-js runs it inside an exclusive lock;
    // awaiting other supabase calls here can deadlock (GoTrueClient.d.ts onAuthStateChange notes).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ? { id: session.user.id, email: session.user.email ?? null } : null;
      setUser(next);
      setIsLoaded(true);
      const nextId = next?.id ?? null;
      if (lastUserId.current !== undefined && lastUserId.current !== nextId) {
        router.refresh(); // re-render Server Components after sign-in/out (also fires cross-tab)
      }
      lastUserId.current = nextId;
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return <AuthContext.Provider value={{ user, isLoaded, isSignedIn: !!user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

```tsx
// app/admin/layout.tsx  (keeps public routes static; nested provider shadows the root one)
import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { requireUser } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(); // layout checks are NOT sufficient alone; pages/actions re-check
  return <AuthProvider initialUser={{ id: user.id, email: user.email }}>{children}</AuthProvider>;
}
```

- Root `PageWrapperClient` renders `<AuthProvider>` with no `initialUser`, so public nav shows a skeleton until `INITIAL_SESSION`. That matches today's Clerk `isLoaded` usage (`AuthLinks.tsx:15`).
- `context/UserContext.tsx:23-50` switches from `useClerkUser()` to `useAuth()` and calls `getUserData()` **without** an id.
- `session.user` in the browser comes from the cookie and is **UI-only**. Never authorize on it.
- Clerk `publicMetadata.cookieConsent` has no trusted client-writable equivalent. `user_metadata` is user-writable. Use the existing `public.users.cookie_preferences` jsonb column (TEST schema), or `app_metadata` via the admin API.

---

## 7. Deleting users, custom access token hook, `auth.users` to `public.users` sync

### 7.1 Admin client and account deletion

```ts
// utils/supabase/admin.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
```

```ts
// actions/account.ts
"use server";
import { redirect } from "next/navigation";
import { requireFreshUser } from "@/lib/auth/session";
import { createAdminClient } from "@/utils/supabase/admin";

export async function deleteMyAccount() {
  const { supabase, user } = await requireFreshUser(); // getUser(), not getClaims()
  // 1) cancel Paddle subscription first (subscriptions.customer_id -> users.customer_id)
  // 2) delete the auth user. auth.admin.deleteUser validates a UUID (GoTrueAdminApi.js:737-738)
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id); // shouldSoftDelete defaults false
  if (error) throw error;
  // 3) if public.users is not FK'd to auth.users, delete it explicitly (cascades catalogues etc.)
  await supabase.auth.signOut({ scope: "local" }); // clear this browser's cookies
  redirect("/");
}
```

- Deleting cascades to `auth.sessions` and kills refresh tokens. The **access token stays valid until `exp`**.
- Deletion fails if the user owns Storage objects.
- A ban is not a substitute: it does not revoke existing sessions.
- `public.users.id` is `text` holding Clerk ids (`user_…`). Supabase ids are UUIDs, so `deleteUser` and `auth.uid()` need the new id format. Store `auth.users.id::text`, or migrate to uuid. A `REFERENCES auth.users(id)` FK requires matching types.

### 7.2 `handle_new_user` trigger matched to TEST `public.users`
TEST columns: `id text NOT NULL`, `plan_id text NOT NULL` FK to `plans`, `customer_id` UNIQUE, `consents` NOT NULL with default, `email`, `name`, `image`, `cookie_preferences`. The default plan id is `pri_01k27ajepm199twd1x77rpwdrq` (`lib/users/syncFromClerk.ts:3`, present in TEST `plans`).

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name, image, plan_id)
  values (
    new.id::text,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    'pri_01k27ajepm199twd1x77rpwdrq'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Failure modes:
- The trigger runs **inside the signup transaction**. Any error (NOT NULL `plan_id`, bad FK, unique `customer_id`, missing grant, wrong `search_path`) aborts signup with 500 "Database error saving new user". Docs: "If the trigger fails, it could block signups, so test your code thoroughly."
- Use `security definer` (owner `postgres`), because `supabase_auth_admin` lacks rights outside `auth`. Set `search_path = ''` and fully qualify every name.
- The chained trigger `"Brevo New Contact Webhook"` (AFTER INSERT/UPDATE on `public.users`) calls `public.call_edge_function_with_vault_secret()`. That function is `pg_net`, so it is async and non-blocking, but on TEST it posts the full row to the **PROD** function URL.
- To avoid blocking signup you can wrap the insert in `exception when others then raise warning …; return new;`. The app must then lazily upsert a missing row. That pattern already exists: `lib/users/fetchUserData.ts:47-60` on-demand sync.

Trigger vs app-side upsert:
- The trigger is atomic and covers every entry point: password, OAuth, magic link, invite, dashboard-created users.
- App-side upsert only runs where your code runs (callback/confirm routes), and races with first page load.
- Recommended: trigger plus idempotent app fallback.
- Optionally add an `after update of email on auth.users` trigger to sync email changes.

### 7.3 Custom access token hook (e.g. `plan_id` claim)

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare claims jsonb; v_plan text;
begin
  select u.plan_id into v_plan from public.users u where u.id = (event->>'user_id');
  claims := event->'claims';
  claims := jsonb_set(claims, '{plan_id}', coalesce(to_jsonb(v_plan), 'null'::jsonb));
  return jsonb_set(event, '{claims}', claims);
end; $$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on table public.users to supabase_auth_admin;
-- once RLS is enabled on public.users:
create policy "auth admin reads users for hook" on public.users for select to supabase_auth_admin using (true);
```

Enable it in Dashboard > Auth > Hooks, or locally with `[auth.hook.custom_access_token] enabled = true, uri = "pg-functions://postgres/public/custom_access_token_hook"`.

Tradeoffs:
- It runs on **every** token issuance, including refresh, with a **2s** Postgres-hook timeout. Errors are not retried and fail sign-in or refresh.
- Required claims must be preserved.
- Claims are **stale until the next refresh** (≤ `jwt_expiry` 3600s). A Paddle upgrade or downgrade (`utils/paddle/process-webhook.ts`) would not show immediately.
- Larger JWT means bigger cookies (chunking).
- Claims do not appear on `session.user`; read them via `getClaims()` or by decoding the token.
- Recommendation: do **not** gate billing limits on a JWT `plan` claim. Read `users.plan_id` from the DB (as `fetchUserData` does). Use the hook only for coarse, rarely-changing roles.
- The hook is available on Free and Pro. "Before User Created" hook exists for signup policy such as blocking disposable domains.

---

## 8. Testing

### 8.1 Playwright: programmatic Supabase login producing exact SSR cookies
Replaces `@clerk/testing` in `tests/e2e/global.setup.ts:1-7` and `tests/e2e/auth.setup.ts:1-32`. Keep the setup-project wiring from `playwright.config.ts:18,24-30`, but rename `STORAGE_STATE` (`playwright.config.ts:9`).

```ts
// tests/e2e/global.setup.ts - ensure a confirmed test user exists (secret key stays in the Node test runner only)
import { createClient } from "@supabase/supabase-js";

export default async function globalSetup() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = process.env.E2E_USER_EMAIL!;
  const password = process.env.E2E_USER_PASSWORD!;
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error && !/already.*registered|exists/i.test(error.message)) throw error;
}
```

```ts
// tests/e2e/auth.setup.ts - use @supabase/ssr itself so cookie name/encoding/chunking match the app
import { createServerClient } from "@supabase/ssr";
import { expect, test as setup } from "@playwright/test";

const STORAGE_STATE = "playwright/.auth/user.json";

setup("authenticate with Supabase", async ({ page, baseURL }) => {
  const jar = new Map<string, string>();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (cookies) => {
          for (const { name, value, options } of cookies) {
            if (options?.maxAge === 0) jar.delete(name);
            else jar.set(name, value);
          }
        },
      },
    },
  );
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_USER_EMAIL!,
    password: process.env.E2E_USER_PASSWORD!,
  }); // SIGNED_IN -> applyServerStorage -> setAll
  if (error) throw error;

  const { hostname } = new URL(baseURL ?? "http://localhost:3000");
  await page.context().addCookies(
    [...jar].map(([name, value]) => ({
      name, value, domain: hostname, path: "/",
      expires: Math.floor(Date.now() / 1000) + 400 * 24 * 3600,
      httpOnly: false, secure: false, sameSite: "Lax" as const,
    })),
  );

  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await page.context().storageState({ path: STORAGE_STATE });
});
```

Caveats:
- The storage state holds a **single-use refresh token**. Regenerate it per run (the `dependencies: ["setup"]` pattern already does this), and do not share one state across many workers for runs longer than `jwt_expiry`.
- UI-driven login, per the Playwright auth docs, also works and exercises the real forms.
- Do not use a production account.

### 8.2 Local stack
- `supabase start` prints URL, publishable key and secret key (`supabase status -o env`). The cookie name locally is `sb-127-auth-token`.
- Emails are caught by Mailpit (URL from `supabase status`). With `enable_confirmations = true` (`supabase/config.toml:35`), tests should create users with `admin.createUser({ email_confirm: true })`.
- `supabase/config.toml` needs fixes:
  - `[db] major_version = 15` (line 16) should be 17 to match TEST 17.6.
  - `project_id = "pro_01k11h4bv62fv5vx936tm5wge0"` (line 1) looks like a Paddle product id.
  - Add `http://127.0.0.1:3000/**` and `http://localhost:3000/**` to `additional_redirect_urls`.
  - Configure `[auth.hook.custom_access_token]` and email templates if they are used.
- Local asymmetric keys: `supabase gen signing-key --algorithm ES256` plus `[auth] signing_keys_path = "./signing_keys.json"`. There were CLI bugs (supabase/cli#4098); verify on your CLI version.

### 8.3 RLS tests with pgTAP (`supabase test new`, `supabase test db`)
IDs here are **text**, so policies compare `(select auth.uid())::text` or `(select auth.jwt()->>'sub')`.

```sql
-- supabase/tests/database/catalogues_rls.test.sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.dev'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.dev');
-- handle_new_user creates public.users rows; then seed catalogues as postgres (bypasses RLS)
insert into public.catalogues (name, created_by /*, other NOT NULL cols */)
values ('a-cat', '11111111-1111-1111-1111-111111111111');

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is_empty($$ select 1 from public.catalogues where name = 'a-cat' and status <> 'active' $$,
  'B cannot see A''s non-public catalogue');
select results_eq($$ update public.catalogues set name = 'pwned' where name = 'a-cat' returning 1 $$,
  $$ select 1 where false $$, 'B cannot update A''s catalogue');

set local role anon;
select throws_ok($$ insert into public.users (id, plan_id) values ('x', 'pri_01k27ajepm199twd1x77rpwdrq') $$,
  '42501', null, 'anon cannot insert users once grants are revoked');

select * from finish();
rollback;
```

- `pgtap` 1.3.3 is available on TEST but not installed. It is only needed on the local stack or CI (`supabase/setup-cli` then `supabase start` then `supabase test db`).
- Application-level RLS tests (vitest with a publishable-key client signed in as two users, plus an admin client for seeding) follow the Supabase testing overview example. Use unique ids per suite rather than DB resets.

## facts
- (verified-in-source) Latest @supabase/ssr on npm is 0.12.7 (modified 2026-09-08) with peerDependency @supabase/supabase-js ^2.114.0; the repo has 0.5.2 installed (peer ^2.43.4). [npm view @supabase/ssr / node_modules/@supabase/ssr/package.json]
- (verified-in-source) Latest @supabase/supabase-js and @supabase/auth-js is 2.116.0; installed is 2.105.3. [npm view; node_modules/@supabase/*/package.json]
- (verified-in-source) @supabase/ssr 0.10.0 passes cache headers (Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0; Expires: 0; Pragma: no-cache) as a second argument to setAll, delivered only once per server client. [https://github.com/supabase/ssr/blob/main/CHANGELOG.md ; https://raw.githubusercontent.com/supabase/ssr/main/src/types.ts ; src/cookies.ts]
- (verified-in-source) Default Supabase SSR cookie options are path '/', sameSite 'lax', httpOnly false, maxAge 400 days, with no Secure and no Domain attribute. [node_modules/@supabase/ssr/dist/main/utils/constants.js; https://raw.githubusercontent.com/supabase/ssr/main/src/utils/constants.ts]
- (verified-in-source) The auth storage key/cookie name is sb-<first label of the Supabase URL hostname>-auth-token (e.g. sb-imhinsgyzzyblghwnedk-auth-token on TEST, sb-127-auth-token for a local 127.0.0.1 stack). [node_modules/@supabase/supabase-js/dist/index.cjs:369]
- (verified-in-source) Cookie values are prefixed 'base64-' plus base64url JSON by default, and split into name.0, name.1... chunks when the URI-encoded value exceeds 3180 characters. [node_modules/@supabase/ssr/dist/main/cookies.js:6,152-153; dist/main/utils/chunker.js:4; ssr src/cookies.ts]
- (verified-in-source) The PKCE code verifier is stored under <storageKey>-code-verifier, and the server client writes it immediately when set. [auth-js GoTrueClient.js:3204; ssr src/cookies.ts setItem]
- (verified-in-source) createServerClient forces flowType 'pkce', autoRefreshToken false, detectSessionInUrl false, and (0.12.x) skipAutoInitialize true; it calls setAll on SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY, SIGNED_OUT and MFA_CHALLENGE_VERIFIED when storage changed. [node_modules/@supabase/ssr/dist/main/createServerClient.js; https://raw.githubusercontent.com/supabase/ssr/main/src/createServerClient.ts]
- (verified-in-source) createBrowserClient returns a module singleton in the browser by default. [node_modules/@supabase/ssr/dist/main/createBrowserClient.js]
- (verified-in-source) getClaims() with no argument calls getSession() first, then verifies locally via WebCrypto using a JWKS fetched from /auth/v1/.well-known/jwks.json and cached globally for 10 minutes; for HS* algorithms, a missing kid, or no WebCrypto, it falls back to a getUser() network call. [node_modules/@supabase/auth-js/dist/main/GoTrueClient.js:4724-4884; lib/constants.js:30]
- (verified-in-source) In auth-js 2.105.3, getClaims on an expired explicit JWT throws a plain Error('JWT has expired') instead of returning {data, error}; fixed in 2.107.0 (PR #2395). [node_modules/@supabase/auth-js/dist/main/lib/helpers.js:293-300; https://github.com/supabase/supabase-js/pull/2395]
- (uncertain) getClaims requires at least supabase-js v2.49.2. [https://github.com/supabase/ssr/issues/120 (maintainer comment)]
- (verified-in-docs) Supabase docs: never trust getSession() in server code; use getClaims() to protect pages and data; getUser() makes a network call for an up-to-date user record. [https://supabase.com/docs/guides/auth/server-side/creating-a-client]
- (verified-in-docs) getClaims does not detect server-side logout, deletion or ban until the access token expires; only getUser() or a session_id check against auth.sessions does. [https://supabase.com/docs/guides/auth/server-side/advanced-guide ; https://supabase.com/docs/guides/auth/managing-user-data]
- (verified-in-source) The TEST project's JWKS endpoint publishes one EC P-256 ES256 key (kid a3b5f3ec-c45b-4f69-9bfd-d09a3066a1f4); whether it is in use or standby was not verifiable without a token. [https://imhinsgyzzyblghwnedk.supabase.co/auth/v1/.well-known/jwks.json]
- (verified-in-docs) Revoking the legacy JWT secret requires disabling the anon and service_role keys first; the JWKS is edge-cached for 10 minutes plus 10 minutes client cache; wait at least 1h15m (with 1h expiry) before revoking. [https://supabase.com/docs/guides/auth/signing-keys]
- (verified-in-docs) Publishable key without a user maps to anon, with a signed-in user maps to authenticated; a secret key maps to service_role (BYPASSRLS). Secret keys return HTTP 401 from browsers based on User-Agent. Legacy anon/service_role keys are deprecated by end of 2026. [https://supabase.com/docs/guides/getting-started/api-keys]
- (verified-in-docs) The API Gateway verifies the apikey header and mints a temporary short-lived JWT forwarded to project services. [https://supabase.com/docs/guides/auth/signing-keys]
- (verified-in-source) The app already uses a sb_publishable_ key in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local). [.env.local (value redacted)]
- (verified-in-docs) Refresh tokens are single-use with a default 10s reuse interval (not recommended to change) plus a parent-token exception; other reuse revokes the session. [https://supabase.com/docs/guides/auth/sessions]
- (verified-in-docs) Supabase says making the cookies HttpOnly is not necessary because the browser side needs the refresh token; HttpOnly is feasible only for server-only apps. [https://supabase.com/docs/guides/auth/server-side/advanced-guide ; https://supabase.com/docs/guides/auth/sessions]
- (verified-in-docs) Clerk's __client cookie is HttpOnly on the FAPI domain; __session lives 60 seconds and is not HttpOnly. [https://clerk.com/docs/guides/how-clerk-works/overview]
- (verified-in-docs) ISR or CDN caching of responses carrying a Set-Cookie session refresh can sign users in as someone else; Supabase recommends force-dynamic on auth pages and applying the setAll cache headers. [https://supabase.com/docs/guides/auth/server-side/advanced-guide]
- (verified-in-source) The official Next.js proxy/middleware sample returns supabaseResponse, applies setAll headers, and warns not to run code between createServerClient and getClaims. [https://raw.githubusercontent.com/supabase/supabase/master/examples/auth/nextjs/lib/supabase/proxy.ts]
- (verified-in-docs) Next.js 16 deprecated middleware and renamed it proxy (Node.js runtime default, runtime config not allowed); Node runtime in middleware became stable in 15.5.0; codemod npx @next/codemod@canary middleware-to-proxy. [https://nextjs.org/docs/app/api-reference/file-conventions/proxy]
- (verified-in-docs) CVE-2025-29927 abused the internal x-middleware-subrequest header; patched in 15.2.3/14.2.25/13.5.9/12.3.5; Vercel-hosted deployments were not vulnerable; Vercel advises middleware should not be the sole protection. [https://vercel.com/blog/postmortem-on-next-js-middleware-bypass]
- (verified-in-docs) Server Actions are POST-only and Next compares Origin to Host/X-Forwarded-Host; a page-level auth check does not extend to its Server Actions. [https://nextjs.org/docs/app/guides/data-security]
- (verified-in-docs) Layouts do not re-render on navigation, so layout auth checks are not re-run on route changes. [https://nextjs.org/docs/app/guides/authentication]
- (verified-in-docs) cookies() is a request-time API that opts a route into dynamic rendering; cookies cannot be set during Server Component rendering. [https://nextjs.org/docs/app/api-reference/functions/cookies]
- (verified-in-docs) Accessing headers or cookies inside unstable_cache is not supported; unstable_cache is replaced by 'use cache' in Next 16. [https://nextjs.org/docs/app/api-reference/functions/unstable_cache]
- (verified-in-docs) A PKCE auth code is valid 5 minutes, single use, and must be exchanged in the same browser that started the flow. [https://supabase.com/docs/guides/auth/sessions/pkce-flow]
- (verified-in-docs) For SSR, the Confirm signup template should link to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email and the route should call verifyOtp({ type, token_hash }). [https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs]
- (verified-in-docs) Email link prefetchers (e.g. Microsoft Safe Links) consume confirmation links; mitigate with OTP codes or an interstitial page with a button. [https://supabase.com/docs/guides/auth/auth-email-templates]
- (verified-in-docs) Supabase's official Next.js OAuth callback uses exchangeCodeForSession and only checks next.startsWith('/'). [https://supabase.com/docs/guides/auth/social-login/auth-google (Next.js tab)]
- (verified-in-docs) For Vercel previews, add https://*-<team-or-account-slug>.vercel.app/** and http://localhost:3000/** to the redirect allow list; '*' does not match '.' or '/'. [https://supabase.com/docs/guides/auth/redirect-urls]
- (verified-in-docs) The Google OAuth client's Authorized redirect URI must be the Supabase callback URL (http://127.0.0.1:54321/auth/v1/callback locally); required scopes are openid, userinfo.email, userinfo.profile. [https://supabase.com/docs/guides/auth/social-login/auth-google]
- (verified-in-source) signOut() defaults to scope 'global' in JS, revoking refresh tokens on all devices; 'local' and 'others' scopes exist; access tokens stay valid until exp. [node_modules/@supabase/auth-js/dist/main/GoTrueClient.js:3176-3208; https://supabase.com/docs/guides/auth/signout]
- (verified-in-docs) updateUser accepts current_password in supabase-js v2.102.0+. [https://supabase.com/docs/guides/auth/passwords]
- (verified-in-docs) The default Supabase SMTP service is rate-limited to 2 emails per hour. [https://supabase.com/docs/guides/auth/passwords]
- (verified-in-source) auth.admin.deleteUser(id, shouldSoftDelete=false) validates that id is a UUID and requires an elevated key; deleting cascades to auth.sessions but already-issued access tokens stay valid until exp; Storage-owned objects block deletion. [node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.js:737-754; https://supabase.com/docs/guides/auth/managing-user-data]
- (verified-in-docs) A failing trigger on auth.users blocks signups ('Database error saving new user'); functions touching public tables must be security definer because supabase_auth_admin lacks permissions. [https://supabase.com/docs/guides/auth/managing-user-data ; https://supabase.com/docs/guides/troubleshooting/dashboard-errors-when-managing-users-N1ls4A]
- (verified-in-docs) Auth hooks: Postgres hooks have 2 seconds (HTTP hooks 5 seconds), errors are not retryable, supabase_auth_admin needs execute and usage grants, and the custom access token hook is available on Free and Pro. [https://supabase.com/docs/guides/auth/auth-hooks]
- (verified-in-source) On TEST, public.users.plan_id is NOT NULL with an FK to plans, customer_id is UNIQUE, id is text; the default plan pri_01k27ajepm199twd1x77rpwdrq exists in plans. [TEST SELECT on information_schema.columns / pg_constraint / public.plans; lib/users/syncFromClerk.ts:3]
- (verified-in-source) The TEST trigger function public.call_edge_function_with_vault_secret is SECURITY DEFINER, reads Vault secret 'service_role_key', and uses pg_net http_post to the PROD project functions URL. [TEST SELECT pg_get_functiondef]
- (verified-in-source) TEST runs Postgres 17.6 while supabase/config.toml sets major_version = 15. [TEST SELECT current_setting('server_version'); supabase/config.toml:16]
- (verified-in-docs) pgTAP RLS tests use 'set local role authenticated' and request.jwt.claim(s), run with 'supabase test db'. [https://supabase.com/docs/guides/local-development/testing/overview]
- (verified-in-source) actions/users.ts getUserData(userId) returns another user's profile, plan and usage without verifying the caller is that user; app/api/users/[id]/route.ts does the same for any id. [actions/users.ts:9-13; app/api/users/[id]/route.ts:11-49; lib/users/fetchUserData.ts:136-153]
- (verified-in-source) next.config.ts sets Access-Control-Allow-Origin '*' together with Access-Control-Allow-Credentials 'true' on /api/*. [next.config.ts:26-31]
- (verified-in-source) Author custom code runs in an iframe with sandbox='allow-scripts' and no allow-same-origin, so it cannot read the app's document.cookie. [components/catalogue/sections/CustomCode.tsx:114-118,201-202]
- (inferred) If a redirectTo URL is not in the allow list, Supabase Auth falls back to the Site URL. [https://supabase.com/docs/guides/auth/redirect-urls (implied)]
- (inferred) React cache() only memoizes within an RSC render; in route handlers or actions outside a render it calls through without caching. [React cache semantics]
## gotchas
- utils/supabase/server.ts:1 has "use server", which turns the Supabase client factory into a Server Function; replace it with import "server-only".
- Snippets using setAll(cookiesToSet, headers) do not type-check on the installed @supabase/ssr 0.5.2 (its SetAllCookies takes one parameter). Upgrade to ssr ^0.12.7 together with supabase-js ^2.114.0 (0.12.7 peer).
- The installed auth-js 2.105.3 getClaims throws a plain Error for an expired explicit JWT instead of returning {error} (helpers.js:293-300); fixed in 2.107.0.
- The official Supabase proxy sample redirects EVERY path except /login and /auth to /login. Copied verbatim, it would lock out public /catalogues/*, /pricing and the rest; restrict the redirect to /admin.
- Middleware must return the exact response object built in setAll (or copy its cookies); creating a new NextResponse drops refreshed cookies and causes random logouts.
- Do not call getClaims or cookies() in app/layout.tsx: the root layout wraps ISR app/catalogues/[name]/page.tsx (revalidate 86400) and static docs/articles, and every page would become dynamic.
- /api/items and /api/items/[name] currently use the cookie-bound client (app/api/items/route.ts:11, app/api/items/[name]/route.ts:11). After migration, signed-in browsers would hit them as 'authenticated' and could receive Set-Cookie on public API responses; switch them to a cookie-less anon client.
- getClaims does not reflect deletion, ban or global sign-out until exp (jwt_expiry 3600s). Use getUser() for delete-account, billing and credential changes.
- If the project still signs with legacy HS256, getClaims silently becomes a network getUser() on every call, including in middleware on each navigation. The TEST JWKS lists ES256, but confirm it is 'in use', not standby.
- Revoking the legacy JWT secret requires disabling anon/service_role keys, which breaks the Cloudflare backend (service_role) and the DB trigger function that sends Vault 'service_role_key' as Bearer to edge functions. Migrate those to sb_secret_ keys first.
- The TEST DB trigger function call_edge_function_with_vault_secret posts to the PROD functions URL (uhfbapjuzvlyzyodxhqn). A handle_new_user trigger inserting into public.users will make TEST signups hit PROD Brevo/CRM functions.
- public.users.plan_id is NOT NULL with an FK and customer_id is UNIQUE. A handle_new_user trigger that omits plan_id or violates a constraint aborts the signup transaction ('Database error saving new user').
- auth.admin.deleteUser and auth.uid() are UUID-based, but every user FK in the schema is text holding Clerk ids ('user_...'). Existing rows need an id migration or mapping, and FKs to auth.users need matching types.
- signOut() defaults to scope 'global' in JS, which kills sessions on all devices and causes 'Invalid Refresh Token' errors elsewhere. Pass { scope: 'local' } for normal logout.
- The docs' OAuth callback 'next' check (startsWith('/')) accepts protocol-relative '//evil.com', an open redirect; also reject '//' and '/\'.
- EmailOtpType is an open string union (types.d.ts:704); whitelist the type query param in /auth/confirm.
- GET-based /auth/confirm links are consumed by corporate email link scanners (Safe Links); consider an interstitial page with a POST button or OTP codes.
- Default Supabase SMTP allows only 2 emails/hour. Signup confirmation (enable_confirmations = true) and password reset will fail under load until custom SMTP is configured.
- Auth cookies are JS-readable and contain the long-lived refresh token (Clerk's long-lived credential was HttpOnly). GTM, Clarity and PostHog scripts in the root layout can read document.cookie, and any XSS is full account takeover. Keep the CustomCode iframe without allow-same-origin.
- Supabase cookies have no Secure attribute by default; set cookieOptions consistently in the server, middleware and browser clients if you add it.
- Setting cookies during Server Component render throws and is swallowed by the try/catch, so a token refresh done there is lost. Middleware must refresh first for every route that reads the session server-side.
- Concurrent requests with the same expired session: the second refresh fails (single-use tokens); parallel client fetches must tolerate a null session.
- onAuthStateChange callbacks must not be async or await other supabase calls (exclusive lock deadlock); dispatch follow-up work via setTimeout.
- Refresh-token rotation means a saved Playwright storageState goes stale after a refresh; regenerate per run and do not share across long parallel runs.
- With a local CLI stack the cookie name is sb-127-auth-token, not sb-<ref>-auth-token; do not hardcode the ref in tests.
- supabase/config.toml is used only by the local CLI (or config push): major_version = 15 vs TEST 17.6, project_id looks like a Paddle id, site_url points to prod, and localhost/preview redirect URLs are missing.
- Custom access token hook claims (e.g. plan) are stale until the next token refresh (up to 1h), a failing hook blocks sign-in and refresh (2s timeout), and larger JWTs mean larger chunked cookies.
- user_metadata (raw_user_meta_data) is user-writable via updateUser. Never use it for authorization or trusted state such as cookie consent or plan; use app_metadata or public tables.
- next.config.ts:26-31 combines Access-Control-Allow-Origin '*' with Allow-Credentials 'true' on /api/*, which is invalid for credentialed CORS; route handlers have no built-in Origin check (unlike Server Actions).
- The backend worker calls /api/users/{id} unauthenticated (quicktalog-backend subscriptionProcessingJob.ts:29), which is why that route has no caller check. Fixing the IDOR requires changing the worker too.
- The existing middleware matcher includes /(api|trpc)(.*). Running updateSession on /api/paddle and /api/clerk webhooks is wasted work; exclude them and the /ingest PostHog proxy.
## recommendations
- Upgrade to @supabase/ssr ^0.12.7 and @supabase/supabase-js ^2.116.0 before writing auth code; bump next to the latest 15.5.x backport, and plan the Next 16 middleware.ts to proxy.ts rename (codemod) separately.
- Rewrite utils/supabase/server.ts as a server-only module exporting createClient() (cookie-bound, per request) and createPublicClient() (cookie-less anon), add utils/supabase/client.ts (createBrowserClient) and utils/supabase/admin.ts (SUPABASE_SECRET_KEY, server-only).
- Replace clerkMiddleware with an updateSession middleware that calls getClaims() first, applies setAll cookies and cache headers, redirects only /admin to /auth?next=..., and excludes static assets, /ingest, /api/paddle and /api/clerk from the matcher.
- Add lib/auth/session.ts with getSessionUser (React cache + getClaims), requireUser (redirect), requireUserForAction (throw 401) and requireFreshUser (getUser), and call them in every admin page, Server Action and route handler, not only in middleware.
- Fix the IDORs during the migration: getUserData() must derive the id from the session (actions/users.ts:9-13), and /api/users/[id] must require the caller to be that user or a shared server secret for the backend worker.
- Switch /api/items and /api/items/[name] to createPublicClient() so public catalogue data stays anon, cacheable and free of Set-Cookie.
- Read the session only in app/admin/layout.tsx (passing initialUser to a nested AuthProvider) and in force-dynamic admin pages; keep the root layout cookie-free so ISR and static pages stay static.
- Implement /auth/callback (exchangeCodeForSession with strict safeNext) and /auth/confirm (verifyOtp with a type whitelist); update all email templates to token_hash links using {{ .RedirectTo }}; consider an interstitial POST confirmation to defeat link scanners.
- Configure per-project URL settings: TEST Site URL https://test.quicktalog.app plus test/**, localhost:3000/** and https://*-<team-slug>.vercel.app/**; PROD Site URL https://www.quicktalog.app with exact callback/confirm paths. Register both Supabase callback URLs in the Google OAuth client.
- Configure custom SMTP (e.g. Brevo) on both projects before enabling signups; the default is 2 emails/hour.
- Confirm in Dashboard > JWT Keys that ES256 is the in-use signing key on TEST and PROD; otherwise migrate from the legacy secret. Move the backend worker and the Vault-based trigger to sb_secret_ keys before ever revoking legacy keys.
- Use signOut({ scope: 'local' }) for normal logout, 'others' after a password change, and 'global' only for 'log out everywhere'.
- Create public.users rows with a security definer, search_path='' handle_new_user trigger that supplies plan_id and uses on conflict do nothing, and keep an idempotent app-side fallback upsert. Test the trigger in pgTAP before enabling signups, and fix the TEST trigger function so it does not call PROD edge functions.
- Do not put billing plan in JWT claims for enforcement; keep reading users.plan_id from the DB. Use a custom access token hook only for coarse, rarely-changing roles, with explicit grants to supabase_auth_admin and an RLS policy for it.
- Plan the id migration from Clerk text ids to Supabase UUIDs (stored as text or converted), since deleteUser and auth.uid() require UUIDs and RLS policies must compare (select auth.uid())::text.
- Replace @clerk/testing with a Supabase global setup (admin.createUser with email_confirm) and an auth.setup that uses createServerClient with an in-memory cookie jar to produce exact SSR cookies for storageState.
- Fix supabase/config.toml for local development (major_version 17, sensible project_id, localhost redirect URLs, hook and template config), and add pgTAP RLS tests run via supabase test db in CI.
- Harden against XSS now that refresh tokens are JS-readable: keep the sandboxed CustomCode iframe without allow-same-origin, audit GTM/Clarity/PostHog script injection, consider a CSP, and remove the '*' plus credentials CORS header on /api/*.
- As an alternative if the real goal is only RLS rather than leaving Clerk, evaluate Supabase third-party auth with Clerk session tokens (role claim plus accessToken callback) before committing to a full auth migration.