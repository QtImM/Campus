
from bs4 import BeautifulSoup
import csv
import re

def parse_local_html():
    try:
        with open('hkbu_cs_faculty.html', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return []

    soup = BeautifulSoup(content, 'html.parser')
    teachers = []
    
    seen_ids = set()
    
    # Debug: print all links
    links = soup.find_all('a', href=True)
    print(f"Total links found: {len(links)}")
    
    for link in links:
        href = link['href']
        if '?page=profile&id=' in href:
            profile_id = href.split('id=')[-1].split('&')[0]
            if profile_id in seen_ids: continue
            seen_ids.add(profile_id)

            # Heuristic for name extraction
            name = link.get_text(strip=True)
            
            # Sometimes the link text is empty, check for img alt
            if not name:
                img_tag = link.find('img')
                if img_tag:
                    name = img_tag.get('alt', '')
            
            if not name:
                # Try finding name in previous sibling or parent context if link wraps image only
                # Often struct is <div><a href...><img...></a> <a href...>Name</a></div>
                # Let's see if there is another link with same href that has text
                # We can skip this "image only" link and wait for the text one, 
                # OR we can try to find the text one now.
                pass

            # If still no name, skip
            if not name: continue

            # Construct Image URL
            # Based on standard HKBU COMP pattern: photos/{id}.jpg
            # We can verify if this image actually exists later, but for now construct it.
            # Also check if there is a specific img tag
            img_url = f"https://www.comp.hkbu.edu.hk/v1/photos/{profile_id}.jpg"
            
            # Clean up name: "Prof. XU, Jianliang" -> "XU, Jianliang" or keep title
            # User wants "comprehensive", keeping title is fine or parsing it out.
            # Let's keep it as is, or remove "Prof." "Dr." prefix for cleaner sorting?
            # User said "Dr. WANG...", so keeping title is probably expected.

            profile_full_url = f"https://www.comp.hkbu.edu.hk/v1/{href}"
            
            # Department is Computer Science
            teachers.append({
                'Faculty': 'Science',
                'Department': 'Computer Science',
                'Name': name,
                'Title': 'Faculty Member', # Generic title, hard to parse specifics without deeper scraping
                'ImageURL': img_url,
                'SourceURL': profile_full_url
            })

    return teachers

data = parse_local_html()
print(f"Found {len(data)} teachers.")

# Append to or Create CSV
# We will overwrite the CS section of our main CSV later, 
# for now let's save to a temp file to verify.
with open('hkbu_cs_faculty_parsed.csv', 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['Faculty', 'Department', 'Name', 'Title', 'ImageURL', 'SourceURL']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in data:
        writer.writerow(row)
        print(f"Parsed: {row['Name']}")
