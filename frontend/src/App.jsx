import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ProfileForm from "./pages/ProfileForm";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import CollegeDetailsPage from "./pages/CollegeDetailsPage";

export default function App() {
  const [studentProfile, setStudentProfile] = useState(() => {
    const saved = localStorage.getItem("edu_student_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleProfileSubmit = (profile) => {
    setStudentProfile(profile);
    localStorage.setItem("edu_student_profile", JSON.stringify(profile));
  };

  return (
    <Router>
      <Routes>
        {/* 1. Landing Page with Header, Carousel Slider, Featured College Cards & Footer */}
        <Route
          path="/"
          element={<LandingPage studentProfile={studentProfile} />}
        />

        {/* 2. Login / Profile Form */}
        <Route
          path="/login"
          element={<ProfileForm onSubmit={handleProfileSubmit} existingProfile={studentProfile} />}
        />
        <Route
          path="/profile"
          element={<ProfileForm onSubmit={handleProfileSubmit} existingProfile={studentProfile} />}
        />

        {/* 3. Student Dashboard (Post-Login / Submission) */}
        <Route
          path="/dashboard"
          element={
            studentProfile ? (
              <Dashboard studentProfile={studentProfile} />
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />

        {/* 4. Dedicated College Details & Domain/Branch Cutoffs Page (NEW!) */}
        <Route
          path="/college-details"
          element={<CollegeDetailsPage studentProfile={studentProfile} />}
        />

        {/* 5. Dedicated AI Counselor Chat */}
        <Route
          path="/chat"
          element={
            studentProfile ? (
              <ChatPage studentProfile={studentProfile} />
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />

        {/* Backwards compatibility route */}
        <Route
          path="/app"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
