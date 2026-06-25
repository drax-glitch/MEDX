"""
Priority Engine — LLM-powered symptom classification with guardrails.

Uses the Groq Inference API (cloud-hosted) to classify the user's
symptom message into:
    - department  (e.g. "Cardiology", "Emergency Medicine")
    - severity    ("Critical", "Moderate", "Low")
    - priority_score (0-100 integer)

Guardrails reject off-topic inputs (non-medical questions) before any
LLM call is made.

Falls back to an expanded keyword-based classifier if the Groq API is
unavailable or returns malformed output.
"""

import json
import os
import re
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "llama3-8b-8192")

# ---------------------------------------------------------------------------
# Off-topic response sentinel
# ---------------------------------------------------------------------------
OFF_TOPIC_RESULT: dict = {
    "off_topic": True,
    "department": "N/A",
    "severity": "N/A",
    "priority_score": 0,
    "message": (
        "I'm MEDX, a medical triage assistant. I can only help with health-related "
        "questions and hospital recommendations. Please describe your symptoms or "
        "medical condition so I can assist you."
    ),
}

# ---------------------------------------------------------------------------
# Guardrail — detect off-topic inputs
# ---------------------------------------------------------------------------

# Phrases that are clearly non-medical topics
_OFF_TOPIC_PATTERNS: list[re.Pattern] = [
    re.compile(p, re.IGNORECASE) for p in [
        r"\b(write|generate|create|make|build|code|program|script|function|algorithm)\b.*\b(code|program|app|website|function|script|api)\b",
        r"\b(what is|who is|tell me about|explain|define)\b.{0,60}\b(capital|president|prime minister|country|city|history|movie|song|game|sport|weather|stock|crypto|bitcoin|recipe|food)\b",
        r"\b(weather|temperature|forecast|rain|humidity|climate)\b",
        r"\b(stock|share price|market|crypto|bitcoin|ethereum|investment|finance|money|loan|bank)\b",
        r"\b(math|calculate|solve|equation|algebra|calculus|geometry|integral|derivative)\b",
        r"\b(translate|translation|language|grammar|spell check|synonym|antonym)\b",
        r"\b(joke|funny|meme|entertainment|movie|music|game|sport|football|cricket|tennis)\b",
        r"\b(politics|election|vote|government|president|prime minister|parliament)\b",
        r"\b(recipe|cook|bake|ingredient|meal|dish|restaurant|food delivery)\b",
        r"\b(travel|hotel|flight|booking|ticket|vacation|holiday|tour)\b",
        r"\b(relationship|dating|love|marriage|divorce|breakup)\b",
        r"\bhello\b|\bhi\b|\bhey\b|\bwhat('?s| is) up\b|\bhow are you\b",
    ]
]

# Medical signal words — any of these suggests a genuine medical query
_MEDICAL_SIGNALS: list[str] = [
    "pain", "ache", "hurt", "sore", "fever", "cough", "bleed", "bleed",
    "breath", "chest", "head", "stomach", "nausea", "vomit", "diarrhea",
    "dizzy", "faint", "swollen", "rash", "itch", "burn", "wound", "cut",
    "broken", "fracture", "sprain", "seizure", "unconscious", "allergy",
    "infection", "pressure", "sugar", "diabetes", "blood", "doctor",
    "hospital", "emergency", "medicine", "symptom", "sick", "ill", "weak",
    "tired", "fatigue", "numbness", "tremor", "vision", "hearing", "ear",
    "throat", "breathing", "heartbeat", "pulse", "sweat", "child", "baby",
    "pregnant", "injury", "accident", "bite", "sting", "poison", "overdose",
    "mental", "anxiety", "depression", "panic", "psychiatric",
]

def _is_medical_query(text: str) -> bool:
    """Return True if the input looks like a medical/health query, False if off-topic."""
    lower = text.lower()

    # If any medical signal word is present, treat as medical
    if any(signal in lower for signal in _MEDICAL_SIGNALS):
        return True

    # If any off-topic pattern matches, reject
    for pattern in _OFF_TOPIC_PATTERNS:
        if pattern.search(text):
            return False

    # Very short generic messages with no medical content (e.g. "hi", "test")
    if len(text.strip().split()) <= 3 and not any(signal in lower for signal in _MEDICAL_SIGNALS):
        return False

    # Default: allow (LLM will handle edge cases)
    return True


