import type { TableColumnsType } from "antd";
import { Button, Card, Empty, Popconfirm, Space, Table, Tooltip, Typography } from "antd";
import { useMemo, useState } from "react";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";
import type { GitHubProfile } from "../../../types/github";

type SocialAccountRow = {
  login: string;
  profile: GitHubProfile | undefined;
};

function AccountActions({ login, isFollower }: { login: string; isFollower: boolean }) {
  const followingLogins = useSpamBlockerStore((state) => state.followingLogins);
  const socialActionStatus = useSpamBlockerStore((state) => state.socialActionStatus);
  const socialActionLogin = useSpamBlockerStore((state) => state.socialActionLogin);
  const followAccount = useSpamBlockerStore((state) => state.followAccount);
  const unfollowAccount = useSpamBlockerStore((state) => state.unfollowAccount);
  const blockAccount = useSpamBlockerStore((state) => state.blockAccount);
  const removeFollower = useSpamBlockerStore((state) => state.removeFollower);
  const isFollowing = followingLogins.includes(login);
  const isBusy = socialActionStatus === "running";
  const isLoading = socialActionLogin === login;

  return (
    <Space wrap size="small">
      <Button
        size="small"
        type={isFollowing ? "default" : "primary"}
        loading={isLoading}
        disabled={isBusy}
        onClick={() => void (isFollowing ? unfollowAccount(login) : followAccount(login))}
      >
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
      <Popconfirm
        title={`Block @${login}?`}
        description="This will add the account to your GitHub blocked users list."
        okText="Block"
        cancelText="Cancel"
        disabled={isBusy}
        onConfirm={() => void blockAccount(login)}
      >
        <Button size="small" danger loading={isLoading} disabled={isBusy}>
          Block
        </Button>
      </Popconfirm>
      {isFollower ? (
        <Popconfirm
          title={`Remove @${login} from followers?`}
          description="GitHub removes a follower by blocking and immediately unblocking them."
          okText="Remove follower"
          cancelText="Cancel"
          disabled={isBusy}
          onConfirm={() => void removeFollower(login)}
        >
          <Button size="small" loading={isLoading} disabled={isBusy}>
            Remove follower
          </Button>
        </Popconfirm>
      ) : null}
    </Space>
  );
}

function createColumns(isFollower: boolean): TableColumnsType<SocialAccountRow> {
  return [
    {
      title: "Login",
      dataIndex: "login",
      key: "login",
      width: 140,
      fixed: "left",
      render: (login: string) => (
        <Typography.Link href={`https://github.com/${login}`} target="_blank" rel="noreferrer">
          @{login}
        </Typography.Link>
      ),
    },
    { title: "Name", key: "name", width: 130, ellipsis: true, render: (_, row) => row.profile?.name ?? "—" },
    {
      title: "Bio",
      key: "bio",
      width: 220,
      ellipsis: true,
      render: (_, row) => {
        const bio = row.profile?.bio ?? "—";
        return <Tooltip title={bio}><Typography.Text type="secondary" ellipsis>{bio}</Typography.Text></Tooltip>;
      },
    },
    { title: "Company", key: "company", width: 130, ellipsis: true, render: (_, row) => row.profile?.company ?? "—" },
    { title: "Location", key: "location", width: 130, ellipsis: true, render: (_, row) => row.profile?.location ?? "—" },
    {
      title: "Website",
      key: "website",
      width: 160,
      ellipsis: true,
      render: (_, row) => row.profile?.websiteUrl ? <Typography.Link href={row.profile.websiteUrl} target="_blank" rel="noreferrer">{row.profile.websiteUrl}</Typography.Link> : "—",
    },
    {
      title: "Twitter",
      key: "twitter",
      width: 120,
      render: (_, row) => row.profile?.twitterUsername ? <Typography.Link href={`https://twitter.com/${row.profile.twitterUsername}`} target="_blank" rel="noreferrer">@{row.profile.twitterUsername}</Typography.Link> : "—",
    },
    { title: "Followers", key: "followers", width: 100, sorter: (a, b) => (a.profile?.followers ?? 0) - (b.profile?.followers ?? 0), render: (_, row) => (row.profile?.followers ?? 0).toLocaleString() },
    { title: "Following", key: "following", width: 100, sorter: (a, b) => (a.profile?.following ?? 0) - (b.profile?.following ?? 0), render: (_, row) => (row.profile?.following ?? 0).toLocaleString() },
    { title: "Repos", key: "repos", width: 80, render: (_, row) => (row.profile?.publicRepos ?? 0).toLocaleString() },
    {
      title: "Actions",
      key: "actions",
      width: isFollower ? 280 : 180,
      fixed: "right",
      className: "social-actions-cell",
      render: (_, row) => <AccountActions login={row.login} isFollower={isFollower} />,
    },
  ];
}

export function FollowersCard() {
  return <SocialAccountsCard title="Followers" isFollower />;
}

export function FollowingCard() {
  return <SocialAccountsCard title="Following" isFollower={false} />;
}

function SocialAccountsCard({ title, isFollower }: { title: string; isFollower: boolean }) {
  const logins = useSpamBlockerStore((state) => isFollower ? state.followerLogins : state.followingLogins);
  const profiles = useSpamBlockerStore((state) => state.socialProfiles);
  const [pageSize, setPageSize] = useState(8);
  const rows = useMemo(() => logins.map((login) => ({ login, profile: profiles[login] })), [logins, profiles]);
  const columns = useMemo(() => createColumns(isFollower), [isFollower]);

  return (
    <Card title={title} extra={<Typography.Text type="secondary">{logins.length} accounts</Typography.Text>}>
      <Table<SocialAccountRow>
        className="blocked-table"
        rowKey="login"
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1600 }}
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [8, 16, 32, 64],
          showTotal: (total) => `${total} accounts`,
          onChange: (_, nextPageSize) => setPageSize(nextPageSize),
        }}
        locale={{ emptyText: <Empty description={`No ${title.toLowerCase()} found`} /> }}
      />
    </Card>
  );
}
