
from bs4 import BeautifulSoup
import csv
import re

def parse_science_faculty():
    try:
        with open('hkbu_sci_faculty.html', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return []

    soup = BeautifulSoup(content, 'html.parser')
    teachers = []
    
    # In HKBU Science faculty page, members are often in grid or list.
    # We look for containers that have faculty info.
    # Often they use "staff-box" or similar classes.
    # Let's try to find all image tags and their nearest titles.
    
    # Based on a typical sci.hkbu structure:
    # <div class="staff-info"> or similar
    
    seen_names = set()
    
    # Try finding by name patterns or links
    for box in soup.select('.staff-info, .faculty-staff-box, .views-row'):
        name_tag = box.find(['h3', 'h4', 'strong', 'a'])
        if not name_tag: continue
        
        name = name_tag.get_text(strip=True)
        if not name or len(name) < 3: continue
        if name in seen_names: continue
        seen_names.add(name)
        
        # Image
        img_url = ""
        img = box.find('img')
        if img:
            src = img.get('src', '')
            if src.startswith('http'):
                img_url = src
            else:
                img_url = "https://www.sci.hkbu.edu.hk" + src
        
        # Email
        email = ""
        email_link = box.find('a', href=re.compile(r'mailto:'))
        if email_link:
            email = email_link['href'].replace('mailto:', '').strip()
        
        # Profile
        profile_url = ""
        p_link = box.find('a', href=True)
        if p_link:
            profile_url = p_link['href']
            if not profile_url.startswith('http'):
                profile_url = "https://www.sci.hkbu.edu.hk" + profile_url
        
        # Department - can be tricky from general page.
        # Often there's a header above.
        department = "Science (General)"
        # Heuristic: check parent or previous siblings for department name
        prev = box.find_previous(['h2', 'h1'])
        if prev:
            text = prev.get_text().lower()
            if 'biology' in text: department = 'Biology'
            elif 'chemistry' in text: department = 'Chemistry'
            elif 'mathematics' in text: department = 'Mathematics'
            elif 'physics' in text: department = 'Physics'

        teachers.append({
            'Faculty': 'Science',
            'Department': department,
            'Name': name,
            'Title': 'Academic Staff',
            'ImageURL': img_url,
            'Email': email,
            'SourceURL': profile_url
        })
    
    # Fallback: if no boxes found, search for all <a> with email and titles
    if not teachers:
        for link in soup.find_all('a', href=re.compile(r'mailto:')):
            email = link['href'].replace('mailto:', '').strip()
            # Name might be in text of link or nearby
            parent = link.find_parent(['td', 'tr', 'div', 'p'])
            if parent:
                name_text = parent.get_text(strip=True)
                # Cleanup name - very complex without structured data
                # Let's try to extract name before the email
                pass

    return teachers

data = parse_science_faculty()
with open('hkbu_sci_faculty_parsed.csv', 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['Faculty', 'Department', 'Name', 'Title', 'ImageURL', 'Email', 'SourceURL']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in data:
        writer.writerow(row)
print(f"Parsed {len(data)} science teachers.")
