import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Users, PlusCircle, MinusCircle, CheckCircle, XCircle, FileText, Ticket, Trash2, Award, Download } from "lucide-react";

const VoucherManager = () => {
  const [activeTab, setActiveTab] = useState('vouchers');
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [adminAvatar, setAdminAvatar] = useState("");
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("user_name") || "Admin";
    const userDataStr = localStorage.getItem("user_data");
    let avatar = "";
    if (userDataStr) {
      try {
        const parsed = JSON.parse(userDataStr);
        avatar = parsed.picture || "";
      } catch (e) {}
    }
    setAdminName(storedName);
    setAdminAvatar(avatar);

    // ✅ Load users
    fetch("https://vuln.ghedahaui.online/api/admin/users", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {});
  }, []);

  // ✅ Load submissions khi tab "Chấm Bài Thi" được click
  useEffect(() => {
    if (activeTab === 'exams') {
      fetchSubmissions();
    }
  }, [activeTab]);

  const fetchSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const res = await fetch("https://vuln.ghedahaui.online/api/admin/submissions", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.submissions)) {
        setSubmissions(data.submissions);
        console.log("✅ Loaded submissions:", data.submissions);
      } else {
        console.error("❌ Lỗi khi load submissions:", data.message);
        setSubmissions([]);
      }
    } catch (error) {
      console.error("❌ Lỗi mạng khi load submissions:", error);
      setSubmissions([]);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleAdjustXP = async (userId: string, action: 'Cộng' | 'Trừ') => {
    const inputStr = prompt(`Nhập số lượng XP muốn ${action} (Ví dụ: 50):`);
    if (!inputStr) return;

    const absoluteAmount = Math.abs(Number(inputStr));
    if (isNaN(absoluteAmount) || absoluteAmount === 0) {
      alert("Vui lòng nhập một số hợp lệ!");
      return;
    }

    const amount = action === 'Cộng' ? absoluteAmount : -absoluteAmount;
    const reason = prompt("Lý do thay đổi XP:");

    try {
      const res = await fetch(`https://vuln.ghedahaui.online/api/admin/users/${userId}/adjust-xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, xp: data.user.xp, level: data.user.level, rank: data.user.rank } : u));
        alert(`✅ Đã cập nhật XP cho ${data.message}`);
      } else {
        alert(`❌ Lỗi: ${data.message}`);
      }
    } catch (err) {
      alert("❌ Lỗi mạng!");
    }
  };

  const handleAdjustVoucher = async (userId: string, action: 'Cộng' | 'Trừ') => {
    const inputStr = prompt(`Nhập số lượng VOUCHER muốn ${action} (Ví dụ: 10):`);
    if (!inputStr) return;

    const absoluteAmount = Math.abs(Number(inputStr));
    if (isNaN(absoluteAmount) || absoluteAmount === 0) {
      alert("Vui lòng nhập một số hợp lệ!");
      return;
    }

    const amount = action === 'Cộng' ? absoluteAmount : -absoluteAmount;
    const reason = prompt("Lý do thay đổi Voucher:");

    try {
      const res = await fetch(`https://vuln.ghedahaui.online/api/admin/users/${userId}/adjust-voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, voucherXp: data.user.voucherXp } : u));
        alert(`✅ Đã cập nhật Voucher!`);
      } else {
        alert(`❌ Lỗi: ${data.message}`);
      }
    } catch (err) {
      alert("❌ Lỗi mạng!");
    }
  };

  const handleResetVoucher = async (userId: string) => {
    if (!window.confirm("Chắc chắn muốn xóa sạch Voucher của học viên này về 0?")) return;
    try {
      const res = await fetch(`https://vuln.ghedahaui.online/api/admin/users/${userId}/voucher`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, voucherXp: 0 } : u));
        alert("✅ Đã reset Voucher!");
      } else {
        alert(`❌ Lỗi: ${data.message}`);
      }
    } catch (err) {
      alert("❌ Lỗi mạng!");
    }
  };

  // ✅ FIX: Grade submission
  const gradeSubmission = async (subId: number, status: 'passed' | 'failed') => {
    const adminComment = prompt(`Nhận xét (${status === 'passed' ? 'PASS' : 'FAIL'}):`);
    if (adminComment === null) return;

    try {
      const res = await fetch(`https://vuln.ghedahaui.online/api/admin/submissions/${subId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, adminComment })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        fetchSubmissions();
      } else {
        alert(`❌ Lỗi: ${data.message}`);
      }
    } catch (err) {
      alert("❌ Lỗi mạng!");
    }
  };

  const filteredUsers = users.filter((u: any) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar isLoggedIn={true} userName={adminName} userAvatar={adminAvatar} />
      <main className="pt-24 pb-12 px-4 container mx-auto max-w-7xl">
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-primary w-8 h-8" />
            <h1 className="text-3xl font-bold text-foreground">Trung Tâm Quản Lý</h1>
          </div>
          <p className="text-muted-foreground mb-8">Kiểm soát tài nguyên học viên và chấm điểm chứng chỉ.</p>

          <div className="flex gap-4 border-b border-border mb-6 pb-2">
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`px-4 py-2 font-bold flex items-center gap-2 ${
                activeTab === 'vouchers'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Ticket size={18} /> Học Viên & Tài Nguyên
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 font-bold flex items-center gap-2 ${
                activeTab === 'exams'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={18} /> Chấm Bài Thi
              {submissions.filter((s: any) => s.status === 'pending').length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {submissions.filter((s: any) => s.status === 'pending').length}
                </span>
              )}
            </button>
          </div>

          {/* Tab: Vouchers */}
          {activeTab === 'vouchers' && (
            <div>
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-3 bg-background border border-input rounded text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-foreground text-sm">
                  <thead className="bg-secondary text-secondary-foreground uppercase text-xs">
                    <tr>
                      <th className="p-3">Học viên</th>
                      <th className="p-3">Level / Rank</th>
                      <th className="p-3 text-center">XP (Cày Cuốc)</th>
                      <th className="p-3 text-center">Voucher (Vé Thi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u: any) => (
                      <tr key={u.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="p-3">
                          <div className="font-bold">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs border border-primary/30">
                            Lv.{u.level} - {u.rank}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col items-center gap-2">
                            <span className="font-mono font-bold text-green-500">{u.xp || 0} XP</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAdjustXP(u.id, "Cộng")}
                                className="bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white px-2 py-1 rounded transition-colors"
                                title="Thêm XP"
                              >
                                <PlusCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleAdjustXP(u.id, "Trừ")}
                                className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-2 py-1 rounded transition-colors"
                                title="Trừ XP"
                              >
                                <MinusCircle size={14} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col items-center gap-2">
                            <span className="font-mono font-bold text-yellow-500 flex items-center gap-1">
                              <Ticket size={14} /> {u.voucherXp || 0}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleAdjustVoucher(u.id, "Cộng")}
                                className="bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600 hover:text-white px-2 py-1 rounded transition-colors"
                                title="Thêm Voucher"
                              >
                                <PlusCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleAdjustVoucher(u.id, "Trừ")}
                                className="bg-orange-600/20 text-orange-500 hover:bg-orange-600 hover:text-white px-2 py-1 rounded transition-colors"
                                title="Trừ Voucher"
                              >
                                <MinusCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleResetVoucher(u.id)}
                                className="bg-destructive/20 text-destructive hover:bg-destructive hover:text-white px-2 py-1 rounded transition-colors"
                                title="Xóa sạch Voucher"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Exams */}
          {activeTab === 'exams' && (
            <div>
              {isLoadingSubmissions && (
                <div className="text-center py-8 text-muted-foreground">
                  ⏳ Đang tải bài nộp...
                </div>
              )}
              {submissions.length === 0 && !isLoadingSubmissions && (
                <div className="text-center py-8 text-muted-foreground">
                  ✅ Không có bài nộp nào!
                </div>
              )}
              {submissions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-foreground text-sm">
                    <thead className="bg-secondary text-secondary-foreground uppercase text-xs">
                      <tr>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Học viên</th>
                        <th className="p-3">Bài Thi</th>
                        <th className="p-3 text-center">Trạng thái</th>
                        <th className="p-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub: any) => (
                        <tr key={sub.id} className="border-b border-border hover:bg-secondary/50">
                          <td className="p-3 text-xs text-muted-foreground">{sub.submittedAt}</td>
                          <td className="p-3">
                            <div className="font-bold">{sub.studentName}</div>
                            <div className="text-xs text-muted-foreground">{sub.email}</div>
                          </td>
                          <td className="p-3 font-mono text-primary flex items-center gap-2">
                            <Award size={16} /> {sub.examId}
                          </td>
                          <td className="p-3 text-center">
                            {sub.status === 'pending' && (
                              <span className="text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded">
                                Chờ duyệt
                              </span>
                            )}
                            {sub.status === 'passed' && (
                              <span className="text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">
                                ✅ Đã qua
                              </span>
                            )}
                            {sub.status === 'failed' && (
                              <span className="text-destructive font-bold bg-destructive/10 px-2 py-1 rounded">
                                ❌ Trượt
                              </span>
                            )}
                          </td>
                          <td className="p-3 flex justify-center gap-2">
                            {sub.fileUrl && (
                              <a
                                href={`https://vuln.ghedahaui.online${sub.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600/20 text-blue-500 hover:bg-blue-600 hover:text-white px-3 py-1 rounded flex items-center gap-1 border border-blue-500/50 transition-colors"
                              >
                                <Download size={16} /> Tải
                              </a>
                            )}
                            {sub.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => gradeSubmission(sub.id, 'passed')}
                                  className="text-green-500 hover:text-white bg-green-900/30 hover:bg-green-600 px-2 py-1 rounded transition-colors"
                                  title="Chấm PASS"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => gradeSubmission(sub.id, 'failed')}
                                  className="text-destructive hover:text-white bg-red-900/30 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                                  title="Chấm FAIL"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VoucherManager;
