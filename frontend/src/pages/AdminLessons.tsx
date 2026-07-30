import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AdminLessons = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
    setShowPreview(false);
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">
          {isEditing ? `CHỈNH SỬA: ${formData.id}` : "TẠO BÀI HỌC MỚI"}
        </h2>

        {message.text && (
          <div
            className={`p-3 mb-4 rounded font-mono text-sm ${
              message.type === "success"
                ? "bg-green-900/50 text-green-300 border border-green-500"
                : "bg-red-900/50 text-red-300 border border-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-gray-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">ID (Mã bài học)*</label>
              <input
                type="text"
                name="id"
                required
                value={formData.id}
                onChange={handleChange}
                disabled={isEditing}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Tiêu đề*</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold mb-1">Thể loại</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
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
              <label className="block font-bold mb-1">Độ khó</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              >
                <option value="Easy">Dễ</option>
                <option value="Medium">Trung bình</option>
                <option value="Hard">Khó</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Cấp độ</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              >
                <option value="beginner">Cơ bản</option>
                <option value="intermediate">Trung cấp</option>
                <option value="advanced">Nâng cao</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Mô tả</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://... hoặc upload ảnh"
                className="flex-1 p-2 bg-gray-800 border border-gray-600 rounded text-white"
              />
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-1 transition-colors">
                📷 Upload
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
                        alert('✅ Upload thành công!');
                      } else alert('❌ ' + data.message);
                    } catch { alert('❌ Lỗi upload'); }
                  }}
                />
              </label>
            </div>
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="preview" className="mt-2 h-24 rounded border border-gray-600 object-cover" />
            )}
          </div>

          <div>
            <label className="block font-bold mb-1">Thứ tự hiển thị</label>
            <input
              type="number"
              name="orderIndex"
              value={formData.orderIndex}
              onChange={handleChange}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white w-32"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold">Nội dung (Markdown)*</label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showPreview ? "Ẩn preview" : "Xem preview"}
              </button>
            </div>
            <textarea
              name="content"
              rows={16}
              required
              value={formData.content}
              onChange={handleChange}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white font-mono leading-relaxed"
            />
            {showPreview && (
              <div className="mt-2 p-4 bg-gray-850 border border-gray-600 rounded prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {formData.content || "*Chưa có nội dung*"}
                </ReactMarkdown>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-700">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded transition text-lg shadow-lg disabled:opacity-50"
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
                className="bg-gray-600 hover:bg-gray-500 px-6 font-bold rounded text-white transition"
              >
                HỦY
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-white">
          DANH SÁCH BÀI HỌC ({lessons.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-800">
              <tr>
                <th className="px-4 py-3">ID / Tiêu đề</th>
                <th className="px-4 py-3 text-center">Thể loại</th>
                <th className="px-4 py-3 text-center">Độ khó / Cấp độ</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson: any) => (
                <tr key={lesson.id} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <div className="font-mono text-white font-bold">{lesson.id}</div>
                    <div className="text-xs truncate max-w-[200px]">{lesson.title}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded text-xs">
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
                      className="text-blue-400 hover:text-white bg-blue-900/30 px-3 py-1 rounded transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteClick(lesson.id)}
                      className="text-red-400 hover:text-white bg-red-900/30 px-3 py-1 rounded transition"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {lessons.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4">
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
