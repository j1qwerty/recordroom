import { Bell, Database, Globe, Key, Moon, ShieldCheck } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="System settings"
        title="Settings"
        description="Configuration surfaces for frontend prototype behavior. Production values belong behind authenticated administrative APIs."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <Setting
            icon={<Globe />}
            title="Deployment"
            label="Base URL"
            value="/"
            note="Vite and Netlify are configured for root deployment."
          />
          <Setting
            icon={<Database />}
            title="Firebase"
            label="Connection"
            value="Environment placeholders"
            note="Set VITE_FIREBASE_* values locally or in Netlify environment variables."
          />
          <Setting
            icon={<Key />}
            title="Security"
            label="Secrets"
            value="No client secrets committed"
            note="Firebase web configuration is public by design; privileged keys must never be embedded."
          />
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent-soft p-2 text-accent">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Operational preferences</p>
              <p className="muted text-xs">Local demo settings only.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <Toggle
              icon={<Bell />}
              label="Operational notifications"
              value={notifications}
              setValue={setNotifications}
            />
            <Toggle
              icon={<Moon />}
              label="Remember dark mode"
              value={localStorage.getItem('rr-dark') === '1'}
              setValue={(value) => {
                localStorage.setItem('rr-dark', value ? '1' : '0');
                window.dispatchEvent(new Event('storage'));
              }}
            />
          </div>
          <div className="mt-5 rounded-xl bg-accent-soft p-4">
            <Badge tone="info">Frontend only</Badge>
            <p className="muted mt-2 text-xs leading-6">
              Role, audit, retention, storage and search policies must be backend-enforced.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
function Setting({
  icon,
  title,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  title: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="border-b border-base py-4 first:pt-0 last:border-b-0">
      <div className="flex gap-3">
        <div className="rounded-lg bg-accent-soft p-2 text-accent">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs">
            {label}: <span className="font-semibold">{value}</span>
          </p>
          <p className="muted mt-1 text-[10px] leading-5">{note}</p>
        </div>
      </div>
    </div>
  );
}
function Toggle({
  icon,
  label,
  value,
  setValue,
}: {
  icon: ReactNode;
  label: string;
  value: boolean;
  setValue: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => setValue(!value)}
      className="focus-ring flex w-full items-center justify-between rounded-xl bg-[var(--rr-bg)] p-3 text-left"
    >
      <span className="flex items-center gap-3">
        <span className="text-accent">{icon}</span>
        <span className="text-sm font-semibold">{label}</span>
      </span>
      <span
        className={`h-6 w-11 rounded-full p-1 transition ${value ? 'bg-[var(--rr-accent)]' : 'bg-[var(--rr-surface-2)]'}`}
      >
        <span
          className={`block size-4 rounded-full bg-white transition ${value ? 'translate-x-5' : ''}`}
        />
      </span>
    </button>
  );
}
