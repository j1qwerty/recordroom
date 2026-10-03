import { CheckCircle, PaperPlaneTilt, ShieldCheck } from '@phosphor-icons/react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { saveInquiry } from '../services/firestore';
import { firebaseReady } from '../lib/firebase';

export function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', department: '', message: '' });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await saveInquiry(form);
    setSubmitted(true);
  };
  return (
    <div className="relative space-y-7">
      <div className="pointer-events-none absolute -left-4 top-0 w-44 opacity-20">
        <img src="/decorative/geo-04.svg" alt="" className="w-full" />
      </div>
      <PageHeader
        kicker="Support & inquiry"
        title="Send an implementation inquiry"
        description="This frontend can store lightweight inquiries in Firestore when the Firebase environment is configured."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]">
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Name"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
              />
              <Field
                label="Email"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
                type="email"
              />
            </div>
            <Field
              label="Department"
              value={form.department}
              onChange={(value) => setForm({ ...form, department: value })}
            />
            <label className="block">
              <span className="muted text-xs font-semibold">Message</span>
              <textarea
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="focus-ring mt-2 min-h-36 w-full resize-y rounded-xl border border-base bg-[var(--rr-bg)] p-3 text-sm outline-none"
              />
            </label>
            <Button type="submit" icon={<PaperPlaneTilt size={17} />}>
              Submit inquiry
            </Button>
            {submitted && (
              <div className="flex gap-2 rounded-xl bg-[color-mix(in_srgb,var(--rr-success)_10%,transparent)] p-3 text-xs text-[var(--rr-success)]">
                <CheckCircle size={16} /> Inquiry saved in{' '}
                {firebaseReady ? 'Firestore' : 'demo mode'}.
              </div>
            )}
          </form>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ShieldCheck size={21} className="text-accent" />
            <p className="text-sm font-semibold">Data handling note</p>
          </div>
          <p className="muted mt-4 text-sm leading-7">
            Only small operational inquiry data belongs in Firestore here. File scans, PDFs and
            other large binary records should use approved document/object storage rather than
            browser Firestore writes.
          </p>
        </Card>
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="muted text-xs font-semibold">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring mt-2 h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 text-sm outline-none"
      />
    </label>
  );
}
