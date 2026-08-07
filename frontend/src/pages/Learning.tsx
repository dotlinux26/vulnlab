import { useState, useMemo, useEffect } from "react";
import { Search, Filter, X, Loader2, BookOpen, ChevronDown, Users, MapPin, ArrowRight, UserPlus, Shield, Sword, Ghost, Bug, Target, Crosshair, Terminal, Lock, Key } from "lucide-react";

const pathIcons: Record<string, any> = {
  shield: Shield, sword: Sword, ghost: Ghost, bug: Bug, target: Target,
  crosshair: Crosshair, terminal: Terminal, lock: Lock, key: Key,
};
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchLessons, fetchLessonProgress, fetchPaths, type Lesson, type PaginatedResponse, type LearningPath } from "@/services/api";

const difficulties = ["Easy", "Medium", "Hard"];
const categories = ["Web", "Pwn", "Forensics", "Crypto", "Reverse", "OSINT", "Network"];
const levels = ["beginner", "intermediate", "advanced"];

const levelLabels: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

const levelLabelsEn: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const difficultyColors: Record<string, string> = {
  Easy: "text-neon-green bg-neon-green/10 border-neon-green/30",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  Hard: "text-destructive bg-destructive/10 border-destructive/30",
};

const categoryColors: Record<string, string> = {
  Web: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Pwn: "text-red-400 bg-red-400/10 border-red-400/30",
  Forensics: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  Crypto: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  Reverse: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  OSINT: "text-green-400 bg-green-400/10 border-green-400/30",
  Network: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
};

