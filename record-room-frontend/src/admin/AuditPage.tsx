import { useState } from 'react';
import { DownloadSimple, MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SelectInput, TextInput } from '../components/ui/Field';
import { EmptyState } from '../components/ui/EmptyState';
import { useQuery, useService } from '../hooks/useService';
import { AUDIT_ACTIONS, auditRowsToCsv } from '../services';
import { downloadCsv, slugify, toCsv } from '../lib/csv';
import type { AuditAction, AuditEntry, LoginHistoryEntry, LoginOutcome } from '../types';

const EMPTY_ENTRIES: AuditEntry[] = [];
const EMPTY_LOGINS: LoginHistoryEntry[] = [];

const OUTCOMES: Array<LoginOutcome | 'All'> = ['All', 'Success', 'Failed', 'Signed out'];

const ACTION_TONE: Record<AuditAction, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Login: 'success',
  Logout: 'neutral',
  Create: 'info',
  Update: 'info',
  Delete: 'danger',
  Issue: 'warning',
  Return: 'success',
  Relocate: 'warning',
  Approve: 'success',
  Reject: 'danger',
  Export: 'neutral',
};

/**
 * `activity_log_tbl` and `login_history`.
 *
 * The previous audit screen showed four static rows with no actor, IP or
 * before/after state. Every entry here is written by the service that made the
 * change, so the trail carries the actor, role, address and both states.
 *
 * Both tabs load at once because each tab button quotes its own row count. The
 * reads are async, so the filters become `useQuery` deps and an empty result set
 * distinguishes "loading" from "nothing matched".
 */
