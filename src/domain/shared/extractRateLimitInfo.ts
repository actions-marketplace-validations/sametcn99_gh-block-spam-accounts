import type { RateLimitInfo } from "../../types/github";
import { getHeaderValue } from "./getHeaderValue";

export function extractRateLimitInfo(
  headers: Record<string, string | number | string[] | undefined>,
): RateLimitInfo | null {
  const limitValue = getHeaderValue(headers, "x-ratelimit-limit");
  const remainingValue = getHeaderValue(headers, "x-ratelimit-remaining");
  const resetValue = getHeaderValue(headers, "x-ratelimit-reset");

  if (!limitValue || !remainingValue || !resetValue) {
    return null;
  }

  const limit = Number.parseInt(limitValue, 10);
  const remaining = Number.parseInt(remainingValue, 10);
  const resetUnixSeconds = Number.parseInt(resetValue, 10);

  if (Number.isNaN(limit) || Number.isNaN(remaining) || Number.isNaN(resetUnixSeconds)) {
    return null;
  }

  return {
    limit,
    remaining,
    resetAtIso: new Date(resetUnixSeconds * 1000).toISOString(),
  };
}
