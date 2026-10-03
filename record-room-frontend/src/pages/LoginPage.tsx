import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  DeviceMobile,
  Key,
  LockKey,
  ShieldCheck,
  UserCircle,
} from '@phosphor-icons/react';
import { PageTransition } from '../components/PageTransition';
import { DecorativeField } from '../components/DecorativeField';
import { Field, TextInput } from '../components/ui/Field';
import { Flash } from '../components/ui/Flash';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useService } from '../hooks/useService';
import { session } from '../services/impl/session';

type Mode = 'password' | 'otp' | 'pin' | 'recover';

const DEMO_ACCOUNTS: Array<{ userName: string; role: string; note: string }> = [
  { userName: 'admin', role: 'Admin', note: 'Everything, including users and configuration' },
  { userName: 'supervisor', role: 'Supervisor', note: 'Approves digitization, edits locations' },
  { userName: 'operator', role: 'Operator', note: 'Runs the issue, return and scanning desks' },
  { userName: 'employee', role: 'Employee', note: 'Read-only view of own records' },
];

/**
 * Sign-in surface covering the four legacy entry points:
 * `login_process` (web), OTP mobile login, employee PIN and the
 * `forgotpassword â†’ enterotp â†’ recoverpassword` reset chain.
 */
export function LoginPage() {
  const service = useService();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('password');
  const [userName, setUserName] = useState('admin');
  const [secret, setSecret] = useState(service.auth.demoPassword);
  const [otp, setOtp] = useState('');
  const [issuedOtp, setIssuedOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (session.get()) return <Navigate to={from} replace />;

  const complete = () => {
    setError(null);
    navigate(from, { replace: true });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === 'password') {
      const result = service.auth.signIn(userName, secret);
      if (result.ok) complete();
      else setError(result.error);
      return;
    }

    if (mode === 'otp') {
      if (!issuedOtp) {
        const challenge = service.auth.requestOtp(userName);
        if (challenge.ok) {
          setIssuedOtp(challenge.value.otp);
          setOtp(challenge.value.otp);
          setError(null);
        } else setError(challenge.error);
        return;
      }
      const result = service.auth.signInWithOtp(userName, otp);
      if (result.ok) complete();
      else setError(result.error);
      return;
    }

    if (mode === 'pin') {
      const result = service.auth.signInWithPin(userName, secret);
      if (result.ok) complete();
      else setError(result.error);
      return;
    }

    if (!issuedOtp) {
      const challenge = service.auth.requestRecovery(userName);
      if (challenge.ok) {
        setIssuedOtp(challenge.value.otp);
        setOtp(challenge.value.otp);
      } else setError(challenge.error);
      return;
    }
    const result = service.auth.recoverPassword(userName, otp, secret);
    if (result.ok) {
      setError(null);
      setMode('password');
      setSecret(service.auth.demoPassword);
      setIssuedOtp(null);
      setOtp('');
    } else setError(result.error);
  };

  const secretLabel =
    mode === 'password'
      ? 'Password'
      : mode === 'pin'
        ? '4-digit PIN'
        : mode === 'recover'
          ? 'New password'
          : 'One-time password';

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--rr-bg)] text-[var(--rr-text)]">
      <DecorativeField variant={2} className="-right-16 -top-12 w-80 opacity-40" />
      <DecorativeField variant={7} className="bottom-0 left-0 w-72 opacity-25" />
      <div className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <section>
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-[var(--rr-accent)] text-white">
              <Archive size={22} weight="bold" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Record Room</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] muted">
                Digital twin platform
              </p>
            </div>
          </div>
          <h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
            Know the record. Know the room. Know the history.
          </h1>
          <p className="muted mt-5 max-w-lg text-base leading-7">
            Registry, physical locations, issue and return, digitization batches and a complete
            audit trail for roughly 25 lakh files.
          </p>

          <div className="mt-8 rounded-2xl border border-base bg-[var(--rr-surface)] p-5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">
              <ShieldCheck size={15} /> Demo accounts
            </p>
            <p className="muted mt-2 text-xs leading-6">
              Frontend-only prototype. Every account uses the password{' '}
              <span className="font-mono font-semibold">{service.auth.demoPassword}</span>; there is
              no real credential store here.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.userName}
                  type="button"
                  onClick={() => {
                    setUserName(account.userName);
                    setSecret(mode === 'pin' ? '1234' : service.auth.demoPassword);
                    setMode('password');
                    setIssuedOtp(null);
                  }}
                  className="focus-ring rounded-xl border border-base p-3 text-left transition hover:border-[var(--rr-accent)] hover:bg-[var(--rr-surface-2)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold">{account.userName}</span>
                    <Badge tone="info">{account.role}</Badge>
                  </div>
                  <p className="muted mt-1.5 text-[11px] leading-5">{account.note}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <PageTransition>
          <section className="surface rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
            <p className="muted mt-2 text-sm">
              Choose the credential the legacy system expects for your workflow.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {(
                [
                  { key: 'password', label: 'Web login', icon: LockKey },
                  { key: 'otp', label: 'Mobile OTP', icon: DeviceMobile },
                  { key: 'pin', label: 'Employee PIN', icon: Key },
                  { key: 'recover', label: 'Reset password', icon: ShieldCheck },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setMode(option.key);
                    setError(null);
                    setIssuedOtp(null);
                    setSecret(option.key === 'pin' ? '1234' : service.auth.demoPassword);
                  }}
                  className={`focus-ring inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    mode === option.key
                      ? 'border-[var(--rr-accent)] bg-accent-soft text-accent'
                      : 'border-base muted hover:bg-[var(--rr-surface-2)]'
                  }`}
                >
                  <option.icon size={15} />
                  {option.label}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <Field label="User name" htmlFor="login-user" required>
                <div className="relative">
                  <UserCircle
                    size={18}
                    className="muted absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <TextInput
                    id="login-user"
                    value={userName}
                    autoComplete="username"
                    onChange={(event) => setUserName(event.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </Field>

              {mode !== 'otp' && (
                <Field
                  label={secretLabel}
                  htmlFor="login-secret"
                  hint={
                    mode === 'pin'
                      ? 'Demo PIN is 1234, matching the legacy employee PIN check.'
                      : undefined
                  }
                  required
                >
                  <TextInput
                    id="login-secret"
                    type="password"
                    value={secret}
                    autoComplete={mode === 'recover' ? 'new-password' : 'current-password'}
                    onChange={(event) => setSecret(event.target.value)}
                    required
                  />
                </Field>
              )}

              {mode === 'otp' && (
                <Field
                  label="One-time password"
                  htmlFor="login-otp"
                  hint={
                    issuedOtp
                      ? `Demo code ${issuedOtp} was generated and pre-filled.`
                      : 'Press continue to generate a demo code.'
                  }
                >
                  <TextInput
                    id="login-otp"
                    value={otp}
                    inputMode="numeric"
                    onChange={(event) => setOtp(event.target.value)}
                  />
                </Field>
              )}

              {error && <Flash tone="danger" text={error} onDismiss={() => setError(null)} />}

              <Button type="submit" className="w-full" icon={<ArrowRight size={17} />}>
                {mode === 'recover'
                  ? issuedOtp
                    ? 'Set new password'
                    : 'Send recovery code'
                  : mode === 'otp' && !issuedOtp
                    ? 'Generate code'
                    : 'Sign in'}
              </Button>
            </form>

            <p className="muted mt-5 border-t border-base pt-5 text-xs leading-6">
              Sessions, failed attempts and sign-outs are written to the audit trail exactly as
              <span className="font-mono"> login_history</span> did in the legacy app.
            </p>
          </section>
        </PageTransition>
      </div>
    </div>
  );
}
