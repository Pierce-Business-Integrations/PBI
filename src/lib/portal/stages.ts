import { z } from "zod";

export const stageStatusSchema = z.enum([
  "planned",
  "in_progress",
  "waiting_on_client",
  "complete",
]);

export const stageSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(800),
  deliverables: z.array(z.string().trim().min(1).max(240)).max(12),
  status: stageStatusSchema,
});

export const stagePlanSchema = z
  .object({
    version: z.number().int().positive(),
    stages: z.array(stageSchema).max(12),
  })
  .superRefine(({ stages }, ctx) => {
    if (new Set(stages.map((stage) => stage.id)).size !== stages.length)
      ctx.addIssue({
        code: "custom",
        path: ["stages"],
        message: "Stage IDs must be unique",
      });
    const active = stages.filter((stage) => isActiveStage(stage.status));
    if (active.length > 1)
      ctx.addIssue({
        code: "custom",
        path: ["stages"],
        message: "Only one stage can be current at a time",
      });
    let unfinished = false;
    for (const [index, stage] of stages.entries()) {
      if (stage.status === "complete" && unfinished)
        ctx.addIssue({
          code: "custom",
          path: ["stages", index, "status"],
          message: "Completed stages must come before unfinished stages",
        });
      if (isActiveStage(stage.status) && unfinished)
        ctx.addIssue({
          code: "custom",
          path: ["stages", index, "status"],
          message: "Complete earlier stages before starting this one",
        });
      if (stage.status !== "complete") unfinished = true;
    }
  });

export type StageInput = z.infer<typeof stageSchema>;
export type ProjectStage = StageInput & {
  position: number;
  updatedAt: string;
  completedAt: string | null;
};

export function isActiveStage(status: string) {
  return status === "in_progress" || status === "waiting_on_client";
}

export function stageLabel(status: string) {
  return (
    (
      {
        planned: "Upcoming",
        in_progress: "In progress",
        waiting_on_client: "Your input needed",
        complete: "Complete",
      } as Record<string, string>
    )[status] || status
  );
}

export function currentStageIndex(stages: StageInput[]) {
  const active = stages.findIndex((stage) => isActiveStage(stage.status));
  if (active >= 0) return active;
  const upcoming = stages.findIndex((stage) => stage.status === "planned");
  return upcoming >= 0 ? upcoming : Math.max(0, stages.length - 1);
}

export const invoiceDraftSchema = z.object({
  amountCents: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  due: z.iso.date(),
  stageId: z.uuid().optional(),
});
