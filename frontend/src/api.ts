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

import { io } from 'socket.io-client';

export function logout() {
  const user = getStoredUser();
  if (user && (user.id || user._id)) {
    try {
      const socket = io();
      socket.emit('leave-map', { userId: user.id || user._id });
      setTimeout(() => socket.disconnect(), 150);
    } catch (e) {}
  }
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

export async function sendLetter(
  receiverRefOrParams: any, 
  content?: string, 
  type: string = 'standard', 
  status: string = 'pending', 
  burnAfterReading: boolean = false, 
  burnTimerSeconds: number = 60, 
  font: string = 'Cinzel', 
  fontSize: string = 'medium',
  schrodingerVariants?: any[],
  scheduledFor?: string | Date
) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');

  // Grab sender's GPS location when sending
  const senderLocation = await new Promise<{lat: number, lng: number} | null>((resolve) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null)
      );
    } else {
      resolve(null);
    }
  });

  let payload: any = {};
  if (typeof receiverRefOrParams === 'object' && receiverRefOrParams !== null) {
    payload = {
      senderRef: user.id || user._id,
      senderLocation,
      ...receiverRefOrParams
    };
  } else {
    payload = {
      senderRef: user.id || user._id,
      receiverRef: receiverRefOrParams,
      content,
      type,
      status,
      burnAfterReading,
      burnTimerSeconds,
      font,
      fontSize,
      schrodingerVariants,
      scheduledFor,
      senderLocation
    };
  }

  return await apiRequest('/letters', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLetter(id: string, receiverRef: string, content: string, status: string = 'draft', burnAfterReading: boolean = false, burnTimerSeconds: number = 60, font: string = 'Cinzel', fontSize: string = 'medium', scheduledFor?: string | Date) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');

  return await apiRequest(`/letters/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ receiverRef, content, status, burnAfterReading, burnTimerSeconds, font, fontSize, scheduledFor }),
  });
}

// Feature 22 & Epistolary Read Tracking
export async function markLetterRead(id: string) {
  return await apiRequest(`/letters/${id}/read`, { method: 'PUT' });
}

export async function markLetterUnread(id: string) {
  return await apiRequest(`/letters/${id}/unread`, { method: 'PUT' });
}

export async function toggleLetterRead(id: string, isRead?: boolean) {
  return await apiRequest(`/letters/${id}/toggle-read`, {
    method: 'PUT',
    body: typeof isRead === 'boolean' ? JSON.stringify({ isRead }) : undefined
  });
}

export async function batchMarkRead(ids: string[], isRead: boolean) {
  return await apiRequest('/letters/batch-read', {
    method: 'POST',
    body: JSON.stringify({ ids, isRead }),
  });
}

export async function batchTrashLetters(ids: string[]) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest('/letters/batch-trash', {
    method: 'POST',
    body: JSON.stringify({ ids, userId: user.id || user._id }),
  });
}

export async function batchRestoreLetters(ids: string[]) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest('/letters/batch-restore', {
    method: 'POST',
    body: JSON.stringify({ ids, userId: user.id || user._id }),
  });
}

export async function batchBurnPermanent(ids: string[]) {
  return await apiRequest('/letters/batch-burn', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function burnLetter(id: string) {
  return await apiRequest(`/letters/${id}/burn`, { method: 'PUT' });
}

// Feature 11: Guild Leaderboards
export async function getLeaderboard(viewerId?: string) {
  const query = viewerId ? `?viewerId=${viewerId}` : '';
  return await apiRequest(`/users/leaderboard${query}`, { method: 'GET' });
}

// Feature: Interactive Cartographic Note Status (Upload note status with 1-day duration & privacy)
export async function updateNoteStatus(params: { noteStatus: string; privacy?: 'public' | 'friends' | 'private'; mood?: string }) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/users/${user.id || user._id}/note-status`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

// ============================================
// --- TRASH & WASTEBIN API ---
// ============================================

export async function removeLetterToTrash(id: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/letters/${id}/trash`, {
    method: 'PUT',
    body: JSON.stringify({ userId: user.id || user._id }),
  });
}

export async function restoreLetterFromTrash(id: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/letters/${id}/restore`, {
    method: 'PUT',
    body: JSON.stringify({ userId: user.id || user._id }),
  });
}

export async function getTrashedLetters() {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/letters/trash/${user.id || user._id}`, {
    method: 'GET',
  });
}

export async function emptyTrash() {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/letters/trash/empty/${user.id || user._id}`, {
    method: 'DELETE',
  });
}

