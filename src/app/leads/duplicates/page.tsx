import DuplicateManager from "@/components/DuplicateManager";

export const dynamic = "force-dynamic";

export default function DuplicatesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-bold">리드 중복 정리</h1>
      <DuplicateManager />
    </div>
  );
}
