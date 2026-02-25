
import requests
from bs4 import BeautifulSoup
import csv
import ssl
import urllib3

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def get_faculty_data():
    url = "https://www.comp.hkbu.edu.hk/v1/?page=faculty"
    
    # Create a custom SSL context that does NOT verify
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    teachers = []
    try:
        # Use a session with verify=False
        session = requests.Session()
        session.verify = False
        response = session.get(url, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Debug: Print all links to see what we are getting
    # print(f"Page Title: {soup.title.text}")
    
    # Looking at the pattern for faculty list on this specific site:
    # It seems to be a list of divs or a table. 
    # Let's look for elements that contain "page=profile"
    
    seen_ids = set()
    
    # Find all profile links
    for link in soup.find_all('a', href=True):
        href = link['href']
        if '?page=profile&id=' in href:
            profile_id = href.split('id=')[-1].split('&')[0]
            if profile_id in seen_ids: continue
            seen_ids.add(profile_id)

            name = link.get_text(strip=True)
            
            # If name is empty, check inside for img alt
            img_tag = link.find('img')
            if not name and img_tag:
                name = img_tag.get('alt', '')
            
            # If still empty, maybe the link is wrapping a div or span
            if not name:
                name = link.parent.get_text(strip=True)

            # Cleanup name
            if "Prof." in name or "Dr." in name or "Mr." in name or "Ms." in name:
                pass # Good, seems like a name
            # Heuristic: if name is too long, it might be a sentence.
            if len(name) > 50: 
                # try to find just the name part?
                # For now, let's keep it.
                pass
            
            # Image extraction attempt
            img_url = ""
            # Try to find an image in the same block
            # Assume table structure or div structure
            
            # Look for an image in the same <tr> or parent <div>
            parent = link.find_parent(['tr', 'div', 'li'])
            if parent:
                imgs = parent.find_all('img')
                for img in imgs:
                    src = img.get('src', '')
                    if 'photos/' in src or 'staff/' in src:
                        if src.startswith('http'):
                            img_url = src
                        else:
                            img_url = "https://www.comp.hkbu.edu.hk/v1/" + src
                        break
            
            # Fallback: check profile page content (Not implemented in this script to save time/requests)
            # But we can guess standard path: photos/{id}.jpg
            if not img_url:
                 img_url = f"https://www.comp.hkbu.edu.hk/v1/photos/{profile_id}.jpg"

            teachers.append([
                'Science', 'Computer Science', name, img_url, f"https://www.comp.hkbu.edu.hk/v1/{href}"
            ])

    return teachers

data = get_faculty_data()
if not data:
    print("No data found or error occurred.")
else:
    print(f"Found {len(data)} teachers.")
    with open('hkbu_cs_faculty_scraped.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Faculty', 'Department', 'Name', 'ImageURL', 'ProfileURL'])
        writer.writerows(data)
        for row in data:
            print(f"Scraped: {row[2]}")
