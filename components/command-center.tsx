"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Toaster, toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownToLine,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  CircleCheck,
  CloudCog,
  DatabaseZap,
  GripVertical,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { WorkspaceNav } from "@/components/workspace-nav";
import { TopCommandBar } from "@/components/top-command-bar";
import { CommandPalette } from "@/components/command-palette";
import { DetailPanel } from "@/components/detail-panel";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { ProjectTable } from "@/components/project-table";
import {
  ActivityTimeline,
  BudgetActual,
  Deadlines,
  DepartmentHeatmap,
  DependencyGraph,
  FinancialChart,
  KpiStrip,
  PortfolioHealth,
  RiskFeed,
  TaskTrend,
  WorkloadDistribution,
  type DashboardSelection,
} from "@/components/dashboard-widgets";
import { Badge, Button, TooltipProvider } from "@/components/ui";
import {
  activities,
  budgetByDepartment,
  dashboardSnapshotAt,
  deadlines,
  departments,
  dependencyEdges,
  dependencyNodes,
  heatmapMetrics,
  kpiMetrics,
  monthlyFinancials,
  performanceHeatmap,
  projects as initialProjects,
  risks,
  taskTrends,
  tasks,
  teamMembers,
  workloadByDepartment,
} from "@/lib/mock-data";
import type { DepartmentId, KpiMetric, PortfolioSlice, Project, Risk, Task } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type PresetView = "executive" | "finance" | "delivery" | "leadership";
type SavedView = PresetView | "custom";
type DataState = "live" | "loading" | "error";
type ModuleId = "portfolio" | "workload" | "budget";
type CustomSavedView = {
  label: string;
  department: string;
  dateRange: string;
  moduleOrder: ModuleId[];
  projectFilter: PresetView;
};

const DEFAULT_MODULE_ORDER: ModuleId[] = ["portfolio", "workload", "budget"];
const statusColors: Record<Project["status"], string> = {
  "on-track": "#21a779",
  "at-risk": "#dc9d32",
  critical: "#e25d66",
  completed: "#5f78d8",
};

const savedViews: Array<{ id: SavedView; label: string; description: string }> = [
  { id: "executive", label: "Executive pulse", description: "All company priorities" },
  { id: "finance", label: "Finance watch", description: "Budget and margin exposure" },
  { id: "delivery", label: "At-risk delivery", description: "Programs needing intervention" },
  { id: "leadership", label: "Leadership focus", description: "Urgent, leadership-owned initiatives" },
];

