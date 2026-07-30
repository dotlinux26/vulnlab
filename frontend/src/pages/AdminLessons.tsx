import { useState, useEffect } from "react";
import MarkdownEditor from "@/components/MarkdownEditor";

const AdminLessons = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: "",
    category: "Web",
    difficulty: "Easy",
    level: "beginner",
    content: "",
    imageUrl: "",
    orderIndex: 0,
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);

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
      description: lesson.description,
      category: lesson.category,
      difficulty: lesson.difficulty,
      level: lesson.level,
      content: lesson.content,
      imageUrl: lesson.imageUrl || "",
      orderIndex: lesson.orderIndex || 0,
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
      description: "",
      category: "Web",
      difficulty: "Easy",
      level: "beginner",
      content: "",
      imageUrl: "",
      orderIndex: 0,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
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
              <label className="block font-bold mb-1 text-foreground">Tiêu đề*</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
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
            <label className="block font-bold mb-1 text-foreground">Mô tả</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
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

          <div>
            <label className="block font-bold mb-1 text-foreground">Nội dung (Markdown)*</label>
            <MarkdownEditor
              value={formData.content}
              onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
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
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => handleEditClick(lesson)}
                      className="text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary px-3 py-1 rounded transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteClick(lesson.id)}
                      className="text-destructive hover:text-destructive-foreground bg-destructive/10 hover:bg-destructive px-3 py-1 rounded transition"
                    >
                      Xóa
                    </button>
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
    </div>
  );
};

export default AdminLessons;
