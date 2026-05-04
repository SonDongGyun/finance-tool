// Mirrors api/decrypt.py's MAX_FILE_SIZE_BYTES so client-side validation
// rejects oversized uploads before we read them into memory.
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const ACCEPTED_UPLOAD_EXTS = ['xlsx', 'xls', 'csv'];
