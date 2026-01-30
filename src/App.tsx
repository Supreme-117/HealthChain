import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueueProvider } from "@/context/QueueContext";
import { Header } from "@/components/layout/Header";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import Landing from "./pages/Landing";
import PatientRegistration from "./pages/PatientRegistration";
import QueueView from "./pages/QueueView";
import StaffDashboard from "./pages/StaffDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import MedicineDashboard from "./pages/MedicineDashboard";
import ReceiptPage from "./pages/ReceiptPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <QueueProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OfflineBanner />
          <Header />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<PatientRegistration />} />
            <Route path="/queue" element={<QueueView />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/medicine" element={<MedicineDashboard />} />
            <Route path="/receipt/:id" element={<ReceiptPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </QueueProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
