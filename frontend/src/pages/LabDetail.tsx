import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Flag, CheckCircle, XCircle, Trophy, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { fetchLab, submitFlag } from "@/services/api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from "@/contexts/LanguageContext";

const LabDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [lab, setLab] = useState<any>(null);
  const [isLoadingLab, setIsLoadingLab] = useState(true);
  const [flagInput, setFlagInput] = useState("");
  const [result, setResult] = useState<"success" | "fail" | null>(null);
  const [descLang, setDescLang] = useState<"vi" | "en">("vi");

  const { lang, setLang, t } = useLanguage();
  const userName = localStorage.getItem("user_name") || "Học viên";

  useEffect(() => {
    if (id) {
      setIsLoadingLab(true);
      fetchLab(id)
        .then((data) => {
          setLab(data);
          setIsLoadingLab(false);
        })
        .catch((err) => {
          console.error("Lỗi:", err);
          setIsLoadingLab(false);
        });
    }
  }, [id]);

  useEffect(() => {
    setDescLang(lang);
  }, [lang]);

  const handleLangChange = (l: "vi" | "en") => {
    setDescLang(l);
    setLang(l);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lab || !id) return;
    try {
      const res = await submitFlag(id, flagInput.trim());
      if (res.success) setResult("success");
      else setResult("fail");
    } catch (error) {
      setResult("fail");
    }
    setTimeout(() => setResult(null), 4000);
  };

  if (isLoadingLab) return <div className="min-h-screen bg-background flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  if (!lab) return <div className="text-center py-20 bg-background min-h-screen text-foreground"><h1 className="text-2xl font-bold">{t("lab.detail.notFound")}</h1><Link to="/dashboard" className="text-primary underline">{t("lab.detail.backDash")}</Link></div>;

  const diffMap = { Easy: "text-neon-green", Medium: "text-yellow-400", Hard: "text-destructive" } as const;
  const diffColor = diffMap[lab.difficulty as keyof typeof diffMap] || "text-primary";

  const displayTitle = descLang === "en" && lab.title_en ? lab.title_en : lab.title;
  const displayDesc = descLang === "en" && lab.description_en ? lab.description_en : lab.description;

  return (
    <div className="min-h-screen bg-background text-foreground relative transition-colors duration-300">
      <ShootingStars />
      <Navbar isLoggedIn userName={userName} />

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <div className={`text-center p-10 rounded-2xl glass-card border shadow-2xl ${result === "success" ? "border-green-500" : "border-destructive"}`}>
            {result === "success" ? (
              <>
                <Trophy size={64} className="mx-auto text-green-500 mb-4" />
                <h2 className="text-3xl font-black uppercase text-green-500">🎉 {t("lab.detail.success")}</h2>
                <p className="text-sm font-bold text-green-500/80 mt-2">+{lab.points} XP</p>
              </>
            ) : (
              <>
                <XCircle size={64} className="mx-auto text-destructive mb-4" />
                <h2 className="text-3xl font-black uppercase text-destructive">{t("lab.detail.failTitle")}</h2>
                <p className="text-muted-foreground font-mono">{t("lab.detail.failMsg")}</p>
              </>
            )}
          </div>
        </div>
      )}

      <main className="pt-28 pb-12 px-6">
        <div className="container mx-auto max-w-4xl relative z-10">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} /> {t("lab.detail.backBase")}
          </Link>

          <div className="bg-card border border-border rounded-[2rem] p-8 md:p-10 mb-8 shadow-xl">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4 uppercase">{displayTitle}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-mono font-bold">
              <span className={`px-3 py-1 rounded-md bg-muted border border-border uppercase ${diffColor}`}>
                {lab.difficulty}
              </span>
              <span className="text-muted-foreground">CATEGORY: {lab.category}</span>
              <span className="text-primary tracking-widest">+{lab.points} XP</span>

              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => handleLangChange("vi")}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${descLang === "vi" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  VI
                </button>
                <button
                  onClick={() => handleLangChange("en")}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${descLang === "en" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  EN
                </button>
              </div>
            </div>
            
            {lab.downloadUrl && (
              <div className="mt-6 pt-6 border-t border-border">
                <a href={lab.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:scale-105 transition-transform uppercase tracking-widest">
                  {t("lab.detail.download")}
                </a>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-[2rem] p-8 md:p-10 mb-8 shadow-xl">
            <h2 className="text-lg font-black mb-6 uppercase tracking-widest text-muted-foreground flex items-center gap-3">
              {t("lab.detail.mission")}
            </h2>
            
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground font-sans leading-relaxed
              prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
              prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-border">
              
              {displayDesc ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayDesc}
                </ReactMarkdown>
              ) : (
                <p className="italic font-mono text-center">{t("lab.detail.missionEmpty")}</p>
              )}
              
            </div>
          </div>

          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-xl">
            <h2 className="text-lg font-black mb-6 uppercase tracking-widest text-muted-foreground flex items-center gap-3">
              <Flag size={20} className="text-primary" /> {t("lab.detail.reportFlag")}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                placeholder={t("lab.detail.flagPlaceholder")} 
                value={flagInput} 
                onChange={(e) => setFlagInput(e.target.value)} 
                className="flex-1 bg-background border border-border rounded-xl px-6 py-4 font-mono font-bold text-foreground focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner" 
              />
              <button 
                type="submit" 
                className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                {t("lab.detail.submitFlag")}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LabDetail;
