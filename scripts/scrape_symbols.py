import requests
from bs4 import BeautifulSoup
import os
import re
from urllib.parse import urljoin

SITE_URL = "https://kerala26.com/candidates"
OUTPUT_DIR = "public/symbols"

def scrape_symbols():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(SITE_URL, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # The symbols are inside <img> tags in the table
        # Based on subagent, they are in /images/parties/
        img_tags = soup.find_all('img', src=re.compile(r'/images/parties/'))
        
        unique_symbols = {}
        for img in img_tags:
            src = img['src']
            # Get full URL
            full_url = urljoin(SITE_URL, src)
            # Extract party name from filename (e.g., cpim from /images/parties/cpim.png)
            filename = os.path.basename(src)
            party_name = os.path.splitext(filename)[0].lower()
            
            if party_name not in unique_symbols:
                unique_symbols[party_name] = full_url

        print(f"Found {len(unique_symbols)} unique symbols.")

        for party, url in unique_symbols.items():
            ext = os.path.splitext(url)[1]
            local_filename = f"{party}{ext}"
            local_path = os.path.join(OUTPUT_DIR, local_filename)
            
            print(f"Downloading {party} symbol from {url}...")
            img_data = requests.get(url, headers=headers).content
            with open(local_path, 'wb') as handler:
                handler.write(img_data)
            print(f"Saved to {local_path}")

        print("✅ Scraping complete.")

    except Exception as e:
        print(f"❌ Error during scraping: {e}")

if __name__ == "__main__":
    scrape_symbols()
