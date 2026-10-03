import assert from "node:assert/strict";
import { test } from "node:test";
import {
  currentStageIndex,
  invoiceDraftSchema,
  stagePlanSchema,
  type StageInput,
} from "../src/lib/portal/stages";

const stage = (status: StageInput["status"]): StageInput => ({
  id: crypto.randomUUID(),
  title: "Discovery",
  description: "Review the current workflow.",
  deliverables: ["Discovery summary"],
  status,
});

test("stage plans preserve one current stage and an ordered completion sequence", () => {
  const stages = [
    stage("complete"),
    stage("waiting_on_client"),
    stage("planned"),
  ];
  assert.equal(
    currentStageIndex(stagePlanSchema.parse({ version: 1, stages }).stages),
    1,
  );
  assert.throws(
    () =>
      stagePlanSchema.parse({
        version: 1,
        stages: [stage("in_progress"), stage("in_progress")],
      }),
    /Only one stage/,
  );
  assert.throws(
    () =>
      stagePlanSchema.parse({
        version: 1,
        stages: [stage("planned"), stage("complete")],
      }),
    /Completed stages/,
  );
  assert.throws(
    () =>
      stagePlanSchema.parse({
        version: 1,
        stages: [stage("planned"), stage("in_progress")],
      }),
    /Complete earlier stages/,
  );
  assert.throws(
    () => stagePlanSchema.parse({ version: 1, stages: [stages[0], stages[0]] }),
    /Stage IDs must be unique/,
  );
  assert.equal(currentStageIndex([stage("complete"), stage("planned")]), 1);
  assert.equal(currentStageIndex([stage("complete"), stage("complete")]), 1);
});

test("stage invoices require valid dates, positive cents, and a real stage identifier", () => {
  assert.throws(() =>
    invoiceDraftSchema.parse({ amountCents: 0, due: "2026-10-16" }),
  );
  assert.throws(() =>
    invoiceDraftSchema.parse({ amountCents: 50000, due: "2026-02-30" }),
  );
  assert.throws(() =>
    invoiceDraftSchema.parse({
      amountCents: 50000,
      due: "2026-10-16",
      stageId: "wrong",
    }),
  );
  assert.equal(
    invoiceDraftSchema.parse({
      amountCents: 50000,
      due: "2026-10-16",
      stageId: crypto.randomUUID(),
    }).amountCents,
    50000,
  );
});
