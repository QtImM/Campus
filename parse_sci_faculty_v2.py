
from bs4 import BeautifulSoup
import csv
import re

def parse_staff_page(filename, faculty, department, base_url):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filename}: {e}")
        return []

    soup = BeautifulSoup(content, 'html.parser')
    teachers = []
    seen_names = set()
    
    # Generic selectors for HKBU department sites
    for item in soup.select('.staff-item, .views-row, .staff-box, .faculty-staff-box, .staff-info'):
        name_tag = item.find(['h3', 'h4', 'strong', 'a'], class_=re.compile(r'name|title'))
        if not name_tag:
            name_tag = item.find(['h3', 'h4', 'strong'])
        
        if not name_tag: continue
        name = name_tag.get_text(strip=True)
        if not name or len(name) < 3: continue
        if name in seen_names: continue
        seen_names.add(name)
        
        # Title
        title = "Staff Member"
        title_tag = item.find(['p', 'span', 'div'], class_=re.compile(r'position|title|designation'))
        if title_tag:
            title = title_tag.get_text(strip=True)
        
        # Image
        img_url = ""
        img = item.find('img')
        if img:
            src = img.get('src', '')
            if src:
                if src.startswith('http'):
                    img_url = src
                else:
                    img_url = base_url + src
        
        # Email
        email = ""
        email_link = item.find('a', href=re.compile(r'mailto:'))
        if email_link:
            email = email_link['href'].replace('mailto:', '').strip()
        
        # Profile
        profile_url = ""
        p_link = item.find('a', href=True)
        if p_link:
            profile_url = p_link['href']
            if not profile_url.startswith('http'):
                profile_url = base_url + profile_url

        teachers.append({
            'Faculty': faculty,
            'Department': department,
            'Name': name,
            'Title': title,
            'ImageURL': img_url,
            'Email': email,
            'SourceURL': profile_url
        })
    return teachers

# Parse Biol
biol_data = parse_staff_page('hkbu_biol_faculty.html', 'Science', 'Biology', 'https://biol.hkbu.edu.hk')
# Parse Chem
chem_data = parse_staff_page('hkbu_chem_faculty.html', 'Science', 'Chemistry', 'https://chem.hkbu.edu.hk')

all_data = biol_data + chem_data

with open('hkbu_sci_faculty_parsed_v2.csv', 'w', newline='', encoding='utf-8') as f:
    fieldnames = ['Faculty', 'Department', 'Name', 'Title', 'ImageURL', 'Email', 'SourceURL']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(all_data)

print(f"Parsed {len(biol_data)} biology and {len(chem_data)} chemistry teachers.")
