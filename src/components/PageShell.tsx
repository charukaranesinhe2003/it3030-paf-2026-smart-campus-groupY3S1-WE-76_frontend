import React from "react";

interface PageShellProps {
  children: React.ReactNode;
  /** Optional extra Tailwind classes on the outer wrapper */
  className?: string;
}

/**
 * Shared page wrapper — consistent max-width, padding, and background.
 * Use this instead of repeating `<main className="min-h-screen bg-gray-100 px-4 py-8">` on every page.
 *
 * Usage:
 *   <PageShell>
 *     <SectionHeader title="My Page" subtitle="Description" />
 *     ...content...
 *   </PageShell>
 */
export default function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <main className={`min-h-screen bg-gray-100 px-4 py-8 ${className}`}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </main>
  );
}
