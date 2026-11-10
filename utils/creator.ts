import crypto from "crypto";
import { Request } from "express";

const ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A hash of the browser's anonymous creator id (the X-Creator-Id header), or null when none was
 * sent. Only the hash is stored, so the id itself never leaves the browser that made it.
 */
export function creatorHash(req: Request): string | null {
  const id = req.get("x-creator-id");
  if (!id || !ID_PATTERN.test(id)) return null;
  return crypto.createHash("sha256").update(id.toLowerCase()).digest("hex");
}
