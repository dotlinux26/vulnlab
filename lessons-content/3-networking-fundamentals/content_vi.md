# Kiến Thức Mạng Nền Tảng

## Mạng máy tính là gì?

Mạng máy tính (network) là hệ thống cho phép các máy tính **kết nối** và **trao đổi dữ liệu** với nhau. Khi bạn lướt web, gửi tin nhắn, hay hack một máy chủ, tất cả đều là dữ liệu được vận chuyển qua mạng.

```
[ MÁY A ] ----cáp----> [ SWITCH ] ----cáp----> [ MÁY B ]
```

> **Dễ hiểu:** Mạng máy tính giống như bưu điện. Bạn (client) viết thư, bưu điện (mạng) chuyển thư đến người nhận (server). Thư phải có **địa chỉ**, phải có **cách vận chuyển**, và người nhận phải xác nhận.

---

## IP Address (Địa chỉ IP)

IP (Internet Protocol) Address là **"số nhà"** của một thiết bị trong mạng. Để hai máy nói chuyện được, máy này phải biết địa chỉ của máy kia.

**IPv4:** gồm 4 nhóm số, mỗi nhóm 0–255, cách nhau bằng dấu chấm:

```
192.168.1.1
203.0.113.10
8.8.8.8   <- DNS của Google
```

**IPv6:** thế hệ mới, dài hơn, gần như vô hạn địa chỉ:

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
```

> **Dễ hiểu:** IP là địa chỉ nhà. Nếu không có địa chỉ, bưu điện không biết chuyển thư đến đâu.

---

## Port (Cổng)

Máy tính có **một IP** nhưng chạy **nhiều dịch vụ** cùng lúc. Port là **"số phòng"** để phân biệt các dịch vụ đó.

```
IP: 192.168.1.10
├── Port 22   → SSH  (đăng nhập từ xa)
├── Port 80   → HTTP (web)
├── Port 443  → HTTPS (web bảo mật)
└── Port 3306 → MySQL (database)
```

| Port | Dịch vụ | Ghi chú |
|------|---------|---------|
| 22 | SSH | Đăng nhập remote |
| 80 | HTTP | Web không mã hóa |
| 443 | HTTPS | Web mã hóa |
| 21 | FTP | Truyền file |
| 53 | DNS | Phân giải tên miền |
| 3306 | MySQL | Database |

> **Dễ hiểu:** IP là "số nhà", Port là "số phòng". Nhà của bạn là `192.168.1.10`, phòng 80 là website, phòng 22 là cửa hậu (SSH).

---

## Giao thức TCP và UDP

TCP (Transmission Control Protocol) và UDP (User Datagram Protocol) là hai cách vận chuyển dữ liệu chính.

### TCP – Vận chuyển có kiểm tra (đáng tin cậy)

```
Client                    Server
   │                         │
   │──── SYN ───────────────→│  Bắt tay 3 bước
   │←──── SYN-ACK ───────────│  (3-way handshake)
   │──── ACK ───────────────→│
   │                         │
   │════ data (đảm bảo đủ) ══│
   │                         │
```

- **Đảm bảo:** dữ liệu đến đủ, đúng thứ tự, không mất gói.
- **Chậm hơn** vì phải kiểm tra.
- Ví dụ: Web (HTTP/HTTPS), Email, SSH, FTP.

### UDP – Vận chuyển nhanh, không kiểm tra

```
Client                    Server
   │                         │
   │════ data (phóng thẳng) ══│  Không bắt tay, không xác nhận
   │════ data ═══════════════│  Mất gói là mất, không gửi lại
   │════ data ═══════════════│
```

- **Nhanh** nhưng có thể mất gói.
- Ví dụ: Video call, game online, DNS, DHCP.

| | TCP | UDP |
|---|-----|-----|
| Kiểm tra lỗi | Có | Không |
| Bắt tay trước | Có (3 bước) | Không |
| Tốc độ | Chậm hơn | Nhanh |
| Ứng dụng | Web, Email, SSH | Game, Voice, DNS |

> **Dễ hiểu:** TCP như **thư bảo đảm** – người nhận phải ký nhận, nếu mất thì gửi lại. UDP như **phóng phi tiêu** – nhanh nhưng bắn trượt thì thôi, không quay lại lấy.

---

## Public IP và Private IP

### Public IP (IP công cộng)

- Cấp cho thiết bị kết nối **Internet trực tiếp**.
- **Duy nhất toàn cầu** – không nơi nào trùng.
- Ví dụ: IP của website `8.8.8.8`, IP nhà mạng cấp cho modem nhà bạn.

### Private IP (IP riêng)

- Dùng **trong mạng nội bộ** (LAN) – không đi ra Internet được.
- **Dùng đi dùng lại** ở mọi mạng nội bộ.
- 3 dải IP riêng chuẩn:

```
10.0.0.0    → 10.255.255.255   (mạng lớn)
172.16.0.0  → 172.31.255.255   (mạng trung)
192.168.0.0 → 192.168.255.255  (mạng gia đình, văn phòng nhỏ)
```

```
        Internet
            │
     (IP công cộng)
            │
      ┌─────┴─────┐
      │  ROUTER   │  ← NAT hoạt động ở đây
      └─────┬─────┘
     ┌──────┼──────┐
     │      │      │
  192.168.1.2  192.168.1.3  (IP riêng)
  máy bạn      điện thoại
