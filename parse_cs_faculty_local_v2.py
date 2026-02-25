
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
    
    for link in soup.find_all('a', href=True):
        href = link['href']
        if '?page=profile&id=' in href:
            profile_id = href.split('id=')[-1].split('&')[0]
            if profile_id in seen_ids: continue
            seen_ids.add(profile_id)

            name = link.get_text(strip=True)
            if not name:
                img_tag = link.find('img')
                if img_tag:
                    name = img_tag.get('alt', '')
            
            if not name: continue

            img_url = f"https://www.comp.hkbu.edu.hk/v1/photos/{profile_id}.jpg"
            profile_full_url = f"https://www.comp.hkbu.edu.hk/v1/{href}"
            
            # Email guess for CS: id@comp.hkbu.edu.hk
            email = f"{profile_id}@comp.hkbu.edu.hk"
            
            teachers.append({
                'Faculty': 'Science',
                'Department': 'Computer Science',
                'Name': name,
                'Title': 'Faculty Member',
                'ImageURL': img_url,
                'Email': email,
                'SourceURL': profile_full_url
            })

    return teachers

data = parse_local_html()
with open('hkbu_cs_faculty_parsed_v2.csv', 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['Faculty', 'Department', 'Name', 'Title', 'ImageURL', 'Email', 'SourceURL']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in data:
        writer.writerow(row)
print(f"Parsed {len(data)} teachers.")
