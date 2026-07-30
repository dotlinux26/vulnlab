import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertTriangle } from "lucide-react";
import ShootingStars from "@/components/ShootingStars";
import EclipseOrb from "@/components/EclipseOrb";
import { useGoogleLogin } from "@react-oauth/google";

interface AuthResponse {
    success: boolean;
    message?: string;
    user: {
        name: string;
        email: string;
        role?: string; 
    };
}

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showTroll, setShowTroll] = useState(false);
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });

        const data: AuthResponse = await res.json();
	if (data.success) {
	    localStorage.setItem("user_name", data.user.name);
	    localStorage.setItem("is_logged_in", "true");
	    localStorage.setItem("user_role", data.user.role || "student"); 
	    
	    navigate("/dashboard");
	}        

        else {
          alert(`Lỗi từ Server: ${data.message}`);
          console.error("Lỗi chi tiết:", data);
        }
      } catch (error) {
        console.error("Lỗi kết nối mạng hoặc API:", error);
        alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra console.");
      }
    },
    flow: "implicit",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowTroll(true);
    // Troll: email registration is fake
    setTimeout(() => setShowTroll(false), 5000);
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden px-4">
      <ShootingStars />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30">
        <EclipseOrb size="lg" />
      </div>

      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Trang chủ</span>
      </Link>

      <div className="relative z-10 w-full max-w-md glass-card rounded-2xl p-8 border">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wider mb-2">
            <span className="text-foreground">VULN</span>
            <span className="text-primary">LAB</span>
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            {isSignUp ? "Đăng ký tài khoản" : "Training System"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 pl-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-accent/50 border border-border rounded-lg px-4 py-3 pl-10 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            {isSignUp ? "Đăng ký" : "Đăng nhập"}
          </button>

          {showTroll && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs" style={{ animation: "fade-in-up 0.3s ease-out" }}>
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Tính năng này chỉ để troll thôi :))</p>
                <p>Đăng ký email là giả đó, đừng nhập mật khẩu thật vào. Dùng <strong>Google</strong> bên dưới để đăng nhập thật nhé!</p>
              </div>
            </div>
          )}
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-xs">HOẶC</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={() => googleLogin()}
          className="w-full border border-border rounded-lg py-3 flex items-center justify-center gap-3 text-foreground hover:bg-accent transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20.1H42V20H24v8h11.3C33.9 33.4 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.6-.4-3.9z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.3 15.8 18.8 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 35.1 26.8 36 24 36c-5.3 0-9.8-3.6-11.3-8.5l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C37 39.1 44 34 44 24c0-1.3-.2-2.6-.4-3.9z"
            />
          </svg>
          Đăng nhập với Google
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline font-medium"
          >
            {isSignUp ? "Đăng nhập" : "Đăng ký ngay"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

