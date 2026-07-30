import { useState, useMemo, useEffect } from "react";
import { Search, Filter, X, Loader2, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import LabCard from "@/components/LabCard";
import { fetchLabs, type PaginatedResponse, type LabWithStatus } from "@/services/api";
import { type Difficulty, type Category, type LabStatus, type Lab } from "@/data/labs";

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];
const categories: Category[] = ["Web", "Pwn", "Forensics", "Crypto", "Reverse", "OSINT", "Network"];
const statuses: { value: LabStatus; label: string }[] = [
  { value: "solved", label: "Solved" },
  { value: "unsolved", label: "Unsolved" },
  { value: "in-progress", label: "In Progress" },
];

const Dashboard = () => {
  const [labs, setLabs] = useState<LabWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | "">("");
  const [selectedCat, setSelectedCat] = useState<Category | "">("");
  const [selectedStatus, setSelectedStatus] = useState<LabStatus | "">("");
  const [showFilters, setShowFilters] = useState(false);

  const userName = localStorage.getItem("user_name") || "Học viên";

  const loadPage = async (pageNum: number, append = false) => {
    try {
      const result = await fetchLabs(pageNum, 12) as PaginatedResponse<LabWithStatus>;
      if (append) {
        setLabs(prev => [...prev, ...result.items]);
      } else {
        setLabs(result.items);
      }
      setTotalPages(result.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error("Lỗi lấy danh sách Lab:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadPage(1);
  }, []);

  const loadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      loadPage(page + 1, true);
    }
  };

  const filtered = useMemo(() => {
    return labs.filter((lab) => {
      if (search && !lab.title.toLowerCase().includes(search.toLowerCase()) && !lab.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedDiff && lab.difficulty !== selectedDiff) return false;
      if (selectedCat && lab.category !== selectedCat) return false;
      if (selectedStatus && lab.status !== selectedStatus) return false;
      return true;
    });
  }, [labs, search, selectedDiff, selectedCat, selectedStatus]);

  const hasFilters = selectedDiff || selectedCat || selectedStatus;

  const clearFilters = () => {
    setSelectedDiff("");
    setSelectedCat("");
    setSelectedStatus("");
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <ShootingStars />
      <Navbar isLoggedIn userName={userName} />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="mb-8" style={{ animation: "fade-in-up 0.6s ease-out" }}>
            <h1 className="text-3xl font-bold text-foreground mb-2">Khu vực huấn luyện</h1>
            <p className="text-muted-foreground">
              Chào mừng <span className="text-primary font-medium">{userName}</span>. Hãy chọn một thử thách để bắt đầu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6" style={{ animation: "fade-in-up 0.6s ease-out 0.1s both" }}>
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm bài Lab..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-2.5 pl-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${showFilters ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Filter size={18} />
              Bộ lọc
              {hasFilters && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="glass-card rounded-xl p-4 mb-6 space-y-4" style={{ animation: "scale-in 0.3s ease-out" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Bộ lọc</span>
                {hasFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-destructive hover:underline">
                    <X size={12} /> Xóa bộ lọc
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Độ khó</label>
                  <div className="flex flex-wrap gap-2">
                    {difficulties.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDiff(selectedDiff === d ? "" : d)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedDiff === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Thể loại</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCat(selectedCat === c ? "" : c)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCat === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Trạng thái</label>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSelectedStatus(selectedStatus === s.value ? "" : s.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedStatus === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4">
            {filtered.length} bài Lab {hasFilters && <span className="text-primary">(đã lọc)</span>}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((lab, i) => (
              <div key={lab.id} style={{ animation: `fade-in-up 0.5s ease-out ${i * 0.05}s both` }}>
                <LabCard lab={lab} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg mb-2">Không tìm thấy bài Lab nào</p>
              <button onClick={clearFilters} className="text-primary hover:underline text-sm">Xóa bộ lọc</button>
            </div>
          )}

          {page < totalPages && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary/50 text-foreground px-6 py-3 rounded-lg transition-all disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ChevronDown size={18} />
                )}
                Tải thêm Lab
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
