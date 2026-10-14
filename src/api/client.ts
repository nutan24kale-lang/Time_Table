/**
 * Smart Timetable Scheduler - Central API Client
 */

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function getToken(): string | null {
  return localStorage.getItem('timetable_token');
}

export function setToken(token: string) {
  localStorage.setItem('timetable_token', token);
}

export function removeToken() {
  localStorage.removeItem('timetable_token');
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),
  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  // Admin Overview
  getAdminOverview: () => apiRequest('/admin/overview'),

  // Subjects (10 fields)
  getSubjects: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/subjects${qs}`);
  },
  createSubject: (subject: any) =>
    apiRequest('/subjects', { method: 'POST', body: JSON.stringify(subject) }),
  updateSubject: (id: number, subject: any) =>
    apiRequest(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(subject) }),
  deleteSubject: (id: number) =>
    apiRequest(`/subjects/${id}`, { method: 'DELETE' }),

  // Teachers
  getTeachers: () => apiRequest('/teachers'),
  createTeacher: (teacher: any) =>
    apiRequest('/teachers', { method: 'POST', body: JSON.stringify(teacher) }),
  updateTeacher: (id: number, teacher: any) =>
    apiRequest(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(teacher) }),
  toggleTeacherStatus: (id: number) =>
    apiRequest(`/teachers/${id}/toggle-status`, { method: 'PATCH' }),

  // Classrooms
  getClassrooms: () => apiRequest('/classrooms'),
  createClassroom: (room: any) =>
    apiRequest('/classrooms', { method: 'POST', body: JSON.stringify(room) }),
  updateClassroom: (id: number, room: any) =>
    apiRequest(`/classrooms/${id}`, { method: 'PUT', body: JSON.stringify(room) }),
  toggleClassroomStatus: (id: number) =>
    apiRequest(`/classrooms/${id}/toggle-status`, { method: 'PATCH' }),

  // Classroom Availability
  getAvailability: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/availability${qs}`);
  },

  // Timetable Generator & Timetables
  generateTimetable: (params: { department: string; semester: string; section: string }) =>
    apiRequest('/generator/generate', { method: 'POST', body: JSON.stringify(params) }),
  validateSchedule: (schedule: any[]) =>
    apiRequest('/generator/validate', { method: 'POST', body: JSON.stringify({ schedule }) }),
  saveDraftTimetable: (data: any) =>
    apiRequest('/generator/save-draft', { method: 'POST', body: JSON.stringify(data) }),
  publishTimetable: (data: any) =>
    apiRequest('/generator/publish', { method: 'POST', body: JSON.stringify(data) }),
  getActiveTimetable: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/timetables/active${qs}`);
  },

  // Graph Analysis
  getGraphAnalysis: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/graph-analysis${qs}`);
  },

  // Teacher Absences & Replacements
  getAbsences: () => apiRequest('/absences'),
  submitAbsence: (absence: any) =>
    apiRequest('/absences', { method: 'POST', body: JSON.stringify(absence) }),
  approveAbsence: (id: number) =>
    apiRequest(`/absences/${id}/approve`, { method: 'POST' }),
  approveReplacement: (replacementId: number, data: { assigned_teacher_id?: number }) =>
    apiRequest(`/absences/replacements/${replacementId}/approve`, { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getWorkloadReport: () => apiRequest('/reports/workload'),
  getUtilizationReport: () => apiRequest('/reports/utilization'),

  // Versions
  getVersions: () => apiRequest('/versions'),
  getVersionDetails: (id: number) => apiRequest(`/versions/${id}`),
  restoreVersion: (id: number) =>
    apiRequest(`/versions/${id}/restore`, { method: 'POST' }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: number) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    apiRequest('/notifications/read-all', { method: 'PATCH' }),

  // Audit Logs
  getAuditLogs: () => apiRequest('/audit'),
};
