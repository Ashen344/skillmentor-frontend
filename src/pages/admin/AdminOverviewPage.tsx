import { useUser } from "@clerk/clerk-react";
import { Users, BookOpen, CalendarCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Quick-action cards shown on the admin home screen
const QUICK_ACTIONS = [
  {
    title: "Create Mentor",
    description: "Add a new mentor profile to the platform",
    href: "/admin/mentors",
    icon: Users,
  },
  {
    title: "Create Subject",
    description: "Add a new course/subject and link it to a mentor",
    href: "/admin/subjects",
    icon: BookOpen,
  },
  {
    title: "Manage Bookings",
    description: "View all sessions, confirm payments, add meeting links",
    href: "/admin/bookings",
    icon: CalendarCheck,
  },
];

export default function AdminOverviewPage() {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your SkillMentor platform from here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map(({ title, description, href, icon: Icon }) => (
          <Card key={href} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
              <Link to={href}>
                <Button size="sm" variant="outline" className="w-full gap-1">
                  Go <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}