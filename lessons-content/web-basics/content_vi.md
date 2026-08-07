# Nhập Môn HTML, Web & JavaScript

## Website hoạt động thế nào?

Website chỉ là **văn bản + code** được gửi từ server về trình duyệt của bạn. Trình duyệt nhận code đó rồi **vẽ ra** (render) thành trang web bạn nhìn thấy.

![image](/uploads/Screenshot_2026-08-07_15-49-07_1786132907009_iefl0y.png)

```
[ Server ] ──gửi code (HTML/CSS/JS)──> [ Trình duyệt ]
                                        │ vẽ ra
                                        ▼
                                   Trang web hiển thị
```

Trang web bạn thấy thật ra chỉ là **3 loại ngôn ngữ**:

| Ngôn ngữ | Vai trò | Dễ hiểu |
|----------|---------|---------|
| **HTML** | Nội dung + cấu trúc | "Khung xương và thịt" |
| **CSS** | Màu sắc, bố cục, đẹp | "Quần áo, trang điểm" |
| **JS** | Hành vi, tương tác | "Bộ não điều khiển" |

> **Dễ hiểu:** Trang web như ngôi nhà. HTML là **khung nhà** (phòng nào ở đâu), CSS là **sơn phết nội thất**, JS là **hệ thống điện** (bấm công tắc là đèn sáng).

---

## HTML là gì?

HTML (HyperText Markup Language) là ngôn ngữ **đánh dấu** – dùng các **thẻ** (tag) để mô tả nội dung.

```html
<h1>Xin chào</h1>       <!-- tiêu đề lớn -->
<p>Đây là đoạn văn.</p>  <!-- đoạn văn -->
<a href="https://vuln.ghedahaui.online">VULNLAB</a>  <!-- link -->
<input type="text" name="username">   <!-- ô nhập -->
```

Cấu trúc cơ bản của một trang HTML:

```html
<!DOCTYPE html>
<html>
  <head>...</head>   <!-- chứa cấu hình, title, link CSS -->
  <body>...</body>   <!-- chứa nội dung hiển thị -->
</html>
```

> **Ghi nhớ:** Mỗi thẻ mở `<tên>` thường có thẻ đóng `</tên>`. Thẻ có thể mang **thuộc tính** như `href`, `name`, `id`... — kẻ tấn công sẽ lợi dụng những thuộc tính này (ví dụ `onclick`, `onerror`) để chèn mã độc.

---

## JavaScript (JS) là gì?

JS là ngôn ngữ **lập trình** chạy ngay trong trình duyệt, làm cho trang web **sống động**: kiểm tra form, gọi API, đổi nội dung mà không cần tải lại trang.

```js
document.getElementById("username").value = "admin";
alert("Xin chào!");
fetch('/api/me').then(r => r.json()).then(d => console.log(d));
```

> **Pentest để ý:** JS chạy phía **client** → bạn **xem được toàn bộ code JS**. Đôi khi dev giấu mật khẩu, API key, hoặc logic kiểm tra trong JS — recon web bắt đầu từ đây.

---

## Source Web là gì? Xem thế nào?

**Source web** = toàn bộ code gốc (HTML/CSS/JS) mà server gửi về. Vì trình duyệt phải nhận code để vẽ trang, nên **code đó luôn có thể xem được** — bạn không cần "hack" gì cả.

![image](/uploads/souuce_1786133058010_8xdibo.png)

### Cách xem source

![image](/uploads/Screenshot_2026-08-07_15_49_57_1786132956148_fscn6p.png)

| Cách | Thao tác |
|------|----------|
| Click phải → **View Page Source** | Xem HTML thô |
| Gõ `view-source:https://vuln.ghedahaui.online` | Xem HTML thô |
| **Ctrl + Shift + I** (DevTools) | Xem mọi thứ: HTML, CSS, JS, Network, Console... |

> **Pentest bắt đầu ở đây:** Luôn **xem source trước**. Comment ẩn (`<!-- -->`), link ẩn, file JS, form ẩn, thẻ input bị giấu... toàn là manh mối.

---

## Ctrl + Shift + I – DevTools

