import csv
import random

def generate_synthetic_data(num_samples: int, output_file: str):
    headers = [
        "distance_km",
        "travel_time_min",
        "beds",
        "icu_beds",
        "wait_time",
        "rating",
        "doctor_availability",
        "is_suitable"
    ]

    data = []
    
    for _ in range(num_samples):
        distance_km = round(random.uniform(0.5, 50.0), 2)
        travel_time_min = int(distance_km * random.uniform(1.2, 2.5)) + random.randint(2, 10)
        
        beds = random.randint(0, 30)
        icu_beds = random.randint(0, 15)
        wait_time = random.randint(0, 120)
        rating = round(random.uniform(2.0, 5.0), 1)
        doctor_availability = random.randint(0, 20)
        
        # Heuristic to determine suitability
        score = 0
        if distance_km < 10: score += 2
        elif distance_km < 25: score += 1
        
        if wait_time < 30: score += 2
        elif wait_time < 60: score += 1
        
        if beds > 5: score += 1
        if icu_beds > 2: score += 1
        if rating >= 4.0: score += 1
        if doctor_availability > 3: score += 1
        
        # Base classification
        suitable = 1 if score >= 5 else 0
        
        # Introduce some noise (10% chance to flip) so the model has to learn probabilities
        if random.random() < 0.10:
            suitable = 1 - suitable
            
        data.append([
            distance_km,
            travel_time_min,
            beds,
            icu_beds,
            wait_time,
            rating,
            doctor_availability,
            suitable
        ])

    with open(output_file, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(data)
        
    print(f"Successfully generated {num_samples} samples and saved to {output_file}")

if __name__ == "__main__":
    generate_synthetic_data(2000, "synthetic_hospital_data.csv")
