import type { Metadata } from "next";

export const site = {
  name: "Pierce Business Integrations",
  tagline: "Modern solutions. Local partnership.",
  url: "https://piercebusinessintegrations.com",
  // Publish an address only after its mailbox has been created and verified.
  email: /^[^\s@]+@pbintegrations\.com$/i.test(
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "",
  )
    ? process.env.NEXT_PUBLIC_CONTACT_EMAIL!.trim()
    : "",
  location: "North Georgia",
  area: "Gwinnett, Hall, Barrow, Forsyth, and surrounding North Georgia communities",
  contentUpdatedAt: "2026-10-02",
  description:
    "Pierce Business Integrations helps North Georgia businesses improve workflows and implement practical systems, integrations, websites, and advertising.",
};

export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = `${site.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          type: "image/png",
          alt: "Pierce Business Integrations: Modern solutions. Local partnership.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export type Service = {
  slug: string;
  number: string;
  shortTitle: string;
  title: string;
  description: string;
  problem: string;
  fit: string;
  intro: string;
  deliverables: string[];
  closing: string;
};

export const services: Service[] = [
  {
    slug: "web-design",
    number: "02",
    shortTitle: "Web Design & Development",
    title: "Web Design & Development for North Georgia Businesses",
    description:
      "Custom websites built to represent your business clearly, perform well, and turn more visitors into real opportunities.",
    problem:
      "An outdated, confusing, or hard-to-manage website can make a capable business look less established than it is and leave prospective customers unsure what to do next.",
    fit: "New businesses establishing a credible presence, established companies ready for a redesign, and service businesses that need focused landing pages or useful integrations.",
    intro:
      "A good website is more than a polished first impression. It should explain what you do, make the next step obvious, and work reliably for customers on every device.",
    deliverables: [
      "New business websites",
      "Website redesigns",
      "Mobile-responsive development",
      "Conversion-focused page structure",
      "Performance and accessibility review",
      "Analytics and conversion tracking",
      "Local SEO foundations",
      "Focused landing pages",
      "Business-tool integrations",
    ],
    closing:
      "Every build is shaped around your business, content, customers, and practical goals, without guarantees about rankings, leads, or perfect scores.",
  },
  {
    slug: "website-care",
    number: "03",
    shortTitle: "Website Care & Support",
    title: "Responsive Website Care After Launch",
    description:
      "Managed hosting, ongoing updates, monitoring, improvements, and direct support after your website launches.",
    problem:
      "Websites need attention after launch. Unchecked forms, stale content, platform updates, and small technical issues can quietly erode customer trust.",
    fit: "Businesses that want a dependable local partner to keep their site current, review its performance, and handle routine technical needs.",
    intro:
      "Website care provides managed hosting, consistent oversight, and a direct point of contact, so small issues are addressed and useful improvements do not get lost in a support queue.",
    deliverables: [
      "Managed website hosting for qualifying websites",
      "SSL certificate management",
      "Uptime and platform monitoring",
      "Software and content updates",
      "Form-delivery checks",
      "Small content changes",
      "Analytics review",
      "Responsive ongoing support",
      "Performance and usability review",
      "Continued improvements",
    ],
    closing:
      "Response targets refer to the initial acknowledgment and assessment during normal business hours. They do not guarantee final resolution within that period.",
  },
  {
    slug: "automation",
    number: "01",
    shortTitle: "Business Systems & Integrations",
    title: "Business Systems & Integrations Built Around Your Work",
    description:
      "Find what slows the work down, improve the process, and build or connect the systems your team actually needs.",
    problem:
      "Work gets harder to manage when information is scattered, decisions are repeated, and people have to bridge gaps between tools by hand.",
    fit: "Growing organizations with an operational bottleneck, disconnected workflow, reporting need, or process that existing software does not handle well.",
    intro:
      "We begin by understanding the work, its costs, and the people involved. The recommendation might be a process change, an existing platform, an integration, automation, or a custom application. The solution should fit the problem and be maintainable by the team using it.",
    deliverables: [
      "Workflow and requirements mapping",
      "Solution architecture and implementation plan",
      "Custom web applications and internal tools",
      "Client, staff, or partner portals",
      "Dashboards and business reporting",
      "Platform selection and integrations",
      "Approval and operational workflows",
      "Focused automation where useful",
      "Launch, documentation, and improvement planning",
    ],
    closing:
      "Every proposal defines the problem, recommended approach, scope, ownership, support needs, and the measures we can reasonably use to assess improvement.",
  },
  {
    slug: "advertising",
    number: "04",
    shortTitle: "Advertising & Lead Generation",
    title: "Advertising Focused on Qualified Leads",
    description:
      "Landing pages, conversion tracking, Google and Meta campaign management, and reporting centered on qualified leads.",
    problem:
      "Campaigns are difficult to improve when the landing experience, tracking, account ownership, and business goals are not aligned.",
    fit: "Businesses with a clear offer, capacity to respond to leads, and a realistic test budget for measurable Google or Meta campaigns.",
    intro:
      "Effective advertising connects campaign planning, focused landing pages, accurate measurement, and ongoing review around outcomes that matter to the business.",
    deliverables: [
      "Google Ads",
      "Meta Ads",
      "Focused landing pages",
      "Conversion tracking",
      "Campaign planning",
      "Budget pacing",
      "Search-term reviews",
      "Clear reporting",
      "Ongoing optimization",
    ],
    closing:
      "Advertising spend is separate from management fees. Results cannot be guaranteed, and client advertising accounts should remain client-owned.",
  },
];

export const featuredServices = [
  services[2],
  services[0],
  services[1],
  services[3],
];
