import base64
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

cipher_b64 = "bjRMV0RKaVRMeTNmWjhJZThNZVF1NnNoZzYvRmdaTzB0SnRBTktqb0FJS1A4aDA0SjBOS1k2NXNXSC8rNmcyZ1lJZWE3MVFUMGFtdENGWVVOVWQ2ZzZnYlQ2cEgySjRiVEFDYUZkNjVZaEFpTlFXUGRpV0lzZjhNQWxQbVc3TDk="
cipher_bytes = base64.b64decode(cipher_b64)

target_url = "http://mercury.picoctf.net:21553/"
cookie_name = "auth_name"
verbose = False  # tắt verbose để đỡ lag console

block_size = 16 
target_block_index = 0

start = target_block_index * block_size
end = start + block_size

def send_request(modified_bytes):
    new_b64 = base64.b64encode(modified_bytes).decode()
    cookies = {cookie_name: new_b64}
    resp = requests.get(target_url, cookies=cookies, timeout=5)
    return resp.text

def try_val(i, val):
    test_bytes = bytearray(cipher_bytes)
    test_bytes[i] = val
    try:
        response = send_request(test_bytes)
    except requests.exceptions.RequestException:
        return None
    if verbose:
        lines = response.splitlines()
        if len(lines) > 1400:
            snippet = "\n".join(lines[1400:1400+100])
        else:
            snippet = response[:500]
        print(f"Thử byte {i} = {val}: Response snippet (lines 1401-1500 hoặc đầu):\n{snippet}\n{'-'*30}")
    if "picoCTF{" in response:
        return (i, val, base64.b64encode(test_bytes).decode())
    return None

print(f"Thử bitflip từ byte {start} đến {end-1}")

with ThreadPoolExecutor(max_workers=40) as executor:
    for i in range(start, end):
        futures = []
        for val in range(256):
            futures.append(executor.submit(try_val, i, val))
        for future in tqdm(as_completed(futures), total=len(futures), desc=f"Byte {i}"):
            result = future.result()
            if result:
                i, val, payload = result
                print(f"\nThay đổi byte tại vị trí {i} thành {val} đã kích hoạt flag!")
                print("Payload mới base64:", payload)
                executor.shutdown(wait=False)
                exit(0)

print("Không tìm thấy bitflip hợp lệ trong block này.")

