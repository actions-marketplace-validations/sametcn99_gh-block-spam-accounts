import type { GitHubProfile } from "../../types/github";
import { normalizeText } from "./normalizeText";

export function buildNormalizedProfileDetails(profile: GitHubProfile): string {
  return [
    profile.login,
    profile.name,
    profile.bio,
    profile.company,
    profile.location,
    profile.websiteUrl,
    profile.twitterUsername,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeText(value))
    .filter((value) => value.length > 0)
    .join(" ");
}
