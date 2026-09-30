"use client";

import { MotionConfig, motion, type HTMLMotionProps } from "motion/react";

// One easing curve and spring for the whole app, so movement feels consistent.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const SPRING = { type: "spring", stiffness: 380, damping: 32, mass: 0.8 } as const;

// reducedMotion="user": people who ask their OS for less motion get fades, not slides.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: EASE_OUT }}>
      {children}
    </MotionConfig>
  );
}

export function FadeIn({ delay = 0, y = 12, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT, delay }}
      {...props}
    />
  );
}

const staggerParent = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

export function Stagger(props: HTMLMotionProps<"div">) {
  return <motion.div variants={staggerParent} initial="hidden" animate="show" {...props} />;
}

export function StaggerItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={staggerChild} {...props} />;
}
