import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Project, ProjectStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false) {
  if (compact) {
    const sign = value < 0 ? "−" : "";
    const absolute = Math.abs(value);
    if (absolute >= 1_000_000_000) return `${sign}$${(absolute / 1_000_000_000).toFixed(1)}B`;
    if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(1)}M`;
    if (absolute >= 1_000) return `${sign}$${(absolute / 1_000).toFixed(1)}K`;
    return `${sign}$${Math.round(absolute)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function projectStatusUpdate(
  status: ProjectStatus,
  lastUpdatedAt = new Date().toISOString(),
): Partial<Project> {
  if (status !== "completed") return { status, lastUpdatedAt };

  return {
    status,
    progress: 100,
    healthScore: 100,
    openTasks: 0,
    overdueTasks: 0,
    riskCount: 0,
    lastUpdatedAt,
  };
}
