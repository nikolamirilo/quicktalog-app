import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });

/** `deepseek-chat` was retired 2026-07-24. `deepseek-v4-pro` is the pricier swap. */
export const agentModel = deepseek("deepseek-v4-pro");

/**
 * V4 models think before every step unless told not to, and a page import
 * runs several steps inside the route's 60 seconds (the Hobby plan ceiling).
 */
export const AGENT_REASONING = "none";

export const AGENT_TEMPERATURE = 0.3;

/** A simple edit takes two rounds; a whole-menu build takes a dozen. */
export const MAX_AGENT_STEPS = 16;
