import { Button, Card, Space, Typography } from "antd";
import { siteMetadata } from "../../../content/siteMetadata";

export function ContributionCard() {
  const issueBody = encodeURIComponent(
    "## Suggested keyword or pattern\n\n- Keyword/Phrase:\n- Why it helps:\n- Example profile text (optional):\n",
  );

  const issueUrl = `${siteMetadata.repositoryUrl}/issues/new?title=Keyword%20Suggestion&body=${issueBody}`;
  const pullRequestUrl = `${siteMetadata.repositoryUrl}/pulls`;

  return (
    <Card title="Contribute Detection Keywords">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Text type="secondary">
          Help improve spam detection quality by proposing new keyword ideas and patterns in the
          GitHub repository.
        </Typography.Text>
        <Space wrap>
          <Button type="primary" href={issueUrl} target="_blank" rel="noreferrer">
            Open Keyword Suggestion Issue
          </Button>
          <Button href={pullRequestUrl} target="_blank" rel="noreferrer">
            Open Pull Request Page
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
