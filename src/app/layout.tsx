import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimbSphere Industry Validation",
  description: "AI cognition industry validation research",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