export async function burnLetterPermanent(id: string) {
  return await apiRequest(`/letters/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// --- THE DEAD LETTER OFFICE HELPERS ---
// ============================================

export async function getDeadLetters() {
  return await apiRequest('/letters/dead-letter-office', {
    method: 'GET',
  });
}

export async function abandonLetter(id: string, reason?: string) {
  const user = getStoredUser();
  return await apiRequest(`/letters/${id}/abandon`, {
    method: 'PUT',
    body: JSON.stringify({ userId: user ? (user.id || user._id) : undefined, reason }),
  });
}

export async function batchAbandonLetters(ids: string[], reason?: string) {
  const user = getStoredUser();
  return await apiRequest('/letters/batch-abandon', {
    method: 'POST',
    body: JSON.stringify({ ids, userId: user ? (user.id || user._id) : undefined, reason }),
  });
}

export async function deleteLetter(id: string) {
  return await removeLetterToTrash(id);
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

export async function getUserProfile(userId: string, viewerId?: string) {
  const query = viewerId ? `?viewerId=${viewerId}` : '';
  return await apiRequest(`/users/${userId}${query}`, {
    method: 'GET',
  });
}

export async function getMyMailbox() {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  
  return await apiRequest(`/letters/mailbox/${user.id}`, {
    method: 'GET',
  });
}

export async function getMailmenDirectory(viewerId?: string) {
  const query = viewerId ? `?viewerId=${viewerId}` : '';
  return await apiRequest(`/users/mailmen${query}`, {
    method: 'GET',
  });
}

// ============================================
// --- FELLOWSHIP & FRIEND REQUESTS ---
// ============================================

export async function getMyFriends() {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/users/${user.id}/friends`, {
    method: 'GET',
  });
}

export async function getFriendRequests() {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/users/${user.id}/friend-requests`, {
    method: 'GET',
  });
}

export async function sendFriendRequest(friendCode: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/users/${user.id}/friends/request`, {
    method: 'POST',
    body: JSON.stringify({ friendCode }),
  });
}

export async function acceptFriendRequest(requesterId: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/users/${user.id}/friends/accept`, {
    method: 'POST',
    body: JSON.stringify({ requesterId }),
  });
}

export async function rejectFriendRequest(requesterId: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/users/${user.id}/friends/reject`, {
    method: 'POST',
    body: JSON.stringify({ requesterId }),
  });
}

