import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeSlash,
  LockKey,
  UserCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { BrandMark } from '../layouts/Sidebar';
import { DecorativeSpines } from '../components/ShelfSpines';
import { useService } from '../hooks/useService';
import { session } from '../services/impl/session';

const DEMO_ACCOUNTS: Array<{ userName: string; role: string }> = [
  { userName: 'admin', role: 'Admin' },
  { userName: 'supervisor', role: 'Supervisor' },
  { userName: 'operator', role: 'Operator' },
  { userName: 'employee', role: 'Employee' },
];

/**
 * Web sign-in with a user name and password.
 *
 * Mobile OTP, the employee PIN and OTP password recovery belong to the phone
 * app and the administrator, so they are not offered here.
 */
export function LoginPage() {
  const service = useService();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (session.get()) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const result = await service.auth.signIn(userName.trim(), password);
      if (result.ok) navigate(from, { replace: true });
      else setError(result.error);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not reach the server. Try again.');
    } finally {
      setPending(false);
    }
  };

  const fillDemo = (name: string) => {
    setUserName(name);
    setPassword(service.auth.demoPassword);
    setError(null);
  };

  return (
    <div className="grid min-h-dvh bg-[var(--rr-bg)] text-[var(--rr-text)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Brand panel — desktop only; phones go straight to the form. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[var(--rr-rail)] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <BrandMark size={40} />
          <span className="text-lg font-bold tracking-tight">Record Room</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-[1.1] tracking-[-0.02em]">
            Every file, on the right shelf.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[var(--rr-rail-text)]/80">
            Find a physical record, see who holds it, move it, and attach its scan — for every room
            in the registry.
          </p>
          <DecorativeSpines className="mt-10 max-w-md" />
        </div>
        <p className="text-sm text-[var(--rr-rail-muted)]">
          Authorised staff only. Every sign-in and action is recorded.
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size={40} />
            <span className="text-lg font-bold tracking-tight">Record Room</span>
          </div>

          <h2 className="text-2xl font-bold tracking-[-0.02em]">Sign in</h2>
          <p className="muted mt-1.5 text-sm">Use the user name and password issued to you.</p>

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            <div>
              <label htmlFor="login-user" className="text-[13px] font-semibold">
                User name
              </label>
              <div className="relative mt-1.5">
                <UserCircle
                  size={19}
                  className="muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  id="login-user"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  required
                  className="focus-ring h-12 w-full rounded-lg border border-base bg-[var(--rr-surface)] pl-10 pr-3 text-base outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="text-[13px] font-semibold">
                Password
              </label>
              <div className="relative mt-1.5">
                <LockKey
                  size={19}
                  className="muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  id="login-password"
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyUp={(event) => setCapsOn(event.getModifierState('CapsLock'))}
                  autoComplete="current-password"
                  required
                  className="focus-ring h-12 w-full rounded-lg border border-base bg-[var(--rr-surface)] pl-10 pr-12 text-base outline-none"
                />
                <button
                  type="button"
                  onClick={() => setReveal((value) => !value)}
                  className="focus-ring muted absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md"
                  aria-label={reveal ? 'Hide password' : 'Show password'}
                  aria-pressed={reveal}
                >
                  {reveal ? <EyeSlash size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {capsOn && (
                <p className="mt-1.5 text-xs text-[var(--rr-warning)]">Caps Lock is on.</p>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-[color-mix(in_srgb,var(--rr-danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--rr-danger)_8%,transparent)] p-3 text-sm"
              >
                <WarningCircle
                  size={18}
                  weight="fill"
                  className="mt-0.5 shrink-0 text-[var(--rr-danger)]"
                />
                <p className="leading-5">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="h-12 w-full text-base"
              disabled={pending || !userName.trim() || !password}
              icon={pending ? undefined : <ArrowRight size={18} weight="bold" />}
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="muted mt-5 text-sm leading-6">
            Forgot your password? Ask a system administrator to reset it for you.
          </p>

          <div className="mt-8 rounded-xl border border-dashed border-base p-4">
            <p className="text-[13px] font-semibold">Demo accounts</p>
            <p className="muted mt-1 text-xs leading-5">
              Tap one to fill the form. Password:{' '}
              <span className="mono font-medium text-[var(--rr-text)]">
                {service.auth.demoPassword}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.userName}
                  type="button"
                  onClick={() => fillDemo(account.userName)}
                  className="focus-ring min-h-10 rounded-lg border border-base bg-[var(--rr-surface)] px-3 text-left text-[13px] hover:bg-[var(--rr-surface-2)]"
                >
                  <span className="font-semibold">{account.userName}</span>
                  <span className="muted ml-1.5 text-xs">{account.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
