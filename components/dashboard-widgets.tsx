"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  GripVertical,
  Info,
  Maximize2,
  MoreHorizontal,
  Route,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge, Button, Skeleton, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  ActivityItem,
  BudgetDatum,
  Deadline,
  Department,
  DependencyEdgeData,
  DependencyNodeData,
  HeatmapCell,
  HeatmapMetric,
  KpiMetric,
  MonthlyFinancialDatum,
  PortfolioSlice,
  Risk,
  TaskTrendDatum,
  WorkloadDatum,
} from "@/lib/types";

export type DashboardSelection = {
  type: "project" | "risk" | "task" | "chart";
  data: unknown;
};

type WidgetFrameProps = {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  editMode?: boolean;
  id?: string;
};

export function WidgetFrame({ title, description, className, children, action, editMode, id }: WidgetFrameProps) {
  return (
    <section id={id} className={cn("panel min-w-0 overflow-hidden", editMode && "ring-1 ring-primary/35", className)}>
      <header className="flex min-h-[52px] items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-[13px] font-semibold tracking-[-0.01em]">{title}</h2>
          {description && <p className="mt-0.5 truncate text-[10px] leading-4 text-muted-foreground">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {action}
          {editMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="icon-button cursor-grab" aria-label={`Drag ${title} widget`}>
                  <GripVertical className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Drag to reorder</TooltipContent>
            </Tooltip>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

export function KpiStrip({ kpis, loading = false }: { kpis: KpiMetric[]; loading?: boolean }) {
  return (
    <section aria-label="Executive performance indicators" className="panel grid min-w-0 grid-cols-2 overflow-hidden xl:grid-cols-4">
      {kpis.slice(0, 4).map((kpi, index) => (
        <div key={kpi.id} className={cn("relative min-w-0 p-4", index % 2 === 0 ? "border-r" : "", index < 2 ? "border-b xl:border-b-0" : "", index > 0 && "xl:border-l", index === 1 && "xl:border-r-0")}>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground">{kpi.label}</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="rounded text-muted-foreground/70 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label={`About ${kpi.label}`}>
                      <Info className="size-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-52">{kpi.description}</TooltipContent>
                </Tooltip>
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="tabular truncate text-[24px] font-semibold leading-none tracking-[-0.04em]">{kpi.formattedValue}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                    <span className={cn("inline-flex items-center font-semibold", kpi.favorable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {kpi.trend === "up" ? <ArrowUpRight className="mr-0.5 size-3" /> : kpi.trend === "down" ? <ArrowDownRight className="mr-0.5 size-3" /> : null}
                      {kpi.changeLabel}
                    </span>
                    <span className="truncate text-muted-foreground">{kpi.comparisonLabel}</span>
                  </div>
                </div>
                <div className="hidden h-9 w-[76px] shrink-0 sm:block" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.sparkline} margin={{ top: 3, right: 1, bottom: 2, left: 1 }}>
                      <defs>
                        <linearGradient id={`spark-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={kpi.favorable ? "#10b981" : "#f43f5e"} stopOpacity={0.22} />
                          <stop offset="100%" stopColor={kpi.favorable ? "#10b981" : "#f43f5e"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke={kpi.favorable ? "#10b981" : "#f43f5e"} fill={`url(#spark-${kpi.id})`} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className={cn("h-full rounded-full", kpi.targetProgress >= 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${Math.min(kpi.targetProgress, 100)}%` }} />
                </div>
                <span className="tabular text-[9px] text-muted-foreground">Target {kpi.formattedTarget}</span>
              </div>
            </>
          )}
        </div>
      ))}
    </section>
  );
}

export function FinancialChart({
  data,
  onSelect,
  loading,
  editMode,
}: {
  data: MonthlyFinancialDatum[];
  onSelect: (selection: DashboardSelection) => void;
  loading?: boolean;
  editMode?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [keyboardIndex, setKeyboardIndex] = useState(Math.max(data.length - 1, 0));
  const lastActual = [...data].reverse().find((item) => !item.isForecast) ?? data[data.length - 1];
  const variance = lastActual ? ((lastActual.revenue - lastActual.revenueTarget) / lastActual.revenueTarget) * 100 : 0;
  const actualRows = data.filter((item) => !item.isForecast);
  const actualRevenue = actualRows.reduce((sum, item) => sum + item.revenue, 0);
  const priorRevenue = actualRows.reduce((sum, item) => sum + item.priorYearRevenue, 0);
  const actualCost = actualRows.reduce((sum, item) => sum + item.operatingCost, 0);
  const revenueGrowth = priorRevenue ? ((actualRevenue - priorRevenue) / priorRevenue) * 100 : 0;
  const actualMargin = actualRevenue ? ((actualRevenue - actualCost) / actualRevenue) * 100 : 0;
  const forecastVariance = data.filter((item) => item.isForecast).reduce((sum, item) => sum + item.revenue - item.revenueTarget, 0);

  useEffect(() => {
    setKeyboardIndex(Math.max(data.findLastIndex((item) => !item.isForecast), 0));
  }, [data]);

  const keyboardRow = data[keyboardIndex];

  return (
    <WidgetFrame
      id="financials"
      title="Revenue & operating cost"
      description="Monthly actuals with rolling forecast · USD millions"
      editMode={editMode}
      action={<button type="button" onClick={() => lastActual && onSelect({ type: "chart", data: lastActual })} className="focus-ring rounded-md" aria-label={`Inspect ${lastActual?.monthLabel ?? "latest"} financial detail`}><Badge variant={variance >= 0 ? "success" : "warning"}>{variance >= 0 ? "+" : ""}{variance.toFixed(1)}% vs plan</Badge></button>}
    >
      {loading ? (
        <div className="p-4"><Skeleton className="h-[255px] w-full" /></div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 pt-3 text-[10px] text-muted-foreground">
            <LegendItem color="var(--chart-one)" label="Revenue" />
            <LegendItem color="var(--chart-two)" label="Operating cost" />
            <LegendItem color="var(--chart-axis)" label="Revenue target" dashed />
            {data.some((item) => item.isForecast) && <span className="ml-auto inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-secondary" /> Forecast</span>}
          </div>
          <div
            className="focus-ring group relative h-[248px] min-w-0 rounded-md px-2 pb-2 pt-1"
            role="button"
            tabIndex={0}
            aria-label={`Revenue, operating cost, and target for ${data.map((item) => item.monthLabel).join(", ")}. ${keyboardRow ? `${keyboardRow.monthLabel} selected. Use left and right arrows to choose a month, then Enter to inspect.` : "No financial data available."}`}
            onKeyDown={(event) => {
              if (!data.length) return;
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                const direction = event.key === "ArrowRight" ? 1 : -1;
                setKeyboardIndex((current) => Math.min(data.length - 1, Math.max(0, current + direction)));
              }
              if ((event.key === "Enter" || event.key === " ") && keyboardRow) {
                event.preventDefault();
                onSelect({ type: "chart", data: keyboardRow });
              }
            }}
          >
            {keyboardRow && <span className="pointer-events-none absolute right-3 top-2 z-10 rounded-md border bg-card/95 px-2 py-1 text-[9px] font-medium opacity-0 shadow-sm transition-opacity group-focus:opacity-100">{keyboardRow.monthLabel} · {formatCurrency(keyboardRow.revenue, true)} revenue</span>}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 16, right: 14, bottom: 0, left: -10 }}
                onClick={(state) => {
                  if (state?.activePayload?.[0]?.payload) onSelect({ type: "chart", data: state.activePayload[0].payload });
                }}
              >
                <defs>
                  <linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-one)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--chart-one)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cost-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-two)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--chart-two)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="2 4" />
                <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 10 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 10 }} tickFormatter={(value) => `$${value / 1_000_000}m`} width={48} />
                <RechartsTooltip content={<FinancialTooltip />} cursor={{ stroke: "var(--chart-axis)", strokeDasharray: "3 3", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-one)" strokeWidth={2} fill="url(#revenue-area)" activeDot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }} isAnimationActive={!reduceMotion} />
                <Area type="monotone" dataKey="operatingCost" name="Operating cost" stroke="var(--chart-two)" strokeWidth={1.8} fill="url(#cost-area)" activeDot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }} isAnimationActive={!reduceMotion} />
                <Line type="monotone" dataKey="revenueTarget" name="Revenue target" stroke="var(--chart-axis)" strokeWidth={1.2} strokeDasharray="5 5" dot={false} isAnimationActive={!reduceMotion} />
                {data.some((item) => item.isForecast) && <ReferenceLine x={data.find((item) => item.isForecast)?.monthLabel} stroke="var(--chart-grid)" label={{ value: "Forecast →", fill: "var(--chart-axis)", fontSize: 9, position: "insideTopRight" }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="sr-only" aria-live="polite">{keyboardRow ? `${keyboardRow.monthLabel}: revenue ${formatCurrency(keyboardRow.revenue, true)}, operating cost ${formatCurrency(keyboardRow.operatingCost, true)}, target ${formatCurrency(keyboardRow.revenueTarget, true)}.` : ""}</p>
          <div className="grid grid-cols-3 border-t bg-muted/20">
            <FinancialFootStat label="Actual revenue" value={formatCurrency(actualRevenue, true)} note={`${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% YoY`} positive={revenueGrowth >= 0} />
            <FinancialFootStat label="Operating margin" value={`${actualMargin.toFixed(1)}%`} note="Actual" positive={actualMargin >= 20} />
            <FinancialFootStat label="Forecast variance" value={formatCurrency(forecastVariance, true)} note="vs plan" positive={forecastVariance >= 0} />
          </div>
        </>
      )}
    </WidgetFrame>
  );
}

function FinancialTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as MonthlyFinancialDatum;
  return (
    <div className="chart-tooltip min-w-44">
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="font-semibold">{item.monthLabel ?? label}</p>
        {item.isForecast && <Badge variant="neutral">Forecast</Badge>}
      </div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="mt-1 flex items-center justify-between gap-6 text-[10px]">
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="size-1.5 rounded-full" style={{ backgroundColor: entry.stroke }} />{entry.name}</span>
          <span className="tabular font-medium">{formatCurrency(entry.value, true)}</span>
        </div>
      ))}
    </div>
  );
}

function FinancialFootStat({ label, value, note, positive }: { label: string; value: string; note: string; positive?: boolean }) {
  return (
    <div className="px-4 py-3 [&+&]:border-l">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2"><span className="tabular text-sm font-semibold">{value}</span><span className={cn("text-[9px]", positive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>{note}</span></div>
    </div>
  );
}

export function RiskFeed({
  risks,
  departments,
  onSelect,
  editMode,
}: {
  risks: Risk[];
  departments: Department[];
  onSelect: (selection: DashboardSelection) => void;
  editMode?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));
  const sorted = [...risks].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  return (
    <WidgetFrame id="risks" title="Requires attention" description={`${sorted.filter((r) => r.severity === "critical" || r.severity === "high").length} high-impact signals · updated 4m ago`} editMode={editMode} action={sorted.length > 4 ? <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>{showAll ? "Show less" : "View all"}</Button> : null}>
      <div className="divide-y">
        {sorted.slice(0, showAll ? sorted.length : 4).map((risk) => (
          <button
            type="button"
            key={risk.id}
            onClick={() => onSelect({ type: "risk", data: risk })}
            className="focus-ring group flex w-full gap-3 px-4 py-3 text-left transition hover:bg-muted/45"
          >
            <SeverityIcon severity={risk.severity} />
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="line-clamp-1 text-[11px] font-semibold leading-4">{risk.title}</span>
                <ChevronRight className="mt-0.5 size-3 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </span>
              <span className="mt-0.5 line-clamp-1 text-[10px] leading-4 text-muted-foreground">{risk.description}</span>
              <span className="mt-1.5 flex items-center gap-2 text-[9px] text-muted-foreground">
                <span className="font-medium text-foreground/75">{deptMap[risk.departmentId]?.name}</span>
                <span className="rounded border px-1 py-0.5 font-semibold capitalize text-foreground/75">{risk.severity}</span>
                <span>•</span>
                <span>Review {shortDate(risk.reviewDate)}</span>
                {risk.trend === "worsening" && <span className="ml-auto inline-flex items-center text-rose-600 dark:text-rose-400"><TrendingUp className="mr-0.5 size-2.5" /> Worsening</span>}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2.5 text-[9px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="live-dot size-1.5 rounded-full bg-emerald-500" /> Anomaly monitor active</span>
        <span>12 sources connected</span>
      </div>
    </WidgetFrame>
  );
}

function SeverityIcon({ severity }: { severity: Risk["severity"] }) {
  const critical = severity === "critical";
  const high = severity === "high";
  return (
    <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg", critical ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : high ? "bg-amber-500/[0.12] text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400")}>
      <span className="sr-only">{severity.charAt(0).toUpperCase() + severity.slice(1)} severity. </span>
      {critical ? <CircleAlert aria-hidden="true" className="size-3.5" /> : <AlertTriangle aria-hidden="true" className="size-3.5" />}
    </span>
  );
}

export function PortfolioHealth({ slices, editMode }: { slices: PortfolioSlice[]; editMode?: boolean }) {
  const reduceMotion = useReducedMotion();
  const total = slices.reduce((sum, item) => sum + item.count, 0);
  const healthy = slices.find((s) => s.status === "on-track")?.count ?? 0;
  return (
    <WidgetFrame title="Portfolio health" description="Programs by current delivery confidence" editMode={editMode}>
      <div className="flex items-center gap-2 p-4 pb-3">
        <div className="relative h-[142px] w-[48%] min-w-0" role="img" aria-label={`${healthy} of ${total} projects are on track`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="count" nameKey="label" innerRadius="66%" outerRadius="92%" paddingAngle={3} stroke="none" startAngle={90} endAngle={-270} isAnimationActive={!reduceMotion}>
                {slices.map((slice) => <Cell key={slice.status} fill={slice.color} />)}
              </Pie>
              <RechartsTooltip content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><strong>{payload[0].name}</strong><div className="mt-1 text-muted-foreground">{payload[0].value} projects</div></div> : null} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-2xl font-semibold tracking-tight">{Math.round((healthy / Math.max(total, 1)) * 100)}%</span>
            <span className="text-[9px] text-muted-foreground">on track</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          {slices.map((slice) => (
            <div key={slice.status} className="flex items-center gap-2 text-[10px]">
              <span className="size-2 rounded-[3px]" style={{ backgroundColor: slice.color }} />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.label}</span>
              <span className="tabular font-semibold">{slice.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 border-t bg-muted/20">
        <div className="px-4 py-2.5"><p className="text-[9px] text-muted-foreground">Portfolio budget</p><p className="tabular mt-0.5 text-xs font-semibold">{formatCurrency(slices.reduce((s, i) => s + i.budget, 0), true)}</p></div>
        <div className="border-l px-4 py-2.5"><p className="text-[9px] text-muted-foreground">Capital deployed</p><p className="tabular mt-0.5 text-xs font-semibold">{formatCurrency(slices.reduce((s, i) => s + i.spent, 0), true)}</p></div>
      </div>
    </WidgetFrame>
  );
}

export function WorkloadDistribution({ data, departments, onDepartment, editMode }: { data: WorkloadDatum[]; departments: Department[]; onDepartment: (id: string) => void; editMode?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [keyboardIndex, setKeyboardIndex] = useState(0);
  const rows = data.map((item) => ({ ...item, name: departments.find((d) => d.id === item.departmentId)?.shortName ?? item.departmentId }));
  const keyboardRow = rows[Math.min(keyboardIndex, Math.max(rows.length - 1, 0))];

  useEffect(() => setKeyboardIndex(0), [data]);
  return (
    <WidgetFrame id="teams" title="Team workload" description="Allocated capacity across active work" editMode={editMode} action={<Badge variant={rows.some((d) => d.utilization > 90) ? "warning" : "success"}>{rows.filter((d) => d.utilization > 90).length} constrained</Badge>}>
      <div
        className="focus-ring group relative h-[174px] min-w-0 rounded-md px-2 pt-3"
        role="button"
        tabIndex={0}
        aria-label={`Workload utilization by department. ${keyboardRow ? `${keyboardRow.name}, ${keyboardRow.utilization} percent selected. Use up and down arrows to choose a department, then Enter to filter.` : "No workload data available."}`}
        onKeyDown={(event) => {
          if (!rows.length) return;
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            setKeyboardIndex((current) => Math.min(rows.length - 1, Math.max(0, current + direction)));
          }
          if ((event.key === "Enter" || event.key === " ") && keyboardRow) {
            event.preventDefault();
            onDepartment(keyboardRow.departmentId);
          }
        }}
      >
        {keyboardRow && <span className="pointer-events-none absolute right-3 top-2 z-10 rounded-md border bg-card/95 px-2 py-1 text-[9px] font-medium opacity-0 shadow-sm transition-opacity group-focus:opacity-100">{keyboardRow.name} · {keyboardRow.utilization}% utilized</span>}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 2, right: 20, top: 0, bottom: 2 }} onClick={(state) => { if (state?.activePayload?.[0]?.payload?.departmentId) onDepartment(state.activePayload[0].payload.departmentId); }}>
            <XAxis type="number" domain={[0, 110]} hide />
            <YAxis type="category" dataKey="name" width={58} axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 9 }} />
            <RechartsTooltip content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><strong>{payload[0].payload.name}</strong><div className="mt-1 text-muted-foreground">{payload[0].payload.utilization}% utilized · {payload[0].payload.activeProjects} projects</div></div> : null} cursor={{ fill: "hsl(var(--muted) / .45)" }} />
            <ReferenceLine x={85} stroke="var(--chart-axis)" strokeDasharray="3 3" />
            <Bar dataKey="utilization" radius={[0, 4, 4, 0]} barSize={10} background={{ fill: "hsl(var(--secondary))", radius: 4 }} isAnimationActive={!reduceMotion}>
              {rows.map((row) => <Cell key={row.departmentId} fill={row.utilization > 95 ? "#ef5b62" : row.utilization > 88 ? "#e2a23b" : "var(--chart-one)"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only" aria-live="polite">{keyboardRow ? `${keyboardRow.name}: ${keyboardRow.utilization} percent utilized across ${keyboardRow.activeProjects} projects.` : ""}</p>
      <div className="flex items-center justify-between border-t px-4 py-2.5 text-[9px] text-muted-foreground">
        <span>Healthy range 70–85%</span><span className="inline-flex items-center gap-1"><Users className="size-3" /> {rows.reduce((s, r) => s + r.openRoles, 0)} open roles</span>
      </div>
    </WidgetFrame>
  );
}

export function BudgetActual({ data, departments, onDepartment, editMode }: { data: BudgetDatum[]; departments: Department[]; onDepartment: (id: string) => void; editMode?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [keyboardIndex, setKeyboardIndex] = useState(0);
  const rows = data.map((item) => ({ ...item, name: departments.find((d) => d.id === item.departmentId)?.shortName ?? item.departmentId, budgetM: item.budget / 1_000_000, actualM: item.actual / 1_000_000, committedM: item.committed / 1_000_000 }));
  const keyboardRow = rows[Math.min(keyboardIndex, Math.max(rows.length - 1, 0))];
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
  const totalForecast = data.reduce((sum, item) => sum + item.forecast, 0);
  const forecastDelta = totalForecast - totalBudget;

  useEffect(() => setKeyboardIndex(0), [data]);
  return (
    <WidgetFrame title="Budget vs actual" description="YTD spend by department · USD millions" editMode={editMode} action={<Badge variant={totalActual <= totalBudget ? "success" : "destructive"}>{Math.round((totalActual / totalBudget) * 100)}% used</Badge>}>
      <div className="flex gap-4 px-4 pt-3 text-[9px] text-muted-foreground"><LegendItem color="var(--chart-one)" label="Actual" /><LegendItem color="hsl(var(--secondary))" label="Remaining" /></div>
      <div
        className="focus-ring group relative h-[153px] min-w-0 rounded-md px-2"
        role="button"
        tabIndex={0}
        aria-label={`Budget and actual spend by department. ${keyboardRow ? `${keyboardRow.name}, ${formatCurrency(keyboardRow.actual, true)} actual against ${formatCurrency(keyboardRow.budget, true)} budget selected. Use left and right arrows to choose a department, then Enter to filter.` : "No budget data available."}`}
        onKeyDown={(event) => {
          if (!rows.length) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            setKeyboardIndex((current) => Math.min(rows.length - 1, Math.max(0, current + direction)));
          }
          if ((event.key === "Enter" || event.key === " ") && keyboardRow) {
            event.preventDefault();
            onDepartment(keyboardRow.departmentId);
          }
        }}
      >
        {keyboardRow && <span className="pointer-events-none absolute right-3 top-2 z-10 rounded-md border bg-card/95 px-2 py-1 text-[9px] font-medium opacity-0 shadow-sm transition-opacity group-focus:opacity-100">{keyboardRow.name} · {formatCurrency(keyboardRow.actual, true)} of {formatCurrency(keyboardRow.budget, true)}</span>}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 12, right: 5, bottom: 0, left: -15 }} onClick={(state) => { if (state?.activePayload?.[0]?.payload?.departmentId) onDepartment(state.activePayload[0].payload.departmentId); }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="2 4" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 9 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 9 }} tickFormatter={(v) => `$${v}m`} />
            <RechartsTooltip content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><strong>{payload[0].payload.name}</strong><div className="mt-1 flex gap-4"><span className="text-muted-foreground">Actual</span><span>{formatCurrency(payload[0].payload.actual, true)}</span></div><div className="mt-1 flex gap-4"><span className="text-muted-foreground">Budget</span><span>{formatCurrency(payload[0].payload.budget, true)}</span></div></div> : null} cursor={{ fill: "hsl(var(--muted) / .45)" }} />
            <Bar dataKey="actualM" stackId="budget" fill="var(--chart-one)" radius={[0, 0, 3, 3]} maxBarSize={22} isAnimationActive={!reduceMotion} />
            <Bar dataKey={(row: any) => Math.max(row.budgetM - row.actualM, 0)} stackId="budget" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={!reduceMotion} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only" aria-live="polite">{keyboardRow ? `${keyboardRow.name}: ${formatCurrency(keyboardRow.actual, true)} actual, ${formatCurrency(keyboardRow.budget, true)} budget.` : ""}</p>
      <div className="grid grid-cols-2 border-t bg-muted/20">
        <div className="px-4 py-2.5"><p className="text-[9px] text-muted-foreground">Total actual</p><p className="tabular mt-0.5 text-xs font-semibold">{formatCurrency(totalActual, true)}</p></div>
        <div className="border-l px-4 py-2.5"><p className="text-[9px] text-muted-foreground">Forecast vs plan</p><p className={cn("tabular mt-0.5 text-xs font-semibold", forecastDelta <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>{forecastDelta > 0 ? "+" : ""}{formatCurrency(forecastDelta, true)}</p></div>
      </div>
    </WidgetFrame>
  );
}

export function DependencyGraph({ nodes, edges, onSelect, editMode }: { nodes: DependencyNodeData[]; edges: DependencyEdgeData[]; onSelect: (selection: DashboardSelection) => void; editMode?: boolean }) {
  const flowNodes: Node[] = useMemo(() => nodes.map((node) => ({
    id: node.id,
    position: node.position,
    focusable: false,
    selectable: false,
    ariaLabel: `${node.label}, ${node.status.replace("-", " ")}, ${node.progress} percent complete. Press Enter for project details.`,
    data: { label: (
      <button
        type="button"
        className="focus-ring w-[122px] rounded-lg border bg-card px-2.5 py-2 text-left shadow-sm"
        aria-label={`${node.label}, ${node.status.replace("-", " ")}, ${node.progress} percent complete. Open project details.`}
        onClick={(event) => {
          event.stopPropagation();
          onSelect({ type: "project", data: { id: node.projectId, graphNode: node } });
        }}
      >
        <div className="flex items-center justify-between gap-2"><span className="truncate text-[9px] font-semibold">{node.label}</span><span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", statusDot(node.status))} /><span className="sr-only">{node.status.replace("-", " ")}</span></div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${node.progress}%` }} /></div>
        <p className="tabular mt-1 flex items-center justify-between gap-1 text-[8px] text-muted-foreground"><span>{node.progress}% complete</span><span className="font-semibold capitalize text-foreground/75">{node.status.replace("-", " ")}</span></p>
      </button>
    ) },
    style: { background: "transparent", border: 0, padding: 0, width: 122 },
  })), [nodes, onSelect]);
  const flowEdges: Edge[] = useMemo(() => edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, label: edge.label, ariaLabel: `${edge.critical ? "Critical" : "Standard"} dependency${edge.label ? `, ${edge.label}` : ""}`, animated: edge.critical, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: edge.critical ? "#e2a23b" : "#9299a8" }, style: { stroke: edge.critical ? "#e2a23b" : "#9299a8", strokeWidth: edge.critical ? 1.5 : 1 } })), [edges]);
  return (
    <WidgetFrame id="processes" title="Project dependencies" description="Critical delivery path across strategic initiatives" editMode={editMode} action={<Badge variant="warning">{edges.filter((e) => e.critical).length} critical links</Badge>}>
      <div className="h-[298px] bg-[radial-gradient(circle_at_center,hsl(var(--primary)/.04),transparent_60%)]" role="application" aria-label="Interactive project dependency graph">
        {flowNodes.length ? (
          <ReactFlow nodes={flowNodes} edges={flowEdges} fitView fitViewOptions={{ padding: 0.22 }} minZoom={0.55} maxZoom={1.6} nodesDraggable={false} nodesConnectable={false} elementsSelectable onNodeClick={(_, clicked) => { const source = nodes.find((n) => n.id === clicked.id); if (source) onSelect({ type: "project", data: { id: source.projectId, graphNode: source } }); }}>
            <Background gap={18} size={1} />
            <Controls showInteractive={false} position="bottom-right" />
          </ReactFlow>
        ) : (
          <EmptyWidget icon={Route} title="No dependency chain" description="No linked projects match this department." />
        )}
      </div>
      <div className="flex items-center gap-4 border-t px-4 py-2.5 text-[9px] text-muted-foreground"><LegendItem color="#10b981" label="On track" /><LegendItem color="#e2a23b" label="At risk" /><LegendItem color="#ef5b62" label="Critical" /><span className="ml-auto">Select a node for details</span></div>
    </WidgetFrame>
  );
}

