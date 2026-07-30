import { useState } from "react";
import AddLabForm from "./AddLabForm";
import GatewayManager from "./GatewayManager";
import AdminLessons from "./AdminLessons";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("labs");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Menu */}
        <div className="w-full md:w-1/4 bg-gray-900 p-6 rounded-lg border border-gray-800 h-fit">
          <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
            <span>⚙️</span> ADMIN PANEL
          </h2>
          <ul className="space-y-3 font-mono text-sm">
            <li 
              onClick={() => setActiveTab('labs')} 
              className={`cursor-pointer p-3 rounded transition-all duration-200 ${
                activeTab === 'labs' 
                  ? 'bg-red-900/30 border border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                  : 'hover:bg-gray-800 text-gray-400'
              }`}
            >
              [1] Thêm Lab Mới
            </li>
            <li 
              onClick={() => setActiveTab('lessons')} 
              className={`cursor-pointer p-3 rounded transition-all duration-200 ${
                activeTab === 'lessons' 
                  ? 'bg-red-900/30 border border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                  : 'hover:bg-gray-800 text-gray-400'
              }`}
            >
              [2] Quản lý bài học
            </li>
            <li 
              onClick={() => setActiveTab('gateway')} 
              className={`cursor-pointer p-3 rounded transition-all duration-200 ${
                activeTab === 'gateway' 
                  ? 'bg-red-900/30 border border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                  : 'hover:bg-gray-800 text-gray-400'
              }`}
            >
              [3] Gateway Docker
            </li>
          </ul>
        </div>

        {/* Nội dung chính (Chuyển đổi Tab) */}
        <div className="w-full md:w-3/4">
          {activeTab === 'labs' ? <AddLabForm /> : activeTab === 'lessons' ? <AdminLessons /> : <GatewayManager />}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
