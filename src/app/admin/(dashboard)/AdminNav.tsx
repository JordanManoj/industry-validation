"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { SPRING } from "@/components/motion";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/interviews", label: "Interviews" },
  { href: "/admin/kill-criteria", label: "Kill criteria" },
  { href: "/admin/survey-analytics", label: "Analytics" },
  { href: "/admin/responses", label: "Responses" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const active = NAV.filter((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href))).at(-1)?.href;

  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 text-sm [scrollbar-width:none]">
      {NAV.map((n) => {
        const isActive = n.href === active;
        return (
          <Link
            key={n.href}
            href={n.href}
            className="relative shrink-0 rounded-full px-3.5 py-1.5 font-medium transition-colors"
            style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
          >
            {isActive && (
              <motion.span
                layoutId="admin-nav-pill"
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--surface-2)", boxShadow: "inset 0 0 0 1px var(--gridline)" }}
                transition={SPRING}
              />
            )}
            <span className="relative">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
