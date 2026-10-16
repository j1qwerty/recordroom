import { List, MagnifyingGlass, SignOut } from '@phosphor-icons/react';
import { useSession } from '../hooks/useService';

export type Theme = 'light' | 'blue' | 'dark';

export function Topbar({
  theme,
  setTheme,
  onMenu,
  onCommandPalette,
}: {
  theme: Theme;
  setTheme: (value: Theme) => void;
  onMenu: () => void;
  onCommandPalette: () => void;
}) {
  const { user, signOut } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-base bg-[color-mix(in_srgb,var(--rr-surface)_92%,transparent)] px-3 backdrop-blur-xl sm:px-4 lg:px-6">
      <button
        onClick={onMenu}
        className="focus-ring rounded-lg p-2 hover:bg-[var(--rr-surface-2)] lg:hidden"
        aria-label="Open navigation"
      >
        <List size={22} />
      </button>
      <button
        onClick={onCommandPalette}
        className="focus-ring flex min-w-0 max-w-2xl flex-1 items-center gap-2 rounded-lg border border-base bg-[var(--rr-bg)] px-3 py-2.5 text-left transition hover:border-[var(--rr-accent)] sm:gap-3 sm:px-4"
        aria-label="Search pages, files and actions. Keyboard shortcut Control K"
      >
        <MagnifyingGlass size={18} className="muted shrink-0" />
        <span className="muted truncate text-sm">Search pages, files and actions…</span>
        <kbd className="ml-auto hidden shrink-0 rounded-md border border-base bg-[var(--rr-surface)] px-1.5 py-0.5 text-[10px] muted sm:block">Ctrl K</kbd>
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <label className="sr-only" htmlFor="rr-theme">Color theme</label>
        <select
          id="rr-theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value as Theme)}
          className="focus-ring h-9 max-w-[92px] rounded-lg border border-base bg-[var(--rr-bg)] px-2 text-xs font-medium sm:max-w-none sm:px-3 sm:text-sm"
        >
          <option value="light">Light</option>
          <option value="blue">Blue</option>
          <option value="dark">Dark</option>
        </select>
        <span className="hidden rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent md:inline">
          {user?.role ?? 'Signed out'}
        </span>
        <button
          onClick={() => void signOut()}
          className="focus-ring rounded-lg p-2.5 muted transition-colors hover:bg-[var(--rr-danger)] hover:text-white"
          aria-label="Sign out"
          title="Sign out"
        >
          <SignOut size={19} />
        </button>
      </div>
    </header>
  );
}
