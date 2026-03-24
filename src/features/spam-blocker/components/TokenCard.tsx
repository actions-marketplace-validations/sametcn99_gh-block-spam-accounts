import { Alert, Button, Card, Input, Space, Typography } from "antd";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

export function TokenCard() {
  const token = useSpamBlockerStore((state) => state.token);
  const analysisStatus = useSpamBlockerStore((state) => state.analysisStatus);
  const blockStatus = useSpamBlockerStore((state) => state.blockStatus);
  const unblockStatus = useSpamBlockerStore((state) => state.unblockStatus);
  const lastError = useSpamBlockerStore((state) => state.lastError);
  const setToken = useSpamBlockerStore((state) => state.setToken);
  const analyzeAccounts = useSpamBlockerStore((state) => state.analyzeAccounts);
  const resetSession = useSpamBlockerStore((state) => state.resetSession);

  const isBusy =
    analysisStatus === "running" || blockStatus === "running" || unblockStatus === "running";

  return (
    <Card title="Access Token">
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
          placeholder="Paste token and click Analyze"
          onChange={(event) => {
            setToken(event.target.value);
          }}
        />
        <Space>
          <Button
            type="primary"
            loading={analysisStatus === "running"}
            disabled={isBusy}
            onClick={() => {
              void analyzeAccounts();
            }}
          >
            Analyze Accounts
          </Button>
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
