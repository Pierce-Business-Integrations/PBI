# Vercel Analytics Setup

The site includes the Vercel Web Analytics component for automatic page views and custom events. In the Vercel project dashboard, open **Analytics** and enable Web Analytics for the production project. Redeploy after enabling it.

Custom events currently tracked:

- `Consultation CTA Clicked`: includes the CTA placement and destination.
- `Services Overview Clicked`: homepage service-overview intent.
- `Service Explored`: includes the selected service slug.
- `How We Work Navigation Clicked`: includes the placement and process-page destination. Public pricing/plan events are retired with the price-list page; historical events remain in Analytics.
- `Contact Form Started`: fires on the first form interaction.
- `Contact Form Attempted`: fires after client validation succeeds and delivery is attempted.
- `Inquiry Accepted`: fires server-side only after the inquiry email is accepted; includes service category, budget band, and non-personal lead source.

No form names, email addresses, phone numbers, business names, messages, or free-text referral values are sent to Vercel Analytics.

Vercel currently limits custom-event reporting to eligible paid plans. Automatic page-view analytics remains handled by the installed `@vercel/analytics` integration.
