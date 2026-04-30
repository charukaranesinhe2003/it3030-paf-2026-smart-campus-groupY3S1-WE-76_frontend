import axiosInstance from "./axiosInstance";

export type IncidentCategory =
  | "HARDWARE"
  | "SOFTWARE"
  | "CLEANING"
  | "SAFETY"
  | "ELECTRICAL"
  | "NETWORK"
  | "OTHER";

export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED";

export interface IncidentAttachmentDTO {
  id: number;
  originalName: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface IncidentCommentDTO {
  id: number;
  authorId: number;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentTicketDTO {
  id: number;
  category: IncidentCategory;
  description: string;
  priority: IncidentPriority;
  preferredContact: string;
  location: string;
  resourceName?: string | null;
  status: IncidentStatus;
  createdById: number;
  createdByName: string;
  assignedToId?: number | null;
  assignedToName?: string | null;
  resolutionNote?: string | null;
  rejectionReason?: string | null;
  attachments: IncidentAttachmentDTO[];
  comments: IncidentCommentDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentTicketInput {
  category: IncidentCategory;
  description: string;
  priority: IncidentPriority;
  preferredContact: string;
  location: string;
  resourceName?: string;
  attachments?: File[];
}

export interface UpdateIncidentStatusInput {
  status: IncidentStatus;
  note?: string;
}

export interface AssignIncidentTicketInput {
  technicianId: number;
}

const API_BASE = "/api/tickets";

export async function createTicket(payload: CreateIncidentTicketInput): Promise<IncidentTicketDTO> {
  const formData = new FormData();
  const ticketPayload = {
    category: payload.category,
    description: payload.description,
    priority: payload.priority,
    preferredContact: payload.preferredContact,
    location: payload.location,
    resourceName: payload.resourceName?.trim() || null,
  };

  formData.append(
    "ticket",
    new Blob([JSON.stringify(ticketPayload)], { type: "application/json" })
  );

  (payload.attachments ?? []).slice(0, 3).forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await axiosInstance.post<IncidentTicketDTO>(API_BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function listTickets(status?: IncidentStatus): Promise<IncidentTicketDTO[]> {
  const response = await axiosInstance.get<IncidentTicketDTO[]>(API_BASE, {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function getTicket(id: number | string): Promise<IncidentTicketDTO> {
  const response = await axiosInstance.get<IncidentTicketDTO>(`${API_BASE}/${id}`);
  return response.data;
}

export async function updateTicketStatus(
  ticketId: number | string,
  payload: UpdateIncidentStatusInput
): Promise<IncidentTicketDTO> {
  const response = await axiosInstance.patch<IncidentTicketDTO>(
    `${API_BASE}/${ticketId}/status`,
    payload
  );
  return response.data;
}

export async function assignTechnician(
  ticketId: number | string,
  payload: AssignIncidentTicketInput
): Promise<IncidentTicketDTO> {
  const response = await axiosInstance.patch<IncidentTicketDTO>(
    `${API_BASE}/${ticketId}/assign`,
    payload
  );
  return response.data;
}

export async function addComment(ticketId: number | string, body: string): Promise<IncidentCommentDTO> {
  const response = await axiosInstance.post<IncidentCommentDTO>(`${API_BASE}/${ticketId}/comments`, {
    body,
  });
  return response.data;
}

export async function updateComment(commentId: number | string, body: string): Promise<IncidentCommentDTO> {
  const response = await axiosInstance.put<IncidentCommentDTO>(`${API_BASE}/comments/${commentId}`, {
    body,
  });
  return response.data;
}

export async function deleteComment(commentId: number | string): Promise<void> {
  await axiosInstance.delete(`${API_BASE}/comments/${commentId}`);
}
