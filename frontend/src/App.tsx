import { LanguageProvider } from "@/contexts/LanguageContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"; // Thêm Navigate
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LabDetail from "./pages/LabDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import VoucherManager from "./pages/VoucherManager";
import ExamPage from "./pages/ExamPage";
import Leaderboard from "./pages/Leaderboard";
import VerifyCert from "./pages/VerifyCert";
import CheckOutCert from "./pages/CheckOutCert";
import ExamDetailPage from "./pages/ExamDetailPage";
import Chat from "./pages/Chat.tsx";
import Subscription from './pages/Subscription';
import Learning from "./pages/Learning";
import LearningDetail from "./pages/LearningDetail";

const queryClient = new QueryClient();

// Hàm chặn bảo vệ Route
// Thêm prop requireAdmin vào đây
const ProtectedRoute = ({ children, requireAdmin = false }: { children: JSX.Element, requireAdmin?: boolean }) => {
    const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
    // Sếp lưu ý: Cần lưu thêm role của user lúc login thành công nhé!
    const userRole = localStorage.getItem("user_role") || "user"; 

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // Nếu trang này bắt buộc Admin mà Role lại không phải là admin -> Đá về Dashboard
    if (requireAdmin && userRole !== "admin") {
        alert("🛑 KHU VỰC CẤM: Bạn không có quyền Quản trị viên!");
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};


const App = () => (
  <GoogleOAuthProvider clientId="781426076194-r24limofujo7la0biar2b15fbvcu00jl.apps.googleusercontent.com">
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Đã bọc bảo vệ */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/lab/:id" element={<ProtectedRoute><LabDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            {/* Cập nhật lại dòng này */}
	    <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />

            {/* Mở đường cho trang Quản lý Voucher sắp tới sếp làm */}
	    <Route path="/admin/vouchers" element={<ProtectedRoute requireAdmin={true}><VoucherManager /></ProtectedRoute>} />
	    <Route path="/exams" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/exams/:id" element={<ProtectedRoute><ExamDetailPage /></ProtectedRoute>} />
            <Route path="/verify/:hash" element={<VerifyCert />} />
            <Route path="/checkout-cert/:hash" element={<CheckOutCert />} />
            <Route path="/learning" element={<ProtectedRoute><Learning /></ProtectedRoute>} />
            <Route path="/learning/:id" element={<ProtectedRoute><LearningDetail /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
