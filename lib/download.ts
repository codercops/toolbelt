// Trigger a browser download for in-memory data. Shared by every tool so the
// object-URL lifecycle (create, click, revoke) lives in exactly one place.
export function downloadBlob(
  data: BlobPart,
  filename: string,
  mime = "application/octet-stream"
): void {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