export function DepartmentHeatmap({ departments, metrics, cells, selectedDepartment, onDepartment, editMode }: { departments: Department[]; metrics: HeatmapMetric[]; cells: HeatmapCell[]; selectedDepartment: string; onDepartment: (id: string) => void; editMode?: boolean }) {
  return (
    <WidgetFrame title="Department performance" description="Normalized operating score · trailing 30 days" editMode={editMode} action={<Badge variant="neutral">0–100 score</Badge>}>
      <div className="custom-scrollbar overflow-x-auto p-4">
        <div className="min-w-[520px]" role="grid" aria-label="Department performance heatmap">
          <div className="grid grid-cols-[110px_repeat(5,1fr)_50px] gap-1.5">
            <div role="row" className="contents">
              <span role="columnheader" className="pb-1 text-[8px] font-medium uppercase tracking-wide text-muted-foreground">Team</span>
              {metrics.map((metric) => <Tooltip key={metric.id}><TooltipTrigger asChild><span role="columnheader" className="truncate pb-1 text-center text-[8px] font-medium uppercase tracking-wide text-muted-foreground">{metric.label}</span></TooltipTrigger><TooltipContent>{metric.description}</TooltipContent></Tooltip>)}
              <span role="columnheader" className="pb-1 text-right text-[8px] font-medium uppercase tracking-wide text-muted-foreground">Avg</span>
            </div>
            {departments.map((department) => {
              const departmentCells = metrics.map((metric) => cells.find((cell) => cell.departmentId === department.id && cell.metricId === metric.id));
              const average = Math.round(departmentCells.reduce((sum, cell) => sum + (cell?.value ?? 0), 0) / Math.max(departmentCells.length, 1));
              return (
                <div key={department.id} role="row" className="contents">
                  <div role="rowheader"><button type="button" onClick={() => onDepartment(department.id)} className={cn("focus-ring flex h-8 w-full items-center rounded-md px-2 text-left text-[10px] font-medium hover:bg-muted", selectedDepartment === department.id && "bg-accent text-accent-foreground")}><span className="mr-2 size-1.5 rounded-full" style={{ backgroundColor: department.color }} />{department.shortName}</button></div>
                  {departmentCells.map((cell, index) => (
                    <Tooltip key={`${department.id}-${metrics[index].id}`}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          role="gridcell"
                          aria-label={`${department.name}, ${metrics[index].label}: ${cell?.value ?? 0} out of 100. ${cell?.note ?? ""}`}
                          onClick={() => onDepartment(department.id)}
                          className={cn("focus-ring tabular h-8 rounded-md text-[10px] font-semibold transition hover:scale-[1.03]", heatCellClass(cell?.value ?? 0))}
                        >
                          {cell?.value ?? "—"}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-52"><strong>{department.name} · {metrics[index].label}</strong><p className="mt-1 text-muted-foreground">{cell?.note}</p></TooltipContent>
                    </Tooltip>
                  ))}
                  <span role="gridcell" aria-label={`${department.name} average: ${average} out of 100`} className={cn("tabular flex h-8 items-center justify-end pr-1 text-[10px] font-semibold", average < 70 && "text-amber-600 dark:text-amber-400")}>{average}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t px-4 py-2.5 text-[9px] text-muted-foreground"><span>Needs focus</span><span className="h-2 w-16 rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400" /><span>Leading</span><span className="ml-auto">Select a row to filter workspace</span></div>
    </WidgetFrame>
  );
}

export function TaskTrend({ data, editMode }: { data: TaskTrendDatum[]; editMode?: boolean }) {
  const reduceMotion = useReducedMotion();
  const latest = data[data.length - 1];
  return (
    <WidgetFrame title="Task throughput" description="Created, completed, and overdue trend" editMode={editMode} action={<Badge variant={latest && latest.completed >= latest.created ? "success" : "warning"}>{latest ? latest.completed - latest.created : 0} net</Badge>}>
      <div className="flex gap-4 px-4 pt-3 text-[9px] text-muted-foreground"><LegendItem color="var(--chart-one)" label="Completed" /><LegendItem color="var(--chart-axis)" label="Created" /><LegendItem color="#ef5b62" label="Overdue" /></div>
      <div className="h-[158px] min-w-0 px-2 pb-1" role="img" aria-label="Eight week task completion and overdue trend">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 14, right: 12, bottom: 0, left: -18 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="2 4" />
            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 8 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--chart-axis)", fontSize: 8 }} />
            <RechartsTooltip content={({ active, payload, label }) => active && payload?.length ? <div className="chart-tooltip"><strong>{payload[0].payload.weekLabel ?? label}</strong>{payload.map((p: any) => <div key={p.dataKey} className="mt-1 flex justify-between gap-5 text-[9px]"><span className="capitalize text-muted-foreground">{p.dataKey}</span><span className="tabular font-medium">{p.value}</span></div>)}</div> : null} />
            <Line dataKey="completed" stroke="var(--chart-one)" strokeWidth={2} dot={false} activeDot={{ r: 3 }} isAnimationActive={!reduceMotion} />
            <Line dataKey="created" stroke="var(--chart-axis)" strokeWidth={1.2} strokeDasharray="4 4" dot={false} isAnimationActive={!reduceMotion} />
            <Line dataKey="overdue" stroke="#ef5b62" strokeWidth={1.4} dot={false} isAnimationActive={!reduceMotion} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 border-t bg-muted/20">
        <MiniStat label="Completed" value={latest?.completed ?? 0} />
        <MiniStat label="Created" value={latest?.created ?? 0} bordered />
        <MiniStat label="Overdue" value={latest?.overdue ?? 0} danger bordered />
      </div>
    </WidgetFrame>
  );
}

export function Deadlines({ items, departments, onSelect, editMode }: { items: Deadline[]; departments: Department[]; onSelect: (selection: DashboardSelection) => void; editMode?: boolean }) {
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));
  return (
    <WidgetFrame id="calendar" title="Upcoming deadlines" description="Next 14 days across your portfolio" editMode={editMode} action={<Badge variant="neutral">Next 14 days</Badge>}>
      <div className="divide-y">
        {items.slice(0, 5).map((item, index) => (
          <button type="button" key={item.id} onClick={() => onSelect({ type: "chart", data: item })} className="focus-ring group flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/45">
            <span className={cn("flex size-9 shrink-0 flex-col items-center justify-center rounded-lg border bg-muted/40", index === 0 && "border-amber-400/50 bg-amber-500/[0.08]")}> <span className="text-[8px] font-semibold uppercase text-muted-foreground">{new Date(item.date).toLocaleDateString("en-US", { month: "short", timeZone: "Europe/Warsaw" })}</span><span className="tabular text-sm font-semibold leading-4">{new Date(item.date).toLocaleDateString("en-US", { day: "numeric", timeZone: "Europe/Warsaw" })}</span></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold">{item.title}</span><span className="mt-0.5 flex items-center gap-1.5 text-[9px] text-muted-foreground"><span className="truncate">{deptMap[item.departmentId]?.name}</span><span>•</span><span className="capitalize">{item.type}</span>{!item.isAllDay && <><span>•</span><span>{new Date(item.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Europe/Warsaw" })}</span></>}</span></span>
            <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", item.status === "at-risk" ? "bg-amber-500" : "bg-emerald-500")} />
            <span className="sr-only">{item.status.replace("-", " ")}</span>
          </button>
        ))}
      </div>
      <div className="border-t bg-muted/20 px-4 py-2.5 text-center text-[9px] text-muted-foreground">{items.filter((item) => item.type === "review").length} reviews · {items.filter((item) => item.type === "milestone").length} milestones · {items.filter((item) => item.type === "payment").length} payments in view</div>
    </WidgetFrame>
  );
}

