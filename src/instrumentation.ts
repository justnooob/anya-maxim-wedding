export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startOutboxWorker } = await import("./server/telegram/outbox.mjs");
    startOutboxWorker();
  }
}
