import sys
import json
from extractor import extract_entities

if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

test_prompts = [
    # 1. Directional Ambiguity
    "Hà Nội Hải Phòng",
    "Xem giá vé máy bay SG HN",
    
    # 2. Quantifier Abstraction
    "Tôi đi một mình",
    "Mình book cho gia đình",
    "2 vợ chồng và 1 đứa nhỏ 3 tuổi",
    
    # 3. Implicit Context & Anchoring
    "Đặt vé về quê",
    "chiều mai ra sân bay bay vô Đà Lạt",
    
    # 4. Multi-Intent / Round-trip Confusion
    "10/6 đi Đà Nẵng, t7 tuần sau về"
]

print("=== CHẠY KIỂM THỬ CÁC LỖI THƯỜNG GẶP (EDGE CASES) ===\n")
for prompt in test_prompts:
    print(f"--- Prompt: '{prompt}' ---")
    result = extract_entities(prompt)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print()
