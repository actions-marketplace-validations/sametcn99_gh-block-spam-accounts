import { ApiOutlined, LockOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Input, Space, Typography } from "antd";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

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

  return (
    <Card
      title={
        <>
          <LockOutlined /> Connect Your Account
        </>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          message="Your token stays in memory only for this tab. It is never persisted to local storage, session storage, cookies, or URL parameters."
        />
        <Typography.Text strong>GitHub Personal Access Token</Typography.Text>
        <Input.Password
          value={token}
          autoComplete="off"
          disabled={isConnected}
          placeholder="ghp_... or github_pat_..."
          onChange={(event) => {
            setToken(event.target.value);
          }}
        />
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
        {lastError ? <Alert type="error" showIcon message={lastError} /> : null}
      </Space>
    </Card>
  );
}
