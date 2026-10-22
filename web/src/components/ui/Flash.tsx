import { CheckCircle, Info, WarningCircle, X } from '@phosphor-icons/react';
import { Badge } from './Badge';

export type FlashTone = 'success' | 'danger' | 'info';

/**
 * Inline result banner for form submissions.
 *
 * Every write path in the service layer returns a `Result`, so each page shows
 * the same confirmation or failure affordance rather than inventing its own.
 */
export function Flash({
  tone,
  text,
  onDismiss,
}: {
  tone: FlashTone;
  text: string;
  onDismiss?: () => void;
}) {
  const styles = {
    success:
      'border-[color-mix(in_srgb,var(--rr-success)_40%,transparent)] text-[var(--rr-success)]',
    danger: 'border-[color-mix(in_srgb,var(--rr-danger)_45%,transparent)] text-[var(--rr-danger)]',
    info: 'border-[var(--rr-accent)] text-[var(--rr-text)]',
  };
  const Icon = tone === 'success' ? CheckCircle : tone === 'danger' ? WarningCircle : Info;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border bg-[var(--rr-surface)] p-4 text-sm ${styles[tone]}`}
    >
      <Icon size={19} weight="fill" className="mt-0.5 shrink-0" />
      <p className="flex-1 leading-6 text-[var(--rr-text)]">{text}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="focus-ring rounded p-1"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

/** Maps a domain status string onto the shared badge tones. */
export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'Available' ||
    status === 'Approved' ||
    status === 'Active' ||
    status === 'Returned' ||
    status === 'Operational'
      ? 'success'
      : status === 'Issued' ||
          status === 'Overdue' ||
          status === 'Missing' ||
          status === 'Rejected' ||
          status === 'Maintenance' ||
          status === 'Decommissioned'
        ? 'danger'
        : status === 'Under Digitization' ||
            status === 'Submitted' ||
            status === 'Partially returned' ||
            status === 'Partially approved' ||
            status === 'Restricted' ||
            status === 'Inactive'
          ? 'warning'
          : status === 'Pending review' || status === 'Duplicate' || status === 'In progress'
            ? 'info'
            : 'neutral';

  return <Badge tone={tone}>{status}</Badge>;
}
