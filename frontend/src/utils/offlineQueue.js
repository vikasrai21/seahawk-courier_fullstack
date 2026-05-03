import { del, get, set } from 'idb-keyval';

export async function loadQueue(key) {
  // CHANGE: hydrate offline queue from IndexedDB
  const items = await get(key);
  return Array.isArray(items) ? items : [];
}

export async function saveQueue(key, items) {
  // CHANGE: persist offline queue without synchronous localStorage blocking
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    await del(key);
    return [];
  }
  await set(key, safeItems);
  return safeItems;
}

export async function clearQueue(key) {
  // CHANGE: clear offline queue from IndexedDB
  await del(key);
}
