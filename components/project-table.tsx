"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  type ColumnDef,
  type FilterFn,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  Columns3,
  Eye,
  FilterX,
  FolderSearch,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge, Button, Card, Skeleton } from "@/components/ui";
import type {
  Department,
  Project,
  ProjectPriority,
  ProjectStatus,
} from "@/lib/types";
import { cn, formatCurrency, projectStatusUpdate } from "@/lib/utils";

type ProjectTableProps = {
  projects: Project[];
  departments: Department[];
  onProjectSelect: (project: Project) => void;
  onProjectsChange: (projects: Project[]) => void;
  selectedDepartment: Department["id"] | "all" | string;
};

type PreviewState = "live" | "loading" | "empty" | "error";
type HealthFilter = "all" | "strong" | "stable" | "watch" | "critical";

const STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: "on-track", label: "On track" },
  { value: "at-risk", label: "At risk" },
  { value: "critical", label: "Critical" },
  { value: "completed", label: "Completed" },
];

const HEALTH_OPTIONS: Array<{ value: HealthFilter; label: string }> = [
  { value: "all", label: "All health" },
  { value: "strong", label: "Strong · 85–100" },
  { value: "stable", label: "Stable · 70–84" },
  { value: "watch", label: "Watch · 50–69" },
  { value: "critical", label: "Critical · below 50" },
];

const PREVIEW_OPTIONS: Array<{
  value: PreviewState;
  label: string;
  description: string;
}> = [
  { value: "live", label: "Live data", description: "Current interactive table" },
  { value: "loading", label: "Loading", description: "Data refresh in progress" },
  { value: "empty", label: "Empty", description: "No projects available" },
  { value: "error", label: "Error", description: "Data source unavailable" },
];

const STATUS_STYLES: Record<ProjectStatus, string> = {
  "on-track":
    "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  "at-risk":
    "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
  critical:
    "border-red-200/80 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
  completed:
    "border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
};

const STATUS_DOTS: Record<ProjectStatus, string> = {
  "on-track": "bg-emerald-500",
  "at-risk": "bg-amber-500",
  critical: "bg-red-500",
  completed: "bg-blue-500",
};

const PRIORITY_STYLES: Record<ProjectPriority, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
  medium:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  high: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  urgent:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
};

const projectSearchFilter: FilterFn<Project> = (row, _columnId, value) => {
  const query = String(value ?? "")
    .trim()
    .toLocaleLowerCase();

  if (!query) return true;

  const project = row.original;
  return [
    project.name,
    project.code,
    project.summary,
    project.owner.name,
    project.priority,
    project.status,
    ...project.tags,
  ].some((candidate) => candidate.toLocaleLowerCase().includes(query));
};

const statusFilter: FilterFn<Project> = (row, columnId, value) =>
  value === "all" || !value || row.getValue(columnId) === value;

