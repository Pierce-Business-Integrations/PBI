# Private project intake setup

The project intake is a separate discovery form for invited clients and prospects. It is not linked in public navigation, the footer, or the sitemap. The page and API require a short-lived HttpOnly access cookie. The invitation link sets that cookie and redirects to a clean URL, so the token does not remain in the intake page URL.

## Configure the invitation secret

1. Generate a random secret of at least 32 bytes. For example, run `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` on a trusted machine.
2. Set the result as the server-only `PROJECT_INTAKE_ACCESS_TOKEN` environment variable in Vercel Production. Add it to Preview too if you want to test invitations there. Do not use `NEXT_PUBLIC_` or commit the secret.
3. Redeploy after setting the variable.
4. Privately send this link, replacing `YOUR_TOKEN` with the exact secret: `https://piercebusinessintegrations.com/api/intake/access?token=YOUR_TOKEN`.

The invitation is a shared bearer link: anyone with the secret link can use the intake for 14 days after opening it. If the link spreads, rotate `PROJECT_INTAKE_ACCESS_TOKEN` and redeploy. Rotation immediately invalidates old invitation links and sessions. This is private by possession of a link, not identity-based login. Avoid placing the link in public pages, ads, or analytics campaigns.

## Delivery

The intake uses the same `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL`, `CONTACT_FROM_EMAIL`, `CONTACT_REPLY_EMAIL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, and `TURNSTILE_SECRET_KEY` as the consultation form. It sends a sectioned internal email to `CONTACT_NOTIFICATION_EMAIL` with the visitor's email as Reply-To, then a brief confirmation to the visitor. Internal delivery must succeed before the page reports success. No database record is created.

## Production check

1. Visit `/project-intake` without an invitation and confirm it returns 404. Check that `/api/intake` rejects a POST without an access cookie.
2. Open the private invitation link and confirm it redirects to `/project-intake` without the token in the URL.
3. Complete a test intake covering a website and a system/automation or advertising need.
4. Confirm the internal email arrives at the same inbox used by `/contact`, retains each answer, and escapes visitor text in HTML.
5. Confirm the visitor confirmation arrives and the page redirects to `/project-intake/received`.
6. Confirm neither intake route appears in the sitemap or public navigation, and that noindex/no-store headers are served.

Do not send passwords, account access, payment details, or sensitive client records through the form. Arrange a secure handoff separately if a project needs them.
