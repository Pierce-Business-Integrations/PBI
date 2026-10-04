#!/usr/bin/env node

// GET-only launch audit. Run against localhost or repeat against production
// after deployment: node scripts/check-seo.mjs https://piercebusinessintegrations.com
import http from "node:http";
import https from "node:https";

const productionOrigin = "https://piercebusinessintegrations.com";
const publicPaths = [
  "/",
  "/services",
  "/services/automation",
  "/services/web-design",
  "/services/website-care",
  "/services/advertising",
  "/how-we-work",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];
const privatePaths = [
  "/api/",
  "/project-intake",
  "/portal",
  "/account",
  "/sign-in",
  "/sign-up",
  "/auth",
];
const titles = new Map();
const descriptions = new Map();
const failures = [];
let passes = 0;
let homepage;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function decodeEntities(value) {
  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi,
    (entity, code) => {
      if (code.startsWith("#")) {
        const point =
          code[1].toLowerCase() === "x"
            ? Number.parseInt(code.slice(2), 16)
            : Number.parseInt(code.slice(1), 10);
        return point <= 0x10ffff ? String.fromCodePoint(point) : entity;
      }
      return { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" }[
        code.toLowerCase()
      ];
    },
  );
}

function attributes(tag) {
  const values = {};
  for (const match of tag.matchAll(
    /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
  )) {
    values[match[1].toLowerCase()] = decodeEntities(
      match[2] ?? match[3] ?? match[4],
    );
  }
  return values;
}

