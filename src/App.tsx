import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Auth Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Pricing from "./pages/Pricing";

// Student Pages
import StudentDashboard from "./pages/Home";
import StepByStep from "./pages/StepByStep";
import Practice from "./pages/Practice";
import Exercise from "./pages/Exercise";
import VideoLibrary from "./pages/VideoLibrary";
import NotFound from "./pages/NotFound";

// Parent Pages
import ParentDashboard from "./pages/ParentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Main Entry - Landing Page */}
              <Route path="/" element={<Landing />} />

              {/* Auth Pages */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/pricing" element={<Pricing />} />

              {/* Student Routes (protected) */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/learn"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StepByStep />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Practice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exercice"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Exercise />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/video-library"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <VideoLibrary />
                  </ProtectedRoute>
                }
              />

              {/* Parent Routes (protected) */}
              <Route
                path="/parent/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
