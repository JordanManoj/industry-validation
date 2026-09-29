import Link from "next/link";
import LogoutButton from "./LogoutButton";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/interviews", label: "Interview log" },
  { href: "/admin/kill-criteria", label: "Kill criteria" },
  { href: "/admin/survey-analytics", label: "Survey analytics" },
  { href: "/admin/responses", label: "Responses" },
  { href: "/admin/invites", label: "Invites" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-10 border-b px-4 py-3"
        style={{ background: "var(--surface)", borderColor: "var(--gridline)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              ClimbSphere · Industry Validation
            </span>
            <nav className="flex gap-4 text-sm">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} style={{ color: "var(--text-secondary)" }}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