```

> **Dễ hiểu:** IP công cộng như **địa chỉ nhà** mà bưu điện toàn quốc biết. IP riêng như **tên phòng bên trong** chỉ có người trong nhà biết. Cả nước ai cũng có "phòng ngủ số 1" – không ai thấy đâu trùng nhau cả.

---

## NAT – Network Address Translation

NAT (Dịch địa chỉ mạng) là kỹ thuật mà router **chuyển đổi** IP riêng trong nhà thành **một IP công cộng** duy nhất khi ra Internet.

```
Máy bạn (192.168.1.2)
        │
        │ Gửi request, mang IP riêng
        ▼
     ROUTER  ← ghi nhớ bảng NAT
        │
        │ Đổi IP riêng → IP công cộng của nhà bạn
        ▼
     INTERNET
```

Khi nhận dữ liệu trả về, router **nhìn bảng NAT** để biết gói tin này thuộc về máy nào trong nhà, rồi chuyển vào đúng cổng/phòng.

> **Vì sao cần NAT?**
> - Địa chỉ IPv4 có giới hạn → nhiều máy dùng chung 1 IP công cộng.
> - **Bảo mật ngầm:** máy trong nhà không bị lộ trực tiếp ra ngoài.

> **Dễ hiểu:** NAT giống như **lễ tân chung cư**. Mọi gói hàng (packet) đều gửi về lễ tân (IP công cộng), lễ tân xem số phòng rồi chuyển vào từng căn hộ. Bên ngoài chỉ thấy một "tòa nhà", không thấy bên trong có bao nhiêu phòng.

---

## VPN – Virtual Private Network

VPN (Mạng riêng ảo) tạo một **đường hầm mã hóa** giữa thiết bị của bạn và máy chủ VPN, khiến dữ liệu đi qua như đang nằm trong một mạng riêng.

```
Bạn ── [Đường hầm mã hóa (VPN)] ── Máy chủ VPN ── Internet ── Website
      (không ai xem được nội dung)
```

**VPN dùng để làm gì?**

1. **Ẩn IP thật** – website thấy IP của máy chủ VPN, không thấy IP bạn.
2. **Mã hóa dữ liệu** – an toàn khi dùng WiFi công cộng.
3. **Vượt địa lý / kiểm duyệt** – truy cập nội dung bị chặn ở quốc gia bạn.
4. **Làm việc từ xa** – truy nhập mạng công ty an toàn như đang ở công ty.

> **Lưu ý cho hacker:** Trong pentest, bạn hay dùng VPN (hoặc SSH tunnel, proxy) để **giấu nguồn gốc** khi quét mạng. Nhưng nhớ: VPN chỉ ẩn địa chỉ **xuất phát**, không làm bạn vô hình hay miễn nhiễm với luật pháp.

> **Dễ hiểu:** VPN như **đường hầm bọc kín**. Người ngoài không nhìn thấy xe của bạn đang chở gì, và cổng ra (IP) là của máy chủ VPN chứ không phải của bạn.

---

## HTTP và HTTPS (Gợi nhắc cho bài sau)

> Ở đây chỉ giới thiệu để bạn biết chúng tồn tại. **Chi tiết sẽ học ở bài sau.**

### HTTP – HyperText Transfer Protocol

- Giao thức truyền web cơ bản, chạy trên **port 80**.
- **Không mã hóa** – nội dung gửi dạng chữ rõ. Ai chặn giữa đường đều đọc được.

```
[ Bạn ] --GET /login.php?pass=123--> [ Web server ]
        (password hiện nguyên văn!)
```

### HTTPS – HTTP Secure

- HTTP chạy trong **lớp mã hóa TLS**, chạy trên **port 443**.
- **Mã hóa** mọi dữ liệu giữa trình duyệt và server.

```
[ Bạn ] --??[ mã hóa ]??--> [ Web server ]
        (password bị mã hóa, người chặn chỉ thấy rác)
```

> **Nhớ cho bài sau:** HTTP = thư không niêm phong, HTTPS = thư có khóa. Khi làm pentest, **mọi lỗ hổng "truyền dữ liệu không an toàn"** thường liên quan đến việc dùng HTTP thay vì HTTPS.

---

## Bài tập thực hành

1. Xem IP máy bạn: `ip a` (Linux) hoặc `ipconfig` (Windows).
2. Xem bảng NAT của router: vào trang quản trị router (`192.168.1.1`) tìm mục "Port Forwarding".
3. Dùng `nmap -sT` và `nmap -sU` quét một máy, so sánh cách TCP và UDP hoạt động.
4. Dùng `netstat -tulpn` xem máy bạn đang mở những port nào.
5. Kiểm tra IP công cộng: `curl ifconfig.me` (so sánh với IP riêng).
6. Kết nối VPN thử, rồi `curl ifconfig.me` lần nữa – IP đổi chưa?

---

> **Tổng kết nhanh:**
> - **IP** = số nhà, **Port** = số phòng.
> - **TCP** = thư bảo đảm, **UDP** = phi tiêu nhanh.
> - **Public IP** = địa chỉ công cộng, **Private IP** = địa chỉ nội bộ.
> - **NAT** = lễ tân chuyển thư vào từng phòng.
> - **VPN** = đường hầm kín giấu nguồn gốc.
> - **HTTP/HTTPS** = web không/như có mã hóa → bài sau học chi tiết.
