import { RocketOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Space, Tag, Typography } from "antd";
import type { CSSProperties } from "react";
import { siteMetadata } from "../../../content/siteMetadata";

const workflowSnippet = `name: Detect GitHub spam accounts

on:
  workflow_dispatch:
  schedule:
    - cron: "0 6 * * *"

jobs:
  spam-blocker:
    runs-on: ubuntu-latest
    steps:
      - name: Run spam blocker
        uses: sametcn99/gh-block-spam-accounts@main
        with:
          github-token: \${{ secrets.SPAM_BLOCKER_TOKEN }}
          detection-sensitivity: balanced
          target-type: both
          apply-blocks: "false"
          delay-ms: "750"`;

const codeBlockStyle: CSSProperties = {
  margin: 0,
  padding: 16,
  borderRadius: 12,
  background: "#020617",
  border: "1px solid #1e293b",
  overflowX: "auto",
  fontSize: 12,
  lineHeight: 1.6,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

export function GitHubActionGuideCard() {
  const remoteExampleUrl = `${siteMetadata.repositoryUrl}/blob/main/examples/spam-blocker-remote.yml`;
  const readmeActionSectionUrl = `${siteMetadata.repositoryUrl}#github-action`;

  return (
    <Card
      style={{ marginBottom: 16 }}
      title={
        <>
          <RocketOutlined /> Use This Project As A GitHub Action
        </>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          message="You do not need to clone this repository to use the automation flow. Any repository can call this project directly as a reusable GitHub Action."
        />

        <Typography.Paragraph style={{ marginBottom: 0 }}>
          Use the web app when you want an interactive review flow in the browser. Use the GitHub
          Action when you want scheduled scans, repeatable dry-runs, or a controlled blocking job
          that can run from another repository.
        </Typography.Paragraph>

        <Space wrap>
          <Tag color="blue">No clone required</Tag>
          <Tag color="gold">Dry-run by default</Tag>
          <Tag color="purple">Reusable workflow step</Tag>
          <Tag color="red">PAT required for real blocking</Tag>
        </Space>

        <div>
          <Typography.Title level={5}>How it works</Typography.Title>
          <Typography.Paragraph style={{ marginBottom: 8 }}>
            Add a workflow in any repository and reference this action with a release tag such as{" "}
            <Typography.Text code>sametcn99/gh-block-spam-accounts@main</Typography.Text>. The
            action will authenticate with your token, collect followers, following accounts, or
            both depending on your configuration, apply the same spam detection rules used by the
            web app, and optionally send block requests when{" "}
            <Typography.Text code>apply-blocks</Typography.Text> is enabled.
          </Typography.Paragraph>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            For safe automation, keep <Typography.Text code>apply-blocks</Typography.Text> set to{" "}
            <Typography.Text code>false</Typography.Text> until you trust the output. Once you are
            satisfied, switch to a PAT secret with the right permissions and enable real blocking.
          </Typography.Paragraph>
        </div>

        <div>
          <Typography.Title level={5}>Minimal workflow</Typography.Title>
          <pre style={codeBlockStyle}>{workflowSnippet}</pre>
        </div>

        <div>
          <Typography.Title level={5}>Operational notes</Typography.Title>
          <Typography.Paragraph style={{ marginBottom: 8 }}>
            Use a classic PAT with the <Typography.Text code>user</Typography.Text> scope, or a
            fine-grained token with{" "}
            <Typography.Text strong>Block another user: write</Typography.Text>, if you want actual
            block operations to succeed. The default repository{" "}
            <Typography.Text code>GITHUB_TOKEN</Typography.Text> is usually not enough for blocking.
          </Typography.Paragraph>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            Recommended inputs are{" "}<Typography.Text code>detection-sensitivity</Typography.Text>,{" "}
            <Typography.Text code>target-type</Typography.Text>,{" "}
            <Typography.Text code>custom-keywords</Typography.Text>, and{" "}
            <Typography.Text code>delay-ms</Typography.Text>. Keep the action pinned to a stable
            release tag instead of <Typography.Text code>main</Typography.Text> in production.
          </Typography.Paragraph>
        </div>

        <div style={buttonRowStyle}>
          <Button type="primary" href={remoteExampleUrl} target="_blank" rel="noreferrer">
            Open Remote Workflow Example
          </Button>
          <Button href={readmeActionSectionUrl} target="_blank" rel="noreferrer">
            Open Action Documentation
          </Button>
        </div>
      </Space>
    </Card>
  );
}