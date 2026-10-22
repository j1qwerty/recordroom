import { useState, type FormEvent } from 'react';
import { CheckCircle, PaperPlaneTilt, ShieldCheck } from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field, FormGrid, TextArea } from '../components/ui/Field';
import { Flash } from '../components/ui/Flash';
import { useQuery, useService } from '../hooks/useService';
import type { InquiryRecord } from '../services/impl/inquiries';

/**
 * Support and inquiry.
 *
 * Stored in the local snapshot, not in a browser-side database. This project
 * does not use Firebase (`AGENTS.md`), so the inquiry list is a placeholder
 * until `dotnet-api/` exposes a real endpoint — see `docs/PHASED-SCOPE.md`.
 */
export function SupportPage() {
  const service = useService();
  const [form, setForm] = useState({ name: '', email: '', department: '', message: '' });
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const { data: submitted, reload } = useQuery(
    () => service.inquiries.list(),
    [],
    [] as InquiryRecord[],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await service.inquiries.save(form);
    if (!result.ok) {
      setFlash({ tone: 'danger', text: result.error });
      return;
    }
    setFlash({
      tone: 'success',
      text: `Inquiry saved locally at ${result.value.createdAt}. It will not survive a dataset reset.`,
    });
    setForm({ name: '', email: '', department: '', message: '' });
    // The "submitted in this session" list is a query result, not local state.
    reload();
  };

  return (
    <div className="relative space-y-7">
      <div className="pointer-events-none absolute -left-4 top-0 w-44 opacity-20">
        <img src="/decorative/geo-04.svg" alt="" className="w-full" />
      </div>
      <PageHeader
        kicker="Support & inquiry"
        title="Send an implementation inquiry"
        description="Small operational inquiries are captured in the browser for now. Production persistence belongs to the .NET 10 API."
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]">
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <FormGrid>
              <Field label="Name" htmlFor="inq-name" required>
                <input
                  id="inq-name"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="focus-ring h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 text-sm outline-none"
                />
              </Field>
              <Field label="Email" htmlFor="inq-email" required>
                <input
                  id="inq-email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="focus-ring h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 text-sm outline-none"
                />
              </Field>
            </FormGrid>
            <Field label="Department" htmlFor="inq-department">
              <input
                id="inq-department"
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
                className="focus-ring h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 text-sm outline-none"
              />
            </Field>
            <Field
              label="Message"
              htmlFor="inq-message"
              required
              error={flash?.tone === 'danger' ? flash.text : undefined}
            >
              <TextArea
                id="inq-message"
                required
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                className="min-h-36"
                placeholder="What needs to change in the workflow?"
              />
            </Field>
            <Button type="submit" icon={<PaperPlaneTilt size={17} />}>
              Submit inquiry
            </Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3">
              <ShieldCheck size={21} className="text-accent" />
              <p className="text-sm font-semibold">Data handling note</p>
            </div>
            <p className="muted mt-4 text-sm leading-7">
              Nothing here leaves the browser. No third-party SDK, no browser-side database, and no
              credential of any kind is shipped in this bundle. File scans and PDFs belong in
              approved object storage on the backend, never in a browser database.
            </p>
          </Card>

          <Card>
            <p className="text-sm font-semibold">Submitted in this session</p>
            {submitted.length === 0 ? (
              <p className="muted mt-3 text-xs">Nothing submitted yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {submitted.map((item) => (
                  <li key={item.id} className="rounded-xl bg-[var(--rr-bg)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold">{item.name}</p>
                      <CheckCircle size={14} className="text-[var(--rr-success)]" />
                    </div>
                    <p className="muted mt-1 text-[11px]">
                      {item.department || 'No department'} · {item.createdAt}
                    </p>
                    <p className="muted mt-1.5 text-[11px] leading-5">{item.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
