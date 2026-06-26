// Resend 이메일 발송. API 키는 서버 전용.
const RESEND_API = "https://api.resend.com/emails";

export type EmailResult = { ok: boolean; id?: string; error?: string };

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = opts.from ?? process.env.MAIL_FROM;
  if (!apiKey || !from) return { ok: false, error: "RESEND_API_KEY/MAIL_FROM 미설정" };

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: opts.to, subject: opts.subject,
        ...(opts.html ? { html: opts.html } : {}),
        ...(opts.text ? { text: opts.text } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.message ?? `HTTP ${res.status}` };
    return { ok: true, id: data.id };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

// 간단 HTML 래퍼(브랜드 헤더 + 본문)
export function basicEmailHtml(title: string, bodyHtml: string) {
  return `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 16px;">${title}</h2>
    <div style="font-size:14px;line-height:1.7;color:#333;">${bodyHtml}</div>
    <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
    <p style="font-size:12px;color:#999;">본 메일은 SW 교육 CRM에서 발송되었습니다.</p>
  </div>`;
}
