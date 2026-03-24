import { HappyProvider } from "@ant-design/happy-work-theme";
import { App as AntdApp, ConfigProvider } from "antd";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { darkCartoonTheme } from "./theme/darkCartoonTheme";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ConfigProvider theme={darkCartoonTheme}>
      <HappyProvider>
        <AntdApp>
          <App />
        </AntdApp>
      </HappyProvider>
    </ConfigProvider>
  </StrictMode>,
);
