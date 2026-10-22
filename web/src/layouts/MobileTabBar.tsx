import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardText, DotsThree, Files, Gauge, ScanSmiley } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '../lib/utils';
import { useSession } from '../hooks/useService';
import type { Permission } from '../services/permissions';

const tabs: Array<{ label: string; to: string; icon: Icon; permission?: Permission }> = [
  { label: 'Home', to: '/', icon: Gauge },
  { label: 'Files', to: '/files', icon: Files },
  { label: 'Scan', to: '/scan', icon: ScanSmiley },
  { label: 'Issue', to: '/issue', icon: ClipboardText, permission: 'issue.issue' },
];

/** Thumb-reach navigation for phones; the full menu stays one tap away under "More". */
export function MobileTabBar({ onMore }: { onMore: () => void }) {
  const location = useLocation();
  const { allowed } = useSession();
  const visible = tabs.filter((tab) => !tab.permission || allowed(tab.permission));

  return (
    <nav
      aria-label="Quick navigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 flex border-t border-base bg-[var(--rr-surface)] pt-1 lg:hidden"
    >
      {visible.map((tab) => {
        const active =
          tab.to === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.to);
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-ring flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold',
              active ? 'text-accent' : 'muted',
            )}
          >
            <Icon size={22} weight={active ? 'fill' : 'regular'} />
            {tab.label}
          </NavLink>
        );
      })}
      <button
        type="button"
        onClick={onMore}
        className="focus-ring muted flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold"
      >
        <DotsThree size={22} weight="bold" />
        More
      </button>
    </nav>
  );
}
