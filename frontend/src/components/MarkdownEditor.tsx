import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Image, Eye, Edit3 } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

const MarkdownEditor = ({ value, onChange, rows = 16, placeholder = "Nhập nội dung Markdown..." }: MarkdownEditorProps) => {
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleUploadImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("image", file);
      try {
        const res = await fetch("/api/admin/lessons/upload", {
          method: "POST", credentials: "include", body: fd,
        });
        const data = await res.json();
        if (data.success) {
          insertAtCursor(`![image](${data.url})`);
        } else {
          alert("Lỗi upload: " + data.message);
        }
      } catch {
        alert("Lỗi kết nối khi upload ảnh.");
      }
    };
    input.click();
  };

  return (
    <div className="space-y-2">
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
        <button
          type="button"
          onClick={handleUploadImage}
          className="flex items-center gap-1 text-xs bg-primary hover:bg-primary/80 text-primary-foreground px-3 py-1.5 rounded-md transition-colors"
        >
          <Image size={14} /> Chèn ảnh
        </button>
      </div>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns:
            mode === "split" ? "1fr 1fr" : mode === "preview" ? "1fr" : "1fr",
        }}
      >
        {(mode === "edit" || mode === "split") && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="w-full p-3 bg-accent border border-border rounded text-foreground font-mono leading-relaxed resize-y"
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div className="p-4 bg-card border border-border rounded prose prose-invert max-w-none overflow-y-auto min-h-[200px]">
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
