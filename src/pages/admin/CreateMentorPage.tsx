import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/hooks/use-toast";
import { createMentor } from "@/lib/api";

// Zod schema — all mentor fields, required ones will error, optional ones won't
const mentorSchema = z.object({
  mentorId: z.string().min(1, "Clerk user ID is required (from Clerk dashboard)"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Must be a valid email"),
  phoneNumber: z.string().max(20).optional().or(z.literal("")),
  title: z.string().max(100).optional().or(z.literal("")),
  profession: z.string().max(100).optional().or(z.literal("")),
  company: z.string().max(100).optional().or(z.literal("")),
  experienceYears: z.coerce.number().min(0).max(50).optional(),
  bio: z.string().max(500).optional().or(z.literal("")),
  profileImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  positiveReviews: z.coerce.number().min(0).max(100).optional(),
  totalEnrollments: z.coerce.number().min(0).optional(),
  isCertified: z.boolean().optional(),
  startYear: z.string().max(10).optional().or(z.literal("")),
});

type MentorFormValues = z.infer<typeof mentorSchema>;

export default function CreateMentorPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MentorFormValues>({
    resolver: zodResolver(mentorSchema),
    defaultValues: { isCertified: false, experienceYears: 0 },
  });

  // Watch all form values to power the live preview card on the right
  const watched = watch();

  const onSubmit = async (values: MentorFormValues) => {
    setIsSubmitting(true);
    try {
      const token = await getToken({ template: "skillmentor-auth" });
      if (!token) throw new Error("Not authenticated");

      await createMentor(token, {
        ...values,
        // Convert empty strings to undefined so the backend ignores them
        phoneNumber: values.phoneNumber || undefined,
        title: values.title || undefined,
        profession: values.profession || undefined,
        company: values.company || undefined,
        bio: values.bio || undefined,
        profileImageUrl: values.profileImageUrl || undefined,
        startYear: values.startYear || undefined,
      });

      toast({
        title: "Mentor created!",
        description: `${values.firstName} ${values.lastName} has been added.`,
      });
      navigate("/admin");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Error creating mentor",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form — takes 2/3 of the width on large screens */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Mentor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add a new mentor to the platform. The Mentor ID must match their
            Clerk user ID.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Identity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="mentorId">Clerk User ID *</Label>
                <Input
                  id="mentorId"
                  placeholder="user_xxxxxxxxxxxxxxxx"
                  {...register("mentorId")}
                />
                <p className="text-xs text-muted-foreground">
                  Found in the Clerk dashboard under Users.
                </p>
                {errors.mentorId && (
                  <p className="text-destructive text-xs">
                    {errors.mentorId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" {...register("firstName")} />
                  {errors.firstName && (
                    <p className="text-destructive text-xs">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" {...register("lastName")} />
                  {errors.lastName && (
                    <p className="text-destructive text-xs">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-destructive text-xs">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+1 555 000 0000"
                  {...register("phoneNumber")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Professional Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Senior Software Engineer"
                    {...register("title")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    placeholder="Cloud Engineer"
                    {...register("profession")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Amazon"
                    {...register("company")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min={0}
                    {...register("experienceYears")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="startYear">Tutoring Since (Year)</Label>
                  <Input
                    id="startYear"
                    placeholder="2020"
                    {...register("startYear")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="positiveReviews">Positive Reviews %</Label>
                  <Input
                    id="positiveReviews"
                    type="number"
                    min={0}
                    max={100}
                    {...register("positiveReviews")}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell students about this mentor..."
                  rows={3}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-destructive text-xs">
                    {errors.bio.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile & Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile & Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                <Input
                  id="profileImageUrl"
                  placeholder="https://example.com/photo.jpg"
                  {...register("profileImageUrl")}
                />
                {errors.profileImageUrl && (
                  <p className="text-destructive text-xs">
                    {errors.profileImageUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="totalEnrollments">Total Enrollments</Label>
                <Input
                  id="totalEnrollments"
                  type="number"
                  min={0}
                  defaultValue={0}
                  {...register("totalEnrollments")}
                />
              </div>

              {/* Checkbox is a controlled component so we use setValue instead of register */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isCertified"
                  checked={watched.isCertified}
                  onCheckedChange={(checked) =>
                    setValue("isCertified", Boolean(checked))
                  }
                />
                <Label htmlFor="isCertified" className="cursor-pointer">
                  Certified Teacher
                </Label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating mentor..." : "Create Mentor"}
          </Button>
        </form>
      </div>

      {/* Live preview — updates as you type, only visible on large screens */}
      <div className="hidden lg:block">
        <p className="text-sm font-medium text-muted-foreground mb-3">
          Live Preview
        </p>
        <Card className="sticky top-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              {watched.profileImageUrl ? (
                <img
                  src={watched.profileImageUrl}
                  alt="Preview"
                  className="size-12 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="size-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                  {watched.firstName?.charAt(0) ?? "?"}
                </div>
              )}
              <div>
                <p className="font-semibold">
                  {watched.firstName || "First"} {watched.lastName || "Last"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {watched.title || "Title"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {watched.company || "Company"} · {watched.experienceYears ?? 0}{" "}
              yrs
            </p>
            {watched.bio && (
              <p className="text-xs line-clamp-3">{watched.bio}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              {watched.isCertified && (
                <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                  ✓ Certified
                </span>
              )}
              {watched.positiveReviews != null && (
                <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                  👍 {watched.positiveReviews}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}