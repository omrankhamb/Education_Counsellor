import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ProfileForm from "./pages/ProfileForm";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import CollegeDetailsPage from "./pages/CollegeDetailsPage";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("edu_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    if (user?.profile) {
      setStudentProfile(user.profile);
      localStorage.setItem("edu_student_profile", JSON.stringify(user.profile));
    }
  };

  const handleProfileSubmit = (profile) => {
    setStudentProfile(profile);
    localStorage.setItem("edu_student_profile", JSON.stringify(profile));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStudentProfile(null);
    localStorage.removeItem("edu_user");
    localStorage.removeItem("edu_student_profile");
  };

  return (
    <Router>
      <Routes>
        {/* 1. Landing Page */}
        <Route
          path="/"
          element={
            <LandingPage
              studentProfile={studentProfile}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          }
        />

        {/* 2. Authentication: Sign In / Sign Up */}
        <Route
          path="/login"
          element={<AuthPage onAuthSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/register"
          element={<AuthPage onAuthSuccess={handleAuthSuccess} />}
        />

        {/* 3. Academic Profile Setup / Edit */}
        <Route
          path="/profile"
          element={
            <ProfileForm
              onSubmit={handleProfileSubmit}
              existingProfile={studentProfile}
            />
          }
        />

        {/* 4. Student Recommendation Dashboard */}
        <Route
          path="/dashboard"
          element={
            studentProfile ? (
              <Dashboard
                studentProfile={studentProfile}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 5. Detailed College View & Branch Cutoffs */}
        <Route
          path="/college-details"
          element={<CollegeDetailsPage studentProfile={studentProfile} />}
        />

        {/* 6. AI Education Counselor Chat */}
        <Route
          path="/chat"
          element={
            studentProfile ? (
              <ChatPage
                studentProfile={studentProfile}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Backwards compatibility */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
