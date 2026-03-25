import { CheckCircleOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  Alert,
  Button,
  Card,
  Empty,
  List,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMemo } from "react";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

type BlockedUserRow = {
  login: string;
};

const columns: TableColumnsType<BlockedUserRow> = [
  {
    title: "Login",
    dataIndex: "login",
    key: "login",
    render: (login: string) => (
      <Typography.Link href={`https://github.com/${login}`} target="_blank" rel="noreferrer">
        @{login}
      </Typography.Link>
    ),
  },
  {
    title: "Action",
    key: "action",
    render: (_, row) => {
      return <SingleUnblockButton login={row.login} />;
    },
  },
];

function SingleUnblockButton({ login }: { login: string }) {
  const blockStatus = useSpamBlockerStore((state) => state.blockStatus);
  const unblockStatus = useSpamBlockerStore((state) => state.unblockStatus);
  const unblockSingleAccount = useSpamBlockerStore((state) => state.unblockSingleAccount);

  const disabled = blockStatus === "running" || unblockStatus === "running";

  return (
    <Popconfirm
      title={`Unblock @${login}?`}
      description="This account will be removed from your blocked users list."
      okText="Unblock"
      cancelText="Cancel"
      onConfirm={() => {
        void unblockSingleAccount(login);
      }}
      disabled={disabled}
    >
      <Button size="small" disabled={disabled} loading={unblockStatus === "running"}>
        Unblock
      </Button>
    </Popconfirm>
  );
}

export function BlockedUsersCard() {
  const canReadBlockedUsers = useSpamBlockerStore((state) => state.canReadBlockedUsers);
  const blockedUserLogins = useSpamBlockerStore((state) => state.blockedUserLogins);
  const selectedBlockedUserLogins = useSpamBlockerStore((state) => state.selectedBlockedUserLogins);
  const blockStatus = useSpamBlockerStore((state) => state.blockStatus);
  const unblockStatus = useSpamBlockerStore((state) => state.unblockStatus);
  const unblockProgress = useSpamBlockerStore((state) => state.unblockProgress);
  const unblockOutcomes = useSpamBlockerStore((state) => state.unblockOutcomes);
  const setSelectedBlockedUserLogins = useSpamBlockerStore(
    (state) => state.setSelectedBlockedUserLogins,
  );
  const selectAllBlockedUsers = useSpamBlockerStore((state) => state.selectAllBlockedUsers);
  const unblockSelectedAccounts = useSpamBlockerStore((state) => state.unblockSelectedAccounts);

  const isBusy = blockStatus === "running" || unblockStatus === "running";

  const tableData = useMemo(() => {
    return blockedUserLogins.map((login) => ({ login }));
  }, [blockedUserLogins]);

  const unblockPercent =
    unblockProgress.total > 0
      ? Math.round((unblockProgress.completed / unblockProgress.total) * 100)
      : 0;

  return (
    <Card title="Blocked Accounts">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {!canReadBlockedUsers ? (
          <Alert
            showIcon
            type="warning"
            message="The token could not read your blocked users list. Unblock controls require a token with blocked-users read access."
          />
        ) : null}

        <Space wrap>
          <Typography.Text strong>{`Blocked: ${blockedUserLogins.length}`}</Typography.Text>
          <Typography.Text>{`Selected for unblock: ${selectedBlockedUserLogins.length}`}</Typography.Text>
          <Button
            onClick={() => selectAllBlockedUsers()}
            disabled={blockedUserLogins.length === 0 || isBusy}
          >
            Select All
          </Button>
          <Button
            onClick={() => setSelectedBlockedUserLogins([])}
            disabled={selectedBlockedUserLogins.length === 0 || isBusy}
          >
            Clear Selection
          </Button>
          <Popconfirm
            title="Proceed with unblocking selected accounts?"
            description="Unblocking is executed account by account."
            okText="Unblock"
            cancelText="Cancel"
            onConfirm={() => {
              void unblockSelectedAccounts();
            }}
            disabled={selectedBlockedUserLogins.length === 0 || isBusy}
          >
            <Button
              type="primary"
              disabled={selectedBlockedUserLogins.length === 0 || isBusy}
              loading={unblockStatus === "running"}
            >
              Unblock Selected Accounts
            </Button>
          </Popconfirm>
        </Space>

        <Progress
          percent={unblockPercent}
          status={unblockStatus === "error" ? "exception" : undefined}
        />

        <Space>
          <Tag color="green">{`Succeeded: ${unblockProgress.succeeded}`}</Tag>
          <Tag color="red">{`Failed: ${unblockProgress.failed}`}</Tag>
        </Space>

        {unblockStatus === "completed" &&
        unblockProgress.failed === 0 &&
        unblockProgress.total > 0 ? (
          <Alert showIcon type="success" message="Unblocking completed without failures." />
        ) : null}

        <Table<BlockedUserRow>
          rowKey={(row) => row.login}
          columns={columns}
          dataSource={tableData}
          locale={{
            emptyText: (
              <Empty
                image={<CheckCircleOutlined style={{ fontSize: 36, color: "#475569" }} />}
                description="No blocked accounts found"
              />
            ),
          }}
          rowSelection={{
            selectedRowKeys: selectedBlockedUserLogins,
            onChange: (keys) => {
              setSelectedBlockedUserLogins(keys.map((key) => String(key)));
            },
          }}
          pagination={{ pageSize: 8 }}
        />

        <List
          size="small"
          bordered
          dataSource={unblockOutcomes}
          locale={{ emptyText: "No unblock attempts yet." }}
          renderItem={(outcome) => (
            <List.Item>
              <Space>
                <Typography.Text>{`@${outcome.login}`}</Typography.Text>
                {outcome.success ? (
                  <Tag color="green">Unblocked</Tag>
                ) : (
                  <Tag color="red">Failed</Tag>
                )}
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
