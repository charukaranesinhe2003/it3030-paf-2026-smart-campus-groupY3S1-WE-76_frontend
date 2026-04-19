import Link from "next/link";

type Resource = {
  id: number;
  name: string;
  type: string;
  capacity: number;
  location: string;
  availabilityStart: string;
  availabilityEnd: string;
  status: string;
};

type Props = {
  resources: Resource[];
  onDelete: (id: number) => void;
};

export default function ResourceTable({ resources, onDelete }: Props) {
  if (resources.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
        <p className="text-4xl mb-3">🏛️</p>
        <h3 className="text-base font-semibold text-gray-700 mb-1">No resources found</h3>
        <p className="text-sm text-gray-400">Try adjusting your search filters or add a new resource.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm text-left" role="table" aria-label="Campus resources">
        <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Name</th>
            <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Type</th>
            <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Capacity</th>
            <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Location</th>
            <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Avail. Start</th>
            <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Avail. End</th>
            <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
            <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {resources.map((resource) => (
            <tr key={resource.id} className="hover:bg-gray-50 transition">
              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{resource.name}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{resource.type}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{resource.capacity}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{resource.location}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{resource.availabilityStart || "—"}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{resource.availabilityEnd || "—"}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    resource.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {resource.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/details/${resource.id}`}
                    aria-label={`View details for ${resource.name}`}
                    className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-600"
                  >
                    View
                  </Link>
                  <Link
                    href={`/edit/${resource.id}`}
                    aria-label={`Edit ${resource.name}`}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(resource.id)}
                    aria-label={`Delete ${resource.name}`}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
