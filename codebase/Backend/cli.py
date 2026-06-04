import sys
import json
from extractor import extract_entities

def main():
    # Cấu hình encoding utf-8 cho stdout trên Windows
    if sys.platform.startswith('win'):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')

    if len(sys.argv) > 1:
        # Nhận prompt từ đối số dòng lệnh
        prompt = " ".join(sys.argv[1:])
        result = extract_entities(prompt)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        # Chế độ tương tác qua stdin
        print("=== CÔNG CỤ TRÍCH XUẤT THÔNG TIN CHUYẾN ĐI (TRIP.COM CO-PILOT) ===")
        print("Nhập prompt Tiếng Việt (hoặc gõ 'exit' để thoát):")
        while True:
            try:
                prompt = input("\nUser Prompt > ").strip()
                if not prompt:
                    continue
                if prompt.lower() in ['exit', 'quit', 'thoát']:
                    break
                result = extract_entities(prompt)
                print("Output JSON:")
                print(json.dumps(result, indent=2, ensure_ascii=False))
            except (KeyboardInterrupt, EOFError):
                break
        print("Tạm biệt!")

if __name__ == "__main__":
    main()
