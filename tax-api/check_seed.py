import requests

# Check if dog tax rates exist
r = requests.get("http://localhost:8000/api/v1/dog-breeds/search?q=%D0%BE%D0%B2%D1%87%D0%B0%D1%80%D0%BA%D0%B0")
print("Breed search 'овчарка':", r.status_code, r.json()[:2] if isinstance(r.json(), list) else r.json())

# Let's find exact breed names
r2 = requests.get("http://localhost:8000/api/v1/dog-breeds/search?q=%D0%9D%D0%B5%D0%BC%D0%B5%D1%86%D0%BA%D0%B0%D1%8F")
print("Breed search 'Немецкая':", r2.status_code, r2.json()[:2] if isinstance(r2.json(), list) else r2.json())

# Check admin endpoint for rates (will fail without auth but let's see)
r3 = requests.get("http://localhost:8000/api/v1/admin/dog-tax-rates")
print("Admin dog rates:", r3.status_code, r3.json()[:2] if isinstance(r3.json(), list) else r3.json())