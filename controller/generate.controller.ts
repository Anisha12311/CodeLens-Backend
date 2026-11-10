import { NextFunction, Request, Response } from "express";
import { GenerateLocals } from "../types/generate";
import { generateRawWalkThorugh } from "../services/generate.service";
import { validateWalkthrough } from "../utils/validateWalkThrough";
import supabase from "../config/supabase";
import groqError from "../utils/groqError";
import { creatorHash } from "../utils/creator";
const TABLE = "walkThroughs";

async function generate(req: Request, res: Response): Promise<void> {
  try {
    const { problem, example, cacheKey } = res.locals as GenerateLocals;
    const raw = await generateRawWalkThorugh(problem, example);
    const walkthrough = validateWalkthrough(raw);

    const { error } = await supabase.from(TABLE).upsert(
      {
        cache_key: cacheKey,
        problem,
        example,
        walkthrough,
        // Lets the browser that made it delete it later; null when no creator id was sent.
        creator_hash: creatorHash(req),
      },
      { onConflict: "cache_key" },
    );

    // The student still gets the walkthrough they waited for if saving fails.
    if (error) console.error("[generate] save failed", error.message);

    res.json(walkthrough);
  } catch (error: unknown) {
    if (error instanceof groqError) {
      res
        .status(error.status)
        .json({ code: error.code, message: error.message });
      return;
    }
    console.error("[generate] unexpected error", error);
    res
      .status(500)
      .json({ code: "server_error", message: "Something went wrong." });
  }
}

export default generate;
