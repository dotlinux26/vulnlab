import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, ImagePlus, Reply, Loader2, X, ChevronDown, Trash2, RotateCcw } from "lucide-react";
import { fetchLessonComments, postLessonComment, uploadLessonCommentImage, type LessonComment } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface LessonCommentsProps {
  lessonId: string;
}

const PAGE_SIZE = 10;

const LessonComments = ({ lessonId }: LessonCommentsProps) => {
  const { t } = useLanguage();
  const [comments, setComments] = useState<LessonComment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyInput, setReplyInput] = useState("");

  const [lightbox, setLightbox] = useState<string | null>(null);

  const userRole = localStorage.getItem("user_role") || "";
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFirst = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLessonComments(lessonId, 0, PAGE_SIZE);
      setComments(data.items);
      setHasMore(data.hasMore);
      setOffset(PAGE_SIZE);
    } catch {
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLessonComments(lessonId, 0, PAGE_SIZE);
      setComments(data.items);
      setHasMore(data.hasMore);
      setOffset(PAGE_SIZE);
    } catch {
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFirst();
    return () => { if (cooldownRef.current) clearTimeout(cooldownRef.current); };
  }, [lessonId]);

  const loadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchLessonComments(lessonId, offset, PAGE_SIZE);
      setComments((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setOffset((prev) => prev + PAGE_SIZE);
    } catch {
      setError(t("lesson.comments.loadError"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const startCooldown = () => {
    setCooldown(3);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadLessonCommentImage(lessonId, file);
      if (res.success) setPendingImage(res.url);
      else setError(res.message || t("lesson.comments.uploadError"));
    } catch (e: any) {
      if (e?.status === 429) setError(e?.message || t("lesson.comments.cooldown"));
      else setError(e?.message || t("lesson.comments.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (content: string, imageUrl: string | null, parentId: number | null) => {
    if (!content.trim() && !imageUrl) return;
    setSending(true);
    setError("");
    try {
      const res = await postLessonComment(lessonId, { content, parentId, imageUrl });
      if (res.success) {
        const c = res.comment;
        if (parentId) {
          setComments((prev) => prev.map((cm) =>
            cm.id === parentId ? { ...cm, replies: [...(cm.replies || []), c] } : cm
          ));
        } else {
          setComments((prev) => [c, ...prev]);
        }
        setInput("");
        setPendingImage(null);
        setReplyInput("");
        setReplyTo(null);
        startCooldown();
      } else {
        setError(res.message || t("lesson.comments.sendError"));
        startCooldown();
      }
      // Auto-reload comments after posting to get latest state
      await loadFirst();
      } catch (e: any) {
        if (e?.status === 429) {
          setError(e?.message || t("lesson.comments.cooldown"));
        } else {
          setError(e?.message || t("lesson.comments.sendError"));
        }
        startCooldown();
      } finally {
      setSending(false);
    }
  };

  const handleDelete = async (c: LessonComment) => {
    if (!window.confirm(t("lesson.comments.deleteConfirm"))) return;
    try {
      await fetch(`/api/admin/lessons/${lessonId}/comments/${c.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setComments((prev) => prev.filter((cm) => cm.id !== c.id));
    } catch {
      setError(t("lesson.comments.deleteError"));
    }
  };

  const formatTime = (ts: number) => {
    try {
      return new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const renderComment = (c: LessonComment, isReply: boolean, depth: number) => (
    <div key={c.id} className={`flex gap-3 ${isReply ? "ml-10" : ""} ${depth > 0 ? "ml-8" : ""}`}>
      {c.userAvatar ? (
        <img src={c.userAvatar} alt="" className="w-9 h-9 rounded-full border border-border bg-background object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {(c.userName || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-foreground">{c.userName}</span>
          <span className="text-[10px] text-muted-foreground font-mono opacity-60">{formatTime(c.timestamp)}</span>
          {userRole === "admin" && (
            <button
              onClick={() => handleDelete(c)}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-0.5"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
        <div
          className="mt-1 text-sm text-foreground/90 break-words"
          dangerouslySetInnerHTML={{ __html: c.content }}
        />
        {c.imageUrl && (
          <button onClick={() => setLightbox(c.imageUrl)} className="mt-2 block">
            <img
              src={c.imageUrl}
              alt=""
              className="max-w-[240px] max-h-[180px] rounded-lg border border-border object-cover hover:opacity-90 transition-opacity"
            />
          </button>
        )}
        <button
          onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyInput(""); }}
          className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Reply size={11} /> {t("lesson.comments.reply")}
        </button>

        {replyTo === c.id && (
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !sending && handleSend(replyInput, null, c.id)}
              placeholder={t("lesson.comments.replyPlaceholder")}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button
              onClick={() => handleSend(replyInput, null, c.id)}
              disabled={sending || !replyInput.trim()}
              className="bg-accent hover:bg-accent/80 text-foreground px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {t("lesson.comments.send")}
            </button>
          </div>
        )}

        {c.replies && c.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l border-border pl-3">
            {c.replies.map((r) => renderComment(r, false, depth + 1))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="glass-card rounded-xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          {t("lesson.comments.title")}
          {comments.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">({comments.length})</span>
          )}
        </h2>
        <button
          onClick={handleReload}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
          title={t("lesson.comments.reload")}
        >
          <RotateCcw size={18} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-6">{t("lesson.comments.subtitle")}</p>

      {/* Composer */}
      <div className="border border-border rounded-xl p-3 mb-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder={t("lesson.comments.placeholder")}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
        />
        {pendingImage && (
          <div className="relative inline-block mt-1 mb-2">
            <img src={pendingImage} alt="" className="h-20 rounded-lg border border-border object-cover" />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            <ImagePlus size={15} />
            {t("lesson.comments.image")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
            />
            {uploading && <Loader2 size={13} className="animate-spin text-primary" />}
          </label>
          <div className="flex items-center gap-2">
            {cooldown > 0 && (
              <span className="text-[11px] text-destructive">{t("lesson.comments.cooldown")} {cooldown}s</span>
            )}
            <button
              onClick={() => handleSend(input, pendingImage, null)}
              disabled={sending || cooldown > 0 || (!input.trim() && !pendingImage)}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {t("lesson.comments.send")}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-10">{t("lesson.comments.empty")}</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => renderComment(c, false, 0))}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
            {t("lesson.comments.loadMore")}
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default LessonComments;
