import { useState, useRef, useEffect, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Image, Eye, Edit3, GripVertical, Paste, Image as ImageIcon, Loader2, Maximize2, Minimize2 } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  minWidth?: number;
  maxWidth?: number;
}

const MarkdownEditor = ({
  value,
  onChange,
  rows = 16,
  placeholder = "Nhập nội dung Markdown...",
  minWidth = 400,
  maxWidth = 1400,
}: MarkdownEditorProps) => {
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const [splitDirection, setSplitDirection] = useState<"horizontal" | "vertical">("horizontal");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState(900);
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist editor width in localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem("markdown-editor-width");
    if (savedWidth) {
      setEditorWidth(parseInt(savedWidth, 10));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("markdown-editor-width", editorWidth.toString());
  }, [editorWidth]);

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

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const handleHeightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingHeight(true);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }

  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => {
        const containerRect = editorContainerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        const newWidth = e.clientX - containerRect.left;
        setEditorWidth(Math.max(400, Math.min(1400, newWidth)));
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizingHeight) {
      const handleMouseMove = (e: MouseEvent) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const newHeight = Math.max(200, e.clientY - textarea.getBoundingClientRect().top + window.scrollY);
        textarea.style.height = `${newHeight}px`;
      };

      const handleMouseUp = () => {
        setIsResizingHeight(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizingHeight]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };


  return (
    <div className="space-y-2" ref={editorContainerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
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
            <span className="flex items-center gap-1">
              {splitDirection === "horizontal" ? "◱" : "◲"}
            </span> Split
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

        {/* Resize handles */}
        <div
          className={`w-1 cursor-ew-resize flex items-center justify-center ${isResizing ? "bg-primary" : "bg-transparent hover:bg-border"} transition-colors select-none`}
          onMouseDown={handleResizeStart}
          style={{ height: "100%", minHeight: "32px" }}
          title="Kéo trái/phải để thay đổi độ rộng"
        >
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
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

      {/* Editor area with dynamic width */}
      <div
        className="gap-4"
        style={{
          display: "grid",
          gridTemplateColumns:
            mode === "split"
              ? splitDirection === "horizontal"
                ? "1fr 1fr"
                : "1fr"
              : mode === "preview"
              ? "1fr"
              : "1fr",
          gridTemplateRows:
            mode === "split" && splitDirection === "vertical"
              ? "1fr 1fr"
              : "auto",
          width: editorWidth,
          maxWidth: 1400,
        }}
      >
        {(mode === "edit" || mode === "split") && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                rows={rows}
                placeholder={placeholder}
                className="w-full flex-1 p-3 bg-accent border border-border rounded text-foreground font-mono leading-relaxed resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-background"
                spellCheck={false}
                style={{ resize: "none" }}
              />
            </div>

            {/* Bottom resize handle for height */}
            <div
              className={`h-1 w-full cursor-ns-resize flex items-center justify-center ${isResizingHeight ? "bg-primary" : "bg-transparent hover:bg-border"} transition-colors select-none mx-2`}
              onMouseDown={handleHeightResizeStart}
              style={{ marginTop: -8 }}
              title="Kéo lên/xuống để thay đổi chiều cao"
            >
              <GripVertical size={16} className="text-muted-foreground" />
            </div>

            {/* Shortcuts hint */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground" style={{fontFamily: 'monospace'}}>
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