import crypto from "crypto";

// SOLAPI 메시지 발송 (알림톡 / 문자).
// 인증: HMAC-SHA256(date + salt, apiSecret). 키는 서버 환경변수에서만 사용.
const SOLAPI_API = "https://api.solapi.com";

function authHeader() {
  const apiKey = process.env.SOLAPI_API_KEY ?? "";
  const apiSecret = process.env.SOLAPI_API_SECRET ?? "";
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export type SendResult = { ok: boolean; messageId?: string; error?: string; raw?: any };

type BaseMessage = { to: string; from?: string };

// 일반 문자(SMS/LMS) — 알림톡 실패 시 대체발송으로도 사용
export async function sendSms(msg: BaseMessage & { text: string }): Promise<SendResult> {
  return postMessage({
    to: msg.to.replace(/-/g, ""),
    from: (msg.from ?? process.env.SOLAPI_SENDER ?? "").replace(/-/g, ""),
    text: msg.text,
  });
}

// 카카오 알림톡 — 사전 승인된 템플릿(templateId) + 변수(variables) 필요
export async function sendAlimtalk(msg: BaseMessage & {
  pfId: string;            // 카카오 채널(발신프로필) ID
  templateId: string;      // 승인된 템플릿 ID
  variables?: Record<string, string>; // #{name} 치환 변수
  fallbackText?: string;   // 실패 시 문자 대체발송 본문
}): Promise<SendResult> {
  return postMessage({
    to: msg.to.replace(/-/g, ""),
    from: (msg.from ?? process.env.SOLAPI_SENDER ?? "").replace(/-/g, ""),
    kakaoOptions: {
      pfId: msg.pfId,
      templateId: msg.templateId,
      variables: msg.variables ?? {},
      ...(msg.fallbackText ? { disableSms: false } : {}),
    },
    ...(msg.fallbackText ? { text: msg.fallbackText } : {}),
  });
}

async function postMessage(message: Record<string, any>): Promise<SendResult> {
  try {
    const res = await fetch(`${SOLAPI_API}/messages/v4/send`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.errorMessage ?? `HTTP ${res.status}`, raw: data };
    return { ok: true, messageId: data.messageId, raw: data };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

// ───────── 도메인 헬퍼: 자주 쓰는 발송 패턴 ─────────

// 신규 리드 자동응답
export async function sendLeadAutoReply(to: string, name: string) {
  return sendAlimtalk({
    to,
    pfId: process.env.KAKAO_PFID ?? "",
    templateId: process.env.KAKAO_TPL_LEAD_REPLY ?? "",
    variables: { "#{name}": name },
    fallbackText: `${name}님, 문의 감사합니다. 곧 연락드리겠습니다.`,
  });
}

// 결제 안내(영수증)
export async function sendReceipt(to: string, name: string, amount: number) {
  return sendAlimtalk({
    to,
    pfId: process.env.KAKAO_PFID ?? "",
    templateId: process.env.KAKAO_TPL_RECEIPT ?? "",
    variables: { "#{name}": name, "#{amount}": amount.toLocaleString() },
    fallbackText: `${name}님, ${amount.toLocaleString()}원 결제가 완료되었습니다. 감사합니다.`,
  });
}
