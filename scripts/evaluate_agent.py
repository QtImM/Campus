import json
import os

# Mock LLM Evaluation logic for demonstration
# In a real scenario, you would call OpenAI/DeepSeek to grade the response.

def evaluate_response(user_query, agent_json_output, expected_action):
    """
    Simulates Ragas-style metrics: Faithfulness, Answer Relevance, and Tool-Call Accuracy.
    """
    print(f"--- Evaluator ---")
    print(f"Query: {user_query}")
    print(f"Agent Output: {agent_json_output}")
    
    # Simple scoring logic for the demo
    accuracy = 1.0 if agent_json_output.get("action", {}).get("tool") == expected_action else 0.0
    
    # LLM-as-a-Judge Mock
    # prompt = f"User asked: {user_query}. Agent decided to: {agent_json_output}. Is this correct? Score 1-5."
    faithfulness = 0.95 
    relevance = 0.9  
    
    return {
        "tool_call_accuracy": accuracy,
        "faithfulness": faithfulness,
        "relevance": relevance,
        "score": (accuracy + faithfulness + relevance) / 3
    }

def main():
    # Golden Dataset: Input vs Expected Logic
    golden_dataset = [
        {
            "query": "帮我定明天下午3点的位子",
            "expected_tool": "start_manual_login",
            "agent_actual": {
                "thought": "User wants to book for tomorrow. Need login first.",
                "action": {"tool": "start_manual_login", "input": {"time": "15:00"}}
            }
        },
        {
            "query": "取消之前的预订",
            "expected_tool": "cancel_booking",
            "agent_actual": {
                "thought": "User wants to cancel.",
                "action": {"tool": "cancel_booking", "input": {}}
            }
        }
    ]

    results = []
    print("Starting RAG Evaluation Report...")
    for item in golden_dataset:
        metric = evaluate_response(item["query"], item["agent_actual"], item["expected_tool"])
        results.append(metric)

    # Calculate Average
    avg_score = sum(r["score"] for r in results) / len(results)
    
    report = {
        "model": "deepseek-chat (Agent Version 1.2)",
        "test_cases": len(golden_dataset),
        "average_score": round(avg_score, 2),
        "status": "PASS" if avg_score > 0.8 else "FAIL"
    }

    print("\n--- FINAL EVALUATION REPORT ---")
    print(json.dumps(report, indent=4, ensure_ascii=False))
    
    # Save for user review
    with open("scripts/evaluation_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=4)

if __name__ == "__main__":
    if not os.path.exists("scripts"):
        os.makedirs("scripts")
    main()
