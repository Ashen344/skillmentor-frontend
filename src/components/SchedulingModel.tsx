import { useState } from "react";
import { Calendar } from "./ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useNavigate } from "react-router";
import type { Mentor, Subject } from "@/types";

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
  preSelectedSubject?: Subject; // optional — pre-fills subject when coming from profile page
}

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

export function SchedulingModal({
  isOpen,
  onClose,
  mentor,
  preSelectedSubject,
}: SchedulingModalProps) {
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  // Use pre-selected subject if provided, otherwise default to first subject
  const [selectedSubject, setSelectedSubject] = useState<Subject | undefined>(
    preSelectedSubject ?? mentor.subjects[0]
  );
  const navigate = useNavigate();

  const mentorName = `${mentor.firstName} ${mentor.lastName}`;

  // Disable all dates in the past — today is the earliest allowed date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSchedule = () => {
    if (date && selectedTime && selectedSubject) {
      const sessionDateTime = new Date(date);
      const [hours, minutes] = selectedTime.split(":");
      sessionDateTime.setHours(
        Number.parseInt(hours),
        Number.parseInt(minutes),
      );

      const sessionId = `${mentor.id}-${Date.now()}`;
      const searchParams = new URLSearchParams({
        date: sessionDateTime.toISOString(),
        courseTitle: selectedSubject.subjectName,
        mentorName: mentorName,
        mentorId: mentor.mentorId,
        mentorImg: mentor.profileImageUrl ?? "",
        subjectId: String(selectedSubject.id),
      });
      navigate(`/payment/${sessionId}?${searchParams.toString()}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule a session</DialogTitle>
          <DialogDescription>
            Booking with <span className="font-medium">{mentorName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Mentor info strip */}
        <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
          {mentor.profileImageUrl ? (
            <img
              src={mentor.profileImageUrl}
              alt={mentorName}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div className="size-10 rounded-full bg-muted flex items-center justify-center font-bold">
              {mentor.firstName.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{mentorName}</p>
            <p className="text-xs text-muted-foreground">{mentor.title}</p>
          </div>
        </div>

        {/* Subject selector — shows all subjects, pre-selects if coming from profile */}
        {mentor.subjects.length > 1 && (
          <div>
            <h4 className="font-medium mb-2 text-sm">Select Subject</h4>
            <div className="flex flex-wrap gap-2">
              {mentor.subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedSubject?.id === subject.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input hover:bg-muted"
                  }`}
                >
                  {subject.subjectName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected subject display */}
        {selectedSubject && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Subject:</span>
            {selectedSubject.subjectName}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Choose a date</h4>
            {/* disabled prop blocks all past dates */}
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={{ before: today }}
              className="rounded-md border"
            />
          </div>
          <div>
            <h4 className="font-medium mb-2">Choose a time</h4>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!date || !selectedTime || !selectedSubject}
          >
            Continue to Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}