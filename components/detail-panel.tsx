"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  GripVertical,
  ListChecks,
  ShieldAlert,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency, projectStatusUpdate } from "@/lib/utils";
import type { Department, Project, Risk, Task } from "@/lib/types";

type DetailEntity = {
  type: "project" | "risk" | "task" | "chart";
  data: unknown;
};

export interface DetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: DetailEntity | null;
  departments: Department[];
  onProjectUpdate?: (project: Project) => void | Promise<void>;
  onTaskUpdate?: (task: Task) => void | Promise<void>;
}

const MIN_WIDTH = 360;
const MAX_WIDTH = 560;
const DEFAULT_WIDTH = 448;

const projectStatuses: Project["status"][] = [
  "on-track",
  "at-risk",
  "critical",
  "completed",
];

const taskStatuses: Task["status"][] = ["todo", "in-progress", "in-review", "blocked", "done"];
const taskPriorities: Task["priority"][] = ["low", "medium", "high", "urgent"];

const inputClassName =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProject(value: unknown): value is Project {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.code === "string" &&
    typeof value.status === "string" &&
    isRecord(value.owner) &&
    typeof value.owner.name === "string"
  );
}

function isRisk(value: unknown): value is Risk {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.severity === "string" &&
    typeof value.mitigation === "string"
  );
}

function isTask(value: unknown): value is Task {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.status === "string" &&
    isRecord(value.assignee) &&
    typeof value.assignee.name === "string"
  );
}

function clampWidth(width: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
}

function titleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function badgeVariant(
  value: Project["status"] | Risk["severity"] | Task["status"] | Task["priority"],
): BadgeProps["variant"] {
  if (["critical", "blocked", "urgent"].includes(value)) return "destructive";
  if (["at-risk", "high", "in-review"].includes(value)) return "warning";
  if (["on-track", "completed", "done"].includes(value)) return "success";
  if (["in-progress", "medium"].includes(value)) return "info";
  return "neutral";
}