export function ActivityTimeline({ items, editMode }: { items: ActivityItem[]; editMode?: boolean }) {
  return (
    <WidgetFrame title="Live activity" description="Updates from across the workspace" editMode={editMode} action={<span className="flex items-center gap-1.5 text-[9px] text-muted-foreground"><span className="live-dot size-1.5 rounded-full bg-emerald-500" />Live</span>}>
      <div className="relative px-4 py-2">
        {items.slice(0, 5).map((item, index) => (
          <div key={item.id} className="relative flex gap-3 py-2.5">
            {index < 4 && <span className="absolute left-[11px] top-7 h-[calc(100%-8px)] w-px bg-border" />}
            <span className={cn("relative z-[1] grid size-[23px] shrink-0 place-items-center rounded-full border bg-card text-muted-foreground", activityClass(item.type))}>{activityIcon(item.type)}</span>
            <div className="min-w-0 flex-1"><p className="line-clamp-1 text-[10px] leading-4"><span className="font-semibold">{item.actor.name}</span> <span className="text-muted-foreground">{item.title}</span></p><p className="mt-0.5 line-clamp-1 text-[9px] text-muted-foreground">{item.description}</p></div>
            <span className="shrink-0 text-[8px] text-muted-foreground">{relativeTime(item.occurredAt)}</span>
          </div>
        ))}
      </div>
    </WidgetFrame>
  );
}

