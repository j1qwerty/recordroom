import { useState } from 'react';
import {
  CheckCircle,
  Image,
  LinkSimple,
  Trash,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Field, FormGrid, TextInput } from '../components/ui/Field';
import { Flash } from '../components/ui/Flash';
import { EmptyState } from '../components/ui/EmptyState';
import { useQuery, useService } from '../hooks/useService';
import type { MediaLinkRecord } from '../services/impl/inquiries';

const EMPTY_LINKS: MediaLinkRecord[] = [];

/**
 * Media and external image links.
 *
 * The browser must prove an image loads before the link may be stored: the URL
 * is checked with `Image.onload` and only http(s) URLs are accepted, so a
 * broken or hostile URL is rejected before it is ever persisted.
 */
export function MediaPage() {
  const service = useService();

  const [url, setUrl] = useState(
    'https://images.unsplash.com/photo-1555488205-d5e67846c94b?auto=format&fit=crop&w=1200&q=80',
  );
  const [title, setTitle] = useState('Record room reference');
  const [alt, setAlt] = useState('Record room shelves');
  const [valid, setValid] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  // The stored links come from the service, so a save or remove has to ask again
  // rather than relying on the local snapshot publishing a new array.
  const { data: links, loading, reload } = useQuery(() => service.media.list(), [], EMPTY_LINKS);

  const validateImage = () =>
    new Promise<boolean>((resolve) => {
      const image = new window.Image();
      image.onload = () => {
        setValid(true);
        setFlash(null);
        resolve(true);
      };
      image.onerror = () => {
        setValid(false);
        setFlash({ tone: 'danger', text: 'The URL did not return a loadable image.' });
        resolve(false);
      };
      image.src = url;
    });

  const save = async () => {
    if (!(await validateImage())) return;
    const result = await service.media.saveLink({ title, url, alt });
    setFlash(
      result.ok
        ? {
            tone: 'success',
            text: `Saved "${result.value.title}". No image bytes are uploaded by this frontend.`,
          }
        : { tone: 'danger', text: result.error },
    );
    if (result.ok) reload();
  };

  const remove = async (id: string) => {
    const result = await service.media.remove(id);
    setFlash(
      result.ok
        ? { tone: 'success', text: 'Link removed.' }
        : { tone: 'danger', text: result.error },
    );
    if (result.ok) reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Content"
        title="Media & external image links"
        description="Paste an external image URL, prove the browser can load it, and only then store the link locally."
      />

      {flash && <Flash tone={flash.tone} text={flash.text} onDismiss={() => setFlash(null)} />}

      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2">
              <LinkSimple className="text-accent" size={20} />
              <p className="text-sm font-semibold">Add image by URL</p>
            </div>
            <div className="mt-5 space-y-4">
              <Field label="Title" htmlFor="media-title" required>
                <TextInput
                  id="media-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Field>
              <Field
                label="External image URL"
                htmlFor="media-url"
                required
                hint="http(s) only. The URL is not trusted until the preview loads."
              >
                <TextInput
                  id="media-url"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);
                    setValid(false);
                    setFlash(null);
                  }}
                  className="text-xs"
                />
              </Field>
              <Field label="Alt text" htmlFor="media-alt" required>
                <TextInput
                  id="media-alt"
                  value={alt}
                  onChange={(event) => setAlt(event.target.value)}
                />
              </Field>
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
              {!valid && (
                <p className="muted flex items-center gap-1.5 text-[11px]">
                  <WarningCircle size={13} /> Saving stays disabled until the preview loads.
                </p>
              )}
            </div>
          </Card>

          <Card padding={false} className="overflow-hidden">
            <div className="border-b border-base p-5">
              <p className="text-sm font-semibold">Stored links</p>
              <p className="muted mt-1 text-xs">Local snapshot only.</p>
            </div>
            {links.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title={loading ? 'Loading links' : 'No media links'}
                  description={
                    loading
                      ? 'Asking the media service for the stored links.'
                      : 'Validate an image and save its URL.'
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-[var(--rr-border)]">
                {links.map((link) => (
                  <li key={link.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{link.title}</p>
                        <p className="muted mt-1 truncate font-mono text-[11px]">{link.url}</p>
                        <p className="muted mt-1 text-[11px]">
                          {link.alt} · {link.createdAt}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void remove(link.id)}
                        className="focus-ring rounded-lg p-1.5 text-[var(--rr-danger)] hover:bg-[var(--rr-surface-2)]"
                        aria-label={`Remove ${link.title}`}
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

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
          <FormGrid columns={1}>
            <div className="mt-4 rounded-xl bg-accent-soft p-4">
              <p className="text-xs font-semibold">When production storage is required</p>
              <p className="muted mt-1 text-[11px] leading-5">
                Keep this content model and replace the local writer with a signed upload endpoint
                on
                <span className="font-mono">dotnet-api/</span>. Never put service-account
                credentials in the browser.
              </p>
            </div>
          </FormGrid>
        </Card>
      </div>
    </div>
  );
}
