import { deleteObject, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { EvidenceDraft, TaskEvidence } from '@/src/types';

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
