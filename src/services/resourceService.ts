import axiosInstance from "./axiosInstance";

export interface Resource {
  id: number;
  name: string;
  type: string;
  capacity: number;
  location: string;
  availabilityStart: string;
  availabilityEnd: string;
  status: "ACTIVE" | "OUT_OF_SERVICE";
}

export type ResourcePayload = Omit<Resource, "id">;

const RESOURCE_URL = "/resources";

export const getAllResources = () =>
  axiosInstance.get<Resource[]>(RESOURCE_URL);

export const getResourceById = (id: number | string) =>
  axiosInstance.get<Resource>(`${RESOURCE_URL}/${id}`);

export const createResource = (resource: ResourcePayload) =>
  axiosInstance.post<Resource>(RESOURCE_URL, resource);

export const updateResource = (id: number | string, resource: ResourcePayload) =>
  axiosInstance.put<Resource>(`${RESOURCE_URL}/${id}`, resource);

export const deleteResource = (id: number) =>
  axiosInstance.delete<string>(`${RESOURCE_URL}/${id}`);
