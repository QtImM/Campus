import json
import os

def generate_ft_samples():
    """
    Generates synthetic training data for fine-tuning the Agent's tool-use capability.
    Format: OpenAI/DeepSeek chat completion JSONL.
    """
    system_prompt = "You are the HKBU Campus Life Agent. Respond only with JSON actions."
    
    samples = [
        {
            "user": "我要订明天的位子",
            "assistant": {
                "thought": "User wants to book for tomorrow. I need to trigger manual login flow.",
                "action": {"tool": "start_manual_login", "input": {"roomType": "Group Study Rooms"}}
            }
        },
        {
            "user": "想看下后天下午两点有什么房",
            "assistant": {
                "thought": "Scanning for availability on the day after tomorrow at 14:00.",
                "action": {"tool": "scan_date", "input": {"date": "after_tomorrow", "time": "14:00"}}
            }
        },
        {
            "user": "帮我定明天下午3点，1小时，4个人",
            "assistant": {
                "thought": "Complete info provided. Locking duration and numUsers in state.",
                "action": {"tool": "start_manual_login", "input": {"time": "15:00", "duration": "1 Hour", "numUsers": "4"}}
            }
        }
    ]

    ft_data = []
    for s in samples:
        entry = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": s["user"]},
                {"role": "assistant", "content": json.dumps(s["assistant"], ensure_ascii=False)}
            ]
        }
        ft_data.append(entry)
    
    return ft_data

def main():
    print("Generating Fine-tuning Dataset (JSONL)...")
    dataset = generate_ft_samples()
    
    output_path = "scripts/training_data.jsonl"
    with open(output_path, "w", encoding="utf-8") as f:
        for entry in dataset:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            
    print(f"Success! Generated {len(dataset)} samples at {output_path}")
    print("\n--- Sample Entry ---")
    print(json.dumps(dataset[0], indent=2, ensure_ascii=False))

if __name__ == "__main__":
    if not os.path.exists("scripts"):
        os.makedirs("scripts")
    main()
