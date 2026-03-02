
from bs4 import BeautifulSoup
import csv
import re

def parse_comm_faculty():
    try:
        with open('hkbu_comm_faculty.html', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return []

    soup = BeautifulSoup(content, 'html.parser')
    teachers = []
    
    # In HKBU Comm faculty page, looking at the grep/Get-Content output:
    # <div class="staff-profile-block">
    # <div class="staff-profile-avatar circle">
    # <a href="...">
    
    seen_names = set()
    
    for block in soup.select('.staff-profile-block, .staff-item, .views-row'):
        name_tag = block.find(['h3', 'h4', 'div', 'a'], class_=re.compile(r'name|title'))
        # If not found by class, try any bold/header text
        if not name_tag:
             name_tag = block.find(['h3', 'h4', 'strong'])
        
        if not name_tag: continue
        
        name = name_tag.get_text(strip=True)
        if not name or len(name) < 3: continue
        if name in seen_names: continue
        seen_names.add(name)
        
        # Title
        title = "Staff Member"
        title_tag = block.find(['p', 'span', 'div'], class_=re.compile(r'position|title|designation'))
        if title_tag:
            title = title_tag.get_text(strip=True)
        
        # Image
        img_url = ""
        img = block.find('img')
        if img:
            src = img.get('src', '')
            if src.startswith('http'):
                img_url = src
            else:
                img_url = "https://comm.hkbu.edu.hk" + src
        
        # Email
        email = ""
        email_link = block.find('a', href=re.compile(r'mailto:'))
        if email_link:
            email = email_link['href'].replace('mailto:', '').strip()
        
        # Profile
        profile_url = ""
        p_link = block.find('a', href=True)
        if p_link:
            profile_url = p_link['href']
            if not profile_url.startswith('http'):
                profile_url = "https://comm.hkbu.edu.hk" + profile_url

        # Department
        department = "Communication"
        # Often there's a header or section context
        # But this is already the "people" page for the school.
        
        teachers.append({
            'Faculty': 'Communication',
            'Department': department,
            'Name': name,
            'Title': title,
            'ImageURL': img_url,
            'Email': email,
            'SourceURL': profile_url
        })

    return teachers

data = parse_comm_faculty()
with open('hkbu_comm_faculty_parsed.csv', 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['Faculty', 'Department', 'Name', 'Title', 'ImageURL', 'Email', 'SourceURL']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in data:
        writer.writerow(row)
print(f"Parsed {len(data)} communication teachers.")
