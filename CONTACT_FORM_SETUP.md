# PBI contact form production setup

The custom consultation form posts only to `/api/contact`. The endpoint validates the payload, verifies Cloudflare Turnstile, and sends fixed inquiry and confirmation templates through Resend. It does not store submissions in a database.

## 1. Resend

1. Create a Resend account and add the `pbintegrations.com` sending domain.
2. Add the SPF, DKIM, and any other DNS records Resend displays to the domain’s DNS provider. Use the exact values shown by Resend; record names differ by DNS provider.
3. Wait for the domain to show as verified in Resend.
4. Create a restricted API key for this website.
5. Set `CONTACT_FROM_EMAIL` to a real sender identity on the verified `pbintegrations.com` domain, using the Pierce Business Integrations display name. Do not assume a particular mailbox exists.
6. Set `CONTACT_NOTIFICATION_EMAIL` to the trusted internal inbox that should receive inquiries.
7. Set `CONTACT_REPLY_EMAIL` to a confirmed `@pbintegrations.com` reply mailbox. Set `NEXT_PUBLIC_CONTACT_EMAIL` to a confirmed public `@pbintegrations.com` mailbox; it appears in the site and email signature. Leave it blank until the mailbox exists.

Both form APIs reject delivery until `CONTACT_FROM_EMAIL` and the confirmation Reply-To use `@pbintegrations.com`. The internal `CONTACT_NOTIFICATION_EMAIL` may be any trusted inbox and remains shared by consultation and private intake.

Resend test mode can be used during development, but it restricts delivery to approved test recipients. The form never reports mock success: the internal message must be accepted by Resend before the visitor reaches the thank-you page.

## 2. Cloudflare Turnstile

1. In Cloudflare, create a Turnstile widget for the website.
2. Add `piercebusinessintegrations.com`, its `www` alias if used, and any preview hostnames to the widget’s hostname list. The old domain may remain during migration.
3. Use the managed widget mode.
4. Copy the public site key to `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
5. Copy the secret key to the server-only `TURNSTILE_SECRET_KEY` variable.

For local development, Cloudflare’s documented always-pass test keys are `1x00000000000000000000AA` for the site key and `1x0000000000000000000000000000000AA` for the secret. Do not use production Turnstile secrets in ordinary local development. Spam protection is never silently bypassed in production or development.

## 3. Local development

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` so origin validation accepts the local site.
3. Configure Cloudflare test keys.
4. Configure a Resend test key and a permitted development recipient.
5. Run `npm run dev` and submit through `/contact`.

Without valid Turnstile and Resend configuration, the form displays a delivery error and does not redirect or create a conversion.

## 4. Vercel deployment

Add every variable from `.env.example` in the Vercel project’s Environment Variables settings. Secrets must not use the `NEXT_PUBLIC_` prefix. Configure Production and Preview values deliberately, then redeploy so server functions and the browser bundle receive the new configuration.

Required production variables:

- `NEXT_PUBLIC_SITE_URL=https://piercebusinessintegrations.com`
- `NEXT_PUBLIC_CONTACT_EMAIL` (a verified public `@pbintegrations.com` mailbox)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`
- `CONTACT_NOTIFICATION_EMAIL`
- `CONTACT_FROM_EMAIL`
- `CONTACT_REPLY_EMAIL`

## 5. Production verification

1. Deploy after the domain, widget, and environment variables are configured.
2. Open the production site with a test UTM query string.
3. Navigate to Contact and submit a real test inquiry.
4. Confirm the internal email arrives and its Reply-To points to the submitted address.
5. Confirm the visitor confirmation email arrives.
6. Confirm the redirect reaches `/thank-you`.
7. Confirm one `generate_lead` event appears in GA4 DebugView or Realtime, without name, email, phone, business, message, or website values.
8. Refresh `/thank-you` and confirm no second conversion is recorded.
9. Confirm the sender, Reply-To, public contact link, and email signature use the intended `@pbintegrations.com` mailbox. The existing `.env.local` may still contain old-domain addresses and must be updated separately.

## Attribution

The first landing pathname, document referrer, UTM parameters, GCLID, MSCLKID, and FBCLID are retained in `sessionStorage` for the current browser session. They are attached to a successful inquiry for internal context. Only service interest, budget, and a non-sensitive lead-source label may be sent with the GA4 conversion event.
