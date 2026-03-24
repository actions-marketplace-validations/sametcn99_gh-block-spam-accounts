import { Alert, Card, Progress, Space, Statistic } from "antd";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

export function AnalysisProgressCard() {
  const analysisStatus = useSpamBlockerStore((state) => state.analysisStatus);
  const analysisProgress = useSpamBlockerStore((state) => state.analysisProgress);

  const percent =
    analysisProgress.totalProfiles > 0
      ? Math.round((analysisProgress.processedProfiles / analysisProgress.totalProfiles) * 100)
      : 0;

  return (
    <Card title="Analysis Progress">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Progress percent={percent} status={analysisStatus === "error" ? "exception" : undefined} />
        <Space size="large" wrap>
          <Statistic title="Followers" value={analysisProgress.followersCount} />
          <Statistic title="Following" value={analysisProgress.followingCount} />
          <Statistic title="Candidates" value={analysisProgress.candidateCount} />
          <Statistic
            title="Profiles processed"
            value={`${analysisProgress.processedProfiles}/${analysisProgress.totalProfiles}`}
          />
        </Space>
        {analysisStatus === "running" ? (
          <Alert showIcon type="info" message="Analysis is running in your browser." />
        ) : null}
      </Space>
    </Card>
  );
}
