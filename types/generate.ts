export interface GenerateLocals {
  problem: string;
  example: string;
  /** The normalised problem name, from utils/problemKey. */
  nameKey: string;
  cacheKey: string;
}

export interface Provider {
  url: string;
  key: string;
  model: string;
}

export interface ChatResponse {
  choices?: { message?: { content?: string } }[];
  error?: { code?: string; message?: string };
}
