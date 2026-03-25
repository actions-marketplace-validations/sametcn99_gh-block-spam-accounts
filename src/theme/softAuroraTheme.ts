import type { ThemeConfig } from "antd";
import { theme } from "antd";

export const softAuroraTheme: ThemeConfig = {
  algorithm: [theme.darkAlgorithm],
  token: {
    colorPrimary: "#6366f1",
    colorInfo: "#6366f1",
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorBgBase: "#0f172a",
    colorTextBase: "#f1f5f9",
    colorLink: "#818cf8",
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    wireframe: false,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontFamilyCode: "'JetBrains Mono', 'Fira Code', monospace",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
    motion: true,
  },
  components: {
    Layout: {
      bodyBg: "transparent",
      headerBg: "#1e293b",
      siderBg: "#1e293b",
      footerBg: "transparent",
    },
    Card: {
      colorBgContainer: "#1e293b",
      colorBorderSecondary: "#334155",
      headerBg: "#1e293b",
    },
    Button: {
      controlHeight: 38,
      borderRadius: 8,
      defaultBg: "#334155",
      defaultBorderColor: "#475569",
      defaultColor: "#e2e8f0",
      defaultHoverBg: "#475569",
      defaultHoverBorderColor: "#64748b",
    },
    Input: {
      colorBgContainer: "#0f172a",
      colorBorder: "#475569",
      activeBorderColor: "#6366f1",
      hoverBorderColor: "#818cf8",
    },
    InputNumber: {
      colorBgContainer: "#0f172a",
      colorBorder: "#475569",
      activeBorderColor: "#6366f1",
      hoverBorderColor: "#818cf8",
    },
    Table: {
      colorBgContainer: "#1e293b",
      headerBg: "#334155",
      headerColor: "#e2e8f0",
      rowHoverBg: "#334155",
      borderColor: "#475569",
    },
    Progress: {
      remainingColor: "#334155",
      defaultColor: "#6366f1",
    },
    Steps: {
      colorPrimary: "#6366f1",
    },
    Collapse: {
      colorBgContainer: "#1e293b",
      headerBg: "#1e293b",
    },
    Segmented: {
      itemSelectedBg: "#6366f1",
      itemSelectedColor: "#ffffff",
    },
    Descriptions: {
      colorBgContainer: "#1e293b",
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Alert: {
      colorInfoBg: "rgba(99, 102, 241, 0.08)",
      colorInfoBorder: "rgba(99, 102, 241, 0.25)",
      colorSuccessBg: "rgba(34, 197, 94, 0.08)",
      colorSuccessBorder: "rgba(34, 197, 94, 0.25)",
      colorWarningBg: "rgba(245, 158, 11, 0.08)",
      colorWarningBorder: "rgba(245, 158, 11, 0.25)",
      colorErrorBg: "rgba(239, 68, 68, 0.08)",
      colorErrorBorder: "rgba(239, 68, 68, 0.25)",
    },
  },
};
