import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getAllSessions, updateSession, type AdminSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Which column to sort by
type SortKey = keyof Pick<AdminSession, "sessionAt" | "studentName" | "mentorName" | "paymentStatus" | "sessionStatus">;

export default function ManageBookingsPage() {
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("sessionAt");
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Meeting link dialog state
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; sessionId: number | null }>({ open: false, sessionId: null });
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Load all sessions on mount
  useEffect(() => {
    async function load() {
      try {
        const token = await getToken({ template: "skillmentor-auth" });
        if (!token) return;
        const data = await getAllSessions(token);
        setSessions(data);
      } catch {
        toast({ title: "Failed to load sessions", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Apply search + status filter, then sort, then paginate
  const filtered = useMemo(() => {
    let result = sessions;

    // Text search on student or mentor name
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.mentorName.toLowerCase().includes(q)
      );
    }

    // Filter tabs check BOTH paymentStatus and sessionStatus
    if (statusFilter !== "all") {
      result = result.filter(
        (s) => s.paymentStatus === statusFilter || s.sessionStatus === statusFilter
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      return sortAsc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });

    return result;
  }, [sessions, search, statusFilter, sortKey, sortAsc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Toggle sort column
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev); // flip direction
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
    setPage(0);
  }

  // Helper — calls the API and updates local state so the table refreshes immediately
  async function doUpdate(sessionId: number, patch: { paymentStatus?: string; sessionStatus?: string; meetingLink?: string }) {
    setSaving(true);
    try {
      const token = await getToken({ template: "skillmentor-auth" });
      if (!token) throw new Error("Not authenticated");
      await updateSession(token, sessionId, patch);
      // Merge patch directly so the row re-renders immediately regardless of response shape
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, ...patch } : s))
      );
      toast({ title: "Session updated" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function confirmPayment(id: number) {
    doUpdate(id, { paymentStatus: "confirmed" });
  }

  function markComplete(id: number) {
    doUpdate(id, { sessionStatus: "completed" });
  }

  function cancelSession(id: number) {
    doUpdate(id, { sessionStatus: "cancelled", paymentStatus: "cancelled" });
  }

  function openLinkDialog(id: number) {
    setLinkDialog({ open: true, sessionId: id });
    setMeetingLinkInput("");
  }

  async function saveMeetingLink() {
    if (!linkDialog.sessionId || !meetingLinkInput.trim()) return;
    await doUpdate(linkDialog.sessionId, { meetingLink: meetingLinkInput.trim() });
    setLinkDialog({ open: false, sessionId: null });
  }

  // Badge colour based on payment status
  function paymentBadge(status: string) {
    const classes: Record<string, string> = {
      pending:   "bg-yellow-100 text-yellow-800 border border-yellow-300",
      confirmed: "bg-green-100  text-green-800  border border-green-300",
      completed: "bg-green-100  text-green-800  border border-green-300",
      cancelled: "bg-red-100    text-red-800    border border-red-300",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes[status] ?? "bg-gray-100 text-gray-700 border border-gray-300"}`}>
        {status}
      </span>
    );
  }

  // Badge colour based on session status
  function sessionBadge(status: string) {
    const classes: Record<string, string> = {
      scheduled: "bg-blue-100  text-blue-800  border border-blue-300",
      completed: "bg-green-100 text-green-800 border border-green-300",
      cancelled: "bg-gray-100  text-gray-600  border border-gray-300",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes[status] ?? "bg-gray-100 text-gray-700 border border-gray-300"}`}>
        {status}
      </span>
    );
  }

  // Column header button — shows sort arrow when active
  function SortButton({ label, sortKeyVal }: { label: string; sortKeyVal: SortKey }) {
    return (
      <button
        onClick={() => handleSort(sortKeyVal)}
        className="flex items-center gap-1 font-semibold hover:text-primary"
      >
        {label}
        {sortKey === sortKeyVal && (sortAsc ? " ↑" : " ↓")}
      </button>
    );
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading sessions...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Bookings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {sessions.length} total sessions
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search by student or mentor..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="max-w-xs"
        />
        {/* Payment status filter buttons */}
        {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => { setStatusFilter(s); setPage(0); }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-3 py-3 text-left">ID</th>
              <th className="px-3 py-3 text-left"><SortButton label="Student" sortKeyVal="studentName" /></th>
              <th className="px-3 py-3 text-left"><SortButton label="Mentor" sortKeyVal="mentorName" /></th>
              <th className="px-3 py-3 text-left">Subject</th>
              <th className="px-3 py-3 text-left"><SortButton label="Date" sortKeyVal="sessionAt" /></th>
              <th className="px-3 py-3 text-left">Duration</th>
              <th className="px-3 py-3 text-left"><SortButton label="Payment" sortKeyVal="paymentStatus" /></th>
              <th className="px-3 py-3 text-left"><SortButton label="Status" sortKeyVal="sessionStatus" /></th>
              <th className="px-3 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-muted-foreground">
                  No sessions found.
                </td>
              </tr>
            ) : (
              paginated.map((session) => (
                <tr key={session.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">#{session.id}</td>
                  <td className="px-3 py-3">
                    <div>{session.studentName}</div>
                    <div className="text-xs text-muted-foreground">{session.studentEmail}</div>
                  </td>
                  <td className="px-3 py-3">{session.mentorName}</td>
                  <td className="px-3 py-3">{session.subjectName}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {new Date(session.sessionAt).toLocaleDateString()}{" "}
                    <span className="text-muted-foreground text-xs">
                      {new Date(session.sessionAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-3 py-3">{session.durationMinutes}m</td>
                  <td className="px-3 py-3">{paymentBadge(session.paymentStatus)}</td>
                  <td className="px-3 py-3">{sessionBadge(session.sessionStatus)}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {/* Confirm payment — only for pending sessions */}
                      {session.paymentStatus === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => confirmPayment(session.id)}
                        >
                          Confirm Payment
                        </Button>
                      )}
                      {/* Mark complete — only for confirmed/scheduled sessions */}
                      {session.sessionStatus !== "completed" && session.paymentStatus === "confirmed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => markComplete(session.id)}
                        >
                          Mark Complete
                        </Button>
                      )}
                      {/* Add meeting link */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openLinkDialog(session.id)}
                      >
                        {session.meetingLink ? "Edit Link" : "Add Link"}
                      </Button>
                      {/* Cancel — only for non-cancelled sessions */}
                      {session.sessionStatus !== "cancelled" && session.paymentStatus !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={saving}
                          onClick={() => cancelSession(session.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            ← Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
            Next →
          </Button>
        </div>
      )}

      {/* Meeting link dialog */}
      <Dialog open={linkDialog.open} onOpenChange={(open) => setLinkDialog({ open, sessionId: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Meeting Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="meetingLink">Meeting URL</Label>
            <Input
              id="meetingLink"
              placeholder="https://meet.google.com/xyz-abc-def"
              value={meetingLinkInput}
              onChange={(e) => setMeetingLinkInput(e.target.value)}
            />
            <Button className="w-full" onClick={saveMeetingLink} disabled={saving || !meetingLinkInput.trim()}>
              {saving ? "Saving..." : "Save Link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
