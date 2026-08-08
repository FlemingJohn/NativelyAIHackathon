import { Router } from "express";

import { db } from "../db/index.js";
import { startupProfiles } from "../db/schema.js";
import { HttpError } from "../http/errors.js";
import { profileOut } from "../serialize.js";
import { startupProfileCreate, startupProfileUpdate } from "../schemas.js";
import { getProfileOr404, nowSql } from "../services/profiles.js";
import { eq } from "drizzle-orm";

export const profileRouter = Router();

profileRouter.post("/", async (req, res) => {
  const payload = startupProfileCreate.parse(req.body);

  const [profile] = await db
    .insert(startupProfiles)
    .values({
      ownerId: payload.owner_id,
      domain: payload.domain ?? null,
      ideaText: payload.idea_text ?? null,
      stage: payload.stage ?? null,
      targetMarket: payload.target_market ?? null,
      founderSkills: payload.founder_skills,
      timeCommitment: payload.time_commitment ?? null,
      budget: payload.budget ?? null,
    })
    .returning();

  res.json(profileOut(profile!));
});

profileRouter.get("/:profileId", async (req, res) => {
  const profile = await getProfileOr404(req.params.profileId);
  res.json(profileOut(profile));
});

profileRouter.patch("/:profileId", async (req, res) => {
  const profile = await getProfileOr404(req.params.profileId);
  const payload = startupProfileUpdate.parse(req.body);

  // Only keys the client actually sent are applied (pydantic exclude_unset).
  const patch: Partial<typeof startupProfiles.$inferInsert> = {};
  if ("domain" in payload) patch.domain = payload.domain ?? null;
  if ("idea_text" in payload) patch.ideaText = payload.idea_text ?? null;
  if ("stage" in payload) patch.stage = payload.stage ?? null;
  if ("target_market" in payload) patch.targetMarket = payload.target_market ?? null;
  if ("founder_skills" in payload && payload.founder_skills !== undefined) {
    patch.founderSkills = payload.founder_skills;
  }
  if ("time_commitment" in payload) patch.timeCommitment = payload.time_commitment ?? null;
  if ("budget" in payload) patch.budget = payload.budget ?? null;

  if (Object.keys(patch).length === 0) {
    res.json(profileOut(profile));
    return;
  }

  const [updated] = await db
    .update(startupProfiles)
    .set({ ...patch, updatedAt: nowSql })
    .where(eq(startupProfiles.id, profile.id))
    .returning();

  if (!updated) throw new HttpError(404, "profile not found");
  res.json(profileOut(updated));
});
