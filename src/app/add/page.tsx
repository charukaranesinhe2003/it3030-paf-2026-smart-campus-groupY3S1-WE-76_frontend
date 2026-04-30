"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ResourceForm from "../../components/ResourceForm";
import { createResource } from "../../services/resourceService";
import ProtectedRoute from "../../components/ProtectedRoute";
import ToastContainer, { useToast } from "../../components/ToastContainer";

export default function AddResourcePage() {
  return (
    <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
      <ToastContainer>
        <AddResourceContent />
      </ToastContainer>
    </ProtectedRoute>
  );
}

function AddResourceContent() {
  const router = useRouter();
  const { showToast } = useToast();

  const initialData = {
    name: "", type: "", capacity: "", location: "",
    availabilityStart: "", availabilityEnd: "", status: "ACTIVE",
  };

  const handleCreate = async (data: {
    name: string; type: string; capacity: string | number;
    location: string; availabilityStart: string; availabilityEnd: string; status: string;
  }) => {
    try {
      await createResource({ ...data, capacity: Number(data.capacity), status: data.status as "ACTIVE" | "OUT_OF_SERVICE" });
      showToast("Resource added successfully", "success");
      router.push("/");
    } catch {
      showToast("Failed to add resource", "error");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Add Resource</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new facility or asset record
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-gray-600 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
          >
            Back
          </Link>
        </div>

        <ResourceForm initialData={initialData} onSubmit={handleCreate} submitLabel="Save Resource" />
      </div>
    </main>
  );
}