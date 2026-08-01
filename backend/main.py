from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import os
from brain import parse_intent
from forge_fast import forge_engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure asset cache directory exists
os.makedirs("asset_cache", exist_ok=True)
app.mount("/asset_cache", StaticFiles(directory="asset_cache"), name="asset_cache")

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/forge")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received raw text from client: {data}")
            
            # Step 1: Parse Intent using the AI Brain
            parsed_intent = await parse_intent(data)
            parsed_intent["raw_transcript"] = data
            
            raw_lower = data.lower().strip()
            action = parsed_intent.get("action") or parsed_intent.get("intent") or parsed_intent.get("mode")

            # Preserve explicit control actions (recolor, dismantle, clear, export)
            if any(w in raw_lower for w in ["paint", "color", "colour", "recolor", "tint", "metallic", "matte", "chrome"]):
                action = "recolor"
                parsed_intent["action"] = "recolor"
            elif any(w in raw_lower for w in ["dismantle", "explode", "pull apart", "separate", "assemble", "condense"]):
                action = "dismantle"
                parsed_intent["action"] = "dismantle"
            elif any(w in raw_lower for w in ["clear scene", "clear everything", "delete all", "purge"]):
                action = "clear_scene"
                parsed_intent["action"] = "clear_scene"
            elif any(w in raw_lower for w in ["destroy", "delete", "remove"]):
                action = "destroy"
                parsed_intent["action"] = "destroy"
            elif any(w in raw_lower for w in ["export", "download scene", "save"]):
                action = "export"
                parsed_intent["action"] = "export"
            elif not action or action in ["summon", "import", "load", "create", "generate", "forge", "bring", "add"]:
                action = "summon"
                parsed_intent["action"] = "summon"
                
                prompt = parsed_intent.get("prompt") or parsed_intent.get("object")
                if not prompt:
                    for kw in ["import ", "summon ", "bring ", "create ", "forge ", "add "]:
                        if kw in raw_lower:
                            raw_lower = raw_lower.split(kw)[-1]
                            break
                    prompt = raw_lower.strip()
                parsed_intent["prompt"] = prompt or "object"
            
            print(f"Parsed & Normalized Intent: {parsed_intent}")
            
            # Step 2: Send structured command back to client
            await manager.send_personal_message(json.dumps(parsed_intent), websocket)
            
            # Step 3: Trigger Forge ONLY on Summon
            if action == "summon":
                prompt = parsed_intent.get("prompt", "object")
                shape_type = parsed_intent.get("shapeType") or "glb"
                
                output_filename = f"asset_cache/{prompt.replace(' ', '_')}.glb"
                
                import glob, shutil
                local_models_dir = "local_models"
                os.makedirs(local_models_dir, exist_ok=True)
                
                search_query = prompt.lower().replace(" ", "").replace("_", "")
                local_files = os.listdir(local_models_dir)
                matched_file = None
                for f in local_files:
                    if f.endswith(".glb"):
                        f_base = f[:-4].lower().replace(" ", "").replace("_", "")
                        if f_base in search_query or search_query in f_base:
                            matched_file = f
                            break
                
                success = False
                shape_type = "glb"

                if matched_file:
                    print(f"Found local model for '{prompt}': {matched_file}")
                    shutil.copy(os.path.join(local_models_dir, matched_file), output_filename)
                    shape_type = "glb"
                    success = True
                else:
                    print(f"No local model found for '{prompt}'. Searching Sketchfab automatically...")
                    try:
                        from sketchfab_client import get_glb
                        success = await get_glb(prompt, output_filename)
                    except Exception as err:
                        print(f"Sketchfab fetch error: {err}")
                        success = False
                        
                    if success:
                        shape_type = "glb"
                    else:
                        shape_type = "sphere"
                        output_filename = None
                
                response = {
                    "action": "model_ready",
                    "shapeType": shape_type,
                    "url": f"/{output_filename}" if output_filename else None
                }
                await manager.send_personal_message(json.dumps(response), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")

@app.get("/")
def read_root():
    return {"status": "AEGIS Forge Backend Online"}

@app.get("/api/sketchfab_key")
def get_sketchfab_key():
    import os
    return {"key": os.getenv("SKETCHFAB_API_KEY")}
