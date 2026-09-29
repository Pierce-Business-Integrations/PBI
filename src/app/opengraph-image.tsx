import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Pierce Business Integrations — Modern solutions. Local partnership.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(
    join(process.cwd(), "public", "logos", "pbi-half-lockup-dark.png"),
  );
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "54px 68px",
        background: "#1f1f1d",
        color: "#f7f3ed",
        border: "16px solid #f7f3ed",
      }}
    >
      {/* The supplied lockup is rendered at its native aspect ratio. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} alt="" width={430} height={150} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "Georgia",
            fontSize: 70,
            lineHeight: 1.08,
          }}
        >
          <span>Understand the problem.</span>
          <span>Build what works.</span>
        </div>
        <div style={{ fontSize: 25, color: "#a8b6a6" }}>
          Practical systems and direct partnership for North Georgia businesses.
        </div>
      </div>
      <div style={{ fontSize: 19, color: "#d3b986", letterSpacing: 2 }}>
        MODERN SOLUTIONS. LOCAL PARTNERSHIP.
      </div>
    </div>,
    size,
  );
}
