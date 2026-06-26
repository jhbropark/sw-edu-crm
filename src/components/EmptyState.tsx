import Link from "next/link";

type Action = { href: string; label: string };

export default function EmptyState({
  title, description, action, secondary,
}: { title: string; description: string; action?: Action; secondary?: Action }) {
  return (
    <div className="rounded-lg border border-dashed bg-white p-10 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
      {(action || secondary) && (
        <div className="mt-4 flex justify-center gap-2">
          {action && <Link href={action.href} className="rounded bg-black px-4 py-2 text-sm text-white">{action.label}</Link>}
          {secondary && <Link href={secondary.href} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">{secondary.label}</Link>}
        </div>
      )}
    </div>
  );
}
