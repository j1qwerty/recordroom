import { Barcode, CheckCircle, MagnifyingGlass, UserCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { files } from '../data/mock';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';

export function IssuePage() {
  const [rf, setRf] = useState('');
  const file =
    files.find((item) => item.rfId.toLowerCase() === rf.toLowerCase()) ??
    (rf ? files.find((item) => item.rfId.includes(rf)) : undefined);
  const [issued, setIssued] = useState(false);
  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Physical movement"
        title="Issue desk"
        description="Scanner-first workflow. In production, the operator scans the physical file barcode, confirms the requester and commits an auditable issue event."
      />
      <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Barcode size={19} className="text-accent" />
            <p className="text-sm font-semibold">1. Scan file</p>
          </div>
          <div className="mt-5 relative">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 muted" size={18} />
            <input
              value={rf}
              onChange={(e) => setRf(e.target.value)}
              autoFocus
              className="focus-ring h-12 w-full rounded-xl border border-base bg-[var(--rr-bg)] pl-11 pr-4 font-mono text-sm outline-none"
              placeholder="Scan or type RF-0000124587"
            />
          </div>
          <p className="muted mt-2 text-xs">
            USB scanner input can be treated like keyboard text. Camera scanning can be added later.
          </p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">2. Verify request</p>
              <p className="muted mt-1 text-xs">
                The requester and permission checks run before commit.
              </p>
            </div>
            <UserCircle size={22} className="text-accent" />
          </div>
          {file ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-[var(--rr-bg)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-accent">{file.rfId}</p>
                    <p className="mt-2 font-semibold">{file.subject}</p>
                    <p className="muted mt-1 text-xs">{file.location}</p>
                  </div>
                  <Badge tone={file.status === 'Available' ? 'success' : 'warning'}>
                    {file.status}
                  </Badge>
                </div>
              </div>
              <label className="block">
                <span className="muted text-xs font-semibold">Issue to</span>
                <input
                  defaultValue="R. Kumar · Establishment"
                  className="focus-ring mt-2 h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 text-sm outline-none"
                />
              </label>
              <Button
                className="w-full"
                disabled={file.status !== 'Available' || issued}
                icon={<CheckCircle size={17} />}
                onClick={() => setIssued(true)}
              >
                {issued ? 'Issue committed' : 'Confirm issue'}
              </Button>
              {issued && (
                <div className="rounded-xl bg-[color-mix(in_srgb,var(--rr-success)_10%,transparent)] p-4 text-sm text-[var(--rr-success)]">
                  Issue event created in this demo. Production will also update current holder,
                  status, audit log and movement history transactionally.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-base p-8 text-center">
              <p className="text-sm font-semibold">Waiting for a scan</p>
              <p className="muted mt-2 text-xs">
                Scan a file to see its location and verify the issue request.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
