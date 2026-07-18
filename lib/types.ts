export type DepartmentId =
  | "operations"
  | "finance"
  | "sales"
  | "product"
  | "technology"
  | "people";

export type TrendDirection = "up" | "down" | "flat";
export type HealthStatus = "healthy" | "watch" | "at-risk" | "critical";
export type MetricFormat = "currency" | "percent" | "number" | "days";

export interface Person {
  id: string;
  name: string;
  initials: string;
  title: string;
  avatarUrl?: string;
}

export interface Department {
  id: DepartmentId;
  name: string;
  shortName: string;
  color: string;
  leaderId: string;
  headcount: number;
  annualBudget: number;
  description: string;
}

export interface SparklinePoint {
  label: string;
  value: number;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  format: MetricFormat;
  change: number;
  changeLabel: string;
  trend: TrendDirection;
  favorable: boolean;
  comparisonLabel: string;
  target: number;
  formattedTarget: string;
  targetProgress: number;
  description: string;
  sparkline: SparklinePoint[];
}

export interface MonthlyFinancialDatum {
  month: string;
  monthLabel: string;
  revenue: number;
  operatingCost: number;
  revenueTarget: number;
  priorYearRevenue: number;
  isForecast: boolean;
}

export interface WorkloadDatum {
  departmentId: DepartmentId;
  capacityHours: number;
  allocatedHours: number;
  availableHours: number;
  utilization: number;
  activeProjects: number;
  openRoles: number;
  status: HealthStatus;
}

export interface BudgetDatum {
  departmentId: DepartmentId;
  budget: number;
  actual: number;
  committed: number;
  forecast: number;
  variance: number;
  variancePercent: number;
  status: HealthStatus;
}

export type ProjectStatus = "on-track" | "at-risk" | "critical" | "completed";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export interface ProjectOwner extends Person {
  allocation: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  summary: string;
  departmentId: DepartmentId;
  owner: ProjectOwner;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  healthScore: number;
  budget: number;
  spent: number;
  startDate: string;
  targetDate: string;
  teamSize: number;
  openTasks: number;
  overdueTasks: number;
  riskCount: number;
  tags: string[];
  lastUpdatedAt: string;
}

export interface PortfolioSlice {
  status: ProjectStatus;
  label: string;
  count: number;
  budget: number;
  spent: number;
  color: string;
}

export type HeatmapMetricId =
  | "delivery"
  | "budget"
  | "capacity"
  | "quality"
  | "engagement";

export interface HeatmapMetric {
  id: HeatmapMetricId;
  label: string;
  description: string;
}

export interface HeatmapCell {
  departmentId: DepartmentId;
  metricId: HeatmapMetricId;
  value: number;
  status: HealthStatus;
  note: string;
}

export type TaskStatus = "todo" | "in-progress" | "in-review" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  projectId: string;
  departmentId: DepartmentId;
  assignee: Person;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  completedAt?: string;
  estimateHours: number;
  labels: string[];
  isOverdue: boolean;
}

export interface TaskTrendDatum {
  week: string;
  weekLabel: string;
  created: number;
  completed: number;
  overdue: number;
}

export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type RiskStatus = "open" | "mitigating" | "monitoring" | "resolved";
export type RiskTrend = "improving" | "stable" | "worsening";

export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  status: RiskStatus;
  trend: RiskTrend;
  departmentId: DepartmentId;
  projectId?: string;
  owner: Person;
  detectedAt: string;
  reviewDate: string;
  likelihood: number;
  impact: number;
  mitigation: string;
}

export type ActivityType =
  | "project-update"
  | "task-completed"
  | "risk-raised"
  | "budget-change"
  | "comment"
  | "milestone";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  actor: Person;
  title: string;
  description: string;
  occurredAt: string;
  departmentId: DepartmentId;
  projectId?: string;
  metadata?: Record<string, string | number>;
}

export type DeadlineType = "milestone" | "review" | "payment" | "launch" | "event";

export interface Deadline {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: DeadlineType;
  departmentId: DepartmentId;
  projectId?: string;
  owner: Person;
  location?: string;
  isAllDay: boolean;
  status: "confirmed" | "tentative" | "at-risk";
}

export interface DependencyNodeData {
  id: string;
  projectId: string;
  label: string;
  departmentId: DepartmentId;
  status: ProjectStatus;
  progress: number;
  position: {
    x: number;
    y: number;
  };
}

export interface DependencyEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  critical: boolean;
  lagDays: number;
}

export type DashboardEntityType = "department" | "project" | "task" | "risk";

export interface DashboardFilterState {
  departmentIds: DepartmentId[];
  projectStatuses: ProjectStatus[];
  dateRange: {
    from: string;
    to: string;
  };
  search: string;
}
