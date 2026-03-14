import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getMentorProfile } from "@/lib/api";
import type { MentorProfile, Subject } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SchedulingModal } from "@/components/SchedulingModel";
import { SignupDialog } from "@/components/SignUpDialog";
import { useAuth } from "@clerk/clerk-react";
import {
  Building2,
  Calendar,
  GraduationCap,
  ShieldCheck,
  ThumbsUp,
  Users,
  BookOpen,
} from "lucide-react";

export default function MentorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scheduling modal state
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [preSelectedSubject, setPreSelectedSubject] = useState<Subject | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    getMentorProfile(Number(id))
      .then(setMentor)
      .catch(() => setError("Mentor not found"))
      .finally(() => setLoading(false));
  }, [id]);

  // Opens the scheduling modal — optionally with a pre-selected subject
  function handleBook(subject?: Subject) {
    if (!isSignedIn) {
      setIsSignupOpen(true);
      return;
    }
    setPreSelectedSubject(subject);
    setIsSchedulingOpen(true);
  }

  if (loading) {
    return (
      <div className="container py-20 text-center text-muted-foreground">
        Loading mentor profile...
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground mb-4">{error ?? "Mentor not found"}</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  const mentorName = `${mentor.firstName} ${mentor.lastName}`;
  const hasSubjects = mentor.subjects.length > 0;

  return (
    <>
      <div className="container py-10 space-y-10">

        {/* ── Header Section ── */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile image */}
          <div className="shrink-0">
            {mentor.profileImageUrl ? (
              <img
                src={mentor.profileImageUrl}
                alt={mentorName}
                className="size-36 rounded-full object-cover object-top border-4 border-muted"
              />
            ) : (
              <div className="size-36 rounded-full bg-muted flex items-center justify-center text-5xl font-bold">
                {mentor.firstName.charAt(0)}
              </div>
            )}
          </div>

          {/* Mentor info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{mentorName}</h1>
              {mentor.isCertified && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium">
                  <ShieldCheck className="h-3 w-3" /> Certified
                </span>
              )}
            </div>

            <p className="text-lg text-muted-foreground">{mentor.title}</p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {mentor.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> {mentor.company}
                </span>
              )}
              {mentor.profession && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" /> {mentor.profession}
                </span>
              )}
              {mentor.startYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Since {mentor.startYear}
                </span>
              )}
              {mentor.positiveReviews != null && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" /> {mentor.positiveReviews}%
                  positive reviews
                </span>
              )}
            </div>

            <Button
              className="bg-black text-white hover:bg-black/90 mt-2"
              disabled={!hasSubjects}
              onClick={() => handleBook()}
            >
              {hasSubjects ? "Schedule a Session" : "No courses available"}
            </Button>
          </div>
        </div>

        {/* ── Stats Section ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-primary" />}
            label="Students Taught"
            value={String(mentor.totalEnrollments ?? 0)}
          />
          <StatCard
            icon={<GraduationCap className="h-5 w-5 text-primary" />}
            label="Years Experience"
            value={String(mentor.experienceYears)}
          />
          <StatCard
            icon={<ThumbsUp className="h-5 w-5 text-primary" />}
            label="Positive Reviews"
            value={`${mentor.positiveReviews ?? 0}%`}
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            label="Subjects Taught"
            value={String(mentor.subjects.length)}
          />
        </div>

        {/* ── About Section ── */}
        {mentor.bio && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">About</h2>
            <p className="text-muted-foreground leading-relaxed">{mentor.bio}</p>
            {mentor.experienceYears > 0 && (
              <p className="text-sm text-muted-foreground">
                {mentor.experienceYears} years of professional experience
                {mentor.company ? ` at ${mentor.company}` : ""}
              </p>
            )}
          </section>
        )}

        {/* ── Subjects Section ── */}
        {hasSubjects && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Subjects Taught</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mentor.subjects.map((subject) => (
                <Card key={subject.id} className="flex flex-col">
                  {/* Course thumbnail */}
                  <div className="h-36 bg-muted rounded-t-lg overflow-hidden">
                    {subject.courseImageUrl ? (
                      <img
                        src={subject.courseImageUrl}
                        alt={subject.subjectName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                        {subject.subjectName.charAt(0)}
                      </div>
                    )}
                  </div>

                  <CardContent className="flex flex-col flex-1 p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold">{subject.subjectName}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {subject.description}
                      </p>
                    </div>

                    {/* Enrollment count */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {subject.enrollmentCount ?? 0} students enrolled
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-auto bg-black text-white hover:bg-black/90"
                      onClick={() => handleBook(subject)}
                    >
                      Book This Subject
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Modals */}
      {mentor && (
        <>
          <SignupDialog
            isOpen={isSignupOpen}
            onClose={() => setIsSignupOpen(false)}
          />
          <SchedulingModal
            isOpen={isSchedulingOpen}
            onClose={() => setIsSchedulingOpen(false)}
            mentor={mentor}
            preSelectedSubject={preSelectedSubject}
          />
        </>
      )}
    </>
  );
}

// Small reusable stat card
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        <div className="p-2 rounded-md bg-primary/10">{icon}</div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}