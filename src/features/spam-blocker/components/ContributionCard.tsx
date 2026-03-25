import { GithubOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import type { CSSProperties } from "react";
import { siteMetadata } from "../../../content/siteMetadata";

const bannerStyle: CSSProperties = {
  textAlign: "center",
  padding: "24px 16px",
  borderTop: "1px solid #334155",
};

export function ContributionCard() {
  const issueBody = encodeURIComponent(
    "## Suggested keyword or pattern\n\n- Keyword/Phrase:\n- Why it helps:\n- Example profile text (optional):\n",
  );

  const issueUrl = `${siteMetadata.repositoryUrl}/issues/new?title=Keyword%20Suggestion&body=${issueBody}`;
  const pullRequestUrl = `${siteMetadata.repositoryUrl}/pulls`;

  return (
    <div style={bannerStyle}>
      <Space direction="vertical" size={8} align="center">
        <Typography.Text type="secondary">
          <GithubOutlined /> Help improve detection — suggest keywords or open a pull request.
        </Typography.Text>
        <Space>
          <Button size="small" type="link" href={issueUrl} target="_blank" rel="noreferrer">
            Suggest Keyword
          </Button>
          <Button size="small" type="link" href={pullRequestUrl} target="_blank" rel="noreferrer">
            Open PR
          </Button>
        </Space>
      </Space>
    </div>
  );
}
