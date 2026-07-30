import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Moon, Sun, Menu, X,FileText, LayoutDashboard, Trophy , MessageCircle , Zap  } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface NavbarProps {
  isLoggedIn?: boolean;
  userName?: string;
  userAvatar?: string;
}

const Navbar = ({ isLoggedIn = false, userName = "Học viên", userAvatar }: NavbarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/");
  };

  const avatarUrl = userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=a855f7&color=fff&rounded=true`;

  return (
    <header className="fixed top-0 w-full h-16 z-50 glass-card border-b border-border backdrop-blur-xl">
      <div className="container h-full mx-auto flex items-center justify-between px-4 md:px-8">
        {/* Logo — về dashboard nếu đã login, về landing nếu chưa */}
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 tracking-widest font-bold text-xl">
          <span className="text-foreground">VULN</span>
          <span className="text-primary">LAB</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {isLoggedIn && (
            <>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/learning" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Học tập
              </Link>
              <Link to="/exams" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Exam
              </Link>
              <Link to="/subscription" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Subscription
              </Link>
              <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
		  Chat
		</Link>
		<Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
		  Leaderboard
		</Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Profile
              </Link>
            </>
          )}

          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
            title={isDark ? "Chế độ sáng" : "Chế độ tối"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary/50 transition-all"
              >
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border-2 border-primary object-cover"
                  style={{ boxShadow: "0 0 10px hsl(var(--neon-purple) / 0.4)" }}
                />
                <span className="text-sm font-medium text-foreground hidden lg:block">{userName}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-52 glass-card rounded-lg border shadow-xl overflow-hidden"
                  style={{ animation: "scale-in 0.2s ease-out" }}>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} />
                    Trang cá nhân
                  </Link>
                  <Link
                    to="/exams"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FileText size={16} />
                    Kiểm tra
                  </Link>
		  <Link
		  to="/subscription"
		  className="flex items-center gap-3 px-4 py-3 text-sm text-primary font-bold hover:bg-accent transition-colors"
		  onClick={() => setDropdownOpen(false)}
		>
		  <Zap size={16} className="fill-current" />
		  Đăng ký
		</Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    Trang chủ
                  </Link>
		  <Link
                    to="/leaderboard"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Trophy size={16} />
                    BXH
                  </Link>
		  <Link
                    to="/chat"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <MessageCircle size={16} />
                    Trao đổi
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    Cài đặt
                  </Link>
                  <div className="border-t border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="gradient-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Đăng nhập
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-border p-4 space-y-3">
          {isLoggedIn && (
            <>
              <Link to="/dashboard" className="block py-2 text-foreground" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/learning" className="block py-2 text-foreground" onClick={() => setMobileMenuOpen(false)}>Học tập</Link>
              <Link to="/profile" className="block py-2 text-foreground" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
            </>
          )}
          <button onClick={toggle} className="flex items-center gap-2 py-2 text-foreground">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? "Chế độ sáng" : "Chế độ tối"}
          </button>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="text-destructive py-2">Đăng xuất</button>
          ) : (
            <Link to="/login" className="block py-2 text-primary font-semibold" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
