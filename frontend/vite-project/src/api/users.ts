import { API_BASE } from "./base";

export const fetchUsers = async (token: string) => {
  const response = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const createUser = async (payload: Record<string, unknown>, token: string) => {
  const response = await fetch(`${API_BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return response;
};

export const updateUser = async (id: string, payload: Record<string, unknown>, token: string) => {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return response;
};

export const deleteUser = async (id: string, token: string) => {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const resetUserPassword = async (id: string, token: string) => {
  const response = await fetch(`${API_BASE}/users/${id}/reset`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};
