import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Lock, Unlock, Ticket, Timer, Play, ChevronLeft, RotateCcw } from 'lucide-react';

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Học viên");
  const [externalHtml, setExternalHtml] = useState<string>("");

  const fetchExamDetails = () => {
    fetch("/api/exams", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const foundExam = data.exams.find((e: any) => e.id === id);
          if (foundExam) {
            setExam(foundExam);
            const sub = (data.submissions || []).find((s: any) => s.labId === id);
            setStatus(sub ? sub.status : null);
            
            if (foundExam.contentUrl) {
                fetch(foundExam.contentUrl)
                  .then(res => res.text())
                  .then(html => setExternalHtml(html))
                  .catch(() => setExternalHtml("<div style='padding: 20px; color: red;'>Lỗi: Không thể tải nội dung chứng chỉ.</div>"));
            }
          }
        }
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
  };

  useEffect(() => {
    setUserName(localStorage.getItem("user_name") || "Học viên");
    fetchExamDetails();
  }, [id]);

  const handleUnlock = async () => {
    if (window.confirm(`Xác nhận trừ ${exam.price} Voucher để mở khóa chứng chỉ này?`)) {
      try {
        const res = await fetch(`/api/exams/${exam.id}/unlock`, { method: 'POST', credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          alert("Mở khóa thành công!");
          fetchExamDetails();
        } else {
          alert(`Lỗi: ${data.message}`);
        }
      } catch (error) { alert("Lỗi mạng!"); }
    }
  };

  const handleStartExam = async () => {
    if (!window.confirm("Bấm BẮT ĐẦU THI hệ thống sẽ khóa mốc thời gian ngay lập tức. Đã sẵn sàng chưa?")) return;
    try {
      const res = await fetch(`/api/exams/${exam.id}/start`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        navigate('/exams'); 
      } else {
        alert(data.message);
      }
    } catch (err) { alert("Lỗi kết nối máy chủ!"); }
  };

  const handleRetry = async () => {
    if (window.confirm("Bạn có chắc chắn muốn làm lại bài thi này?\nToàn bộ kết quả cũ sẽ bị xóa và bạn cần phải tốn Voucher để mở khóa lại từ đầu!")) {
      try {
        const res = await fetch(`/api/exams/${exam.id}/retry`, { method: 'POST', credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          alert("Đã reset trạng thái thành công! Hãy chuẩn bị Voucher để phục thù nhé.");
          fetchExamDetails();
        } else {
          alert(`Lỗi: ${data.message}`);
        }
      } catch (err) { alert("Lỗi kết nối máy chủ!"); }
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background pt-24 text-center text-foreground">Đang tải cấu trúc chứng chỉ...</div>;
  if (!exam) return <div className="min-h-screen bg-background pt-24 text-center text-foreground">Không tìm thấy bài thi!</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20 transition-colors duration-300">
      <Navbar isLoggedIn={true} userName={userName} userAvatar="" />
      
      <div className="bg-card border-b border-border pt-24 pb-8">
        <div className="max-w-5xl mx-auto px-6">
          <button onClick={() => navigate('/exams')} className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-bold mb-6 transition-colors">
            <ChevronLeft size={16} /> QUAY LẠI DANH SÁCH
          </button>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div>
              <span className="text-primary font-bold tracking-widest text-xs uppercase bg-primary/10 px-3 py-1 rounded border border-primary/20">
                {exam.category || 'Web Penetration Testing'}
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mt-4">{exam.title}</h1>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto">
              {!status && (
                <button onClick={handleUnlock} className="w-full md:w-auto bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all">
                  <Ticket size={18} className="text-yellow-500"/> MỞ KHÓA ({exam.price} VOUCHER)
                </button>
              )}
              {status === 'unlocked' && (
                <button onClick={handleStartExam} className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm">
                  <Play size={18} /> BẮT ĐẦU KỲ THI NGAY
                </button>
              )}
              {status === 'taking' && (
                <button onClick={() => navigate('/exams')} className="w-full md:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 animate-pulse">
                  <Timer size={18} /> ĐANG TRONG PHÒNG THI (QUAY LẠI)
                </button>
              )}
              {(status === 'passed' || status === 'pending') && (
                <button disabled className="w-full md:w-auto bg-muted text-muted-foreground border border-border font-bold py-3 px-8 rounded-lg cursor-not-allowed">
                  ĐÃ HOÀN THÀNH
                </button>
              )}
              {status === 'failed' && (
                <button onClick={handleRetry} className="w-full md:w-auto bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm">
                  <RotateCcw size={18} /> THỬ SỨC LẠI (TỐN VOUCHER)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 mt-12">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-[800px] flex flex-col">
          {exam.contentUrl ? (
             <div 
               className="w-full flex-1"
               dangerouslySetInnerHTML={{ __html: externalHtml }} 
             />
          ) : (
            <div className="flex items-center justify-center flex-1 p-10 text-muted-foreground font-mono">
              [SYSTEM_LOG] CHƯA TÌM THẤY TÀI LIỆU TRÌNH BÀY CHỨNG CHỈ (NO_CONTENT_URL)
            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default ExamDetailPage;