const Learning = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedDiff, setSelectedDiff] = useState<string>("");
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [paths, setPaths] = useState<LearningPath[]>([]);

  const userName = localStorage.getItem("user_name") || "Học viên";
  const { lang, t } = useLanguage();
  const [progress, setProgress] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLessonProgress().then(setProgress).catch(() => {});
  }, []);

  const loadPage = async (pageNum: number, append = false) => {
    try {
      const result = await fetchLessons({ page: pageNum, limit: 12 }) as PaginatedResponse<Lesson>;
      if (append) {
        setLessons(prev => [...prev, ...result.items]);
      } else {
        setLessons(result.items);
      }
      setTotalPages(result.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error("Lỗi lấy danh sách bài học:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadPage(1);
    fetchPaths().then(setPaths).catch(() => {});
  }, []);

  const loadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      loadPage(page + 1, true);
    }
  };

  const filtered = useMemo(() => {
    return lessons.filter((lesson) => {
      if (search && !lesson.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedDiff && lesson.difficulty !== selectedDiff) return false;
      if (selectedCat && lesson.category !== selectedCat) return false;
      if (selectedLevel && lesson.level !== selectedLevel) return false;
      return true;
    });
  }, [lessons, search, selectedDiff, selectedCat, selectedLevel]);

  const hasFilters = selectedDiff || selectedCat || selectedLevel;

  const clearFilters = () => {
    setSelectedDiff("");
    setSelectedCat("");
    setSelectedLevel("");
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <ShootingStars />
      <Navbar isLoggedIn userName={userName} />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="mb-8" style={{ animation: "fade-in-up 0.6s ease-out" }}>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t("learning.title")}</h1>
            <p className="text-muted-foreground">
              {t("learning.desc")}
            </p>
          </div>

          {Object.keys(progress).length > 0 && (
            <div className="glass-card rounded-xl p-4 mb-6 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>{t("learning.progress")}</span>
                  <span>{Object.values(progress).filter(v => v === 'completed').length} / {lessons.length} bài</span>
                </div>
                <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${lessons.length > 0 ? (Object.values(progress).filter(v => v === 'completed').length / lessons.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {paths.length > 0 && (
            <div className="mb-8" style={{ animation: "fade-in-up 0.6s ease-out 0.05s both" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <MapPin size={20} className="text-primary" />
                  {t("learning.paths")}
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paths.map((path, i) => {
                  const displayTitle = lang === "en" && path.title_en ? path.title_en : path.title;
                  const displayDesc = lang === "en" && path.description_en ? path.description_en : path.description;
                  const tm = path.type === 'RED' ? { label: "RED", color: "text-red-400 bg-red-400/10 border-red-400/30" }
                    : path.type === 'BLUE' ? { label: "BLUE", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" }
                    : path.type === 'PURPLE' ? { label: "PURPLE", color: "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/30" }
                    : { label: "PEN", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" };
                  return (
                    <Link
                      key={path.id}
                      to={`/learning/paths/${path.id}`}
                      className="group glass-card p-5 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 block flex flex-col"
                      style={{ animation: `fade-in-up 0.5s ease-out ${i * 0.05}s both` }}
                    >
                      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{ background: `radial-gradient(circle at 80% 0%, hsl(var(--neon-purple)), transparent 60%)` }} />
                      <div className="flex items-start gap-3 mb-3 relative z-10">
                        {path.imageUrl ? (
                          <img src={path.imageUrl} alt={displayTitle} className="w-12 h-12 rounded-lg object-cover border border-border shrink-0" />
                        ) : (() => {
                          const Icon = path.icon ? (pathIcons[path.icon] || BookOpen) : BookOpen;
                          return (
                            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                              <Icon size={22} />
                            </div>
                          );
                        })()}
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border mb-1 ${tm.color}`}>{tm.label}</span>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{displayTitle}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{displayDesc}</p>
                      <div className="flex items-center justify-between mt-auto relative z-10">
                        <span className="text-xs text-muted-foreground">{path.lessonCount ?? 0} {t("learning.lessons")}</span>
                        {path.joined ? (
                          <span className="text-xs text-neon-green bg-neon-green/10 border border-neon-green/30 px-2 py-0.5 rounded-full">{t("learning.pathJoined")}</span>
                        ) : (
                          <span className="text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <UserPlus size={13} /> {t("learning.pathJoin")}
                          </span>
                        )}
                        <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-6" style={{ animation: "fade-in-up 0.6s ease-out 0.1s both" }}>
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("learning.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 pl-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${showFilters ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Filter size={18} />
              {t("common.filter")}
              {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
            </button>
          </div>

          {showFilters && (
            <div className="glass-card rounded-xl p-4 mb-6 space-y-4" style={{ animation: "scale-in 0.3s ease-out" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t("common.filter")}</span>
                {hasFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-destructive hover:underline">
                    <X size={12} /> {t("common.clear")}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("filter.difficulty")}</label>
                  <div className="flex flex-wrap gap-2">
                    {difficulties.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDiff(selectedDiff === d ? "" : d)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedDiff === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("filter.category")}</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCat(selectedCat === c ? "" : c)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCat === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t("filter.level")}</label>
                  <div className="flex flex-wrap gap-2">
                    {levels.map((l) => (
                      <button
                        key={l}
                        onClick={() => setSelectedLevel(selectedLevel === l ? "" : l)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedLevel === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                      >
                        {levelLabels[l]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4">
            {filtered.length} {hasFilters && <span className="text-primary">{t("learning.filtered")}</span>}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((lesson, i) => (
              <div key={lesson.id} style={{ animation: `fade-in-up 0.5s ease-out ${i * 0.05}s both` }}>
                <Link
                  to={`/learning/${lesson.id}`}
                  className="group glass-card p-5 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 block flex flex-col"
                >
                  <div className={`absolute left-0 top-0 w-1 h-full rounded-l-xl ${progress[lesson.id] === 'completed' ? 'bg-green-500' : progress[lesson.id] === 'reading' ? 'bg-yellow-500' : 'gradient-primary'}`} />
                  <div className="flex items-start justify-between mb-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <BookOpen size={18} className={progress[lesson.id] === 'completed' ? 'text-green-500' : 'text-primary shrink-0'} />
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{lang === "en" && lesson.title_en ? lesson.title_en : lesson.title}</h3>
                    </div>
                    {progress[lesson.id] === 'completed' && (
                      <span className="text-xs text-green-500 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">{t("learning.done")}</span>
                    )}
                    {progress[lesson.id] === 'reading' && (
                      <span className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full">{t("learning.learning")}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{lang === "en" && lesson.description_en ? lesson.description_en : lesson.description}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-auto">
                    <span className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[lesson.difficulty] || "text-muted-foreground border-border"}`}>
                      {lesson.difficulty}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[lesson.category] || "text-muted-foreground border-border"}`}>
                      {lesson.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{lang === "en" ? (levelLabelsEn[lesson.level] || lesson.level) : (levelLabels[lesson.level] || lesson.level)}</span>
                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                      <Users size={13} className="text-primary/70" />
                      {lesson.learners ?? 0} {t("learning.learners")}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg mb-2">{t("learning.empty")}</p>
              <button onClick={clearFilters} className="text-primary hover:underline text-sm">{t("common.clear")}</button>
            </div>
          )}

          {page < totalPages && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary/50 text-foreground px-6 py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ChevronDown size={18} />
                )}
                {t("learning.loadMore")}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Learning;
