"use client";

import { useEffect, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Activity,
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Command,
  FolderKanban,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldAlert,
  Sun,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DepartmentLike = { id: string; name: string; color: string };

type WorkspaceNavProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  theme: "light" | "dark";
  departments: DepartmentLike[];
  selectedDepartment: string;
  projectCount: number;
  riskCount: number;
  dataDegraded?: boolean;
  onCollapse: () => void;
  onMobileClose: () => void;
  onThemeToggle: () => void;
  onDepartmentSelect: (departmentId: string) => void;
  onCommandOpen: () => void;
};

const primaryNav = [
  { label: "Overview", icon: LayoutDashboard, href: "#overview", active: true },
  { label: "Projects", icon: FolderKanban, href: "#projects", count: 16 },
  { label: "Financials", icon: CircleDollarSign, href: "#financials" },
  { label: "Teams", icon: Users, href: "#teams" },
  { label: "Risks", icon: ShieldAlert, href: "#risks", count: 7 },
  { label: "Calendar", icon: CalendarDays, href: "#calendar" },
];

const insightNav = [
  { label: "Reports", icon: BarChart3, target: "financials" },
  { label: "Processes", icon: Boxes, target: "processes" },
  { label: "Data sources", icon: Activity, target: "sources" },
];

export function WorkspaceNav({
  collapsed,
  mobileOpen,
  theme,
  departments,
  selectedDepartment,
  projectCount,
  riskCount,
  dataDegraded = false,
  onCollapse,
  onMobileClose,
  onThemeToggle,
  onDepartmentSelect,
  onCommandOpen,
}: WorkspaceNavProps) {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [activeNav, setActiveNav] = useState("Overview");
  const compact = collapsed && !mobileOpen;

  useEffect(() => {
    if (!mobileOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('[aria-label="Close navigation"]')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onMobileClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-[var(--overlay)] backdrop-blur-[2px] md:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        ref={panelRef}
        aria-label="Workspace navigation"
        aria-modal={mobileOpen || undefined}
        role={mobileOpen ? "dialog" : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-[var(--sidebar)] transition-[width,transform] duration-200",
          compact ? "md:w-[68px]" : "md:w-[236px]",
          "w-[268px] md:translate-x-0",
          mobileOpen ? "visible translate-x-0 shadow-2xl" : "invisible -translate-x-full md:visible md:translate-x-0",
        )}
      >
        <div className={cn("flex h-14 items-center border-b", compact ? "justify-center px-2" : "px-3")}>
          <div
            className={cn(
              "flex min-w-0 items-center rounded-lg p-1.5 text-left",
              compact ? "justify-center" : "flex-1",
            )}
            aria-label="Current workspace: Arc Operations"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-foreground text-[11px] font-bold tracking-tight text-background shadow-sm">
              A
            </span>
            {!compact && (
              <span className="ml-2 min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold leading-4">Arc Operations</span>
                <span className="block truncate text-[10px] leading-3 text-muted-foreground">Executive workspace</span>
              </span>
            )}
          </div>
          <button type="button" className="icon-button md:hidden" onClick={onMobileClose} aria-label="Close navigation">
            <X className="size-4" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-2 py-3">
          <button
            type="button"
            onClick={onCommandOpen}
            className={cn(
              "focus-ring mb-4 flex h-8 w-full items-center rounded-lg border bg-card text-xs text-muted-foreground shadow-sm transition hover:border-input hover:text-foreground",
              compact ? "justify-center px-0" : "px-2.5",
            )}
            aria-label="Open command menu"
          >
            <Command className="size-3.5" />
            {!compact && (
              <>
                <span className="ml-2 flex-1 text-left">Quick jump</span>
                <kbd className="rounded border bg-secondary px-1.5 py-0.5 font-sans text-[9px] text-muted-foreground">⌘K</kbd>
              </>
            )}
          </button>

          <NavLabel collapsed={compact}>Workspace</NavLabel>
          <nav className="space-y-0.5">
            {primaryNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => { setActiveNav(item.label); onMobileClose(); }}
                title={compact ? item.label : undefined}
                className={cn(
                  "focus-ring group flex h-8 items-center rounded-lg text-[12px] font-medium transition-colors",
                  compact ? "justify-center px-0" : "px-2.5",
                  activeNav === item.label
                    ? "bg-[var(--sidebar-active)] text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className={cn("size-4 shrink-0", activeNav === item.label && "text-primary")} strokeWidth={1.8} />
                {!compact && <span className="ml-2.5 flex-1">{item.label}</span>}
                {!compact && (item.label === "Projects" || item.label === "Risks") && (
                  <span className={cn("tabular text-[10px]", item.label === "Risks" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                    {item.label === "Projects" ? projectCount : riskCount}
                  </span>
                )}
              </a>
            ))}
          </nav>

          <NavLabel collapsed={compact} className="mt-6">Departments</NavLabel>
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => onDepartmentSelect("all")}
              title={compact ? "All departments" : undefined}
              className={cn(
                "focus-ring flex h-8 w-full items-center rounded-lg text-[12px] font-medium transition-colors",
                compact ? "justify-center" : "px-2.5",
                selectedDepartment === "all" ? "bg-[var(--sidebar-active)] text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Building2 className="size-4 shrink-0" strokeWidth={1.8} />
              {!compact && <span className="ml-2.5">All departments</span>}
            </button>
            {departments.map((department) => (
              <button
                key={department.id}
                type="button"
                onClick={() => onDepartmentSelect(department.id)}
                title={compact ? department.name : undefined}
                className={cn(
                  "focus-ring flex h-8 w-full items-center rounded-lg text-[12px] transition-colors",
                  compact ? "justify-center" : "px-2.5",
                  selectedDepartment === department.id
                    ? "bg-[var(--sidebar-active)] font-medium text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <span className="size-2 shrink-0 rounded-full ring-2 ring-card" style={{ backgroundColor: department.color }} />
                {!compact && <span className="ml-3 truncate">{department.name}</span>}
              </button>
            ))}
          </nav>

          <NavLabel collapsed={compact} className="mt-6">Manage</NavLabel>
          <nav className="space-y-0.5">
            {insightNav.map((item) => (
              <button
                key={item.label}
                type="button"
                title={compact ? item.label : undefined}
                onClick={() => item.target === "sources" ? (dataDegraded ? toast.warning("One data source is delayed", { description: "The last successful financial snapshot remains available." }) : toast.success("All data sources are healthy", { description: "12 sources synced · freshness under 5 minutes" })) : document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth" })}
                className={cn(
                  "focus-ring flex h-8 w-full items-center rounded-lg text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  compact ? "justify-center" : "px-2.5",
                )}
              >
                <item.icon className="size-4 shrink-0" strokeWidth={1.8} />
                {!compact && <span className="ml-2.5">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t p-2">
          <div className={cn("mb-1 flex items-center", compact ? "flex-col gap-1" : "justify-between")}>
            <button type="button" className={cn("focus-ring flex h-8 items-center rounded-lg text-xs text-muted-foreground hover:bg-secondary hover:text-foreground", compact ? "w-8 justify-center" : "flex-1 px-2.5")} onClick={onThemeToggle} title={compact ? "Toggle theme" : undefined}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {!compact && <span className="ml-2.5">{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
            </button>
            {!compact && (
              <button type="button" className="icon-button" aria-label="Help center" onClick={() => window.open("mailto:ops-support@arc.example", "_self")}>
                <HelpCircle className="size-4" />
              </button>
            )}
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button type="button" className={cn("focus-ring flex h-10 w-full items-center rounded-lg p-1.5 text-left hover:bg-secondary", compact && "justify-center")}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-semibold text-white">MR</span>
                {!compact && (
                  <>
                    <span className="ml-2 min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium">Morgan Reed</span>
                      <span className="block truncate text-[10px] text-muted-foreground">Chief of Staff</span>
                    </span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content side="right" align="end" sideOffset={8} className="z-[100] min-w-48 rounded-lg border bg-popover p-1 text-xs text-popover-foreground shadow-xl">
                <DropdownItem icon={Settings} onSelect={() => toast.info("Profile is managed by your workspace", { description: "Role: Chief of Staff · SSO active" })}>Profile settings</DropdownItem>
                <DropdownItem icon={BookOpen} onSelect={onCommandOpen}>Command guide</DropdownItem>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownItem icon={Gauge} onSelect={() => document.getElementById("financials")?.scrollIntoView({ behavior: "smooth" })}>Usage & performance</DropdownItem>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <button
          type="button"
          onClick={onCollapse}
          className="absolute -right-3 top-[76px] z-10 hidden size-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition hover:text-foreground md:flex"
          aria-label={compact ? "Expand navigation" : "Collapse navigation"}
        >
          {compact ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
        </button>
      </aside>
    </>
  );
}

function NavLabel({ collapsed, className, children }: { collapsed: boolean; className?: string; children: React.ReactNode }) {
  if (collapsed) return <div className={cn("my-3 h-px bg-border", className)} />;
  return <p className={cn("mb-1.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/80", className)}>{children}</p>;
}

function DropdownItem({ icon: Icon, onSelect, children }: { icon: typeof Settings; onSelect: () => void; children: React.ReactNode }) {
  return (
    <DropdownMenu.Item onSelect={onSelect} className="flex cursor-default select-none items-center rounded-md px-2 py-2 outline-none data-[highlighted]:bg-secondary">
      <Icon className="mr-2 size-3.5 text-muted-foreground" />
      {children}
    </DropdownMenu.Item>
  );
}
