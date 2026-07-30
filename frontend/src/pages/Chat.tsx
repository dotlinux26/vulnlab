import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Navbar from '@/components/Navbar';
import { Send, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";

const socket = io("https://vuln.ghedahaui.online", {
  withCredentials: true,
  autoConnect: false 
});

const Chat = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Chưa đăng nhập");
        return res.json();
      })
      .then(userData => {
        setUser(userData);
        setIsLoading(false);
      })
      .catch(() => {
        alert(t("chat.loginRequired"));
        navigate('/login');
      });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const handleLoadHistory = (history: any[]) => {
      setMessages(history);
    };

    const handleReceive = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleError = (msg: string) => {
      alert(`[Hệ thống cảnh báo] ${msg}`);
    };

    socket.on("load_history", handleLoadHistory);
    socket.on("receive_message", handleReceive);
    socket.on("error_msg", handleError);

    socket.connect();

    return () => { 
      socket.off("load_history", handleLoadHistory);
      socket.off("receive_message", handleReceive); 
      socket.off("error_msg", handleError); 
      socket.disconnect(); 
    };
  }, [user]);


  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !user) return;

    socket.emit("send_message", {
      sessionToken: user.id,
      content: input
    });
    
    setInput("");
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background pt-24 text-center">{t("chat.connecting")}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      <Navbar isLoggedIn={true} userName={user?.name} userAvatar={user?.picture} />
      
      <main className="flex-1 pt-24 pb-6 px-4 container mx-auto max-w-4xl flex flex-col h-screen">
        <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
          <MessageSquare className="text-primary w-8 h-8" />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-foreground">{t("chat.title")}</h1>
            <p className="text-sm text-muted-foreground font-mono">{t("chat.subtitle")}</p>
          </div>
        </div>

        <div className="flex-1 bg-card border border-border rounded-2xl overflow-y-auto p-6 space-y-6 shadow-sm mb-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground font-mono mt-10 opacity-50">
              {t("chat.empty")}
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.userId === user?.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <img 
                    src={msg.userAvatar || '/placeholder.svg'} 
                    className="w-10 h-10 rounded-full border border-border bg-background object-cover flex-shrink-0" 
                    alt="avatar" 
                />
                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs font-bold text-muted-foreground mb-1 ml-1 mr-1">
                    {msg.userName} <span className="opacity-50 font-mono text-[10px]">[{msg.time}]</span>
                  </span>
                  <div 
                      dangerouslySetInnerHTML={{ __html: msg.content }}
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md' 
                          : 'bg-secondary text-secondary-foreground rounded-tl-sm border border-border shadow-sm'
                      }`}
                  />
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        <div className="flex gap-3 bg-card p-3 rounded-2xl border border-border shadow-md">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t("chat.placeholder")}
            className="flex-1 bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none px-5 py-3 text-foreground font-medium transition-colors"
          />
          <button 
            onClick={sendMessage} 
            disabled={!input.trim()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center"
          >
            <Send size={20} className={input.trim() ? "translate-x-1" : ""} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Chat;
