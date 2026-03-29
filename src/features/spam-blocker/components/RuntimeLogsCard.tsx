import { CodeOutlined, CopyOutlined, FilterOutlined } from "@ant-design/icons";
import {
  Badge,
  Button,
  Collapse,
  List,
  message,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";
import type { LogLevel } from "../../../types/logging";
import "./RuntimeLogsCard.css";

const LEVEL_COLOR: Record<LogLevel, string> = {
  success: "green",
  warning: "orange",
  error: "red",
  info: "blue",
};

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Errors", value: "error" },
  { label: "Warnings", value: "warning" },
  { label: "Info", value: "info" },
];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 1000) return "just now";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(iso).toLocaleTimeString();
}

export function RuntimeLogsCard() {
  const logs = useSpamBlockerStore((state) => state.logs);
  const [filter, setFilter] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    const reversed = [...logs].reverse();
    if (filter === "all") return reversed;
    return reversed.filter((l) => l.level === filter);
  }, [logs, filter]);

  const errorCount = logs.filter((l) => l.level === "error").length;
  const warnCount = logs.filter((l) => l.level === "warning").length;

  const badgeCount = errorCount > 0 ? errorCount : warnCount;
  const badgeColor = errorCount > 0 ? "#ef4444" : warnCount > 0 ? "#f59e0b" : undefined;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  const handleCopy = () => {
    const text = logs
      .map(
        (l) =>
          `[${l.level.toUpperCase()}] [${l.stage}] ${l.timestampIso} — ${l.message}${l.details ? `\n  ${l.details}` : ""}`,
      )
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      message.success("Logs copied to clipboard");
    });
  };

  const label = (
    <Space>
      <CodeOutlined style={{ color: "#7c3aed" }} />
      <Typography.Text strong>Runtime Logs</Typography.Text>
      {logs.length > 0 && (
        <Badge count={badgeCount || logs.length} color={badgeColor ?? "#7c3aed"} size="small" />
      )}
    </Space>
  );

  return (
    <Collapse
      ghost
      items={[
        {
          key: "logs",
          label,
          children: (
            <>
              <Space
                style={{
                  marginBottom: 8,
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Space size={4}>
                  <FilterOutlined style={{ color: "#7c3aed", fontSize: 12 }} />
                  <Segmented
                    size="small"
                    options={FILTER_OPTIONS}
                    value={filter}
                    onChange={setFilter}
                  />
                </Space>
                {logs.length > 0 && (
                  <Tooltip title="Copy all logs">
                    <Button size="small" type="text" icon={<CopyOutlined />} onClick={handleCopy} />
                  </Tooltip>
                )}
              </Space>

              <div className="runtimeLogsScrollContainer" ref={scrollRef}>
                <List
                  size="small"
                  dataSource={filteredItems}
                  locale={{
                    emptyText: "Runtime logs will appear here.",
                  }}
                  renderItem={(logItem) => (
                    <List.Item className="log-entry">
                      <Space direction="vertical" size={0} style={{ width: "100%" }}>
                        <Space wrap>
                          <Tag color={LEVEL_COLOR[logItem.level]}>
                            {logItem.level.toUpperCase()}
                          </Tag>
                          <Tag>{logItem.stage.toUpperCase()}</Tag>
                          <Tooltip title={logItem.timestampIso}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {relativeTime(logItem.timestampIso)}
                            </Typography.Text>
                          </Tooltip>
                        </Space>
                        <Typography.Text style={{ fontFamily: "var(--font-mono, monospace)" }}>
                          {logItem.message}
                        </Typography.Text>
                        {logItem.details ? (
                          <Typography.Text
                            type="secondary"
                            style={{
                              fontFamily: "var(--font-mono, monospace)",
                              fontSize: 12,
                            }}
                          >
                            {logItem.details}
                          </Typography.Text>
                        ) : null}
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            </>
          ),
        },
      ]}
    />
  );
}
