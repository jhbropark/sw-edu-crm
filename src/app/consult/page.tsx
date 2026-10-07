import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오프라인 강의 수강 상담 신청 | VARIS",
  description: "VARIS 오프라인 강의에 관심 있으신 분은 상담을 신청해 주세요. 순차적으로 안내 연락을 드립니다.",
  openGraph: {
    title: "오프라인 강의 수강 상담 신청 | VARIS",
    description: "VARIS 오프라인 강의에 관심 있으신 분은 상담을 신청해 주세요.",
    url: "https://varis.kr/consult",
  },
};

export default function ConsultPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <header
        style={{
          width: "100%",
          maxWidth: 720,
          padding: "32px 16px 0",
          textAlign: "center",
        }}
      >
        <a
          href="https://varis.kr"
          style={{
            color: "#fff",
            textDecoration: "none",
            fontSize: 13,
            letterSpacing: "0.12em",
            opacity: 0.6,
          }}
        >
          VARIS IMMERSIVE MEDIA ART ACADEMY
        </a>
        <h1
          style={{
            color: "#fff",
            fontSize: 28,
            fontWeight: 700,
            margin: "16px 0 8px",
            lineHeight: 1.3,
          }}
        >
          오프라인 강의 수강 상담 신청
        </h1>
        <p
          style={{
            color: "#8a8a8a",
            fontSize: 15,
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          오프라인 강의에 관심 있으신 분은 아래 내용을 작성해 주세요.
          <br />
          신청해 주신 분께 순차적으로 상담 안내 연락을 드립니다.
        </p>
      </header>

      <div
        style={{
          width: "100%",
          maxWidth: 720,
          flex: 1,
          padding: "0 16px 40px",
        }}
      >
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSc7qAEw5nYXqlT4r2VTKZ2k2oeZr9Fyd5Y7oGci7AqNYGj0EQ/viewform?embedded=true"
          width="100%"
          height="900"
          style={{
            border: "none",
            borderRadius: 8,
            background: "#0d0d0d",
          }}
          title="오프라인 강의 수강 상담 신청"
        />
      </div>

      <footer
        style={{
          width: "100%",
          maxWidth: 720,
          padding: "24px 16px",
          textAlign: "center",
          borderTop: "1px solid #262626",
        }}
      >
        <p style={{ color: "#8a8a8a", fontSize: 12 }}>
          &copy; 2026 VARIS(배리즈 원격학원). All rights reserved.
        </p>
        <a
          href="https://varis.kr"
          style={{ color: "#ff6400", fontSize: 12, textDecoration: "none" }}
        >
          varis.kr
        </a>
      </footer>
    </div>
  );
}
