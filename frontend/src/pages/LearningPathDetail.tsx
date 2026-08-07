import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, PlayCircle, Lock, BookOpen, Users, ArrowLeft, UserPlus, LogOut, Briefcase, MapPin, Shield, Sword, Ghost, Bug, Target, Crosshair, Terminal, Key, Zap, Flame, Skull, Bomb, Eye, Server, Database, Globe, Wifi, Radar, Fingerprint, Rocket, Wrench, Hammer, Cpu, Code, Flag, Crown, Medal, Compass, Route, Layers, Network, RefreshCw, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { fetchPath, joinPath, leavePath, type LearningPath } from "@/services/api";

const pathIcons: Record<string, any> = {
  shield: Shield, sword: Sword, ghost: Ghost, bug: Bug, target: Target,
  crosshair: Crosshair, terminal: Terminal, lock: Lock, key: Key,
  zap: Zap, flame: Flame, skull: Skull, bomb: Bomb, eye: Eye,
  server: Server, database: Database, globe: Globe, wifi: Wifi, radar: Radar,
  fingerprint: Fingerprint, rocket: Rocket, wrench: Wrench, hammer: Hammer, cpu: Cpu,
  code: Code, flag: Flag, crown: Crown, medal: Medal, compass: Compass,
  route: Route, layers: Layers, network: Network,
};

