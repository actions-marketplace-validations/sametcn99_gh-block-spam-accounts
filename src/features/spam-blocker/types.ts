import type { ColumnsType } from "antd/es/table";
import type { SpamDetection } from "../../types/spam";

export type DetectionTableColumn = ColumnsType<SpamDetection>[number];
