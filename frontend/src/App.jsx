import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ProfileForm from "./pages/ProfileForm";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import CollegeDetailsPage from "./pages/CollegeDetailsPage";
import ScholarshipsPage from "./pages/ScholarshipsPage";
import CapSimulatorPage from "./pages/CapSimulatorPage";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4 text-center bg-light">
          <div className="card shadow-sm p-4 border-0" style={{ maxWidth: 500 }}>
            <h4 className="fw-bold text-danger mb-2">Something went wrong</h4>
            <p className="text-muted small mb-3">
              An error occurred while loading this view:
            </p>
            <div className="alert alert-danger text-start small font-monospace mb-4">
              {this.state.error?.message || String(this.state.error)}
            </div>
            <button
              className="btn btn-primary fw-semibold"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <ErrorBoundary>
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
            <ChatPage
              studentProfile={studentProfile}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          }
        />

        {/* 7. Dedicated National & Private Scholarships Directory */}
        <Route
          path="/scholarships"
          element={
            <ScholarshipsPage
              studentProfile={studentProfile}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          }
        />

        {/* 8. Maharashtra CAP Round Option Form & Cutoff Simulator */}
        <Route
          path="/cap-simulator"
          element={
            <CapSimulatorPage
              studentProfile={studentProfile}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          }
        />

        {/* Backwards compatibility */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  </Router>
);
}
