import type { ThemeConfig } from "antd";
import { theme } from "antd";

export const darkCartoonTheme: ThemeConfig = {
  algorithm: [theme.darkAlgorithm],
  token: {
    colorPrimary: "#38bdf8",
    colorInfo: "#38bdf8",
    colorSuccess: "#4ade80",
    colorWarning: "#f59e0b",
    colorError: "#f87171",
    colorBgBase: "#090d17",
    colorTextBase: "#f8fbff",
    colorLink: "#67e8f9",
    borderRadius: 14,
    borderRadiusLG: 20,
    borderRadiusSM: 10,
    wireframe: false,
    fontFamily: "'Baloo 2', 'Nunito Sans', 'Trebuchet MS', sans-serif",
    fontFamilyCode: "'JetBrains Mono', 'Fira Code', monospace",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.35)",
  },
  components: {
    Layout: {
      bodyBg: "#090d17",
      headerBg: "#0f1629",
      siderBg: "#0f1629",
      footerBg: "#090d17",
    },
    Card: {
      colorBgContainer: "#111a30",
      colorBorderSecondary: "#243452",
      headerBg: "#111a30",
    },
    Button: {
      controlHeight: 42,
      borderRadius: 12,
      defaultBg: "#1a2847",
      defaultBorderColor: "#2f4878",
      defaultColor: "#ecf6ff",
      defaultHoverBg: "#21345e",
      defaultHoverBorderColor: "#3f629e",
    },
    Input: {
      colorBgContainer: "#0c1324",
      colorBorder: "#334d7d",
      activeBorderColor: "#38bdf8",
      hoverBorderColor: "#67e8f9",
    },
    Table: {
      colorBgContainer: "#101a30",
      headerBg: "#172745",
      headerColor: "#ecf6ff",
      rowHoverBg: "#162949",
      borderColor: "#2a3f66",
    },
    Progress: {
      remainingColor: "#273a5c",
      defaultColor: "#38bdf8",
    },
  },
};
