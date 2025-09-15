import { startPollingScheduler } from "@/lib/pollingScheduler";

let started = false;

export async function GET() {
  if (!started) {
    startPollingScheduler();
    started = true;
    console.log("Polling scheduler started");
  }

  return new Response(JSON.stringify({ message: "Scheduler running" }), {
    headers: { "Content-Type": "application/json" },
  });
}
