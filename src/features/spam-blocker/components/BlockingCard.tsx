import {
  Alert,
  Button,
  Card,
  InputNumber,
  List,
  Popconfirm,
  Progress,
  Space,
  Tag,
  Typography,
} from "antd";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

export function BlockingCard() {
  const blockStatus = useSpamBlockerStore((state) => state.blockStatus);
  const blockDelayMs = useSpamBlockerStore((state) => state.blockDelayMs);
  const blockProgress = useSpamBlockerStore((state) => state.blockProgress);
  const blockOutcomes = useSpamBlockerStore((state) => state.blockOutcomes);
  const unblockStatus = useSpamBlockerStore((state) => state.unblockStatus);
  const selectedLogins = useSpamBlockerStore((state) => state.selectedLogins);
  const setBlockDelayMs = useSpamBlockerStore((state) => state.setBlockDelayMs);
  const blockSelectedAccounts = useSpamBlockerStore((state) => state.blockSelectedAccounts);

  const blockPercent =
    blockProgress.total > 0 ? Math.round((blockProgress.completed / blockProgress.total) * 100) : 0;

  return (
    <Card title="Blocking Controls">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Text>{`Selected for blocking: ${selectedLogins.length}`}</Typography.Text>
        <Space>
          <Typography.Text>Delay between block requests (ms)</Typography.Text>
          <InputNumber
            min={0}
            max={5000}
            step={50}
            value={blockDelayMs}
            onChange={(value) => {
              setBlockDelayMs(value);
            }}
          />
        </Space>
        <Popconfirm
          title="Proceed with blocking selected accounts?"
          description="Blocking is executed account by account and cannot be undone from this application."
          okText="Block"
          cancelText="Cancel"
          onConfirm={() => {
            void blockSelectedAccounts();
          }}
          disabled={
            selectedLogins.length === 0 || blockStatus === "running" || unblockStatus === "running"
          }
        >
          <Button
            type="primary"
            danger
            className="cta-danger"
            loading={blockStatus === "running"}
            disabled={selectedLogins.length === 0 || unblockStatus === "running"}
          >
            Block Selected Accounts
          </Button>
        </Popconfirm>
        <div className={blockStatus === "running" ? "progress-active" : undefined}>
          <Progress
            percent={blockPercent}
            strokeColor="#7c3aed"
            status={blockStatus === "error" ? "exception" : undefined}
          />
        </div>
        <Space>
          <Tag color="green">{`Succeeded: ${blockProgress.succeeded}`}</Tag>
          <Tag color="red">{`Failed: ${blockProgress.failed}`}</Tag>
        </Space>
        {blockStatus === "completed" && blockProgress.failed === 0 ? (
          <div className="success-alert">
            <Alert showIcon type="success" message="Blocking completed without failures." />
          </div>
        ) : null}
        <List
          size="small"
          bordered
          dataSource={blockOutcomes}
          locale={{ emptyText: "No block attempts yet." }}
          renderItem={(outcome) => (
            <List.Item>
              <Space>
                <Typography.Text>{`@${outcome.login}`}</Typography.Text>
                {outcome.success ? <Tag color="green">Blocked</Tag> : <Tag color="red">Failed</Tag>}
                {!outcome.success && outcome.errorMessage ? (
                  <Typography.Text type="secondary">{outcome.errorMessage}</Typography.Text>
                ) : null}
              </Space>
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
}
