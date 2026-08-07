import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Terminal, ChevronRight, Zap, Target, Award, BadgeCheck, Linkedin, Facebook, Mail, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import EclipseOrb from "@/components/EclipseOrb";
import { fetchStats } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";



const Landing = () => {
  const { t } = useLanguage();
  const features = [
    { icon: <Terminal size={24} />, title: t("landing.feature1"), desc: t("landing.feature1Desc") },
    { icon: <Target size={24} />, title: t("landing.feature2"), desc: t("landing.feature2Desc") },
    { icon: <Award size={24} />, title: t("landing.feature3"), desc: t("landing.feature3Desc") },
  ];
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
    { value: statsData.labs, label: t("landing.labs") },
    { value: statsData.users, label: t("landing.students") },
    { value: statsData.categories, label: t("landing.categories") },
    { value: "24/7", label: t("landing.online") },
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
              {t("landing.badge")}
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
              {t("landing.hero")}
            </p>
            <div className="flex gap-4 justify-center lg:justify-start">
              <Link
                to={isLoggedIn ? "/dashboard" : "/login"}
                className="gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                {isLoggedIn ? t("landing.dashboard") : t("landing.start")} <ChevronRight size={18} />
              </Link>
              <Link
                to="/dashboard"
                className="px-8 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-accent transition-colors"
              >
                {t("landing.viewLab")}
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
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("landing.features")}</h2>
            <p className="text-muted-foreground">{t("landing.featuresDesc")}</p>
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

      {/* Certifications */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-4">
              <BadgeCheck size={14} />
              {t("landing.certifications")}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("landing.certifications")}</h2>
            <p className="text-muted-foreground">{t("landing.certificationsDesc")}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <a
              href="https://labs.cyberwarfare.live/credential/achievement/6a6b3e4d8aed14e94c93a8a8"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-6 rounded-xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center"
            >
              <img
                src="/certs/crtsv2.png"
                alt="CRTS V2"
                className="w-28 h-28 rounded-lg mb-4 group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              <h3 className="font-semibold text-foreground mb-1">{t("landing.crts")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("landing.crtsOrg")}</p>
              <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold group-hover:opacity-80">
                {t("landing.certVerify")} <ExternalLink size={14} />
              </span>
            </a>
            <a
              href="https://academy.hackthebox.com/achievement/badge/039ec66d-7386-11f0-9254-bea50ffe6cb4"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-6 rounded-xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center"
            >
              <img
                src="/certs/cwes.png"
                alt="HTB CWES"
                className="w-28 h-28 rounded-lg mb-4 group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              <h3 className="font-semibold text-foreground mb-1">{t("landing.cwes")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("landing.cwesOrg")}</p>
              <span className="inline-flex items-center gap-2 text-primary text-sm font-semibold group-hover:opacity-80">
                {t("landing.certVerify")} <ExternalLink size={14} />
              </span>
            </a>
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
            <h2 className="text-3xl font-bold text-foreground mb-3">{t("landing.cta")}</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("landing.ctaDesc")}
            </p>
            <Link
              to={isLoggedIn ? "/dashboard" : "/login"}
              className="inline-flex gradient-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              {isLoggedIn ? t("landing.dashboard") : t("landing.ctaBtn")}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.svg" alt="D.O.T Solutions" className="w-8 h-8" />
              <h3 className="text-primary font-bold text-lg">{t("landing.footer")}</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              <a
                href="https://github.com/D-O-T-Solutions/smoframework"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                title="SMO Framework"
              >
                {t("landing.footerDesc")}
              </a>
            </p>
          </div>
          <div>
            <h3 className="text-primary font-bold text-lg mb-3">{t("landing.contact")}</h3>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li>{t("landing.address")}</li>
              <li>
                <a href="mailto:info@ghedahaui.online" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                  <Mail size={14} /> {t("landing.email")}
                </a>
              </li>
              <li>
                <a href="mailto:security@ghedahaui.online" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                  <Mail size={14} /> {t("landing.emailSecurity")}
                </a>
              </li>
              <li>
                <a href="mailto:0206canh2@gmail.com" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                  <Mail size={14} /> {t("landing.emailPersonal")}
                </a>
              </li>
              <li>{t("landing.phone")}</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a
                href="https://www.linkedin.com/in/canh-nguyen-duc-791503392/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                title={t("landing.linkedin")}
              >
                <Linkedin size={16} />
              </a>
              <a
                href="https://www.facebook.com/slox.ceo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                title={t("landing.facebook")}
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-primary font-bold text-lg mb-3">{t("landing.links")}</h3>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">{t("nav.dashboard")}</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">{t("nav.login")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-8 pt-6 border-t border-border text-center text-muted-foreground text-sm">
          {t("landing.copyright")}
        </div>
      </footer>
    </div>
  );
};

export default Landing;
