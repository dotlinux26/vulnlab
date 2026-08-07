import { useState, useEffect } from "react";
import { HelpCircle, CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react";
import { fetchLessonQuestions, checkLessonAnswer } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface LessonQAProps {
  lessonId: string;
  contentLang: "vi" | "en";
}

const LessonQA = ({ lessonId, contentLang }: LessonQAProps) => {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, "success" | "fail" | null>>({});
  const [checking, setChecking] = useState<Record<number, boolean>>({});
  const [retryMode, setRetryMode] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchLessonQuestions(lessonId)
      .then((qs) => { if (mounted) setQuestions(qs); })
      .catch(() => {})
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [lessonId]);

  const handleCheck = async (q: any) => {
    const answer = (answers[q.id] || "").trim();
    if (!answer || checking[q.id]) return;
    setChecking((prev) => ({ ...prev, [q.id]: true }));
    try {
      const res = await checkLessonAnswer(lessonId, q.id, answer);
      setResults((prev) => ({ ...prev, [q.id]: res.correct ? "success" : "fail" }));
      if (res.correct) {
        setQuestions((prev) => prev.map((x) => x.id === q.id ? { ...x, solved: true } : x));
        setRetryMode((prev) => ({ ...prev, [q.id]: false }));
      }
      setTimeout(() => {
        setResults((prev) => ({ ...prev, [q.id]: null }));
      }, 3000);
    } catch {
      setResults((prev) => ({ ...prev, [q.id]: "fail" }));
      setTimeout(() => {
        setResults((prev) => ({ ...prev, [q.id]: null }));
      }, 3000);
    } finally {
      setChecking((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (questions.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-6 md:p-8 mb-6">
      <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
        <HelpCircle size={20} className="text-primary" />
        {t("lesson.qa.title")}
      </h2>
      <p className="text-xs text-muted-foreground mb-6">{t("lesson.qa.subtitle")}</p>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const qText = contentLang === "en" && q.question_en ? q.question_en : q.question_vi;
          const solved = q.solved && !retryMode[q.id];
          const result = results[q.id];
          return (
            <div key={q.id} className="border border-border rounded-xl p-4">
              <div className="flex items-start gap-2 mb-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <p className="text-sm font-medium text-foreground flex-1">{qText}</p>
                {solved && (
                  <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 size={13} /> {t("lesson.qa.solved")}
                  </span>
                )}
              </div>

              {solved ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-green-500" />
                    {t("lesson.qa.correct")}
                  </span>
                  <button
                    onClick={() => setRetryMode((prev) => ({ ...prev, [q.id]: true }))}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <RotateCcw size={13} /> {t("lesson.qa.retry")}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleCheck(q)}
                      placeholder={t("lesson.qa.answerPlaceholder")}
                      className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <button
                      onClick={() => handleCheck(q)}
                      disabled={checking[q.id] || !(answers[q.id] || "").trim()}
                      className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {checking[q.id] ? <Loader2 size={14} className="animate-spin" /> : null}
                      {t("lesson.qa.check")}
                    </button>
                  </div>
                  {result && (
                    <div className={`mt-2 text-sm flex items-center gap-1.5 ${result === "success" ? "text-green-500" : "text-destructive"}`}>
                      {result === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      {result === "success" ? t("lesson.qa.correct") : t("lesson.qa.wrong")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonQA;
