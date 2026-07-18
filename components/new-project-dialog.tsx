"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, FolderPlus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button } from "@/components/ui";
import type { Department, Person, Project, ProjectPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

type NewProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  people: Person[];
  projectCount: number;
  onCreate: (project: Project) => void;
};

export function NewProjectDialog({ open, onOpenChange, departments, people, projectCount, onCreate }: NewProjectDialogProps) {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [departmentId, setDepartmentId] = useState<string>(departments[0]?.id ?? "operations");
  const [ownerId, setOwnerId] = useState(people[0]?.id ?? "");
  const [priority, setPriority] = useState<ProjectPriority>("high");
  const [targetDate, setTargetDate] = useState("2026-09-30");

  function createProject(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !targetDate || Number.isNaN(new Date(targetDate).getTime())) return;
    const department = departments.find((item) => item.id === departmentId) ?? departments[0];
    const owner = people.find((item) => item.id === ownerId) ?? people[0];
    if (!department || !owner) return;
    const number = 200 + projectCount;
    const project: Project = {
      id: `project-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${number}`,
      code: `${department.shortName.slice(0, 3).toUpperCase()}-${number}`,
      name: trimmed,
      summary: summary.trim() || `Deliver ${trimmed.toLowerCase()} with measurable operating impact and clear ownership.`,
      departmentId: department.id,
      owner: { ...owner, allocation: 40 },
      status: "on-track",
      priority,
      progress: 0,
      healthScore: 90,
      budget: 450_000,
      spent: 0,
      startDate: "2026-07-17",
      targetDate,
      teamSize: 5,
      openTasks: 4,
      overdueTasks: 0,
      riskCount: 0,
      tags: ["new", department.shortName.toLowerCase()],
      lastUpdatedAt: "2026-07-17T12:00:00+02:00",
    };
    onCreate(project);
    toast.success("Initiative created", { description: `${project.code} is ready for planning.` });
    setName("");
    setSummary("");
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[130] bg-[var(--overlay)] backdrop-blur-[2px]" />
        <Dialog.Content className="custom-scrollbar fixed left-1/2 top-1/2 z-[131] max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-[550px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card text-card-foreground shadow-2xl outline-none">
          <div className="flex items-start justify-between border-b px-5 py-4">
            <div className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FolderPlus className="size-4" /></span>
              <div><Dialog.Title className="text-sm font-semibold">Create strategic initiative</Dialog.Title><Dialog.Description className="mt-1 text-[10px] text-muted-foreground">Start with the operating context. Tasks and milestones can be added next.</Dialog.Description></div>
            </div>
            <Dialog.Close asChild><button type="button" className="icon-button" aria-label="Close"><X className="size-4" /></button></Dialog.Close>
          </div>
          <form onSubmit={createProject}>
            <div className="space-y-4 p-5">
              <label className="block"><span className="mb-1.5 block text-[10px] font-medium">Initiative name</span><input autoFocus required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Global procurement modernization" className="focus-ring h-9 w-full rounded-lg border bg-background px-3 text-xs placeholder:text-muted-foreground" /></label>
              <label className="block"><span className="mb-1.5 flex items-center justify-between text-[10px] font-medium"><span>Outcome statement</span><span className="font-normal text-muted-foreground">Optional</span></span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Describe the business result this initiative should create…" rows={3} className="focus-ring w-full resize-none rounded-lg border bg-background px-3 py-2 text-xs leading-5 placeholder:text-muted-foreground" /></label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FieldSelect label="Department" value={departmentId} onValueChange={setDepartmentId} options={departments.map((item) => ({ value: item.id, label: item.name }))} />
                <FieldSelect label="Owner" value={ownerId} onValueChange={setOwnerId} options={people.map((item) => ({ value: item.id, label: item.name }))} />
                <FieldSelect label="Priority" value={priority} onValueChange={(value) => setPriority(value as ProjectPriority)} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} />
                <label className="block"><span className="mb-1.5 block text-[10px] font-medium">Target date</span><input required type="date" value={targetDate} min="2026-07-18" onChange={(event) => setTargetDate(event.target.value)} className="focus-ring h-9 w-full rounded-lg border bg-background px-3 text-[11px]" /></label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-indigo-500/[0.15] bg-indigo-500/5 px-3 py-2.5 text-[10px] text-muted-foreground"><Sparkles className="size-3.5 shrink-0 text-primary" /><span>Smart defaults set the opening health, budget, and planning status.</span><Badge variant="info" className="ml-auto">Smart setup</Badge></div>
            </div>
            <div className="sticky bottom-0 flex items-center justify-between border-t bg-card/95 px-5 py-3 backdrop-blur"><p className="hidden text-[9px] text-muted-foreground sm:block">You can edit every field after creation.</p><div className="ml-auto flex gap-2"><Dialog.Close asChild><Button variant="ghost" size="sm">Cancel</Button></Dialog.Close><Button size="sm" type="submit" disabled={!name.trim() || !targetDate}><FolderPlus className="size-3.5" />Create initiative</Button></div></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FieldSelect({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="block"><span className="mb-1.5 block text-[10px] font-medium">{label}</span><Select.Root value={value} onValueChange={onValueChange}><Select.Trigger className="focus-ring flex h-9 w-full items-center justify-between rounded-lg border bg-background px-3 text-[11px]"><Select.Value /><Select.Icon><ChevronDown className="size-3.5 text-muted-foreground" /></Select.Icon></Select.Trigger><Select.Portal><Select.Content position="popper" sideOffset={4} className="z-[150] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border bg-popover p-1 text-[11px] text-popover-foreground shadow-xl"><Select.Viewport>{options.map((option) => <Select.Item key={option.value} value={option.value} className="relative flex h-8 cursor-default select-none items-center rounded-md pl-7 pr-2 outline-none data-[highlighted]:bg-secondary"><Select.ItemIndicator className="absolute left-2"><Check className="size-3" /></Select.ItemIndicator><Select.ItemText>{option.label}</Select.ItemText></Select.Item>)}</Select.Viewport></Select.Content></Select.Portal></Select.Root></label>
  );
}
