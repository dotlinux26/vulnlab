# Networking Fundamentals

## What is a computer network?

A computer network is a system that lets computers **connect** and **exchange data** with each other. Whether you browse the web, send messages, or hack a server, it's all data traveling over a network.

```
[ COMPUTER A ] ----cable----> [ SWITCH ] ----cable----> [ COMPUTER B ]
```

> **In plain words:** A network is like a postal service. You (the client) write a letter, the postal service (network) delivers it to the recipient (server). The letter needs an **address**, a **delivery method**, and the recipient must confirm receipt.

---

## IP Address

An IP (Internet Protocol) address is the **"house number"** of a device on the network. For two machines to talk, one must know the other's address.

**IPv4:** 4 number groups, each 0–255, separated by dots:

```
192.168.1.1
203.0.113.10
8.8.8.8   <- Google's DNS
```

**IPv6:** the newer generation, much longer, nearly unlimited addresses:

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
```

> **In plain words:** An IP is a home address. Without an address, the postal service can't deliver your mail.

---

## Port

A computer has **one IP** but runs **many services** at once. A port is the **"room number"** that distinguishes those services.

```
IP: 192.168.1.10
├── Port 22   → SSH  (remote login)
├── Port 80   → HTTP (web)
├── Port 443  → HTTPS (secure web)
└── Port 3306 → MySQL (database)
```

| Port | Service | Note |
|------|---------|------|
| 22 | SSH | Remote login |
| 80 | HTTP | Unencrypted web |
| 443 | HTTPS | Encrypted web |
| 21 | FTP | File transfer |
| 53 | DNS | Domain resolution |
| 3306 | MySQL | Database |

> **In plain words:** IP is the "house number", Port is the "room number". Your house is `192.168.1.10`, room 80 is the website, room 22 is the back door (SSH).

---

## TCP and UDP Protocols

TCP (Transmission Control Protocol) and UDP (User Datagram Protocol) are the two main ways data is transported.

### TCP – Reliable delivery (with checking)

```
Client                    Server
   │                         │
   │──── SYN ───────────────→│  3-way handshake
   │←──── SYN-ACK ───────────│
   │──── ACK ───────────────→│
   │                         │
   │════ data (guaranteed) ══│
   │                         │
```

- **Guarantees:** data arrives complete, in order, no packets lost.
- **Slower** because it checks everything.
- Examples: Web (HTTP/HTTPS), Email, SSH, FTP.

### UDP – Fast delivery, no checking

```
Client                    Server
   │                         │
   │════ data (fire away) ═══│  No handshake, no confirmation
   │════ data ═══════════════│  Lost packet = gone, no resend
   │════ data ═══════════════│
```

- **Fast** but packets may be lost.
- Examples: Video calls, online games, DNS, DHCP.

| | TCP | UDP |
|---|-----|-----|
| Error checking | Yes | No |
| Handshake | Yes (3 steps) | No |
| Speed | Slower | Fast |
| Use cases | Web, Email, SSH | Gaming, Voice, DNS |

> **In plain words:** TCP is like **registered mail** – the receiver must sign, and if it's lost it gets resent. UDP is like **throwing darts** – fast, but if you miss, you don't go back to retrieve the dart.

---

## Public IP and Private IP

### Public IP

- Assigned to devices that connect to the **Internet directly**.
- **Globally unique** – no duplicates anywhere.
- Examples: a website's IP like `8.8.8.8`, or the public IP your ISP gives your modem.

### Private IP

- Used **inside local networks** (LAN) – cannot go out to the Internet directly.
- **Reused everywhere** in every private network.
- The 3 standard private ranges:

```
10.0.0.0    → 10.255.255.255   (large networks)
172.16.0.0  → 172.31.255.255   (medium networks)
192.168.0.0 → 192.168.255.255  (home / small office)
```

```
        Internet
            │
     (public IP)
            │
      ┌─────┴─────┐
      │  ROUTER   │  ← NAT works here
      └─────┬─────┘
     ┌──────┼──────┐
     │      │      │
  192.168.1.2  192.168.1.3  (private IPs)
  your PC      your phone
