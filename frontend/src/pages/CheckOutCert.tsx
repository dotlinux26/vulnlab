import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react"; // Nhớ import useRef từ react

const CheckOutCert = () => {
  const { hash } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 2. Thêm Ref này để nhắm vào cái khung Chứng chỉ
  const certRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false); // Tuỳ chọn: dùng để hiện loading lúc tải

  useEffect(() => {
    fetch(`/api/verify/${hash}`)
      .then((res) => res.json())
      .then((d) => setData(d.success ? d.cert : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [hash]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldAlert size={80} style={{ color: '#ef4444', marginBottom: '20px' }} />
        <h1 style={{ fontSize: '30px', fontWeight: 900, textTransform: 'uppercase' }}>CHỨNG NHẬN KHÔNG TỒN TẠI</h1>
        <Link to="/" style={{ marginTop: '20px', color: '#22c55e', textDecoration: 'underline' }}>Về trang chủ</Link>
      </div>
    );
  }

  // Logic chặt chuỗi Tên chứng chỉ
  let prefix = "VULN_LAB CERTIFICATION";
  let mainName = data.title || "";
  let isSpecialist = false;

  if (data.title) {
    if (data.title.includes("Associate")) {
      const idx = data.title.indexOf("Associate") + 9;
      prefix = data.title.substring(0, idx).trim();
      mainName = data.title.substring(idx).trim();
    } else if (data.title.includes("Specialist")) {
      isSpecialist = true;
      const idx = data.title.indexOf("Specialist") + 10;
      prefix = data.title.substring(0, idx).trim();
      mainName = data.title.substring(idx).trim();
    }
  }

  const handleDownloadPdf = async () => {
    if (!certRef.current) return;
    setIsDownloading(true);

    const element = certRef.current;
    
    // Lưu lại style cũ (nếu sếp có dùng transform: scale trên giao diện để thu nhỏ)
    const originalTransform = element.style.transform;
    
    // Bắt buộc ép nó về scale(1) để html2canvas chụp đúng kích thước gốc (nét căng)
    element.style.transform = 'scale(1)';

    try {
      // Chụp DOM thành ảnh
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0a' 
      });

 
      element.style.transform = originalTransform;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      
     
      const fileName = data?.signedName ? `VULN_LAB_${data.signedName.replace(/\s+/g, '_')}.pdf` : 'VULN_LAB_Certificate.pdf';
      pdf.save(fileName);
      
    } catch (error) {
      console.error("Lỗi xuất PDF: ", error);
      element.style.transform = originalTransform; // Lỗi cũng phải trả lại UI
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <>
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;700;900&display=swap');

        @keyframes shooting-star {
            0% { transform: translate(0, 0) rotate(45deg) scale(0); opacity: 0; }
            5% { opacity: 1; }
            15% { transform: translate(-300px, 300px) rotate(45deg) scale(1); opacity: 0; }
            100% { transform: translate(-300px, 300px) rotate(45deg) scale(0); opacity: 0; }
        }

        .star {
            position: absolute;
            height: 2px;
            width: 100px;
            background: linear-gradient(45deg, rgba(168, 85, 247, 0.8), rgba(34, 197, 94, 0.2), transparent);
            filter: drop-shadow(0 0 6px rgba(168, 85, 247, 0.5));
            opacity: 0;
            border-radius: 50%;
            z-index: 0;
        }
        
        .grid-bg {
            position: absolute;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
              
            background-image: 
                linear-gradient(rgba(168,85,247,0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(168,85,247,0.08) 1px, transparent 1px);

            background-size: 40px 40px;
            
        }
      
        .grid-bg::before {
            content: "";
            position: absolute;
            inset: 0;

            background: linear-gradient(
                120deg,
                transparent 0%,
                rgba(168,85,247,0.15) 50%,
                rgba(34,197,94,0.2) 100%,
                transparent 100%
            );
        }
      
        @page { size: A4 landscape; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .cert-viewport {
            font-family: 'Inter', sans-serif;
            background-color: #050505;
            color: #ffffff;
            width: 100vw;
            min-height: 100vh;
            position: relative;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background-image: radial-gradient(circle at 100% 0%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
                              radial-gradient(circle at 0% 100%, rgba(34, 197, 94, 0.1) 0%, transparent 40%);
        }

        .cert-container {
            width: 277mm;
            height: 190mm;
            position: relative;
            background: rgba(10, 10, 10, 0.75);
            border: 2px solid rgba(168, 85, 247, 0.3);
            border-radius: 2px;
            padding: 40px 50px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            backdrop-filter: blur(15px);
            z-index: 10;
            box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
            /* Thu nhỏ lại một chút để hiển thị vừa vặn trên màn hình máy tính */
            transform: scale(0.9);
            transform-origin: center;
        }

        /* Responsive: Thu nhỏ cert-container trên màn hình nhỏ */
        @media (max-width: 1200px) {
            .cert-container { transform: scale(0.7); }
        }
        @media (max-width: 800px) {
            .cert-container { transform: scale(0.4); }
        }

        .cert-container::before, .cert-container::after { content: ''; position: absolute; width: 40px; height: 40px; border: 3px solid #a855f7; pointer-events: none; }
        .cert-container::before { top: -2px; left: -2px; border-right: none; border-bottom: none; border-top-left-radius: 2px; }
        .cert-container::after { bottom: -2px; right: -2px; border-left: none; border-top: none; border-bottom-right-radius: 2px; }
        .corner-tr { position: absolute; top: -2px; right: -2px; width: 40px; height: 40px; border: 3px solid #a855f7; border-left: none; border-bottom: none; border-top-right-radius: 2px; }
        .corner-bl { position: absolute; bottom: -2px; left: -2px; width: 40px; height: 40px; border: 3px solid #a855f7; border-right: none; border-top: none; border-bottom-left-radius: 2px; }

        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-20deg);
            font-size: 140px;
            font-weight: 900;
            color: rgba(255, 255, 255, 0.015);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
            text-align: center;
            line-height: 0.85;
            letter-spacing: -2px;
        }

        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid rgba(255, 255, 255, 0.1); padding-bottom: 20px; z-index: 1; }
        .sys-title { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #a855f7; letter-spacing: 4px; text-transform: uppercase; }
        .sys-sub { font-size: 10px; color: #888; letter-spacing: 1.5px; margin-top: 5px; text-transform: uppercase; font-weight: 700; }
        .cert-type { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 4px; text-transform: uppercase; text-shadow: 0 0 10px rgba(255,255,255,0.2); }

        .main-wrapper { display: flex; align-items: center; justify-content: space-between; flex-grow: 1; z-index: 1; padding: 20px 0; position: relative; }
        .text-content { flex: 1; padding-right: 40px; display: flex; flex-direction: column; justify-content: center; z-index: 2;}

        .subtitle { font-family: 'JetBrains Mono', monospace; color: #22c55e; font-size: 16px; letter-spacing: 3px; margin-bottom: 15px; text-transform: uppercase; font-weight: bold;}
        .student-name { font-size: 64px; font-weight: 900; text-transform: uppercase; letter-spacing: -2px; color: #ffffff; margin-bottom: 15px; text-shadow: 0 0 30px rgba(255, 255, 255, 0.2); line-height: 1; }
        .has-completed { font-size: 16px; color: #888; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;}
        
        .exam-title-wrapper { margin-top: 10px; }
        .exam-prefix { font-size: 18px; color: #a855f7; font-weight: 800; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 5px; }
        .exam-name { font-size: 42px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: -1px; line-height: 1.1; }

        .badge-wrapper {
            width: 280px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }

        .badge-core {
            width: 160px;
            height: 160px;
            background: rgba(10, 10, 10, 0.9);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 4px solid #22c55e;
            box-shadow: 0 0 40px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.2);
            z-index: 5;
        }

        .ring-ring {
            position: absolute; width: 220px; height: 220px; border-radius: 50%;
            border: 3px dashed rgba(255, 255, 255, 0.1);
	    border-right: 3px dashed #a855f7;
            animation: spin 15s linear infinite; z-index: 3;
        }

        .ring-3 {
            position: absolute; width: 280px; height: 280px; border-radius: 50%;
            border: 3px dashed rgba(255, 255, 255, 0.1);
            border-right: 3px dashed #a855f7;
            animation: spin-reverse 20s linear infinite; z-index: 2;
        }

        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }

        .badge-core svg {
            width: 70px; height: 70px; stroke: #22c55e; stroke-width: 1.5; fill: none;
            filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4));
        }

        .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 25px; border-top: 3px solid rgba(255, 255, 255, 0.1); z-index: 1; }
        .meta-info { display: flex; gap: 60px; }
        .meta-block { display: flex; flex-direction: column; gap: 8px; }
        .meta-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;}
        .hash-box { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #22c55e; letter-spacing: 1px; opacity: 0.8; }
        .meta-value { font-family: 'JetBrains Mono', monospace; font-size: 16px; color: #ffffff; font-weight: 700; }

        .signature-block { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
        .signature-image { height: 70px; margin-bottom: 5px; filter: invert(1); } 
        .signature-line { width: 220px; height: 1px; background-color: #666; margin-bottom: 8px; }
        .director-title { font-size: 14px; color: #a855f7; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
        .director-sub { font-size: 10px; color: #888; letter-spacing: 1px; margin-top: 4px; font-weight: bold; text-transform: uppercase;}
        `}
      </style>

      <button 
        onClick={handleDownloadPdf} 
        disabled={isDownloading}
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '10px 20px', cursor: 'pointer',color: 'white' }}
      >
        {isDownloading ? 'Đang tạo PDF...' : 'Tải xuống PDF'}
      </button>

      <div className="cert-viewport">
        
        <div className="cert-container" ref={certRef}>
          <div className="corner-tr" />
          <div className="corner-bl" />
              <div className="grid-bg" />
          <div className="watermark">
            D.O.T
            <br />
            <span style={{ fontSize: '120px' }}>
              SOLUTIONS
            </span>
          </div>
          <div className="header">
            <div>
              <div className="sys-title">
                GHEDAHAUI.ONLINE // VULNLAB PROJECT
              </div>
              <div className="sys-sub">
                A PROJECT BY D.O.T SOLUTIONS GROUP
              </div>
            </div>
            <div className="cert-type">
              CERTIFICATION
            </div>
          </div>
          <div className="main-wrapper">
        
            <div className="text-content">
              <div className="subtitle">
                This certifies that
              </div>
              <div className="student-name">
                {data.signedName}
              </div>
              <div className="has-completed">
                has successfully achieved the certification of
              </div>
              <div className="exam-title-wrapper">
                <div className="exam-prefix" style={{ color: isSpecialist ? '#22c55e' : '#a855f7' }}>
                  {prefix}
                </div>
                <div className="exam-name">
                  {mainName}
                </div>
              </div>
            </div>
            <div className="badge-wrapper">  
              <div className="ring-3" />
	        <div className="ring-ring" />
              <div className="badge-core">
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  {isSpecialist ? (
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  ) : (
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  )}
                </svg>
              </div>
            </div>
          </div>
          <div className="footer">
            <div className="meta-info">
              <div className="meta-block">
                <div className="meta-label">
                  DATE ISSUED
                </div>
                <div className="meta-value">
                  {data.issueDate}
                </div>
              </div>
              <div className="meta-block">
                <div className="meta-label">
                  VERIFICATION HASH
                </div>
                <div className="hash-box">
                  {data.hash}
                </div>
              </div>
            </div>
            <div className="signature-block">
              <img src="/uploads/chuky.png" alt="Signature" className="signature-image" />
              <div className="signature-line" />
              <div className="director-title">
                CANH NGUYEN
              </div>
              <div className="director-sub">
                FOUNDER, D.O.T SOLUTIONS GROUP
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckOutCert;
