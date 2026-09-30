"use client";

import { motion } from "motion/react";
import { EASE_OUT } from "@/components/motion";

// template.tsx remounts on every admin navigation, giving each page a soft entrance.
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}>
      {children}
    </motion.div>
  );
}
