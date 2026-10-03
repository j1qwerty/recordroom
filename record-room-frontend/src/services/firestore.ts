import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

export interface InquiryPayload {
  name: string;
  email: string;
  department: string;
  message: string;
}

export async function saveInquiry(payload: InquiryPayload) {
  if (!firestore) {
    return { mode: 'demo' as const };
  }
  await addDoc(collection(firestore, 'inquiries'), {
    ...payload,
    createdAt: serverTimestamp(),
    source: 'record-room-frontend',
  });
  return { mode: 'firestore' as const };
}

export async function saveMediaLink(payload: { title: string; url: string; alt: string }) {
  if (!firestore) {
    return { mode: 'demo' as const };
  }
  await addDoc(collection(firestore, 'mediaAssets'), {
    ...payload,
    createdAt: serverTimestamp(),
    source: 'record-room-frontend',
  });
  return { mode: 'firestore' as const };
}
