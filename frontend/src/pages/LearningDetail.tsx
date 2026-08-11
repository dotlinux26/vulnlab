import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, BookOpen, CheckCircle, Circle, Lock, ArrowRight, Trophy, MapPin, Terminal, Clock, AlertCircle, PlayCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { fetchLesson, fetchLessonProgress, updateLessonProgress, fetchLessonPathContext, type Lesson, type LessonPathContext } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import LessonQA from "@/components/LessonQA";
import LessonComments from "@/components/LessonComments";

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

const LearningDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [contentLang, setContentLang] = useState<"vi" | "en">("vi");
  const [progressError, setProgressError] = useState("");
  const [pathCtx, setPathCtx] = useState<LessonPathContext | null>(null);

  const { lang, setLang, t } = useLanguage();
  const userName = localStorage.getItem("user_name") || "Học viên";

  const [labStatus, setLabStatus] = useState<"AVAILABLE" | "BUSY" | "RESETTING" | "ERROR" | null>(null);
  const [labRemaining, setLabRemaining] = useState<number>(0);
  const [labPolling, setLabPolling] = useState(false);
  const [labAccessUrl, setLabAccessUrl] = useState<string | null>(null);

  const pollLabStatus = async () => {
    if (!lesson?.id || !lesson.labEnabled) return;
    try {
      const res = await fetch(`/api/learning/${lesson.id}/lab/status`, { credentials: "include" });
      const data = await res.json();
      setLabStatus(data.status);
      if (data.remainingSeconds) setLabRemaining(data.remainingSeconds);
      if (data.accessUrl) setLabAccessUrl(data.accessUrl);
    } catch (e) {
      console.error("Lab status poll error:", e);
    }
  };

  const handleLabAccess = async () => {
    if (!lesson?.id || !lesson.labEnabled) return;
    setLabPolling(true);
    setLabAccessUrl(null);
    try {
      const res = await fetch(`/api/learning/${lesson.id}/lab/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data.error === "LAB_BUSY") {
        setLabStatus("BUSY");
        setLabRemaining(data.remainingSeconds || 0);
      } else if (data.status === "RESETTING") {
        setLabStatus("RESETTING");
        // Poll until ready
        const poll = setInterval(async () => {
          await pollLabStatus();
          if (labStatus === "BUSY" || labStatus === "ERROR") {
            clearInterval(poll);
          }
        }, 3000);
        // Stop polling after 60s
        setTimeout(() => clearInterval(poll), 60000);
      } else if (data.accessUrl) {
        setLabAccessUrl(data.accessUrl);
        setLabStatus("BUSY");
        setLabRemaining(data.expiresAt ? Math.max(0, Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / 1000)) : 900);
      }
    } catch (e) {
      console.error("Lab access error:", e);
      setLabStatus("ERROR");
    } finally {
      setLabPolling(false);
    }
  };

  useEffect(() => {
    if (lesson?.labEnabled) {
      pollLabStatus();
      const interval = setInterval(pollLabStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [lesson?.id, lesson?.labEnabled]);

  const loadPathContext = (lessonId: string) => {
    fetchLessonPathContext(lessonId)
      .then(setPathCtx)
      .catch(() => setPathCtx(null));
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchLesson(id);
        setLesson(data);
        loadPathContext(id);
        const allProgress = await fetchLessonProgress();
        const currentStatus = allProgress[id];
        if (currentStatus === 'completed') {
          setProgressStatus('completed');
        } else {
          updateLessonProgress(id, 'reading').then(r => setProgressStatus(r.status)).catch(() => {});
        }
      } catch (error) {
        console.error("Lỗi lấy bài học:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    setContentLang(lang);
  }, [lang]);

  const handleLangChange = (l: "vi" | "en") => {
    setContentLang(l);
    setLang(l);
  };

  const handleMarkComplete = async () => {
    if (!id) return;
    setProgressError("");
    try {
      const res = await updateLessonProgress(id, 'completed');
      if (res.success) {
        setProgressStatus('completed');
        loadPathContext(id);
      }
    } catch (error: any) {
      console.error("Lỗi cập nhật tiến độ:", error);
      if (error?.message) setProgressError(error.message);
      else setProgressError(t("lesson.qa.completeError"));
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <p className="text-muted-foreground text-lg">{t("learning.notFound")}</p>
        <Link to="/learning" className="text-primary hover:underline">{t("learning.backList")}</Link>
      </div>
    );
  }

  const displayTitle = contentLang === "en" && lesson.title_en ? lesson.title_en : lesson.title;
  const displayDesc = contentLang === "en" && lesson.description_en ? lesson.description_en : lesson.description;
  const displayContent = contentLang === "en" && lesson.content_en ? lesson.content_en : (lesson.content || "");
  const displayLevel = contentLang === "en" ? (levelLabelsEn[lesson.level] || lesson.level) : (levelLabels[lesson.level] || lesson.level);

  return (
    <div className="min-h-screen bg-background relative">
      <ShootingStars />
      <Navbar isLoggedIn userName={userName} />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link to="/learning" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft size={16} />
            {t("learning.backList")}
          </Link>

          <div className="glass-card rounded-xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={24} className="text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayTitle}</h1>
            </div>

            <p className="text-muted-foreground mb-6">{displayDesc}</p>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-3 py-1.5 rounded-full border ${difficultyColors[lesson.difficulty] || "text-muted-foreground border-border"}`}>
                {lesson.difficulty}
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full border ${categoryColors[lesson.category] || "text-muted-foreground border-border"}`}>
                {lesson.category}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground">
                {displayLevel}
              </span>

              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => handleLangChange("vi")}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${contentLang === "vi" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  VI
                </button>
                <button
                  onClick={() => handleLangChange("en")}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${contentLang === "en" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  EN
                </button>
              </div>

              {progressStatus && (
                <button
                  onClick={handleMarkComplete}
                  disabled={progressStatus === 'completed'}
                  className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-colors ${
                    progressStatus === 'completed'
                      ? 'bg-green-500/10 border-green-500/30 text-green-500 cursor-default'
                      : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                  }`}
                >
                  {progressStatus === 'completed' ? <CheckCircle size={14} /> : <Circle size={14} />}
                  {progressStatus === 'completed' ? t("learning.doneLabel") : t("learning.markDone")}
                </button>
              )}
            </div>
          </div>

          {/* Lab Card */}
          {lesson.labEnabled && (
            <div className="glass-card rounded-xl p-6 mb-6 border border-primary/20 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Terminal size={22} className="text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    🧪 {contentLang === "en" ? "Lab Practice" : "Lab Thực Hành"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {contentLang === "en"
                      ? "Practice directly on a live lab environment related to this lesson."
                      : "Thực hành trực tiếp trên môi trường lab thực tế liên quan đến bài học này."}
                  </p>

                  <div className="flex items-center gap-4 flex-wrap mb-4">
                    {labStatus === "AVAILABLE" && (
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green">
                        <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                        {contentLang === "en" ? "Lab Ready" : "Lab Sẵn Sàng"}
                      </span>
                    )}
                    {labStatus === "BUSY" && (
                      <>
                        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-orange-400/10 border border-orange-400/30 text-orange-400">
                          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                          {contentLang === "en" ? "In Use" : "Đang Sử Dụng"}
                        </span>
                        <span className="text-xs text-orange-400 font-mono">
                          {contentLang === "en" ? "Available in" : "Còn"} {Math.floor(labRemaining / 60)}:{String(labRemaining % 60).padStart(2, "0")}
                        </span>
                      </>
                    )}
                    {labStatus === "RESETTING" && (
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">
                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {contentLang === "en" ? "Preparing Lab..." : "Đang Chuẩn Bị Lab..."}
                      </span>
                    )}
                    {labStatus === "ERROR" && (
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/30 text-destructive">
                        <AlertCircle size={12} />
                        {contentLang === "en" ? "Failed to Start" : "Khởi Động Thất Bại"}
                      </span>
                    )}
                    {labStatus === null && (
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground">
                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {contentLang === "en" ? "Checking..." : "Đang Kiểm Tra..."}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {labStatus === "AVAILABLE" && (
                      <button
                        onClick={handleLabAccess}
                        disabled={labPolling}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <PlayCircle size={18} />
                        {contentLang === "en" ? "Access Lab" : "Truy Cập Lab"}
                      </button>
                    )}
                    {labStatus === "RESETTING" && labPolling && (
                      <button disabled className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-semibold cursor-not-allowed">
                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {contentLang === "en" ? "Preparing..." : "Đang Chuẩn Bị..."}
                      </button>
                    )}
                    {labStatus === "BUSY" && !labAccessUrl && (
                      <button disabled className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-400/10 border border-orange-400/30 text-orange-400 font-semibold cursor-not-allowed">
                        <Clock size={18} />
                        {contentLang === "en" ? "Wait for Slot" : "Đợi Chỗ Trống"}
                      </button>
                    )}
                    {labAccessUrl && (
                      <a
                        href={labAccessUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Terminal size={18} />
                        {contentLang === "en" ? "Open Lab" : "Mở Lab"}
                      </a>
                    )}
                    {labStatus === "ERROR" && (
                      <button
                        onClick={handleLabAccess}
                        disabled={labPolling}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive font-semibold hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      >
                        <AlertCircle size={18} />
                        {contentLang === "en" ? "Retry" : "Thử Lại"}
                      </button>
                    )}
                  </div>

                  {labAccessUrl && labStatus === "BUSY" && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary">
                      <strong>{contentLang === "en" ? "Lab URL:" : "Link Lab:"}</strong> <code className="ml-2 break-all">{labAccessUrl}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {progressError && (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {progressError}
            </div>
          )}

          <div className="glass-card rounded-xl p-6 md:p-8 prose dark:prose-invert max-w-none mb-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
          </div>

          {pathCtx?.inPath && (
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <MapPin size={15} className="text-primary" />
                <span className="truncate">
                  {contentLang === "en" && pathCtx.pathTitle_en ? pathCtx.pathTitle_en : pathCtx.pathTitle}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {t("learning.pathLessonPos")} {pathCtx.lessonIndex! + 1}/{pathCtx.totalLessons}
                </span>
              </div>

              {pathCtx.nextLessonId && pathCtx.currentLessonCompleted ? (
                <Link
                  to={`/learning/${pathCtx.nextLessonId}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                    <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-semibold mb-0.5">{t("learning.nextLesson")}</p>
                    <h3 className="font-semibold text-foreground truncate">
                      {contentLang === "en" && pathCtx.nextLessonTitle_en ? pathCtx.nextLessonTitle_en : pathCtx.nextLessonTitle}
                    </h3>
                  </div>
                  <span className="text-xs text-primary shrink-0">{t("learning.go")}</span>
                </Link>
              ) : pathCtx.nextLessonId && !pathCtx.currentLessonCompleted ? (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card opacity-60 cursor-not-allowed">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-muted-foreground shrink-0">
                    <Lock size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold mb-0.5">{t("learning.nextLesson")}</p>
                    <h3 className="font-semibold text-foreground truncate">
                      {contentLang === "en" && pathCtx.nextLessonTitle_en ? pathCtx.nextLessonTitle_en : pathCtx.nextLessonTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{t("learning.nextLessonLocked")}</p>
                  </div>
                </div>
              ) : pathCtx.currentLessonCompleted ? (
                <Link
                  to={`/learning/paths/${pathCtx.pathId}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-neon-green/30 bg-neon-green/5 hover:bg-neon-green/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-neon-green/20 text-neon-green flex items-center justify-center shrink-0">
                    <Trophy size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neon-green font-semibold mb-0.5">{t("learning.pathComplete")}</p>
                    <p className="text-sm text-muted-foreground">{t("learning.pathCompleteDesc")}</p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card opacity-60">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-muted-foreground shrink-0">
                    <Lock size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-semibold mb-0.5">{t("learning.lastLesson")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("learning.nextLessonLocked")}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <LessonQA lessonId={lesson.id} contentLang={contentLang} />

          <LessonComments lessonId={lesson.id} />
        </div>
      </main>
    </div>
  );
};

export default LearningDetail;
