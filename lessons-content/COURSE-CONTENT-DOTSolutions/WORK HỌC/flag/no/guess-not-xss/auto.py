import requests, hashlib

r = requests.get("http://chal.78727867.xyz:21338/get_challenge")
challenge = r.json()['challenge']

for i in range(99999999):
    nonce = str(i)
    h = hashlib.sha256((challenge + nonce).encode()).hexdigest()
    if h.startswith("000000"):
        print("[+] Solved:", nonce)
        break
