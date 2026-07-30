import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, BookOpen, CheckCircle, Circle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { fetchLesson, updateLessonProgress, type Lesson } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";

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

  const { lang, setLang, t } = useLanguage();
  const userName = localStorage.getItem("user_name") || "Học viên";

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchLesson(id);
        setLesson(data);
        updateLessonProgress(id, 'reading').then(r => setProgressStatus(r.status)).catch(() => {});
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
    try {
      const res = await updateLessonProgress(id, 'completed');
      if (res.success) setProgressStatus('completed');
    } catch (error) {
      console.error("Lỗi cập nhật tiến độ:", error);
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

          <div className="glass-card rounded-xl p-6 md:p-8 prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LearningDetail;
