"""
ტეხილი - Hotel Booking System
Data Generator (uses only Python stdlib - no external packages needed)
Run: python generate_data.py
Generates: data/hotels.json, data/bookings.json
"""

import json
import random
import os

random.seed(42)

CITIES = ["თბილისი", "ბათუმი", "ქუთაისი", "გორი"]

HOTEL_NAMES = {
    "თბილისი": ["მარკო პოლო", "კოლხეთი გრანდი", "ძველი თბილისი", "მთაწმინდა ვიუ", "ვერეს პალასი"],
    "ბათუმი":  ["შავი ზღვა სუიტები", "ბათუმი ბიჩ", "კოლხეთი ბოულევარდი", "სანაპირო პლაზა"],
    "ქუთაისი": ["ბაგრატი ჰოტელი", "კოლხეთი ინი", "ოქროს საწმისი"],
    "გორი":    ["გორის პალასი", "მუხრანი ჰოტელი"],
}

ROOM_TYPES = [
    {"type": "single", "label": "სინგლ რუმი",      "size_label": "ერთადგილიანი", "base_price_range": (25, 50)},
    {"type": "double", "label": "დაბლ რუმი",       "size_label": "ორადგილიანი",  "base_price_range": (50, 100)},
    {"type": "king",   "label": "კინგ საიზ რუმი",  "size_label": "კინგ საიზი",   "base_price_range": (100, 180)},
]

AMENITIES_POOL = [
    "Wi-Fi", "კონდიციონერი", "სამინდვრო", "TV", "სეიფი",
    "მინი-ბარი", "აბაზანა", "ბალკონი", "ხედი ქალაქზე", "ხედი ზღვაზე",
]

def pick_amenities():
    n = random.randint(3, 6)
    return random.sample(AMENITIES_POOL, n)

def gen_hotels():
    hotels = []
    hotel_id = 1
    for city, names in HOTEL_NAMES.items():
        for name in names:
            stars = random.randint(3, 5)
            rating = round(random.uniform(7.0, 9.9), 1)
            rooms = []
            room_id_start = hotel_id * 100 + 1
            for i, rt in enumerate(ROOM_TYPES):
                count = random.randint(2, 4)
                for j in range(count):
                    price = random.randint(*rt["base_price_range"])
                    rooms.append({
                        "id": room_id_start + i * 10 + j,
                        "hotel_id": hotel_id,
                        "name": f"{rt['label']} #{j+1}",
                        "type": rt["type"],
                        "type_label": rt["label"],
                        "size_label": rt["size_label"],
                        "price": price,
                        "capacity": 1 if rt["type"] == "single" else (2 if rt["type"] == "double" else 2),
                        "amenities": pick_amenities(),
                        "available": True,
                        "image": "",   # user will fill in
                        "favorite": random.random() < 0.15,
                    })
            hotels.append({
                "id": hotel_id,
                "name": name,
                "city": city,
                "stars": stars,
                "rating": rating,
                "address": f"{city}, {random.randint(1,99)} {random.choice(['რუსთაველის', 'ბარათაშვილის', 'ჭავჭავაძის', 'კოსტავას'])} გამზ.",
                "phone": f"+995 5{random.randint(10,99)} {random.randint(100,999)} {random.randint(100,999)}",
                "image": "",   # user will fill in
                "rooms": rooms,
            })
            hotel_id += 1
    return hotels

def main():
    os.makedirs("data", exist_ok=True)

    hotels = gen_hotels()
    with open("data/hotels.json", "w", encoding="utf-8") as f:
        json.dump(hotels, f, ensure_ascii=False, indent=2)
    print(f"✓ data/hotels.json — {len(hotels)} hotels generated")

    with open("data/bookings.json", "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)
    print("✓ data/bookings.json — empty bookings file created")

    print("\nAll done! Open index.html in your browser to start.")

if __name__ == "__main__":
    main()
