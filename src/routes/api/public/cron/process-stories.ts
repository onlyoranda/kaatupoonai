// Publicly reachable cron endpoint. The /api/public/ prefix bypasses the
// published-site auth wall, so the scheduler can actually reach it; the
// handler itself still requires the cron bearer secret.
import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { processStoriesSweep } from "@/lib/story-cron";

export const Route = createFileRoute("/api/public/cron/process-stories")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        return processStoriesSweep();
      },
    },
  },
});
