import { LogoutOutlined, SearchOutlined } from "@ant-design/icons";
import { Avatar, Button, Space, Tag, Typography } from "antd";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

export function AppWorkspaceHeader() {
  const authenticatedUser = useSpamBlockerStore((state) => state.authenticatedUser);
  const analysisStatus = useSpamBlockerStore((state) => state.analysisStatus);
  const blockStatus = useSpamBlockerStore((state) => state.blockStatus);
  const unblockStatus = useSpamBlockerStore((state) => state.unblockStatus);
  const socialActionStatus = useSpamBlockerStore((state) => state.socialActionStatus);
  const rateLimit = useSpamBlockerStore((state) => state.rateLimit);
  const analyzeAccounts = useSpamBlockerStore((state) => state.analyzeAccounts);
  const resetSession = useSpamBlockerStore((state) => state.resetSession);

  if (!authenticatedUser) return null;

  const isBusy =
    analysisStatus === "running" ||
    blockStatus === "running" ||
    unblockStatus === "running" ||
    socialActionStatus === "running";

  return (
    <header className="app-workspace-header">
      <Space size="middle">
        <Avatar src={authenticatedUser.avatarUrl} size={42} />
        <Space direction="vertical" size={0}>
          <Typography.Text type="secondary">GitHub account</Typography.Text>
          <Typography.Text strong>@{authenticatedUser.login}</Typography.Text>
        </Space>
        {rateLimit ? <Tag color="purple">API {rateLimit.remaining}/{rateLimit.limit}</Tag> : null}
      </Space>

      <Space wrap>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          loading={analysisStatus === "running"}
          disabled={isBusy || analysisStatus !== "idle"}
          onClick={() => void analyzeAccounts()}
        >
          Analyze accounts
        </Button>
        <Button icon={<LogoutOutlined />} disabled={isBusy} onClick={resetSession}>
          Disconnect
        </Button>
      </Space>
    </header>
  );
}
