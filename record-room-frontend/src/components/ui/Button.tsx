import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type BaseProps = {
  /** Optional so icon-only controls can pass `icon` + `aria-label` alone. */
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: never };
type LinkButtonProps = BaseProps & { to: string; onClick?: () => void };

const styles = {
  primary: 'bg-[var(--rr-accent)] text-white hover:bg-[var(--rr-accent-strong)]',
  secondary: 'bg-[var(--rr-surface-2)] text-[var(--rr-text)] hover:brightness-[0.98]',
  ghost:
    'border border-[var(--rr-border)] bg-transparent text-[var(--rr-text)] hover:bg-[var(--rr-surface-2)]',
  danger: 'bg-[var(--rr-danger)] text-white hover:brightness-95',
};

export function Button({ children, className, icon, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  className,
  icon,
  variant = 'primary',
  to,
  onClick,
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition active:scale-[0.98]',
        styles[variant],
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