export function LoadingDashboardCard({ title = "Loading workspace data" }: { title?: string }) {
  return <WidgetFrame title={title}><div className="space-y-3 p-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-36 w-full" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div></div></WidgetFrame>;
}

export function EmptyWidget({ icon: Icon = Sparkles, title, description }: { icon?: typeof Sparkles; title: string; description: string }) {
  return <div className="flex h-full min-h-40 flex-col items-center justify-center p-6 text-center"><span className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground"><Icon className="size-4" /></span><p className="mt-3 text-xs font-semibold">{title}</p><p className="mt-1 max-w-56 text-[10px] leading-4 text-muted-foreground">{description}</p></div>;
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return <span className="inline-flex items-center gap-1.5"><span className={cn("h-0.5 w-3 rounded-full", dashed && "border-t border-dashed bg-transparent")} style={dashed ? { borderColor: color } : { backgroundColor: color }} />{label}</span>;
}

function MiniStat({ label, value, danger, bordered }: { label: string; value: number; danger?: boolean; bordered?: boolean }) {
  return <div className={cn("px-3 py-2.5", bordered && "border-l")}><p className="text-[8px] uppercase tracking-wide text-muted-foreground">{label}</p><p className={cn("tabular mt-0.5 text-xs font-semibold", danger && "text-rose-600 dark:text-rose-400")}>{value}</p></div>;
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const now = new Date("2026-07-17T09:30:00+02:00").getTime();
  const minutes = Math.max(1, Math.round((now - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function severityRank(value: Risk["severity"]) {
  return { low: 1, medium: 2, high: 3, critical: 4 }[value];
}

function statusDot(value: string) {
  if (value === "on-track" || value === "completed") return "bg-emerald-500";
  if (value === "at-risk") return "bg-amber-500";
  return "bg-rose-500";
}

function heatCellClass(value: number) {
  if (value >= 88) return "bg-emerald-500/[0.18] text-emerald-800 dark:text-emerald-300";
  if (value >= 78) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (value >= 68) return "bg-amber-500/[0.14] text-amber-800 dark:text-amber-300";
  return "bg-rose-500/[0.14] text-rose-800 dark:text-rose-300";
}

function activityClass(type: ActivityItem["type"]) {
  if (type === "risk-raised") return "border-rose-500/30 bg-rose-500/[0.08] text-rose-500";
  if (type === "task-completed" || type === "milestone") return "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-500";
  if (type === "budget-change") return "border-amber-500/30 bg-amber-500/[0.08] text-amber-500";
  return "border-indigo-500/30 bg-indigo-500/[0.08] text-indigo-500";
}

function activityIcon(type: ActivityItem["type"]) {
  if (type === "risk-raised") return <AlertTriangle className="size-2.5" />;
  if (type === "task-completed" || type === "milestone") return <CheckCircle2 className="size-2.5" />;
  if (type === "budget-change") return <CircleDollarSign className="size-2.5" />;
  return <ArrowRight className="size-2.5" />;
}

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduceMotion;
}
