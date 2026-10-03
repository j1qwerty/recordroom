import { Barcode, CheckCircle, MapPin } from '@phosphor-icons/react';
import { useState } from 'react';
import { files, rooms } from '../data/mock';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';

export function ReturnPage() {
  const [rf, setRf] = useState('RF-0000123144');
  const [complete, setComplete] = useState(false);
  const file = files.find((item) => item.rfId === rf);
  const room = rooms.find((item) => item.id === file?.roomId) ?? rooms[0];
  return (
    <div className="space-y-7">
      <PageHeader
        kicker="Physical movement"
        title="Return desk"
        description="Scan the file, verify the original storage path, then scan the destination shelf to close the return."
      />
      <div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Barcode size={19} className="text-accent" />
            <p className="text-sm font-semibold">File scan</p>
          </div>
          <input
            value={rf}
            onChange={(e) => {
              setRf(e.target.value);
              setComplete(false);
            }}
            className="focus-ring mt-5 h-12 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-4 font-mono text-sm outline-none"
          />
          <p className="muted mt-2 text-xs">
            The production scanner should automatically focus this field.
          </p>
        </Card>
        <Card>
          {file ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-accent">{file.rfId}</p>
                  <h2 className="mt-2 text-lg font-semibold">{file.subject}</h2>
                </div>
                <Badge tone="warning">Issued</Badge>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-[var(--rr-bg)] p-4">
                  <div className="flex items-center gap-2 text-accent">
                    <MapPin size={17} />
                    <span className="text-xs font-bold">Suggested destination</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{file.location}</p>
                  <p className="muted mt-1 text-xs">Scan shelf {file.shelf} to confirm.</p>
                </div>
                <div className="rounded-xl bg-[var(--rr-bg)] p-4">
                  <p className="muted text-[10px] uppercase tracking-wider">Room</p>
                  <p className="mt-1 text-sm font-semibold">{room.name}</p>
                  <p className="muted mt-1 text-xs">
                    {room.building} · {room.floor}
                  </p>
                </div>
              </div>
              <Button
                className="mt-5 w-full"
                icon={<CheckCircle size={17} />}
                onClick={() => setComplete(true)}
              >
                {complete ? 'Return confirmed' : `Confirm ${file.shelf} scanned`}
              </Button>
              {complete && (
                <div className="mt-4 rounded-xl bg-[color-mix(in_srgb,var(--rr-success)_10%,transparent)] p-4 text-sm text-[var(--rr-success)]">
                  Return completed. Production will record shelf scan, location verification and
                  custody close-out as a transaction.
                </div>
              )}
            </>
          ) : (
            <p className="muted">No file matched.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
