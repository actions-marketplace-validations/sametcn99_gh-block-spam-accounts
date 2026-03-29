import * as core from "@actions/core";
import type { DetectionSensitivity } from "../types/spam";
import {
  type ActionLogLevel,
  type ActionTargetType,
  runSpamBlockerAction,
} from "./runSpamBlockerAction";

const VALID_SENSITIVITIES = ["aggressive", "balanced", "conservative"] as const;
const VALID_TARGET_TYPES = ["followers", "following", "both"] as const;

function parseListInput(name: string): string[] {
  return core
    .getInput(name)
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function parseDelayMs(): number {
  const input = core.getInput("delay-ms").trim();

  if (!input) {
    return 750;
  }

  const parsedValue = Number.parseInt(input, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    throw new Error("delay-ms must be a non-negative integer.");
  }

  return parsedValue;
}

function parseDetectionSensitivity(): DetectionSensitivity {
  const input = core.getInput("detection-sensitivity").trim().toLowerCase();

  if (VALID_SENSITIVITIES.includes(input as DetectionSensitivity)) {
    return input as DetectionSensitivity;
  }

  throw new Error(
    `detection-sensitivity must be one of: ${VALID_SENSITIVITIES.join(", ")}. Received: ${input}`,
  );
}

function parseTargetType(): ActionTargetType {
  const input = core.getInput("target-type").trim().toLowerCase();

  if (VALID_TARGET_TYPES.includes(input as ActionTargetType)) {
    return input as ActionTargetType;
  }

  throw new Error(
    `target-type must be one of: ${VALID_TARGET_TYPES.join(", ")}. Received: ${input}`,
  );
}

function log(level: ActionLogLevel, message: string): void {
  switch (level) {
    case "warning":
      core.warning(message);
      return;
    case "error":
      core.error(message);
      return;
    case "success":
      core.info(`SUCCESS: ${message}`);
      return;
    default:
      core.info(message);
  }
}

async function writeSummary(
  result: Awaited<ReturnType<typeof runSpamBlockerAction>>,
): Promise<void> {
  await core.summary.clear();

  await core.summary
    .addHeading("GitHub Spam Blocker")
    .addTable([
      [
        { data: "Metric", header: true },
        { data: "Value", header: true },
      ],
      ["Authenticated user", `@${result.authenticatedUser.login}`],
      ["Target type", result.targetType],
      ["Candidates", result.candidateCount.toString()],
      ["Detections", result.detectedLogins.length.toString()],
      ["Blocked", result.blockedLogins.length.toString()],
      ["Failures", result.failedBlockLogins.length.toString()],
    ])
    .addCodeBlock(JSON.stringify(result.detectedLogins, null, 2), "json")
    .write();
}

async function main(): Promise<void> {
  const githubToken = core.getInput("github-token", { required: true }).trim();
  const detectionSensitivity = parseDetectionSensitivity();
  const targetType = parseTargetType();
  const customKeywords = parseListInput("custom-keywords");
  const excludedUsers = parseListInput("exclude-users");
  const applyBlocks = core.getBooleanInput("apply-blocks");
  const delayMs = parseDelayMs();

  const result = await runSpamBlockerAction(
    {
      token: githubToken,
      detectionSensitivity,
      customKeywords,
      applyBlocks,
      delayMs,
      targetType,
      excludedUsers,
    },
    { log },
  );

  core.setOutput("authenticated-login", result.authenticatedUser.login);
  core.setOutput("candidate-count", result.candidateCount.toString());
  core.setOutput("detected-count", result.detectedLogins.length.toString());
  core.setOutput("detected-logins", JSON.stringify(result.detectedLogins));
  core.setOutput("blocked-count", result.blockedLogins.length.toString());
  core.setOutput("blocked-logins", JSON.stringify(result.blockedLogins));
  core.setOutput("failed-count", result.failedBlockLogins.length.toString());
  core.setOutput("failed-logins", JSON.stringify(result.failedBlockLogins));
  core.setOutput("can-read-blocked-users", String(result.canReadBlockedUsers));
  core.setOutput("rate-limit-remaining", result.rateLimit?.remaining.toString() ?? "");
  core.setOutput("rate-limit-reset-at", result.rateLimit?.resetAtIso ?? "");

  await writeSummary(result);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected GitHub Action failure.";
  core.setFailed(message);
});
