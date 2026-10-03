import { CheckCircle, Image, LinkSimple, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { saveMediaLink } from '../services/firestore';
import { firebaseReady } from '../lib/firebase';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function MediaPage() {
  const [url, setUrl] = useState(
    'https://images.unsplash.com/photo-1555488205-d5e67846c94b?auto=format&fit=crop&w=1200&q=80',
  );
  const [title, setTitle] = useState('Record room reference');
  const [alt, setAlt] = useState('Record room shelves');
  const [valid, setValid] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const validateImage = () =>
    new Promise<boolean>((resolve) => {
      const image = new window.Image();
      image.onload = () => {
        setValid(true);
        setError('');
        resolve(true);
      };
      image.onerror = () => {
        setValid(false);
        setError('The URL did not return a loadable image.');
        resolve(false);
      };
      image.src = url;
    });
  const save = async () => {
    if (!(await validateImage())) return;
    await saveMediaLink({ title, url, alt });
    setSaved(true);
  };
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Content"
        title="Media & external image links"
        description="Frontend-only media flow. Paste an external image URL, preview it, and only save the link to Firestore after the browser proves the image loads."
      />
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <div className="flex items-center gap-2">
            <LinkSimple className="text-accent" size={20} />
            <p className="text-sm font-semibold">Add image by URL</p>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="muted text-xs font-semibold">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="focus-ring mt-2 h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="muted text-xs font-semibold">External image URL</span>
              <input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setValid(false);
                  setSaved(false);
                }}
                className="focus-ring mt-2 h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 text-xs outline-none"
              />
            </label>
            <label className="block">
              <span className="muted text-xs font-semibold">Alt text</span>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="focus-ring mt-2 h-11 w-full rounded-xl border border-base bg-[var(--rr-bg)] px-3 text-sm outline-none"
              />
            </label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => void validateImage()}
                icon={<CheckCircle size={16} />}
              >
                Validate preview
              </Button>
              <Button
                disabled={!valid}
                onClick={() => void save()}
                icon={<UploadSimple size={16} />}
              >
                Save link
              </Button>
            </div>
            {error && (
              <div className="flex gap-2 rounded-xl bg-[color-mix(in_srgb,var(--rr-danger)_9%,transparent)] p-3 text-xs text-[var(--rr-danger)]">
                <WarningCircle size={16} /> {error}
              </div>
            )}
            {saved && (
              <div className="rounded-xl bg-[color-mix(in_srgb,var(--rr-success)_10%,transparent)] p-3 text-xs text-[var(--rr-success)]">
                Saved to {firebaseReady ? 'Firestore' : 'demo mode'}. No image bytes are uploaded by
                this frontend.
              </div>
            )}
          </div>
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="text-accent" />
              <p className="text-sm font-semibold">Preview</p>
            </div>
            <Badge tone={valid ? 'success' : 'neutral'}>
              {valid ? 'Load verified' : 'Not verified'}
            </Badge>
          </div>
          <div className="overflow-hidden rounded-xl border border-base bg-[var(--rr-bg)]">
            <img
              src={url}
              alt={alt}
              onLoad={() => setValid(true)}
              onError={() => setValid(false)}
              className="max-h-[480px] min-h-56 w-full object-cover"
            />
          </div>
          <p className="muted mt-3 text-xs leading-6">
            When production storage is required, keep the same content model and replace the link
            writer with a signed upload endpoint or approved object-storage adapter. Do not put
            service account credentials in the browser.
          </p>
        </Card>
      </div>
    </div>
  );
}
