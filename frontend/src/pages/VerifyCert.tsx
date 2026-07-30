import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, Award, Calendar, ExternalLink, ShieldAlert, Loader2, Copy, CheckCircle2 } from "lucide-react";
import ShootingStars from "@/components/ShootingStars";

const VerifyCert = () => {
  const { hash } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/verify/${hash}`)
      .then((res) => res.json())
      .then((d) => setData(d.success ? d.cert : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [hash]);

  const handleCopy = () => {
    if (data?.hash) {
      navigator.clipboard.writeText(data.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      <ShootingStars />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl w-full border border-border rounded-[3rem] p-8 md:p-12 bg-card/80 backdrop-blur-xl shadow-2xl relative z-10">
        {data ? (
          <div className="space-y-10">
            <div className="flex justify-center">
              <div className="p-6 bg-green-500/10 rounded-full border-2 border-green-500/30">
                <ShieldCheck size={80} className="text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
              </div>
            </div>

            <div className="space-y-3 text-center">
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground">HỆ THỐNG XÁC THỰC</h1>
              <p className="text-green-500 font-mono tracking-[0.4em] text-sm font-bold uppercase">Verification Secured</p>
            </div>
            
            <div className="bg-background border border-border rounded-3xl p-8 md:p-10 space-y-8 shadow-inner">
              <div className="text-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-3">Tên Học Viên</span>
                <div className="text-3xl md:text-4xl font-black uppercase tracking-tight text-primary break-words">
                  {data.signedName}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-border py-8">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase block mb-2 tracking-widest">Loại Chứng Nhận</span>
                  <div className="text-lg md:text-xl font-bold flex items-center gap-3 uppercase text-center md:text-left">
                    <Award size={24} className="text-primary shrink-0" /> 
                    <span>{data.title}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase block mb-2 tracking-widest">Ngày Cấp</span>
                  <div className="text-lg md:text-xl font-bold flex items-center gap-3 font-mono text-center md:text-right">
                    <Calendar size={24} className="text-primary shrink-0" /> {data.issueDate}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs font-bold text-muted-foreground uppercase block mb-3 tracking-widest">Mã Định Danh Duy Nhất</span>
                
                <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border group relative transition-colors hover:border-primary/50">
                  <code className="text-sm md:text-base font-mono font-black text-muted-foreground truncate w-full tracking-[0.1em] md:tracking-[0.2em] pr-4 select-all">
                    #{data.hash}
                  </code>
                  
                  <button 
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-white text-muted-foreground transition-all shrink-0"
                    title="Copy Hash"
                  >
                    {copied ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                </div>
                {copied && <p className="text-[10px] text-green-500 font-bold uppercase mt-2 absolute w-full text-center left-0">Đã sao chép vào bộ nhớ tạm!</p>}

              </div>
            </div>
		
	<div className="mt-8 flex justify-center">
	  <Link 
	    to={`/checkout-cert/${data.hash}`} 
	    className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-3"
	  >
	    XUẤT CHỨNG CHỈ PDF <ExternalLink size={20} />
	  </Link>
	</div>

            <div className="text-center space-y-6 pt-4">
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-[0.2em] leading-relaxed">
                CHỨNG CHỈ NÀY ĐƯỢC XÁC THỰC BỞI HỆ THỐNG <b className="text-foreground">VULN_LAB</b>
              </p>
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                QUAY LẠI TRANG CHỦ <ExternalLink size={16}/>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-8 py-16">
            <ShieldAlert size={100} className="text-destructive mx-auto drop-shadow-md animate-pulse" />
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-foreground">KHÔNG HỢP LỆ</h2>
              <p className="text-muted-foreground font-mono tracking-widest uppercase text-sm">Mã chứng nhận không tồn tại hoặc đã bị thu hồi</p>
            </div>
            <Link to="/" className="inline-block text-primary font-black tracking-widest uppercase hover:underline">
              VỀ TRANG CHỦ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCert;