const statusMeta: Record<string, { labelKey: string; color: string; icon: any }> = {
  updating: { labelKey: "learning.pathStatusUpdating", color: "text-amber-500 bg-amber-500/10 border-amber-500/30", icon: RefreshCw },
  final: { labelKey: "learning.pathStatusFinal", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  coming_soon: { labelKey: "learning.pathStatusComingSoon", color: "text-sky-500 bg-sky-500/10 border-sky-500/30", icon: Clock },
};

const typeMeta: Record<string, { label: string; color: string }> = {
  RED: { label: "RED", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  BLUE: { label: "BLUE", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  PEN: { label: "PEN", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  PURPLE: { label: "PURPLE", color: "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/30" },
};

const difficultyColors: Record<string, string> = {
  Easy: "text-neon-green bg-neon-green/10 border-neon-green/30",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  Hard: "text-destructive bg-destructive/10 border-destructive/30",
};

const LearningPathDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const userName = localStorage.getItem("user_name") || "Học viên";

  useEffect(() => {
    if (!id) return;
    fetchPath(id)
      .then(setPath)
      .catch(() => setPath(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleJoin = async () => {
    if (!id || busy) return;
    setBusy(true);
    try {
      const result = await joinPath(id);
      setPath(prev => prev ? { ...prev, joined: result.joined } : prev);
      if (result.joined && id) {
        const fresh = await fetchPath(id);
        setPath(fresh);
      }
    } catch (error: any) {
      if (error?.code === 'ALREADY_JOINED') {
        toast.error(error.message || t("learning.alreadyJoined"));
      } else {
        toast.error(error?.message || t("learning.joinError"));
      }
    }
    setBusy(false);
  };

  const handleLeave = async () => {
    if (!id || busy) return;
    setBusy(true);
    try {
      await leavePath(id);
      setPath(prev => prev ? { ...prev, joined: false } : prev);
      toast.success(t("learning.leaveSuccess"));
    } catch (error: any) {
      toast.error(error?.message || t("learning.leaveError"));
    }
    setBusy(false);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  if (!path) {
    return (
      <div className="min-h-screen bg-background">
        <ShootingStars />
        <Navbar isLoggedIn userName={userName} />
        <div className="pt-32 text-center text-muted-foreground">
          <p className="text-lg mb-4">{t("learning.pathNotFound")}</p>
          <Link to="/learning" className="text-primary hover:underline">{t("learning.pathBack")}</Link>
        </div>
      </div>
    );
  }

  const displayTitle = lang === "en" && path.title_en ? path.title_en : path.title;
  const displayDesc = lang === "en" && path.description_en ? path.description_en : path.description;
  const displayJob = lang === "en" && path.jobTitle_en ? path.jobTitle_en : path.jobTitle;
  const tm = typeMeta[path.type] || typeMeta.PEN;
  const lessons = path.lessons || [];
  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const progressPct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background relative">
      <ShootingStars />
      <Navbar isLoggedIn userName={userName} />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <button onClick={() => navigate('/learning')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft size={18} /> {t("learning.pathBack")}
          </button>

          <div className="glass-card rounded-2xl p-8 relative overflow-hidden mb-8">
            <div className="absolute inset-0 opacity-10"
              style={{ background: "radial-gradient(circle at 20% 0%, hsl(var(--neon-purple)), transparent 60%)" }} />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              {path.imageUrl ? (
                <img src={path.imageUrl} alt={displayTitle} className="w-32 h-32 rounded-2xl object-cover border border-border shrink-0" />
              ) : (() => {
                const Icon = path.icon ? (pathIcons[path.icon] || BookOpen) : BookOpen;
                return (
                  <div className="w-32 h-32 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                    <Icon size={48} />
                  </div>
                );
              })()}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3 flex-wrap">
                  <span className={`inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${tm.color}`}>
                    {tm.label} PATH
                  </span>
                  {path.status && (
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${statusMeta[path.status]?.color || statusMeta.updating.color}`}>
                      {(() => { const Icon = statusMeta[path.status]?.icon || statusMeta.updating.icon; return <Icon size={12} />; })()}
                      {t(statusMeta[path.status]?.labelKey || statusMeta.updating.labelKey)}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{displayTitle}</h1>
                <p className="text-muted-foreground mb-4">{displayDesc}</p>
                {displayJob && (
                  <div className="inline-flex items-center gap-2 text-sm text-foreground bg-accent/50 border border-border px-3 py-1.5 rounded-lg mb-4">
                    <Briefcase size={15} className="text-primary" />
                    {displayJob}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><BookOpen size={15} className="text-primary/70" /> {lessons.length} {t("learning.lessons")}</span>
                  <span className="flex items-center gap-1.5"><Users size={15} className="text-primary/70" /> {path.joinedCount ?? 0} {t("learning.learners")}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={15} className="text-primary/70" /> {t("learning.roadmap")}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {path.joined ? (
                  <>
                    <button
                      onClick={() => navigate(path.nextLessonId ? `/learning/${path.nextLessonId}` : `/learning/paths/${path.id}`)}
                      disabled={busy}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 gradient-primary text-primary-foreground hover:opacity-90"
                    >
                      <PlayCircle size={18} />
                      {t("learning.continuePath")}
                      <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={handleLeave}
                      disabled={busy}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 bg-accent text-foreground border border-border hover:bg-accent/70"
                    >
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                      {t("learning.leavePath")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={busy}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 gradient-primary text-primary-foreground hover:opacity-90"
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                    {t("learning.pathJoin")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {path.joined && (
            <div className="glass-card rounded-xl p-4 mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>{t("learning.pathProgress")}</span>
                <span>{completedCount} / {lessons.length} ({progressPct}%)</span>
              </div>
              <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-primary" /> {t("learning.roadmap")}
          </h2>

          <div className="space-y-3">
            {lessons.map((lesson, idx) => {
              const status = lesson.status || 'not_started';
              const locked = path.joined && idx > 0 && lessons[idx - 1].status !== 'completed';
              return (
                <Link
                  key={lesson.lessonId}
                  to={`/learning/${lesson.lessonId}`}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    status === 'completed'
                      ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/10"
                      : "bg-card border-border hover:border-primary/50 hover:-translate-y-0.5"
                  } ${locked ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    status === 'completed' ? "bg-green-500/20 text-green-500" : "gradient-primary text-primary-foreground"
                  }`}>
                    {status === 'completed' ? <CheckCircle2 size={20} /> : locked ? <Lock size={18} /> : <PlayCircle size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                      <h3 className="font-semibold text-foreground truncate">{lang === "en" && lesson.title_en ? lesson.title_en : lesson.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{lang === "en" && lesson.description_en ? lesson.description_en : lesson.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border shrink-0 ${difficultyColors[lesson.difficulty] || "text-muted-foreground border-border"}`}>
                    {lesson.difficulty}
                  </span>
                </Link>
              );
            })}
            {lessons.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
                <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
                <p>{t("learning.pathEmpty")}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LearningPathDetail;
