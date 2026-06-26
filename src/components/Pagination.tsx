import Link from "next/link";

export default function Pagination({ base, page, hasNext }: { base: string; page: number; hasNext: boolean }) {
  const prev = page > 1 ? page - 1 : null;
  const next = hasNext ? page + 1 : null;
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="페이지 이동">
      {prev ? <Link href={`${base}?page=${prev}`} className="rounded border px-3 py-1.5 hover:bg-gray-50">← 이전</Link>
            : <span className="rounded border px-3 py-1.5 text-gray-300">← 이전</span>}
      <span className="text-gray-500">{page} 페이지</span>
      {next ? <Link href={`${base}?page=${next}`} className="rounded border px-3 py-1.5 hover:bg-gray-50">다음 →</Link>
            : <span className="rounded border px-3 py-1.5 text-gray-300">다음 →</span>}
    </nav>
  );
}
