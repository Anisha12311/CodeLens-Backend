/**
 * The problem's name in a form where small differences don't matter, worked out with plain
 * code (no AI). "Two Sum", "two sum!" and "1. Two Sum. Given an array..." all give "two sum".
 * The frontend has the same function in utils/problem-key.ts; keep the two in step.
 */
export function problemKey(problem: string): string {
  const withoutNumber = problem.trim().replace(/^\d+\s*[.)]\s*/, "");
  const name = withoutNumber.split(/[.,:?!\n]/)[0] ?? "";
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
