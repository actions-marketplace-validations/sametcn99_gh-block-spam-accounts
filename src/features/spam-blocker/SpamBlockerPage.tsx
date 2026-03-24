import { Layout, Space } from "antd";
import type { CSSProperties } from "react";
import { AnalysisProgressCard } from "./components/AnalysisProgressCard";
import { AuthStatusCard } from "./components/AuthStatusCard";
import { BlockedUsersCard } from "./components/BlockedUsersCard";
import { BlockingCard } from "./components/BlockingCard";
import { ContributionCard } from "./components/ContributionCard";
import { CustomKeywordsCard } from "./components/CustomKeywordsCard";
import { DetectionsCard } from "./components/DetectionsCard";
import { PageHeaderCard } from "./components/PageHeaderCard";
import { RateLimitCard } from "./components/RateLimitCard";
import { RuntimeLogsCard } from "./components/RuntimeLogsCard";
import { TokenCard } from "./components/TokenCard";

const contentStyle: CSSProperties = {
  maxWidth: 980,
  width: "100%",
  margin: "0 auto",
  padding: 20,
};

export function SpamBlockerPage() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Content style={contentStyle}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <PageHeaderCard />
          <TokenCard />
          <AuthStatusCard />
          <CustomKeywordsCard />
          <AnalysisProgressCard />
          <RateLimitCard />
          <DetectionsCard />
          <BlockingCard />
          <BlockedUsersCard />
          <ContributionCard />
          <RuntimeLogsCard />
        </Space>
      </Layout.Content>
    </Layout>
  );
}