DevTools (F12 hoặc Ctrl+Shift+I) là **bộ công cụ toàn năng** của trình duyệt. Các tab quan trọng:

![image](/uploads/Screenshot_2026-08-07_16-00-04_1786133077004_ep2uln.png)

| Tab | Dùng để làm gì | Ví dụ |
|-----|----------------|-------|
| **Elements** | Sửa/xem HTML & CSS trực tiếp | Tạm thời bật một input bị `hidden` |
| **Console** | Chạy JS, xem log/lỗi | Test payload, xem lỗi ẩn |
| **Network** | Xem mọi request/response | Theo dõi API, header, cookie, trạng thái |
| **Application** | Xem cookie, localStorage | Đọc/sửa session cookie |
| **Sources** | Xem toàn bộ file JS/CSS | Đọc code logic của trang |

**Ví dụ thực chiến:**

1. Mở trang bất kỳ → `Ctrl+Shift+I` → tab **Network** → `F5` (reload) → thấy từng request, status, thời gian, payload.
2. Tab **Elements** → click phải một thẻ `<input>` → **Edit as HTML** → thử sửa thuộc tính.
3. Tab **Console** → gõ `document.cookie` → enter.

> **Mẹo:** Muốn "hack nhanh" thì mở **Console + Network** song song. Console để chạy thử code, Network để xem server trả gì. Kẻ tấn công web không thể thiếu DevTools.

---

## Cookie là gì?

HTTP **không nhớ gì** giữa các lần request (stateless). Cookie là **mẩu dữ liệu nhỏ** mà server giao cho trình duyệt **lưu lại** và **tự động gửi kèm** mỗi lần request — để server nhận ra bạn.

```
1. Bạn đăng nhập → server gửi:  Set-Cookie: session=abc123
2. Trình duyệt lưu lại cookie này
3. Lần sau request → trình duyệt tự gắn:  Cookie: session=abc123
4. Server thấy cookie → biết bạn là ai
```

### Cách xem cookie

![image](/uploads/cookie_1786133103139_5ohasl.png)

| Cách | Thao tác |
|------|----------|
| DevTools → tab **Application** → **Cookies** | Xem/sửa/xóa từng cookie |
| DevTools → tab **Network** → click request → mục **Request Headers** | Xem cookie gửi đi |
| Console | Gõ `document.cookie` |

```js
document.cookie   // xem cookie của trang hiện tại
```

### Cookie và bảo mật

| Thuộc tính | Ý nghĩa |
|-----------|---------|
| **HttpOnly** | JS **không đọc được** (chống XSS đánh cắp) |
| **Secure** | Chỉ gửi qua HTTPS |
| **SameSite** | Chống CSRF |

> **Pentest:** Session cookie = "chìa khóa" tài khoản. Đánh cắp cookie (qua XSS, sniff HTTP) → **đăng nhập được mà không cần password** (Session Hijacking). Nếu cookie thiếu `HttpOnly`, chỉ cần 1 lỗi XSS là coi như toang tài khoản.

---

## Bài tập thực hành

1. Mở `https://vuln.ghedahaui.online` → `Ctrl+Shift+I` → **Network** → F5 → tìm request đầu tiên, xem status code và response headers.
2. Tab **Elements** → tìm một thẻ `<input>` → sửa thử thuộc tính → quan sát trang đổi.
3. Tab **Application → Cookies** → liệt kê các cookie đang có, xem cookie nào có `HttpOnly`.
4. Trong **Console**, gõ `document.cookie` → so sánh với tab Application (cookie nào bị ẩn? Vì sao?).
5. Click phải → **View Page Source** → tìm bình luận ẩn `<!-- ... -->` và các thẻ `<script>`.

---

> **Tổng kết nhanh:**
> - **HTML** = nội dung, **CSS** = làm đẹp, **JS** = hành vi.
> - **Source web luôn xem được** → bắt đầu recon bằng View Source / Ctrl+Shift+I.
> - **DevTools** = Elements, Console, Network, Application, Sources.
> - **Cookie** = giấy thông hành của phiên đăng nhập; cookie thiếu `HttpOnly` dễ bị XSS đánh cắp.
