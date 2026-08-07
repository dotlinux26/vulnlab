import { useState, useEffect } from "react";
import { Plus, Trash2, X, Loader2, BookOpen, Users, ArrowUpDown } from "lucide-react";

const pathTypes = ["RED", "BLUE", "PEN", "PURPLE"];

const statusOptions = [
  { value: "updating", label: "🔄 Còn cập nhật" },
  { value: "final", label: "✅ Chốt cứng" },
  { value: "coming_soon", label: "⏳ Chuẩn bị cập nhật" },
];

const iconOptions = [
  { value: "", label: "Không (dùng ảnh)" },
  { value: "shield", label: "Shield" },
  { value: "sword", label: "Sword" },
  { value: "ghost", label: "Ghost" },
  { value: "bug", label: "Bug" },
  { value: "target", label: "Target" },
  { value: "crosshair", label: "Crosshair" },
  { value: "terminal", label: "Terminal" },
  { value: "lock", label: "Lock" },
  { value: "key", label: "Key" },
  { value: "zap", label: "Zap (⚡)" },
  { value: "flame", label: "Flame" },
  { value: "skull", label: "Skull" },
  { value: "bomb", label: "Bomb" },
  { value: "eye", label: "Eye" },
  { value: "server", label: "Server" },
  { value: "database", label: "Database" },
  { value: "globe", label: "Globe" },
  { value: "wifi", label: "Wifi" },
  { value: "radar", label: "Radar" },
  { value: "fingerprint", label: "Fingerprint" },
  { value: "rocket", label: "Rocket" },
  { value: "wrench", label: "Wrench" },
  { value: "hammer", label: "Hammer" },
  { value: "cpu", label: "CPU" },
  { value: "code", label: "Code" },
  { value: "flag", label: "Flag" },
  { value: "crown", label: "Crown" },
  { value: "medal", label: "Medal" },
  { value: "compass", label: "Compass" },
  { value: "route", label: "Route" },
  { value: "layers", label: "Layers" },
  { value: "network", label: "Network" },
];

const emptyForm = {
  id: "",
  title: "",
  title_en: "",
  description: "",
  description_en: "",
  jobTitle: "",
  jobTitle_en: "",
  type: "PEN",
  status: "updating",
  imageUrl: "",
  icon: "",
  orderIndex: 0,
};

