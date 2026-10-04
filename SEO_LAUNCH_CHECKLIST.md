# SEO Launch Checklist

## Prepared in the repository

Reviewed October 3, 2026. The canonical public origin is `https://piercebusinessintegrations.com`, defined in `src/lib/site.ts`.

Validation completed against the local production build: ESLint and Next.js build passed, all 37 regression tests passed, and all 23 GET-only SEO checks passed. No deployment, sitemap submission, or search-account changes were performed.

- The sitemap contains 11 public pages: home, Solutions, the four service pages, How We Work, About, Contact, Privacy, and Terms. It excludes Pricing, Clients, portal/auth routes, project intake, and confirmation pages.
- Public pages have distinct titles and descriptions, production canonical URLs, Open Graph/Twitter metadata, and one server-rendered H1. PBI social images and favicon use the supplied branding.
- Organization, WebSite, Service, breadcrumb, and How We Work FAQ structured data describe the actual business and visible content. No reviews, results, public prices, or unverified business details are invented.
- `/pricing` permanently redirects to `/how-we-work`. Old-domain and `www` redirects preserve paths and query strings. The old and `www` redirects were also observed working on the existing live deployment; recheck after publishing.
- Preview builds, `beta.piercebusinessintegrations.com`, Vercel deployment aliases, and the client subdomain have crawl restrictions and `noindex` response headers. Production marketing pages remain crawlable. Clients and confirmation pages have `noindex`; private routes also retain their access controls.
- The current hero uses small responsive WebP assets, illustrations use SVG, portraits use responsive image optimization, and fonts are self-hosted with `swap`.

Hiding Clients is controlled by `site.clientPortalPublic`. Keep it `false` until the client workflow is ready. `noindex` is a search directive, not an access-control mechanism. The Clients landing remains crawlable so a search engine can read its exclusion; it is absent from the sitemap and public navigation. [Google's noindex documentation](https://developers.google.com/search/docs/crawling-indexing/block-indexing) explains why blocking a URL in robots.txt alone does not remove it from search results.

## Validate before and after publishing

Before publishing, run `npm run lint`, `npm test`, `npm run build`, and `npm run check:seo` with the local server on port 3000. The SEO check makes GET requests only and checks the sitemap, rendered metadata, structured data, public indexing, excluded pages, image endpoints, redirects, 404 behavior, and local alternate-host restrictions.

After the deployment is complete, run:

```powershell
npm run check:seo -- https://piercebusinessintegrations.com
```

Publish to the Vercel **Production** environment. This checkout is currently on `beta`; pushing a preview branch alone does not publish an indexable production site. Do not submit localhost, a beta URL, or a Vercel preview URL to search engines. Make sure the production hostname routes to the intended deployment and that Vercel Deployment Protection is not blocking the public site.

Confirm `NEXT_PUBLIC_SITE_URL=https://piercebusinessintegrations.com` for form-origin handling. This variable does not override the canonical origin in `src/lib/site.ts`. Keep contact delivery and verified `@pbintegrations.com` mailbox configuration intact.

## Google and Bing setup after deployment

1. In [Google Search Console](https://search.google.com/search-console), add a **Domain** property for `piercebusinessintegrations.com` and complete its DNS verification. This covers both apex and `www`. If you choose a URL-prefix property instead, optional `GOOGLE_SITE_VERIFICATION` supports Google's HTML-tag verification: store only the `content` value in Vercel and redeploy. DNS verification does not need this variable.
2. Submit `https://piercebusinessintegrations.com/sitemap.xml` in Search Console's Sitemaps report. Use URL Inspection on the homepage, systems service page, and How We Work; confirm the production canonical and request indexing. [Google's sitemap instructions](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) cover submission and processing.
3. Add the production site to [Bing Webmaster Tools](https://www.bing.com/webmasters). You can import the verified Search Console property and sitemap, or verify manually and submit the same sitemap. Optional `BING_SITE_VERIFICATION` renders Bing's `msvalidate.01` meta tag; store only its `content` value and redeploy if using HTML verification. [Bing's verification guide](https://www2.bing.com/webmasters/help/add-and-verify-site-12184f8b) describes both approaches.
4. If migrating an already indexed `piercewebsolutions.com` property, keep its DNS, TLS, and path-preserving redirects active. Verify both old and new properties, then use Search Console's Change of Address when eligible. See [Google's site-move guide](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).
5. Run [PageSpeed Insights](https://pagespeed.web.dev/) after the production cache is warm. Check the homepage, a service page, How We Work, and Contact on mobile and desktop. Field Core Web Vitals depend on real traffic and cannot be certified from a local build.
6. Check structured data with [Schema Markup Validator](https://validator.schema.org/) and eligible features with [Google's Rich Results Test](https://search.google.com/test/rich-results). Valid Organization/Service/FAQ markup does not promise a rich result.
7. Update Google Business Profile, advertising destinations, social profiles, and important third-party links to the current brand and canonical domain. Monitor Search Console and Bing for crawl errors, duplicate canonicals, impressions, and indexing status.

Search engines choose when and whether to index a page. Passing the technical checks and submitting a sitemap does not guarantee indexing or rankings.

## Ongoing maintenance

- Update `site.contentUpdatedAt` in `src/lib/site.ts` after substantive site-wide content changes so sitemap dates remain accurate.
- Keep page titles, descriptions, canonicals, and one clear H1 aligned whenever a page's purpose changes.
- Add case studies only when the client, Jacob's role, and any reported result can be attributed accurately.
- Recheck image dimensions, alternative text, keyboard navigation, form delivery, and Core Web Vitals when adding a new page or major component.

## Local organic visibility

- Maintain an accurate Google Business Profile as a service-area business. Do not publish a customer-facing address unless customers are actually served there.
- Keep the business name, website, email, service area, and any future phone number consistent across reputable directories.
- Ask real clients for honest Google reviews without incentives or review gating.
- Publish useful project case studies with the client’s permission, including the business problem, work completed, and measurable outcome when available.
- Build relationships and legitimate links through local chambers, professional groups, partnerships, sponsorships, and community organizations.
- Avoid thin pages that merely swap county or city names. Create a location page only when it contains genuinely distinct, useful information.

Technical SEO creates eligibility and clarity. Competitive rankings also depend on relevance, reputation, links, reviews, content quality, and time.
