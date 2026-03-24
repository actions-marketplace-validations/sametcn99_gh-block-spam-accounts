import type { SpamRule } from "../../types/spam";
import { escapeRegExp } from "./escapeRegExp";
import { normalizeText } from "./normalizeText";
import { rawSpamKeywords } from "./rawSpamKeywords";

export const mainAccountPattern = /\bmain\s*:\s*@[a-z\d-]+\b/i;

function createCustomKeywordRule(keyword: string): SpamRule {
  const normalizedKeyword = normalizeText(keyword);
  const phrasePattern = normalizedKeyword
    .split(" ")
    .map((part) => escapeRegExp(part))
    .join("\\s+");

  return {
    reason: keyword,
    regex: new RegExp(`(?:^|\\s)${phrasePattern}(?:$|\\s)`, "i"),
    weight: 4,
    isStrongSignal: true,
  };
}

export function buildSpamRules(customKeywords: string[]): SpamRule[] {
  const customKeywordRules = [
    ...new Set(
      customKeywords.map((keyword) => keyword.trim()).filter((keyword) => keyword.length > 0),
    ),
  ].map((keyword) => createCustomKeywordRule(keyword));

  const mergedRulesByReason = new Map<string, SpamRule>();

  for (const rule of [...rawSpamKeywords, ...customKeywordRules]) {
    const reasonKey = rule.reason.trim().toLowerCase();
    if (!mergedRulesByReason.has(reasonKey)) {
      mergedRulesByReason.set(reasonKey, rule);
    }
  }

  return [...mergedRulesByReason.values()];
}
