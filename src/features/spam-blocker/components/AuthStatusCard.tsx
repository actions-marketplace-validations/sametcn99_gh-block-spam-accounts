import { Alert, Avatar, Card, Descriptions, Space, Tag, Typography } from "antd";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

export function AuthStatusCard() {
  const authenticatedUser = useSpamBlockerStore((state) => state.authenticatedUser);
  const oauthScopes = useSpamBlockerStore((state) => state.oauthScopes);
  const scopeWarning = useSpamBlockerStore((state) => state.scopeWarning);
  const canReadBlockedUsers = useSpamBlockerStore((state) => state.canReadBlockedUsers);

  return (
    <Card title="Authentication">
      {authenticatedUser ? (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Space>
            <Avatar src={authenticatedUser.avatarUrl} size={48} />
            <Space direction="vertical" size={0}>
              <Typography.Text strong>@{authenticatedUser.login}</Typography.Text>
              <Typography.Text type="secondary">
                {authenticatedUser.name ?? "No public name"}
              </Typography.Text>
            </Space>
          </Space>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="OAuth scopes">
              {oauthScopes ?? "Not provided by GitHub"}
            </Descriptions.Item>
            <Descriptions.Item label="Blocked list visibility">
              {canReadBlockedUsers ? "Readable" : "Unavailable for this token"}
            </Descriptions.Item>
          </Descriptions>
          <Tag color="cyan">All user-facing text in this interface is English-only.</Tag>
          {scopeWarning ? <Alert type="warning" showIcon message={scopeWarning} /> : null}
        </Space>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Authenticate by running analysis with a valid token."
        />
      )}
    </Card>
  );
}
