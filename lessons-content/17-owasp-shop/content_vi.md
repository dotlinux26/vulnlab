# OWASP Capstone — CyberShop Full-Stack Pentest

> **Độ khó:** Hard — **Trình độ:** advanced

## Triết lý lab — Pentest không cần master toàn bộ skill tree

Pentest ngoài thực tế không đòi hỏi bạn thuộc hết mọi vulnerability trước khi được đụng vào hệ thống. Lab này được thiết kế theo đúng triết lý đó:

**1. Nền tảng đủ dùng là: request/response, Burp, ffuf, nmap.** Đó là ngôn ngữ chung của mọi pentester. Lỗ hổng chỉ là *sai lệch cần kiểm tra* — bạn phát hiện nó bằng quan sát hành vi, không phải bằng cách học thuộc tên gọi trước.

**2. Hệ thống rộng, tự chọn đường.** Không ai bắt bạn đi hết 16 lỗ hổng theo thứ tự. Thích đào phần nào thì đào phần đó:

```
Thích web:            Recon → HTTP/Burp → Auth → IDOR → SQLi → RCE
Thích infrastructure: Recon → Network → SSRF → Internal service → Pivot → Container
Thích client-side:    XSS → CSRF → Session → Account takeover
```

**3. Vulnerability = discrepancy pattern.** Mọi lỗ hổng đều có thể nhìn theo một khung duy nhất:

```
Expected behavior   vs   Actual behavior
              ↓
         discrepancy
              ↓
         investigate
              ↓
       vulnerability?
```

| Expected | Observed | → Nhóm lỗi |
|----------|----------|-----------|
| User A chỉ đọc resource của A | Đổi ID → đọc được resource của B | Broken Access Control / IDOR |
| Input chỉ là data | Input thay đổi cách query/command/template thực thi | Injection |
| Browser không chạm được internal service | Server fetch URL do user điều khiển → chạm được hộ | SSRF |
| Session chứng minh identity hợp lệ | Client-controlled token đổi được privilege | Auth flaw |

Tên gọi (IDOR, SSRF, SSTI...) chỉ là **vocabulary đến sau observation**. Ngoài đời không ai popup "Potential IDOR detected!" cho bạn — bạn phải tự thấy behavior lạ trước.

**4. Vòng lặp học thật:**

```
curiosity → exploration → failure → research → exploit → mastery
```

Hôm nay bạn chỉ biết "Burp → request → response". Sau một thời gian tự gặp: *"Ủa sao đổi ID lại đọc được dữ liệu người khác?"* → đó là lúc IDOR mọc lên từ nhu cầu giải quyết vấn đề, không phải từ giáo trình ép hấp thụ.

Pentester giỏi không phải người biết hết mọi vulnerability — mà là người gặp thứ chưa biết vẫn nói được: *"Cái này mình chưa biết. Để mình tìm hiểu rồi quay lại."*

---

## Giới thiệu

Khác với các bài trước (mỗi bài một lỗ hổng, có hướng dẫn payload), bài này là **capstone environment**: một web thương mại điện tử hoàn chỉnh chứa nhiều lỗ hổng cùng lúc, và **không ai chỉ cho bạn chúng nằm ở đâu**.

Mục tiêu không phải là học thuộc payload. Mục tiêu là rèn **quy trình tư duy pentest**:

```
Recon → Enumeration → Hypothesis → Validation → Exploitation → Chaining → Evidence → Report
```

Một junior giỏi không phải người biết nhiều payload nhất — mà là người biết **hỏi đúng câu hỏi** về ứng dụng đang đứng trước mặt.

---

## Phần A — Tư duy Recon (Understand)

### Recon không phải chạy tool rồi thôi

Trước khi gửi bất kỳ payload nào, hãy trả lời những câu hỏi sau về ứng dụng:

| Câu hỏi | Ví dụ cách trả lời |
|---------|-------------------|
| App dùng tech stack gì? | Xem response headers, error pages, đường dẫn file (.php? .ejs?), behavior |
| Có những entry point nào? | Mọi nơi nhận input: URL params, body, headers, cookies, uploaded files |
| Input đi đâu? | Search → DB query? Avatar URL → server fetch? File param → filesystem? |
| Ai được phép làm gì? | Trang nào hiện cho user thường, trang nào chỉ admin? Authorization kiểm tra ở đâu? |
| App tiết lộ gì ngoài ý muốn? | Error messages, comment trong HTML, robots.txt, backup files, debug pages |

