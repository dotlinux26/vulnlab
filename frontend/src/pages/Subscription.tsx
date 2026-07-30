import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Navbar from '@/components/Navbar';
import { Gem, CheckCircle, ShieldCheck, Zap, ExternalLink, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";

const socket = io("https://vuln.ghedahaui.online", {
  withCredentials: true,
  autoConnect: false
});

const Subscription = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [voucherData, setVoucherData] = useState<{orderCode: string, code: string} | null>(null);

  useEffect(() => {
    // Check login
    fetch("/api/me", { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(userData => {
        setUser(userData);
        socket.connect();
      })
      .catch(() => navigate('/login'));

    // Lắng nghe tín hiệu tiền về từ Socket
    socket.on("payment_success", (data: any) => {
        setVoucherData({ orderCode: data.orderCode, code: data.voucherCode });
        setIsBuying(false);
    });

    return () => {
      socket.off("payment_success");
      socket.disconnect();
    };
  }, [navigate]);

  const handleBuy = async () => {
    setIsBuying(true);
    setVoucherData(null);
    try {
      const response = await fetch('/api/payment/create', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }) 
    });
      const result = await response.json();
      if (result.success) {
        window.open(result.data.checkoutUrl, '_blank');
      } else {
        alert("Lỗi: " + result.message);
        setIsBuying(false);
      }
    } catch (err) {
      alert(t("subscription.maintenance"));
      setIsBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar isLoggedIn={true} userName={user?.name} userAvatar={user?.picture} />
      
      <main className="pt-32 pb-12 px-4 container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
            {t("subscription.title")}
          </h1>
          <p className="text-muted-foreground font-mono italic">{t("subscription.subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* CỘT 1: QUYỀN LỢI */}
          <div className="bg-card border border-border p-8 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShieldCheck className="text-primary" /> {t("subscription.benefits")} 
            </h2>
            <ul className="space-y-4">
              {[
                t("subscription.benefit1"),
                t("subscription.benefit2"),
                t("subscription.benefit3"),
                t("subscription.benefit4"),
                t("subscription.benefit5")
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 2: THANH TOÁN */}
          <div className="flex flex-col gap-6">
            <div className="bg-primary/5 border-2 border-primary rounded-3xl p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">
                {t("subscription.bestSeller")}
              </div>
              <h3 className="text-lg font-bold text-muted-foreground uppercase mb-2">{t("subscription.productName")}</h3>
              <div className="text-5xl font-black mb-6">100.000<span className="text-sm font-normal"> VNĐ</span></div>
              
              {!voucherData ? (
                <button 
                  onClick={handleBuy}
                  disabled={isBuying}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isBuying ? <Zap className="animate-pulse" /> : <Gem />}
                  {isBuying ? t("subscription.processing") : t("subscription.buy")}
                </button>
              ) : (
                <div className="animate-in zoom-in duration-300">
                   <div className="bg-emerald-500 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-4">
                     <CheckCircle size={20} /> {t("subscription.success")}
                   </div>
                   <div className="bg-background border-2 border-dashed border-emerald-500 p-4 rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t("subscription.voucherAdded")}</p>
                      <p className="text-2xl font-black text-primary tracking-[0.2em] select-all cursor-pointer">{voucherData.code}</p>
                   </div>
                </div>
              )}
            </div>

            {isBuying && !voucherData && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl text-center animate-pulse">
                <p className="text-xs text-yellow-600 font-bold flex items-center justify-center gap-2">
                  <ExternalLink size={14} /> {t("subscription.waiting")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{t("subscription.note")}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Subscription;
