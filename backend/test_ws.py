import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws/forge"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to AEGIS.")
            
            # Send a summon command
            await websocket.send("forge me a cyberpunk helmet")
            print("Sent command.")
            
            # Receive response (intent)
            resp1 = await websocket.recv()
            print("Received:", resp1)
            
            # Receive response (model ready)
            resp2 = await websocket.recv()
            print("Received:", resp2)
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test_ws())
