
import requests
from bs4 import BeautifulSoup
import csv
import ssl
import urllib3

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def get_faculty_data():
    url = "https://www.comp.hkbu.edu.hk/v1/?page=faculty"
    # Use verify=False to bypass SSL check if needed, or provide custom context
    try:
        response = requests.get(url, verify=False, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    teachers = []
    
    # Based on observation of potential structure (divs with class 'staff-list' or similar, or just iterating through profile links)
    # The read_url_content output showed headers like "#### Prof. XU, Jianliang"
    # and links like "[Prof. XU, Jianliang](...?page=profile&id=xujl)"
    # We want to extract the name and the ID/URL.
    # The image is likely in the profile page OR in an img tag next to the link in the main page.
    
    # Strategy 1: Find all profile links
    # Typical link: ?page=profile&id=...
    
    seen_ids = set()
    
    for link in soup.find_all('a', href=True):
        href = link['href']
        if '?page=profile&id=' in href:
            # Extract detailed info
            name = link.get_text(strip=True)
            if not name:
                # sometimes image is wrapped in link
                img = link.find('img')
                if img:
                    # if image is wrapped, maybe alt text has name
                    name = img.get('alt', '')
            
            if not name: continue
            
            # Clean up name (remove "Prof.", "Dr." if desired, or keep)
            # Keeping full title is safer for now.
            
            profile_id = href.split('id=')[-1].split('&')[0]
            if profile_id in seen_ids: continue
            seen_ids.add(profile_id)
            
            # Now, get image URL. 
            # Often it's `https://www.comp.hkbu.edu.hk/v1/photos/{profile_id}.jpg` or similar.
            # OR we can parse the main page to see if an image is associated.
            
            # Let's try to find an image tag near this link
            # Navigate up to parent container
            container = link.find_parent('td') or link.find_parent('div')
            img_url = ""
            if container:
                img = container.find('img')
                if img:
                    src = img.get('src')
                    if src:
                        if src.startswith('http'):
                            img_url = src
                        else:
                            img_url = "https://www.comp.hkbu.edu.hk/v1/" + src
            
            # Fallback heuristic for HKBU COMP:
            if not img_url:
                 # Try standard path if known, otherwise leave empty
                 # Often: images/people/{id}.jpg
                 pass

            teachers.append({
                'Name': name,
                'ProfileURL': f"https://www.comp.hkbu.edu.hk/v1/{href}",
                'ImageURL': img_url,
                'Department': 'Computer Science',
                'Faculty': 'Science'
            })
            
    return teachers

data = get_faculty_data()
print(f"Found {len(data)} teachers.")

# CSV Output
with open('hkbu_cs_faculty_scraped.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['Faculty', 'Department', 'Name', 'ImageURL', 'ProfileURL'])
    writer.writeheader()
    for row in data:
        writer.writerow(row)
        print(f"Scraped: {row['Name']}")
