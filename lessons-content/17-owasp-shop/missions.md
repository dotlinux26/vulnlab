# CyberShop — Mission Board (Bảng nhiệm vụ)

> **Authorized Security Training Environment** — Mọi hành vi tấn công phải giới hạn trong phạm vi lab này. Không tấn công hạ tầng ngoài lab.

Bạn được cấp một tài khoản khách hàng của **CyberShop** — một cửa hàng thiết bị an ninh mạng đang vận hành thật (giả lập). Không ai cho bạn biết ứng dụng có lỗ hổng gì hay nằm ở đâu.

**Nhiệm vụ của bạn:** đánh giá bảo mật ứng dụng như một pentester thực thụ.

---

## Quy tắc chơi

1. **App hoàn toàn mở từ đầu** — không có khóa, không có thứ tự bắt buộc. Bạn tự chọn đường đi.
2. **Không gợi ý vulnerability class.** Hint chỉ mô tả hành vi, không nói tên lỗ hổng.
3. **Flag là bằng chứng hoàn thành**, không phải bằng chứng duy nhất của lỗ hổng. Muốn điểm cao, bạn phải chứng minh được **root cause + impact**.
4. **Bắt buộc nộp report cuối lab** theo template ở cuối trang này.
5. **Fair play:** mọi password cần crack đều nằm trong wordlist phổ biến (rockyou). Không cần tự chế wordlist lạ.

---

## ⏱️ Cấu trúc session (tổng 3 buổi × 60–90 phút)

| Session | Phạm vi gợi ý | Kết quả mong đợi |
|---------|---------------|------------------|
| **1** | Recon toàn diện → Mission 1 → Mission 2 | Bản đồ attack surface + 5–8 evidence token |
| **2** | Mission 3 → Mission 4 | Truy cập internal network + code execution |
| **3** | Free play, chaining, hoàn thiện report | Report nộp được, chain rõ ràng |

Không bắt buộc solve hết. Junior mới vẫn hoàn thành 3–5 finding — cứ ghi lại mọi thứ bạn thử.

---

## 🧾 Evidence token & journal

- Token dạng `FLAG{cN}` chỉ xác nhận **bạn đã chứng minh một mục tiêu** — nó không phải bài học. Bài học là chuỗi quan sát → giả thuyết → thử nghiệm dẫn bạn tới đó.
- Nộp token tại trang **Mục tiêu** (`/objectives`) để xem mình vừa chứng minh đúng cái gì.
- **Ngay sau mỗi lần exploit thành công**, mở journal và ghi theo mẫu trong bài học (Quan sát / Giả thuyết / Request / Response / Impact / Root cause / Remediation).

Ghi giả thuyết thế nào là chuẩn? So sánh hai cách viết:

❌ **Không chấp nhận:**

```text
' OR 1=1-- -
→ SQLi!
```

✅ **Chuẩn pentester:**

```text
Input: '
Observation: SQL syntax error trong response
Hypothesis: input được nối thẳng vào câu SQL
Validation: thêm điều kiện boolean → response thay đổi
Next hypothesis: mệnh đề WHERE injectable → thử UNION
...
```

> Anh chị chấm không quan tâm em dùng payload gì trước. Anh chị quan tâm **tại sao em gửi nó**.

---

## 🎯 MISSION 1 — Administrative Access

> **Objective:** Đạt được quyền quản trị viên của CyberShop.

Ứng dụng có ít nhất **4 con đường khác nhau** dẫn tới quyền admin. Mỗi con đường đòi hỏi kỹ năng khác nhau:

| Path | Đặc điểm |
|------|----------|
| A | Dài nhất nhưng dễ hiểu nhất — bắt đầu từ thông tin bị lộ |
| B | Ngắn nhất — nhưng bạn phải hiểu cách database xử lý truy vấn của nó |
| C | Cần nhận ra implementation flaw trong cơ chế phiên đăng nhập |
| D | Cần hiểu tại sao server tin tưởng dữ liệu client gửi lên |

