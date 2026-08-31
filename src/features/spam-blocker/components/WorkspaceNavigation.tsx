import {
  BarChartOutlined,
  BlockOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";

export type WorkspaceView = "dashboard" | "analysis" | "followers" | "following" | "blocked" | "activity";

type WorkspaceNavigationProps = {
  activeView: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
};

const items = [
  { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "analysis", icon: <BarChartOutlined />, label: "Analysis" },
  { key: "followers", icon: <TeamOutlined />, label: "Followers" },
  { key: "following", icon: <UserSwitchOutlined />, label: "Following" },
  { key: "blocked", icon: <BlockOutlined />, label: "Blocked" },
  { key: "activity", icon: <BarChartOutlined />, label: "Activity" },
];

export function WorkspaceNavigation({ activeView, onViewChange }: WorkspaceNavigationProps) {
  return (
    <nav className="workspace-navigation" aria-label="Workspace sections">
      <Menu
        mode="horizontal"
        selectedKeys={[activeView]}
        items={items}
        onClick={({ key }) => onViewChange(key as WorkspaceView)}
      />
    </nav>
  );
}
