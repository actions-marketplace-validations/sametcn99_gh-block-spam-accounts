import {
  AuditOutlined,
  SafetyCertificateOutlined,
  SecurityScanOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Badge, Button, Card, Input, Segmented, Space, Tag, Typography } from "antd";
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

  const handleAdd = () => {
    const trimmed = keywordDraft.trim();
    if (!trimmed) return;
    addCustomKeyword(trimmed);
    setKeywordDraft("");
  };

  return (
    <Card
      title={
        <Space>
          <TagOutlined style={{ color: "#7c3aed" }} />
          <span>Session Keywords</span>
          {customKeywords.length > 0 && (
            <Badge count={customKeywords.length} style={{ backgroundColor: "#7c3aed" }} />
          )}
        </Space>
      }
    >
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
              {
                label: (
                  <Space size={4}>
                    <SecurityScanOutlined /> Aggressive
                  </Space>
                ),
                value: "aggressive",
              },
              {
                label: (
                  <Space size={4}>
                    <AuditOutlined /> Balanced
                  </Space>
                ),
                value: "balanced",
              },
              {
                label: (
                  <Space size={4}>
                    <SafetyCertificateOutlined /> Conservative
                  </Space>
                ),
                value: "conservative",
              },
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
            onPressEnter={handleAdd}
          />
          <Button type="primary" onClick={handleAdd}>
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
              color="purple"
              className="keyword-tag"
            >
              {keyword}
            </Tag>
          ))}
        </Space>
      </Space>
    </Card>
  );
}
