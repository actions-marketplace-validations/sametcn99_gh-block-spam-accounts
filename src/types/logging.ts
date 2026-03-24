export type LogLevel = "info" | "success" | "warning" | "error";

export type LogStage = "system" | "auth" | "fetch" | "analysis" | "selection" | "block" | "unblock";

export type AppLogEntry = {
  id: string;
  timestampIso: string;
  level: LogLevel;
  stage: LogStage;
  message: string;
  details?: string;
};