export async function cancelFriendRequest(recipientId: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/users/${user.id}/friends/cancel`, {
    method: 'POST',
    body: JSON.stringify({ recipientId }),
  });
}

export async function removeFriend(friendId: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest(`/users/${user.id}/friends/remove`, {
    method: 'POST',
    body: JSON.stringify({ friendId }),
  });
}

// Backward compatibility
export async function addFriend(friendCode: string) {
  return await sendFriendRequest(friendCode);
}

export async function reportUser(reportedUserId: string, reason: string, letterId?: string) {
  const user = getStoredUser();
  if (!user) throw new Error('Not logged in');
  return await apiRequest('/users/report', {
    method: 'POST',
    body: JSON.stringify({ reporterId: user.id, reportedUserId, reason, letterId }),
  });
}
export async function getAllReports() {
  return await apiRequest('/users/reports/all', {
    method: 'GET',
  });
}

export async function updateReportStatus(reportId: string, status: string) {
  return await apiRequest(`/users/reports/${reportId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function updateUserLocation(userId: string, lat: number, lng: number) {
  return await apiRequest(`/users/${userId}/location`, {
    method: 'PUT',
    body: JSON.stringify({ lat, lng }),
  });
}

export async function getActiveMapUsers(lat?: number, lng?: number, radius?: number, viewerId?: string) {
  let url = '/users/map/active-users';
  const params: string[] = [];
  if (typeof lat === 'number' && typeof lng === 'number') {
    params.push(`lat=${lat}`, `lng=${lng}`);
    if (radius) params.push(`radius=${radius}`);
  }
  if (viewerId) {
    params.push(`viewerId=${viewerId}`);
  }
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  return await apiRequest(url, {
    method: 'GET',
  });
}

// Feature 25: Dybbuk Letter & Dybbuk Mode
export async function summonDybbukLetter(userId: string, tone: 'classical' | 'modern' = 'classical') {
  return await apiRequest('/letters/dybbuk/generate', {
    method: 'POST',
    body: JSON.stringify({ userId, tone }),
  });
}

export async function toggleDybbukMode(userId: string, enabled?: boolean) {
  return await apiRequest(`/users/${userId}/dybbuk-mode`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
}

export async function checkDybbukAutoDelivery(userId: string) {
  return await apiRequest('/letters/dybbuk/auto-check', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// Feature 26: Schrödinger's Quantum Paradox Letter
export async function generateSchrodingerVariants(content: string, moods?: string[], tone: 'classical' | 'modern' = 'classical') {
  return await apiRequest('/letters/schrodinger/generate-variants', {
    method: 'POST',
    body: JSON.stringify({ content, moods, tone }),
  });
}

export async function summonSchrodingerLetter(params: {
  userId: string;
  content?: string;
  moods?: string[];
  receiverRef?: string;
  font?: string;
  fontSize?: string;
  tone?: 'classical' | 'modern';
}) {
  return await apiRequest('/letters/schrodinger/summon', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function mutateLetterMood(params: {
  letterId?: string;
  content?: string;
  targetMood: string;
  tone?: 'classical' | 'modern';
}) {
  return await apiRequest('/letters/schrodinger/mutate-mood', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function collapseSchrodingerLetter(letterId: string) {
  return await apiRequest(`/letters/${letterId}/schrodinger/collapse`, {
    method: 'POST',
  });
}

// ============================================
// Message in a Bottle: Ocean Drift APIs
// ============================================

export async function tossBottleMessage(params: {
  userId: string;
  content: string;
  isAnonymous?: boolean;
  bottleMoniker?: string;
  bottleStyle?: 'emerald' | 'sapphire' | 'amber' | 'crystal';
  bottleWaxColor?: string;
  senderLocation?: { lat: number; lng: number };
  font?: string;
  fontSize?: string;
}) {
  return await apiRequest('/letters/bottle/toss', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getMyTossedBottles(userId: string) {
  return await apiRequest(`/letters/bottle/my-bottles?userId=${userId}`);
}

export async function getMyBeachedBottles(userId: string) {
  return await apiRequest(`/letters/bottle/beached?userId=${userId}`);
}

export async function uncorkBottleMessage(letterId: string) {
  return await apiRequest(`/letters/${letterId}/bottle/uncork`, {
    method: 'POST',
  });
}

// ============================================
// Postmaster's Riddle & Letter Recall APIs
// ============================================

export async function getPostmasterRiddle() {
  return await apiRequest('/letters/postmaster-riddle');
}

export async function attemptRecallLetter(letterId: string, payload: {
  userId?: string;
  riddleId: string;
  selectedOptionIndex?: number;
  isTimeout?: boolean;
}) {
  return await apiRequest(`/letters/${letterId}/recall`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================
// Feature: Community Notice Board
// ============================================

export async function getNotices() {
  return await apiRequest('/notices', { method: 'GET' });
}

export async function postNotice(params: {
  title: string;
  content: string;
  category?: 'announcement' | 'update' | 'event' | 'warning' | 'news';
  isPinned?: boolean;
}) {
  return await apiRequest('/notices', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function togglePinNotice(noticeId: string) {
  return await apiRequest(`/notices/${noticeId}/pin`, { method: 'PATCH' });
}

export async function deleteNotice(noticeId: string) {
  return await apiRequest(`/notices/${noticeId}`, { method: 'DELETE' });
}

// ============================================
// Letter Pickup Radius Alert Settings APIs
// ============================================

export interface PickupAlertSettings {
  enabled: boolean;
  radiusMeters: number;
  soundEnabled: boolean;
  notifyAllCouriers: boolean;
}

export async function getPickupAlertSettings(userId: string): Promise<PickupAlertSettings> {
  return await apiRequest(`/users/${userId}/pickup-alert-settings`);
}

export async function updatePickupAlertSettings(
  userId: string,
  settings: Partial<PickupAlertSettings>
): Promise<{ message: string; pickupAlertSettings: PickupAlertSettings }> {
  return await apiRequest(`/users/${userId}/pickup-alert-settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// ============================================
// Central Hub Delivery Proof & Authentication APIs
// ============================================

export async function submitDeliveryProof(letterId: string, mailmanId?: string, handoverCoordinates?: { lat: number; lng: number }) {
  return await apiRequest(`/letters/${letterId}/delivery-proof/submit`, {
    method: 'POST',
    body: JSON.stringify({ mailmanId, handoverCoordinates }),
  });
}

export async function authenticateDeliveryProof(letterId: string, params: { userId: string; action: 'accept' | 'decline'; reason?: string }) {
  return await apiRequest(`/letters/${letterId}/delivery-proof/verify`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getCentralHubProofs() {
  return await apiRequest('/letters/central-hub/proofs');
}