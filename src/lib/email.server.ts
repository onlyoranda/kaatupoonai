// Server-only helper for sending transactional email via Resend
// (https://resend.com). Requires the RESEND_API_KEY secret; optionally
// RESEND_FROM_EMAIL (a sender identity verified in Resend) and APP_URL
// (the site's public URL, used to build the link in the email).
//
// If RESEND_API_KEY isn't set, emails are skipped with a console warning
// rather than failing the story pipeline — notification is a nice-to-have,
// not something that should block a finished story.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${params.subject}" to ${params.to}`);
    return;
  }
  const from = process.env["RESEND_FROM_EMAIL"] ?? "Cartoon Story Maker <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: params.to, subject: params.subject, html: params.html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[email] Resend rejected "${params.subject}" to ${params.to}: ${res.status} ${body}`,
      );
    }
  } catch (err) {
    console.error(`[email] Failed to send "${params.subject}" to ${params.to}:`, err);
  }
}

export async function sendStoryReadyEmail(
  to: string,
  title: string,
  storyId: string,
): Promise<void> {
  const appUrl = (process.env["APP_URL"] ?? "https://kaatupoonai.lovable.app").replace(/\/$/, "");
  const link = `${appUrl}/story/${storyId}`;

  await sendEmail({
    to,
    subject: `"${title}" is ready to watch! 🎬`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 20px; margin-bottom: 8px;">Your story is ready!</h1>
        <p style="font-size: 15px; color: #444;">
          "<strong>${escapeHtml(title)}</strong>" has finished being drawn and narrated. It's
          waiting for you whenever you're ready to watch.
        </p>
        <p style="margin-top: 20px;">
          <a href="${link}"
             style="display:inline-block;padding:10px 22px;background:#7c3aed;color:#fff;
                    border-radius:999px;text-decoration:none;font-weight:600;">
            Watch it now
          </a>
        </p>
      </div>
    `,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
