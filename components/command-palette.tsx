"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  CircleDollarSign,
  Command as CommandIcon,
  FolderKanban,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  Settings2,
  Sun,
  Users,
} from "lucide-react";
import type { Department, Project, Risk, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  risks: Risk[];
  tasks: Task[];
  departments: Department[];
  theme: "light" | "dark";
  onProjectSelect: (project: Project) => void;
  onRiskSelect: (risk: Risk) => void;
  onTaskSelect: (task: Task) => void;
  onDepartmentSelect: (departmentId: string) => void;
  onAction: (action: "new-project" | "toggle-theme" | "customize" | "export") => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  projects,
  risks,
  tasks,
  departments,
  theme,
  onProjectSelect,
  onRiskSelect,
  onTaskSelect,
  onDepartmentSelect,
  onAction,
}: CommandPaletteProps) {
  const run = (callback: () => void) => {
    callback();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-[var(--overlay)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          aria-describedby="command-description"
          className="fixed left-1/2 top-3 z-[121] max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-[610px] -translate-x-1/2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl outline-none sm:top-[13vh] sm:max-h-[74dvh]"
        >
          <Dialog.Title className="sr-only">Command menu</Dialog.Title>
          <Dialog.Description id="command-description" className="sr-only">Search projects, risks, departments, and workspace actions.</Dialog.Description>
          <Command label="Global command menu" loop className="flex max-h-[calc(100dvh-24px)] flex-col sm:max-h-[74dvh] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[.12em] [&_[cmdk-group-heading]]:text-muted-foreground">
            <div className="flex h-12 items-center gap-3 border-b px-4">
              <Search className="size-4 text-muted-foreground" />
              <Command.Input autoFocus placeholder="Search projects, teams, risks, or actions…" className="h-full flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" />
              <kbd className="rounded border bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">ESC</kbd>
            </div>
            <Command.List className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-1.5">
              <Command.Empty className="flex flex-col items-center py-12 text-center">
                <span className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground"><Search className="size-4" /></span>
                <p className="mt-3 text-xs font-semibold">No result found</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Try a project code, owner, or department.</p>
              </Command.Empty>

              <Command.Group heading="Navigate">
                <PaletteItem icon={LayoutDashboard} onSelect={() => run(() => document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" }))}>Overview</PaletteItem>
                <PaletteItem icon={FolderKanban} onSelect={() => run(() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }))}>Projects</PaletteItem>
                <PaletteItem icon={CircleDollarSign} onSelect={() => run(() => document.getElementById("financials")?.scrollIntoView({ behavior: "smooth" }))}>Financials</PaletteItem>
                <PaletteItem icon={CalendarDays} onSelect={() => run(() => document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" }))}>Calendar</PaletteItem>
              </Command.Group>

              <Command.Group heading="Quick actions">
                <PaletteItem icon={Plus} onSelect={() => run(() => onAction("new-project"))}>Create initiative</PaletteItem>
                <PaletteItem icon={Settings2} onSelect={() => run(() => onAction("customize"))}>Customize dashboard</PaletteItem>
                <PaletteItem icon={theme === "dark" ? Sun : Moon} onSelect={() => run(() => onAction("toggle-theme"))}>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</PaletteItem>
                <PaletteItem icon={BarChart3} onSelect={() => run(() => onAction("export"))}>Export executive brief</PaletteItem>
              </Command.Group>

              <Command.Group heading="Departments">
                {departments.map((department) => (
                  <Command.Item
                    key={department.id}
                    value={`${department.name} department`}
                    onSelect={() => run(() => onDepartmentSelect(department.id))}
                    className="group flex h-9 cursor-default select-none items-center rounded-lg px-2.5 text-[11px] outline-none data-[selected=true]:bg-secondary"
                  >
                    <span className="mr-2.5 size-2 rounded-full" style={{ backgroundColor: department.color }} />
                    <span className="flex-1">{department.name}</span>
                    <span className="text-[9px] text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">Filter workspace</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Projects">
                {projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    value={`${project.name} ${project.code} ${project.owner.name}`}
                    onSelect={() => run(() => onProjectSelect(project))}
                    className="group flex min-h-10 cursor-default select-none items-center rounded-lg px-2.5 text-[11px] outline-none data-[selected=true]:bg-secondary"
                  >
                    <span className={cn("mr-2.5 size-2 rounded-full", project.status === "on-track" ? "bg-emerald-500" : project.status === "at-risk" ? "bg-amber-500" : project.status === "critical" ? "bg-rose-500" : "bg-blue-500")} />
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{project.name}</span><span className="block text-[9px] text-muted-foreground">{project.code} · {project.owner.name}</span></span>
                    <span className="tabular text-[9px] text-muted-foreground">{project.progress}%</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Risks">
                {risks.filter((risk) => risk.status !== "resolved").slice(0, 5).map((risk) => (
                  <Command.Item
                    key={risk.id}
                    value={`${risk.title} risk ${risk.severity}`}
                    onSelect={() => run(() => onRiskSelect(risk))}
                    className="group flex min-h-9 cursor-default select-none items-center rounded-lg px-2.5 text-[11px] outline-none data-[selected=true]:bg-secondary"
                  >
                    <AlertTriangle className={cn("mr-2.5 size-3.5", risk.severity === "critical" ? "text-rose-500" : "text-amber-500")} />
                    <span className="min-w-0 flex-1 truncate">{risk.title}</span>
                    <span className="text-[9px] capitalize text-muted-foreground">{risk.severity}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Tasks">
                {tasks.map((task) => (
                  <Command.Item
                    key={task.id}
                    value={`${task.title} task ${task.assignee.name} ${task.status}`}
                    onSelect={() => run(() => onTaskSelect(task))}
                    className="group flex min-h-9 cursor-default select-none items-center rounded-lg px-2.5 text-[11px] outline-none data-[selected=true]:bg-secondary"
                  >
                    <span className={cn("mr-2.5 size-2 rounded-full", task.status === "done" ? "bg-emerald-500" : task.isOverdue ? "bg-rose-500" : task.status === "blocked" ? "bg-amber-500" : "bg-indigo-500")} />
                    <span className="min-w-0 flex-1 truncate">{task.title}</span>
                    <span className="text-[9px] text-muted-foreground">{task.assignee.initials}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
            <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-3"><span><kbd className="mr-1 rounded border bg-card px-1">↑↓</kbd> Navigate</span><span><kbd className="mr-1 rounded border bg-card px-1">↵</kbd> Open</span></span>
              <span className="inline-flex items-center gap-1"><CommandIcon className="size-3" /> Arc command</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaletteItem({ icon: Icon, onSelect, shortcut, children }: { icon: typeof LayoutDashboard; onSelect: () => void; shortcut?: string; children: React.ReactNode }) {
  return (
    <Command.Item onSelect={onSelect} className="group flex h-9 cursor-default select-none items-center rounded-lg px-2.5 text-[11px] outline-none data-[selected=true]:bg-secondary">
      <Icon className="mr-2.5 size-3.5 text-muted-foreground group-data-[selected=true]:text-foreground" />
      <span className="flex-1">{children}</span>
      {shortcut && <kbd className="rounded border bg-card px-1.5 py-0.5 font-sans text-[8px] text-muted-foreground">{shortcut}</kbd>}
    </Command.Item>
  );
}
