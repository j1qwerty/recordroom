import { Barcode, CheckCircle, MapPin } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function NewFilePage() {
  const navigate = useNavigate();
  const [created, setCreated] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Registry"
        title="Create physical file"
        description="Prototype form. Production will validate duplicate file numbers server-side and create the permanent RF ID transactionally."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]">
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="File number" placeholder="ABC/2026/0001" />
            <Field label="Department" placeholder="Revenue" />
            <Field label="Subject" placeholder="Land acquisition review" />
            <Field label="Year" placeholder="2026" />
            <Field label="Codal life" placeholder="25 years" />
            <Field label="Description" placeholder="Short identification note" />
          </div>
          <div className="mt-5 flex gap-2">
            <Button onClick={() => setCreated(true)} icon={<CheckCircle size={17} />}>
              Create file
            </Button>
            <Button variant="ghost" onClick={() => navigate('/files')}>
              Cancel
            </Button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2">
            <Barcode className="text-accent" size={19} />
            <p className="text-sm font-semibold">Identity preview</p>
          </div>
          <div className="mt-5 rounded-xl bg-[var(--rr-bg)] p-4">
            <p className="muted text-[10px] uppercase tracking-widest">Next RF ID</p>
            <p className="mt-2 font-mono text-xl font-semibold text-accent">RF-0000247841</p>
            <div className="mt-4 h-14 rounded bg-[repeating-linear-gradient(90deg,#17212b_0_2px,transparent_2px_5px,#17212b_5px_6px,transparent_6px_9px)]" />
            <p className="muted mt-3 text-xs">
              Location remains separate and can change without changing this RF ID.
            </p>
          </div>
          {created && (
            <div className="mt-4 flex gap-2 rounded-xl bg-accent-soft p-4 text-xs">
              <MapPin className="text-accent" size={17} />
              <div>
                <p className="font-semibold">File draft created in the frontend demo.</p>
                <p className="muted mt-1">
                  Next production step is barcode print and physical location confirmation.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="muted text-xs font-semibold">{label}</span>
      <input
        required
        placeholder={placeholder}
        className="focus-ring mt-2 h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 text-sm outline-none"
      />
    </label>
  );
}
