export const BAD_BOTS = [
  "semrushbot",
  "mj12bot",
  "dotbot",
  "blexbot",
  "barkrowler",
  "rogerbot",
  "megaindex",
  "seznambot",
  "python-requests",
];

export const WHITELISTED_SEARCH_BOTS = [
  "googlebot",
  "bingbot",
  "algolia",
  "ahrefs",
];

export const WHITELISTED_AI_BOTS = [
  "gptbot",
  "claudebot",
  "perplexitybot",
  "applebot-ai",
  "oai-searchbot",
];

export const GENERIC_BOT_PATTERNS = [
  "bot",
  "googlebot",
  "crawler",
  "spider",
  "robot",
  "crawling",
  "chatgpt",
  "claude",
  "perplexity",
];

export function isBadBot(ua: string): boolean {
  return BAD_BOTS.some((bot) => ua.includes(bot));
}

export function isWhitelistedSearchBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return WHITELISTED_SEARCH_BOTS.some((bot) => lower.includes(bot));
}

export function isWhitelistedAiBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return WHITELISTED_AI_BOTS.some((bot) => lower.includes(bot));
}

export function isWhitelistedBot(ua: string): boolean {
  return isWhitelistedSearchBot(ua) || isWhitelistedAiBot(ua);
}

export function isBotUserAgent(ua: string): boolean {
  const lower = ua.toLowerCase();
  return GENERIC_BOT_PATTERNS.some((pattern) => lower.includes(pattern));
}
