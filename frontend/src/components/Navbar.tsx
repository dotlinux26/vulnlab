import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Moon, Sun, Menu, X, FileText, LayoutDashboard, Trophy, MessageCircle, Zap, BookOpen, Languages, Bell, Check, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from "@/services/api";

interface NavbarProps {
  isLoggedIn?: boolean;
  userName?: string;
  userAvatar?: string;
}

const navLinks = [
  { to: "/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
  { to: "/learning", icon: BookOpen, key: "nav.learning" },
  { to: "/exams", icon: FileText, key: "nav.exam" },
  { to: "/subscription", icon: Zap, key: "nav.subscription" },
  { to: "/chat", icon: MessageCircle, key: "nav.chat" },
  { to: "/leaderboard", icon: Trophy, key: "nav.leaderboard" },
  { to: "/profile", icon: User, key: "nav.profile" },
];

const otherLang = { vi: "en", en: "vi" } as const;

const Navbar = ({ isLoggedIn = false, userName = "Học viên", userAvatar }: NavbarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fetchedAvatar, setFetchedAvatar] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { isDark, toggle } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();

  // Fetch notifications on mount and when dropdown opens
  const loadNotifications = async (unreadOnly = false) => {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      const data = await fetchNotifications(10, 0, unreadOnly);
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) loadNotifications();
  }, [isLoggedIn]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load avatar
  useEffect(() => {
    const stored = localStorage.getItem("user_picture");
    if (stored) { setFetchedAvatar(stored); return; }
    if (!isLoggedIn || userAvatar) return;
    fetch("/api/profile", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.picture) {
          localStorage.setItem("user_picture", d.picture);
          setFetchedAvatar(d.picture);
        }
      })
      .catch(() => {});
  }, [isLoggedIn, userAvatar]);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/");
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const avatarUrl = userAvatar || localStorage.getItem("user_picture") || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=a855f7&color=fff&rounded=true`;

  return (
    <header className="fixed top-0 w-full h-16 z-50 glass-card border-b border-border backdrop-blur-xl">
      <div className="container h-full mx-auto flex items-center justify-between px-4 md:px-8">
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 tracking-widest font-bold text-xl">
          <img src="/logo.svg" alt="D.O.T Solutions" className="w-7 h-7" />
          <span>
            <span className="brand-vuln">VULN</span>
            <span className="brand-gradient">LAB</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {isLoggedIn && navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {t(link.key)}
            </Link>
          ))}

          <button
            onClick={toggleLang}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
            title={lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
          >
            <Languages size={18} />
          </button>

          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
            title={t("theme." + (isDark ? "light" : "dark"))}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); if (notifOpen) loadNotifications(); }}
                  className="relative p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  title={t("nav.notifications")}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 glass-card rounded-lg border shadow-xl overflow-hidden"
                    style={{ animation: "scale-in 0.2s ease-out" }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <h3 className="font-semibold text-foreground">{t("nav.notifications")}</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary hover:underline"
                          >
                            {t("nav.markAllRead")}
                          </button>
                        )}
                        <button
                          onClick={() => { setNotifOpen(false); loadNotifications(true); }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {t("nav.showUnreadOnly")}
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifLoading ? (
                        <div className="p-4 flex justify-center">
                          <Loader2 size={20} className="animate-spin text-primary" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          {t("nav.noNotifications")}
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => handleMarkRead(notif.id)}
                              className={`w-full p-3 text-left hover:bg-accent transition-colors ${!notif.read ? 'bg-accent/30' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                <div className="flex-1 min-w-0 text-sm">
                                  <p className={`text-foreground ${!notif.read ? 'font-medium' : ''}`}>{notif.message}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {new Date(notif.createdAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="border-t border-border p-2 text-center">
                        <button
                          onClick={() => loadNotifications(false)}
                          className="text-xs text-primary hover:underline w-full py-1"
                        >
                          {t("nav.loadMore")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Dropdown */}
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
                        <span>{t(link.key)}</span>
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
                    {t("nav.settings")}
                  </Link>
                  <div className="border-t border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                  >
                    <LogOut size={16} />
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="gradient-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              {t("nav.login")}
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
                  <span className="font-medium">{t(link.key)}</span>
                </Link>
              );
            })}
            <div className="border-t border-border my-2" />
            <button onClick={toggleLang} className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-foreground hover:bg-accent transition-colors">
              <Languages size={18} />
              <span>{lang === "vi" ? "English" : "Tiếng Việt"}</span>
            </button>
            <button onClick={toggle} className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-foreground hover:bg-accent transition-colors">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span>{t("theme." + (isDark ? "light" : "dark"))}</span>
            </button>
            {isLoggedIn ? (
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut size={18} />
                {t("nav.logout")}
              </button>
            ) : (
              <Link to="/login" className="block px-3 py-3 text-primary font-semibold" onClick={() => setMobileMenuOpen(false)}>{t("nav.login")}</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
