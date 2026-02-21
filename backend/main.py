import io
import os
import base64
import json
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="HKCampus AI OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# DeepSeek API Configuration
# Retrieved from services/agent/config.ts
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "sk-78bf6b52b7be4ccbaaf8221da5c861ee")
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions" # Note: check if deepseek supports multimodality via completions

@app.post("/extract/schedule")
async def extract_schedule(file: UploadFile = File(...)):
    """
    接收上传的课表图片，并传递给 DeepSeek API 提取结构化信息
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_data = await file.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
        }

        # DeepSeek API currently primarily supports text. If using a specific Multi-modal variant of DeepSeek, 
        # the payload structure might differ. 
        # For standard text-only DeepSeek, OCR must be done prior (via Tesseract/Donut) or using a true VLM API (like GPT-4V, Qwen-VL, GLM-4V)
        
        # Note: If DeepSeek doesn't natively support image inputs (base64) yet on their public API,
        # we might need to route this to an alternative provider or explicitly warn.
        # Assuming DeepSeek-VL or a compatible endpoint is available:
        payload = {
            "model": "deepseek-chat", # Update to the correct vision model name if they have one (e.g., deepseek-vision)
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "你是一个课表信息提取助手。请从下面这张课表图片中，提取出所有的课程信息，并严格以JSON数组的格式返回，包含以下字段：course (课程名称), room (教室), time (上课时间，如：星期一 14:30)。不要输出除了JSON以外的任何冗余回复。"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            "max_tokens": 1000,
            "response_format": {"type": "json_object"}
        }

        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        result_json = response.json()
        content = result_json['choices'][0]['message']['content']
        
        print(f"DeepSeek Response: {content}")
        
        # Parse JSON
        extracted_data = json.loads(content)
        
        # For the frontend we just return the first one as an example, but ideally the frontend should handle lists
        first_course = extracted_data[0] if isinstance(extracted_data, list) and len(extracted_data) > 0 else {}
        
        if isinstance(extracted_data, dict) and 'courses' in extracted_data:
            first_course = extracted_data['courses'][0] if len(extracted_data['courses']) > 0 else {}

        return {
            "status": "success",
            "raw_response": extracted_data,
            "extraction": {
                "course": first_course.get("course", "未知课程"),
                "room": first_course.get("room", "未知教室"),
                "time": first_course.get("time", "未知时间"),
                "full_text": content
            }
        }

    except Exception as e:
        print(f"Extraction error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "healthy", "model": "DeepSeek API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
