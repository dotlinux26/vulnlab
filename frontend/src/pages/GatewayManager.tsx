import React, { useState, useEffect } from 'react';

const GatewayManager = () => {
  const [jsonContent, setJsonContent] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Vừa vào trang là fetch nội dung file JSON về nhét vào Textarea
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('https://vuln.ghedahaui.online/api/admin/gateway/routes', {
          credentials: 'include' // Bắt buộc để xác thực Admin
        });
        const data = await response.json();
        if (data.success) {
          setJsonContent(data.data);
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
      }
    };
    fetchRoutes();
  }, []);

  // Hàm xử lý bấm nút Lưu
  const handleSave = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('https://vuln.ghedahaui.online/api/admin/gateway/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ routesContent: jsonContent })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi mạng khi lưu cấu hình.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-900 border border-red-500 rounded-lg shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-red-500">CẤU HÌNH GATEWAY ROUTING</h2>
          <p className="text-gray-400 text-sm mt-1">Trỉnh sửa trực tiếp luồng giao thông của Docker. Yêu cầu JSON chuẩn.</p>
        </div>
        <div className="animate-pulse flex items-center space-x-2 bg-green-900/30 text-green-400 px-3 py-1 rounded-full border border-green-500/50">
          <span className="h-2 w-2 bg-green-500 rounded-full"></span>
          <span className="text-xs font-mono">Hot Reload: ON</span>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 mb-4 rounded border font-mono text-sm ${message.type === 'success' ? 'bg-green-900/50 border-green-500 text-green-300' : 'bg-red-900/50 border-red-500 text-red-300'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-[#1e1e1e] rounded-t-lg p-2 flex space-x-2 border-b border-gray-700">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="text-xs text-gray-500 font-mono ml-4">lab-routes.json</span>
      </div>
      
      <textarea
        value={jsonContent}
        onChange={(e) => setJsonContent(e.target.value)}
        className="w-full h-80 p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm border-none focus:outline-none focus:ring-1 focus:ring-red-500 rounded-b-lg resize-y"
        spellCheck="false"
      />

      <button 
        onClick={handleSave} 
        disabled={isLoading}
        className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded transition duration-200 flex justify-center items-center"
      >
        {isLoading ? 'ĐANG ĐỒNG BỘ...' : '🔥 LƯU VÀ CẬP NHẬT GATEWAY'}
      </button>

      <div className="mt-4 text-xs text-gray-500 font-mono">
        <b>Ví dụ hợp lệ:</b><br/>
        {`{ "/jwt": "http://127.0.0.1:7001", "/otp": "http://127.0.0.1:7002" }`}
      </div>
    </div>
  );
};

export default GatewayManager;
