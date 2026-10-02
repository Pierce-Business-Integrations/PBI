import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderPortalDocument } from "../src/lib/portal/documents";
import { parseProjectDetails } from "../src/lib/portal/schema";

async function main() {
  const dir = join(process.cwd(), ".data", "pdf-qa");
  await mkdir(dir, { recursive: true });
  const data = parseProjectDetails(
    JSON.parse(
      await readFile(
        join(process.cwd(), "docs", "client-portal", "example-project.json"),
        "utf8",
      ),
    ),
  );
  const long = parseProjectDetails({
    ...data,
    scope: Array.from({ length: 25 }, (_, index) => ({
      heading: `Workstream ${index + 1}`,
      description:
        "Review the workflow, document a clear decision, and implement the approved improvement. ".repeat(
          6,
        ),
    })),
  });
  await writeFile(
    join(dir, "proposal-short.pdf"),
    await renderPortalDocument("proposal", data, 1),
  );
  await writeFile(
    join(dir, "proposal-long.pdf"),
    await renderPortalDocument("proposal", long, 2),
  );
  await writeFile(
    join(dir, "agreement.pdf"),
    await renderPortalDocument("agreement", data, 1),
  );
  await writeFile(
    join(dir, "invoice.pdf"),
    await renderPortalDocument("invoice", data, 1, {
      number: "DEMO-001",
      amountCents: 250000,
      due: "2026-10-30",
    }),
  );
  console.log(dir);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