const healthFilter: FilterFn<Project> = (row, columnId, value: HealthFilter) => {
  const score = Number(row.getValue(columnId));
  if (value === "strong") return score >= 85;
  if (value === "stable") return score >= 70 && score < 85;
  if (value === "watch") return score >= 50 && score < 70;
  if (value === "critical") return score < 50;
  return true;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function ProjectTable({
  projects,
  departments,
  onProjectSelect,
  onProjectsChange,
  selectedDepartment,
}: ProjectTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "health", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [previewState, setPreviewState] = React.useState<PreviewState>("live");
  const previewTimerRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (previewTimerRef.current !== null) {
        window.clearTimeout(previewTimerRef.current);
      }
    },
    [],
  );

  const departmentsById = React.useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  );

  const departmentScopedProjects = React.useMemo(
    () =>
      selectedDepartment === "all"
        ? projects
        : projects.filter(
            (project) => project.departmentId === selectedDepartment,
          ),
    [projects, selectedDepartment],
  );

  const updateProjectStatus = React.useCallback(
    (projectId: string, nextStatus: ProjectStatus) => {
      const currentProject = projects.find((project) => project.id === projectId);
      if (!currentProject || currentProject.status === nextStatus) return;
      const updatedProjects = projects.map((project) =>
        project.id === projectId
          ? { ...project, ...projectStatusUpdate(nextStatus) }
          : project,
      );

      onProjectsChange(updatedProjects);
      toast.success(`${currentProject.name} moved to ${statusLabel(nextStatus)}`, {
        description: "Portfolio health and related views have been updated.",
      });
    },
    [onProjectsChange, projects],
  );

  const columns = React.useMemo<ColumnDef<Project>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        size: 42,
        header: ({ table }) => (
          <TableCheckbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(checked === true)
            }
            label="Select all projects on this page"
          />
        ),
        cell: ({ row }) => (
          <TableCheckbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
            label={`Select ${row.original.name}`}
          />
        ),
      },
      {
        id: "project",
        accessorFn: (project) => project.name,
        header: "Project",
        size: 310,
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="min-w-[250px] py-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate text-[12px] font-semibold text-foreground">
                  {project.name}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-[18px] px-1.5 text-[9px] font-semibold uppercase tracking-[0.04em]",
                    PRIORITY_STYLES[project.priority],
                  )}
                >
                  {project.priority}
                </Badge>
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] text-muted-foreground">
                <span className="tabular shrink-0 font-medium">{project.code}</span>
                <span aria-hidden="true" className="size-0.5 shrink-0 rounded-full bg-border" />
                <span className="max-w-[215px] truncate">{project.summary}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 135,
        filterFn: statusFilter,
        cell: ({ row }) => (
          <div
            className="w-[118px]"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <StatusSelect
              project={row.original}
              onValueChange={(value) => updateProjectStatus(row.original.id, value)}
            />
          </div>
        ),
      },
      {
        accessorKey: "departmentId",
        header: "Department",
        size: 145,
        cell: ({ row }) => {
          const department = departmentsById.get(row.original.departmentId);
          return (
            <div className="flex min-w-[118px] items-center gap-2 text-[11px] font-medium">
              <span
                aria-hidden="true"
                className="size-2 rounded-full ring-2 ring-card"
                style={{ backgroundColor: department?.color ?? "#94a3b8" }}
              />
              <span className="truncate">{department?.shortName ?? row.original.departmentId}</span>
            </div>
          );
        },
      },
      {
        id: "owner",
        accessorFn: (project) => project.owner.name,
        header: "Owner",
        size: 155,
        cell: ({ row }) => (
          <div className="flex min-w-[125px] items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground"
            >
              {row.original.owner.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium">{row.original.owner.name}</p>
              <p className="tabular text-[9px] text-muted-foreground">
                {row.original.owner.allocation}% allocated
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "progress",
        header: "Progress",
        size: 130,
        cell: ({ row }) => (
          <div className="min-w-[104px]">
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Delivery</span>
              <span className="tabular font-semibold">{row.original.progress}%</span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label={`${row.original.name} progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={row.original.progress}
            >
              <span
                className={cn(
                  "block h-full rounded-full",
                  row.original.status === "critical"
                    ? "bg-red-500"
                    : row.original.status === "at-risk"
                      ? "bg-amber-500"
                      : "bg-primary",
                )}
                style={{ width: `${Math.min(100, Math.max(0, row.original.progress))}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        id: "health",
        accessorFn: (project) => project.healthScore,
        header: "Health",
        size: 95,
        filterFn: healthFilter,
        cell: ({ row }) => {
          const score = row.original.healthScore;
          return (
            <div className="flex min-w-[70px] items-center gap-2">
              <span className={cn("size-2 rounded-full", healthDot(score))} aria-hidden="true" />
              <span className="tabular text-[12px] font-semibold">{score}</span>
              <span className="sr-only">{healthLabel(score)}</span>
            </div>
          );
        },
      },
      {
        id: "budget",
        accessorFn: (project) => project.spent / Math.max(project.budget, 1),
        header: "Budget use",
        size: 135,
        cell: ({ row }) => {
          const ratio = row.original.spent / Math.max(row.original.budget, 1);
          return (
            <div className="min-w-[105px]">
              <p className="tabular text-[11px] font-semibold">
                {formatCurrency(row.original.spent, true)}
                <span className="font-normal text-muted-foreground">
                  {" "}/ {formatCurrency(row.original.budget, true)}
                </span>
              </p>
              <p
                className={cn(
                  "tabular mt-1 text-[9px]",
                  ratio > 0.95 ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground",
                )}
              >
                {Math.round(ratio * 100)}% consumed
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "targetDate",
        header: "Target",
        size: 120,
        cell: ({ row }) => {
          const isLate = row.original.overdueTasks > 0 && row.original.status !== "completed";
          return (
            <div className="min-w-[94px]">
              <p className="tabular text-[11px] font-medium">{formatDate(row.original.targetDate)}</p>
              <p className={cn("mt-1 text-[9px]", isLate ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                {isLate ? `${row.original.overdueTasks} overdue tasks` : `${row.original.openTasks} open tasks`}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "riskCount",
        header: "Risks",
        size: 80,
        cell: ({ row }) => (
          <Badge
            variant={row.original.riskCount > 2 ? "destructive" : row.original.riskCount ? "warning" : "neutral"}
            className="tabular justify-center"
          >
            {row.original.riskCount}
            <span className="sr-only"> {row.original.riskCount === 1 ? "risk" : "risks"}</span>
          </Badge>
        ),
      },
    ],
    [departmentsById, updateProjectStatus],
  );

  const table = useReactTable({
    data: departmentScopedProjects,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: projectSearchFilter,
    getRowId: (project) => project.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 6 },
    },
  });

  const projectIdSignature = projects.map((project) => project.id).join("|");

  React.useEffect(() => {
    table.setPageIndex(0);
    setRowSelection({});
  }, [projectIdSignature, selectedDepartment, table]);

  const activeStatusFilter =
    (table.getColumn("status")?.getFilterValue() as ProjectStatus | undefined) ?? "all";
  const activeHealthFilter =
    (table.getColumn("health")?.getFilterValue() as HealthFilter | undefined) ?? "all";
  const hasFilters =
    globalFilter.length > 0 || activeStatusFilter !== "all" || activeHealthFilter !== "all";
  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  function resetFilters() {
    setGlobalFilter("");
    table.getColumn("status")?.setFilterValue(undefined);
    table.getColumn("health")?.setFilterValue(undefined);
    table.setPageIndex(0);
  }

  function updateSelectedProjects(nextStatus: ProjectStatus) {
    const selectedIds = new Set(
      Object.entries(rowSelection)
        .filter(([, isSelected]) => isSelected)
        .map(([projectId]) => projectId),
    );

    if (selectedIds.size === 0) return;

    const updatedProjects = projects.map((project) =>
      selectedIds.has(project.id)
        ? { ...project, ...projectStatusUpdate(nextStatus) }
        : project,
    );

    onProjectsChange(updatedProjects);
    setRowSelection({});
    toast.success(
      `${selectedIds.size} ${selectedIds.size === 1 ? "project" : "projects"} moved to ${statusLabel(nextStatus)}`,
      { description: "Bulk changes are reflected across the workspace." },
    );
  }

  function retryPreview() {
    setPreviewState("loading");
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
    }
    previewTimerRef.current = window.setTimeout(() => {
      setPreviewState("live");
      previewTimerRef.current = null;
      toast.success("Project portfolio reconnected", {
        description: "The latest workspace data is available again.",
      });
    }, 700);
  }

  const visibleRows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <Card id="project-table" className="overflow-hidden" aria-labelledby="project-table-title">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="project-table-title" className="text-sm font-semibold tracking-[-0.01em]">
                Project portfolio
              </h2>
              <Badge variant="neutral" className="tabular">
                {departmentScopedProjects.length}
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Delivery, ownership, budget health, and active risk in one operational view.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <PreviewMenu value={previewState} onValueChange={setPreviewState} />
            <div className="hidden md:block"><ColumnMenu table={table} /></div>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block min-w-0 sm:max-w-[310px] sm:flex-1">
              <span className="sr-only">Search projects</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder="Search project, code, owner, or tag…"
                className="focus-ring h-8 w-full rounded-md border bg-background pl-8 pr-8 text-[11px] placeholder:text-muted-foreground/80"
              />
              {globalFilter && (
                <button
                  type="button"
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Clear project search"
                >
                  <X className="size-3" />
                </button>
              )}
            </label>

            <FilterSelect
              label="Filter by status"
              value={activeStatusFilter}
              onValueChange={(value) =>
                table
                  .getColumn("status")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
              options={[
                { value: "all", label: "All statuses" },
                ...STATUS_OPTIONS,
              ]}
            />

            <FilterSelect
              label="Filter by health score"
              value={activeHealthFilter}
              onValueChange={(value) =>
                table
                  .getColumn("health")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
              options={HEALTH_OPTIONS}
            />

            <div className="md:hidden">
              <FilterSelect
                label="Sort projects"
                value={`${sorting[0]?.id ?? "health"}:${sorting[0]?.desc ? "desc" : "asc"}`}
                onValueChange={(value) => {
                  const [id, direction] = value.split(":");
                  setSorting([{ id, desc: direction === "desc" }]);
                }}
                options={[
                  { value: "health:asc", label: "Health: lowest first" },
                  { value: "health:desc", label: "Health: highest first" },
                  { value: "project:asc", label: "Project: A–Z" },
                  { value: "targetDate:asc", label: "Target: soonest first" },
                  { value: "budget:desc", label: "Budget use: highest first" },
                ]}
              />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2.5 text-[11px]">
                <FilterX className="size-3.5" />
                Reset
              </Button>
            )}
          </div>

          {selectedCount > 0 && (
            <BulkStatusMenu count={selectedCount} onStatusChange={updateSelectedProjects} />
          )}
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {previewState === "live"
          ? `${filteredCount} projects shown. ${selectedCount} selected.`
          : `Previewing ${previewState} state.`}
      </div>

      {previewState === "loading" ? (
        <LoadingState />
      ) : previewState === "error" ? (
        <ErrorState onRetry={retryPreview} />
      ) : previewState === "empty" ? (
        <EmptyState
          title="No projects in this view"
          description="This saved view is ready for the next initiative your team creates."
          actionLabel="Restore live data"
          onAction={() => setPreviewState("live")}
        />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          title="No matching projects"
          description="Try a broader search or clear one of the portfolio filters."
          actionLabel="Clear filters"
          onAction={resetFilters}
        />
      ) : (
        <>
          <div className="divide-y md:hidden">
            {visibleRows.map((row) => {
              const project = row.original;
              const department = departmentsById.get(project.departmentId);
              return (
                <article key={row.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span onClick={(event) => event.stopPropagation()}>
                      <TableCheckbox checked={row.getIsSelected()} onCheckedChange={(checked) => row.toggleSelected(checked === true)} label={`Select ${project.name}`} />
                    </span>
                    <button type="button" onClick={() => onProjectSelect(project)} className="focus-ring min-w-0 flex-1 rounded text-left">
                      <span className="flex items-center gap-2"><span className="truncate text-[12px] font-semibold">{project.name}</span><Badge variant="outline" className={cn("h-[18px] px-1.5 text-[8px] uppercase", PRIORITY_STYLES[project.priority])}>{project.priority}</Badge></span>
                      <span className="mt-1 block truncate text-[9px] text-muted-foreground">{project.code} · {project.summary}</span>
                    </button>
                    <div className="w-[112px]"><StatusSelect project={project} onValueChange={(value) => updateProjectStatus(project.id, value)} /></div>
                  </div>
                  <button type="button" onClick={() => onProjectSelect(project)} className="focus-ring mt-4 block w-full rounded text-left" aria-label={`Open ${project.name} project details`}>
                    <div className="mb-1.5 flex items-center justify-between text-[9px]"><span className="text-muted-foreground">Delivery progress</span><span className="tabular font-semibold">{project.progress}%</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className={cn("h-full rounded-full", project.healthScore < 50 ? "bg-rose-500" : project.healthScore < 70 ? "bg-amber-500" : "bg-primary")} style={{ width: `${project.progress}%` }} /></div>
                  </button>
                  <dl className="mt-3 grid grid-cols-4 gap-2 border-t pt-3 text-[9px]">
                    <div className="min-w-0"><dt className="text-muted-foreground">Owner</dt><dd className="mt-0.5 truncate font-medium">{project.owner.name}</dd></div>
                    <div><dt className="text-muted-foreground">Budget</dt><dd className="tabular mt-0.5 font-medium">{formatCurrency(project.budget, true)}</dd></div>
                    <div><dt className="text-muted-foreground">Target</dt><dd className="mt-0.5 font-medium">{formatDate(project.targetDate)}</dd></div>
                    <div><dt className="text-muted-foreground">Health</dt><dd className="tabular mt-0.5 font-medium">{project.healthScore}/100</dd></div>
                  </dl>
                </article>
              );
            })}
          </div>
          <div className="custom-scrollbar hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1190px] border-collapse text-left" aria-rowcount={filteredCount}>
              <thead className="bg-muted/45">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          aria-sort={
                            sorted === "asc"
                              ? "ascending"
                              : sorted === "desc"
                                ? "descending"
                                : canSort
                                  ? "none"
                                  : undefined
                          }
                          className="h-9 whitespace-nowrap px-3 text-[9px] font-semibold uppercase tracking-[0.09em] text-muted-foreground first:pl-4 last:pr-4"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="focus-ring -ml-1 inline-flex h-7 items-center gap-1 rounded px-1 hover:bg-secondary hover:text-foreground"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <SortIcon direction={sorted} />
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    aria-label={`Open ${row.original.name} project details`}
                    aria-selected={row.getIsSelected()}
                    onClick={() => onProjectSelect(row.original)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onProjectSelect(row.original);
                      }
                    }}
                    className="group cursor-pointer border-b outline-none transition-colors last:border-b-0 hover:bg-muted/45 focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-selected:bg-accent/45"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="h-[68px] px-3 first:pl-4 last:pr-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="tabular text-[10px] text-muted-foreground">
              {selectedCount > 0 ? `${selectedCount} selected · ` : ""}
              Showing {visibleRows.length} of {filteredCount} projects
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Rows per page"
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) => table.setPageSize(Number(value))}
                options={[
                  { value: "6", label: "6 rows" },
                  { value: "10", label: "10 rows" },
                  { value: "15", label: "15 rows" },
                ]}
                compact
              />
              <span className="tabular min-w-[74px] text-center text-[10px] font-medium text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function TableCheckbox({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean | "indeterminate") => void;
  label: string;
}) {
  return (
    <span
      className="inline-flex"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <CheckboxPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="focus-ring grid size-4 place-items-center rounded-[4px] border border-input bg-background text-primary-foreground shadow-sm transition-colors hover:border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary"
      >
        <CheckboxPrimitive.Indicator>
          {checked === "indeterminate" ? (
            <span className="block h-0.5 w-2 rounded bg-current" />
          ) : (
            <Check className="size-3" strokeWidth={3} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </span>
  );
}

function StatusSelect({
  project,
  onValueChange,
}: {
  project: Project;
  onValueChange: (status: ProjectStatus) => void;
}) {
  return (
    <SelectPrimitive.Root
      value={project.status}
      onValueChange={(value) => onValueChange(value as ProjectStatus)}
    >
      <SelectPrimitive.Trigger
        aria-label={`Change status for ${project.name}`}
        className={cn(
          "focus-ring flex h-7 w-full items-center justify-between rounded-full border px-2 text-[10px] font-semibold",
          STATUS_STYLES[project.status],
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOTS[project.status])} />
          <span>{statusLabel(project.status)}</span>
        </span>
        <SelectPrimitive.Icon>
          <ChevronDown className="size-3 opacity-70" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPortal>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span className={cn("size-1.5 rounded-full", STATUS_DOTS[option.value])} />
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectPortal>
    </SelectPrimitive.Root>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  compact = false,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  compact?: boolean;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={label}
        className={cn(
          "focus-ring flex h-8 items-center justify-between gap-2 rounded-md border bg-background px-2.5 text-[10px] font-medium text-foreground shadow-sm hover:bg-muted/40",
          compact ? "min-w-[92px]" : "min-w-[132px] sm:min-w-[142px]",
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <ChevronsUpDown className="size-3 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPortal>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectPortal>
    </SelectPrimitive.Root>
  );
}

function SelectPortal({ children }: { children: React.ReactNode }) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={5}
        collisionPadding={10}
        className="z-[120] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-xl"
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Item
      value={value}
      className="relative flex h-8 cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-[11px] outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-secondary data-[disabled]:opacity-50"
    >
      <span className="absolute left-2 grid size-4 place-items-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-3.5 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function ColumnMenu({ table }: { table: ReturnType<typeof useReactTable<Project>> }) {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2.5 text-[10px]">
          <Columns3 className="size-3.5" />
          <span className="hidden sm:inline">Columns</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-[120] min-w-48 rounded-lg border bg-popover p-1 text-popover-foreground shadow-xl"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Visible columns
          </DropdownMenu.Label>
          {columns.map((column) => (
            <DropdownMenu.CheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
              onSelect={(event) => event.preventDefault()}
              className="relative flex h-8 cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-[11px] capitalize outline-none data-[highlighted]:bg-secondary"
            >
              <span className="absolute left-2 grid size-4 place-items-center">
                <DropdownMenu.ItemIndicator>
                  <Check className="size-3.5 text-primary" />
                </DropdownMenu.ItemIndicator>
              </span>
              {columnLabel(column.id)}
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function PreviewMenu({
  value,
  onValueChange,
}: {
  value: PreviewState;
  onValueChange: (value: PreviewState) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-[10px] text-muted-foreground">
          <Eye className="size-3.5" />
          <span className="hidden sm:inline">State preview</span>
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-[120] w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-xl"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Preview table state
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(nextValue) => onValueChange(nextValue as PreviewState)}
          >
            {PREVIEW_OPTIONS.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="relative flex cursor-default select-none items-start rounded-md py-2 pl-8 pr-2 outline-none data-[highlighted]:bg-secondary"
              >
                <span className="absolute left-2 top-2.5 grid size-4 place-items-center">
                  <DropdownMenu.ItemIndicator>
                    <span className="size-1.5 rounded-full bg-primary" />
                  </DropdownMenu.ItemIndicator>
                </span>
                <span>
                  <span className="block text-[11px] font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-[9px] text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function BulkStatusMenu({
  count,
  onStatusChange,
}: {
  count: number;
  onStatusChange: (status: ProjectStatus) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button size="sm" className="h-8 px-3 text-[10px]">
          <SlidersHorizontal className="size-3.5" />
          Update {count} selected
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-[120] min-w-48 rounded-lg border bg-popover p-1 text-popover-foreground shadow-xl"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Set project status
          </DropdownMenu.Label>
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              onSelect={() => onStatusChange(option.value)}
              className="flex h-8 cursor-default select-none items-center gap-2 rounded-md px-2 text-[11px] outline-none data-[highlighted]:bg-secondary"
            >
              <span className={cn("size-1.5 rounded-full", STATUS_DOTS[option.value])} />
              {option.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading project portfolio</span>
      <div className="flex h-9 items-center gap-8 border-b bg-muted/45 px-4">
        {["w-4", "w-32", "w-20", "w-24", "w-24", "w-20"].map((width, index) => (
          <Skeleton key={index} className={cn("h-2", width)} />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex h-[68px] items-center gap-5 px-4">
            <Skeleton className="size-4 shrink-0" />
            <div className="w-[250px] space-y-2">
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-2 w-4/5" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-2 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="grid min-h-[340px] place-items-center px-6 py-12 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-10 place-items-center rounded-xl border bg-muted/60 text-muted-foreground">
          <FolderSearch className="size-5" />
        </span>
        <h3 className="mt-4 text-sm font-semibold">{title}</h3>
        <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{description}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>
          <RefreshCw className="size-3.5" />
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="grid min-h-[340px] place-items-center px-6 py-12 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-10 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <CircleAlert className="size-5" />
        </span>
        <h3 className="mt-4 text-sm font-semibold">Project data is temporarily unavailable</h3>
        <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
          The portfolio source did not respond. No edits were lost and the last successful data remains safe.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      </div>
    </div>
  );
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="size-3 text-foreground" />;
  if (direction === "desc") return <ArrowDown className="size-3 text-foreground" />;
  return <ArrowUpDown className="size-3 opacity-45" />;
}

function statusLabel(status: ProjectStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function healthDot(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function healthLabel(score: number) {
  if (score >= 85) return "Strong health";
  if (score >= 70) return "Stable health";
  if (score >= 50) return "Watch health";
  return "Critical health";
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not scheduled" : dateFormatter.format(parsed);
}

function columnLabel(columnId: string) {
  const labels: Record<string, string> = {
    project: "Project",
    status: "Status",
    departmentId: "Department",
    owner: "Owner",
    progress: "Progress",
    health: "Health",
    budget: "Budget use",
    targetDate: "Target date",
    riskCount: "Risks",
  };
  return labels[columnId] ?? columnId;
}
