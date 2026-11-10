import GroqError from "./groqError";

type JsonObject = Record<string, unknown>;
type Panel = JsonObject & { kind: string };

interface Ask {
  q: string;
  options: string[];
  answer: string;
}

export interface WalkthroughStep extends JsonObject {
  line: number;
  text: string;
  vars: JsonObject;
  panels: Panel[];
  ask?: Ask;
}

export interface Walkthrough extends JsonObject {
  code: string[];
  steps: WalkthroughStep[];
}

const PANEL_KINDS = new Set([
  "array",
  "list",
  "map",
  "stack",
  "queue",
  "grid",
  "tree",
  "text",
]);

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPanel = (value: unknown): value is Panel =>
  isObject(value) &&
  typeof value.kind === "string" &&
  PANEL_KINDS.has(value.kind);

function cleanAsk(ask: unknown): Ask | undefined {
  if (
    !isObject(ask) ||
    typeof ask.q !== "string" ||
    !Array.isArray(ask.options)
  ) {
    return undefined;
  }
  const options = ask.options.map(String).slice(0, 4);
  const answer = String(ask.answer);
  return options.length >= 2 && options.includes(answer)
    ? { q: ask.q, options, answer }
    : undefined;
}

function cleanStep(step: unknown, codeLength: number): WalkthroughStep | null {
  if (!isObject(step)) return null;

  const { ask: rawAsk, ...rest } = step;
  const text = step.text;
  if (typeof text !== "string" || !text.trim()) return null;

  const line = Math.round(Number(step.line)) || 1;
  const panels = Array.isArray(step.panels) ? step.panels.filter(isPanel) : [];
  const ask = cleanAsk(rawAsk);

  return {
    ...rest,
    text,
    line: Math.min(codeLength, Math.max(1, line)),
    vars: isObject(step.vars) ? step.vars : {},
    panels,
    ...(ask ? { ask } : {}),
  };
}

export function validateWalkthrough(raw: unknown): Walkthrough {
  if (!isObject(raw)) {
    throw new GroqError(
      502,
      "invalid_output",
      "The answer was not a walkthrough. Try again.",
    );
  }
  if (raw.error) {
    throw new GroqError(422, "not_a_problem", String(raw.error));
  }

  const code = Array.isArray(raw.code)
    ? raw.code.map(String)
    : String(raw.code ?? "").split("\n");
  if (!code.join("").trim()) {
    throw new GroqError(
      502,
      "invalid_output",
      "The answer had no code. Try again.",
    );
  }

  const rawSteps: unknown[] = Array.isArray(raw.steps) ? raw.steps : [];
  const steps = rawSteps
    .slice(0, 90)
    .map((step) => cleanStep(step, code.length))
    .filter((step): step is WalkthroughStep => step !== null);
  if (steps.length < 2) {
    throw new GroqError(
      502,
      "invalid_output",
      "The walkthrough had too few steps. Try again.",
    );
  }

  return { ...raw, code, steps };
}
