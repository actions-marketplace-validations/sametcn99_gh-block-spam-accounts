import { Alert, Card, Descriptions, Typography } from "antd";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";

export function RateLimitCard() {
  const rateLimit = useSpamBlockerStore((state) => state.rateLimit);

  return (
    <Card title="GitHub Rate Limit">
      {rateLimit ? (
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="Limit">{rateLimit.limit}</Descriptions.Item>
          <Descriptions.Item label="Remaining">{rateLimit.remaining}</Descriptions.Item>
          <Descriptions.Item label="Reset time (UTC)">
            <Typography.Text code>{rateLimit.resetAtIso}</Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert
          showIcon
          type="info"
          message="Rate-limit headers are shown after successful authentication."
        />
      )}
    </Card>
  );
}
