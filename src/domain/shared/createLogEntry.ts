import type { AppLogEntry, LogLevel, LogStage } from "../../types/logging";

export function createLogEntry(
  level: LogLevel,
  stage: LogStage,
  message: string,
  details?: string,
): AppLogEntry {
  return {
    id: crypto.randomUUID(),
    timestampIso: new Date().toISOString(),
    level,
    stage,
    message,
    details,
  };
}
