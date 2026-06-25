"""
LLM Response Generator

Takes the symptom classification + top hospital recommendations and generates
a concise, natural-language response using the Groq Inference API.

Falls back to a templated string if the Groq API is unavailable.
"""

import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama3-8b-8192")

_RESPONSE_PROMPT = """\
You are MEDX, a medical assistant AI. Based on the triage result and hospital recommendations below,
write a concise, empathetic, and actionable response (2-4 sentences) for the patient.
Do NOT use markdown. Do NOT list hospitals by name more than once. Be direct and clear.

Triage result:
- Department needed: {department}
- Severity: {severity}
- Priority score: {priority_score}/100

Top recommended hospital:
- Name: {top_hospital_name}
- Distance: {distance_km:.1f} km away
- Suitability score: {suitability_score:.0%}
- Specialty: {specialty}
- Available beds: {beds}, ICU beds: {icu_beds}
- Estimated wait: {wait_time} minutes

Write your response now:
"""


def _call_groq_response(prompt: str) -> str | None:
    """Call the Groq Inference API and return a plain-text response, or None on failure."""
    if not GROQ_API_KEY:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are MEDX, a concise and empathetic medical triage assistant. Never use markdown."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=200,
            temperature=0.7,
            timeout=10,
        )

        text = (completion.choices[0].message.content or "").strip()
        return text if text else None

    except Exception:
        return None


def _template_fallback(classification: dict, recommendations: list[dict]) -> str:
    """Generate a simple templated response when the Groq API is unavailable."""
    department = classification.get("department", "General Medicine")
    severity = classification.get("severity", "Low")

    if not recommendations:
        return (
            f"Based on your symptoms, you may need {department} care. "
            "Unfortunately, no nearby hospitals are currently available in our database. "
            "Please contact emergency services if your condition is urgent."
        )

    top = recommendations[0]
    name = top.get("hospital_name", "the recommended hospital")
    dist = top.get("distance_km", 0.0)
    wait = top.get("wait_time", 0)
    score = top.get("suitability_score", 0.0)

    urgency = (
        "immediately" if severity == "Critical"
        else "as soon as possible" if severity == "Moderate"
        else "at your earliest convenience"
    )

    return (
        f"Based on your symptoms, you require {department} care ({severity} priority). "
        f"We recommend {name}, located {dist:.1f} km away with a {score:.0%} suitability score. "
        f"The estimated wait time is {wait} minutes. Please head there {urgency}."
    )


def generate_response(classification: dict, recommendations: list[dict]) -> str:
    """Generate a natural-language response for the patient.

    Args:
        classification: Output from calculate_priority()
        recommendations: Ranked list from get_recommendations()

    Returns:
        A plain-text response string for the frontend to display.
    """
    # Guardrail: return the redirect message directly — no LLM call needed
    if classification.get("off_topic"):
        return str(classification.get(
            "message",
            "I'm MEDX, a medical triage assistant. Please describe your symptoms so I can help you."
        ))

    if not recommendations:
        return _template_fallback(classification, recommendations)

    top = recommendations[0]
    prompt = _RESPONSE_PROMPT.format(
        department=classification.get("department", "General Medicine"),
        severity=classification.get("severity", "Low"),
        priority_score=classification.get("priority_score", 20),
        top_hospital_name=top.get("hospital_name", "N/A"),
        distance_km=float(top.get("distance_km", 0.0)),
        suitability_score=float(top.get("suitability_score", 0.0)),
        specialty=top.get("specialty") or "General",
        beds=top.get("beds", 0),
        icu_beds=top.get("icu_beds", 0),
        wait_time=top.get("wait_time", 0),
    )

    response = _call_groq_response(prompt)
    if response:
        return response

    return _template_fallback(classification, recommendations)
