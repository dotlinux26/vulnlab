import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Terminal, ChevronRight, Zap, Target, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import EclipseOrb from "@/components/EclipseOrb";
import { fetchStats } from "@/services/api";

const features = [
  { icon: <Terminal size={24} />, title: "Lab Thực Chiến", desc: "Môi trường lab an toàn mô phỏng các lỗ hổng thực tế: SQLi, XSS, Buffer Overflow..." },
  { icon: <Target size={24} />, title: "Capture The Flag", desc: "Giải các thử thách CTF từ dễ đến khó, thu thập Flag và leo bảng xếp hạng." },
  { icon: <Award size={24} />, title: "Theo Dõi Tiến Độ", desc: "Biểu đồ kỹ năng Radar, lịch sử lab, hệ thống level và XP chi tiết." },
];

const Landing = () => {
  const [statsData, setStatsData] = useState({ labs: "...", users: "...", categories: "..." });
  const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
  const userName = localStorage.getItem("user_name") || "Học viên";

  useEffect(() => {
    fetchStats()
      .then(data => {
        if(data.success) {
          setStatsData({
            labs: `${data.labs}+`,
            users: `${data.users}+`,
            categories: data.categories.toString()
          });
        }
      })
      .catch(() => setStatsData({ labs: "8+", users: "100+", categories: "6" }));
  }, []);

  const stats = [
    { value: statsData.labs, label: "Labs" },
    { value: statsData.users, label: "Học viên" },
    { value: statsData.categories, label: "Thể loại" },
    { value: "24/7", label: "Online" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ShootingStars />
      <Navbar isLoggedIn={isLoggedIn} userName={userName} />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left z-10 space-y-6"
            style={{ animation: "fade-in-up 0.8s ease-out" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm">
              <Zap size={14} />
              Nền tảng Lab An Ninh Mạng
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <span className="text-foreground">VULN</span>
              <span className="text-primary">LAB</span>
              <br />
              <span className="text-2xl md:text-3xl text-muted-foreground font-normal">
                Training System
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto lg:mx-0">
              Hệ thống Lab thực chiến mô phỏng các lỗ hổng bảo mật thực tế, giúp học viên rèn luyện và nâng cao kỹ năng tấn công/phòng thủ.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <Link
                to={isLoggedIn ? "/dashboard" : "/login"}
                className="gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                {isLoggedIn ? "Vào Dashboard" : "Bắt đầu ngay"} <ChevronRight size={18} />
              </Link>
              <Link
                to="/dashboard"
                className="px-8 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-accent transition-colors"
              >
                Xem Lab
              </Link>
            </div>
          </div>

          <div className="flex-1 flex justify-center" style={{ animation: "fade-in-up 1s ease-out 0.2s both" }}>
            <EclipseOrb size="lg" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold gradient-text">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Tính năng nổi bật</h2>
            <p className="text-muted-foreground">Mọi thứ bạn cần để trở thành chuyên gia bảo mật</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass-card p-6 rounded-xl hover:-translate-y-1 transition-all duration-300 group"
                style={{ animation: `fade-in-up 0.6s ease-out ${i * 0.15}s both` }}
              >
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center glass-card rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(circle at center, hsl(var(--neon-purple)), transparent 70%)" }} />
          <div className="relative z-10">
            <Shield size={48} className="mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-3">Sẵn sàng thử thách?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Đăng ký ngay để truy cập hàng chục bài Lab thực chiến miễn phí.
            </p>
            <Link
              to={isLoggedIn ? "/dashboard" : "/login"}
              className="inline-flex gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              {isLoggedIn ? "Vào Dashboard" : "Đăng ký miễn phí"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-primary font-bold text-lg mb-3">D.O.T Solutions</h3>
            <p className="text-muted-foreground text-sm">
              ShellMap Protocol: A Lightweight Solution for Post-Quantum Cryptography at the Application Layer.
            </p>
          </div>
          <div>
            <h3 className="text-primary font-bold text-lg mb-3">Contact</h3>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li>Address: Hà Nội, Việt Nam</li>
              <li>Email: 0206canh2@gmail.com</li>
              <li>Phone: (+84) 969 273 889</li>
            </ul>
          </div>
          <div>
            <h3 className="text-primary font-bold text-lg mb-3">Links</h3>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Đăng nhập</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-8 pt-6 border-t border-border text-center text-muted-foreground text-sm">
          © 2024 VULNLAB. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
