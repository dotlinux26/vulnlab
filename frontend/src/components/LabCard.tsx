import { Link } from "react-router-dom";
import { CheckCircle, Clock, Circle, Shield, Bug, Search, Lock, Wifi, Globe, FileText } from "lucide-react";
import type { Lab } from "@/data/labs";
import { useLanguage } from "@/contexts/LanguageContext";

const difficultyColors = {
  Easy: "text-neon-green bg-neon-green/10 border-neon-green/30",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  Hard: "text-destructive bg-destructive/10 border-destructive/30",
};

const categoryIcons: Record<string, React.ReactNode> = {
  Web: <Globe size={14} />,
  Pwn: <Bug size={14} />,
  Forensics: <Search size={14} />,
  Crypto: <Lock size={14} />,
  Reverse: <FileText size={14} />,
  OSINT: <Search size={14} />,
  Network: <Wifi size={14} />,
};

const statusConfig = {
  solved: { icon: <CheckCircle size={16} />, label: "Solved", cls: "text-neon-green" },
  unsolved: { icon: <Circle size={16} />, label: "Unsolved", cls: "text-muted-foreground" },
  "in-progress": { icon: <Clock size={16} />, label: "In Progress", cls: "text-yellow-400" },
};

const LabCard = ({ lab }: { lab: Lab }) => {
  const { lang } = useLanguage();
  const status = statusConfig[lab.status];
  const displayTitle = lang === "en" && lab.title_en ? lab.title_en : lab.title;
  const displayDesc = lang === "en" && lab.description_en ? lab.description_en : lab.description;

  return (
    <Link
      to={`/lab/${lab.id}`}
      className="group glass-card p-5 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 block flex flex-col"
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 w-1 h-full gradient-primary rounded-l-xl" />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Shield size={18} className="text-primary shrink-0" />
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{displayTitle}</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs shrink-0 ml-2 ${status.cls}`}>
          {status.icon}
          <span>{status.label}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{displayDesc}</p>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap mt-auto">
        <span className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[lab.difficulty]}`}>
          {lab.difficulty}
        </span>
        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-border text-muted-foreground">
          {categoryIcons[lab.category]}
          {lab.category}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">{lab.points} pts • {lab.solves} solves</span>
      </div>
    </Link>
  );
};

export default LabCard;
