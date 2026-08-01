import json
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

SYSTEM_PROMPT = """
You are AEGIS, an AI intent parser for a 3D holographic studio.
Parse the user's voice transcript into a single JSON object.
Do not output anything other than raw JSON.
Available actions:
- "summon": default action whenever the user asks for any object, item, model, vehicle, structure, concept, or types any noun (e.g. jet, car, robot, chair, dragon, drone, iron man). Set "prompt" to the item name, and ALWAYS set "shapeType" to "glb".
- "dismantle": user wants to explode, dismantle, pull apart, separate parts, or assemble, condense, reassemble the 3D model. Set "mode" to "explode" (to dismantle/explode) or "condense" (to assemble/put back).
- "morph": user wants to alter an object. Extract "target" (part) and "direction" (what to do).
- "recolor": user wants to change color or material finish. Extract "colors" (array of hex codes like ["#ffffff", "#0000ff"]) and/or "finish" (e.g. "metallic", "matte").
- "destroy": user wants to delete/destroy a single object.
- "clear_scene": user wants to clear the entire scene, delete everything, or remove all objects.
- "export": user wants to save/export. Extract "format" (glb).
"""

async def parse_intent(transcript: str) -> dict:
    text = transcript.lower().strip()

    # Instant deterministic keyword check for instant 100% accuracy on key commands
    if any(w in text for w in ["dismantle", "explode", "pull apart", "disassemble", "separate", "open up", "show parts", "expand parts"]):
        return {"action": "dismantle", "mode": "explode"}
    if any(w in text for w in ["assemble", "condense", "push inward", "put back", "reassemble", "combine", "close up"]):
        return {"action": "dismantle", "mode": "condense"}
    if any(w in text for w in ["stress test", "stress simulation", "flexibility", "impact"]):
        return {"action": "stress_test"}

    if GROQ_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post("https://api.groq.com/openai/v1/chat/completions", json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": transcript}
                    ],
                    "response_format": {"type": "json_object"}
                }, headers={"Authorization": f"Bearer {GROQ_API_KEY}"})
                
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"]["content"]
                    return json.loads(content)
                else:
                    print(f"Groq error: {response.text}")
                    return fallback_parse(transcript)
        except Exception as e:
            print(f"Groq API error: {e}")
            return fallback_parse(transcript)
    else:
        # No Groq key, try Ollama or fallback
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(OLLAMA_URL, json={
                    "model": MODEL_NAME,
                    "system": SYSTEM_PROMPT,
                    "prompt": transcript,
                    "stream": False,
                    "format": "json"
                }, timeout=3.0)
                if response.status_code == 200:
                    content = response.json().get("response", "{}")
                    return json.loads(content)
        except Exception:
            pass
            
        return fallback_parse(transcript)

def fallback_parse(transcript: str) -> dict:
    text = transcript.lower()
    
    # Mock Recolor / Paint / Make it color
    color_map = {
        "red": "#ff0000", "blue": "#0000ff", "green": "#00ff00", "yellow": "#ffff00",
        "purple": "#800080", "violet": "#800080", "cyan": "#00f3ff", "turquoise": "#00f3ff",
        "gold": "#ffd700", "silver": "#c0c0c0", "grey": "#888888", "gray": "#888888",
        "black": "#111111", "white": "#ffffff", "orange": "#ff8800", "pink": "#ff007f"
    }

    if any(w in text for w in ["color", "colour", "paint", "make it", "recolor", "tint", "metallic", "matte"]):
        colors = []
        for c_name, c_hex in color_map.items():
            if c_name in text:
                colors.append(c_hex)
        
        finish = None
        if "metallic" in text or "metal" in text or "chrome" in text: finish = "metallic"
        elif "matte" in text: finish = "matte"
        
        if colors or finish:
            res = {"action": "recolor"}
            if colors: res["colors"] = colors
            if finish: res["finish"] = finish
            return res
        
    # Mock Dismantle / Explode / Assemble
    if "dismantle" in text or "explode" in text or "pull apart" in text:
        return {"action": "dismantle", "mode": "explode"}
    if "assemble" in text or "condense" in text or "push inward" in text:
        return {"action": "dismantle", "mode": "condense"}

    # Mock Stress Test
    if "stress test" in text or "stress simulation" in text or "flexibility" in text:
        return {"action": "stress_test"}

    # Mock Destroy / Clear Scene
    if "clear scene" in text or "clear everything" in text or "clear all" in text:
        return {"action": "clear_scene"}
    if "destroy" in text or "delete" in text or "remove" in text or "clear" in text:
        return {"action": "destroy"}

    # Mock Forge "Summon" intent
    if "forge" in text or "summon" in text or "generate" in text or "import" in text:
        prompt = text
        for kw in ["forge me a ", "forge a ", "summon a ", "summon me a ", "generate a ", "import ", "import a "]:
            if kw in text:
                prompt = text.split(kw)[1]
                break
        
        # If they ask for complex models or local models
        shapeType = "sphere"
        if "box" in prompt or "cube" in prompt: shapeType = "box"
        elif "ring" in prompt or "torus" in prompt: shapeType = "torus"
        elif "cylinder" in prompt: shapeType = "cylinder"
        else:
            # Default to glb if any complex model keywords or local models exist
            shapeType = "glb"
        
        return {
            "action": "summon",
            "prompt": prompt.strip(),
            "shapeType": shapeType
        }
        
    # Mock Export intent
    if "export" in text or "download" in text or "save" in text:
        return {"action": "export", "format": "glb"}

    # Default fallback: Treat any query or single word as a summon request for Sketchfab / Local models!
    return {
        "action": "summon",
        "prompt": text.strip(),
        "shapeType": "glb"
    }
