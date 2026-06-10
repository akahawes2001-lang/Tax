import requests
r = requests.get("http://localhost:8000/api/v1/dog-breeds/search?q=%D0%BE%D0%B2%D1%87%D0%B0%D1%80")
print("search:", r.status_code, r.json()[:3] if isinstance(r.json(), list) else r.json())

# Try with just "овчарка" breed_type
r2 = requests.post("http://localhost:8000/api/v1/calculate-dog-tax", json={
    "breed_type": "овчарка",
    "year": 2025,
    "number_of_dogs": 1,
    "quarters": 1
})
print("calc:", r2.status_code, r2.json())

# List all breeds
r3 = requests.get("http://localhost:8000/api/v1/dog-breeds/search?q=%D0%BE")
print("search o:", r3.status_code, len(r3.json()) if isinstance(r3.json(), list) else r3.json())