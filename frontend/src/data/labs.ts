export type Difficulty = "Easy" | "Medium" | "Hard";
export type Category = "Web" | "Pwn" | "Forensics" | "Crypto" | "Reverse" | "OSINT" | "Network";
export type LabStatus = "solved" | "unsolved" | "in-progress";

export interface Lab {
  id: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  difficulty: Difficulty;
  category: Category;
  status: LabStatus;
  points: number;
  solves: number;
  flag?: string;
  contentUrl?: string; // path to markdown HTML content
}

export const labsData: Lab[] = [
  {
    id: "ffuf-mastery",
    title: "Ffuf Mastery",
    description: "Khảo sát Virtual Host và lọc kết quả rác qua Header Host. Học cách sử dụng ffuf để brute-force directories và virtual hosts.",
    difficulty: "Easy",
    category: "Web",
    status: "solved",
    points: 100,
    solves: 42,
    flag: "FLAG{ffuf_m4st3ry_2024}",
    contentUrl: "/labs/ffuf-test.html",
  },
  {
    id: "sql-injection-basics",
    title: "SQL Injection Basics",
    description: "Tìm hiểu và khai thác lỗ hổng SQL Injection cơ bản trên form đăng nhập. Bypass authentication và trích xuất dữ liệu.",
    difficulty: "Easy",
    category: "Web",
    status: "unsolved",
    points: 150,
    solves: 38,
    flag: "FLAG{sql1_b4s1cs_pwn3d}",
  },
  {
    id: "buffer-overflow-101",
    title: "Buffer Overflow 101",
    description: "Khai thác lỗi tràn bộ đệm cơ bản trên chương trình C. Ghi đè return address và chạy shellcode.",
    difficulty: "Hard",
    category: "Pwn",
    status: "unsolved",
    points: 500,
    solves: 12,
    flag: "FLAG{b0f_sh3llc0d3_g0t}",
  },
  {
    id: "packet-analysis",
    title: "Packet Analysis",
    description: "Phân tích file PCAP để tìm ra dữ liệu nhạy cảm bị rò rỉ qua giao thức HTTP không mã hóa.",
    difficulty: "Medium",
    category: "Forensics",
    status: "in-progress",
    points: 250,
    solves: 25,
    flag: "FLAG{p4ck3t_sn1ff3r}",
  },
  {
    id: "caesar-cipher",
    title: "Caesar Cipher Breaker",
    description: "Phá mã Caesar cipher với nhiều lớp mã hóa. Tìm key đúng và giải mã thông điệp bí mật.",
    difficulty: "Easy",
    category: "Crypto",
    status: "solved",
    points: 100,
    solves: 56,
    flag: "FLAG{c43s4r_cr4ck3d}",
  },
  {
    id: "reverse-crackme",
    title: "CrackMe Challenge",
    description: "Reverse engineering một binary ELF để tìm ra serial key. Sử dụng IDA/Ghidra để phân tích.",
    difficulty: "Hard",
    category: "Reverse",
    status: "unsolved",
    points: 400,
    solves: 8,
    flag: "FLAG{r3v3rs3_m4st3r}",
  },
  {
    id: "xss-reflected",
    title: "XSS Reflected Attack",
    description: "Khai thác lỗ hổng XSS Reflected trên ứng dụng web. Craft payload để steal cookie.",
    difficulty: "Medium",
    category: "Web",
    status: "unsolved",
    points: 200,
    solves: 30,
    flag: "FLAG{xss_r3fl3ct3d_h4ck}",
  },
  {
    id: "network-enum",
    title: "Network Enumeration",
    description: "Sử dụng Nmap và các công cụ để enumerate một mạng nội bộ. Tìm ra các dịch vụ ẩn.",
    difficulty: "Medium",
    category: "Network",
    status: "unsolved",
    points: 300,
    solves: 18,
    flag: "FLAG{n3tw0rk_3num_pr0}",
  },
];

export const userSkills = {
  Web: 80,
  Crypto: 40,
  Pwn: 25,
  Forensics: 60,
  Reverse: 15,
  Network: 45,
};

export const userProfile = {
  name: "Học viên Nebula",
  email: "student@vulnlab.vn",
  avatar: "",
  level: 7,
  xp: 1250,
  xpToNext: 2000,
  rank: "Script Kiddie",
  joinDate: "2024-01-15",
  solvedLabs: 2,
  totalLabs: 8,
};
