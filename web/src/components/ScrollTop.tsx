import { ArrowUp } from '@phosphor-icons/react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';

export function ScrollTop() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, 'change', (latest) => setVisible(latest > 480));

  return (
    <motion.button
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 12 }}
      transition={{ duration: 0.18 }}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`focus-ring fixed bottom-20 right-4 z-30 grid size-11 place-items-center rounded-full border border-base bg-[var(--rr-surface)] shadow-lg lg:bottom-6 lg:right-6 ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <ArrowUp size={18} />
    </motion.button>
  );
}
