import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents="Paraphrase the following text clearly and effectively, maintaining the original meaning.\n\nText to paraphrase:\nHello world"
    )
    print("SUCCESS")
    print(response.text)
except Exception as e:
    print("ERROR:")
    print(str(e))
