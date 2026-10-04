import assert from "node:assert/strict";
import { test } from "node:test";
import { isPrivateSearchHost } from "../src/lib/seo";

test("search host policy protects the client and preview hosts without blocking the public domain", () => {
  for (const host of [
    "client.piercebusinessintegrations.com",
    "BETA.PIERCEBUSINESSINTEGRATIONS.COM:3000",
    "pbi-project-git-beta-example.vercel.app",
  ]) {
    assert.equal(isPrivateSearchHost(host), true, host);
  }
  for (const host of [
    "piercebusinessintegrations.com",
    "www.piercebusinessintegrations.com",
    "localhost:3000",
    "example.vercel.app.example.com",
    "client.piercebusinessintegrations.com.example.com",
    null,
  ]) {
    assert.equal(isPrivateSearchHost(host), false, String(host));
  }
});
