"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  FolderKanban,
  HelpCircle,
  Keyboard,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type TopCommandBarProps = {
  collapsed: boolean;
  onMobileMenuOpen: () => void;
  onCommandOpen: () => void;
  dateRangeLabel: string;
  onDateRangeSelect: (label: string) => void;
  theme: "light" | "dark";
  dataDegraded?: boolean;
  onThemeToggle: () => void;
  onRefresh: () => void | Promise<void>;
};

type NotificationTone = "critical" | "warning" | "success" | "info";

type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: NotificationTone;
  unread: boolean;
};

const dateRanges = [
  { label: "Q2 2026", detail: "Apr 1 – Jun 30", shortcut: "Q2" },
  { label: "Q3 2026", detail: "Jul 1 – Sep 30", shortcut: "Q3" },
  { label: "FY 2026 YTD", detail: "Jan 1 – Jul 17", shortcut: "YTD" },
  { label: "H2 2026", detail: "Jul 1 – Dec 31", shortcut: "H2" },
  { label: "FY 2026", detail: "Jan 1 – Dec 31", shortcut: "FY" },
] as const;

const initialNotifications: Notification[] = [
  {
    id: "notification-data-foundation",
    title: "Data Foundation moved to critical",
    description: "Migration recovery is now three weeks behind plan.",
    time: "4 min ago",
    tone: "critical",
    unread: true,
  },
  {
    id: "notification-erp-review",
    title: "ERP cutover review tomorrow",
    description: "37 opening-balance exceptions still need owners.",
    time: "42 min ago",
    tone: "warning",
    unread: true,
  },
  {
    id: "notification-revenue",
    title: "Q3 revenue forecast approved",
    description: "The latest plan is 3.3% above the operating target.",
    time: "2 hr ago",
    tone: "success",
    unread: true,
  },
  {
    id: "notification-atlas",
    title: "Atlas milestone completed",
    description: "Enterprise permission prototype is ready for review.",
    time: "Yesterday",
    tone: "info",
    unread: false,
  },
];

const notificationTone: Record<
  NotificationTone,
  { icon: LucideIcon; iconClassName: string; surfaceClassName: string }
> = {
  critical: {
    icon: AlertTriangle,
    iconClassName: "text-rose-600 dark:text-rose-400",
    surfaceClassName: "bg-rose-50 dark:bg-rose-950/[0.45]",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-amber-600 dark:text-amber-400",
    surfaceClassName: "bg-amber-50 dark:bg-amber-950/[0.45]",
  },
  success: {
    icon: CircleDollarSign,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    surfaceClassName: "bg-emerald-50 dark:bg-emerald-950/[0.45]",
  },
  info: {
    icon: FolderKanban,
    iconClassName: "text-indigo-600 dark:text-indigo-400",
    surfaceClassName: "bg-indigo-50 dark:bg-indigo-950/[0.45]",
  },
};

