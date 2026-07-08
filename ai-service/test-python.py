import json, urllib.request
req = urllib.request.Request(
    "http://127.0.0.1:8000/predict",
    data=json.dumps({"text": "đ.m mày"}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(req) as r:
    print(r.status, r.read().decode("utf-8"))
