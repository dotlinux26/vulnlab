import { useState, useRef, useEffect, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Image, Eye, Edit3, Paste, Image as ImageIcon, Loader2 } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

const MarkdownEditor = ({
  value,
  onChange,
  rows = 16,
  placeholder = "Nhập nội dung Markdown...",
}: MarkdownEditorProps) => {
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      onChange(value + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = value.substring(0, start) + text + value.substring(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleUploadImage = async (file: File) => {
    setIsUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/admin/lessons/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        insertAtCursor(`![image](${data.url})`);
      } else {
        alert("Lỗi upload: " + data.message);
      }
    } catch {
      alert("Lỗi kết nối khi upload ảnh.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadImage(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    let hasImage = false;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        hasImage = true;
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await handleUploadImage(file);
        break;
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      insertAtCursor("  ");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-accent rounded-lg p-1 border border-border">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1 ${
              mode === "edit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            type="button"
            onClick={() => setMode("split")}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1 ${
              mode === "split" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1 ${
              mode === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye size={14} /> Preview
          </button>
        </div>

        {/* Image insert buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={triggerFileInput}
            className="flex items-center gap-1 text-xs bg-primary hover:bg-primary/80 text-primary-foreground px-3 py-1.5 rounded-md transition-colors"
            title="Chèn ảnh (Ctrl+I)"
          >
            <ImageIcon size={14} /> Chèn ảnh
          </button>
          <span className="text-xs text-muted-foreground hidden sm:inline-block px-2" style={{fontFamily: 'monospace'}}>
            Ctrl+I
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline-block px-2" style={{fontFamily: 'monospace'}}>
            Ctrl+V (paste)
          </span>
        </div>

        {/* Upload indicator */}
        {isUploading && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Loader2 size={12} className="animate-spin" />
            Đang upload...
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="markdown-image-upload"
      />

      {/* Editor area - width: 100%, uses CSS Grid for split */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            mode === "split" ? "1fr 1fr" : "1fr",
          gap: 16,
          width: "100%",
        }}
      >
        {(mode === "edit" || mode === "split") && (
          <div style={{ width: "100%" }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              rows={rows}
              placeholder={placeholder}
              className="w-full p-3 bg-accent border border-border rounded text-foreground font-mono leading-relaxed resize-y focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              spellCheck={false}
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground" style={{fontFamily: 'monospace'}}>
              <span>Ctrl+I: Chèn ảnh</span>
              <span>|</span>
              <span>Ctrl+V: Paste ảnh từ clipboard</span>
              <span>|</span>
              <span>Tab: Thụt lề</span>
            </div>
          </div>
        )}

        {(mode === "preview" || mode === "split") && (
          <div className="p-4 bg-card border border-border rounded prose dark:prose-invert max-w-none overflow-y-auto min-h-[200px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || "*Chưa có nội dung*"}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;