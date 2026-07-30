const puppeteer = require('puppeteer-core');

async function phanQuanDiTuan() {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Bắt lỗi rớt log ra ngoài để sếp dễ soi
    page.on('console', msg => console.log('[BROWSER LOG]:', msg.text()));

    // 1. Gắn Flag vào "người" Phán Quan (Đổi localhost thành 127.0.0.1)
    await page.goto('http://127.0.0.1:3000');
    await page.setCookie({
        name: 'mat_chi_1', // Đã bỏ dấu tiếng Việt để Chromium không từ chối
        value: 'VULN{XSS_St34l_',
        domain: '127.0.0.1',
        httpOnly: false
    });
    
    await page.evaluate(() => {
        localStorage.setItem('mạt_chỉ_2', 'C00ki3_&_LS_2026}');
    });

    // 2. Phán Quan vào xem danh sách khiếu nại
    console.log("[⚖️] Phán Quan đang xem xét sớ tấu...");
    await page.goto('http://127.0.0.1:3000/phanquan/dashboard', { waitUntil: 'networkidle2' });

    // Đợi 10 giây để script XSS của sinh viên kịp chạy
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
    console.log("[⚖️] Phán Quan đã bãi triều.");
}

setInterval(phanQuanDiTuan, 60000); // 1 phút đi tuần 1 lần
