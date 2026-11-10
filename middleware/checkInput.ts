import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { GenerateLocals } from "../types/generate";
import { problemKey } from "../utils/problemKey";

const MAX_PROBLEM_LENGTH = 6000;
const MAX_EXAMPLE_LENGTH = 400;

// One saved walkthrough per problem, so the example is not part of the key.
const makeCacheKey = (nameKey: string) =>
  crypto.createHash("sha256").update(nameKey).digest("hex");

export function checkInput(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const problem =
    typeof req.body?.problem === "string" ? req.body.problem.trim() : "";
  const example =
    typeof req.body?.example === "string" ? req.body.example.trim() : "";

  if (!problem) {
    res
      .status(400)
      .json({ code: "bad_request", message: "Enter a problem first" });
    return;
  }

  if (
    problem.length > MAX_PROBLEM_LENGTH ||
    example.length > MAX_EXAMPLE_LENGTH
  ) {
    res.status(400).json({
      code: "too_large",
      message:
        "Paste only the problem statement 6000 character and example character max size 400.",
    });
    return;
  }

  const nameKey = problemKey(problem);
  const locals: GenerateLocals = {
    problem,
    example,
    nameKey,
    cacheKey: makeCacheKey(nameKey),
  };

  Object.assign(res.locals, locals);

  next();
}
