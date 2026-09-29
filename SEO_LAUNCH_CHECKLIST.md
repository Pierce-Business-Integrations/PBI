# SEO Launch Checklist

## Required after deployment

1. Attach `piercebusinessintegrations.com`, `www.piercebusinessintegrations.com`, `piercewebsolutions.com`, and `www.piercewebsolutions.com` to the Vercel project. Confirm both old hosts permanently redirect to the corresponding new-domain path with query parameters preserved. The repository's Next.js redirects work only for hostnames routed to this deployment.
2. Set `NEXT_PUBLIC_SITE_URL=https://piercebusinessintegrations.com` in Vercel and redeploy. Replace old-domain sender and reply addresses only after the new mail domain and mailbox are verified.
3. Create or verify Google Search Console Domain properties for both domains, using DNS verification. Use Change of Address if the old domain is eligible.
4. Submit `https://piercebusinessintegrations.com/sitemap.xml` in Search Console.
5. Use URL Inspection on the homepage and each core service URL; confirm the declared canonical is the new apex URL and request indexing.
6. Run PageSpeed Insights for the homepage, services, pricing, and contact pages after the production cache is warm. Review both mobile field data and the lab diagnostics.
7. Test the homepage and service structured data with Google's Rich Results Test.
8. Check Search Console weekly for indexing errors, duplicate canonicals, Core Web Vitals, queries, and pages receiving impressions.
9. Add the site to Bing Webmaster Tools and submit the same sitemap.
10. Update Google Business Profile, advertising destinations, social profiles, and any important third-party links to the new public name and domain when ready.

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
