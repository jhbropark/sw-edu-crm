"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import LeadFormModal from "./LeadFormModal";
import { filterLeads } from "@/lib/lead-filter";

export type Lead = {
  id: string; name: string; phone: string | null; email: string | null;
  source: string | null; interest: string | null; stage: string; nextActionAt: string | null; createdAt?: string;
};

const STAGES = [
  { key: "NEW", label: "신규 문의" },
  { key: "CONTACTED", label: "1차 연락" },
  { key: "CONSULTING", label: "상담중" },
  { key: "PROPOSAL", label: "제안/견적" },
  { key: "WON", label: "결제 전환" },
] as const;

function Card({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef} {...listeners} {...attributes}
      className={`cursor-grab rounded border bg-white p-3 text-sm shadow-sm active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{lead.name}</span>
        <Link href={`/leads/${lead.id}`} onPointerDown={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 hover:underline">상세</Link>
      </div>
      <div className="text-gray-500">{lead.interest ?? "-"} · {lead.source ?? "-"}</div>
      {lead.nextActionAt && (
        <div className="mt-1 text-xs text-orange-600">
          다음 연락: {new Date(lead.nextActionAt).toLocaleDateString("ko-KR")}
        </div>
      )}
    </div>
  );
}

function Column({ stageKey, label, leads }: { stageKey: string; label: string; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div ref={setNodeRef} className={`w-64 shrink-0 rounded-lg p-2 transition-colors md:w-auto ${isOver ? "bg-blue-50" : "bg-gray-100"}`}>
      <div className="mb-2 px-1 text-sm font-semibold">
        {label} <span className="text-gray-400">({leads.length})</span>
      </div>
      <div className="flex min-h-[60px] flex-col gap-2">
        {leads.map((l) => <Card key={l.id} lead={l} />)}
      </div>
    </div>
  );
}

export default function LeadBoard({ initialLeads, isOwner = false }: { initialLeads: Lead[]; isOwner?: boolean }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState<"recent" | "oldest" | "name" | "due">("recent");

  const sources = Array.from(new Set(leads.map((l) => l.source).filter(Boolean))) as string[];
  const visible = filterLeads(leads, { q, source, sort });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const active = leads.find((l) => l.id === activeId) ?? null;
  const byStageList = (s: string) => visible.filter((l) => l.stage === s);

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const newStage = e.over?.id ? String(e.over.id) : null;
    const lead = leads.find((l) => l.id === id);
    if (!lead || !newStage || lead.stage === newStage) return;

    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage: newStage } : l))); // 낙관적 업데이트
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLeads(prev); // 실패 시 롤백
      alert("단계 변경에 실패했습니다.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">리드·영업 파이프라인</h1>
        <div className="flex items-center gap-2">
          <a href="/leads/duplicates" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">중복 정리</a>
          {isOwner && <a href="/api/export/leads" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">CSV 내보내기</a>}
          <button onClick={() => setOpen(true)} className="rounded bg-black px-3 py-2 text-sm text-white">+ 리드 추가</button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·전화·이메일·관심 검색"
          aria-label="리드 검색" className="min-w-[180px] flex-1 rounded border px-3 py-2 text-sm" />
        <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="유입경로 필터"
          className="rounded border px-3 py-2 text-sm">
          <option value="">전체 유입경로</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="정렬"
          className="rounded border px-3 py-2 text-sm">
          <option value="recent">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="name">이름순</option>
          <option value="due">다음연락일순</option>
        </select>
        <span className="text-xs text-gray-400">{visible.length} / {leads.length}건</span>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible">
          {STAGES.map((st) => (
            <Column key={st.key} stageKey={st.key} label={st.label}
              leads={byStageList(st.key)} />
          ))}
        </div>
        <DragOverlay>{active ? <Card lead={active} /> : null}</DragOverlay>
      </DndContext>

      {open && (
        <LeadFormModal
          onClose={() => setOpen(false)}
          onCreated={(lead) => { setLeads((ls) => [lead, ...ls]); setOpen(false); }}
        />
      )}
    </div>
  );
}
