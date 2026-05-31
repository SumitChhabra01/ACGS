import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Workflow,
  LineChart,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: "/" | "/content" | "/analytics" | "/settings";
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Command Center", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/content", label: "Content Pipeline", shortLabel: "Content", icon: Workflow },
  { href: "/analytics", label: "Analytics", shortLabel: "Analytics", icon: LineChart },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname === "";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
