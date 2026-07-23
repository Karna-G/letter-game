const API_BASE = '/api';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('postmaster_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
}

export async function register(name: string, email: string, password: string, role: string) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
  localStorage.setItem('postmaster_token', data.token);
  localStorage.setItem('postmaster_user', JSON.stringify(data.user));
  return data;
}

export async function login(email: string, password: string) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('postmaster_token', data.token);
  localStorage.setItem('postmaster_user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('postmaster_token');
  localStorage.removeItem('postmaster_user');
}

export function getStoredUser() {
  const raw = localStorage.getItem('postmaster_user');
  if (raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

export function getStoredToken() {
  return localStorage.getItem('postmaster_token');
}

export async function sendLetter(receiverRef: string, content: string, type: string = 'standard', status: string = 'pending') {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  
  return await apiRequest('/letters', {
    method: 'POST',
    body: JSON.stringify({ senderRef: user.id, receiverRef, content, type, status }),
  });
}

export async function updateLetter(id: string, receiverRef: string, content: string, status: string = 'draft') {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  
  return await apiRequest(`/letters/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ receiverRef, content, status }),
  });
}

export async function deleteLetter(id: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  
  return await apiRequest(`/letters/${id}`, {
    method: 'DELETE',
  });
}

export async function scanLetter(token: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  
  return await apiRequest('/letters/scan', {
    method: 'POST',
    body: JSON.stringify({ token, userId: user.id, role: user.role }),
  });
}

export async function getActiveQuests() {
  const user = getStoredUser();
  if (!user || user.role !== 'mailman') throw new Error('Not authorized');
  
  return await apiRequest(`/letters/mailman/${user.id}/active`, {
    method: 'GET',
  });
}

export async function getMyLetters() {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  
  return await apiRequest(`/letters/user/${user.id}`, {
    method: 'GET',
  });
}
