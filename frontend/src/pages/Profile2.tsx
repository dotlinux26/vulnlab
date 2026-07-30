import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { fetchProfile } from "@/services/api";
import { 
  CheckCircle, Star, Calendar, Trophy, Zap, Loader2 
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { Award, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";


const Profile = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile()
      .then((data) => setProfileData(data))
      .catch((err) => console.error("Lỗi fetch profile:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>[!] Không thể tải dữ liệu thành viên.</p>
        </div>
      </div>
    );
  }

  const userName = profileData.name || "Học viên";
  const solvedLabs = profileData.history || [];
  const xpPercent = (profileData.xp / (profileData.level * 1000)) * 100;

  // Chuyển đổi dữ liệu skills từ Object sang Array cho Recharts
  // FIX CHỖ NÀY: Thêm % vào subject để hiển thị lên Chart
  // Tính tổng số điểm của TẤT CẢ kỹ năng
  const totalSkillsPoints = profileData.skills 
    ? Object.values(profileData.skills).reduce((acc: number, curr: any) => acc + curr, 0) 
    : 0;

  // Tính phần trăm cho từng cột và format lại
  const chartData = profileData.skills ? Object.keys(profileData.skills).map(key => {
    // Nếu tổng điểm = 0 thì % = 0 để tránh lỗi chia cho 0 (NaN)
    const rawValue = profileData.skills[key];
    const percentage = totalSkillsPoints > 0 ? Math.round((rawValue / totalSkillsPoints) * 100) : 0;
    
    return {
      subject: `${key} ${percentage}%`, // Hiển thị chuẩn % trên biểu đồ
      value: percentage, // Giá trị vẽ biểu đồ giờ là phần trăm (từ 0 đến 100)
      fullMark: 100,
    };
  }) : [];

  return (
    <div className="min-h-screen bg-background relative">
      <ShootingStars />
      <Navbar isLoggedIn userName={userName} />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          
          {/* Profile Header */}
          <div className="glass-card rounded-2xl p-6 md:p-8 mb-6" style={{ animation: "fade-in-up 0.6s ease-out" }}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img
                src={profileData.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=a855f7&color=fff`}
                alt="avatar"
                className="w-24 h-24 rounded-full border-4 border-primary shadow-lg"
              />
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-foreground mb-1">{userName}</h1>
                <p className="text-muted-foreground text-sm mb-3">{profileData.email}</p>
                <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-sm">
                  <span className="flex items-center gap-1 text-primary font-semibold"><Star size={16} /> Level {profileData.level}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Trophy size={16} /> {profileData.rank}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Calendar size={16} /> Tham gia {profileData.joinDate}</span>
                </div>
              </div>
            </div>

            {/* XP bar */}
            <div className="mt-4 max-w-md mx-auto md:mx-0">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span className="flex items-center gap-1"><Zap size={12} /> {profileData.xp} XP</span>
                <span>{profileData.level * 1000} XP</span>
              </div>
              <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                <div className="h-full gradient-primary transition-all duration-1000" style={{ width: `${Math.min(xpPercent, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Radar Chart - FIX LỖI CHE CHỮ */}
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center overflow-visible">
              <h2 className="text-lg font-semibold text-foreground mb-4">Biểu đồ kỹ năng thực tế</h2>
              <div className="w-full h-[320px] overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#999", fontSize: 16 }} />
                    <Radar
                      name="Skill"
                      dataKey="value"
                      stroke="#a855f7"
                      fill="#a855f7"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Card */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Thống kê cá nhân</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-accent/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold gradient-text">{profileData.solvedLabsCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Labs đã giải</div>
                </div>
                <div className="bg-accent/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold gradient-text">{profileData.totalLabs}</div>
                  <div className="text-xs text-muted-foreground mt-1">Tổng Labs</div>
                </div>
                <div className="bg-accent/50 rounded-xl p-4 text-center col-span-2">
                  <div className="text-2xl font-bold text-primary">{profileData.xp}</div>
                  <div className="text-xs text-muted-foreground mt-1">Tổng kinh nghiệm (XP)</div>
                </div>
              </div>
            </div>
          </div>
		
	  <div className="grid grid-cols-1 gap-6 mt-6">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 uppercase tracking-tighter text-primary">KHO CHỨNG CHỈ & HUY HIỆU</h2>
              <div className="grid grid-cols-1 gap-3">
                {profileData.certificates?.length > 0 ? profileData.certificates.map((cert: any) => (
                  <div key={cert.id} className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl group hover:border-primary transition-all">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary"><Award size={20}/></div>
                    <div className="flex-1">
                      <div className="text-sm font-bold">{cert.title}</div>
                      <div className="text-[10px] font-mono text-gray-500 italic uppercase">ID: {cert.hash.substring(0, 12)}...</div>
                    </div>
                    <Link to={`/verify/${cert.hash}`} className="opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={14} className="text-primary"/></Link>
                  </div>
                )) : <div className="text-center py-6 text-gray-600 text-xs italic">Chưa có chứng chỉ nào được cấp.</div>}
              </div>
            </div>
            <div className="glass-card rounded-2xl p-6 bg-accent/20 border-dashed border-border text-center">
              <p className="text-[10px] uppercase font-bold text-gray-500">Inventory Status</p>
              <div className="text-xl font-black text-white mt-1">VERIFIED_AGENT</div>
            </div>
          </div>
             


          {/* History */}
          <div className="glass-card rounded-2xl p-6 mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Lịch sử bài giải</h2>
            {solvedLabs.length > 0 ? (
              <div className="space-y-3">
                {solvedLabs.map((lab: any) => (
                  <div key={lab.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors border border-border/50">
                    <CheckCircle size={18} className="text-neon-green" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{lab.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{lab.category} • {lab.difficulty}</p>
                    </div>
                    <span className="text-xs font-bold text-primary">+{lab.points} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Bạn chưa giải bài Lab nào.</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Profile;