function departmentFor(
  departments: Department[],
  departmentId: string | undefined,
) {
  return departments.find((department) => department.id === departmentId);
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const normalized = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-semibold">{Math.round(normalized)}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(normalized)}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/70 bg-muted/20 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 truncate text-base font-semibold tabular-nums tracking-[-0.02em]">
        {value}
      </p>
      {detail && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

function DefinitionRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-border/60 py-3 last:border-b-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="max-w-[65%] text-right text-xs font-medium">{children}</dd>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold">
        <Icon className="size-3.5 text-muted-foreground" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function DetailPanel({
  open,
  onOpenChange,
  entity,
  departments,
  onProjectUpdate,
  onTaskUpdate,
}: DetailPanelProps) {
  const [panelWidth, setPanelWidth] = React.useState(DEFAULT_WIDTH);
  const [resizing, setResizing] = React.useState(false);
  const [draftProject, setDraftProject] = React.useState<Project | null>(null);
  const [draftTask, setDraftTask] = React.useState<Task | null>(null);
  const [ownerName, setOwnerName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const mutationId = React.useRef(0);

  React.useEffect(() => {
    const project = entity?.type === "project" && isProject(entity.data) ? entity.data : null;
    const task = entity?.type === "task" && isTask(entity.data) ? entity.data : null;
    setDraftProject(project);
    setDraftTask(task);
    setOwnerName(project?.owner.name ?? "");
  }, [entity]);

  const project = entity?.type === "project" ? draftProject : null;
  const risk = entity?.type === "risk" && isRisk(entity.data) ? entity.data : null;
  const task = entity?.type === "task" ? draftTask : null;
  const chart = entity?.type === "chart" && isRecord(entity.data) ? entity.data : null;

  const commitProject = React.useCallback(
    async (changes: Partial<Project>, confirmation: string) => {
      if (!draftProject) return;

      const previous = draftProject;
      const next = { ...previous, ...changes };
      const currentMutation = ++mutationId.current;
      setDraftProject(next);
      setSaving(true);

      try {
        await onProjectUpdate?.(next);
        if (currentMutation === mutationId.current) setSaving(false);
        toast.success(confirmation, {
          description: onProjectUpdate
            ? "The workspace has been updated."
            : "Saved to this dashboard session.",
        });
      } catch {
        if (currentMutation === mutationId.current) {
          setDraftProject(previous);
          setOwnerName(previous.owner.name);
          setSaving(false);
        }
        toast.error("Update could not be saved", {
          description: "The previous value has been restored.",
        });
      }
    },
    [draftProject, onProjectUpdate],
  );

  const commitTask = React.useCallback(
    async (changes: Partial<Task>, confirmation: string) => {
      if (!draftTask) return;
      const previous = draftTask;
      const next = { ...previous, ...changes };
      if (next.status === "done") {
        next.completedAt = next.completedAt ?? new Date().toISOString();
        next.isOverdue = false;
      } else if (previous.status === "done") {
        next.completedAt = undefined;
        next.isOverdue = new Date(next.dueDate).getTime() < new Date("2026-07-17T09:30:00+02:00").getTime();
      }
      const currentMutation = ++mutationId.current;
      setDraftTask(next);
      setSaving(true);
      try {
        await onTaskUpdate?.(next);
        if (currentMutation === mutationId.current) setSaving(false);
        toast.success(confirmation, { description: "Task metrics and the owning initiative were updated." });
      } catch {
        if (currentMutation === mutationId.current) {
          setDraftTask(previous);
          setSaving(false);
        }
        toast.error("Task update could not be saved", { description: "The previous value has been restored." });
      }
    },
    [draftTask, onTaskUpdate],
  );

  const commitOwner = React.useCallback(() => {
    if (!project) return;
    const nextName = ownerName.trim();
    if (!nextName || nextName === project.owner.name) {
      setOwnerName(project.owner.name);
      return;
    }
    void commitProject(
      {
        owner: {
          ...project.owner,
          name: nextName,
          initials: initialsFor(nextName),
        },
      },
      "Project owner updated",
    );
  }, [commitProject, ownerName, project]);

  const handleResizeMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizing) return;
    setPanelWidth(clampWidth(window.innerWidth - event.clientX));
  };

  const stopResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!resizing) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setResizing(false);
  };

  const handleResizeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let nextWidth = panelWidth;
    if (event.key === "ArrowLeft") nextWidth += 16;
    else if (event.key === "ArrowRight") nextWidth -= 16;
    else if (event.key === "Home") nextWidth = MIN_WIDTH;
    else if (event.key === "End") nextWidth = MAX_WIDTH;
    else return;
    event.preventDefault();
    setPanelWidth(clampWidth(nextWidth));
  };

  const header = getHeader(entity, project, risk, task, chart, departments);
  const panelStyle = {
    "--detail-panel-width": `${panelWidth}px`,
  } as React.CSSProperties;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-slate-950/25 backdrop-blur-[1px] data-[state=closed]:opacity-0 data-[state=open]:opacity-100 motion-safe:transition-opacity dark:bg-black/45" />
        <Dialog.Content
          aria-describedby="detail-panel-description"
          style={panelStyle}
          className={cn(
            "fixed inset-y-0 right-0 z-[90] flex h-[100dvh] w-screen max-w-none flex-col border-l bg-background shadow-2xl outline-none md:w-[var(--detail-panel-width)]",
            "data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 motion-safe:transition-transform motion-safe:duration-200",
            resizing && "select-none motion-safe:transition-none",
          )}
        >
          <div
            role="separator"
            aria-label="Resize details panel"
            aria-orientation="vertical"
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            aria-valuenow={panelWidth}
            tabIndex={0}
            className="group absolute inset-y-0 left-0 z-10 hidden w-4 -translate-x-1/2 touch-none cursor-col-resize items-center justify-center outline-none md:flex"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              setResizing(true);
            }}
            onPointerMove={handleResizeMove}
            onPointerUp={stopResize}
            onPointerCancel={stopResize}
            onKeyDown={handleResizeKeyDown}
          >
            <span className="h-16 w-1 rounded-full bg-border shadow-sm transition group-hover:bg-primary/50 group-focus-visible:bg-primary group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2" />
            <GripVertical className="absolute size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </div>

          <header className="shrink-0 border-b bg-background/95 px-5 pb-4 pt-4 backdrop-blur md:px-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border bg-muted/40">
                <header.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {header.eyebrow}
                  </span>
                  {header.badge && (
                    <Badge variant={header.badge.variant}>{header.badge.label}</Badge>
                  )}
                </div>
                <Dialog.Title className="mt-1 truncate text-base font-semibold tracking-[-0.02em]">
                  {header.title}
                </Dialog.Title>
                <Dialog.Description
                  id="detail-panel-description"
                  className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                >
                  {header.description}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close details panel">
                  <X />
                </Button>
              </Dialog.Close>
            </div>
            {project && (
              <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <UserRound className="size-3" /> Owner
                  </span>
                  <input
                    className={inputClassName}
                    aria-label="Project owner"
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    onBlur={commitOwner}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                      if (event.key === "Escape") {
                        setOwnerName(project.owner.name);
                        event.currentTarget.blur();
                      }
                    }}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <Target className="size-3" /> Status
                  </span>
                  <select
                    className={inputClassName}
                    aria-label="Project status"
                    value={project.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value as Project["status"];
                      void commitProject(projectStatusUpdate(nextStatus), "Project status updated");
                    }}
                  >
                    {projectStatuses.map((status) => (
                      <option key={status} value={status}>
                        {titleCase(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <CalendarDays className="size-3" /> Target date
                  </span>
                  <input
                    type="date"
                    required
                    className={inputClassName}
                    aria-label="Project target date"
                    value={project.targetDate.slice(0, 10)}
                    onChange={(event) => {
                      if (!event.target.value) {
                        toast.error("A target date is required");
                        return;
                      }
                      void commitProject({ targetDate: event.target.value }, "Target date updated");
                    }}
                  />
                </label>
              </div>
            )}
            {task && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"><Target className="size-3" /> Status</span>
                  <select className={inputClassName} aria-label="Task status" value={task.status} onChange={(event) => void commitTask({ status: event.target.value as Task["status"] }, "Task status updated")}>
                    {taskStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"><AlertTriangle className="size-3" /> Priority</span>
                  <select className={inputClassName} aria-label="Task priority" value={task.priority} onChange={(event) => void commitTask({ priority: event.target.value as Task["priority"] }, "Task priority updated")}>
                    {taskPriorities.map((priority) => <option key={priority} value={priority}>{titleCase(priority)}</option>)}
                  </select>
                </label>
              </div>
            )}
            <p className="mt-2 h-4 text-right text-[10px] text-muted-foreground" aria-live="polite">
              {saving ? "Saving changes…" : project || task ? "Changes save automatically" : ""}
            </p>
          </header>

          <Tabs.Root defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
            <Tabs.List
              aria-label="Detail sections"
              className="grid h-11 shrink-0 grid-cols-4 border-b bg-background px-3 md:px-4"
            >
              {[
                ["overview", "Overview"],
                ["tasks", "Tasks"],
                ["budget", "Budget"],
                ["activity", "Activity"],
              ].map(([value, label]) => (
                <Tabs.Trigger
                  key={value}
                  value={value}
                  className="relative px-2 text-[11px] font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:inset-x-2 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
                >
                  {label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <PanelTab value="overview">
              <OverviewContent
                entity={entity}
                project={project}
                risk={risk}
                task={task}
                chart={chart}
                departments={departments}
              />
            </PanelTab>
            <PanelTab value="tasks">
              <TasksContent project={project} risk={risk} task={task} chart={chart} />
            </PanelTab>
            <PanelTab value="budget">
              <BudgetContent project={project} risk={risk} task={task} chart={chart} />
            </PanelTab>
            <PanelTab value="activity">
              <ActivityContent project={project} risk={risk} task={task} chart={chart} />
            </PanelTab>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PanelTab({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Tabs.Content
      value={value}
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:p-6"
    >
      <div className="space-y-6">{children}</div>
    </Tabs.Content>
  );
}

function getHeader(
  entity: DetailEntity | null,
  project: Project | null,
  risk: Risk | null,
  task: Task | null,
  chart: Record<string, unknown> | null,
  departments: Department[],
) {
  if (project) {
    const department = departmentFor(departments, project.departmentId);
    return {
      icon: FolderKanban,
      eyebrow: `${project.code}${department ? ` · ${department.name}` : ""}`,
      title: project.name,
      description: project.summary,
      badge: { label: titleCase(project.status), variant: badgeVariant(project.status) },
    };
  }
  if (risk) {
    const department = departmentFor(departments, risk.departmentId);
    return {
      icon: ShieldAlert,
      eyebrow: `Risk${department ? ` · ${department.name}` : ""}`,
      title: risk.title,
      description: risk.description,
      badge: { label: titleCase(risk.severity), variant: badgeVariant(risk.severity) },
    };
  }
  if (task) {
    const department = departmentFor(departments, task.departmentId);
    return {
      icon: ListChecks,
      eyebrow: `Task${department ? ` · ${department.name}` : ""}`,
      title: task.title,
      description: `Assigned to ${task.assignee.name} · due ${formatDate(task.dueDate)}`,
      badge: { label: titleCase(task.status), variant: badgeVariant(task.status) },
    };
  }
  if (chart) {
    return {
      icon: BarChart3,
      eyebrow: "Chart data point",
      title: chartTitle(chart),
      description: "Focused analytical context from the current dashboard view.",
      badge: undefined,
    };
  }
  return {
    icon: entity?.type === "risk" ? AlertTriangle : Activity,
    eyebrow: "Context details",
    title: "Details unavailable",
    description: "Select another dashboard item to inspect its operating context.",
    badge: undefined,
  };
}

function OverviewContent({
  entity,
  project,
  risk,
  task,
  chart,
  departments,
}: {
  entity: DetailEntity | null;
  project: Project | null;
  risk: Risk | null;
  task: Task | null;
  chart: Record<string, unknown> | null;
  departments: Department[];
}) {
  if (project) {
    const department = departmentFor(departments, project.departmentId);
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Progress" value={`${project.progress}%`} detail={`${project.teamSize} contributors`} />
          <Metric label="Health score" value={`${project.healthScore}/100`} detail={titleCase(project.priority)} />
          <Metric label="Open tasks" value={project.openTasks} detail={`${project.overdueTasks} overdue`} />
          <Metric label="Risk signals" value={project.riskCount} detail={project.riskCount ? "Requires review" : "No open signals"} />
        </div>
        <ProgressBar value={project.progress} label="Delivery progress" />
        <Section title="Project brief" icon={FolderKanban}>
          <p className="text-sm leading-6 text-muted-foreground">{project.summary}</p>
          <dl>
            <DefinitionRow label="Department">{department?.name ?? titleCase(project.departmentId)}</DefinitionRow>
            <DefinitionRow label="Priority"><Badge variant={badgeVariant(project.priority)}>{titleCase(project.priority)}</Badge></DefinitionRow>
            <DefinitionRow label="Started">{formatDate(project.startDate)}</DefinitionRow>
            <DefinitionRow label="Target">{formatDate(project.targetDate)}</DefinitionRow>
            <DefinitionRow label="Last updated">{formatDate(project.lastUpdatedAt)}</DefinitionRow>
          </dl>
        </Section>
        {project.tags.length > 0 && (
          <Section title="Classification" icon={Target}>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => <Badge key={tag} variant="neutral">{tag}</Badge>)}
            </div>
          </Section>
        )}
      </>
    );
  }

  if (risk) {
    const department = departmentFor(departments, risk.departmentId);
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Likelihood" value={`${risk.likelihood}/5`} detail="Current estimate" />
          <Metric label="Impact" value={`${risk.impact}/5`} detail="If realized" />
          <Metric label="Risk score" value={`${risk.likelihood * risk.impact}/25`} detail="Weighted exposure" />
          <Metric label="Trend" value={titleCase(risk.trend)} detail={titleCase(risk.status)} />
        </div>
        <Section title="Assessment" icon={ShieldAlert}>
          <p className="text-sm leading-6 text-muted-foreground">{risk.description}</p>
          <dl>
            <DefinitionRow label="Department">{department?.name ?? titleCase(risk.departmentId)}</DefinitionRow>
            <DefinitionRow label="Owner">{risk.owner.name}</DefinitionRow>
            <DefinitionRow label="Detected">{formatDate(risk.detectedAt)}</DefinitionRow>
            <DefinitionRow label="Next review">{formatDate(risk.reviewDate)}</DefinitionRow>
          </dl>
        </Section>
        <Section title="Mitigation plan" icon={CheckCircle2}>
          <Card className="bg-muted/20 shadow-none"><CardContent className="p-4 text-sm leading-6 text-muted-foreground">{risk.mitigation}</CardContent></Card>
        </Section>
      </>
    );
  }

  if (task) {
    const department = departmentFor(departments, task.departmentId);
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Estimate" value={`${task.estimateHours}h`} detail="Planned effort" />
          <Metric label="Priority" value={titleCase(task.priority)} detail={task.isOverdue ? "Overdue" : "On schedule"} />
        </div>
        <Section title="Task details" icon={ListChecks}>
          <dl>
            <DefinitionRow label="Assignee">{task.assignee.name}</DefinitionRow>
            <DefinitionRow label="Department">{department?.name ?? titleCase(task.departmentId)}</DefinitionRow>
            <DefinitionRow label="Status"><Badge variant={badgeVariant(task.status)}>{titleCase(task.status)}</Badge></DefinitionRow>
            <DefinitionRow label="Due date">{formatDate(task.dueDate)}</DefinitionRow>
            {task.completedAt && <DefinitionRow label="Completed">{formatDate(task.completedAt)}</DefinitionRow>}
          </dl>
        </Section>
        {task.labels.length > 0 && (
          <Section title="Labels" icon={Target}>
            <div className="flex flex-wrap gap-1.5">{task.labels.map((label) => <Badge key={label} variant="neutral">{label}</Badge>)}</div>
          </Section>
        )}
      </>
    );
  }

  if (chart) return <ChartOverview chart={chart} />;

  return <EmptyDetail entityType={entity?.type} />;
}

function TasksContent({
  project,
  risk,
  task,
  chart,
}: {
  project: Project | null;
  risk: Risk | null;
  task: Task | null;
  chart: Record<string, unknown> | null;
}) {
  if (project) {
    const completedEstimate = Math.max(0, Math.round((project.openTasks * project.progress) / Math.max(1, 100 - project.progress)));
    const total = completedEstimate + project.openTasks;
    return (
      <>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Open" value={project.openTasks} />
          <Metric label="Overdue" value={project.overdueTasks} />
          <Metric label="Completed" value={completedEstimate} />
        </div>
        <ProgressBar value={total ? (completedEstimate / total) * 100 : 100} label="Estimated task completion" />
        <Section title="Delivery signals" icon={ListChecks}>
          <Card className="shadow-none"><CardContent className="space-y-3 p-4">
            <SignalRow label="Work currently in flight" value={`${project.openTasks} tasks`} status="neutral" />
            <SignalRow label="Past target date" value={`${project.overdueTasks} tasks`} status={project.overdueTasks ? "warning" : "success"} />
            <SignalRow label="Team allocation" value={`${project.teamSize} people`} status="neutral" />
          </CardContent></Card>
        </Section>
      </>
    );
  }
  if (risk) {
    return (
      <Section title="Mitigation actions" icon={ListChecks}>
        <ActionItem done={risk.status === "mitigating" || risk.status === "monitoring" || risk.status === "resolved"} title="Mitigation owner assigned" detail={risk.owner.name} />
        <ActionItem done={risk.status === "monitoring" || risk.status === "resolved"} title="Controls implemented" detail={risk.mitigation} />
        <ActionItem done={risk.status === "resolved"} title="Risk accepted or resolved" detail={`Review ${formatDate(risk.reviewDate)}`} />
      </Section>
    );
  }
  if (task) {
    return (
      <Section title="Execution checklist" icon={ListChecks}>
        <ActionItem done title="Scope and owner confirmed" detail={task.assignee.name} />
        <ActionItem done={!["todo", "blocked"].includes(task.status)} title="Work started" detail={`${task.estimateHours} estimated hours`} />
        <ActionItem done={task.status === "done"} title="Review and completion" detail={`Due ${formatDate(task.dueDate)}`} />
      </Section>
    );
  }
  if (chart) return <ContextNote icon={ListChecks} title="Related work" text="Use the selected data point to filter the project table and inspect the work contributing to this result." />;
  return <EmptyDetail />;
}

function BudgetContent({
  project,
  risk,
  task,
  chart,
}: {
  project: Project | null;
  risk: Risk | null;
  task: Task | null;
  chart: Record<string, unknown> | null;
}) {
  if (project) {
    const remaining = project.budget - project.spent;
    const utilization = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Approved" value={formatCompactCurrency(project.budget)} detail={formatCurrency(project.budget)} />
          <Metric label="Spent" value={formatCompactCurrency(project.spent)} detail={`${utilization.toFixed(1)}% utilized`} />
          <Metric label="Remaining" value={formatCompactCurrency(remaining)} detail={remaining >= 0 ? "Available" : "Over budget"} />
          <Metric label="Cost / progress" value={`${utilization.toFixed(0)}% / ${project.progress}%`} detail="Spend vs delivery" />
        </div>
        <ProgressBar value={utilization} label="Budget utilization" />
        <ContextNote
          icon={utilization > project.progress + 10 ? AlertTriangle : CheckCircle2}
          title={utilization > project.progress + 10 ? "Spend is ahead of delivery" : "Spend is aligned to delivery"}
          text={`The project has used ${utilization.toFixed(1)}% of budget at ${project.progress}% completion.`}
          tone={utilization > project.progress + 10 ? "warning" : "success"}
        />
      </>
    );
  }
  if (risk) {
    const exposure = (risk.likelihood * risk.impact) / 25 * 100;
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Likelihood" value={`${risk.likelihood}/5`} />
          <Metric label="Impact" value={`${risk.impact}/5`} />
        </div>
        <ProgressBar value={exposure} label="Weighted exposure" />
        <ContextNote icon={ShieldAlert} title="Financial exposure" text="This risk is scored from operational likelihood and impact. Link it to a project budget to quantify a currency exposure." tone="warning" />
      </>
    );
  }
  if (task) {
    return (
      <>
        <Metric label="Estimated effort" value={`${task.estimateHours} hours`} detail="Capacity commitment" />
        <ContextNote icon={Clock3} title="Capacity impact" text="Task effort contributes to the owning department’s workload allocation and project delivery forecast." />
      </>
    );
  }
  if (chart) return <ChartOverview chart={chart} numericOnly />;
  return <EmptyDetail />;
}

