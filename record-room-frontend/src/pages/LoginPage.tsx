import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Archive, ArrowRight, Key, ShieldCheck, UserCircle } from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/Field';
import { Flash } from '../components/ui/Flash';
import { useService } from '../hooks/useService';
import { session } from '../services/impl/session';

const ROLE_OPTIONS = [
  { userName: 'admin', role: 'Admin', description: 'Manage users, locations and system settings' },
  { userName: 'supervisor', role: 'Supervisor', description: 'Oversee records and digitization' },
  {
    userName: 'operator',
    role: 'Operator',
    description: 'Register, issue, return and scan records',
  },
  { userName: 'employee', role: 'Employee', description: 'View records and assigned information' },
] as const;

/**
 * Legacy `match_pin` accepted a 4-digit employee PIN, so an employee with no
 * password was never locked out. PR #3 simplified this screen to a role picker
 * and a password, which quietly removed that path. The endpoint
 * (`POST /api/auth/pin` and `AuthApi.signInWithPin`) was never deleted, so this
 * restores reachability rather than adding anything new.
 *
 * OTP and password recovery stay unreachable from this screen: they are
 * multi-step flows that belong on their own surface, and neither is needed to
 * keep a PIN-only employee working.
 */
const DEMO_PIN = '1234';

export function LoginPage() {
  const service = useService();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_OPTIONS)[number]['role']>('Admin');
  const [userName, setUserName] = useState('admin');
  const [password, setPassword] = useState(service.auth.demoPassword);
  const [pin, setPin] = useState(DEMO_PIN);
  const [usePin, setUsePin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (session.get()) return <Navigate to={from} replace />;

  const chooseRole = (role: (typeof ROLE_OPTIONS)[number]) => {
    setSelectedRole(role.role);
    setUserName(role.userName);
    setPassword(service.auth.demoPassword);
    setPin(DEMO_PIN);
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = usePin
        ? await service.auth.signInWithPin(userName.trim(), pin)
        : await service.auth.signIn(userName.trim(), password);
      if (result.ok) navigate(from, { replace: true });
      else setError(result.error);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed. Try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[var(--rr-bg)] px-4 py-8 text-[var(--rr-text)] sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col justify-center">
        <header className="mb-8 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--rr-accent)] text-white">
            <Archive size={23} weight="bold" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Record Room</h1>
            <p className="muted mt-0.5 text-sm">Choose your role to sign in.</p>
          </div>
        </header>

        <section className="surface rounded-2xl p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.role}
                type="button"
                aria-pressed={selectedRole === role.role}
                onClick={() => chooseRole(role)}
                className={`focus-ring min-h-24 rounded-xl border p-3.5 text-left transition ${selectedRole === role.role ? 'border-[var(--rr-accent)] bg-accent-soft' : 'border-base hover:bg-[var(--rr-surface-2)]'}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{role.role}</span>
                  {selectedRole === role.role && (
                    <ShieldCheck size={18} className="text-accent" weight="fill" />
                  )}
                </span>
                <span className="muted mt-1.5 block text-xs leading-5">{role.description}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Sign in</h2>
              <p className="muted mt-1 text-sm">
                {usePin
                  ? 'Enter the 4-digit PIN issued with your account.'
                  : 'Use the account assigned to your role.'}
              </p>
            </div>
            <Field label="Username" htmlFor="login-user" required>
              <div className="relative">
                <UserCircle size={18} className="muted absolute left-3 top-1/2 -translate-y-1/2" />
                <TextInput
                  id="login-user"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  autoComplete="username"
                  className="pl-10"
                  required
                />
              </div>
            </Field>
            <Field
              label={usePin ? 'PIN' : 'Password'}
              htmlFor={usePin ? 'login-pin' : 'login-password'}
              required
            >
              <TextInput
                key={usePin ? 'pin' : 'password'}
                id={usePin ? 'login-pin' : 'login-password'}
                type="password"
                value={usePin ? pin : password}
                onChange={(event) =>
                  usePin ? setPin(event.target.value) : setPassword(event.target.value)
                }
                // A PIN is not a password: keep it out of the browser's password
                // manager, which would otherwise offer to save and refill it.
                autoComplete={usePin ? 'off' : 'current-password'}
                inputMode={usePin ? 'numeric' : undefined}
                maxLength={usePin ? 4 : undefined}
                pattern={usePin ? '[0-9]*' : undefined}
                className={usePin ? 'font-mono tracking-[0.4em]' : undefined}
                required
              />
            </Field>
            {error && <Flash tone="danger" text={error} onDismiss={() => setError(null)} />}
            <Button
              type="submit"
              className="w-full"
              disabled={pending}
              icon={<ArrowRight size={17} />}
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setUsePin(!usePin);
                setError(null);
              }}
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold muted transition hover:text-[var(--rr-text)]"
            >
              <Key size={14} />
              {usePin ? 'Use my password instead' : 'I have a 4-digit PIN instead'}
            </button>
          </form>
        </section>
        <p className="muted mt-5 text-center text-xs">
          Select one of the four available roles, then enter your credentials.
        </p>
      </div>
    </main>
  );
}
