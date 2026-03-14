import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/hooks/use-toast";
import { createSubject, getPublicMentors } from "@/lib/api";
import type { Mentor } from "@/types";

// Zod schema — defines the validation rules for the form
const subjectSchema = z.object({
  subjectName: z.string().min(5, "Subject name must be at least 5 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Max 500 characters"),
  courseImageUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  mentorId: z.string().min(1, "Please select a mentor"),
});

// TypeScript type inferred from the schema so we don't have to write it twice
type SubjectFormValues = z.infer<typeof subjectSchema>;

export default function CreateSubjectPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form — connects the form inputs to validation and submission
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { courseImageUrl: "" },
  });

  // Load mentors for the dropdown when the page first opens
  useEffect(() => {
    getPublicMentors(0, 100)
      .then((data) => setMentors(data.content))
      .catch(() =>
        toast({ title: "Failed to load mentors", variant: "destructive" })
      );
  }, []);

  const onSubmit = async (values: SubjectFormValues) => {
    setIsSubmitting(true);
    try {
      const token = await getToken({ template: "skillmentor-auth" });
      if (!token) throw new Error("Not authenticated");

      await createSubject(token, {
        subjectName: values.subjectName,
        description: values.description,
        courseImageUrl: values.courseImageUrl,
        mentorId: Number(values.mentorId), // backend expects a number
      });

      toast({
        title: "Subject created!",
        description: `"${values.subjectName}" has been added.`,
      });
      navigate("/admin"); // redirect back to overview on success
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Error creating subject",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create Subject</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a new course subject and assign it to a mentor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Subject Name */}
            <div className="space-y-1">
              <Label htmlFor="subjectName">Subject Name *</Label>
              <Input
                id="subjectName"
                placeholder="e.g. AWS Developer Associate"
                {...register("subjectName")}
              />
              {errors.subjectName && (
                <p className="text-destructive text-xs">
                  {errors.subjectName.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn..."
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-destructive text-xs">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Course Image URL */}
            <div className="space-y-1">
              <Label htmlFor="courseImageUrl">Course Image URL</Label>
              <Input
                id="courseImageUrl"
                placeholder="https://example.com/image.png"
                {...register("courseImageUrl")}
              />
              {errors.courseImageUrl && (
                <p className="text-destructive text-xs">
                  {errors.courseImageUrl.message}
                </p>
              )}
            </div>

            {/* Mentor Dropdown — uses setValue because Select is a controlled component */}
            <div className="space-y-1">
              <Label>Assign to Mentor *</Label>
              <Select
                onValueChange={(val) =>
                  setValue("mentorId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a mentor..." />
                </SelectTrigger>
                <SelectContent>
                  {mentors.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.firstName} {m.lastName} — {m.profession}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mentorId && (
                <p className="text-destructive text-xs">
                  {errors.mentorId.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Subject"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}