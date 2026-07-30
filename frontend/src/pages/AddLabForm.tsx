import React, { useState, useEffect } from 'react';

const AddLabForm = () => {
  const [labs, setLabs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    difficulty: 'Medium',
    category: 'Web',
    points: 100,
    flag: '',
    contentUrl: '',
    isExam: false,
    downloadUrl: '',
    price: 0,
    duration: 60,
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchLabs = async () => {
    try {
      const res = await fetch('/api/admin/labs', {
        credentials: 'include',
      });
      const data = await res.json();
      if (Array.isArray(data)) setLabs(data);
    } catch (err) {
      console.error('Lỗi khi kéo danh sách Lab:', err);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox' ? checked : name === 'points' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const url = isEditing
      ? `/api/admin/labs/${formData.id}`
      : '/api/admin/labs';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: isEditing ? 'Sửa thành công!' : 'Thêm mới thành công!',
        });
        resetForm();
        fetchLabs();
      } else {
        setMessage({ type: 'error', text: `Lỗi: ${data.message}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Không kết nối được với máy chủ.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (lab: any) => {
    setFormData({
      id: lab.id,
      title: lab.title,
      description: lab.description,
      difficulty: lab.difficulty,
      category: lab.category,
      points: lab.points,
      flag: lab.flag,
      contentUrl: lab.contentUrl,
      isExam: lab.isExam || false,
      downloadUrl: lab.downloadUrl || '',
      price: lab.price || 0,
      duration: lab.duration || 60,
    });
    setIsEditing(true);
    setMessage({ type: 'success', text: `Đang chỉnh sửa: ${lab.id}` });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm(`XÓA VĨNH VIỄN '${id}'?`)) return;

    try {
      const res = await fetch(
        `/api/admin/labs/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Đã xóa thành công!' });
        if (formData.id === id) resetForm();
        fetchLabs();
      } else {
        setMessage({ type: 'error', text: `Lỗi xóa: ${data.message}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi mạng khi xóa Lab.' });
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      difficulty: 'Medium',
      category: 'Web',
      points: 100,
      flag: '',
      contentUrl: '',
      isExam: false,
      downloadUrl: '',
      price: 0,
      duration: 60,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-card border border-border rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          {isEditing ? `CHỈNH SỬA: ${formData.id}` : 'TẠO NỘI DUNG MỚI'}
        </h2>

        {message.text && (
          <div
            className={`p-3 mb-4 rounded font-mono text-sm ${
              message.type === 'success'
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-destructive/10 text-destructive border border-destructive/30'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-muted-foreground">
          <div className="p-4 border border-primary/30 bg-primary/5 rounded flex items-center gap-3">
            <input
              type="checkbox"
              id="isExam"
              name="isExam"
              checked={formData.isExam}
              onChange={handleChange}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
            <label
              htmlFor="isExam"
              className="font-bold text-primary cursor-pointer text-lg"
            >
              ĐÁNH DẤU ĐÂY LÀ BÀI KIỂM TRA (EXAM)
            </label>
            <span className="text-xs text-muted-foreground ml-auto">
              (Yêu cầu Voucher để mở, có thời gian đếm ngược)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-foreground">ID (Mã bài)*</label>
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
              <label className="block font-bold mb-1 text-foreground">Tên bài*</label>
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
                <option value="Crypto">Crypto</option>
                <option value="Pwn">Pwn</option>
                <option value="Forensics">Forensics</option>
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
                <option value="Insane">Cực khó</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1 text-foreground">Điểm số (XP)</label>
              <input
                type="number"
                name="points"
                required
                min="10"
                step="10"
                value={formData.points}
                onChange={handleChange}
                className="w-full p-2 bg-accent border border-border rounded text-foreground"
              />
            </div>
          </div>

          {formData.isExam && (
            <div className="grid grid-cols-2 gap-4 p-4 border border-destructive/50 bg-destructive/5 rounded-lg">
              <div>
                <label className="block font-bold mb-1 text-destructive">
                  Giá mở khóa (Voucher)*
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full p-2 bg-background border border-input rounded text-foreground focus:border-destructive"
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-destructive">
                  Thời gian làm bài (Phút)*
                </label>
                <input
                  type="number"
                  name="duration"
                  required
                  min="1"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full p-2 bg-background border border-input rounded text-foreground focus:border-destructive"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1 text-foreground">
                FLAG (Nhiều flag cách nhau dấu phẩy)*
              </label>
              <input
                type="text"
                name="flag"
                required
                value={formData.flag}
                onChange={handleChange}
                placeholder="FLAG{...}, FLAG2{...}"
                className="w-full p-2 bg-accent border border-border rounded text-foreground"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-primary">
                Link File Đề Bài (Zip/Pdf)
              </label>
              <input
                type="text"
                name="downloadUrl"
                value={formData.downloadUrl}
                onChange={handleChange}
                placeholder="https://... (File đề bài .zip)"
                className="w-full p-2 bg-accent border border-border rounded text-foreground font-mono"
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block font-bold mb-1 text-secondary">
              Content URL (Dành cho bài Lab chạy Docker)
            </label>
            <input
              type="text"
              name="contentUrl"
              value={formData.contentUrl}
              onChange={handleChange}
              placeholder="https://vuln.ghedahaui.online/..."
              className="w-full p-2 bg-accent border border-border rounded text-foreground font-mono"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-foreground">
              Nội dung Đề bài (Hỗ trợ Markdown)*
            </label>
            <textarea
              name="description"
              rows={8}
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="# Đề bài...\n\n- Yêu cầu 1\n- Yêu cầu 2"
              className="w-full p-3 bg-accent border border-border rounded text-foreground font-mono leading-relaxed"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-3 rounded transition text-lg shadow-lg disabled:opacity-50"
            >
              {isLoading
                ? 'ĐANG XỬ LÝ...'
                : isEditing
                  ? 'LƯU THAY ĐỔI'
                  : 'XUẤT BẢN LÊN HỆ THỐNG'}
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
          DANH SÁCH BÀI ({labs.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs text-foreground uppercase bg-accent">
              <tr>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">ID / Tên bài</th>
                <th className="px-4 py-3 text-center">Thể loại</th>
                <th className="px-4 py-3 text-center">Độ khó / XP</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab: any) => (
                <tr
                  key={lab.id}
                  className="border-b border-border hover:bg-accent/50"
                >
                  <td className="px-4 py-3 font-bold text-center">
                    {lab.isExam ? (
                      <span className="text-destructive">EXAM</span>
                    ) : (
                      <span className="text-primary">LAB</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-foreground font-bold">{lab.id}</div>
                    <div className="text-xs truncate max-w-[200px]">
                      {lab.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                      {lab.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-orange-400">{lab.difficulty}</div>
                    <div className="text-xs text-primary font-mono">
                      {lab.points} XP
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => handleEditClick(lab)}
                      className="text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary px-3 py-1 rounded transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteClick(lab.id)}
                      className="text-destructive hover:text-destructive-foreground bg-destructive/10 hover:bg-destructive px-3 py-1 rounded transition"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {labs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">
                    Chưa có bài nào.
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

export default AddLabForm;
