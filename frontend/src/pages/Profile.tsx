import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { fetchProfile } from "@/services/api";
import { CheckCircle, Star, Calendar, Trophy, Zap, Loader2, Award, ExternalLink } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Profile = () => {
  const { lang, t } = useLanguage();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile()
      .then((data) => setProfileData(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-destructive text-xl font-bold">{t("profile.error")}</div>
      </div>
    );
  }

  const userName = profileData.name || "Học viên";
  const solvedLabs = profileData.history || [];
  const xpPercent = (profileData.xp / (profileData.level * 1000)) * 100;
  
  const totalSkillsPoints = profileData.skills
    ? Object.values(profileData.skills).reduce((acc: number, curr: any) => acc + curr, 0)
    : 0;

  const chartData = profileData.skills ? Object.keys(profileData.skills).map(key => {
    const rawValue = profileData.skills[key];
    const percentage = totalSkillsPoints > 0 ? Math.round((rawValue / totalSkillsPoints) * 100) : 0;
    return { subject: `${key} ${percentage}%`, value: percentage, fullMark: 100 };
  }) : [];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative">
      <ShootingStars />
      <Navbar isLoggedIn userName={userName} />
      
      <main className="pt-28 pb-12 px-6 container mx-auto max-w-6xl space-y-8 relative z-10">
        <div className="bg-card border border-border rounded-[2rem] p-8 md:p-10 shadow-xl flex flex-col md:flex-row items-center gap-8">
          <img
            src={profileData.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=a855f7&color=fff`}
            alt="avatar"
            className="w-32 h-32 rounded-full border-4 border-primary shadow-lg object-cover"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-foreground mb-2 uppercase tracking-tight">{userName}</h1>
            <p className="text-muted-foreground text-lg mb-4">{profileData.email}</p>
            <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start text-base">
              <span className="flex items-center gap-2 text-primary font-black"><Star size={20} /> {t("profile.level")} {profileData.level}</span>
              <span className="flex items-center gap-2 text-muted-foreground font-bold"><Trophy size={20} /> {profileData.rank}</span>
              <span className="flex items-center gap-2 text-muted-foreground font-bold"><Calendar size={20} /> {profileData.joinDate}</span>
            </div>
            <div className="mt-6 max-w-xl mx-auto md:mx-0">
              <div className="flex justify-between text-sm font-bold text-muted-foreground mb-2">
                <span className="flex items-center gap-1 text-primary"><Zap size={16} /> {profileData.xp} XP</span>
                <span>{t("profile.xpTarget").replace("{target}", String(profileData.level * 1000))}</span>
              </div>
              <div className="w-full h-3 bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(xpPercent, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-xl">
            <h2 className="text-2xl font-black text-foreground mb-6 uppercase tracking-tighter">{t("profile.skillChart")}</h2>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                  <PolarGrid stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--foreground))", fontSize: 14, fontWeight: "bold" }} />
                  <Radar name="Skill" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-xl flex-1 grid gap-4 ">
	  <h2 className="text-2xl font-black text-primary mb-6 uppercase tracking-tighter flex items-center gap-3">
	    <Award size={28} /> {t("profile.certificates")}
	  </h2>
	  <div className="grid grid-cols-1 gap-4">
	    {profileData.certificates?.length > 0 ? (
      profileData.certificates.map((cert: any) => {
        const certTitle = lang === "en" && cert.title_en ? cert.title_en : cert.title;
        return (
        <div key={cert.hash} className="flex items-center gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl group hover:border-primary transition-all">
          <div className="p-3 bg-primary/20 rounded-xl text-primary"><Award size={28}/></div>
          <div className="flex-1 overflow-hidden">
            <div className="text-lg font-bold text-foreground leading-tight truncate">{certTitle}</div>

            <div className="text-xs font-mono text-muted-foreground mt-2 uppercase tracking-widest truncate">
              {t("profile.certId")}: #{cert.hash ? cert.hash.substring(0, 16) + '...' : t("profile.certPending")} • {t("profile.certDate")}: {cert.issueDate}
            </div>

          </div>

          <Link to={`/verify/${cert.hash}`} className="hidden sm:flex bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm items-center gap-2 transition-all opacity-0 group-hover:opacity-100 shrink-0">
            {t("profile.certVerify")} <ExternalLink size={16}/>
          </Link>
        </div>
        );
      })
	    ) : (
	      <div className="text-center py-12 text-muted-foreground text-sm font-mono italic bg-accent/30 rounded-2xl border border-dashed border-border">
	        {t("profile.certEmpty")}
	      </div>
	    )}
	</div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-xl">
                <div className="text-4xl font-black text-primary mb-2">{profileData.solvedLabsCount}</div>
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t("profile.labsSolved")}</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-xl">
                <div className="text-4xl font-black text-foreground mb-2">{profileData.totalLabs}</div>
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t("profile.totalLabs")}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-8 shadow-xl">
          <h2 className="text-2xl font-black text-foreground mb-6 uppercase tracking-tighter flex items-center gap-3">
            {t("profile.history")}
          </h2>
          {solvedLabs.length > 0 ? (
            <div className="space-y-3">
              {solvedLabs.map((lab: any) => (
                <div key={lab.id} className="flex items-center justify-between p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors border border-border/50">
                  <div className="flex items-center gap-4">
                    <CheckCircle size={24} className="text-green-500" />
                    <div>
                      <p className="text-lg font-bold text-foreground">{lab.title}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{lab.category} • {lab.difficulty}</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-primary font-mono">+{lab.points} XP</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8 font-mono italic">{t("profile.historyEmpty")}</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
