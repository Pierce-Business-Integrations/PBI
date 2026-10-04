import "server-only";
import { Pool, type PoolClient } from "pg";
import type { ResultSet } from "@libsql/client";
import {
  postgresParameters,
  type PortalDatabase,
  type PortalStatement,
  type PortalTransaction,
} from "./database-types";

function query(statement: PortalStatement) {
  const sql = typeof statement === "string" ? statement : statement.sql;
  const args = typeof statement === "string" ? [] : statement.args || [];
  if (!Array.isArray(args))
    throw new Error("Only ordered SQL parameters are supported");
  return {
    text: postgresParameters(sql),
    values: args.map((arg) =>
      arg instanceof Uint8Array ? Buffer.from(arg) : arg,
    ),
  };
}

async function execute(
  client: PoolClient,
  statement: PortalStatement,
): Promise<ResultSet> {
  const result = await client.query(query(statement));
  const rows = result.rows;
  return {
    rows,
    columns: result.fields.map((field) => field.name),
    columnTypes: result.fields.map((field) => String(field.dataTypeID)),
    rowsAffected: result.rowCount || 0,
    lastInsertRowid: undefined,
    toJSON: () => ({ rows, rowsAffected: result.rowCount || 0 }),
  };
}

export function postgresDatabase(connectionString: string): PortalDatabase {
  const connection = new URL(connectionString);
  // URL SSL flags must not override certificate verification configured below.
  for (const name of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    connection.searchParams.delete(name);
  // Copy the transaction pooler URL from Supabase. No named prepared statements or session SETs.
  const pool = new Pool({
    connectionString: connection.toString(),
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: {
      rejectUnauthorized: true,
      ...(process.env.SUPABASE_DB_CA_CERT
        ? { ca: process.env.SUPABASE_DB_CA_CERT.replaceAll("\\n", "\n") }
        : {}),
    },
  });
  pool.on("error", () =>
    console.error("Portal database connection interrupted"),
  );
  async function transaction(): Promise<PortalTransaction> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
      await client.query("SET LOCAL search_path TO pbi_portal, pg_catalog");
      await client.query("SET LOCAL statement_timeout = '15s'");
    } catch (error) {
      client.release(true);
      throw error;
    }
    let ended = false;
    let released = false;
    return {
      execute: (statement) => execute(client, statement),
      async commit() {
        await client.query("COMMIT");
        ended = true;
      },
      async rollback() {
        if (!ended) {
          await client.query("ROLLBACK");
          ended = true;
        }
      },
      close() {
        if (released) return;
        released = true;
        // A caller that forgot rollback must never return an open transaction to the pool.
        client.release(!ended);
      },
    };
  }
  async function batch(statements: PortalStatement[]) {
    const tx = await transaction();
    try {
      const results = [];
      for (const statement of statements)
        results.push(await tx.execute(statement));
      await tx.commit();
      return results;
    } catch (error) {
      await tx.rollback();
      // Keep connection details and raw driver errors out of client responses.
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        error.code === "40001"
      )
        throw new Error(
          "The project changed during this update. Refresh and try again.",
        );
      throw error;
    } finally {
      tx.close();
    }
  }
  return {
    dialect: "postgres",
    transaction,
    batch,
    async execute(statement) {
      return (await batch([statement]))[0];
    },
    close() {
      void pool.end();
    },
  };
}
