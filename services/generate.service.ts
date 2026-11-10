import { buildWalkthroughPrompt } from "../utils/walkThrough-promp";
const TIMEOUT_MS = 90_000;
const RETRY_WAIT_MS = 2_000;
import groqError from "../utils/groqError";
import { ChatResponse, Provider } from "../types/generate";

const invalidJson = () =>
  new groqError(502, "invalid_json", "We couldn't build this walkthrough. Please try again.");

const hasCode = (error:unknown, code :string) => 
    error instanceof groqError && error.code === code

const sleep = (ms:number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms))

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[ai] missing environment variable ${name}`);
    throw new groqError(503, "not_configured", "The AI service is not set up yet.");
  }
  return value;
}

const groq = (): Provider => ({
  url: "https://api.groq.com/openai/v1/chat/completions",
  key: requireEnv("GROQ_API_KEY"),
  model: requireEnv("GROQ_MODEL"),
});

const openRouter = (): Provider => ({
  url: "https://openrouter.ai/api/v1/chat/completions",
  key: requireEnv("OPENROUTER_KEY"),
  model: requireEnv("OPENROUTER_MODEL"),
});

async function requestJson(provider:Provider, prompt :string, signal : AbortSignal) : Promise<unknown>{
    const response = await fetch(provider.url, {
        method : "POST",
        headers : {
            Authorization : `Bearer ${provider.key}`,
            "Content-Type" : "application/json"
        },
        body : JSON.stringify({
            model : provider.model,
            messages : [{role : "user", content : prompt}],
            response_format:{type : "json_object"},
            temperature : 0.2
        }),
        signal
    })

    const body = (await response.json().catch(() => null)) as ChatResponse | null;

    if(!response.ok) {
        if(body?.error?.code === "json_validate_failed") throw invalidJson();

        console.error("[ai] provider error", response.status, body?.error?.message)
        if (response.status === 429) {
      throw new groqError(429, "rate_limited", "The AI is busy. Try again in a minute.");
    }
    throw new groqError(502, "upstream", "The AI service could not be reached.");
    }

    try {
        return JSON.parse(body?.choices?.[0]?.message?.content ?? "") as unknown
    } catch (error) {
        throw invalidJson()
    }
}



async function askWithJsonRetry(provider:Provider, prompt:string, signal: AbortSignal) :Promise<unknown>{
    try {
        return await requestJson(provider, prompt, signal)
    } catch (error:unknown) {
        if (!hasCode(error, "invalid_json")) throw error;
        return requestJson(provider, prompt, signal)
    }
}

async function askWithFallback(prompt : string, signal:AbortSignal): Promise<unknown> {
    for (let attempt = 0 ; attempt < 2; attempt += 1){
        try {
            return await askWithJsonRetry(groq(), prompt, signal)
        } catch (error) {
            if(!hasCode(error, "rate_limited")) throw error
            if (attempt == 0) await sleep(RETRY_WAIT_MS)
        }
    }
    return askWithJsonRetry(openRouter(), prompt, signal);

}


export async function generateRawWalkThorugh(
  problem: string,
  example: string,
): Promise<unknown> {
  const prompt = buildWalkthroughPrompt(problem, example);
  try {
    return await askWithFallback(prompt, AbortSignal.timeout(TIMEOUT_MS));
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new groqError(
        504,
        "timeout",
        "This took too long, please try again",
      );
    }
    throw error;
  }
}