```

> **In plain words:** A public IP is like a **national street address** known to the whole postal system. A private IP is like an **inside room name** only people in the house know. Everyone in the country can have a "room #1" – nobody sees the duplication.

---

## NAT – Network Address Translation

NAT is the technique where a router **translates** private IPs inside the house into **one single public IP** when going out to the Internet.

```
Your PC (192.168.1.2)
        │
        │ Sends request with private IP
        ▼
     ROUTER  ← keeps a NAT table
        │
        │ Translates private IP → home public IP
        ▼
     INTERNET
```

When data comes back, the router checks its **NAT table** to know which machine inside the house the packet belongs to, then forwards it to the right room.

> **Why do we need NAT?**
> - IPv4 addresses are limited → many machines share one public IP.
> - **Implicit security:** internal machines are not directly exposed to the outside.

> **In plain words:** NAT is like an **apartment concierge**. All packages are delivered to the concierge (public IP), who checks the room number and forwards them to the right unit. Outsiders only see "one building", not how many rooms are inside.

---

## VPN – Virtual Private Network

A VPN creates an **encrypted tunnel** between your device and a VPN server, making your traffic appear as if it's inside a private network.

```
You ── [Encrypted VPN tunnel] ── VPN server ── Internet ── Website
      (no one can read the content)
```

**What is a VPN used for?**

1. **Hide your real IP** – websites see the VPN server's IP, not yours.
2. **Encrypt data** – safe on public WiFi.
3. **Bypass geo-blocks / censorship** – access content blocked in your country.
4. **Work remotely** – safely reach your company network as if you were at the office.

> **Note for hackers:** In pentesting, you'll often use a VPN (or SSH tunnel, proxy) to **hide your origin** when scanning. But remember: a VPN only hides the **source address**, it doesn't make you invisible or immune to the law.

> **In plain words:** A VPN is like a **sealed tunnel**. Outsiders can't see what your car is carrying, and the exit gate (IP) belongs to the VPN server, not you.

---

## HTTP and HTTPS (Preview for the next lesson)

> Here we only introduce them so you know they exist. **The details come in the next lesson.**

### HTTP – HyperText Transfer Protocol

- The basic web protocol, runs on **port 80**.
- **Not encrypted** – content is sent as plain text. Anyone in the middle can read it.

```
[ You ] --GET /login.php?pass=123--> [ Web server ]
        (password visible in plain text!)
```

### HTTPS – HTTP Secure

- HTTP wrapped inside a **TLS encryption layer**, runs on **port 443**.
- **Encrypts** all data between your browser and the server.

```
[ You ] --??[ encrypted ]??--> [ Web server ]
        (password is encrypted, eavesdroppers see only garbage)
```

> **Remember for the next lesson:** HTTP = unsealed letter, HTTPS = locked letter. When pentesting, most "insecure data transmission" vulnerabilities relate to using HTTP instead of HTTPS.

---

## Practice Exercises

1. Check your IP: `ip a` (Linux) or `ipconfig` (Windows).
2. Look at your router's NAT table: open the router admin page (`192.168.1.1`), find "Port Forwarding".
3. Scan a machine with `nmap -sT` and `nmap -sU`, compare how TCP and UDP behave.
4. Use `netstat -tulpn` to see which ports your machine has open.
5. Check your public IP: `curl ifconfig.me` (compare with your private IP).
6. Connect to a VPN, then `curl ifconfig.me` again – did your IP change?

---

> **Quick recap:**
> - **IP** = house number, **Port** = room number.
> - **TCP** = registered mail, **UDP** = fast darts.
> - **Public IP** = public address, **Private IP** = internal address.
> - **NAT** = the concierge forwarding mail to each room.
> - **VPN** = a sealed tunnel hiding your origin.
> - **HTTP/HTTPS** = web without/with encryption → detailed in the next lesson.
