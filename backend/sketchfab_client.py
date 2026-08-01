import os
import cloudscraper
import asyncio
from dotenv import load_dotenv

load_dotenv()
SKETCHFAB_API_KEY = os.getenv("SKETCHFAB_API_KEY")

async def get_glb(query: str, output_filename: str):
    """
    Searches Sketchfab for the query, gets the first downloadable model, and saves the GLB.
    """
    if not SKETCHFAB_API_KEY:
        print("SKETCHFAB_API_KEY not found.")
        return False

    headers = {
        "Authorization": f"Token {SKETCHFAB_API_KEY}"
    }

    try:
        def fetch_sync():
            scraper = cloudscraper.create_scraper()
            
            uid = None
            name = query
            
            # 1. Check if the query is a Sketchfab URL or exact UID
            import re
            url_match = re.search(r'sketchfab\.com/(?:3d-models/.*?-(?P<uid>[a-f0-9]{32})|models/(?P<uid2>[a-f0-9]{32}))', query)
            if url_match:
                uid = url_match.group('uid') or url_match.group('uid2')
                print(f"Extracted UID from URL: {uid}")
            elif re.match(r'^[a-f0-9]{32}$', query):
                uid = query
                print(f"Using direct UID: {uid}")
                
            if not uid:
                # Search for a downloadable model
                search_url = "https://api.sketchfab.com/v3/search"
                params = {
                    "type": "models",
                    "q": query,
                    "downloadable": "true"
                }
                
                print(f"Searching Sketchfab for: {query}")
                search_res = scraper.get(search_url, params=params, headers=headers)
                
                if search_res.status_code != 200:
                    print(f"Sketchfab search failed: {search_res.text}")
                    return False
                    
                data = search_res.json()
                results = data.get("results", [])
                
                if not results:
                    print("No Sketchfab models found for this query.")
                    return False

                # Iterate through top 10 search results until we find a downloadable GLB model
                for model in results[:10]:
                    uid = model.get("uid")
                    name = model.get("name")
                    print(f"Checking model candidate: {name} ({uid})")

                    download_api_url = f"https://api.sketchfab.com/v3/models/{uid}/download"
                    dl_res = scraper.get(download_api_url, headers=headers)
                    
                    if dl_res.status_code != 200:
                        print(f"Model {uid} download unauthorized/unavailable (HTTP {dl_res.status_code}), trying next candidate...")
                        continue

                    dl_data = dl_res.json()
                    glb_url = None
                    if "glb" in dl_data:
                        glb_url = dl_data["glb"]["url"]
                    elif "gltf" in dl_data:
                        glb_url = dl_data["gltf"]["url"]

                    if not glb_url:
                        print(f"GLB URL missing for {uid}, trying next candidate...")
                        continue

                    print(f"Downloading GLB from {glb_url}...")
                    file_res = scraper.get(glb_url, allow_redirects=True)
                    if file_res.status_code == 200 and len(file_res.content) > 1000:
                        os.makedirs(os.path.dirname(output_filename), exist_ok=True)
                        with open(output_filename, "wb") as f:
                            f.write(file_res.content)
                        print(f"Successfully downloaded and saved {name} to {output_filename}")
                        return True
                    else:
                        print(f"Failed to fetch content for {uid}, trying next candidate...")

                print("No downloadable GLB models succeeded out of top results.")
                return False

        # Run the synchronous scraper in a thread to not block the event loop
        return await asyncio.to_thread(fetch_sync)
                
    except Exception as e:
        print(f"Error in sketchfab_client: {e}")
        return False
