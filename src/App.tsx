import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import ScenarioSelect from "./pages/ScenarioSelect";
import RolePlaySetup from "./pages/RolePlaySetup";
import Conversation from "./pages/Conversation";
import SessionRecap from "./pages/SessionRecap";
import WarmupHub from "./pages/WarmupHub";
import WarmupExercises from "./pages/WarmupExercises";
import EyeContactTrainer from "./pages/EyeContactTrainer";
import FillerWordTrainer from "./pages/FillerWordTrainer";
import StoryLibrary from "./pages/StoryLibrary";
import StoryDetail from "./pages/StoryDetail";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (!profile?.onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
      <Route path="/scenarios" element={<RequireAuth><ScenarioSelect /></RequireAuth>} />
      <Route path="/roleplay-setup" element={<RequireAuth><RolePlaySetup /></RequireAuth>} />
      <Route path="/conversation" element={<RequireAuth><Conversation /></RequireAuth>} />
      <Route path="/recap" element={<RequireAuth><SessionRecap /></RequireAuth>} />
      <Route path="/warmup" element={<RequireAuth><WarmupHub /></RequireAuth>} />
      <Route path="/warmup/exercises" element={<RequireAuth><WarmupExercises /></RequireAuth>} />
      <Route path="/warmup/eye-contact" element={<RequireAuth><EyeContactTrainer /></RequireAuth>} />
      <Route path="/warmup/filler" element={<RequireAuth><FillerWordTrainer /></RequireAuth>} />
      <Route path="/stories" element={<RequireAuth><StoryLibrary /></RequireAuth>} />
      <Route path="/stories/:id" element={<RequireAuth><StoryDetail /></RequireAuth>} />
      <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