const AdminPaths = () => {
  const [paths, setPaths] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);

  const [panelPath, setPanelPath] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [panelLoading, setPanelLoading] = useState(false);

  const fetchPaths = async () => {
    try {
      const res = await fetch("/api/admin/paths", { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data)) setPaths(data);
    } catch (err) {
      console.error("Lỗi khi kéo danh sách lộ trình:", err);
    }
  };

  useEffect(() => {
    fetchPaths();
    fetch("/api/admin/lessons", { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllLessons(data); })
      .catch(() => {});
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === "number" ? Number(value) : value });
  };

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setIsEditing(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });
    const url = isEditing ? `/api/admin/paths/${formData.id}` : "/api/admin/paths";
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
        setMessage({ type: "success", text: isEditing ? "Cập nhật thành công!" : "Tạo lộ trình thành công!" });
        resetForm();
        fetchPaths();
      } else {
        setMessage({ type: "error", text: `Lỗi: ${data.message}` });
      }
    } catch {
      setMessage({ type: "error", text: "Không kết nối được với máy chủ." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (path: any) => {
    setFormData({
      id: path.id,
      title: path.title || "",
      title_en: path.title_en || "",
      description: path.description || "",
      description_en: path.description_en || "",
      jobTitle: path.jobTitle || "",
      jobTitle_en: path.jobTitle_en || "",
      type: path.type || "PEN",
      status: path.status || "updating",
      imageUrl: path.imageUrl || "",
      icon: path.icon || "",
      orderIndex: path.orderIndex || 0,
    });
    setIsEditing(true);
    setMessage({ type: "success", text: `Đang chỉnh sửa: ${path.id}` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm(`XÓA VĨNH VIỄN lộ trình '${id}' (kèm các bài học trong đó)?`)) return;
    try {
      const res = await fetch(`/api/admin/paths/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Đã xóa lộ trình." });
        if (formData.id === id) resetForm();
        if (panelPath === id) setPanelPath(null);
        fetchPaths();
      } else {
        setMessage({ type: "error", text: `Lỗi xóa: ${data.message}` });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi mạng khi xóa." });
    }
  };

  const togglePanel = async (pathId: string) => {
    if (panelPath === pathId) {
      setPanelPath(null);
      return;
    }
    setPanelPath(pathId);
    setPanelLoading(true);
    setMembers([]);
    setSelectedLesson("");
    try {
      const res = await fetch(`/api/admin/paths/${pathId}/lessons`, { credentials: "include" });
      if (res.ok) setMembers(await res.json());
    } catch {}
    setPanelLoading(false);
  };

  const addLessonToPath = async () => {
    if (!panelPath || !selectedLesson) return;
    setPanelLoading(true);
    try {
      const res = await fetch(`/api/admin/paths/${panelPath}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lessonId: selectedLesson }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Đã thêm bài học vào lộ trình!" });
        setSelectedLesson("");
        const r2 = await fetch(`/api/admin/paths/${panelPath}/lessons`, { credentials: "include" });
        if (r2.ok) setMembers(await r2.json());
      } else {
        setMessage({ type: "error", text: `Lỗi: ${data.message}` });
      }
    } catch {
      setMessage({ type: "error", text: "Không kết nối được với máy chủ." });
    }
    setPanelLoading(false);
  };

  const removeLessonFromPath = async (mid: number) => {
    if (!panelPath) return;
    if (!window.confirm("Gỡ bài học này khỏi lộ trình?")) return;
    try {
      const res = await fetch(`/api/admin/paths/${panelPath}/lessons/${mid}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Đã gỡ bài học khỏi lộ trình." });
        setMembers(prev => prev.filter(m => m.id !== mid));
      } else setMessage({ type: "error", text: `Lỗi: ${data.message}` });
    } catch {}
  };

  const moveMember = async (mid: number, dir: number) => {
    if (!panelPath) return;
    const idx = members.findIndex(m => m.id === mid);
    const target = idx + dir;
    if (target < 0 || target >= members.length) return;
    const next = [...members];
    [next[idx], next[target]] = [next[target], next[idx]];
    const ordered = next.map((m, i) => ({ ...m, orderIndex: i + 1 }));
    setMembers(ordered);
    try {
      for (const m of ordered) {
        await fetch(`/api/admin/paths/${panelPath}/lessons/${m.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderIndex: m.orderIndex }),
        });
      }
    } catch {}
  };

  const typeColor: Record<string, string> = {
    RED: "text-red-400 bg-red-400/10 border-red-400/30",
    BLUE: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    PEN: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    PURPLE: "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/30",
  };

  const statusMeta: Record<string, { label: string; color: string }> = {
    updating: { label: "🔄 Còn cập nhật", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
    final: { label: "✅ Chốt cứng", color: "text-neon-green bg-neon-green/10 border-neon-green/30" },
    coming_soon: { label: "⏳ Chuẩn bị cập nhật", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-card border border-border rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          {isEditing ? `CHỈNH SỬA LỘ TRÌNH: ${formData.id}` : "TẠO LỘ TRÌNH MỚI"}
        </h2>

        {message.text && (
          <div className={`p-3 mb-4 rounded font-mono text-sm ${message.type === "success" ? "bg-primary/10 text-primary border border-primary/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-foreground">ID (Mã lộ trình)*</label>
              <input type="text" name="id" required value={formData.id} onChange={handleChange} disabled={isEditing}
                placeholder="VD: dcawpt" className="w-full p-2 bg-accent border border-border rounded text-foreground disabled:opacity-50" />
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Tiêu đề (VI)*</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full p-2 bg-accent border border-border rounded text-foreground" />
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Title (EN)</label>
              <input type="text" name="title_en" value={formData.title_en} onChange={handleChange} className="w-full p-2 bg-accent border border-border rounded text-foreground" />
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Loại lộ trình</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2 bg-accent border border-border rounded text-foreground">
                {pathTypes.map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">Trạng thái lộ trình</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 bg-accent border border-border rounded text-foreground">
              {statusOptions.map(so => <option key={so.value} value={so.value}>{so.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">Mô tả (VI)</label>
            <textarea name="description" rows={2} value={formData.description} onChange={handleChange} className="w-full p-2 bg-accent border border-border rounded text-foreground" />
          </div>
          <div>
            <label className="block font-bold mb-1 text-foreground">Description (EN)</label>
            <textarea name="description_en" rows={2} value={formData.description_en} onChange={handleChange} className="w-full p-2 bg-accent border border-border rounded text-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-foreground">Mô tả công việc chuẩn (VI)</label>
              <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange}
                placeholder="VD: SOC Analyst, Penetration Tester..." className="w-full p-2 bg-accent border border-border rounded text-foreground" />
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Target Job (EN)</label>
              <input type="text" name="jobTitle_en" value={formData.jobTitle_en} onChange={handleChange} className="w-full p-2 bg-accent border border-border rounded text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-foreground">Logo lộ trình</label>
              <div className="flex gap-2">
                <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange}
                  placeholder="URL ảnh hoặc upload" className="flex-1 p-2 bg-accent border border-border rounded text-foreground" />
                <label className="cursor-pointer bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded font-bold text-xs flex items-center gap-1 transition-colors shrink-0">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append('image', file);
                    try {
                      const res = await fetch('/api/admin/paths/upload', { method: 'POST', credentials: 'include', body: fd });
                      const data = await res.json();
                      if (data.success) setFormData(prev => ({ ...prev, imageUrl: data.url, icon: "" }));
                      else alert('Lỗi: ' + data.message);
                    } catch { alert('Lỗi upload'); }
                  }} />
                </label>
              </div>
              {formData.imageUrl && (
                <img src={formData.imageUrl} alt="preview" className="mt-2 h-24 rounded border border-border object-cover" />
              )}
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Hoặc chọn icon</label>
              <select name="icon" value={formData.icon} onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value, imageUrl: "" }))} className="w-full p-2 bg-accent border border-border rounded text-foreground">
                {iconOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Nếu chọn icon thì ảnh sẽ bị bỏ qua.</p>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">Thứ tự hiển thị</label>
            <input type="number" name="orderIndex" value={formData.orderIndex} onChange={handleChange} className="w-32 p-2 bg-accent border border-border rounded text-foreground" />
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <button type="submit" disabled={isLoading} className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-3 rounded transition text-lg shadow-lg disabled:opacity-50">
              {isLoading ? "ĐANG XỬ LÝ..." : isEditing ? "LƯU THAY ĐỔI" : "TẠO LỘ TRÌNH"}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="bg-accent hover:bg-accent/80 text-foreground px-6 font-bold rounded transition">HỦY</button>
            )}
          </div>
        </form>
      </div>

      <div className="p-6 bg-card border border-border rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          DANH SÁCH LỘ TRÌNH ({paths.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs text-foreground uppercase bg-accent">
              <tr>
                <th className="px-4 py-3">ID / Tiêu đề</th>
                <th className="px-4 py-3 text-center">Loại</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Bài học</th>
                <th className="px-4 py-3 text-center">Học viên</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paths.map((path: any) => (
                <tr key={path.id} className="border-b border-border hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {path.imageUrl ? (
                        <img src={path.imageUrl} alt="" className="w-8 h-8 rounded object-cover border border-border" />
                      ) : (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${typeColor[path.type] || typeColor.PEN}`}>{path.type}</span>
                      )}
                      <div>
                        <div className="font-mono text-foreground font-bold">{path.id}</div>
                        <div className="text-xs truncate max-w-[220px]">{path.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${typeColor[path.type] || typeColor.PEN}`}>{path.type}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusMeta[path.status]?.color || statusMeta.updating.color}`}>
                      {statusMeta[path.status]?.label || statusMeta.updating.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center gap-1 justify-center text-foreground"><BookOpen size={13} className="text-primary" /> {path.lessonCount ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center gap-1 justify-center text-foreground"><Users size={13} className="text-primary" /> {path.joinedCount ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                    <button onClick={() => togglePanel(path.id)}
                      className={`px-3 py-1 rounded transition ${panelPath === path.id ? "bg-primary text-primary-foreground" : "text-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20"}`}>
                      Bài học
                    </button>
                    <button onClick={() => handleEditClick(path)} className="text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary px-3 py-1 rounded transition">Sửa</button>
                    <button onClick={() => handleDeleteClick(path.id)} className="text-destructive hover:text-destructive-foreground bg-destructive/10 hover:bg-destructive px-3 py-1 rounded transition">Xóa</button>
                  </td>
                </tr>
              ))}
              {paths.length === 0 && (
                <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">Chưa có lộ trình nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {panelPath && (
        <div className="p-6 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen size={20} className="text-cyan-400" />
              QUẢN LÝ BÀI HỌC: <span className="font-mono text-primary">{panelPath}</span>
              <span className="text-xs font-normal text-muted-foreground">({members.length})</span>
            </h2>
            <button onClick={() => setPanelPath(null)} className="text-muted-foreground hover:text-foreground transition"><X size={20} /></button>
          </div>

          <div className="flex gap-3 mb-6 p-4 bg-accent/50 border border-border rounded-lg items-end">
            <div className="flex-1">
              <label className="block font-bold mb-1 text-foreground text-sm">Thêm bài học vào lộ trình</label>
              <select value={selectedLesson} onChange={(e) => setSelectedLesson(e.target.value)} className="w-full p-2 bg-background border border-border rounded text-foreground text-sm">
                <option value="">-- Chọn bài học --</option>
                {allLessons
                  .filter(l => !members.some(m => m.lessonId === l.id))
                  .map(l => <option key={l.id} value={l.id}>{l.id} - {l.title}</option>)}
              </select>
            </div>
            <button onClick={addLessonToPath} disabled={!selectedLesson || panelLoading}
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-5 py-2 rounded font-bold text-sm transition disabled:opacity-50 flex items-center gap-2">
              {panelLoading && <Loader2 size={14} className="animate-spin" />}
              <Plus size={14} /> THÊM
            </button>
          </div>

          {panelLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">Chưa có bài học nào trong lộ trình.</p>
          ) : (
            <div className="space-y-2">
              {members.map((m, idx) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-accent/30 border border-border rounded-lg">
                  <span className="w-8 h-8 rounded bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground truncate">{m.lesson ? m.lesson.title : m.lessonId}</div>
                    {m.lesson && (
                      <div className="text-xs text-muted-foreground font-mono">{m.lessonId} · {m.lesson.category} · {m.lesson.difficulty}</div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => moveMember(m.id, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground bg-background border border-border p-1.5 rounded disabled:opacity-30 transition"><ArrowUpDown size={13} className="rotate-180" /></button>
                    <button onClick={() => moveMember(m.id, 1)} disabled={idx === members.length - 1} className="text-muted-foreground hover:text-foreground bg-background border border-border p-1.5 rounded disabled:opacity-30 transition"><ArrowUpDown size={13} /></button>
                    <button onClick={() => removeLessonFromPath(m.id)} className="text-destructive hover:text-destructive-foreground bg-destructive/10 hover:bg-destructive p-1.5 rounded transition"><Trash2 size={13} /></button>
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

export default AdminPaths;
