import { useState, useEffect, useRef } from "react";
import { HelpCircle, MessageSquare, Plus, Trash2, Pencil, X, Loader2, GripVertical } from "lucide-react";
import MarkdownEditor from "@/components/MarkdownEditor";

const AdminLessons = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    title_en: "",
    description: "",
    description_en: "",
    category: "Web",
    difficulty: "Easy",
    level: "beginner",
    content: "",
    content_en: "",
    imageUrl: "",
    orderIndex: 0,
    labEnabled: false,
    labUrl: "",
    labDuration: 900,
    labComposePath: "",
    labResetTimeout: 60,
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);

  const [formWidth, setFormWidth] = useState(900);
  const [isResizingForm, setIsResizingForm] = useState(false);
  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedWidth = localStorage.getItem("admin-lessons-form-width");
    if (savedWidth) setFormWidth(parseInt(savedWidth, 10));
  }, []);

  useEffect(() => {
    localStorage.setItem("admin-lessons-form-width", formWidth.toString());
  }, [formWidth]);

  const handleFormResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    setIsResizingForm(true);
  };

  useEffect(() => {
    if (isResizingForm) {
      const handleMouseMove = (e: MouseEvent) => {
        const containerRect = formContainerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        const newWidth = e.clientX - containerRect.left;
        setFormWidth(Math.max(500, Math.min(1600, newWidth)));
      };
      const handleMouseUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setIsResizingForm(false);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizingForm]);

  // Q&A management
  const [panelLesson, setPanelLesson] = useState<string | null>(null);
  const [panelType, setPanelType] = useState<"questions" | "comments" | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [qForm, setQForm] = useState({ qid: 0, question_vi: "", question_en: "", answer_vi: "", answer_en: "", orderIndex: 0 });
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);

  const fetchLessons = async () => {
    try {
      const res = await fetch("/api/admin/lessons", { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data)) setLessons(data);
    } catch (err) {
      console.error("Lỗi khi kéo danh sách bài học:", err);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : name === "orderIndex" ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    const url = isEditing
      ? `/api/admin/lessons/${formData.id}`
      : "/api/admin/lessons";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: isEditing ? "Cập nhật thành công!" : "Tạo mới thành công!",
        });
        resetForm();
        fetchLessons();
      } else {
        setMessage({ type: "error", text: `Lỗi: ${data.message}` });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Không kết nối được với máy chủ." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (lesson: any) => {
    setFormData({
      id: lesson.id,
      title: lesson.title,
      title_en: lesson.title_en || "",
      description: lesson.description,
      description_en: lesson.description_en || "",
      category: lesson.category,
      difficulty: lesson.difficulty,
      level: lesson.level,
      content: lesson.content,
      content_en: lesson.content_en || "",
      imageUrl: lesson.imageUrl || "",
      orderIndex: lesson.orderIndex || 0,
      labEnabled: lesson.labEnabled || false,
      labUrl: lesson.labUrl || "",
      labDuration: lesson.labDuration || 900,
      labComposePath: lesson.labComposePath || "",
      labResetTimeout: lesson.labResetTimeout || 60,
    });
    setIsEditing(true);
    setMessage({ type: "success", text: `Đang chỉnh sửa: ${lesson.id}` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm(`XÓA VĨNH VIỄN bài học '${id}'?`)) return;

    try {
      const res = await fetch(`/api/admin/lessons/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Đã xóa thành công!" });
        if (formData.id === id) resetForm();
        fetchLessons();
      } else {
        setMessage({ type: "error", text: `Lỗi xóa: ${data.message}` });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Lỗi mạng khi xóa." });
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      title_en: "",
      description: "",
      description_en: "",
      category: "Web",
      difficulty: "Easy",
      level: "beginner",
      content: "",
      content_en: "",
      imageUrl: "",
      orderIndex: 0,
      labEnabled: false,
      labUrl: "",
      labDuration: 900,
      labComposePath: "",
      labResetTimeout: 60,
    });
    setIsEditing(false);
  };

  const togglePanel = async (lessonId: string, type: "questions" | "comments") => {
    if (panelLesson === lessonId && panelType === type) {
      setPanelLesson(null);
      setPanelType(null);
      return;
    }
    setPanelLesson(lessonId);
    setPanelType(type);
    setPanelLoading(true);
    if (type === "questions") {
      setQuestions([]);
      setQForm({ qid: 0, question_vi: "", question_en: "", answer_vi: "", answer_en: "", orderIndex: 0 });
      try {
        const res = await fetch(`/api/admin/lessons/${lessonId}/questions`, { credentials: "include" });
        if (res.ok) setQuestions(await res.json());
      } catch {}
    } else {
      setCommentsList([]);
      try {
        const res = await fetch(`/api/admin/lessons/${lessonId}/comments`, { credentials: "include" });
        if (res.ok) setCommentsList(await res.json());
      } catch {}
    }
    setPanelLoading(false);
  };

  const saveQuestion = async (e: any) => {
    e.preventDefault();
    setPanelLoading(true);
    try {
      const url = qForm.qid
        ? `/api/admin/questions/${qForm.qid}`
        : `/api/admin/lessons/${panelLesson}/questions`;
      const method = qForm.qid ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(qForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Đã lưu câu hỏi!" });
        setQForm({ qid: 0, question_vi: "", question_en: "", answer_vi: "", answer_en: "", orderIndex: 0 });
        const r2 = await fetch(`/api/admin/lessons/${panelLesson}/questions`, { credentials: "include" });
        if (r2.ok) setQuestions(await r2.json());
      } else {
        setMessage({ type: "error", text: `Lỗi: ${data.message}` });
      }
    } catch {
      setMessage({ type: "error", text: "Không kết nối được với máy chủ." });
    }
    setPanelLoading(false);
  };

  const editQuestion = (q: any) => {
    setQForm({
      qid: q.id,
      question_vi: q.question_vi,
      question_en: q.question_en || "",
      answer_vi: q.answer_vi,
      answer_en: q.answer_en || "",
      orderIndex: q.orderIndex || 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteQuestion = async (qid: number) => {
    if (!window.confirm("Xóa câu hỏi này?")) return;
    try {
      const res = await fetch(`/api/admin/questions/${qid}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Đã xóa câu hỏi." });
        const r2 = await fetch(`/api/admin/lessons/${panelLesson}/questions`, { credentials: "include" });
        if (r2.ok) setQuestions(await r2.json());
      } else setMessage({ type: "error", text: `Lỗi: ${data.message}` });
    } catch {}
  };

  const deleteComment = async (cid: number) => {
    if (!window.confirm("Xóa bình luận này (kèm các trả lời)?")) return;
    try {
      const res = await fetch(`/api/admin/lessons/${panelLesson}/comments/${cid}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Đã xóa bình luận." });
        setCommentsList(prev => prev.filter(c => c.id !== cid && c.parentId !== cid));
      } else setMessage({ type: "error", text: `Lỗi: ${data.message}` });
    } catch {}
  };

  const formatTime = (ts: number) => {
    try { return new Date(ts).toLocaleString("vi-VN"); } catch { return ""; }
  };

  return (
    <div className="space-y-8">
      <div ref={formContainerRef} className="relative" style={{ width: formWidth, maxWidth: 1600 }}>
        <div className="p-6 bg-card border border-border rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          {isEditing ? `CHỈNH SỬA: ${formData.id}` : "TẠO BÀI HỌC MỚI"}
        </h2>

        {message.text && (
          <div
            className={`p-3 mb-4 rounded font-mono text-sm ${
              message.type === "success"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-destructive/10 text-destructive border border-destructive/30"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-foreground">ID (Mã bài học)*</label>
              <input
                type="text"
                name="id"
                required
                value={formData.id}
                onChange={handleChange}
                disabled={isEditing}
                className="w-full p-2 bg-accent border border-border rounded text-foreground disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Tiêu đề (VI)*</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 bg-accent border border-border rounded text-foreground"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Title (EN)</label>
              <input
                type="text"
                name="title_en"
                value={formData.title_en}
                onChange={handleChange}
                className="w-full p-2 bg-accent border border-border rounded text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold mb-1 text-foreground">Thể loại</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 bg-accent border border-border rounded text-foreground"
              >
                <option value="Web">Web</option>
                <option value="Pwn">Pwn</option>
                <option value="Forensics">Forensics</option>
                <option value="Crypto">Crypto</option>
                <option value="Reverse">Reverse</option>
                <option value="OSINT">OSINT</option>
                <option value="Network">Network</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Độ khó</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full p-2 bg-accent border border-border rounded text-foreground"
              >
                <option value="Easy">Dễ</option>
                <option value="Medium">Trung bình</option>
                <option value="Hard">Khó</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Cấp độ</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full p-2 bg-accent border border-border rounded text-foreground"
              >
                <option value="beginner">Cơ bản</option>
                <option value="intermediate">Trung cấp</option>
                <option value="advanced">Nâng cao</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">Mô tả (VI)</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 bg-accent border border-border rounded text-foreground"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">Description (EN)</label>
            <textarea
              name="description_en"
              rows={3}
              value={formData.description_en}
              onChange={handleChange}
              className="w-full p-2 bg-accent border border-border rounded text-foreground"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://... hoặc upload ảnh"
                className="flex-1 p-2 bg-accent border border-border rounded text-foreground placeholder:text-muted-foreground"
              />
              <label className="cursor-pointer bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded font-bold text-xs flex items-center gap-1 transition-colors">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append('image', file);
                    try {
                      const res = await fetch('/api/admin/lessons/upload', {
                        method: 'POST', credentials: 'include', body: fd
                      });
                      const data = await res.json();
                      if (data.success) {
                        setFormData(prev => ({ ...prev, imageUrl: data.url }));
                      } else alert('Lỗi: ' + data.message);
                    } catch { alert('Lỗi upload'); }
                  }}
                />
              </label>
            </div>
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="preview" className="mt-2 h-24 rounded border border-border object-cover" />
            )}
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">Thứ tự hiển thị</label>
            <input
              type="number"
              name="orderIndex"
              value={formData.orderIndex}
              onChange={handleChange}
              className="w-32 p-2 bg-accent border border-border rounded text-foreground"
            />
          </div>

          {/* Lab Config Section */}
          <div className="border-t border-border pt-6 mt-6">
            <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">🧪</span>
              Cấu hình Lab Thực Hành
            </h3>
            
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="labEnabled"
                  checked={formData.labEnabled}
                  onChange={handleChange}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
                <span className="font-bold text-foreground">Kích hoạt Lab cho bài học này</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1 ml-8">
                Khi bật, học viên sẽ thấy thẻ "Lab Thực Hành" trên trang chi tiết bài học.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 text-foreground">Lab URL *</label>
                <input
                  type="text"
                  name="labUrl"
                  value={formData.labUrl}
                  onChange={handleChange}
                  placeholder="https://vuln.ghedahaui.online/labs/sqli"
                  className="w-full p-2 bg-accent border border-border rounded text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">URL công khai của lab (ví dụ: /labs/sqli)</p>
              </div>
              <div>
                <label className="block font-bold mb-1 text-foreground">Thời lượng (giây) *</label>
                <input
                  type="number"
                  name="labDuration"
                  value={formData.labDuration}
                  onChange={handleChange}
                  min="60"
                  max="3600"
                  className="w-full p-2 bg-accent border border-border rounded text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">Thời gian tối đa học viên được dùng lab (mặc định 900 = 15 phút)</p>
              </div>
              <div>
                <label className="block font-bold mb-1 text-foreground">Docker Compose Path *</label>
                <input
                  type="text"
                  name="labComposePath"
                  value={formData.labComposePath}
                  onChange={handleChange}
                  placeholder="ctf-labs/labs/11-sqli-basics"
                  className="w-full p-2 bg-accent border border-border rounded text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">Đường dẫn tương đối đến thư mục chứa docker-compose.yml</p>
              </div>
              <div>
                <label className="block font-bold mb-1 text-foreground">Reset Timeout (giây) *</label>
                <input
                  type="number"
                  name="labResetTimeout"
                  value={formData.labResetTimeout}
                  onChange={handleChange}
                  min="10"
                  max="300"
                  className="w-full p-2 bg-accent border border-border rounded text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">Thời gian tối đa chờ lab khởi động (mặc định 60 giây)</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">Nội dung (VI - Markdown)*</label>
            <MarkdownEditor
              value={formData.content}
              onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">Content (EN - Markdown)</label>
            <MarkdownEditor
              value={formData.content_en}
              onChange={(val) => setFormData(prev => ({ ...prev, content_en: val }))}
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-3 rounded transition text-lg shadow-lg disabled:opacity-50"
            >
              {isLoading
                ? "ĐANG XỬ LÝ..."
                : isEditing
                  ? "LƯU THAY ĐỔI"
                  : "XUẤT BẢN LÊN HỆ THỐNG"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-accent hover:bg-accent/80 text-foreground px-6 font-bold rounded transition"
              >
                HỦY
              </button>
            )}
          </div>
        </form>
        {/* Resize handle for form width */}
        <div
          className="w-1 h-full absolute right-0 top-0 cursor-ew-resize flex items-center justify-center bg-transparent hover:bg-border transition-colors select-none"
          onMouseDown={handleFormResizeStart}
          style={{ height: "100%", minHeight: "100%" }}
          title="Kéo trái/phải để thay đổi độ rộng form"
        >
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
      </div>
      </div>

      <div className="p-6 bg-card border border-border rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          DANH SÁCH BÀI HỌC ({lessons.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs text-foreground uppercase bg-accent">
              <tr>
                <th className="px-4 py-3">ID / Tiêu đề</th>
                <th className="px-4 py-3 text-center">Thể loại</th>
                <th className="px-4 py-3 text-center">Độ khó / Cấp độ</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson: any) => (
                <tr key={lesson.id} className="border-b border-border hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-foreground font-bold">{lesson.id}</div>
                    <div className="text-xs truncate max-w-[200px]">{lesson.title}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                      {lesson.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-orange-400">{lesson.difficulty}</div>
                    <div className="text-xs text-muted-foreground">{lesson.level}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleEditClick(lesson)}
                      className="text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary px-3 py-1 rounded transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => togglePanel(lesson.id, "questions")}
                      className={`px-3 py-1 rounded transition flex items-center gap-1 ${
                        panelLesson === lesson.id && panelType === "questions"
                          ? "bg-primary text-primary-foreground"
                          : "text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20"
                      }`}
                    >
                      <HelpCircle size={13} />
                      Câu hỏi
                    </button>
                    <button
                      onClick={() => togglePanel(lesson.id, "comments")}
                      className={`px-3 py-1 rounded transition flex items-center gap-1 ${
                        panelLesson === lesson.id && panelType === "comments"
                          ? "bg-primary text-primary-foreground"
                          : "text-green-400 bg-green-400/10 hover:bg-green-400/20"
                      }`}
                    >
                      <MessageSquare size={13} />
                      Bình luận
                    </button>
                    <button
                      onClick={() => handleDeleteClick(lesson.id)}
                      className="text-destructive hover:text-destructive-foreground bg-destructive/10 hover:bg-destructive px-3 py-1 rounded transition"
                    >
                      Xóa
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
              {lessons.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted-foreground">
                    Chưa có bài học nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {panelLesson && panelType === "questions" && (
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle size={20} className="text-cyan-400" />
              QUẢN LÝ CÂU HỎI: <span className="font-mono text-primary">{panelLesson}</span>
            </h2>
            <button onClick={() => { setPanelLesson(null); setPanelType(null); }} className="text-muted-foreground hover:text-foreground transition">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={saveQuestion} className="space-y-3 mb-6 p-4 bg-accent/50 border border-border rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-foreground text-sm">Câu hỏi (VI)*</label>
                <textarea
                  required
                  rows={2}
                  value={qForm.question_vi}
                  onChange={(e) => setQForm({ ...qForm, question_vi: e.target.value })}
                  className="w-full p-2 bg-background border border-border rounded text-foreground text-sm"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-foreground text-sm">Question (EN)</label>
                <textarea
                  rows={2}
                  value={qForm.question_en}
                  onChange={(e) => setQForm({ ...qForm, question_en: e.target.value })}
                  className="w-full p-2 bg-background border border-border rounded text-foreground text-sm"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-foreground text-sm">Đáp án (VI)*</label>
                <input
                  required
                  value={qForm.answer_vi}
                  onChange={(e) => setQForm({ ...qForm, answer_vi: e.target.value })}
                  className="w-full p-2 bg-background border border-border rounded text-foreground text-sm"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-foreground text-sm">Answer (EN)</label>
                <input
                  value={qForm.answer_en}
                  onChange={(e) => setQForm({ ...qForm, answer_en: e.target.value })}
                  className="w-full p-2 bg-background border border-border rounded text-foreground text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="font-bold text-foreground text-sm">Thứ tự:</label>
              <input
                type="number"
                value={qForm.orderIndex}
                onChange={(e) => setQForm({ ...qForm, orderIndex: Number(e.target.value) })}
                className="w-24 p-2 bg-background border border-border rounded text-foreground text-sm"
              />
              <button
                type="submit"
                disabled={panelLoading}
                className="ml-auto bg-primary hover:bg-primary/80 text-primary-foreground px-5 py-2 rounded font-bold text-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                {panelLoading && <Loader2 size={14} className="animate-spin" />}
                <Plus size={14} />
                {qForm.qid ? "CẬP NHẬT CÂU HỎI" : "THÊM CÂU HỎI"}
              </button>
              {qForm.qid > 0 && (
                <button
                  type="button"
                  onClick={() => setQForm({ qid: 0, question_vi: "", question_en: "", answer_vi: "", answer_en: "", orderIndex: 0 })}
                  className="bg-accent hover:bg-accent/80 text-foreground px-4 py-2 rounded font-bold text-sm transition"
                >
                  HỦY
                </button>
              )}
            </div>
          </form>

          {panelLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : questions.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Chưa có câu hỏi nào cho bài học này.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-accent/30 border border-border rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-foreground mb-1">
                        {idx + 1}. {q.question_vi}
                      </div>
                      {q.question_en && (
                        <div className="text-xs text-muted-foreground mb-1">{q.question_en}</div>
                      )}
                      <div className="text-xs text-primary bg-primary/10 px-2 py-1 rounded inline-block font-mono mt-1">
                        ✓ {q.answer_vi}{q.answer_en ? ` / ${q.answer_en}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => editQuestion(q)} className="text-yellow-400 hover:text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/20 p-1.5 rounded transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteQuestion(q.id)} className="text-destructive hover:text-destructive-foreground bg-destructive/10 hover:bg-destructive p-1.5 rounded transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {panelLesson && panelType === "comments" && (
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare size={20} className="text-green-400" />
              QUẢN LÝ BÌNH LUẬN: <span className="font-mono text-primary">{panelLesson}</span>
              <span className="text-xs font-normal text-muted-foreground">({commentsList.length})</span>
            </h2>
            <button onClick={() => { setPanelLesson(null); setPanelType(null); }} className="text-muted-foreground hover:text-foreground transition">
              <X size={20} />
            </button>
          </div>

          {panelLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : commentsList.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Chưa có bình luận nào.</p>
          ) : (
            <div className="space-y-3">
              {commentsList.map((c) => (
                <div key={c.id} className={`p-4 border border-border rounded-lg ${c.parentId ? "ml-10 bg-accent/20" : "bg-accent/30"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-foreground">{c.userName || c.userId}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{formatTime(c.timestamp)}</span>
                        {c.parentId && (
                          <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">Trả lời #{c.parentId}</span>
                        )}
                      </div>
                      <div className="text-sm text-foreground/90 break-words" dangerouslySetInnerHTML={{ __html: c.content }} />
                      {c.imageUrl && (
                        <img src={c.imageUrl} alt="" className="mt-2 h-20 rounded-lg border border-border object-cover" />
                      )}
                    </div>
                    <button onClick={() => deleteComment(c.id)} className="text-destructive hover:text-destructive-foreground bg-destructive/10 hover:bg-destructive p-1.5 rounded transition shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLessons;
