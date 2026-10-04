import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { mock, test } from "node:test";

test("SignWell reserves once, enforces signer identity, and reconciles private immutable completion", async () => {
  process.env.PORTAL_DATABASE_URL = "file::memory:";
  delete process.env.SUPABASE_DB_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SIGNWELL_API_KEY = "isolated-test-api-key";
  process.env.SIGNWELL_WEBHOOK_ID = "isolated-test-webhook";
  process.env.PBI_SIGNER_EMAIL = "owner@example.test";
  const { portalDb, id, now } = await import("../../src/lib/portal/db");
  const { createProject, createDocument, getProjectBundle, getPrivateFile } =
    await import("../../src/lib/portal/repository");
  const {
    startSigning,
    signerUrl,
    acceptSignWellEvent,
    processSignWellEvent,
    voidSigning,
    retrySignWellEvents,
  } = await import("../../src/lib/portal/signing");
  const db = await portalDb();
  const owner = {
    userId: "8a2f9a26-63fd-4293-8dde-4b7b8b3c6201",
    simulated: false,
  };
  const clientA = {
    userId: "8a2f9a26-63fd-4293-8dde-4b7b8b3c6202",
    simulated: false,
  };
  const clientB = {
    userId: "8a2f9a26-63fd-4293-8dde-4b7b8b3c6203",
    simulated: false,
  };
  let providerCalls = 0;
  let ready = false;
  let pdfReady = false;
  let wrongDocument = false;
  let verifiedEmail = false;
  let resource: Record<string, unknown>;
  let agreementBytes: Uint8Array;
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, options?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("https://supabase.invalid/auth/v1/admin/users/"))
        return Response.json({
          id: clientA.userId,
          email: "client-a@example.test",
          email_confirmed_at: verifiedEmail ? now() : null,
        });
      assert.ok(
        url.startsWith("https://www.signwell.com/api/v1/"),
        "Tests must never reach a real provider",
      );
      if (options?.method === "POST") {
        const body = JSON.parse(String(options.body));
        providerCalls++;
        assert.equal(body.test_mode, true);
        assert.equal(body.embedded_signing, true);
        assert.equal(body.reminders, false);
        assert.ok(
          body.recipients.every(
            (recipient: { send_email: boolean }) =>
              recipient.send_email === false,
          ),
        );
        assert.ok(
          body.fields[0].every((field: { recipient_id: string }) =>
            body.recipients.some(
              (person: { id: string }) => person.id === field.recipient_id,
            ),
          ),
        );
        resource = {
          id: "17f0b105-451b-4507-b010-a69fd82b852e",
          status: "Sent",
          test_mode: true,
          metadata: body.metadata,
          recipients: body.recipients.map((person: object) => ({
            ...person,
            embedded_signing_url: "https://www.signwell.com/docs/test-only/",
          })),
        };
        return Response.json(resource);
      }
      if (url.includes("completed_pdf"))
        return pdfReady
          ? new Response(Buffer.from(agreementBytes), {
              headers: { "Content-Type": "application/pdf" },
            })
          : new Response("pending", { status: 404 });
      if (options?.method === "DELETE")
        throw new Error("Completed agreements must never be deleted");
      return Response.json({
        ...resource,
        status: ready ? "Completed" : "Sent",
        metadata: wrongDocument
          ? { portal_document_id: "wrong", portal_sign_id: "wrong" }
          : resource.metadata,
      });
    },
  );
  try {
    const org = id();
    await db.execute({
      sql: "INSERT INTO organizations VALUES (?,?,?,?)",
      args: [org, "Test owner", 1, now()],
    });
    await db.execute({
      sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
      args: [id(), org, owner.userId, "admin", now()],
    });
    const fixture = JSON.parse(
      await readFile("docs/client-portal/example-project.json", "utf8"),
    );
    fixture.authorizedSigners = [
      {
        name: "Client A",
        title: "Owner",
        email: "client-a@example.test",
        order: 1,
      },
    ];
    fixture.requiresPbiSignature = false;
    const projectId = await createProject(owner, fixture);
    const bundle = (await getProjectBundle(projectId, owner))!;
    await db.execute({
      sql: "INSERT INTO memberships VALUES (?,?,?,?,?)",
      args: [
        id(),
        bundle.project.organization_id,
        clientA.userId,
        "client",
        now(),
      ],
    });
    const { documentId } = await createDocument(owner, projectId, "agreement");
    await db.execute({
      sql: "UPDATE documents SET status='approved' WHERE id=?",
      args: [documentId],
    });
    const document = (await getProjectBundle(projectId, owner))!.documents[0];
    agreementBytes = (await getPrivateFile(owner, String(document.file_id)))!
      .content;
    const results = await Promise.allSettled([
      startSigning(owner, documentId),
      startSigning(owner, documentId),
    ]);
    assert.equal(providerCalls, 1);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    const signId = (
      results.find(
        (result) => result.status === "fulfilled",
      ) as PromiseFulfilledResult<{ signId: string }>
    ).value.signId;
    await assert.rejects(() => signerUrl(clientB, signId), /not found/);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.invalid";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "public-test-key";
    process.env.SUPABASE_SECRET_KEY = "private-test-key";
    await assert.rejects(() => signerUrl(clientA, signId), /Verify your email/);
    verifiedEmail = true;
    assert.equal(
      await signerUrl(clientA, signId),
      "https://www.signwell.com/docs/test-only/",
    );
    function event(type: string) {
      const time = Math.floor(Date.now() / 1000);
      return {
        event: {
          type,
          time,
          hash: createHmac("sha256", process.env.SIGNWELL_WEBHOOK_ID!)
            .update(`${type}@${time}`)
            .digest("hex"),
        },
        data: { object: { id: resource.id, status: "Completed" } },
      };
    }
    await assert.rejects(
      () =>
        acceptSignWellEvent({
          ...event("document_completed"),
          event: { ...event("document_completed").event, hash: "0".repeat(64) },
        }),
      /Invalid/,
    );
    const pending = await acceptSignWellEvent(event("document_viewed"));
    await processSignWellEvent(pending);
    assert.equal(
      (await getProjectBundle(projectId, clientA))!.signing[0].status,
      "pending",
      "Unsigned webhook object status must not control completion",
    );
    ready = true;
    const completion = await acceptSignWellEvent(event("document_completed"));
    wrongDocument = true;
    await assert.rejects(
      () => processSignWellEvent(completion),
      /does not match/,
    );
    wrongDocument = false;
    await assert.rejects(
      () => processSignWellEvent(completion),
      /still being prepared/,
    );
    assert.equal(
      (await getProjectBundle(projectId, clientA))!.signing[0].status,
      "awaiting_file",
    );
    pdfReady = true;
    assert.deepEqual(await retrySignWellEvents(), {
      completed: 1,
      remaining: 0,
    });
    const completed = (await getProjectBundle(projectId, clientA))!;
    assert.equal(completed.signing[0].status, "completed");
    const completedFile = String(completed.signing[0].completed_file_id);
    assert.ok(await getPrivateFile(clientA, completedFile));
    assert.equal(await getPrivateFile(clientB, completedFile), null);
    assert.deepEqual(
      (await getPrivateFile(owner, String(document.file_id)))!.content,
      agreementBytes,
    );
    assert.equal(await processSignWellEvent(completion), "duplicate");
    const delayed = await acceptSignWellEvent(event("document_sent"));
    ready = false;
    await processSignWellEvent(delayed);
    assert.equal(
      (await getProjectBundle(projectId, clientA))!.signing[0].status,
      "completed",
    );
    await assert.rejects(() => voidSigning(owner, signId), /No cancellable/);
  } finally {
    fetchMock.mock.restore();
    db.close();
  }
});
