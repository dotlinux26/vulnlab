import React, { useState, useEffect } from 'react';

const GatewayManager = () => {
  const [jsonContent, setJsonContent] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/admin/gateway/routes', {
          credentials: 'include'
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

  const handleSave = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/gateway/routes', {
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
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">CẤU HÌNH GATEWAY ROUTING</h2>
          <p className="text-muted-foreground text-sm mt-1">Chỉnh sửa trực tiếp luồng giao thông của Docker. Yêu cầu JSON chuẩn.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/30">
          <span className="h-2 w-2 bg-green-500 rounded-full"></span>
          <span className="text-xs font-mono">Hot Reload: ON</span>
        </div>
      </div>

      {message.text && (
        <div className={`p-3 mb-4 rounded border font-mono text-sm ${message.type === 'success' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-t-lg border border-border">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-accent">
          <div className="w-3 h-3 rounded-full bg-destructive"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-muted-foreground font-mono ml-4">lab-routes.json</span>
        </div>
        
        <textarea
          value={jsonContent}
          onChange={(e) => setJsonContent(e.target.value)}
          className="w-full h-80 p-4 bg-accent text-foreground font-mono text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary rounded-b-lg resize-y"
          spellCheck="false"
        />
      </div>

      <button 
        onClick={handleSave} 
        disabled={isLoading}
        className="mt-6 w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-3 rounded transition duration-200 flex justify-center items-center disabled:opacity-50"
      >
        {isLoading ? 'ĐANG ĐỒNG BỘ...' : 'LƯU VÀ CẬP NHẬT GATEWAY'}
      </button>

      <div className="mt-4 text-xs text-muted-foreground font-mono">
        <b>Ví dụ hợp lệ:</b><br/>
        {`{ "/jwt": "http://127.0.0.1:7001", "/otp": "http://127.0.0.1:7002" }`}
      </div>
    </div>
  );
};

export default GatewayManager;