# ---------------------------------------------------------------------------
# LLM classification prompt
# ---------------------------------------------------------------------------
_CLASSIFICATION_PROMPT = """\
You are a medical triage assistant. Given the patient's symptom description,
respond with ONLY a valid JSON object (no markdown, no extra text) in this exact format:
{{
  "department": "<one of: Cardiology, Emergency Medicine, General Medicine, Pediatrics, Orthopedics, Neurology, Psychiatry, Gastroenterology, Pulmonology, Dermatology, Ophthalmology, ENT, Urology, Gynecology, Oncology>",
  "severity": "<one of: Critical, Moderate, Low>",
  "priority_score": <integer 0-100>
}}

Rules:
- Critical (score 80-100): life-threatening, needs immediate attention
- Moderate (score 40-79): urgent but not immediately life-threatening
- Low (score 0-39): non-urgent, can wait for a scheduled appointment

Patient symptoms: {symptoms}
"""

# ---------------------------------------------------------------------------
# Expanded keyword fallback
# ---------------------------------------------------------------------------
_KEYWORD_RULES: list[tuple[list[str], dict]] = [
    # --- Cardiology ---
    (["chest pain", "heart attack", "cardiac arrest", "angina", "palpitation",
      "irregular heartbeat", "heart pain", "left arm pain", "jaw pain with chest"],
     {"department": "Cardiology", "severity": "Critical", "priority_score": 98}),

    # --- Emergency / Trauma ---
    (["difficulty breathing", "can't breathe", "shortness of breath", "respiratory",
      "choking", "stopped breathing", "blue lips", "oxygen"],
     {"department": "Emergency Medicine", "severity": "Critical", "priority_score": 95}),
    (["severe bleeding", "heavy bleeding", "blood loss", "accident", "trauma",
      "unconscious", "unresponsive", "collapsed", "overdose", "poisoning",
      "electric shock", "drowning", "severe burn", "gunshot", "stab"],
     {"department": "Emergency Medicine", "severity": "Critical", "priority_score": 96}),

    # --- Neurology ---
    (["stroke", "paralysis", "face drooping", "sudden numbness", "slurred speech",
      "loss of balance", "sudden severe headache", "vision loss sudden",
      "confusion sudden", "seizure", "epilepsy", "fits", "convulsion"],
     {"department": "Neurology", "severity": "Critical", "priority_score": 97}),
    (["migraine", "chronic headache", "dizziness", "vertigo", "tremor",
      "memory loss", "numbness", "tingling hands", "tingling feet"],
     {"department": "Neurology", "severity": "Moderate", "priority_score": 55}),

    # --- Orthopedics ---
    (["broken bone", "fracture", "sprain", "dislocated", "wrist pain",
      "ankle pain", "arm pain", "knee pain", "joint pain", "back pain",
      "neck pain", "shoulder pain", "hip pain", "arthritis", "ligament",
      "tendon", "cast", "bone ache"],
     {"department": "Orthopedics", "severity": "Moderate", "priority_score": 60}),

    # --- Pediatrics ---
    (["child", "infant", "baby", "toddler", "pediatric", "newborn",
      "kid fever", "child vomiting", "child diarrhea", "child rash"],
     {"department": "Pediatrics", "severity": "Moderate", "priority_score": 65}),

    # --- General Medicine / Fever & Infection ---
    (["high fever", "fever", "chills", "shivering", "body ache", "dengue",
      "malaria", "typhoid", "flu", "influenza", "weakness", "fatigue",
      "general illness", "not feeling well"],
     {"department": "General Medicine", "severity": "Moderate", "priority_score": 60}),
    (["cold", "runny nose", "sore throat", "cough", "mild fever", "blocked nose",
      "sneezing", "common cold", "headache", "mild headache"],
     {"department": "General Medicine", "severity": "Low", "priority_score": 30}),

    # --- Pulmonology ---
    (["asthma", "wheezing", "chest tightness", "chronic cough", "copd",
      "lung", "tuberculosis", "tb", "bronchitis", "pneumonia",
      "breathlessness", "phlegm", "mucus"],
     {"department": "Pulmonology", "severity": "Moderate", "priority_score": 70}),

    # --- Gastroenterology ---
    (["stomach pain", "abdominal pain", "nausea", "vomiting", "diarrhea",
      "constipation", "bloating", "gas", "acidity", "heartburn", "ulcer",
      "indigestion", "irritable bowel", "jaundice", "liver", "hepatitis",
      "blood in stool", "rectal bleeding", "appendix"],
     {"department": "Gastroenterology", "severity": "Moderate", "priority_score": 55}),

    # --- Dermatology ---
    (["rash", "skin rash", "itching", "allergy", "hives", "eczema", "psoriasis",
      "acne", "pimples", "fungal infection", "ringworm", "dandruff",
      "hair loss", "skin infection", "wound infection", "abscess", "boil",
      "mole", "skin growth", "blisters"],
     {"department": "Dermatology", "severity": "Low", "priority_score": 30}),

    # --- Psychiatry ---
    (["anxiety", "depression", "mental health", "panic attack", "suicidal",
      "self harm", "eating disorder", "insomnia", "sleep disorder",
      "hallucination", "schizophrenia", "bipolar", "mood swings",
      "stress", "ptsd", "ocd", "phobia"],
     {"department": "Psychiatry", "severity": "Moderate", "priority_score": 50}),

    # --- Ophthalmology ---
    (["eye pain", "eye redness", "blurry vision", "double vision", "eye swelling",
      "eye infection", "conjunctivitis", "pink eye", "glaucoma", "cataract",
      "vision problem", "cannot see", "loss of vision", "eye injury"],
     {"department": "Ophthalmology", "severity": "Moderate", "priority_score": 55}),

    # --- ENT (Ear, Nose, Throat) ---
    (["ear pain", "earache", "hearing loss", "ringing ear", "tinnitus",
      "ear infection", "nose bleed", "nosebleed", "throat pain",
      "difficulty swallowing", "tonsils", "sinusitis", "nasal polyp"],
     {"department": "ENT", "severity": "Low", "priority_score": 35}),

    # --- Urology ---
    (["urinary", "painful urination", "burning urination", "frequent urination",
      "blood in urine", "kidney stone", "kidney pain", "uti", "prostate",
      "bladder", "incontinence"],
     {"department": "Urology", "severity": "Moderate", "priority_score": 50}),

    # --- Gynecology ---
    (["pregnancy", "pregnant", "period pain", "menstrual", "vaginal discharge",
      "ovarian", "uterus", "pelvic pain", "gynecology", "breast pain",
      "breast lump", "menopause", "irregular periods"],
     {"department": "Gynecology", "severity": "Moderate", "priority_score": 55}),

    # --- Oncology ---
    (["cancer", "tumor", "lump", "growth", "oncology", "chemotherapy",
      "radiation", "biopsy", "malignant", "benign growth"],
     {"department": "Oncology", "severity": "Moderate", "priority_score": 65}),

    # --- Diabetes / Endocrine ---
    (["diabetes", "high blood sugar", "low blood sugar", "hypoglycemia",
      "hyperglycemia", "thyroid", "insulin", "sugar level", "blood sugar"],
     {"department": "General Medicine", "severity": "Moderate", "priority_score": 60}),
]


