import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { fetchLesson, type Lesson } from "@/services/api";

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

const LearningDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userName = localStorage.getItem("user_name") || "Học viên";

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchLesson(id);
        setLesson(data);
      } catch (error) {
        console.error("Lỗi lấy bài học:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <p className="text-muted-foreground text-lg">Không tìm thấy bài học</p>
        <Link to="/learning" className="text-primary hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <ShootingStars />
      <Navbar isLoggedIn userName={userName} />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link to="/learning" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>

          <div className="glass-card rounded-xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={24} className="text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{lesson.title}</h1>
            </div>

            <p className="text-muted-foreground mb-6">{lesson.description}</p>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-3 py-1.5 rounded-full border ${difficultyColors[lesson.difficulty] || "text-muted-foreground border-border"}`}>
                {lesson.difficulty}
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-full border ${categoryColors[lesson.category] || "text-muted-foreground border-border"}`}>
                {lesson.category}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground">
                {levelLabels[lesson.level] || lesson.level}
              </span>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 md:p-8 prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lesson.content || ""}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LearningDetail;
