import "server-only";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { portalDb, now } from "./db";
import type { PortalStatement } from "./database-types";

const bucket = "portal-documents";

export async function preparePrivateFile(file: {
  id: string;
  organizationId: string;
  projectId: string;
  filename: string;
  bytes: Uint8Array;
}) {
  const cloud = (await portalDb()).dialect === "postgres";
  const storagePath = cloud
    ? `${file.organizationId}/${file.projectId}/${file.id}.pdf`
    : null;
  if (storagePath) {
    const { error } = await supabaseAdmin()
      .storage.from(bucket)
      .upload(storagePath, file.bytes, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (error)
      throw new Error("Unable to save the private document. Please try again.");
  }
  const statement: PortalStatement = {
    sql: "INSERT INTO private_files (id,organization_id,project_id,mime_type,filename,sha256,content,created_at,storage_path) VALUES (?,?,?,?,?,?,?,?,?)",
    args: [
      file.id,
      file.organizationId,
      file.projectId,
      "application/pdf",
      file.filename,
      createHash("sha256").update(file.bytes).digest("hex"),
      cloud ? null : file.bytes,
      now(),
      storagePath,
    ],
  };
  return {
    statement,
    async discard() {
      if (storagePath)
        await supabaseAdmin().storage.from(bucket).remove([storagePath]);
    },
  };
}

// Call only after the request's membership/draft checks, or inside a trusted provider worker.
export async function privateFileBytes(row: Record<string, unknown>) {
  let bytes: Uint8Array;
  if (row.storage_path) {
    const { data, error } = await supabaseAdmin()
      .storage.from(bucket)
      .download(String(row.storage_path));
    if (error || !data)
      throw new Error("This document is temporarily unavailable");
    bytes = new Uint8Array(await data.arrayBuffer());
  } else if (row.content instanceof Uint8Array) bytes = row.content;
  else if (row.content instanceof ArrayBuffer)
    bytes = new Uint8Array(row.content);
  else throw new Error("Private document content is missing");
  if (
    row.sha256 &&
    createHash("sha256").update(bytes).digest("hex") !== row.sha256
  )
    throw new Error("Document integrity check failed");
  return bytes;
}
