def calculate_priority(symptoms: str):

    symptoms = symptoms.lower()

    if "chest pain" in symptoms:
        return {
            "priority_score": 98,
            "severity": "Critical",
            "department": "Cardiology"
        }

    elif "difficulty breathing" in symptoms:
        return {
            "priority_score": 95,
            "severity": "Critical",
            "department": "Emergency Medicine"
        }

    elif "high fever" in symptoms:
        return {
            "priority_score": 70,
            "severity": "Moderate",
            "department": "General Medicine"
        }

    elif "headache" in symptoms:
        return {
            "priority_score": 40,
            "severity": "Low",
            "department": "General Medicine"
        }

    return {
        "priority_score": 20,
        "severity": "Low",
        "department": "General Medicine"
    }