### interesting ≠ vulnerable

Recon sẽ cho bạn **nhiều** kết quả: endpoint lạ, trang ẩn, file backup, API nội bộ. Nhưng **không phải thứ gì thú vị cũng khai thác được**. Kỹ năng phân biệt *interesting* và *actually vulnerable* là kỹ năng cốt lõi phân biệt fresher với junior.

### Vẽ bản đồ tấn công

Sau recon, bạn nên có một bảng như:

```
Entry points          → Đi tới đâu              → Hypothesis
/search?q=            → SQL query               → injection?
/profile/avatar(url)  → server-side fetch       → internal network?
/orders/:id           → object lookup           → ownership check?
cookie token          → session verification    → forgeable?
PUT /api/profile      → DB update               → field whitelist?
/import (XML body)    → server-side parser      → parser có hiểu entity không?
```

---

## Phần B — Từ Hypothesis đến Exploitation

### Quy trình 5 bước cho mỗi hypothesis

1. **Observe** — behavior bình thường của feature là gì?
2. **Mutate** — thay đổi input một cách có chủ đích (kiểu dữ liệu, ký tự đặc biệt, giá trị biên)
3. **Compare** — response khác gì so với baseline? Khác bao nhiêu là đủ để kết luận?
4. **Validate** — lặp lại để loại trừ nhiễu/false positive
5. **Document** — ghi lại request/response gốc ngay lúc phát hiện, đừng để sau

### Về evidence

**Flag chỉ chứng minh bạn hoàn thành mục tiêu — nó không chứng minh lỗ hổng.**

Một finding SQLi đúng chuẩn gồm chuỗi:

```
request bình thường → response bất thường → UNION extraction → data nhạy cảm → flag
```

Một finding IDOR đúng chuẩn:

```
User A gọi GET /orders/1042 → HTTP 200 → đơn hàng thuộc User B → không cần admin
```

Nếu bạn chỉ chụp màn hình cái flag, bạn mất điểm Exploitation và gần như toàn bộ Post-Exploit Impact.

### Chaining — sức mạnh thật của pentester

Lỗ hổng đơn lẻ thường hạn chế. Chuỗi lỗ hổng mới tạo impact lớn:

```
Info leak → credentials → login → mass assignment → admin → admin tools → RCE → internal network
```

Khi viết report, hãy vẽ rõ chain: mỗi mắt xích dùng vuln nào, evidence gì, chuyển giao gì cho mắt tiếp theo.

---

## Phần C — Report & Remediation (Act)

### Report là sản phẩm chính

Pentest không kết thúc ở exploit. Khách hàng trả tiền cho **khả năng sửa lỗi**, nên report phải trả lời:

- **Root cause**: lỗi nằm ở dòng code/quyết định thiết kế nào?
- **Exploitability**: điều kiện tiên quyết là gì? Ai có thể khai thác?
- **Impact**: business consequence là gì (data leak? account takeover? RCE?)
- **Remediation**: sửa thế nào ĐÚNG?

### Remediation đúng chuẩn theo từng lớp lỗi

| Lớp lỗi | Fix đúng | Fix sai (đừng dạy kiểu này) |
|---------|----------|------------------------------|
| Injection | Parameterized queries / ORM binding | Filter ký tự, WAF |
| Broken Access Control | Object-level authorization check ở server | Ẩn ID, đổi sang UUID |
| SSRF | Egress allowlist, block internal ranges | Block từng URL cụ thể |
| XSS | Output encoding theo context | Blacklist `<script>` |
| CSRF | Token + SameSite cookie | Kiểm tra Referer |
| Deserialization | Không deserialize data untrusted; dùng format an toàn | Validate input rồi vẫn deserialize |
| Misconfig | Bật secure defaults, tắt debug ở prod | Đổi đường dẫn ẩn |

WAF là **defense-in-depth**, không phải fix chính. Một remediation chỉ dựa vào WAF = chưa sửa root cause.

---

## Theo dõi tiến độ — checklist nhân đạo

Không ai bắt buộc bạn phá hết 16 mục tiêu. **Junior mới vào nghề vẫn hoàn thành 3–5 finding. Junior khá sẽ chain được. Thằng mạnh sẽ phá nát cả app.** Cả ba đều đang học pentest đúng cách — lab này không có "đường ray" duy nhất.

