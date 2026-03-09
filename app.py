import os
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API Client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

class ParaphraseRequest(BaseModel):
    text: str
    tone: str

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/paraphrase")
async def paraphrase(req: ParaphraseRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        return {"success": False, "error": "API Key is missing or invalid. Please add your Gemini API key to the .env file."}
    
    try:
        # Construct the prompt based on the chosen tone
        prompt_instruction = ""
        if req.tone == "professional":
            prompt_instruction = "Paraphrase the following text to sound highly professional, formal, and articulate, while maintaining the original meaning."
        elif req.tone == "casual":
            prompt_instruction = "Paraphrase the following text to sound casual, friendly, and conversational, while maintaining the original meaning."
        elif req.tone == "concise":
            prompt_instruction = "Rewrite the following text to be as concise and direct as possible, removing any fluff while keeping the core message."
        elif req.tone == "creative":
            prompt_instruction = "Rewrite the following text in a creative, engaging, and imaginative tone."
        else:
            prompt_instruction = "Paraphrase the following text clearly and effectively, maintaining the original meaning."
            
        full_prompt = f"{prompt_instruction}\n\nText to paraphrase:\n{req.text}"
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=full_prompt
        )
        return {"success": True, "result": response.text.strip()}
    except Exception as e:
        return {"success": False, "error": str(e)}
