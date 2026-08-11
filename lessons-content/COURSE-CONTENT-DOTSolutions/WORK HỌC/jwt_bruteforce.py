import jwt

# JWT token bạn muốn crack
token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoib2sifQ.IfFUv-oMBZS8-qpp_qOJ-YJ1TphaMNTUzBI2JUurPIg"
# File wordlist rockyou.txt
wordlist_file = "/usr/share/wordlists/rockyou.txt"

def try_bruteforce(token, wordlist_file):
    with open(wordlist_file, "r", errors='ignore') as f:
        for line in f:
            secret = line.strip()
            try:
                # Giải mã token với secret thử
                decoded = jwt.decode(token, secret, algorithms=["HS256"])
                print(f"[+] Found secret key: {secret}")
                print(f"Decoded payload: {decoded}")
                return secret
            except jwt.exceptions.InvalidSignatureError:
                # Sai key -> tiếp tục thử
                pass
            except Exception as e:
                # Bỏ qua lỗi khác
                pass
    print("[-] Secret key not found in wordlist.")
    return None

if __name__ == "__main__":
    try_bruteforce(token, wordlist_file)