function ActivityContent({
  project,
  risk,
  task,
  chart,
}: {
  project: Project | null;
  risk: Risk | null;
  task: Task | null;
  chart: Record<string, unknown> | null;
}) {
  const items = project
    ? [
        { date: project.lastUpdatedAt, title: "Project metrics refreshed", detail: `${project.progress}% delivery progress recorded` },
        { date: project.startDate, title: "Project started", detail: `${project.teamSize} contributors assigned` },
        { date: project.targetDate, title: "Target milestone", detail: "Current committed completion date", future: true },
      ]
    : risk
      ? [
          { date: risk.detectedAt, title: "Risk detected", detail: risk.description },
          { date: risk.reviewDate, title: "Scheduled risk review", detail: risk.mitigation, future: true },
        ]
      : task
        ? [
            ...(task.completedAt ? [{ date: task.completedAt, title: "Task completed", detail: `Completed by ${task.assignee.name}` }] : []),
            { date: task.dueDate, title: task.isOverdue ? "Due date passed" : "Upcoming due date", detail: `${task.estimateHours} estimated hours`, future: !task.isOverdue },
          ]
        : [];

  if (items.length > 0) {
    return (
      <Section title="Entity timeline" icon={Activity}>
        <ol className="relative ml-2 border-l border-border pl-5">
          {items.map((item, index) => (
            <li key={`${item.title}-${index}`} className="relative pb-6 last:pb-0">
              <span className={cn("absolute -left-[25px] top-0.5 size-2 rounded-full ring-4 ring-background", item.future ? "bg-primary" : "bg-muted-foreground")} />
              <p className="text-xs font-semibold">{item.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(item.date)}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ol>
      </Section>
    );
  }
  if (chart) return <ContextNote icon={Activity} title="Data lineage" text="This point reflects the current date range and dashboard filters. Changes to the department or period will recalculate it." />;
  return <EmptyDetail />;
}

function SignalRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "neutral" | "warning" | "success";
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={status}>{value}</Badge>
    </div>
  );
}

function ActionItem({ done, title, detail }: { done: boolean; title: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border/70 p-3.5">
      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-background text-muted-foreground")}>
        {done ? <Check className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold">{title}</p>
        <p className="mt-1 line-clamp-3 text-[11px] leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function ContextNote({
  icon: Icon,
  title,
  text,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  tone?: "neutral" | "warning" | "success";
}) {
  return (
    <div className={cn("rounded-lg border p-4", tone === "warning" && "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20", tone === "success" && "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20", tone === "neutral" && "border-border bg-muted/20")}>
      <div className="flex gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "warning" ? "text-amber-600" : tone === "success" ? "text-emerald-600" : "text-muted-foreground")} />
        <div>
          <p className="text-xs font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}

function chartTitle(chart: Record<string, unknown>) {
  for (const key of ["title", "name", "label", "monthLabel", "month", "department"]) {
    if (typeof chart[key] === "string" && chart[key]) return String(chart[key]);
  }
  return "Selected data point";
}

function ChartOverview({
  chart,
  numericOnly = false,
}: {
  chart: Record<string, unknown>;
  numericOnly?: boolean;
}) {
  const entries = Object.entries(chart).filter(([, value]) =>
    numericOnly ? typeof value === "number" : ["string", "number", "boolean"].includes(typeof value),
  );
  const preferredEntries = entries.slice(0, 8);
  return (
    <>
      <Section title={numericOnly ? "Financial measures" : "Selected measures"} icon={numericOnly ? CircleDollarSign : BarChart3}>
        <dl className="rounded-lg border border-border/70 px-3">
          {preferredEntries.map(([key, value]) => (
            <DefinitionRow key={key} label={titleCase(key)}>
              {typeof value === "number" ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : String(value)}
            </DefinitionRow>
          ))}
        </dl>
      </Section>
      <ContextNote icon={BarChart3} title="Linked dashboard context" text="This selection stays connected to the active department and date-range filters." />
    </>
  );
}

function EmptyDetail({ entityType }: { entityType?: DetailEntity["type"] }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border p-8 text-center">
      <div>
        <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted text-muted-foreground"><Activity className="size-4" /></div>
        <p className="mt-3 text-sm font-semibold">No {entityType ?? "entity"} detail available</p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Choose another item from the dashboard to inspect its operating context.</p>
      </div>
    </div>
  );
}
