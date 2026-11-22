"use client";

import * as React from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useNavStore } from "@/hooks/use-nav";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Github, ExternalLink, BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const active = useNavStore((s) => s.active);
  const setNav = useNavStore((s) => s.set);

  const groups = Object.entries(NAV_GROUPS).map(([key, label]) => ({
    key,
    label,
    items: NAV_ITEMS.filter((i) => i.group === key),
  }));

  const handleNav = (id: typeof active) => {
    setNav(id);
    onOpenChange(false);
  };

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          GHL
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">
            GHL DevOps Toolkit
          </span>
          <span className="text-[11px] text-muted-foreground">
            Developer Platform
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scroll">
        {groups.map((g) => (
          <div key={g.key} className="mb-5">
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {g.label}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[item.icon] ?? Icons.Circle;
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleNav(item.id)}
                      className={cn(
                        "group flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="flex flex-col items-start text-left">
                        <span>{item.label}</span>
                        <span className="text-[10px] text-muted-foreground group-hover:text-sidebar-accent-foreground/70">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer of sidebar */}
      <div className="border-t p-3 space-y-2">
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <BookMarked className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Demo Mode</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">Active</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="https://github.com/hamids-ai-automations/ghl-devops-toolkit"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" /> GitHub
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
