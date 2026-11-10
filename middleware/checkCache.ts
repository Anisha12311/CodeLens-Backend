import { Response, Request, NextFunction } from "express";
import { GenerateLocals } from "../types/generate";
import supabase from "../config/supabase";
import { problemKey } from "../utils/problemKey";

const TABLE = "walkThroughs";

function databaseError(res: Response, message: string) {
  console.error("[generate] cache lookup failed", message);
  res.status(500).json({ code: "database", message: "Something went wrong." });
}

/** Returns the saved walkthrough when this problem already exists, so the AI is never called. */
export async function checkCache(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { cacheKey, nameKey } = res.locals as GenerateLocals;

  const exact = await supabase
    .from(TABLE)
    .select("walkthrough")
    .eq("cache_key", cacheKey)
    .not("walkthrough", "is", null)
    .maybeSingle();
  if (exact.error) return databaseError(res, exact.error.message);
  if (exact.data) {
    res.json(exact.data.walkthrough);
    return;
  }

  // Rows saved before name matching used a different key, so compare their names directly.
  const rows = await supabase
    .from(TABLE)
    .select("id, problem")
    .not("walkthrough", "is", null)
    .order("created_at", { ascending: false });
  if (rows.error) return databaseError(res, rows.error.message);

  const match = (rows.data ?? []).find(
    (row) => problemKey(String(row.problem ?? "")) === nameKey,
  );
  if (!match) {
    next();
    return;
  }

  const saved = await supabase
    .from(TABLE)
    .select("walkthrough")
    .eq("id", match.id)
    .maybeSingle();
  if (saved.error) return databaseError(res, saved.error.message);
  if (saved.data?.walkthrough) {
    res.json(saved.data.walkthrough);
    return;
  }
  next();
}
