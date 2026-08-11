import base64

base = "3dac93b8cd250aa8c1a36fffc79a17a"
chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

with open("payloads.txt", "w") as f:
    for c in chars:
        full = base + c
        b64 = base64.b64encode(full.encode()).decode()
        hex_b64 = b64.encode().hex()
        f.write(hex_b64 + "\n")

