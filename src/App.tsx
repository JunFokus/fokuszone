import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NavBar from "@/components/NavBar";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Quiz from "./pages/Quiz";
import QuizHistory from "./pages/QuizHistory";
import Settings from "./pages/Settings";
import Flashcards from "./pages/Flashcards";
import Summary from "./pages/Summary";
import Notes from "./pages/Notes";
import AdminSubjects from "./pages/AdminSubjects";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-4xl text-primary">●</div>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <>
      <NavBar />
      {children}
    </>
  );
};

const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-4xl text-primary">●</div>
    </div>
  );
  if (user) return (
    <>
      <NavBar />
      <Index />
    </>
  );
  return <Landing />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<HomeRoute />} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><QuizHistory /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
              <Route path="/summary" element={<ProtectedRoute><Summary /></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/admin/subjects" element={<ProtectedRoute><AdminSubjects /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