export function TopCommandBar({
  collapsed,
  onMobileMenuOpen,
  onCommandOpen,
  dateRangeLabel,
  onDateRangeSelect,
  theme,
  dataDegraded = false,
  onThemeToggle,
  onRefresh,
}: TopCommandBarProps) {
  const [dateRangeOpen, setDateRangeOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [refreshing, setRefreshing] = React.useState(false);
  const [syncLabel, setSyncLabel] = React.useState("Synced 2 min ago");

  const unreadCount = notifications.reduce(
    (count, notification) => count + Number(notification.unread),
    0,
  );

  const markNotificationRead = (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification,
      ),
    );
  };

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false })),
    );
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setSyncLabel("Syncing workspace");

    try {
      await Promise.all([
        Promise.resolve(onRefresh()),
        new Promise<void>((resolve) => window.setTimeout(resolve, 450)),
      ]);
      setSyncLabel("Synced just now");
    } catch {
      setSyncLabel("Sync failed — retry");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header
      aria-label="Global command bar"
      className={cn(
        "fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b bg-background/95 px-2 backdrop-blur-md transition-[left] duration-200 supports-[backdrop-filter]:bg-background/85 sm:px-3 md:right-0",
        collapsed ? "md:left-[68px]" : "md:left-[236px]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onMobileMenuOpen}
          className="icon-button md:hidden"
          aria-label="Open workspace navigation"
        >
          <Menu aria-hidden="true" className="size-4" />
        </button>

        <button
          type="button"
          onClick={onCommandOpen}
          aria-label="Search workspace"
          aria-keyshortcuts="Meta+K Control+K"
          className="focus-ring group flex h-8 min-w-8 items-center rounded-lg border bg-card px-2 text-left text-muted-foreground shadow-sm transition-[width,border-color,color,box-shadow] hover:border-input hover:text-foreground sm:w-[220px] sm:px-2.5 lg:w-[292px]"
        >
          <Search aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="ml-2 hidden flex-1 truncate text-[11px] sm:block">
            Search projects, teams, reports…
          </span>
          <kbd
            aria-hidden="true"
            className="ml-2 hidden rounded border bg-secondary px-1.5 py-0.5 font-sans text-[9px] leading-3 text-muted-foreground lg:inline-flex"
          >
            ⌘K
          </kbd>
        </button>

        <DropdownMenu.Root open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="focus-ring flex h-8 min-w-8 items-center rounded-lg border border-transparent px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground sm:px-2.5"
              aria-label={`Date range: ${dateRangeLabel}`}
            >
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="ml-2 hidden max-w-28 truncate sm:inline">{dateRangeLabel}</span>
              <ChevronDown aria-hidden="true" className="ml-1.5 hidden size-3 sm:block" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={8}
              collisionPadding={12}
              aria-label="Choose reporting period"
              className="z-[100] w-[280px] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out"
            >
              <div className="px-2.5 pb-2 pt-1.5">
                <p className="text-[11px] font-semibold">Reporting period</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">
                  Updates financial trends, KPIs, and forecast comparisons.
                </p>
              </div>
              <DropdownMenu.RadioGroup value={dateRangeLabel} onValueChange={onDateRangeSelect} aria-label="Reporting periods" className="space-y-0.5">
                {dateRanges.map((range) => {
                  const selected = range.label === dateRangeLabel;
                  return (
                    <DropdownMenu.RadioItem
                      key={range.label}
                      value={range.label}
                      className={cn(
                        "flex min-h-10 w-full cursor-default select-none items-center rounded-lg px-2.5 text-left outline-none transition-colors data-[highlighted]:bg-secondary",
                        selected && "bg-secondary",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-medium">{range.label}</span>
                        <span className="block text-[9px] text-muted-foreground">{range.detail}</span>
                      </span>
                      <span className="mr-2 text-[8px] font-semibold tracking-wide text-muted-foreground">
                        {range.shortcut}
                      </span>
                      <span className="grid size-4 place-items-center">
                        {selected && <Check aria-hidden="true" className="size-3.5 text-primary" />}
                      </span>
                    </DropdownMenu.RadioItem>
                  );
                })}
              </DropdownMenu.RadioGroup>
              <DropdownMenu.Arrow className="fill-border" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="ml-2 flex shrink-0 items-center gap-0.5 sm:gap-1">
        <div
          role="status"
          aria-live="polite"
          className="mr-1 hidden items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-[9px] text-muted-foreground xl:flex"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              refreshing || dataDegraded ? "animate-pulse bg-amber-500" : "live-dot bg-emerald-500",
            )}
          />
          <span>{dataDegraded && !refreshing ? "1 source delayed" : syncLabel}</span>
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="icon-button"
          aria-label={refreshing ? "Refreshing workspace" : "Refresh workspace data"}
          title={refreshing ? "Refreshing…" : "Refresh data"}
        >
          <RefreshCw aria-hidden="true" className={cn("size-3.5", refreshing && "animate-spin")} />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="icon-button relative"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : "Notifications, none unread"
              }
            >
              <Bell aria-hidden="true" className="size-3.5" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-0.5 top-0.5 grid min-w-3.5 place-items-center rounded-full border-2 border-background bg-rose-500 px-0.5 text-[7px] font-bold leading-[10px] text-white"
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              collisionPadding={12}
              className="z-[100] w-[min(360px,calc(100vw-24px))] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none"
            >
              <div className="flex items-start justify-between gap-3 px-2.5 pb-2 pt-1.5">
                <div>
                  <p className="text-[11px] font-semibold">Notifications</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {unreadCount === 0 ? "You’re all caught up." : `${unreadCount} items need your attention.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="focus-ring rounded-md px-1.5 py-1 text-[9px] font-medium text-primary hover:bg-secondary disabled:pointer-events-none disabled:text-muted-foreground/50"
                >
                  Mark all read
                </button>
              </div>
              <DropdownMenu.Separator className="mx-1 h-px bg-border" />
              <div className="custom-scrollbar max-h-[360px] overflow-y-auto py-1">
                {notifications.map((notification) => {
                  const tone = notificationTone[notification.tone];
                  const Icon = tone.icon;
                  return (
                    <DropdownMenu.Item
                      key={notification.id}
                      onSelect={() => markNotificationRead(notification.id)}
                      className="group relative flex cursor-default select-none gap-2.5 rounded-lg px-2 py-2.5 outline-none data-[highlighted]:bg-secondary"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
                          tone.surfaceClassName,
                        )}
                      >
                        <Icon aria-hidden="true" className={cn("size-3.5", tone.iconClassName)} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span className="min-w-0 flex-1 text-[10px] font-semibold leading-4">
                            {notification.title}
                          </span>
                          <span className="shrink-0 text-[8px] text-muted-foreground">
                            {notification.time}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[9px] leading-4 text-muted-foreground">
                          {notification.description}
                        </span>
                        <span className="sr-only">
                          {notification.unread ? "Unread notification" : "Read notification"}
                        </span>
                      </span>
                      {notification.unread && (
                        <span
                          aria-hidden="true"
                          className="absolute right-2 top-8 size-1.5 rounded-full bg-primary"
                        />
                      )}
                    </DropdownMenu.Item>
                  );
                })}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <button
          type="button"
          onClick={onThemeToggle}
          className="icon-button"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Light theme" : "Dark theme"}
        >
          {theme === "dark" ? (
            <Sun aria-hidden="true" className="size-3.5" />
          ) : (
            <Moon aria-hidden="true" className="size-3.5" />
          )}
        </button>

        <div aria-hidden="true" className="mx-0.5 hidden h-5 w-px bg-border sm:block" />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="focus-ring flex h-9 items-center rounded-lg p-1 text-left transition-colors hover:bg-secondary sm:pl-1.5 sm:pr-1.5"
              aria-label="Open user menu for Morgan Reed"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-semibold text-white shadow-sm">
                MR
              </span>
              <span className="ml-2 hidden min-w-0 lg:block">
                <span className="block max-w-24 truncate text-[10px] font-semibold leading-3">
                  Morgan Reed
                </span>
                <span className="block text-[8px] leading-3 text-muted-foreground">Chief of Staff</span>
              </span>
              <ChevronDown aria-hidden="true" className="ml-1.5 hidden size-3 text-muted-foreground lg:block" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              collisionPadding={12}
              className="z-[100] min-w-[220px] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none"
            >
              <div className="flex items-center gap-2.5 px-2 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-semibold text-white">
                  MR
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold">Morgan Reed</span>
                  <span className="block truncate text-[9px] text-muted-foreground">
                    morgan@arc.example
                  </span>
                </span>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <UserMenuItem icon={UserRound} onSelect={() => document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" })}>
                Executive workspace
              </UserMenuItem>
              <UserMenuItem icon={Keyboard} onSelect={onCommandOpen} shortcut="⌘K">
                Keyboard commands
              </UserMenuItem>
              <UserMenuItem icon={theme === "dark" ? Sun : Moon} onSelect={onThemeToggle}>
                {theme === "dark" ? "Use light theme" : "Use dark theme"}
              </UserMenuItem>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item asChild>
                <a
                  href="mailto:ops-support@arc.example"
                  className="flex h-8 cursor-default select-none items-center rounded-lg px-2 text-[10px] outline-none data-[highlighted]:bg-secondary"
                >
                  <HelpCircle aria-hidden="true" className="mr-2.5 size-3.5 text-muted-foreground" />
                  Contact support
                </a>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}

function UserMenuItem({
  icon: Icon,
  onSelect,
  shortcut,
  children,
}: {
  icon: LucideIcon;
  onSelect: () => void;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex h-8 cursor-default select-none items-center rounded-lg px-2 text-[10px] outline-none data-[highlighted]:bg-secondary"
    >
      <Icon aria-hidden="true" className="mr-2.5 size-3.5 text-muted-foreground" />
      <span className="flex-1">{children}</span>
      {shortcut && (
        <kbd className="rounded border bg-card px-1.5 py-0.5 font-sans text-[8px] text-muted-foreground">
          {shortcut}
        </kbd>
      )}
    </DropdownMenu.Item>
  );
}
