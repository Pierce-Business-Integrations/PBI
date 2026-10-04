import type { InStatement, ResultSet } from "@libsql/client";

export type PortalStatement = InStatement;
export interface PortalTransaction {
  execute(statement: PortalStatement): Promise<ResultSet>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  close(): void;
}
export interface PortalDatabase {
  dialect: "sqlite" | "postgres";
  execute(statement: PortalStatement): Promise<ResultSet>;
  batch(statements: PortalStatement[], mode?: "write"): Promise<ResultSet[]>;
  transaction(mode?: "write"): Promise<PortalTransaction>;
  close(): void;
}

// Only bind placeholders are adapted. Queries must be valid in the chosen SQL dialect.
export function postgresParameters(sql: string) {
  let quoted = false;
  let index = 0;
  let result = "";
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'") {
      if (quoted && sql[i + 1] === "'") {
        result += "''";
        i++;
        continue;
      }
      quoted = !quoted;
    }
    result += char === "?" && !quoted ? `$${++index}` : char;
  }
  return result;
}

export function jsonText(
  dialect: PortalDatabase["dialect"],
  column: string,
  path: string[],
) {
  if (
    !/^[a-z_.]+$/.test(column) ||
    path.some((part) => !/^[a-z_]+$/.test(part))
  )
    throw new Error("Invalid JSON query path");
  return dialect === "postgres"
    ? `(${column}::jsonb #>> '{${path.join(",")}}')`
    : `json_extract(${column},'$.${path.join(".")}')`;
}

export function nullEqual(dialect: PortalDatabase["dialect"], column: string) {
  if (!/^[a-z_]+$/.test(column)) throw new Error("Invalid SQL column");
  return `${column} ${dialect === "postgres" ? "IS NOT DISTINCT FROM" : "IS"} ?`;
}