function documentInfo(body) {
  const html = body.toString("utf8");
  const content = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const metadata = [...content.matchAll(/<meta\b[^>]*>/gi)].map((match) =>
    attributes(match[0]),
  );
  const links = [...content.matchAll(/<link\b[^>]*>/gi)].map((match) =>
    attributes(match[0]),
  );
  const plainText = (value) =>
    decodeEntities(value.replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
  return {
    title: plainText(
      content.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "",
    ),
    headings: [...content.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(
      (match) => plainText(match[1]),
    ),
    meta: (name) =>
      metadata
        .filter(
          (item) => (item.name ?? item.property ?? "").toLowerCase() === name,
        )
        .map((item) => item.content ?? ""),
    links,
    jsonLd: [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
      .filter((match) => attributes(match[1]).type === "application/ld+json")
      .map((match) => match[2]),
  };
}

function get(url, host) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": "PBI-SEO-Launch-Audit/1.0",
          "Accept-Encoding": "identity",
          ...(host ? { Host: host } : {}),
        },
      },
      (response) => {
        const chunks = [];
        let bytes = 0;
        response.on("data", (chunk) => {
          bytes += chunk.length;
          if (bytes > 20 * 1024 * 1024) {
            response.destroy(new Error("Response exceeded 20 MB"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("error", reject);
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    request.setTimeout(15000, () =>
      request.destroy(new Error("GET timed out after 15 seconds")),
    );
    request.on("error", reject);
    request.end();
  });
}

async function check(label, action) {
  try {
    await action();
    passes += 1;
    console.log(`PASS ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${label}: ${message}`);
    console.error(`FAIL ${label}: ${message}`);
  }
}

function noindex(response, page) {
  return /\bnoindex\b/i.test(
    [
      response.headers["x-robots-tag"] ?? "",
      ...page.meta("robots"),
      ...page.meta("googlebot"),
    ].join(","),
  );
}

function canonicalUrl(path) {
  return new URL(path, productionOrigin).href;
}

function assertPng(response, width, height) {
  assert(response.status === 200, `Expected 200, received ${response.status}`);
  assert(
    /^image\/png\b/i.test(response.headers["content-type"] ?? ""),
    "Expected image/png",
  );
  assert(
    response.body.length >= 24 &&
      response.body
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "Invalid PNG signature",
  );
  assert(
    response.body.toString("ascii", 12, 16) === "IHDR",
    "PNG is missing its image header",
  );
  if (width && height) {
    assert(
      response.body.readUInt32BE(16) === width &&
        response.body.readUInt32BE(20) === height,
      `Expected ${width} × ${height} PNG`,
    );
  }
}

async function main() {
  assert(
    process.argv.length <= 3,
    "Usage: node scripts/check-seo.mjs [http(s)://origin]",
  );
  const base = new URL(process.argv[2] ?? "http://localhost:3000");
  assert(
    ["http:", "https:"].includes(base.protocol),
    "Use an http:// or https:// URL",
  );
  assert(
    !base.username &&
      !base.password &&
      base.pathname === "/" &&
      !base.search &&
      !base.hash,
    "Supply an origin without credentials, a path, query, or fragment",
  );
  const fetchPath = (path, host) => get(new URL(path, base), host);
  console.log(`SEO GET-only audit: ${base.origin}\n`);

  await check(
    "Sitemap: 11 canonical public URLs and valid modification dates",
    async () => {
      const response = await fetchPath("/sitemap.xml");
      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`,
      );
      assert(
        /(?:application|text)\/[^;]*xml\b/i.test(
          response.headers["content-type"] ?? "",
        ),
        "Sitemap must be served as XML",
      );
      const xml = response.body.toString("utf8");
      assert(
        /<urlset\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/i.test(
          xml,
        ) && /<\/urlset>\s*$/.test(xml),
        "Missing valid sitemap urlset wrapper",
      );
      const entries = [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/g)];
      assert(
        entries.length === publicPaths.length,
        `Expected ${publicPaths.length} URLs, found ${entries.length}`,
      );
      const expected = new Set(publicPaths.map(canonicalUrl));
      for (const [, entry] of entries) {
        const locations = [...entry.matchAll(/<loc>([^<]+)<\/loc>/g)];
        assert(
          locations.length === 1,
          "Each sitemap entry needs exactly one loc",
        );
        const url = new URL(decodeEntities(locations[0][1]));
        assert(
          url.origin === productionOrigin && !url.search && !url.hash,
          `Sitemap URL must use the production HTTPS apex: ${url.href}`,
        );
        assert(
          expected.delete(url.href),
          `Unexpected or repeated sitemap URL: ${url.href}`,
        );
        const date = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
        assert(
          date &&
            /^\d{4}-\d{2}-\d{2}(?:T[^\s]+)?$/.test(date) &&
            Number.isFinite(Date.parse(date)),
          `Invalid or absent lastmod for ${url.pathname}`,
        );
        assert(
          Date.parse(date) <= Date.now(),
          `Future lastmod for ${url.pathname}`,
        );
      }
      assert(
        expected.size === 0,
        `Missing sitemap URLs: ${[...expected].join(", ")}`,
      );
    },
  );

  for (const path of publicPaths) {
    await check(
      `Public page ${path}: heading, metadata, social tags, JSON-LD, indexing`,
      async () => {
        const response = await fetchPath(path);
        assert(
          response.status === 200,
          `Expected 200, received ${response.status}`,
        );
        assert(
          /^text\/html\b/i.test(response.headers["content-type"] ?? ""),
          "Expected HTML",
        );
        const page = documentInfo(response.body);
        if (path === "/") homepage = page;
        assert(
          page.headings.length === 1 && page.headings[0],
          "Expected one nonempty H1",
        );
        assert(page.title, "Missing title");
        assert(
          !titles.has(page.title),
          `Title duplicates ${titles.get(page.title)}`,
        );
        titles.set(page.title, path);
        const description = page.meta("description");
        assert(
          description.length === 1 && description[0].trim(),
          "Expected one nonempty description",
        );
        assert(
          !descriptions.has(description[0]),
          `Description duplicates ${descriptions.get(description[0])}`,
        );
        descriptions.set(description[0], path);
        const canonical = page.links.filter((link) => link.rel === "canonical");
        assert(
          canonical.length === 1 &&
            new URL(canonical[0].href).href === canonicalUrl(path),
          "Canonical must equal the clean production page URL",
        );
        const ogUrl = page.meta("og:url");
        assert(
          ogUrl.length === 1 && new URL(ogUrl[0]).href === canonicalUrl(path),
          "Incorrect Open Graph URL",
        );
        for (const key of [
          "og:title",
          "og:description",
          "og:image",
          "twitter:card",
          "twitter:image",
        ]) {
          assert(
            page.meta(key).some((value) => value.trim()),
            `Missing ${key}`,
          );
        }
        for (const key of ["og:image", "twitter:image"]) {
          assert(
            page
              .meta(key)
              .every((value) => new URL(value).origin === productionOrigin),
            `${key} must use the production HTTPS apex`,
          );
        }
        assert(!noindex(response, page), "Public page is marked noindex");
        assert(
          !/\bnofollow\b/i.test(
            [
              ...page.meta("robots"),
              ...page.meta("googlebot"),
              response.headers["x-robots-tag"] ?? "",
            ].join(","),
          ),
          "Public page is marked nofollow",
        );
        assert(page.jsonLd.length > 0, "Missing structured data");
        for (const block of page.jsonLd) {
          const value = JSON.parse(block);
          assert(
            value && typeof value === "object",
            "JSON-LD must contain an object or array",
          );
        }
      },
    );
  }

  await check(
    "Social image: declared route returns a 1200 × 630 PNG",
    async () => {
      assert(homepage, "Homepage did not load");
      const url = new URL(homepage.meta("og:image")[0]);
      assertPng(await fetchPath(`${url.pathname}${url.search}`), 1200, 630);
    },
  );
  await check("Favicon: declared icon route returns a PNG", async () => {
    assert(homepage, "Homepage did not load");
    const icon = homepage.links.find((link) =>
      /(?:^|\s)icon(?:\s|$)/.test(link.rel ?? ""),
    );
    assert(icon?.href, "Missing icon link");
    const url = new URL(icon.href, base);
    assertPng(await fetchPath(`${url.pathname}${url.search}`));
  });
  await check(
    "Contact tracking query keeps a clean canonical URL",
    async () => {
      const response = await fetchPath(
        "/contact?utm_source=seo-check&utm_medium=test",
      );
      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`,
      );
      const canonical = documentInfo(response.body).links.filter(
        (link) => link.rel === "canonical",
      );
      assert(
        canonical.length === 1 &&
          new URL(canonical[0].href).href === canonicalUrl("/contact"),
        "Tracking query leaked into the canonical",
      );
    },
  );
  await check(
    "Old pricing URL permanently redirects with its query intact",
    async () => {
      const response = await fetchPath("/pricing?seo_check=1");
      assert(
        response.status === 308,
        `Expected 308, received ${response.status}`,
      );
      const destination = new URL(response.headers.location ?? "", base);
      assert(
        destination.pathname === "/how-we-work" &&
          destination.searchParams.get("seo_check") === "1",
        "Pricing redirect did not preserve its destination and query",
      );
    },
  );
  for (const path of ["/clients", "/thank-you"]) {
    await check(`Hidden or utility page ${path} is noindex`, async () => {
      const response = await fetchPath(path);
      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`,
      );
      assert(noindex(response, documentInfo(response.body)), "Missing noindex");
    });
  }
  await check("Unknown URL returns 404 rather than a soft 200", async () => {
    const response = await fetchPath("/__seo-check-page-that-does-not-exist");
    assert(
      response.status === 404,
      `Expected 404, received ${response.status}`,
    );
  });
  await check(
    "Public robots.txt allows marketing pages and names the production sitemap",
    async () => {
      const response = await fetchPath("/robots.txt");
      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`,
      );
      const body = response.body.toString("utf8");
      assert(
        /^User-Agent:\s*\*\s*$/im.test(body),
        "Missing general crawler rule",
      );
      assert(
        /^Allow:\s*\/\s*$/im.test(body) && !/^Disallow:\s*\/\s*$/im.test(body),
        "Public crawling is blocked",
      );
      assert(
        body.match(/^Sitemap:\s*(\S+)\s*$/im)?.[1] ===
          `${productionOrigin}/sitemap.xml`,
        "Incorrect sitemap declaration",
      );
      const excluded = [...body.matchAll(/^Disallow:\s*(\S+)\s*$/gim)].map(
        (match) => match[1],
      );
      for (const path of publicPaths) {
        assert(
          !excluded.some((value) => path.startsWith(value)),
          `Public route ${path} matches a robots exclusion`,
        );
      }
      for (const path of privatePaths) {
        assert(
          excluded.some((value) => value === path || value === `${path}/`),
          `Private route ${path} is absent from robots exclusions`,
        );
      }
    },
  );

  if (["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) {
    for (const host of [
      "client.piercebusinessintegrations.com",
      "beta.piercebusinessintegrations.com",
      "example.vercel.app",
    ]) {
      await check(
        `Local host policy ${host}: robots blocks crawling and landing page is noindex`,
        async () => {
          const robots = await fetchPath("/robots.txt", host);
          assert(
            robots.status === 200,
            `Robots expected 200, received ${robots.status}`,
          );
          assert(
            /^Disallow:\s*\/\s*$/im.test(robots.body.toString("utf8")),
            "Nonpublic host must disallow all crawling",
          );
          let landing = await fetchPath("/", host);
          // The client root redirects to /portal before config headers run.
          // Inspect the actual landing response instead of indexing a redirect.
          for (
            let hops = 0;
            landing.status >= 300 && landing.status < 400;
            hops += 1
          ) {
            assert(
              hops < 4 && landing.headers.location,
              "Invalid or looping host redirect",
            );
            const destination = new URL(landing.headers.location, base);
            assert(
              destination.origin === base.origin,
              "Host probe redirected outside the local server",
            );
            landing = await fetchPath(
              `${destination.pathname}${destination.search}`,
              host,
            );
          }
          assert(
            landing.status === 200,
            `Landing expected 200, received ${landing.status}`,
          );
          assert(
            /\bnoindex\b/i.test(landing.headers["x-robots-tag"] ?? ""),
            "Nonpublic host landing page must send X-Robots-Tag: noindex",
          );
        },
      );
    }
  }

  console.log(`\n${passes} checks passed; ${failures.length} failed.`);
  if (failures.length) {
    process.exitCode = 1;
  } else {
    console.log(
      "Technical SEO smoke checks passed. Search-console verification and indexing remain external launch steps.",
    );
  }
}

main().catch((error) => {
  console.error(
    `FAIL Audit could not start: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
