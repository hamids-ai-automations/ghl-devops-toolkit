"use client";

import * as React from "react";
import { Menu, Github, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNavStore } from "@/hooks/use-nav";
import { NAV_ITEMS } from "@/lib/navigation";
import { OverviewModule } from "@/components/modules/overview";
import { ConnectionsModule } from "@/components/modules/connections";
import { ApiExplorerModule } from "@/components/modules/api-explorer";
import { WebhooksModule } from "@/components/modules/webhooks";
import { WorkflowsModule } from "@/components/modules/workflows";
import { TestingModule } from "@/components/modules/testing";
import { SnapshotsModule } from "@/components/modules/snapshots";
import { AiDebuggerModule } from "@/components/modules/ai-debugger";
import { MonitorModule } from "@/components/modules/monitor";
import { ReportsModule } from "@/components/modules/reports";
import { SettingsModule } from "@/components/modules/settings";
import { DocsModule } from "@/components/modules/docs";

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const active = useNavStore((s) => s.active);
  const currentNav = NAV_ITEMS.find((n) => n.id === active);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar - fixed on desktop, drawer on mobile */}
      <div className="fixed inset-y-0 left-0 z-40 lg:static lg:z-auto">
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-muted-foreground">GHL DevOps Toolkit</span>
            <span className="text-sm font-semibold">{currentNav?.label ?? "Overview"}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="https://wa.me/923167417135"
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
              title="Contact on WhatsApp: +923167417135"
            >
              <Button variant="outline" size="sm" className="gap-1.5 border-emerald-600/40 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20 text-xs">
                <MessageCircle className="h-3.5 w-3.5 fill-current" />
                <span className="hidden md:inline">WhatsApp</span>
                <span className="font-mono text-[11px]">+923167417135</span>
              </Button>
            </a>
            <a
              href="https://github.com/hamids-ai-automations/ghl-devops-toolkit"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="ghost" size="sm" className="gap-2">
                <Github className="h-4 w-4" /> Repository
              </Button>
            </a>
            <ThemeToggle />
          </div>
        </header>

        {/* Module content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <ModuleRouter active={active} />
          </div>
        </main>

        {/* Footer - sticky to bottom */}
        <footer className="mt-auto border-t bg-background">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
            <p>
              GHL DevOps Toolkit &middot; Open-source developer platform for GoHighLevel automations &middot; Maintainer: Muhammad Hamid
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="https://wa.me/923167417135"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-500 hover:underline inline-flex items-center gap-1 font-mono"
              >
                <MessageCircle className="h-3 w-3" /> WhatsApp: +923167417135
              </a>
              <a
                href="https://marvis.web.app/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Portfolio
              </a>
              <a
                href="https://github.com/hamids-ai-automations/ghl-devops-toolkit"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <span>v0.1.0-mvp</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ModuleRouter({ active }: { active: string }) {
  switch (active) {
    case "overview":
      return <OverviewModule />;
    case "connections":
      return <ConnectionsModule />;
    case "api-explorer":
      return <ApiExplorerModule />;
    case "webhooks":
      return <WebhooksModule />;
    case "workflows":
      return <WorkflowsModule />;
    case "testing":
      return <TestingModule />;
    case "snapshots":
      return <SnapshotsModule />;
    case "ai-debugger":
      return <AiDebuggerModule />;
    case "monitor":
      return <MonitorModule />;
    case "reports":
      return <ReportsModule />;
    case "settings":
      return <SettingsModule />;
    case "docs":
      return <DocsModule />;
    default:
      return <OverviewModule />;
  }
}