**Hint progression (chỉ khi bí quá):**
1. *"Recon kỹ. Một số thứ bị để lại phía sau sau khi deploy."*
2. *"Đăng nhập không chỉ có một hình thức. Server nhận cả JSON."*
3. *"Phiên đăng nhập của bạn là một chuỗi ba phần. Phần thứ hai nói bạn là ai. Ai xác nhận điều đó?"*
4. *"Server cập nhật hồ sơ của bạn với những gì bạn gửi. Toàn bộ những gì bạn gửi?"*

---

## 🎯 MISSION 2 — Broken Access Control

> **Objective:** Truy cập dữ liệu/resource KHÔNG thuộc quyền của bạn, mà **không cần** quyền admin.

Finding đẹp ở đây là: *"Tôi chỉ là customer thường, nhưng tôi đọc được đơn hàng của người khác."*

**Hint progression:**
1. *"Các định danh trong URL có vẻ... dễ đoán."*
2. *"Server kiểm tra bạn đã đăng nhập chưa. Nhưng nó có kiểm tra tài nguyên đó là của bạn không?"*
3. *"Có một API cũ chưa kịp gắn authorization (tìm trong ticket nội bộ)."*

---

## 🎯 MISSION 3 — Internal Network Pivot

> **Objective:** Chạm tới dịch vụ nội bộ `flag-service` mà từ Internet không thể thấy.

Trong mạng nội bộ của lab tồn tại một service riêng biệt. Nó có vài endpoint — không phải endpoint nào cũng hữu ích. Hãy enumerate.

**Hint progression:**
1. *"Identify features where the server retrieves remote resources on behalf of the user."*
2. *"Observe whether the destination is controlled entirely by client input."*
3. *"Consider whether the server can reach destinations the browser cannot."*
4. *"Investigate services available on the application's internal network."*

---

## 🎯 MISSION 4 — Code Execution

> **Objective:** Thực thi mã trên server (RCE) và chứng minh impact.

Có nhiều đường RCE với yêu cầu đặc quyền khác nhau — một số cần admin, một số không. Việc chọn path cũng là một kỹ năng.

**Lưu ý chấm điểm:** RCE đạt được mới là khởi đầu. Chứng minh impact (đọc được gì, pivot đi đâu) mới là điểm.

> ⚠️ **RCE không "ăn hộ" các finding trước đó.** Nếu bạn đạt RCE và đọc được toàn bộ source/flag, bạn vẫn chỉ nhận điểm cho M4 + Post-Exploit Impact. Muốn điểm cho từng finding khác, bạn phải chứng minh từng finding một cách độc lập (request/response riêng). Đúng như pentest thật: khách hàng trả tiền theo finding đã xác minh, không phải theo "em vào được server rồi".

**Hint progression:**
1. *"Một số tính năng render nội dung động. Điều gì xảy ra nếu nội dung đó là code?"*
2. *"Admin tools đôi khi sinh ra để tiện chứ không để an toàn."*
3. *"Cookie `shop_state` dùng format legacy CSPACK v1. Đọc kỹ format spec trong source."*
4. *"Upload không phải con đường duy nhất. Template cũng vậy."*

---

## 📊 Scoring Rubric (100 điểm)

| Giai đoạn | Điểm | Evidence yêu cầu |
|-----------|------|------------------|
| Recon & Discovery | 10 | Danh sách endpoint, tech stack, entry points phát hiện được |
| Hypothesis & Validation | 20 | Burp history: test case đã thử, payload, phân tích response bất thường |
| Exploitation | 20 | Root cause + impact evidence (không chỉ screenshot flag) |
| Chaining / Pivot | 20 | Mô tả path A→B→C kèm evidence từng bước |
| Post-Exploit Impact | 15 | Data nhạy cảm đọc được, phạm vi ảnh hưởng thực tế |
| Report & Remediation | 15 | Writeup root cause + fix THỰC SỰ |

---

## 📝 Pentest Report Template (bắt buộc nộp)

```markdown
## Executive Summary
## Scope
## Attack Surface
## Finding 1
- Title:
- Severity: Critical/High/Medium/Low
- CWE:
- Affected endpoint:
- Preconditions:
- Reproduction steps:
- Evidence (request/response):
- Impact:
- Remediation:
## Finding 2 ...
## Attack Chain
## Overall Risk
## Recommendations
```

Chấm theo mức hiểu: vulnerability → root cause → exploitability → impact → business consequence → remediation. **Không chấm văn phong.**
