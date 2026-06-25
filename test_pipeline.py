import time
from dotenv import load_dotenv
load_dotenv('backend/.env')

print('=== Full pipeline test ===')

from backend.services.recommendation_engine import get_recommendations
from backend.services.response_generator import generate_response

t1 = time.time()
result = get_recommendations('I have high fever and body aches', 20.2961, 85.8245)
t2 = time.time()
clf = result['classification']
recs = result.get('recommendations', [])
dept = clf['department']
sev = clf['severity']
print(f'[1] Recommendations: dept={dept}, severity={sev}, {len(recs)} hospitals ({(t2-t1)*1000:.0f}ms)')

response = generate_response(clf, recs)
t3 = time.time()
print(f'[2] LLM response ({(t3-t2)*1000:.0f}ms):')
print(f'    {response}')
print(f'TOTAL: {(t3-t1)*1000:.0f}ms')
