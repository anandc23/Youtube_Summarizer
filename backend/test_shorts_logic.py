from shorts_generator import generate_shorts
import json

test_url = "https://www.youtube.com/watch?v=aqz-KE-bpKQ" # Short sample video

print(f"Testing shorts generation for: {test_url}")
try:
    result = generate_shorts(test_url, num_shorts=1, clip_duration=10)
    print("Result:", json.dumps(result, indent=2))
except Exception as e:
    print("Error:", e)
