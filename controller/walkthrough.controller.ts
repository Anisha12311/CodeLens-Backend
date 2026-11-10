import { Request, Response } from "express";
import supabase from "../config/supabase";
import { creatorHash } from "../utils/creator";

const TABLE = "walkThroughs";
const LIST_LIMIT = 50;
const NOT_YOURS = "You can only delete problems you created.";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function badId(res: Response) {
  res.status(400).json({ code: "bad_request", message: "Unknown walkthrough." });
}

function databaseError(res: Response, label: string, message: string) {
  console.error(`[walkthroughs] ${label} failed`, message);
  res.status(500).json({ code: "database", message: "Something went wrong." });
}

/**
 * A light list for the sidebar; each full walkthrough is fetched only when opened.
 * canDelete is worked out here so creator hashes never reach the browser.
 */
export async function listWalkthroughs(req: Request, res: Response): Promise<void> {
  const hash = creatorHash(req);
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, problem, example, creator_hash, title:walkthrough->>title")
    .not("walkthrough", "is", null)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) return databaseError(res, "list", error.message);

  res.json(
    (data ?? []).map(({ creator_hash, ...row }) => ({
      ...row,
      canDelete: hash !== null && creator_hash === hash,
    })),
  );
}

/** One saved walkthrough's full JSON. */
export async function getWalkthrough(req: Request, res: Response): Promise<void> {
  const id = parseId(String(req.params.id));
  if (id === null) return badId(res);

  const { data, error } = await supabase
    .from(TABLE)
    .select("walkthrough")
    .eq("id", id)
    .maybeSingle();

  if (error) return databaseError(res, "read", error.message);
  if (!data?.walkthrough) {
    res.status(404).json({ code: "not_found", message: "That walkthrough no longer exists." });
    return;
  }

  res.json(data.walkthrough);
}

/** Deletes a walkthrough, but only for the browser that created it. */
export async function deleteWalkthrough(req: Request, res: Response): Promise<void> {
  const id = parseId(String(req.params.id));
  if (id === null) return badId(res);

  const hash = creatorHash(req);
  if (hash === null) {
    res.status(403).json({ code: "forbidden", message: NOT_YOURS });
    return;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("creator_hash", hash)
    .select("id");

  if (error) return databaseError(res, "delete", error.message);
  if (!data?.length) {
    res.status(403).json({ code: "forbidden", message: NOT_YOURS });
    return;
  }

  res.status(204).end();
}
