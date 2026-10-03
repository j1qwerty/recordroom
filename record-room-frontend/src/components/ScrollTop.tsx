import { ArrowUp } from '@phosphor-icons/react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useState, useEffect } from 'react';

export function ScrollTop() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  useMotionValueEvent(scrollY, 'change', (latest) => setVisible(latest > 240));

  useEffect(() => {
    let timer: number | undefined;
    const onScroll = () => {
      setScrolling(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setScrolling(false), 320);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <motion.button
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 12, scale: visible ? 1 : 0.9 }}
      transition={{ duration: 0.18 }}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`focus-ring fixed bottom-5 right-5 z-40 rounded-full border border-base bg-[var(--rr-surface)] p-3 shadow-xl ${scrolling ? 'motion-safe:animate-pulse' : ''} ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <ArrowUp size={18} />
    </motion.button>
  );
}
