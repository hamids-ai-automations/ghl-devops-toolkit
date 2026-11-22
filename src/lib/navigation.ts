// Navigation configuration for the GHL DevOps Toolkit
import type { NavItem, ModuleId } from "./types";

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Dashboard summary of all modules",
    icon: "LayoutDashboard",
    group: "core",
  },
  {
    id: "connections",
    label: "GHL Connections",
    description: "Manage GoHighLevel API integrations",
    icon: "Plug",
    group: "core",
  },
  {
    id: "api-explorer",
    label: "API Explorer",
    description: "Test and inspect GHL API requests",
    icon: "Terminal",
    group: "developer",
  },
  {
    id: "webhooks",
    label: "Webhook Inspector",
    description: "Capture and inspect webhook events",
    icon: "Webhook",
    group: "developer",
  },
  {
    id: "workflows",
    label: "Workflow Simulator",
    description: "Simulate lead journeys and automations",
    icon: "Workflow",
    group: "developer",
  },
  {
    id: "testing",
    label: "Automation Testing",
    description: "Run automated test suites",
    icon: "FlaskConical",
    group: "developer",
  },
  {
    id: "snapshots",
    label: "Snapshot Validator",
    description: "Validate GHL snapshot exports",
    icon: "FileCheck2",
    group: "advanced",
  },
  {
    id: "ai-debugger",
    label: "AI Debugger",
    description: "Explain errors and suggest fixes",
    icon: "Sparkles",
    group: "advanced",
  },
  {
    id: "monitor",
    label: "Integration Monitor",
    description: "Monitor API and webhook health",
    icon: "Activity",
    group: "advanced",
  },
  {
    id: "reports",
    label: "Reports",
    description: "Generate technical reports",
    icon: "FileBarChart",
    group: "advanced",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Toolkit configuration",
    icon: "Settings",
    group: "system",
  },
  {
    id: "docs",
    label: "Documentation",
    description: "Architecture and module guides",
    icon: "BookOpen",
    group: "system",
  },
];

export const NAV_GROUPS: Record<NavItem["group"], string> = {
  core: "Core",
  developer: "Developer Tools",
  advanced: "Advanced",
  system: "System",
};

export function getNavItemsByGroup(): { group: string; items: NavItem[] }[] {
  const order: NavItem["group"][] = ["core", "developer", "advanced", "system"];
  return order.map((g) => ({
    group: NAV_GROUPS[g],
    items: NAV_ITEMS.filter((i) => i.group === g),
  }));
}
