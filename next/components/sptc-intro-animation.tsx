"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function SptcIntroAnimation() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const dismiss = window.setTimeout(() => setVisible(false), 2800);
    const onKeyDown = (event: KeyboardEvent) => {
      if (["Enter", "Escape", " "].includes(event.key)) {
        event.preventDefault();
        setVisible(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(dismiss);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="sptc-intro"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          onClick={() => setVisible(false)}
          role="status"
          aria-label="Sports Fiesta intro"
        >
          <motion.svg viewBox="0 0 520 220" className="sptc-intro__logo" aria-hidden="true">
            <text className="sptc-intro__desktop-wordmark" x="260" y="140" textAnchor="middle">Sports Fiesta 9</text>
            <text className="sptc-intro__mobile-name" x="260" y="110" textAnchor="middle">Sports Fiesta</text>
            <text className="sptc-intro__mobile-nine" x="260" y="200" textAnchor="middle">9</text>
          </motion.svg>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
