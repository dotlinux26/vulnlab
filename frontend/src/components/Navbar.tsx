import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Moon, Sun, Menu, X, FileText, LayoutDashboard, Trophy, MessageCircle, Zap, BookOpen } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface NavbarProps {
  isLoggedIn?: boolean;
  userName?: string;
  userAvatar?: string;
}

const navLinks = [
  { to: "/dashboard", label: "Dashboard", vn: "Trang chủ", icon: LayoutDashboard },
  { to: "/learning", label: "Learning", vn: "Học tập", icon: BookOpen },
  { to: "/exams", label: "Exam", vn: "Kiểm tra", icon: FileText },
  { to: "/subscription", label: "Subscription", vn: "Đăng ký", icon: Zap },
  { to: "/chat", label: "Chat", vn: "Trao đổi", icon: MessageCircle },
  { to: "/leaderboard", label: "Leaderboard", vn: "BXH", icon: Trophy },
  { to: "/profile", label: "Profile", vn: "Hồ sơ", icon: User },
];

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
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 tracking-widest font-bold text-xl">
          <span className="text-foreground">VULN</span>
          <span className="text-primary">LAB</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {isLoggedIn && navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}

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
                <div className="absolute right-0 top-12 w-56 glass-card rounded-lg border shadow-xl overflow-hidden"
                  style={{ animation: "scale-in 0.2s ease-out" }}>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Icon size={16} />
                        <span>{link.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{link.vn}</span>
                      </Link>
                    );
                  })}
                  <div className="border-t border-border" />
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    Settings
                    <span className="text-xs text-muted-foreground ml-auto">Cài đặt</span>
                  </Link>
                  <div className="border-t border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                  >
                    <LogOut size={16} />
                    Logout
                    <span className="text-xs ml-auto">Đăng xuất</span>
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

        <button className="md:hidden p-2 text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-border max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 space-y-1">
            {isLoggedIn && navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} className="text-primary" />
                  <span className="font-medium">{link.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{link.vn}</span>
                </Link>
              );
            })}
            <div className="border-t border-border my-2" />
            <button onClick={toggle} className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-foreground hover:bg-accent transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              <span className="text-xs text-muted-foreground ml-auto">{isDark ? "Chế độ sáng" : "Chế độ tối"}</span>
            </button>
            {isLoggedIn ? (
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut size={18} />
                <span>Logout</span>
                <span className="text-xs ml-auto">Đăng xuất</span>
              </button>
            ) : (
              <Link to="/login" className="block px-3 py-3 text-primary font-semibold" onClick={() => setMobileMenuOpen(false)}>Đăng nhập</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
