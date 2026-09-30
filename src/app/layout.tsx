import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { MotionProvider } from "@/components/motion";
import "./globals.css";

// ClimbSphere's brand typeface (climbsphere.ai), self-hosted by next/font.
const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", display: "swap" });

export const metadata: Metadata = {
  title: "ClimbSphere Industry Validation",
  description: "AI cognition industry validation research",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
