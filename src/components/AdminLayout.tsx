import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet, Link, useLocation } from "react-router";
import { LayoutDashboard, Users, BookOpen, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Sidebar nav items — each maps to an admin route
const NAV_ITEMS = [
  { label: "Overview",        href: "/admin",          icon: LayoutDashboard },
  { label: "Create Mentor",   href: "/admin/mentors",  icon: Users },
  { label: "Create Subject",  href: "/admin/subjects", icon: BookOpen },
  { label: "Manage Bookings", href: "/admin/bookings", icon: CalendarCheck },
];

export default function AdminLayout() {
  const { user, isLoaded } = useUser();

  // Wait for Clerk to finish loading before checking the role
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Read the role from Clerk publicMetadata
  // If not admin, redirect to the student dashboard
    const role = (user?.publicMetadata as { role?: string | string[] })?.role;
    const isAdmin = role === "admin" || (Array.isArray(role) && role.some(r => r.toLowerCase() === "admin"));
    if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-muted/30 flex flex-col py-6 px-3 shrink-0">
        <p className="text-xs font-semibold uppercase text-muted-foreground px-3 mb-3 tracking-wider">
          Admin Panel
        </p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <SidebarLink key={href} href={href} label={label} Icon={Icon} />
          ))}
        </nav>
      </aside>

      {/* Main content — renders whichever child route is active */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Individual sidebar link — highlights when the route is active
function SidebarLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
}) {
  const { pathname } = useLocation();

  // Overview only highlights on exact /admin
  // Other links highlight when the path starts with their href
  const isActive =
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}