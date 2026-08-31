import { Layout, Space } from "antd";
import type { CSSProperties } from "react";
import { useState, type ReactNode } from "react";
import { AnalysisProgressCard } from "./components/AnalysisProgressCard";
import { AppWorkspaceHeader } from "./components/AppWorkspaceHeader";
import { AuthStatusCard } from "./components/AuthStatusCard";
import { BlockedUsersCard } from "./components/BlockedUsersCard";
import { BlockingCard } from "./components/BlockingCard";
import { ContributionCard } from "./components/ContributionCard";
import { CustomKeywordsCard } from "./components/CustomKeywordsCard";
import { DetectionsCard } from "./components/DetectionsCard";
import { GitHubActionGuideCard } from "./components/GitHubActionGuideCard";
import { InsightCards } from "./components/InsightCards";
import { PageHeaderCard } from "./components/PageHeaderCard";
import { RateLimitCard } from "./components/RateLimitCard";
import { RuntimeLogsCard } from "./components/RuntimeLogsCard";
import { FollowersCard, FollowingCard } from "./components/SocialAccountsCard";
import { TokenCard } from "./components/TokenCard";
import { WorkspaceNavigation, type WorkspaceView } from "./components/WorkspaceNavigation";
import { useSpamBlockerStore } from "../../stores/useSpamBlockerStore";

const contentStyle: CSSProperties = {
  width: "100%",
  padding: "24px 20px 40px",
};

export function SpamBlockerPage() {
  const [activeView, setActiveView] = useState<WorkspaceView>("dashboard");
  const authenticatedUser = useSpamBlockerStore((state) => state.authenticatedUser);

  if (!authenticatedUser) {
    return (
      <Layout className="landing-layout" style={{ minHeight: "100vh" }}>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <Layout.Content id="main-content" role="main" aria-label="Connect your GitHub account">
          <div className="landing-content">
            <PageHeaderCard />
            <div className="landing-connect-card">
              <TokenCard />
            </div>
            <GitHubActionGuideCard />
            <ContributionCard />
          </div>
        </Layout.Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <Layout.Content
        id="main-content"
        role="main"
        aria-label="Spam blocker workspace"
        style={contentStyle}
      >
        <AppWorkspaceHeader />
        <WorkspaceNavigation activeView={activeView} onViewChange={setActiveView} />

        <Space direction="vertical" size="large" style={{ width: "100%", marginTop: 20 }}>
          {activeView === "dashboard" ? (
            <ViewSection>
              <AuthStatusCard />
              <InsightCards />
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <AnalysisProgressCard />
                <RateLimitCard />
              </Space>
            </ViewSection>
          ) : null}

          {activeView === "analysis" ? (
            <ViewSection>
              <CustomKeywordsCard />
              <AnalysisProgressCard />
              <DetectionsCard />
              <BlockingCard />
            </ViewSection>
          ) : null}

          {activeView === "followers" ? <ViewSection><FollowersCard /></ViewSection> : null}
          {activeView === "following" ? <ViewSection><FollowingCard /></ViewSection> : null}
          {activeView === "blocked" ? <ViewSection><BlockedUsersCard /></ViewSection> : null}

          {activeView === "activity" ? (
            <ViewSection>
              <RuntimeLogsCard />
            </ViewSection>
          ) : null}
        </Space>
      </Layout.Content>
    </Layout>
  );
}

function ViewSection({ children }: { children: ReactNode }) {
  return (
    <div className="workspace-view" style={{ "--card-index": 0 } as CSSProperties}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {children}
      </Space>
    </div>
  );
}
