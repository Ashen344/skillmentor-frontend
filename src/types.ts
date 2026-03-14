// Modified to match with backend SubjectWithEnrollmentDTO
export interface Subject {
  id: number;
  subjectName: string;
  description: string;
  courseImageUrl: string;
  enrollmentCount?: number; // present on mentor profile page, absent on simple listings
}

// Modified to match with backend MentorResponseDTO (from GET /api/v1/mentors)
export interface Mentor {
  id: number;
  mentorId: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  profession: string;
  company: string;
  experienceYears: number;
  bio: string;
  profileImageUrl: string;
  positiveReviews: number;
  totalEnrollments: number;
  isCertified: boolean;
  startYear: string;
  subjects: Subject[];
}

// Full mentor profile returned by GET /api/v1/mentors/{id}/profile
export interface MentorProfile extends Mentor {
  subjects: Subject[]; // subjects here always include enrollmentCount
}

// Modified to match with SessionResponseDTO (from GET /api/v1/sessions/my-sessions)
export interface Enrollment {
  id: number;
  mentorName: string;
  mentorProfileImageUrl: string;
  subjectName: string;
  sessionAt: string;
  durationMinutes: number;
  sessionStatus: string;
  paymentStatus: "pending" | "accepted" | "completed" | "cancelled";
  meetingLink: string | null;
  studentRating: number | null;   // null means no review yet
  studentReview: string | null;
}

// Review submitted by a student on a completed session
export interface Review {
  sessionId: number;
  rating: number;       // 1-5
  reviewText: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}