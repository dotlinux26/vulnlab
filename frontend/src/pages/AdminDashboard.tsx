import { useState } from "react";
import AddLabForm from "./AddLabForm";
import GatewayManager from "./GatewayManager";
import AdminLessons from "./AdminLessons";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("labs");

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Menu */}
        <div className="w-full md:w-1/4 bg-card border border-border p-6 rounded-xl h-fit">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2 tracking-wider">
            ADMIN PANEL
          </h2>
          <nav className="space-y-3 font-mono text-sm">
            {[
              { key: "labs", label: "[1] Thêm Lab Mới" },
              { key: "lessons", label: "[2] Quản lý bài học" },
              { key: "gateway", label: "[3] Gateway Docker" },
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

        {/* Nội dung chính */}
        <div className="w-full md:w-3/4 space-y-6">
          {activeTab === "labs" ? (
            <AddLabForm />
          ) : activeTab === "lessons" ? (
            <AdminLessons />
          ) : (
            <GatewayManager />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