def _keyword_fallback(symptoms: str) -> dict:
    """Match symptoms against expanded keyword rules. Returns a classification dict."""
    text = symptoms.lower()
    for keywords, result in _KEYWORD_RULES:
        if any(kw in text for kw in keywords):
            return result
    # Ultimate default
    return {"department": "General Medicine", "severity": "Low", "priority_score": 20}


# ---------------------------------------------------------------------------
# Groq Inference API classifier
# ---------------------------------------------------------------------------
def _call_groq(symptoms: str) -> dict | None:
    """Call the Groq Inference API and return a parsed classification dict, or None on failure."""
    if not GROQ_API_KEY:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)

        prompt = _CLASSIFICATION_PROMPT.format(symptoms=symptoms)

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a medical triage assistant. Always respond with only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=150,
            temperature=0.1,
            timeout=10,
        )

        raw_text = completion.choices[0].message.content or ""

        start = raw_text.find("{")
        end   = raw_text.rfind("}") + 1
        if start == -1 or end == 0:
            return None

        parsed = json.loads(raw_text[start:end])
        department = str(parsed.get("department", "")).strip()
        severity   = str(parsed.get("severity", "")).strip()
        score      = int(parsed.get("priority_score", 0))

        if department and severity and 0 <= score <= 100:
            return {"department": department, "severity": severity, "priority_score": score}
        return None

    except Exception:
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def calculate_priority(symptoms: str) -> dict:
    """Classify symptoms using guardrails → Groq LLM → keyword fallback.

    Returns:
        On valid medical input:
            { "department": str, "severity": str, "priority_score": int }
        On off-topic input:
            { "off_topic": True, "department": "N/A", "severity": "N/A",
              "priority_score": 0, "message": str }
    """
    # --- Guardrail: reject non-medical queries ---
    if not _is_medical_query(symptoms):
        return OFF_TOPIC_RESULT

    # --- Primary: Groq Inference API ---
    result = _call_groq(symptoms)
    if result is not None:
        return result

    # --- Fallback: expanded keyword rules ---
    return _keyword_fallback(symptoms)
