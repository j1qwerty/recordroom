import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type BaseProps = {
  /** Optional so icon-only controls can pass `icon` + `aria-label` alone. */
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { to?: never };
type LinkButtonProps = BaseProps & { to: string; onClick?: () => void };

const styles = {
  primary:
    'bg-[var(--rr-accent)] text-white hover:bg-[var(--rr-accent-strong)] dark:text-[#0d1420]',
  secondary: 'bg-[var(--rr-surface-2)] text-[var(--rr-text)] hover:brightness-[0.97]',
  ghost:
    'border border-[var(--rr-border)] bg-[var(--rr-surface)] text-[var(--rr-text)] hover:bg-[var(--rr-surface-2)]',
  danger: 'bg-[var(--rr-danger)] text-white hover:brightness-95 dark:text-[#0d1420]',
};

const sizes = {
  md: 'min-h-10 px-4 text-sm',
  sm: 'min-h-9 px-3 text-[13px]',
};

const base =
  'focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.98]';

export function Button({
  children,
  className,
  icon,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        'disabled:cursor-not-allowed disabled:opacity-50',
        sizes[size],
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
  size = 'md',
  to,
  onClick,
}: LinkButtonProps) {
  return (
    <Link to={to} onClick={onClick} className={cn(base, sizes[size], styles[variant], className)}>
      {icon}
      {children}
    </Link>
  );
}
