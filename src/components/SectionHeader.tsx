interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional right-side content (e.g. a button) */
  action?: React.ReactNode;
}

/**
 * Shared page title + subtitle header card.
 * Replaces the repeated white card with title/subtitle pattern on every page.
 *
 * Usage:
 *   <SectionHeader
 *     title="Facilities & Assets"
 *     subtitle="Manage lecture halls, labs, and equipment"
 *     action={<Link href="/add">Add Resource</Link>}
 *   />
 */
export default function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm border border-gray-200 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