export function AuditPage() {
  const service = useService();

  const [tab, setTab] = useState<'audit' | 'logins'>('audit');

  const [search, setSearch] = useState('');
  const [action, setAction] = useState<AuditAction | 'All'>('All');
  const [actor, setActor] = useState('All');

  const [outcome, setOutcome] = useState<LoginOutcome | 'All'>('All');

  const { data: entries, loading: loadingEntries } = useQuery(
    () => service.audit.list({ search, action, actor, limit: 300 }),
    [search, action, actor],
    EMPTY_ENTRIES,
  );
  const { data: logins, loading: loadingLogins } = useQuery(
    () => service.audit.loginHistory({ search, outcome }),
    [search, outcome],
    EMPTY_LOGINS,
  );
  const { data: actors } = useQuery(() => service.audit.actors(), [], [] as string[]);

  const exportAudit = () => {
    downloadCsv(
      `${slugify('audit-log')}-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        [
          'At',
          'Action',
          'Entity',
          'Entity id',
          'Actor',
          'Role',
          'IP',
          'Before',
          'After',
          'Summary',
        ],
        auditRowsToCsv(entries),
      ),
    );
  };

  const exportLogins = () => {
    downloadCsv(
      `${slugify('login-history')}-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        ['Login at', 'Logout at', 'User', 'Role', 'Channel', 'IP', 'Client', 'Outcome', 'Detail'],
        logins.map((entry) => [
          entry.loginAt,
          entry.logoutAt ?? '',
          entry.userName,
          entry.role,
          entry.channel,
          entry.ip,
          entry.userAgent,
          entry.outcome,
          entry.detail,
        ]),
      ),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Administration"
        title="Audit & logins"
        description="Every change is written in the same transaction as the change itself, so the trail cannot drift from the data it describes."
        actions={
          <Button
            variant="ghost"
            icon={<DownloadSimple size={17} />}
            onClick={tab === 'audit' ? exportAudit : exportLogins}
          >
            Export CSV
          </Button>
        }
      />

      <Card padding={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base p-4">
          <div className="flex gap-2">
            {(['audit', 'logins'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`focus-ring rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  tab === key
                    ? 'bg-accent-soft text-accent'
                    : 'muted hover:bg-[var(--rr-surface-2)]'
                }`}
              >
                {key === 'audit'
                  ? `Activity log (${entries.length})`
                  : `Login history (${logins.length})`}
              </button>
            ))}
          </div>
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
            <div className="relative sm:col-span-3 lg:col-span-1">
              <MagnifyingGlass
                className="muted absolute left-3.5 top-1/2 -translate-y-1/2"
                size={16}
              />
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Summary, entity, IPâ€¦"
                className="pl-10"
                aria-label="Search audit entries"
              />
            </div>
            {tab === 'audit' ? (
              <>
                <SelectInput
                  value={action}
                  onChange={(event) => setAction(event.target.value as AuditAction | 'All')}
                  aria-label="Filter by action"
                >
                  <option value="All">All actions</option>
                  {AUDIT_ACTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectInput>
                <SelectInput
                  value={actor}
                  onChange={(event) => setActor(event.target.value)}
                  aria-label="Filter by actor"
                >
                  <option value="All">All actors</option>
                  {actors.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectInput>
              </>
            ) : (
              <SelectInput
                value={outcome}
                onChange={(event) => setOutcome(event.target.value as LoginOutcome | 'All')}
                aria-label="Filter by outcome"
                className="sm:col-span-2"
              >
                {OUTCOMES.map((item) => (
                  <option key={item} value={item}>
                    {item === 'All' ? 'All outcomes' : item}
                  </option>
                ))}
              </SelectInput>
            )}
          </div>
        </div>

        {tab === 'audit' ? (
          entries.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title={loadingEntries ? 'Loading audit entries' : 'No audit entries match'}
                description={
                  loadingEntries
                    ? 'Asking the audit service for entries that match these filters.'
                    : 'Clear the filters, or make a change on the issue, return or location screens to see a new entry.'
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-[var(--rr-border)]">
              {entries.map((entry) => (
                <div key={entry.id} className="grid gap-3 p-5 lg:grid-cols-[160px_1fr_1fr]">
                  <div>
                    <Badge tone={ACTION_TONE[entry.action]}>{entry.action}</Badge>
                    <p className="muted mt-2 text-[11px]">{entry.at}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{entry.summary}</p>
                    <p className="muted mt-1 text-[11px]">
                      {entry.entity} Â· <span className="font-mono">{entry.entityId}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded bg-[var(--rr-bg)] px-2 py-1">
                        actor <span className="font-semibold">{entry.actor}</span> ({entry.role})
                      </span>
                      <span className="rounded bg-[var(--rr-bg)] px-2 py-1">
                        ip <span className="font-mono">{entry.ip}</span>
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2 text-[11px]">
                    <div className="rounded-lg bg-[var(--rr-bg)] p-2">
                      <p className="muted uppercase tracking-wider">Before</p>
                      <p className="mt-0.5 font-mono">{entry.before}</p>
                    </div>
                    <div className="rounded-lg bg-accent-soft p-2">
                      <p className="uppercase tracking-wider text-accent">After</p>
                      <p className="mt-0.5 font-mono">{entry.after}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : logins.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={loadingLogins ? 'Loading login attempts' : 'No login attempts match'}
              description={
                loadingLogins
                  ? 'Asking the audit service for login attempts that match these filters.'
                  : 'Clear the filters to see the full history.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[var(--rr-bg)] text-xs uppercase tracking-wider muted">
                <tr>
                  <th className="px-5 py-3">Login</th>
                  <th className="px-5 py-3">Logout</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">IP</th>
                  <th className="px-5 py-3">Outcome</th>
                  <th className="px-5 py-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rr-border)]">
                {logins.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[var(--rr-bg)]">
                    <td className="px-5 py-4 text-xs muted">{entry.loginAt}</td>
                    <td className="px-5 py-4 text-xs muted">{entry.logoutAt ?? 'â€”'}</td>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold">{entry.userName}</p>
                      <p className="muted text-[11px]">{entry.role}</p>
                    </td>
                    <td className="px-5 py-4 text-xs">{entry.channel}</td>
                    <td className="px-5 py-4 font-mono text-xs muted">{entry.ip}</td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          entry.outcome === 'Success'
                            ? 'success'
                            : entry.outcome === 'Failed'
                              ? 'danger'
                              : 'neutral'
                        }
                      >
                        {entry.outcome}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-[11px] muted">{entry.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-accent" />
          <p className="muted text-sm leading-6">
            This log is a frontend projection. For 25 lakh files the authoritative trail belongs in
            the API with server-side filtering, retention policy and tamper evidence â€” see{' '}
            <span className="font-mono text-xs">docs/SECURITY.md</span>.
          </p>
        </div>
      </Card>
    </div>
  );
}
