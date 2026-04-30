"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageShell from "@/components/PageShell";
import SectionHeader from "@/components/SectionHeader";
import ToastContainer, { useToast } from "@/components/ToastContainer";
import { useAuth } from "@/context/AuthContext";
import {
  addComment,
  assignTechnician,
  createTicket,
  deleteComment,
  getTicket,
  IncidentCategory,
  IncidentPriority,
  IncidentStatus,
  IncidentTicketDTO,
  listTickets,
  updateComment,
  updateTicketStatus,
} from "@/services/ticketApi";

const CATEGORY_OPTIONS: Array<{ value: IncidentCategory; label: string }> = [
  { value: "HARDWARE", label: "Hardware" },
  { value: "SOFTWARE", label: "Software" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "SAFETY", label: "Safety" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "NETWORK", label: "Network" },
  { value: "OTHER", label: "Other" },
];

const PRIORITY_OPTIONS: Array<{ value: IncidentPriority; label: string }> = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const STATUS_OPTIONS: Array<{ value: IncidentStatus; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_STYLES: Record<IncidentStatus, string> = {
  OPEN: "bg-sky-100 text-sky-700 border-sky-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

type TicketFormState = {
  category: IncidentCategory;
  description: string;
  priority: IncidentPriority;
  preferredContact: string;
  location: string;
  resourceName: string;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusChip({ status }: { status: IncidentStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function IncidentsPageContent() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<IncidentTicketDTO[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<IncidentTicketDTO | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [ticketForm, setTicketForm] = useState<TicketFormState>({
    category: "HARDWARE",
    description: "",
    priority: "MEDIUM",
    preferredContact: "",
    location: "",
    resourceName: "",
  });
  const [technicianId, setTechnicianId] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [nextStatus, setNextStatus] = useState<IncidentStatus>("IN_PROGRESS");
  const [commentBody, setCommentBody] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [error, setError] = useState("");

  const canManageTickets = user?.roles.some((role) => role === "ROLE_ADMIN" || role === "ROLE_TECHNICIAN") ?? false;
  const isAdmin = user?.roles.includes("ROLE_ADMIN") ?? false;

  const ticketStats = useMemo(() => {
    const counts: Record<IncidentStatus, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REJECTED: 0,
    };

    for (const ticket of tickets) {
      counts[ticket.status] += 1;
    }

    return counts;
  }, [tickets]);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoadingTickets(true);
      setError("");
      try {
        const data = await listTickets();
        if (!active) return;
        setTickets(data);
        if (data.length > 0 && selectedTicketId === null) {
          setSelectedTicketId(data[0].id);
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load tickets");
      } finally {
        if (active) setLoadingTickets(false);
      }
    }

    loadTickets();
    return () => {
      active = false;
    };
  }, [selectedTicketId]);

  useEffect(() => {
    let active = true;

    async function loadSelectedTicket() {
      if (selectedTicketId === null) {
        setSelectedTicket(null);
        return;
      }

      setLoadingTicket(true);
      try {
        const ticket = await getTicket(selectedTicketId);
        if (active) {
          setSelectedTicket(ticket);
          setNextStatus(ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status === "IN_PROGRESS" ? "RESOLVED" : ticket.status);
        }
      } catch (loadError) {
        if (active) {
          showToast(loadError instanceof Error ? loadError.message : "Failed to load ticket", "error");
        }
      } finally {
        if (active) setLoadingTicket(false);
      }
    }

    loadSelectedTicket();
    return () => {
      active = false;
    };
  }, [selectedTicketId, showToast]);

  const refreshTickets = async (selectId?: number) => {
    const data = await listTickets();
    setTickets(data);
    if (selectId) {
      setSelectedTicketId(selectId);
    } else if (selectedTicketId !== null && !data.some((ticket) => ticket.id === selectedTicketId) && data.length > 0) {
      setSelectedTicketId(data[0].id);
    }
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []).slice(0, 3);
    setFiles(nextFiles);
  };

  const handleCreateTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const created = await createTicket({
        ...ticketForm,
        attachments: files,
      });
      showToast("Incident ticket submitted", "success");
      setTicketForm({
        category: "HARDWARE",
        description: "",
        priority: "MEDIUM",
        preferredContact: "",
        location: "",
        resourceName: "",
      });
      setFiles([]);
      await refreshTickets(created.id);
      setSelectedTicket(created);
      setCommentBody("");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to submit ticket";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    setStatusSubmitting(true);
    try {
      const updated = await updateTicketStatus(selectedTicket.id, {
        status: nextStatus,
        note: statusNote,
      });
      setSelectedTicket(updated);
      await refreshTickets(updated.id);
      setStatusNote("");
      showToast(`Ticket #${updated.id} updated to ${updated.status.replaceAll("_", " ").toLowerCase()}`, "success");
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : "Failed to update status";
      showToast(message, "error");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTicket) return;
    const parsedId = Number(technicianId);
    if (!Number.isFinite(parsedId)) {
      showToast("Enter a valid technician user ID", "error");
      return;
    }

    setStatusSubmitting(true);
    try {
      const updated = await assignTechnician(selectedTicket.id, { technicianId: parsedId });
      setSelectedTicket(updated);
      await refreshTickets(updated.id);
      showToast(`Ticket #${updated.id} assigned`, "success");
    } catch (assignError) {
      const message = assignError instanceof Error ? assignError.message : "Failed to assign technician";
      showToast(message, "error");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !commentBody.trim()) return;
    setCommentSubmitting(true);
    try {
      await addComment(selectedTicket.id, commentBody.trim());
      setCommentBody("");
      const ticket = await getTicket(selectedTicket.id);
      setSelectedTicket(ticket);
      await refreshTickets(ticket.id);
      showToast("Comment added", "success");
    } catch (commentError) {
      const message = commentError instanceof Error ? commentError.message : "Failed to add comment";
      showToast(message, "error");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleSaveComment = async () => {
    if (!selectedTicket || editingCommentId === null || !editingCommentBody.trim()) return;
    setCommentSubmitting(true);
    try {
      await updateComment(editingCommentId, editingCommentBody.trim());
      setEditingCommentId(null);
      setEditingCommentBody("");
      const ticket = await getTicket(selectedTicket.id);
      setSelectedTicket(ticket);
      await refreshTickets(ticket.id);
      showToast("Comment updated", "success");
    } catch (commentError) {
      const message = commentError instanceof Error ? commentError.message : "Failed to update comment";
      showToast(message, "error");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!selectedTicket) return;
    setCommentSubmitting(true);
    try {
      await deleteComment(commentId);
      const ticket = await getTicket(selectedTicket.id);
      setSelectedTicket(ticket);
      await refreshTickets(ticket.id);
      showToast("Comment deleted", "success");
    } catch (commentError) {
      const message = commentError instanceof Error ? commentError.message : "Failed to delete comment";
      showToast(message, "error");
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <PageShell>
      <SectionHeader
        title="Incidents & Maintenance"
        subtitle="Report faults, track progress, and resolve campus issues with attached evidence and comment history."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{option.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{ticketStats[option.value]}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Report a New Ticket</h2>
                <p className="text-sm text-gray-500">Attach up to 3 evidence images and submit directly to the maintenance queue.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {user?.email}
              </span>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateTicket}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Category</span>
                <select
                  value={ticketForm.category}
                  onChange={(event) => setTicketForm((current) => ({ ...current, category: event.target.value as IncidentCategory }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Priority</span>
                <select
                  value={ticketForm.priority}
                  onChange={(event) => setTicketForm((current) => ({ ...current, priority: event.target.value as IncidentPriority }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-gray-700">Description</span>
                <textarea
                  value={ticketForm.description}
                  onChange={(event) => setTicketForm((current) => ({ ...current, description: event.target.value }))}
                  rows={5}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Describe the issue, what happened, and any immediate impact."
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Preferred Contact</span>
                <input
                  value={ticketForm.preferredContact}
                  onChange={(event) => setTicketForm((current) => ({ ...current, preferredContact: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  placeholder="Email or phone"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Location</span>
                <input
                  value={ticketForm.location}
                  onChange={(event) => setTicketForm((current) => ({ ...current, location: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  placeholder="Room, floor, or building"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-gray-700">Related Resource (optional)</span>
                <input
                  value={ticketForm.resourceName}
                  onChange={(event) => setTicketForm((current) => ({ ...current, resourceName: event.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  placeholder="Projector, lab, lecture hall, etc."
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-gray-700">Evidence Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFilesChange}
                  className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Up to 3 images, each 5 MB or smaller.</p>
                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((file) => (
                      <span key={file.name} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        {file.name}
                      </span>
                    ))}
                  </div>
                )}
              </label>

              <div className="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTicketForm({
                      category: "HARDWARE",
                      description: "",
                      priority: "MEDIUM",
                      preferredContact: "",
                      location: "",
                      resourceName: "",
                    });
                    setFiles([]);
                  }}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Tickets</h2>
                <p className="text-sm text-gray-500">Select a ticket to review its details, comments, and workflow history.</p>
              </div>
              <button
                type="button"
                onClick={() => refreshTickets(selectedTicketId ?? undefined).catch(() => setError("Failed to refresh tickets"))}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>

            {loadingTickets ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                No tickets submitted yet.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selectedTicketId === ticket.id ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ticket #{ticket.id}</p>
                        <h3 className="mt-1 font-bold text-gray-900">{ticket.category.replaceAll("_", " ")}</h3>
                      </div>
                      <StatusChip status={ticket.status} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">{ticket.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                      <span>{ticket.location}</span>
                      <span>{formatDateTime(ticket.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ticket Details</h2>
                <p className="text-sm text-gray-500">Current workflow state and evidence for the selected incident.</p>
              </div>
              {selectedTicket && <StatusChip status={selectedTicket.status} />}
            </div>

            {loadingTicket ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                Loading ticket details...
              </div>
            ) : !selectedTicket ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                Select a ticket to inspect its full history.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Preferred Contact</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">{selectedTicket.preferredContact}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Location</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">{selectedTicket.location}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Assigned To</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">{selectedTicket.assignedToName ?? "Unassigned"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Created</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">{formatDateTime(selectedTicket.createdAt)}</p>
                  </div>
                </div>

                {selectedTicket.resourceName && (
                  <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Related Resource</p>
                    <p className="mt-1 text-sm text-gray-800">{selectedTicket.resourceName}</p>
                  </div>
                )}

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Description</p>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{selectedTicket.description}</p>
                </div>

                {(selectedTicket.resolutionNote || selectedTicket.rejectionReason) && (
                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Staff Note</p>
                    <p className="mt-1 text-sm text-gray-700">
                      {selectedTicket.resolutionNote ?? selectedTicket.rejectionReason}
                    </p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Attachments</p>
                  {selectedTicket.attachments.length === 0 ? (
                    <p className="text-sm text-gray-500">No attachments uploaded.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedTicket.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-blue-600 transition hover:bg-blue-50"
                        >
                          {attachment.originalName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-sm font-semibold text-gray-700">Comments</p>
                  <div className="space-y-3">
                    {selectedTicket.comments.length === 0 ? (
                      <p className="text-sm text-gray-500">No comments yet.</p>
                    ) : (
                      selectedTicket.comments.map((comment) => {
                        const canEdit = isAdmin || comment.authorId === user?.userId;
                        return (
                          <div key={comment.id} className="rounded-xl bg-gray-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{comment.authorName}</p>
                                <p className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</p>
                              </div>
                              {canEdit && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditingCommentBody(comment.body);
                                    }}
                                    className="text-xs font-semibold text-blue-600"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-xs font-semibold text-red-600"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            {editingCommentId === comment.id ? (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  value={editingCommentBody}
                                  onChange={(event) => setEditingCommentBody(event.target.value)}
                                  rows={3}
                                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={handleSaveComment}
                                    disabled={commentSubmitting}
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCommentId(null)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{comment.body}</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    <textarea
                      value={commentBody}
                      onChange={(event) => setCommentBody(event.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Add an update, clarification, or resolution note..."
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={commentSubmitting || !commentBody.trim()}
                      className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>

                {canManageTickets && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">Workflow Controls</p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Next Status</span>
                        <select
                          value={nextStatus}
                          onChange={(event) => setNextStatus(event.target.value as IncidentStatus)}
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Status Note</span>
                        <input
                          value={statusNote}
                          onChange={(event) => setStatusNote(event.target.value)}
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                          placeholder="Reason or resolution note"
                        />
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleUpdateStatus}
                        disabled={statusSubmitting}
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Update Status
                      </button>

                      {isAdmin && (
                        <div className="flex flex-1 flex-wrap gap-2">
                          <input
                            value={technicianId}
                            onChange={(event) => setTechnicianId(event.target.value)}
                            className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                            placeholder="Technician user ID"
                          />
                          <button
                            type="button"
                            onClick={handleAssignTechnician}
                            disabled={statusSubmitting}
                            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            Assign Technician
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default function IncidentsPage() {
  return (
    <ProtectedRoute>
      <ToastContainer>
        <IncidentsPageContent />
      </ToastContainer>
    </ProtectedRoute>
  );
}
