import type { Enrollment, Mentor, MentorProfile, Review } from "@/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

// Shared helper — adds the auth token to every request
async function fetchWithAuth(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res;
}

// ── Public ─────────────────────────────────────────────────────────────────

// Fetch paginated mentor list (used on home page)
export async function getPublicMentors(
  page = 0,
  size = 10,
): Promise<{ content: Mentor[]; totalElements: number; totalPages: number }> {
  const res = await fetch(
    `${API_BASE_URL}/api/v1/mentors?page=${page}&size=${size}`,
  );
  if (!res.ok) throw new Error("Failed to fetch mentors");
  return res.json();
}

// Fetch full mentor profile with subjects + enrollment counts (used on profile page)
export async function getMentorProfile(id: number): Promise<MentorProfile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/mentors/${id}/profile`);
  if (!res.ok) throw new Error("Failed to fetch mentor profile");
  return res.json();
}

// ── Student: Sessions ──────────────────────────────────────────────────────

// Student books a new session
export async function enrollInSession(
  token: string,
  data: {
    mentorId: number;
    subjectId: number;
    sessionAt: string;
    durationMinutes?: number;
  },
): Promise<Enrollment> {
  const res = await fetchWithAuth("/api/v1/sessions/enroll", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

// Student fetches their own sessions
export async function getMyEnrollments(token: string): Promise<Enrollment[]> {
  const res = await fetchWithAuth("/api/v1/sessions/my-sessions", token);
  return res.json();
}

// Student submits a review on a completed session
export async function submitReview(
  token: string,
  data: Review,
): Promise<void> {
  await fetchWithAuth(`/api/v1/sessions/${data.sessionId}/review`, token, {
    method: "POST",
    body: JSON.stringify({
      rating: data.rating,
      reviewText: data.reviewText,
    }),
  });
}

// ── Admin: Sessions ────────────────────────────────────────────────────────

// Fetch ALL sessions (admin only — backend enforces ROLE_ADMIN)
export async function getAllSessions(token: string): Promise<AdminSession[]> {
  const res = await fetchWithAuth("/api/v1/sessions", token);
  return res.json();
}

// Update a session's payment status, session status, or meeting link
export async function updateSession(
  token: string,
  sessionId: number,
  data: { paymentStatus?: string; sessionStatus?: string; meetingLink?: string }
): Promise<AdminSession> {
  const res = await fetchWithAuth(`/api/v1/sessions/${sessionId}`, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Admin: Subjects ────────────────────────────────────────────────────────

// Create a new subject and link it to a mentor
export async function createSubject(
  token: string,
  data: { subjectName: string; description: string; courseImageUrl: string; mentorId: number }
): Promise<Subject> {
  const res = await fetchWithAuth("/api/v1/subjects", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Admin: Mentors ─────────────────────────────────────────────────────────

// Create a new mentor (admin provides all fields manually)
export async function createMentor(
  token: string,
  data: {
    mentorId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    title?: string;
    profession?: string;
    company?: string;
    experienceYears?: number;
    bio?: string;
    profileImageUrl?: string;
    positiveReviews?: number;
    totalEnrollments?: number;
    isCertified?: boolean;
    startYear?: string;
  }
): Promise<Mentor> {
  const res = await fetchWithAuth("/api/v1/mentors", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

// ── Types used only by admin pages ─────────────────────────────────────────

export interface AdminSession {
  id: number;
  studentName: string;
  studentEmail: string;
  mentorName: string;
  subjectName: string;
  sessionAt: string;
  durationMinutes: number;
  sessionStatus: string;
  paymentStatus: string;
  meetingLink: string | null;
}

export interface Subject {
  id: number;
  subjectName: string;
  description: string;
  courseImageUrl: string;
}