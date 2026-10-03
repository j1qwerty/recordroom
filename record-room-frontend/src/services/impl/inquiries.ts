/**
 * Local-only inquiry and media-link storage.
 *
 * These two collections used to be written to Firestore from the browser.
 * Firebase is not part of this project (`AGENTS.md`), so they now live in the
 * local snapshot exactly like the rest of the demo data, behind the same
 * service seam. When `dotnet-api/` provides `/api/inquiries` and
 * `/api/media-assets`, this file becomes the HTTP adapter and the pages stay
 * unchanged.
 *
 * Note: no admin panel for inquiry data is added here Ã¢â‚¬â€ `AGENTS.md` requires
 * asking before introducing one.
 */

import { err, ok } from '../contracts';
import { newId, store, timestamp } from '../store';
import { session } from './session';
import { log } from './audit';

export interface InquiryPayload {
  name: string;
  email: string;
  department: string;
  message: string;
}

export interface InquiryRecord extends InquiryPayload {
  id: string;
  createdAt: string;
  source: string;
}

export interface MediaLinkPayload {
  title: string;
  url: string;
  alt: string;
}

export interface MediaLinkRecord extends MediaLinkPayload {
  id: string;
  createdAt: string;
  source: string;
}

/** Only http(s) links are accepted; anything else is refused before storage. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const inquiriesService = {
  async save(payload: InquiryPayload) {
    if (!payload.name.trim()) return err('Name is required.', 'name');
    if (!payload.email.trim() || !payload.email.includes('@')) {
      return err('Enter a valid email address.', 'email');
    }
    if (payload.message.trim().length < 10) {
      return err('Add a little more detail to the message.', 'message');
    }

    const record: InquiryRecord = {
      id: newId('inq'),
      name: payload.name.trim(),
      email: payload.email.trim(),
      department: payload.department.trim(),
      message: payload.message.trim(),
      createdAt: timestamp(),
      source: 'record-room-frontend',
    };

    store.update((draft) => {
      draft.inquiries.unshift(record);
      log(draft, {
        action: 'Create',
        entity: 'Inquiry',
        entityId: record.id,
        before: 'Ã¢â‚¬â€',
        after: `${record.department || 'unassigned'}`,
        summary: `Inquiry submitted by ${record.name}`,
      });
    });
    return ok(record);
  },

  async list(): Promise<InquiryRecord[]> {
    return store.getState().inquiries;
  },

  async remove(id: string) {
    const record = store.getState().inquiries.find((item) => item.id === id);
    if (!record) return err('Inquiry not found.', 'id');
    store.update((draft) => {
      draft.inquiries = draft.inquiries.filter((item) => item.id !== id);
      log(draft, {
        action: 'Delete',
        entity: 'Inquiry',
        entityId: id,
        before: record.email,
        after: 'deleted',
        summary: `Inquiry from ${record.name} removed`,
      });
    });
    return ok(true as const);
  },

  async submittedBy(): Promise<string> {
    return session.userName();
  },
};

export const mediaService = {
  async saveLink(payload: MediaLinkPayload) {
    if (!payload.title.trim()) return err('Title is required.', 'title');
    if (!payload.alt.trim()) return err('Alt text is required.', 'alt');
    if (!isSafeHttpUrl(payload.url)) {
      return err('Only http(s) image URLs are accepted.', 'url');
    }

    const record: MediaLinkRecord = {
      id: newId('media'),
      title: payload.title.trim(),
      url: payload.url.trim(),
      alt: payload.alt.trim(),
      createdAt: timestamp(),
      source: 'record-room-frontend',
    };

    store.update((draft) => {
      draft.mediaLinks.unshift(record);
      log(draft, {
        action: 'Create',
        entity: 'MediaLink',
        entityId: record.id,
        before: 'Ã¢â‚¬â€',
        after: record.url,
        summary: `Media link "${record.title}" stored`,
      });
    });
    return ok(record);
  },

  async list(): Promise<MediaLinkRecord[]> {
    return store.getState().mediaLinks;
  },

  async remove(id: string) {
    const record = store.getState().mediaLinks.find((item) => item.id === id);
    if (!record) return err('Media link not found.', 'id');
    store.update((draft) => {
      draft.mediaLinks = draft.mediaLinks.filter((item) => item.id !== id);
      log(draft, {
        action: 'Delete',
        entity: 'MediaLink',
        entityId: id,
        before: record.url,
        after: 'deleted',
        summary: `Media link "${record.title}" removed`,
      });
    });
    return ok(true as const);
  },
};
