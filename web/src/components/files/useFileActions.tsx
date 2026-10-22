import { useCallback, useState, type ReactNode } from 'react';
import {
  MoveFileModal,
  UploadFileModal,
  UploadMapModal,
  ViewFileModal,
  ViewMapModal,
  type ActionContext,
  type FileActionKind,
} from './FileActionModals';
import { useSession } from '../../hooks/useService';
import type { RecordFile } from '../../types';

/**
 * One place that owns the "act on a file" dialogs, so the files table, the
 * dashboard and any future list share the same view / upload / move / map flows.
 */
export function useFileActions(onChanged: (message: string) => void): {
  open: (kind: FileActionKind, file: RecordFile) => void;
  dialogs: ReactNode;
} {
  const { allowed } = useSession();
  const [active, setActive] = useState<{ kind: FileActionKind; file: RecordFile } | null>(null);

  const open = useCallback(
    (kind: FileActionKind, file: RecordFile) => setActive({ kind, file }),
    [],
  );

  let dialogs: ReactNode = null;
  if (active) {
    const context: ActionContext = {
      file: active.file,
      onClose: () => setActive(null),
      onDone: (message) => {
        setActive(null);
        onChanged(message);
      },
      switchTo: (kind) => setActive({ kind, file: active.file }),
      canEdit: allowed('files.edit'),
      canUploadMap: allowed('files.edit') || allowed('digitization.upload'),
    };
    const Dialog = {
      view: ViewFileModal,
      upload: UploadFileModal,
      move: MoveFileModal,
      mapView: ViewMapModal,
      mapUpload: UploadMapModal,
    }[active.kind];
    // Keyed so switching between dialogs resets each one's local state.
    dialogs = <Dialog key={active.kind} {...context} />;
  }

  return { open, dialogs };
}
