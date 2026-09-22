# Supabase Auth email templates

Applied by `scripts/supabase/auth-config.ts`, which resolves the
`"file:supabase/templates/…"` values in `auth-config.<env>.json`. The files hold
only what the recipient sees — no comments, because GoTrue sends the body
verbatim and anything in here ends up inside a customer's email.

## Why the links do not use `{{ .ConfirmationURL }}`

`ConfirmationURL` points at GoTrue's own `/auth/v1/verify` endpoint, which spends
the token the moment the link is **fetched**. A corporate mail scanner that
follows links to inspect them therefore burns the token, and the real user
arrives to "this link is no longer valid".

Every template instead points at the app's own interstitial:

```
{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>
```

`/auth/confirm` verifies nothing. It moves the token into a short-lived
`__Host-` cookie and redirects to a page with a button, so the token is only
spent when a human presses it. `app/auth/confirm/route.ts` and
`app/auth/confirm/continue/actions.ts` are the two halves.

`type` must match what the route accepts: `email`, `recovery` or `email_change`.

## Why `{{ .RedirectTo }}` and not `{{ .SiteURL }}`

GoTrue substitutes the caller's redirect URL there, which lets one template
serve localhost, TEST previews and production. It works because every call site
passes a bare origin with no path and no query:

- `signUp({ options: { emailRedirectTo: window.location.origin } })`
- `resetPasswordForEmail(email, { redirectTo: window.location.origin })`

If a call ever passes a path, the link will contain it twice. `{{ .RedirectTo }}`
falls back to the Site URL when the caller sends nothing, or sends something not
in the redirect allow list.

## Tracking must stay off

Resend's click and open tracking rewrites every link in the body. A rewritten
one-time token URL is exactly the scanner problem above, reintroduced — so
tracking is disabled for the auth sending domain.
