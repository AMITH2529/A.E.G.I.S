import asyncio
import json
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    try:
        async with httpx.AsyncClient() as client:
            system_prompt = "You are AEGIS, an AI intent parser for a 3D holographic studio.\nParse the user's voice transcript into a single JSON object.\nDo not output anything other than raw JSON.\nAvailable actions:\n- \"summon\": user wants to create a new object. Extract \"prompt\" (what to make). If they ask for a specific complex 3D model (like iron man, car, character), set \"shapeType\" to \"glb\". Otherwise, use standard shapes (box, sphere, etc)."
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "importing spiderman"}
                ],
                "response_format": {"type": "json_object"}
            }
            response = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers={"Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}"})
            print("Status:", response.status_code)
            print("Response:", response.text)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