export function CommandCenter() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeReady, setThemeReady] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [savedView, setSavedView] = useState<SavedView>("executive");
  const [customView, setCustomView] = useState<CustomSavedView | null>(null);
  const [dateRange, setDateRange] = useState("FY 2026");
  const [commandOpen, setCommandOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [detailSelection, setDetailSelection] = useState<DashboardSelection | null>(null);
  const [projectRecords, setProjectRecords] = useState<Project[]>(initialProjects);
  const [riskRecords, setRiskRecords] = useState<Risk[]>(risks);
  const [taskRecords, setTaskRecords] = useState<Task[]>(tasks);
  const [editMode, setEditMode] = useState(false);
  const [dataState, setDataState] = useState<DataState>("live");
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("4 min ago");
  const [moduleOrder, setModuleOrder] = useState<ModuleId[]>(DEFAULT_MODULE_ORDER);
  const [draggedModule, setDraggedModule] = useState<ModuleId | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("arc-theme");
    const nextTheme = storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(nextTheme);
    setThemeReady(true);
    const storedSidebar = window.localStorage.getItem("arc-sidebar");
    if (storedSidebar === "collapsed") setSidebarCollapsed(true);
    const storedOrder = window.localStorage.getItem("arc-module-order");
    if (storedOrder) {
      try {
        const parsed = JSON.parse(storedOrder) as ModuleId[];
        if (parsed.length === DEFAULT_MODULE_ORDER.length && parsed.every((id) => DEFAULT_MODULE_ORDER.includes(id))) setModuleOrder(parsed);
      } catch { /* keep deterministic defaults */ }
    }
    const storedView = window.localStorage.getItem("arc-custom-view");
    if (storedView) {
      try {
        const parsed = JSON.parse(storedView) as CustomSavedView;
        if (
          typeof parsed.label === "string" &&
          typeof parsed.department === "string" &&
          typeof parsed.dateRange === "string" &&
          ["executive", "finance", "delivery", "leadership"].includes(parsed.projectFilter) &&
          Array.isArray(parsed.moduleOrder) &&
          parsed.moduleOrder.length === DEFAULT_MODULE_ORDER.length &&
          parsed.moduleOrder.every((id) => DEFAULT_MODULE_ORDER.includes(id))
        ) setCustomView(parsed);
      } catch { /* ignore an invalid saved view */ }
    }
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("arc-theme", theme);
  }, [theme, themeReady]);

  useEffect(() => {
    window.localStorage.setItem("arc-sidebar", sidebarCollapsed ? "collapsed" : "expanded");
  }, [sidebarCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("arc-module-order", JSON.stringify(moduleOrder));
  }, [moduleOrder]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (isTyping) return;
      if (event.key === "/") {
        event.preventDefault();
        setCommandOpen(true);
      } else if (event.key === "[") {
        setSidebarCollapsed((value) => !value);
      } else if (event.key.toLowerCase() === "e") {
        setEditMode((value) => !value);
      } else if (event.key === "Escape") {
        setDetailSelection(null);
        setEditMode(false);
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const filteredProjects = useMemo(() => {
    let result = selectedDepartment === "all" ? projectRecords : projectRecords.filter((project) => project.departmentId === selectedDepartment);
    const projectFilter = savedView === "custom" ? customView?.projectFilter ?? "executive" : savedView;
    if (projectFilter === "delivery") result = result.filter((project) => project.status === "at-risk" || project.status === "critical");
    if (projectFilter === "leadership") result = result.filter((project) => project.priority === "urgent" || project.owner.allocation >= 70);
    return result;
  }, [customView, projectRecords, savedView, selectedDepartment]);

  const filteredRisks = useMemo(() => riskRecords.filter((risk) => risk.status !== "resolved" && (selectedDepartment === "all" || risk.departmentId === selectedDepartment)), [riskRecords, selectedDepartment]);
  const filteredBudget = useMemo(() => selectedDepartment === "all" ? budgetByDepartment : budgetByDepartment.filter((item) => item.departmentId === selectedDepartment), [selectedDepartment]);
  const filteredWorkload = useMemo(() => selectedDepartment === "all" ? workloadByDepartment : workloadByDepartment.filter((item) => item.departmentId === selectedDepartment), [selectedDepartment]);
  const filteredActivities = useMemo(() => selectedDepartment === "all" ? activities : activities.filter((item) => item.departmentId === selectedDepartment), [selectedDepartment]);
  const filteredDeadlines = useMemo(() => {
    const start = new Date(dashboardSnapshotAt);
    const end = new Date("2026-07-31T23:59:59.999+02:00");
    return deadlines.filter((item) => {
      const date = new Date(item.date);
      const inWindow = date >= start && date <= end;
      const inDepartment = selectedDepartment === "all" || item.departmentId === selectedDepartment;
      return inWindow && inDepartment;
    });
  }, [selectedDepartment]);

  const financialData = useMemo(() => {
    let periodData = monthlyFinancials;
    if (dateRange === "Q2 2026") periodData = monthlyFinancials.slice(3, 6);
    if (dateRange === "Q3 2026") periodData = monthlyFinancials.slice(6, 9);
    if (dateRange === "FY 2026 YTD") periodData = monthlyFinancials.slice(0, 7);
    if (dateRange === "H2 2026") periodData = monthlyFinancials.slice(6, 12);
    if (selectedDepartment === "all") return periodData;
    const departmentIndex = departments.findIndex((department) => department.id === selectedDepartment);
    const revenueShares = [0.19, 0.11, 0.28, 0.2, 0.16, 0.06];
    const costShares = [0.2, 0.09, 0.17, 0.21, 0.26, 0.07];
    const revenueShare = revenueShares[Math.max(departmentIndex, 0)];
    const costShare = costShares[Math.max(departmentIndex, 0)];
    return periodData.map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * revenueShare),
      operatingCost: Math.round(item.operatingCost * costShare),
      revenueTarget: Math.round(item.revenueTarget * revenueShare),
      priorYearRevenue: Math.round(item.priorYearRevenue * revenueShare),
    }));
  }, [dateRange, selectedDepartment]);

  const displayKpis = useMemo<KpiMetric[]>(() => {
    const active = filteredProjects.filter((project) => project.status !== "completed");
    const onTrack = active.filter((project) => project.status === "on-track").length;
    const overdue = active.reduce((sum, project) => sum + project.overdueTasks, 0);
    const latestRevenueRow = [...financialData].reverse().find((item) => !item.isForecast) ?? financialData[financialData.length - 1];
    const currentRevenue = latestRevenueRow?.revenue ?? 0;
    const currentMargin = latestRevenueRow?.revenue ? ((latestRevenueRow.revenue - latestRevenueRow.operatingCost) / latestRevenueRow.revenue) * 100 : 0;
    return kpiMetrics.map((kpi) => {
      if (kpi.id === "monthly-revenue") {
        const prior = latestRevenueRow?.priorYearRevenue ?? 0;
        const growth = prior ? ((currentRevenue - prior) / prior) * 100 : 0;
        const target = latestRevenueRow?.revenueTarget ?? 0;
        const planGap = currentRevenue - target;
        return { ...kpi, value: currentRevenue, formattedValue: formatCurrency(currentRevenue, true), change: growth, changeLabel: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`, comparisonLabel: `vs. ${latestRevenueRow?.monthLabel ?? "prior"} 2025`, favorable: growth >= 0, trend: growth >= 0 ? "up" : "down", target, formattedTarget: `${formatCurrency(target, true)} target`, targetProgress: target ? (currentRevenue / target) * 100 : 100, description: `${latestRevenueRow?.monthLabel ?? "Current"} revenue is ${formatCurrency(Math.abs(planGap), true)} ${planGap >= 0 ? "ahead of" : "behind"} the operating plan.`, sparkline: financialData.map((item) => ({ label: item.monthLabel, value: item.revenue })) };
      }
      if (kpi.id === "operating-margin") {
        return { ...kpi, value: currentMargin, formattedValue: `${currentMargin.toFixed(1)}%`, change: currentMargin - kpi.target, changeLabel: `${currentMargin >= kpi.target ? "+" : ""}${(currentMargin - kpi.target).toFixed(1)} pts`, comparisonLabel: "vs. plan", favorable: currentMargin >= kpi.target, trend: currentMargin >= kpi.target ? "up" : "down", targetProgress: kpi.target ? (currentMargin / kpi.target) * 100 : 100, sparkline: financialData.map((item) => ({ label: item.monthLabel, value: item.revenue ? ((item.revenue - item.operatingCost) / item.revenue) * 100 : 0 })) };
      }
      if (kpi.id === "portfolio-on-track") {
        const percent = active.length ? (onTrack / active.length) * 100 : 100;
        return { ...kpi, value: percent, formattedValue: `${Math.round(percent)}%`, description: `${onTrack} of ${active.length} active initiatives are currently on track.`, targetProgress: (percent / 80) * 100 };
      }
      if (kpi.id === "overdue-tasks") return { ...kpi, value: overdue, formattedValue: String(overdue), targetProgress: overdue ? Math.min(100, (5 / overdue) * 100) : 100, description: `${overdue} overdue tasks remain in the selected department.` };
      return kpi;
    });
  }, [filteredProjects, financialData, selectedDepartment]);

  const portfolioSlices = useMemo<PortfolioSlice[]>(() => {
    const statuses: Array<{ status: Project["status"]; label: string }> = [
      { status: "on-track", label: "On track" },
      { status: "at-risk", label: "At risk" },
      { status: "critical", label: "Critical" },
      { status: "completed", label: "Completed" },
    ];
    return statuses.map(({ status, label }) => {
      const subset = filteredProjects.filter((project) => project.status === status);
      return { status, label, count: subset.length, budget: subset.reduce((sum, project) => sum + project.budget, 0), spent: subset.reduce((sum, project) => sum + project.spent, 0), color: statusColors[status] };
    });
  }, [filteredProjects]);

  const graphData = useMemo(() => {
    const linkedNodes = dependencyNodes.map((node) => {
      const project = projectRecords.find((record) => record.id === node.projectId);
      return project ? { ...node, status: project.status, progress: project.progress } : node;
    });
    if (selectedDepartment === "all") return { nodes: linkedNodes, edges: dependencyEdges };
    const departmentNodeIds = new Set(linkedNodes.filter((node) => node.departmentId === selectedDepartment).map((node) => node.id));
    const relatedEdges = dependencyEdges.filter((edge) => departmentNodeIds.has(edge.source) || departmentNodeIds.has(edge.target));
    const relatedNodeIds = new Set([...departmentNodeIds, ...relatedEdges.flatMap((edge) => [edge.source, edge.target])]);
    return { nodes: linkedNodes.filter((node) => relatedNodeIds.has(node.id)), edges: relatedEdges };
  }, [projectRecords, selectedDepartment]);

  const scaledTaskTrends = useMemo(() => {
    if (selectedDepartment === "all") return taskTrends;
    const factor = Math.max(filteredProjects.length / projectRecords.length, 0.11);
    return taskTrends.map((item) => ({ ...item, created: Math.max(1, Math.round(item.created * factor)), completed: Math.max(1, Math.round(item.completed * factor)), overdue: Math.max(0, Math.round(item.overdue * factor)) }));
  }, [filteredProjects.length, projectRecords.length, selectedDepartment]);

  const selectedDepartmentName = departments.find((department) => department.id === selectedDepartment)?.name;
  const availableViews = customView
    ? [...savedViews, { id: "custom" as const, label: customView.label, description: "Your saved workspace context" }]
    : savedViews;
  const activeViewLabel = availableViews.find((view) => view.id === savedView)?.label ?? savedViews[0].label;
  const atRiskCount = filteredProjects.filter((project) => project.status === "at-risk" || project.status === "critical").length;
  const overdueCount = filteredProjects.reduce((sum, project) => sum + project.overdueTasks, 0);

  const selectDepartment = useCallback((id: string) => {
    setSelectedDepartment(id);
    if (id !== "finance" && savedView === "finance") setSavedView("executive");
    setMobileNavOpen(false);
    const name = departments.find((department) => department.id === id)?.name;
    if (name) toast.info(`${name} context applied`, { description: "Projects, financials, risks, and capacity are now linked." });
  }, [savedView]);

  function chooseSavedView(view: SavedView) {
    setSavedView(view);
    if (view === "custom" && customView) {
      setSelectedDepartment(customView.department);
      setDateRange(customView.dateRange);
      setModuleOrder(customView.moduleOrder);
    } else if (view === "finance") setSelectedDepartment("finance");
    else setSelectedDepartment("all");
    toast.success(`${availableViews.find((item) => item.id === view)?.label ?? "View"} loaded`);
  }

  function saveCurrentView() {
    const departmentLabel = selectedDepartmentName ?? "Company";
    const nextView: CustomSavedView = {
      label: `${departmentLabel} · ${dateRange.replace(" 2026", "")}`,
      department: selectedDepartment,
      dateRange,
      moduleOrder,
      projectFilter: savedView === "custom" ? customView?.projectFilter ?? "executive" : savedView,
    };
    setCustomView(nextView);
    setSavedView("custom");
    window.localStorage.setItem("arc-custom-view", JSON.stringify(nextView));
    toast.success("Current view saved", { description: "Department, reporting period, and module order will be restored together." });
  }

  function deleteCustomView() {
    setCustomView(null);
    if (savedView === "custom") setSavedView("executive");
    window.localStorage.removeItem("arc-custom-view");
    toast.success("Saved view removed");
  }

  function toggleTheme() {
    setTheme((value) => value === "dark" ? "light" : "dark");
  }

  function refreshData(): Promise<void> {
    if (dataState === "loading") return Promise.resolve();
    setDataState("loading");
    return new Promise((resolve) => window.setTimeout(() => {
        setDataState("live");
        setLastUpdatedLabel("just now");
        toast.success("Workspace refreshed", { description: "12 sources synced · just now" });
        resolve();
      }, 900));
  }

  async function shareWorkspace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Workspace link copied");
    } catch {
      toast.error("Couldn’t copy the workspace link", { description: "Copy the current URL from your browser instead." });
    }
  }

  function exportBrief() {
    const lines = [
      ["Project", "Code", "Department", "Status", "Progress", "Budget", "Spent", "Target"],
      ...filteredProjects.map((project) => [project.name, project.code, project.departmentId, project.status, `${project.progress}%`, String(project.budget), String(project.spent), project.targetDate]),
    ];
    const csv = lines.map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `arc-operations-${selectedDepartment}-${dateRange.toLowerCase().replaceAll(" ", "-")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Executive brief exported", { description: `${filteredProjects.length} initiatives included in the CSV.` });
  }

  function handleSelection(selection: DashboardSelection) {
    if (selection.type === "project" && selection.data && typeof selection.data === "object" && "id" in selection.data) {
      const matching = projectRecords.find((project) => project.id === (selection.data as { id: string }).id);
      if (matching) {
        setDetailSelection({ type: "project", data: matching });
        return;
      }
    }
    setDetailSelection(selection);
  }

  function updateProjects(updatedSubset: Project[]) {
    const updates = new Map(updatedSubset.map((project) => [project.id, project]));
    const completedIds = new Set(
      updatedSubset
        .filter((project) => project.status === "completed" && projectRecords.find((record) => record.id === project.id)?.status !== "completed")
        .map((project) => project.id),
    );
    setProjectRecords((current) => current.map((project) => updates.get(project.id) ?? project));
    if (completedIds.size > 0) {
      setTaskRecords((current) => current.map((task) => completedIds.has(task.projectId) ? { ...task, status: "done", completedAt: new Date().toISOString(), isOverdue: false } : task));
      setRiskRecords((current) => current.map((risk) => risk.projectId && completedIds.has(risk.projectId) ? { ...risk, status: "resolved", trend: "improving" } : risk));
    }
  }

  function updateTask(updatedTask: Task) {
    const previous = taskRecords.find((task) => task.id === updatedTask.id);
    const normalized: Task = updatedTask.status === "done"
      ? { ...updatedTask, completedAt: updatedTask.completedAt ?? new Date().toISOString(), isOverdue: false }
      : { ...updatedTask, completedAt: undefined, isOverdue: new Date(updatedTask.dueDate).getTime() < new Date(dashboardSnapshotAt).getTime() };
    setTaskRecords((current) => current.map((task) => task.id === normalized.id ? normalized : task));
    if (previous) {
      const previousOpen = previous.status === "done" ? 0 : 1;
      const nextOpen = normalized.status === "done" ? 0 : 1;
      const previousOverdue = previous.isOverdue && previous.status !== "done" ? 1 : 0;
      const nextOverdue = normalized.isOverdue && normalized.status !== "done" ? 1 : 0;
      setProjectRecords((current) => current.map((project) => project.id === normalized.projectId ? {
        ...project,
        openTasks: Math.max(0, project.openTasks + nextOpen - previousOpen),
        overdueTasks: Math.max(0, project.overdueTasks + nextOverdue - previousOverdue),
        lastUpdatedAt: new Date().toISOString(),
      } : project));
    }
    setDetailSelection({ type: "task", data: normalized });
  }

  function reorderModule(source: ModuleId, target: ModuleId) {
    if (source === target) return;
    setModuleOrder((current) => {
      const next = [...current];
      const from = next.indexOf(source);
      const to = next.indexOf(target);
      next.splice(from, 1);
      next.splice(to, 0, source);
      return next;
    });
  }

  const renderModule = (id: ModuleId) => {
    if (id === "portfolio") return <PortfolioHealth slices={portfolioSlices} editMode={editMode} />;
    if (id === "workload") return <WorkloadDistribution data={filteredWorkload} departments={departments} onDepartment={selectDepartment} editMode={editMode} />;
    return <BudgetActual data={filteredBudget} departments={departments} onDepartment={selectDepartment} editMode={editMode} />;
  };

  return (
    <TooltipProvider delayDuration={350}>
      <div className="min-h-screen bg-background">
        <WorkspaceNav
          collapsed={sidebarCollapsed}
          mobileOpen={mobileNavOpen}
          theme={theme}
          departments={departments}
          selectedDepartment={selectedDepartment}
          projectCount={projectRecords.length}
          riskCount={filteredRisks.filter((risk) => risk.severity === "critical" || risk.severity === "high").length}
          dataDegraded={dataState === "error"}
          onCollapse={() => setSidebarCollapsed((value) => !value)}
          onMobileClose={() => setMobileNavOpen(false)}
          onThemeToggle={toggleTheme}
          onDepartmentSelect={selectDepartment}
          onCommandOpen={() => setCommandOpen(true)}
        />
        <TopCommandBar
          collapsed={sidebarCollapsed}
          onMobileMenuOpen={() => setMobileNavOpen(true)}
          onCommandOpen={() => setCommandOpen(true)}
          dateRangeLabel={dateRange}
          onDateRangeSelect={setDateRange}
          theme={theme}
          dataDegraded={dataState === "error"}
          onThemeToggle={toggleTheme}
          onRefresh={refreshData}
        />

        <main
          id="overview"
          className={cn(
            "min-w-0 pt-14 transition-[margin] duration-200",
            sidebarCollapsed ? "md:ml-[68px]" : "md:ml-[236px]",
          )}
        >
          {dataState === "error" && (
            <div role="alert" className="sticky top-14 z-20 flex items-center gap-3 border-b border-rose-500/25 bg-rose-500/10 px-4 py-2 text-[11px] text-rose-800 dark:text-rose-200 lg:px-6">
              <DatabaseZap className="size-4" /><strong>Financial source delayed.</strong><span className="hidden text-rose-700/80 dark:text-rose-200/75 sm:inline">The last successful snapshot is still available.</span><Button size="sm" variant="outline" className="ml-auto h-7 border-rose-500/30 bg-transparent" onClick={refreshData}><RefreshCw className="size-3" />Retry</Button>
            </div>
          )}
          <div className="mx-auto max-w-[1720px] px-3 pb-20 pt-5 sm:px-5 lg:px-6 lg:pt-6">
            <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="eyebrow">Business operations</span>
                  <span className="h-3 w-px bg-border" />
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className={cn("size-1.5 rounded-full", dataState === "error" ? "bg-amber-500" : "live-dot bg-emerald-500")} />{dataState === "error" ? "Degraded workspace" : "Live workspace"}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">Updated {lastUpdatedLabel}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.035em] sm:text-[27px]">Operations pulse</h1>
                  {selectedDepartmentName && (
                    <button type="button" onClick={() => selectDepartment("all")} className="focus-ring inline-flex h-7 items-center gap-1.5 rounded-full border bg-card px-2.5 text-[10px] font-medium shadow-sm hover:bg-secondary">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: departments.find((department) => department.id === selectedDepartment)?.color }} />
                      {selectedDepartmentName}
                      <X className="size-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-muted-foreground">
                  {atRiskCount > 0 ? `${atRiskCount} ${atRiskCount === 1 ? "initiative needs" : "initiatives need"} attention and ${overdueCount} ${overdueCount === 1 ? "task is" : "tasks are"} overdue.` : "Delivery is on track across the selected portfolio."} Revenue remains ahead of plan{selectedDepartmentName ? `; ${selectedDepartmentName} capacity is at ${filteredWorkload[0]?.utilization ?? 0}%.` : "; technology capacity is the primary constraint."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="outline" size="sm" className="min-w-[146px] justify-between bg-card"><LayoutGrid className="size-3.5 text-muted-foreground" /><span className="flex-1 text-left">{activeViewLabel}</span><ChevronDown className="size-3 text-muted-foreground" /></Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="z-[90] w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-xl">{availableViews.map((view) => <DropdownMenu.Item key={view.id} onSelect={() => chooseSavedView(view.id)} className="flex cursor-default select-none items-start gap-2.5 rounded-md px-2.5 py-2 outline-none data-[highlighted]:bg-secondary"><span className="mt-0.5 grid size-4 place-items-center">{savedView === view.id && <Check className="size-3.5 text-primary" />}</span><span><span className="block text-[11px] font-medium">{view.label}</span><span className="mt-0.5 block text-[9px] text-muted-foreground">{view.description}</span></span></DropdownMenu.Item>)}<DropdownMenu.Separator className="my-1 h-px bg-border" /><MenuItem icon={BookmarkPlus} onSelect={saveCurrentView}>{customView ? "Update saved view" : "Save current view"}</MenuItem>{customView && <MenuItem icon={Trash2} onSelect={deleteCustomView}>Delete saved view</MenuItem>}</DropdownMenu.Content></DropdownMenu.Portal>
                </DropdownMenu.Root>
                <Button variant={editMode ? "secondary" : "outline"} size="sm" className="bg-card" onClick={() => setEditMode((value) => !value)}><SlidersHorizontal className="size-3.5" />{editMode ? "Done" : "Customize"}</Button>
                <Button size="sm" onClick={() => setNewProjectOpen(true)}><Plus className="size-3.5" />New initiative</Button>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild><button type="button" className="icon-button border bg-card shadow-sm" aria-label="More workspace actions"><MoreHorizontal className="size-4" /></button></DropdownMenu.Trigger>
                  <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="z-[90] min-w-52 rounded-lg border bg-popover p-1 text-[11px] shadow-xl">
                    <MenuItem icon={RefreshCw} onSelect={refreshData}>Refresh all sources</MenuItem>
                    <MenuItem icon={Share2} onSelect={() => void shareWorkspace()}>Share workspace</MenuItem>
                    <MenuItem icon={ArrowDownToLine} onSelect={exportBrief}>Export executive brief</MenuItem>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <MenuItem icon={CloudCog} onSelect={() => setDataState("error")}>Preview source issue</MenuItem>
                  </DropdownMenu.Content></DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </header>

            {editMode && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.045] px-4 py-3 text-[10px]">
                <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary"><Settings2 className="size-3.5" /></span>
                <div className="min-w-0 flex-1"><p className="font-semibold">Layout editing enabled</p><p className="text-muted-foreground">Drag the portfolio modules, or focus one and use Alt + arrow keys. Your layout saves automatically.</p></div>
                <Button size="sm" variant="ghost" onClick={() => setModuleOrder(DEFAULT_MODULE_ORDER)}><RotateCcw className="size-3" />Reset layout</Button>
                <div className="flex w-full flex-wrap gap-1.5 lg:hidden">
                  {moduleOrder.map((id, index) => (
                    <span key={id} className="inline-flex items-center rounded-md border bg-card pl-2 text-[9px] font-medium capitalize shadow-sm">
                      {id}
                      <button type="button" disabled={index === 0} onClick={() => reorderModule(id, moduleOrder[index - 1])} className="icon-button ml-1 size-7 rounded-none border-l" aria-label={`Move ${id} left`}><ChevronLeft className="size-3" /></button>
                      <button type="button" disabled={index === moduleOrder.length - 1} onClick={() => reorderModule(id, moduleOrder[index + 1])} className="icon-button size-7 rounded-none" aria-label={`Move ${id} right`}><ChevronRight className="size-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <KpiStrip kpis={displayKpis} loading={dataState === "loading"} />

              <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="min-w-0 xl:col-span-8"><FinancialChart data={financialData} onSelect={handleSelection} loading={dataState === "loading"} /></div>
                <div className="min-w-0 xl:col-span-4"><RiskFeed risks={filteredRisks} departments={departments} onSelect={handleSelection} /></div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {moduleOrder.map((id) => (
                  <div
                    key={id}
                    draggable={editMode}
                    tabIndex={editMode ? 0 : undefined}
                    aria-label={editMode ? `${id} widget. Drag or use Alt plus arrow keys to reorder.` : undefined}
                    onDragStart={() => setDraggedModule(id)}
                    onDragOver={(event) => { if (editMode) event.preventDefault(); }}
                    onDrop={() => { if (draggedModule) reorderModule(draggedModule, id); setDraggedModule(null); }}
                    onKeyDown={(event) => {
                      if (!editMode || !event.altKey) return;
                      const index = moduleOrder.indexOf(id);
                      if (event.key === "ArrowLeft" && index > 0) { event.preventDefault(); reorderModule(id, moduleOrder[index - 1]); }
                      if (event.key === "ArrowRight" && index < moduleOrder.length - 1) { event.preventDefault(); reorderModule(id, moduleOrder[index + 1]); }
                    }}
                    className={cn("min-w-0 rounded-xl outline-none transition", editMode && "cursor-grab focus-visible:ring-2 focus-visible:ring-ring", draggedModule === id && "opacity-45")}
                  >
                    {renderModule(id)}
                  </div>
                ))}
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="min-w-0 xl:col-span-7"><DependencyGraph nodes={graphData.nodes} edges={graphData.edges} onSelect={handleSelection} /></div>
                <div className="min-w-0 xl:col-span-5"><Deadlines items={filteredDeadlines} departments={departments} onSelect={handleSelection} /></div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="min-w-0 xl:col-span-7"><DepartmentHeatmap departments={departments} metrics={heatmapMetrics} cells={performanceHeatmap} selectedDepartment={selectedDepartment} onDepartment={selectDepartment} /></div>
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-5 xl:grid-cols-1 2xl:grid-cols-2">
                  <div className="min-w-0"><TaskTrend data={scaledTaskTrends} /></div>
                  <div className="min-w-0"><ActivityTimeline items={filteredActivities} /></div>
                </div>
              </div>

              <section id="projects" className="scroll-mt-20">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
                  <div><p className="eyebrow">Work portfolio</p><h2 className="mt-1 text-base font-semibold tracking-tight">Strategic initiatives</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Plan, prioritize, and intervene without leaving the workspace.</p></div>
                  <div className="flex items-center gap-4 text-[9px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" />{filteredProjects.filter((p) => p.status === "on-track").length} on track</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-amber-500" />{atRiskCount} need attention</span><span>{formatCurrency(filteredProjects.reduce((sum, p) => sum + p.budget, 0), true)} managed</span></div>
                </div>
                <ProjectTable projects={filteredProjects} departments={departments} selectedDepartment={selectedDepartment} onProjectSelect={(project) => setDetailSelection({ type: "project", data: project })} onProjectsChange={updateProjects} />
              </section>
            </div>

            <footer className="mt-8 flex flex-col gap-2 border-t px-1 py-4 text-[9px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Arc Operations · Snapshot Jul 17, 2026 at 09:30 CEST</span>
              <span className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><CircleCheck className={cn("size-3", dataState === "error" ? "text-amber-500" : "text-emerald-500")} />{dataState === "error" ? "11 healthy · 1 delayed" : "12 sources healthy"}</span><span>Data policy v4.2</span><span>Keyboard: ⌘K</span></span>
            </footer>
          </div>
        </main>

        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          projects={projectRecords}
          risks={riskRecords}
          tasks={taskRecords}
          departments={departments}
          theme={theme}
          onProjectSelect={(project) => setDetailSelection({ type: "project", data: project })}
          onRiskSelect={(risk) => setDetailSelection({ type: "risk", data: risk })}
          onTaskSelect={(task) => setDetailSelection({ type: "task", data: task })}
          onDepartmentSelect={selectDepartment}
          onAction={(action) => {
            if (action === "new-project") setNewProjectOpen(true);
            if (action === "toggle-theme") toggleTheme();
            if (action === "customize") setEditMode(true);
            if (action === "export") exportBrief();
          }}
        />
        <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} departments={departments} people={teamMembers} projectCount={projectRecords.length} onCreate={(project) => { setProjectRecords((records) => [project, ...records]); setDetailSelection({ type: "project", data: project }); }} />
        <DetailPanel open={Boolean(detailSelection)} onOpenChange={(open) => { if (!open) setDetailSelection(null); }} entity={detailSelection} departments={departments} onProjectUpdate={(project) => { updateProjects([project]); setDetailSelection({ type: "project", data: project }); }} onTaskUpdate={updateTask} />
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: "text-xs" }} />
      </div>
    </TooltipProvider>
  );
}

function MenuItem({ icon: Icon, onSelect, children }: { icon: typeof RefreshCw; onSelect: () => void; children: React.ReactNode }) {
  return <DropdownMenu.Item onSelect={onSelect} className="flex cursor-default select-none items-center rounded-md px-2.5 py-2 outline-none data-[highlighted]:bg-secondary"><Icon className="mr-2 size-3.5 text-muted-foreground" />{children}</DropdownMenu.Item>;
}
