import { Layout, Space } from "antd";
import type { CSSProperties } from "react";
import { useSpamBlockerStore } from "../../stores/useSpamBlockerStore";
import { AnalysisProgressCard } from "./components/AnalysisProgressCard";
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
import { StickyStatusBar } from "./components/StickyStatusBar";
import { TokenCard } from "./components/TokenCard";
import { sectionIds, type WorkflowStep, WorkflowSteps } from "./components/WorkflowSteps";

const contentStyle: CSSProperties = {
  maxWidth: 980,
  width: "100%",
  margin: "0 auto",
  padding: 20,
};

function useCurrentStep(): WorkflowStep {
  const authenticatedUser = useSpamBlockerStore((s) => s.authenticatedUser);
  const analysisStatus = useSpamBlockerStore((s) => s.analysisStatus);
  const detections = useSpamBlockerStore((s) => s.detections);
  const blockStatus = useSpamBlockerStore((s) => s.blockStatus);

  if (!authenticatedUser) return 0;
  if (analysisStatus === "idle") return 1;
  if (analysisStatus === "running") return 2;
  if (analysisStatus === "completed" && detections.length > 0 && blockStatus === "idle") return 3;
  if (blockStatus !== "idle" || analysisStatus === "completed") return 4;
  return 1;
}

export function SpamBlockerPage() {
  const currentStep = useCurrentStep();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Content style={contentStyle}>
        <PageHeaderCard />
        <GitHubActionGuideCard />
        <WorkflowSteps currentStep={currentStep} />
        <StickyStatusBar />

        <Space direction="vertical" size="large" style={{ width: "100%", marginTop: 16 }}>
          {/* Step 0: Connect */}
          <div id={sectionIds[0]} className="fade-in">
            <TokenCard />
          </div>

          {/* Step 1: Configure – visible after auth */}
          {currentStep >= 1 && (
            <div id={sectionIds[1]} className="fade-in">
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <AuthStatusCard />
                <CustomKeywordsCard />
              </Space>
            </div>
          )}

          {/* Step 2: Analyze – visible during / after analysis */}
          {currentStep >= 2 && (
            <div id={sectionIds[2]} className="fade-in">
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <AnalysisProgressCard />
                <RateLimitCard />
              </Space>
            </div>
          )}

          {/* Step 3: Review – visible when detections exist */}
          {currentStep >= 3 && (
            <div id={sectionIds[3]} className="fade-in">
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <InsightCards />
                <DetectionsCard />
                <BlockingCard />
              </Space>
            </div>
          )}

          {/* Step 4: Manage – visible after blocking started or completed */}
          {currentStep >= 4 && (
            <div id={sectionIds[4]} className="fade-in">
              <BlockedUsersCard />
            </div>
          )}

          <ContributionCard />
          <RuntimeLogsCard />
        </Space>
      </Layout.Content>
    </Layout>
  );
}
