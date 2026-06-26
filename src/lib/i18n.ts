// 경량 다국어 사전. 라우팅 없이 locale 파라미터/쿠키로 선택.
export type Locale = "ko" | "en";
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALES: Locale[] = ["ko", "en"];

const dict = {
  ko: {
    "apply.title": "수업 문의/신청",
    "apply.subtitle": "온라인·오프라인 SW 교육 상담을 신청하세요.",
    "apply.name": "이름",
    "apply.phone": "연락처",
    "apply.email": "이메일",
    "apply.interest": "관심 과정",
    "apply.message": "문의 내용",
    "apply.consent": "개인정보 수집·이용에 동의합니다. (수집항목: 이름·연락처·이메일 / 목적: 상담 및 안내 / 보유: 1년)",
    "apply.submit": "신청하기",
    "apply.submitting": "전송 중…",
    "apply.done.title": "신청이 접수되었습니다",
    "apply.done.desc": "곧 안내 연락을 드리겠습니다. 감사합니다.",
    "apply.err.required": "이름과 연락처를 입력하세요.",
    "apply.err.consent": "개인정보 수집·이용 동의가 필요합니다.",
    "login.title": "SW 교육 CRM 로그인",
    "login.email": "이메일",
    "login.password": "비밀번호",
    "login.submit": "로그인",
    "login.submitting": "로그인 중…",
    "login.error": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "common.required": "필수",
  },
  en: {
    "apply.title": "Class Inquiry / Apply",
    "apply.subtitle": "Request a consultation for online/offline SW courses.",
    "apply.name": "Name",
    "apply.phone": "Phone",
    "apply.email": "Email",
    "apply.interest": "Interested course",
    "apply.message": "Message",
    "apply.consent": "I agree to the collection and use of personal data (Name, Phone, Email; purpose: consultation; retention: 1 year).",
    "apply.submit": "Apply",
    "apply.submitting": "Submitting…",
    "apply.done.title": "Your request has been received",
    "apply.done.desc": "We will contact you shortly. Thank you.",
    "apply.err.required": "Please enter your name and phone.",
    "apply.err.consent": "Consent to personal data use is required.",
    "login.title": "SW Education CRM Login",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.submitting": "Signing in…",
    "login.error": "Incorrect email or password.",
    "common.required": "required",
  },
} as const;

export type MessageKey = keyof (typeof dict)["ko"];

export function normalizeLocale(input?: string | null): Locale {
  return input && (LOCALES as string[]).includes(input) ? (input as Locale) : DEFAULT_LOCALE;
}

// 클라이언트/서버 공용 번역 함수 팩토리
export function makeT(locale: Locale) {
  const table = dict[locale] ?? dict[DEFAULT_LOCALE];
  return (key: MessageKey) => table[key] ?? key;
}
