import {
  ApiOutlined,
  CheckCircleOutlined,
  LockOutlined,
  SearchOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Input, Skeleton, Space, Typography } from "antd";
import { useMemo, useRef } from "react";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

const TOKEN_PATTERN = /^(ghp_[a-zA-Z0-9]{36,}|github_pat_[a-zA-Z0-9_]{22,})/;

export function TokenCard() {
  const token = useSpamBlockerStore((state) => state.token);
  const connectionStatus = useSpamBlockerStore((state) => state.connectionStatus);
  const authenticatedUser = useSpamBlockerStore((state) => state.authenticatedUser);
  const analysisStatus = useSpamBlockerStore((state) => state.analysisStatus);
  const blockStatus = useSpamBlockerStore((state) => state.blockStatus);
  const unblockStatus = useSpamBlockerStore((state) => state.unblockStatus);
  const lastError = useSpamBlockerStore((state) => state.lastError);
  const setToken = useSpamBlockerStore((state) => state.setToken);
  const connectAccount = useSpamBlockerStore((state) => state.connectAccount);
  const analyzeAccounts = useSpamBlockerStore((state) => state.analyzeAccounts);
  const resetSession = useSpamBlockerStore((state) => state.resetSession);

  const isConnected = authenticatedUser !== null;
  const isBusy =
    connectionStatus === "running" ||
    analysisStatus === "running" ||
    blockStatus === "running" ||
    unblockStatus === "running";

  const tokenValid = useMemo(() => TOKEN_PATTERN.test(token), [token]);
  const cardRef = useRef<HTMLDivElement>(null);
  const prevConnected = useRef(false);

  if (isConnected && !prevConnected.current) {
    prevConnected.current = true;
    requestAnimationFrame(() => {
      cardRef.current?.classList.add("connected-flash");
      setTimeout(() => cardRef.current?.classList.remove("connected-flash"), 1300);
    });
  } else if (!isConnected) {
    prevConnected.current = false;
  }

  return (
    <div ref={cardRef}>
      <Card
        title={
          <>
            <span className={`lock-icon-wrapper ${isConnected ? "unlocked" : ""}`}>
              {isConnected ? (
                <UnlockOutlined style={{ color: "#10b981" }} />
              ) : (
                <LockOutlined style={{ color: "#7c3aed" }} />
              )}
            </span>{" "}
            {isConnected ? (
              <>
                Connected as{" "}
                <Typography.Text strong style={{ color: "#a78bfa" }}>
                  {authenticatedUser?.login}
                </Typography.Text>
              </>
            ) : (
              "Connect Your Account"
            )}
          </>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message="Your token stays in memory only for this tab. It is never persisted to local storage, session storage, cookies, or URL parameters."
          />
          {connectionStatus === "running" && !isConnected ? (
            <div className="skeleton-token-loading">
              <Skeleton.Input active block style={{ height: 36 }} />
              <Skeleton.Button active style={{ width: 120, marginTop: 12 }} />
            </div>
          ) : (
            <>
              <Typography.Text strong>GitHub Personal Access Token</Typography.Text>
              <div>
                <Input.Password
                  value={token}
                  autoComplete="off"
                  disabled={isConnected}
                  placeholder="ghp_... or github_pat_..."
                  onChange={(event) => {
                    setToken(event.target.value);
                  }}
                />
                {token.length > 0 && !isConnected && (
                  <div
                    className={`token-hint ${tokenValid ? "token-hint-valid" : "token-hint-invalid"}`}
                  >
                    {tokenValid ? (
                      <>
                        <CheckCircleOutlined /> Valid token format
                      </>
                    ) : (
                      "Expected format: ghp_… or github_pat_…"
                    )}
                  </div>
                )}
              </div>
              <Space>
                {!isConnected ? (
                  <Button
                    type="primary"
                    icon={<ApiOutlined />}
                    className={!isBusy && token.length > 0 ? "cta-pulse" : ""}
                    loading={connectionStatus === "running"}
                    disabled={isBusy || token.length === 0}
                    onClick={() => {
                      void connectAccount();
                    }}
                  >
                    Connect
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    className={analysisStatus === "idle" ? "cta-pulse" : ""}
                    loading={analysisStatus === "running"}
                    disabled={isBusy || analysisStatus !== "idle"}
                    onClick={() => {
                      void analyzeAccounts();
                    }}
                  >
                    Analyze Accounts
                  </Button>
                )}
                <Button
                  danger
                  disabled={isBusy}
                  onClick={() => {
                    resetSession();
                  }}
                >
                  Reset Session
                </Button>
              </Space>
            </>
          )}
          {lastError ? <Alert type="error" showIcon message={lastError} /> : null}
        </Space>
      </Card>
    </div>
  );
}
