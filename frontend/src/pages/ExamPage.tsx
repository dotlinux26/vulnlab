import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Timer, AlertTriangle, FileUp, Lock, Unlock, Ticket, FileArchive, CheckCircle, FileText, Clock, XCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";

const ExamPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [userName, setUserName] = useState("Học viên");
  const [userAvatar, setUserAvatar] = useState("");
  const [userVoucher, setUserVoucher] = useState(0);
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  const [viewState, setViewState] = useState<'lobby' | 'taking'>('lobby');
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [flags, setFlags] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUserData = () => {
    fetch("/api/me", { credentials: "include" })
      .then(res => res.json())
      .then(user => {
        if (user && user.voucherXp !== undefined) setUserVoucher(user.voucherXp);
      }).catch(() => {});
  };

  const fetchExams = () => {
    fetch("/api/exams", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExams(data.exams);
          setSubmissions(data.submissions || []);
          
          const takingSub = (data.submissions || []).find((s: any) => s.status === 'taking');
          if (takingSub) {
            const activeExam = data.exams.find((e: any) => e.id === takingSub.labId);
            if (activeExam && takingSub.startTime) {
              const now = new Date().getTime();
              const start = new Date(takingSub.startTime).getTime();
              const diffSeconds = Math.floor((now - start) / 1000);
              const totalSeconds = activeExam.duration;
              
              if (totalSeconds - diffSeconds > 0) {
                setSelectedExam(activeExam);
                setTimeLeft(totalSeconds - diffSeconds);
                setViewState('taking');
              } else {
      alert(t("exam.expired"));
		  setSelectedExam(activeExam);
		  handleSubmitExam(activeExam, true);
              }
            }
          }
        }
      }).catch(() => {});
  };

  useEffect(() => {
    setUserName(localStorage.getItem("user_name") || "Học viên");
    fetchUserData();
    fetchExams();
  }, []);

  useEffect(() => {
    if (viewState !== 'taking' || isSubmitting || !selectedExam) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          alert(t("exam.timeUp"));
          handleSubmitExam(selectedExam, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [viewState, isSubmitting, selectedExam]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert(t("exam.fileTooBig"));
      e.target.value = "";
      return;
    }
    setReportFile(file);
  };

const handleSubmitExam = async (
  examOverride: any = null,
  autoSubmit: boolean = false
) => {

  const examToSubmit = examOverride || selectedExam;

  if (!examToSubmit?.id) {
    console.error("❌ selectedExam lỗi:", {
      selectedExam,
      examOverride,
      examToSubmit
    });

    alert(t("exam.notFound"));
    return;
  }

  if (!autoSubmit) {
    const confirmed = window.confirm(
      t("exam.confirmSubmit")
    );

    if (!confirmed) return;
  }

  setIsSubmitting(true);

  try {

    console.log("📦 SUBMIT EXAM:", {
      examId: examToSubmit.id,
      selectedExam
    });

    const formData = new FormData();

    formData.append("examId", examToSubmit.id);
    formData.append("flags", flags?.trim() || "");

    if (reportFile) {
      formData.append("report", reportFile);
    }

    const res = await fetch(
      "/api/exams/submit",
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const text = await res.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server trả về dữ liệu không hợp lệ");
    }

    if (!data.success) {

      alert(`❌ ${data.message || "Nộp bài thất bại"}`);

      if (
        data.message?.includes("hết hạn") ||
        data.message?.includes("TRƯỢT")
      ) {
        setViewState("lobby");
        setSelectedExam(null);
        setFlags("");
        setReportFile(null);

        fetchExams();
      }

      return;
    }

    // ✅ SUCCESS
    alert(t("exam.submitSuccess"));

    setViewState("lobby");
    setSelectedExam(null);
    setFlags("");
    setReportFile(null);
    setTimeLeft(0);

    fetchExams();

  } catch (error) {

    console.error("❌ Submit Error:", error);

    const errorMsg =
      error instanceof Error
        ? error.message
        : "Lỗi không xác định";

    alert(`❌ Lỗi: ${errorMsg}`);

  } finally {
    setIsSubmitting(false);
  }
};

  if (viewState === 'taking' && selectedExam) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="bg-card border-b border-border p-4 fixed w-full z-50 flex justify-between items-center shadow-sm">
          <div className="text-destructive font-bold tracking-widest uppercase flex items-center gap-2">
            <AlertTriangle size={20} className="animate-pulse" /> {t("exam.inExam")}
          </div>
          <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${timeLeft < 300 && !isSubmitting ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
            <Timer size={28} /> {isSubmitting ? t("exam.submitting") : formatTime(timeLeft)}
          </div>
        </header>

        <main className="pt-24 pb-20 px-4 container mx-auto max-w-6xl flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-card border border-border p-8 rounded-2xl overflow-y-auto max-h-[80vh] shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-border pb-4 mb-6 gap-4">
              <h1 className="text-2xl font-bold text-primary">{selectedExam.title}</h1>
              {selectedExam.downloadUrl && (
                <a href={selectedExam.downloadUrl} target="_blank" rel="noreferrer" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                  <FileArchive size={16} /> {t("exam.download")}
                </a>
              )}
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedExam.content}
              </ReactMarkdown>
            </div>
          </div>

          <div className="w-full md:w-[400px] bg-card p-6 rounded-2xl flex flex-col h-fit sticky top-24 border border-border shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-2">{t("exam.submitArea")}</h2>
            
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock className="w-16 h-16 text-yellow-500 mb-4 animate-spin-slow" />
                <h3 className="text-xl font-bold text-foreground">{t("exam.reconciling")}</h3>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-muted-foreground mb-2">{t("exam.flagInput")}</label>
                  <textarea 
                    value={flags} onChange={(e) => setFlags(e.target.value)} placeholder={t("exam.flagPlaceholder")} rows={3}
                    className="w-full bg-background border border-input rounded-lg p-3 text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  />
                </div>
                
                <div className="mb-8">
                  <label className="block text-sm font-bold text-muted-foreground mb-2">{t("exam.fileLabel")}</label>
                  <div className="border-2 border-dashed border-input hover:border-primary bg-background rounded-xl p-6 text-center cursor-pointer relative transition-colors">
                    <input type="file" onChange={handleFileChange} accept=".pdf,.zip,.rar" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <FileUp className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    {reportFile ? <p className="text-primary font-bold text-sm truncate">{reportFile.name}</p> : <p className="text-muted-foreground text-sm">{t("exam.chooseFile")}</p>}
                  </div>
                </div>

                <button onClick={() => handleSubmitExam()} className="mt-auto w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg shadow-sm transition-colors">
                  <CheckCircle size={20} /> {t("exam.submitBtn")}
                </button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar isLoggedIn={true} userName={userName} userAvatar={userAvatar} />
      
      <main className="pt-24 pb-12 px-4 container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-4 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t("exam.title")}</h1>
          </div>
          <div className="bg-card border border-border px-5 py-3 rounded-xl flex items-center gap-3 shadow-sm">
            <span className="text-muted-foreground text-sm font-bold">{t("exam.voucherLabel")}</span>
            <span className="text-yellow-500 font-mono font-bold text-2xl flex items-center gap-2"><Ticket size={24}/> {userVoucher}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {exams.map(exam => {
            const submission = submissions.find(s => s.labId === exam.id);
            const isUnlocked = !!submission;
            const status = submission?.status;
            const adminComment = submission?.adminComment;

            return (
              <div key={exam.id} className={`bg-card p-6 rounded-2xl border transition-all shadow-sm hover:shadow-md ${isUnlocked ? 'border-primary/50' : 'border-border'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-md font-mono font-bold">{exam.id}</div>
                  
                  {!isUnlocked && <span className="text-muted-foreground flex items-center gap-1 font-bold text-sm"><Lock size={16}/> {t("exam.locked")}</span>}
                  {status === 'unlocked' && <span className="text-blue-500 flex items-center gap-1 font-bold text-sm"><Unlock size={16}/> {t("exam.unlocked")}</span>}
                  {status === 'taking' && <span className="text-destructive flex items-center gap-1 font-bold text-sm"><Timer size={16} className="animate-pulse"/> {t("exam.taking")}</span>}
                  {status === 'pending' && <span className="text-yellow-500 flex items-center gap-1 font-bold text-sm"><Clock size={16}/> {t("exam.pending")}</span>}
                  {status === 'passed' && <span className="text-green-500 flex items-center gap-1 font-bold text-sm"><CheckCircle size={16}/> {t("exam.passed")}</span>}
                  {status === 'failed' && <span className="text-destructive flex items-center gap-1 font-bold text-sm"><XCircle size={16}/> {t("exam.failed")}</span>}
                </div>

                <h2 className="text-xl font-bold text-foreground mb-3 text-center">{exam.title}</h2>
                
                <div className="flex flex-col gap-2 mb-6">
                  <div className="text-muted-foreground text-sm flex items-center justify-center gap-2 bg-muted/50 p-2 rounded-lg w-full text-center">
                    <Timer size={16} className="text-blue-400"/> {t("exam.duration")} <b className="text-foreground">{exam.duration / 60} {t("exam.minutes")}</b>
                  </div>
                  {!isUnlocked && (
                    <div className="text-muted-foreground text-sm flex items-center justify-center gap-2 bg-muted/50 p-2 rounded-lg text-center w-full">
                      <Ticket size={16} className="text-yellow-500"/> {t("exam.price")} <b className="text-yellow-500">{exam.price} Voucher</b>
                    </div>
                  )}
                </div>

                {adminComment && (
                  <div className="bg-muted/10 p-4 rounded-lg border border-border mb-6">
                    <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1 uppercase tracking-wide"><FileText size={14}/> {t("exam.review")}</p>
                    <p className="text-sm text-foreground italic border-l-2 border-primary pl-3 py-1">"{adminComment}"</p>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-border">
                  <button onClick={() => navigate(`/exams/${exam.id}`)} className="w-full bg-secondary hover:bg-secondary/80 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors border border-border">
                    {t("exam.viewDetail")} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ExamPage;
