import {
  ApiOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Steps } from "antd";
import type { CSSProperties } from "react";

export type WorkflowStep = 0 | 1 | 2 | 3 | 4;

const stepItems = [
  { title: "Connect", icon: <ApiOutlined /> },
  { title: "Configure", icon: <SettingOutlined /> },
  { title: "Analyze", icon: <SearchOutlined /> },
  { title: "Review", icon: <EyeOutlined /> },
  { title: "Manage", icon: <CheckCircleOutlined /> },
];

const sectionIds: Record<WorkflowStep, string> = {
  0: "section-connect",
  1: "section-configure",
  2: "section-analyze",
  3: "section-review",
  4: "section-manage",
};

const containerStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  background: "linear-gradient(180deg, #0f172a 60%, transparent 100%)",
  padding: "16px 0 24px",
};

interface WorkflowStepsProps {
  currentStep: WorkflowStep;
}

export function WorkflowSteps({ currentStep }: WorkflowStepsProps) {
  function handleStepClick(step: number) {
    if (step > currentStep) return;
    const id = sectionIds[step as WorkflowStep];
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div style={containerStyle}>
      <Steps
        current={currentStep}
        size="small"
        items={stepItems.map((item, index) => ({
          ...item,
          style: index <= currentStep ? { cursor: "pointer" } : undefined,
          onClick: () => handleStepClick(index),
        }))}
        responsive={false}
      />
    </div>
  );
}

export { sectionIds };
