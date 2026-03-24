import type { GitHubProfile } from "./github";

export type DetectionSensitivity = "aggressive" | "balanced" | "conservative";

export type SpamKeyword = {
  original: string;
  normalized: string;
};

export type SpamRule = {
  reason: string;
  regex: RegExp;
  weight?: number;
  isStrongSignal?: boolean;
};

export type SpamDetection = {
  profile: GitHubProfile;
  matchedReasons: string[];
};
