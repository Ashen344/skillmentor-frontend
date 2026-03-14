import { BrowserRouter, Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import AdminLayout from "@/components/AdminLayout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PaymentPage from "@/pages/PaymentPage";
import MentorProfilePage from "@/pages/MentorProfilePage";
import AdminOverviewPage from "@/pages/admin/AdminOverviewPage";
import CreateSubjectPage from "@/pages/admin/CreateSubjectPage";
import CreateMentorPage from "@/pages/admin/CreateMentorPage";
import ManageBookingsPage from "@/pages/admin/ManageBookingsPage";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public & student routes ── */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />

        {/* Mentor profile page — public, no auth needed */}
        <Route
          path="/mentors/:id"
          element={<Layout><MentorProfilePage /></Layout>}
        />

        <Route
          path="/dashboard"
          element={
            <Layout>
              <SignedIn><DashboardPage /></SignedIn>
              <SignedOut><LoginPage /></SignedOut>
            </Layout>
          }
        />
        <Route
          path="/payment/:sessionId"
          element={
            <Layout>
              <SignedIn><PaymentPage /></SignedIn>
              <SignedOut><LoginPage /></SignedOut>
            </Layout>
          }
        />

        {/* ── Admin routes ── */}
        <Route
          path="/admin"
          element={
            <Layout>
              <SignedIn><AdminLayout /></SignedIn>
              <SignedOut><LoginPage /></SignedOut>
            </Layout>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="mentors" element={<CreateMentorPage />} />
          <Route path="subjects" element={<CreateSubjectPage />} />
          <Route path="bookings" element={<ManageBookingsPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Layout><LoginPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;