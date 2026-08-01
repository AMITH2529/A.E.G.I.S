import cloudscraper, os
from dotenv import load_dotenv

load_dotenv()

scraper = cloudscraper.create_scraper()
res = scraper.get('https://api.sketchfab.com/v3/search', 
    params={'type':'models','q':'spiderman','downloadable':'true'})

data = res.json()
results = data.get("results", [])
if results:
    print("Spiderman without sort_by:", results[0].get("name"), results[0].get("uid"))
else:
    print("No results")

res2 = scraper.get('https://api.sketchfab.com/v3/search', 
    params={'type':'models','q':'iron man','downloadable':'true'})

data2 = res2.json()
results2 = data2.get("results", [])
if results2:
    print("Iron man without sort_by:", results2[0].get("name"), results2[0].get("uid"))
else:
    print("No results")
