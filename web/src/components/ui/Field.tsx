import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/utils';

const control =
  'focus-ring w-full rounded-lg border bg-[var(--rr-surface)] px-3 text-base outline-none sm:text-sm transition placeholder:text-[color-mix(in_srgb,var(--rr-text)_38%,transparent)] disabled:cursor-not-allowed disabled:opacity-60';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('block', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold">
        {label}
        {required && <span className="ml-1 text-[var(--rr-danger)]">*</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-1.5 text-xs text-[var(--rr-danger)]">{error}</p>
      ) : hint ? (
        <p className="muted mt-1.5 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        control,
        'h-11',
        invalid ? 'border-[var(--rr-danger)]' : 'border-base',
        className,
      )}
      {...props}
    />
  );
}

export function SelectInput({
  invalid,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        control,
        'h-11',
        invalid ? 'border-[var(--rr-danger)]' : 'border-base',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        control,
        'min-h-24 py-2.5 leading-6',
        invalid ? 'border-[var(--rr-danger)]' : 'border-base',
        className,
      )}
      {...props}
    />
  );
}

export function FormGrid({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 | 3 }) {
  const map = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' };
  return <div className={cn('grid gap-4', map[columns])}>{children}</div>;
}
