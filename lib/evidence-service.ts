import { deleteObject, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { EvidenceDraft, NormalizedEvidenceSet, Task, TaskEvidence } from '@/src/types';

const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function validateEvidenceDraft(draft: EvidenceDraft): void {
  if (!draft.mimeType.startsWith('image/')) {
    throw new Error(`Invalid file type "${draft.mimeType}". Only images are allowed.`);
  }
  if (draft.fileSize > MAX_EVIDENCE_FILE_SIZE) {
    const mb = (draft.fileSize / (1024 * 1024)).toFixed(1);
    throw new Error(`File "${draft.fileName}" is ${mb} MB. Maximum allowed size is 10 MB.`);
  }
}

function fetchLocalBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Failed to fetch local image'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export async function uploadTaskEvidence(
  familyId: string,
  taskId: string,
  childId: string,
  draft: EvidenceDraft,
): Promise<TaskEvidence> {
  validateEvidenceDraft(draft);
  // Unique path per upload: timestamp + sanitized filename prevent new drafts
  // from overwriting previously preserved evidence before Firestore confirms.
  const safeFileName = draft.fileName.replace(/[/\\?%*:|"<>\s]+/g, '_');
  const storagePath = `families/${familyId}/tasks/${taskId}/evidence/${childId}/${Date.now()}_${safeFileName}`;
  const storageRef = ref(storage, storagePath);

  const blob = await fetchLocalBlob(draft.localUri);
  try {
    await uploadBytes(storageRef, blob, { contentType: draft.mimeType });
  } finally {
    if (typeof (blob as Blob & { close?: () => void }).close === 'function') {
      (blob as Blob & { close?: () => void }).close!();
    }
  }
  const downloadUrl = await getDownloadURL(storageRef);

  return {
    downloadUrl,
    storagePath,
    fileName: safeFileName,
    mimeType: draft.mimeType,
    fileSize: draft.fileSize,
    uploadedAt: new Date(),
  };
}

export async function deleteTaskEvidence(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}

/**
 * Generates a dependency-free asset ID suitable for v2 storage paths.
 * Uses timestamp + random base-36 suffix — no external library required.
 */
function generateAssetId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Uploads a single evidence asset to the v2 storage path:
 * `families/{familyId}/tasks/{taskId}/evidence/{childId}/{before|after}/{assetId}_{fileName}`
 */
export async function uploadTaskEvidenceV2(
  familyId: string,
  taskId: string,
  childId: string,
  bucket: 'before' | 'after',
  draft: EvidenceDraft,
): Promise<TaskEvidence> {
  validateEvidenceDraft(draft);
  const safeFileName = draft.fileName.replace(/[/\\?%*:|"<>\s]+/g, '_');
  const assetId = generateAssetId();
  const storagePath = `families/${familyId}/tasks/${taskId}/evidence/${childId}/${bucket}/${assetId}_${safeFileName}`;
  const storageRef = ref(storage, storagePath);

  const blob = await fetchLocalBlob(draft.localUri);
  try {
    await uploadBytes(storageRef, blob, { contentType: draft.mimeType });
  } finally {
    if (typeof (blob as Blob & { close?: () => void }).close === 'function') {
      (blob as Blob & { close?: () => void }).close!();
    }
  }
  const downloadUrl = await getDownloadURL(storageRef);

  return {
    downloadUrl,
    storagePath,
    fileName: safeFileName,
    mimeType: draft.mimeType,
    fileSize: draft.fileSize,
    uploadedAt: new Date(),
  };
}

/**
 * Deletes multiple evidence assets from Storage in parallel.
 * Collects all errors and throws a combined error if any deletions fail.
 */
export async function deleteEvidenceAssets(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const errors: Error[] = [];
  await Promise.all(
    paths.map((path) =>
      deleteObject(ref(storage, path)).catch((e) => {
        errors.push(e instanceof Error ? e : new Error(String(e)));
      }),
    ),
  );
  if (errors.length > 0) {
    throw new Error(
      `Failed to delete ${errors.length} evidence asset(s): ${errors.map((e) => e.message).join('; ')}`,
    );
  }
}

/**
 * Pure read-time normalization. Returns a consistent `{ before, after }` shape
 * regardless of whether the task carries legacy `evidence`, v2 `evidenceSet`, both, or neither.
 *
 * Rules:
 * - Both present       → prefer `evidenceSet`; ignore `evidence`
 * - Only `evidenceSet` → use directly
 * - Only `evidence`    → treat as after-only (before=[])
 * - Neither            → returns undefined
 *
 * Never writes to Firestore; no side effects.
 */
export function normalizeEvidenceSet(task: Task): NormalizedEvidenceSet | undefined {
  if (task.evidenceSet) {
    return { before: task.evidenceSet.before, after: task.evidenceSet.after };
  }
  if (task.evidence) {
    return { before: [], after: [task.evidence] };
  }
  return undefined;
}
