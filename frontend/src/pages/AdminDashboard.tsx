import { useState, useEffect } from "react";
import AddLabForm from "./AddLabForm";
import GatewayManager from "./GatewayManager";
import AdminLessons from "./AdminLessons";
import AdminPaths from "./AdminPaths";
import Navbar from "@/components/Navbar";
import ShootingStars from "@/components/ShootingStars";
import { useLanguage } from "@/contexts/LanguageContext";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("labs");
  const { t } = useLanguage();
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const stored = localStorage.getItem("user_name");
    if (stored) setUserName(stored);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <ShootingStars />
      <Navbar isLoggedIn userName={userName} />

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/4 bg-card border border-border p-6 rounded-xl h-fit">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2 tracking-wider">
              {t("admin.title")}
            </h2>
            <nav className="space-y-3 font-mono text-sm">
              {[
                { key: "labs", label: `[1] ${t("admin.labs")}` },
                { key: "lessons", label: `[2] ${t("admin.lessons")}` },
                { key: "paths", label: `[3] ${t("admin.paths")}` },
                { key: "gateway", label: `[4] ${t("admin.gateway")}` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-primary/10 border border-primary text-primary shadow-sm"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="w-full md:w-3/4 space-y-6">
            {activeTab === "labs" ? (
              <AddLabForm />
            ) : activeTab === "lessons" ? (
              <AdminLessons />
            ) : activeTab === "paths" ? (
              <AdminPaths />
            ) : (
              <GatewayManager />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
