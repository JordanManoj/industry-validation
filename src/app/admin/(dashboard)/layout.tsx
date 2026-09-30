import Link from "next/link";
import { BrandWordmark } from "@/components/Brand";
import AdminNav from "./AdminNav";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-xl"
        style={{ background: "var(--glass)", borderColor: "var(--gridline)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-center justify-between gap-6">
            <Link href="/admin" className="shrink-0">
              <BrandWordmark subtitle="Industry Validation" />
            </Link>
            <div className="md:hidden">
              <LogoutButton />
            </div>
          </div>
          <div className="min-w-0 flex-1 md:flex md:justify-center">
            <AdminNav />
          </div>
          <div className="hidden md:block">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-10">{children}</main>
    </div>
  );
}