Mỗi khi hoàn thành một mục tiêu, bạn thu được một **evidence token** dạng `FLAG{cN}`. Nộp token vào trang **Mục tiêu** (`/objectives`) trong app để xác nhận — hệ thống sẽ cho biết chính xác bạn vừa chứng minh được điều gì và gợi ý bước tiếp theo cần ghi vào journal. Lưu ý: tên mục tiêu chỉ mô tả **kết quả**, không phải phương pháp — việc tự tìm ra "làm sao" chính là bài học.

In bảng này ra hoặc chép vào file note của bạn:

| # | Mục tiêu | Token | ✓ |
|---|----------|-------|---|
| 1 | Tìm file mà ứng dụng quên không bảo vệ | `FLAG{c1}` | ☐ |
| 2 | Đăng nhập mà không cần mật khẩu của bất kỳ ai | `FLAG{c2}` | ☐ |
| 3 | Chứng minh token phiên đăng nhập không đáng tin | `FLAG{c3}` | ☐ |
| 4 | Nâng đặc quyền thông qua trang chỉnh sửa hồ sơ | `FLAG{c4}` | ☐ |
| 5 | Rút được bản ghi nhạy cảm từ database phía sau | `FLAG{c5}` | ☐ |
| 6 | Vượt qua một bước xác thực phụ | `FLAG{c6}` | ☐ |
| 7 | Đọc dữ liệu thuộc về người khác | `FLAG{c7}` | ☐ |
| 8 | Khiến ứng dụng khai nhiều hơn mức nên nói | `FLAG{c8}` | ☐ |
| 9 | Chạm tới service nội bộ không dành cho bạn | `FLAG{c9}` | ☐ |
| 10 | Đọc file tùy ý thông qua bộ xử lý tài liệu | `FLAG{c10}` | ☐ |
| 11 | Thực thi lệnh trên hệ điều hành của server | `FLAG{c11}` | ☐ |
| 12 | Khiến server tính toán biểu thức của bạn | `FLAG{c12}` | ☐ |
| 13 | Lợi dụng dữ liệu serialized mà server tin tưởng | `FLAG{c13}` | ☐ |
| 14 | Khiến trình duyệt của người khác chạy script của bạn | `FLAG{c14}` | ☐ |
| 15 | Phản chiếu nội dung của kẻ tấn công vào trang | `FLAG{c15}` | ☐ |
| 16 | Thực hiện hành động thay một người dùng chưa bao giờ đồng ý | `FLAG{c16}` | ☐ |
| ★ | Chiếm quyền kiểm soát toàn bộ CyberShop | `FLAG{owasp_shop_master}` | ☐ |

Hai mục tiêu cuối danh sách (14–16) không đánh giá bằng token đơn lẻ — chúng được chấm qua **evidence trong report**: PoC hoạt động, request/response trước–sau, và giải thích impact. Không có token ≠ không quan trọng; trong pentest thật, **impact mới là thứ được trả tiền**.

### Journal mẫu — ghi ngay sau mỗi lần exploit thành công

```text
Finding #NN
──────────
Quan sát:      (mình thấy gì bất thường?)
Giả thuyết:    (mình nghĩ nguyên nhân là gì? vì sao thử payload này?)
Request:       (dán raw request)
Response:      (phần khác biệt so với baseline)
Impact:        (kẻ tấn công đạt được gì?)
Root cause:    (nếu nhìn được code/quy luật)
Remediation:   (sửa thế nào cho đúng?)
Token:         FLAG{...}
```

---

## Phần D — Checklist trước khi bắt đầu

- [ ] Burp Suite proxy sẵn sàng, FoxyProxy cấu hình
- [ ] Đăng nhập tài khoản được cấp, lưu session
- [ ] Ghi chú mọi endpoint phát hiện được vào file riêng
- [ ] Đặt baseline response cho các request quan trọng
- [ ] In/chép bảng theo dõi tiến độ ở trên + mở file journal
- [ ] Ngân sách thời gian gợi ý: recon 20% — test 50% — report 30%. Lab dài, đừng cố gói trong một hơi: nghỉ giữa các mission cũng là một kỹ năng pentester

---

## Tổng kết

Sau lab này bạn nên trả lời được:

1. Em recon một web app theo quy trình nào?
2. Làm sao phân biệt interesting vs vulnerable?
3. Evidence của một finding chuẩn gồm những gì?
4. Chain lỗ hổng như thế nào để tăng impact?
5. Remediation đúng cho từng lớp lỗi OWASP?

Nếu trả lời được cả 5 — bạn đã có nền tảng tư duy của một junior pentester.
