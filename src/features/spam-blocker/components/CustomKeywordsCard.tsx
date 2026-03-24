import { Button, Card, Input, Segmented, Space, Tag, Typography } from "antd";
import { useState } from "react";
import { useSpamBlockerStore } from "../../../stores/useSpamBlockerStore";
import type { DetectionSensitivity } from "../../../types/spam";

export function CustomKeywordsCard() {
  const [keywordDraft, setKeywordDraft] = useState("");
  const detectionSensitivity = useSpamBlockerStore((state) => state.detectionSensitivity);
  const customKeywords = useSpamBlockerStore((state) => state.customKeywords);
  const setDetectionSensitivity = useSpamBlockerStore((state) => state.setDetectionSensitivity);
  const addCustomKeyword = useSpamBlockerStore((state) => state.addCustomKeyword);
  const removeCustomKeyword = useSpamBlockerStore((state) => state.removeCustomKeyword);

  return (
    <Card title="Session Keywords">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Typography.Text type="secondary">
          Add temporary detection keywords for this browser session. They are not saved and
          disappear on refresh.
        </Typography.Text>
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <Typography.Text strong>Detection Sensitivity</Typography.Text>
          <Segmented<DetectionSensitivity>
            block
            value={detectionSensitivity}
            options={[
              { label: "Aggressive", value: "aggressive" },
              { label: "Balanced", value: "balanced" },
              { label: "Conservative", value: "conservative" },
            ]}
            onChange={(value) => {
              setDetectionSensitivity(value);
            }}
          />
          <Typography.Text type="secondary">
            Aggressive catches more suspicious profiles, Conservative reduces false positives.
          </Typography.Text>
        </Space>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={keywordDraft}
            placeholder="Enter keyword phrase"
            onChange={(event) => {
              setKeywordDraft(event.target.value);
            }}
            onPressEnter={() => {
              addCustomKeyword(keywordDraft);
              setKeywordDraft("");
            }}
          />
          <Button
            type="primary"
            onClick={() => {
              addCustomKeyword(keywordDraft);
              setKeywordDraft("");
            }}
          >
            Add Keyword
          </Button>
        </Space.Compact>
        <Space size={[8, 8]} wrap>
          {customKeywords.map((keyword) => (
            <Tag
              key={keyword}
              closable
              onClose={(event) => {
                event.preventDefault();
                removeCustomKeyword(keyword);
              }}
              color="blue"
            >
              {keyword}
            </Tag>
          ))}
        </Space>
      </Space>
    </Card>
  );
}
