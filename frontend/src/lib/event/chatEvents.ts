// Cross-component pub/sub không cần thư viện
type ReadPayload = { conversationId: number; amount: number };

const EVENT = "chat:read";
const INCOMING = "chat:incoming";

export type IncomingPayload = { conversationId: number };

export function dispatchIncomingUnread(conversationId: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<IncomingPayload>(INCOMING, { detail: { conversationId } }));
}

export function onIncomingUnread(handler: (p: IncomingPayload) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => handler((e as CustomEvent<IncomingPayload>).detail);
  window.addEventListener(INCOMING, h);
  return () => window.removeEventListener(INCOMING, h);
}
export function dispatchRead(conversationId: number, amount: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ReadPayload>(EVENT, { detail: { conversationId, amount } })
  );
}

export function onRead(handler: (p: ReadPayload) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => handler((e as CustomEvent<ReadPayload>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

const THREADS_SYNC = "chat:private-threads-sync";

export function dispatchPrivateThreadsSync() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(THREADS_SYNC));
}

export function onPrivateThreadsSync(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(THREADS_SYNC, handler);
  return () => window.removeEventListener(THREADS_SYNC, handler);
}