
import csv

final_data = []

# 1. Load CS (40)
try:
    with open('../../data/parsed/hkbu_cs_faculty_parsed_v2.csv', 'r', encoding='utf-8') as f:
        final_data.extend(list(csv.DictReader(f)))
except: print("CS file not found")

# 2. Load Comm (67)
try:
    with open('../../data/parsed/hkbu_comm_faculty_parsed_v2.csv', 'r', encoding='utf-8') as f:
        final_data.extend(list(csv.DictReader(f)))
except: print("Comm file not found")

def add_batch(faculty, department, names_list, title="Academic Staff"):
    for item in names_list:
        if isinstance(item, list):
            name, email = item[0], item[1]
        else:
            name, email = item, ""
        final_data.append({
            'Faculty': faculty,
            'Department': department,
            'Name': name,
            'Title': title,
            'ImageURL': '',
            'Email': email,
            'SourceURL': ''
        })

# Science - Math (Summarized from results)
add_batch("Science", "Mathematics", [
    ["Prof. LING Leevan", "lling@hkbu.edu.hk"], ["Prof. Andrew LAM Kei Fong", "akflam@hkbu.edu.hk"],
    ["Prof. CHIU Sung Nok", "snchiu@hkbu.edu.hk"], ["Prof. CHENG Ming-Yen", "chengmingyen@hkbu.edu.hk"],
    ["Prof. Michael NG", "michael-ng@hkbu.edu.hk"], ["Prof. PENG Heng", "hpeng@hkbu.edu.hk"],
    ["Prof. TONG Tiejun", "tongt@hkbu.edu.hk"], ["Prof. XU Yi Da", "xuyida@hkbu.edu.hk"],
    ["Prof. DON Wai Sun", "donwaisun@hkbu.edu.hk"], ["Prof. FAN Jun", "junfan@hkbu.edu.hk"],
    ["Prof. LIU Hao", "haoliu@hkbu.edu.hk"], ["Prof. Sean HON Yu Sing", "seanyshon@hkbu.edu.hk"],
    ["Prof. TANG Xindong", "xdtang@hkbu.edu.hk"], ["Dr. Shun Ling CHIANG", "gcling@hkbu.edu.hk"],
    ["Dr. PAN Junjun", "junjunpan@hkbu.edu.hk"], ["Dr. YAO Shunan", "yaoshunan@hkbu.edu.hk"],
    ["Dr. ZHOU Le", "lezhou@hkbu.edu.hk"], ["Dr. XU Guangning", "guangningxu@hkbu.edu.hk"]
])

# Science - Physics
add_batch("Science", "Physics", [
    ["Prof. SO, Shu Kong", "phys@hkbu.edu.hk"], ["Prof. TIAN, Liang", ""], ["Prof. SHI, Jue Jade", ""],
    ["Prof. ZHU, Furong", "frzhu@hkbu.edu.hk"], ["Prof. Thomas KNOPFEL", ""], ["Prof. WAI, Ping-kong Alexander", ""],
    ["Prof. ZHOU, Chang Song", ""], ["Prof. MA, Guancong", ""], ["Prof. LI, Songsong", ""],
    ["Dr. CHAN, Mau Hing", "mhchan@hkbu.edu.hk"], ["Dr. CHOI, Wing Hong", "whchoi@hkbu.edu.hk"],
    ["Dr. HU, Qian", "qianhu@hkbu.edu.hk"], ["Dr. MA, Lik Kuen", ""]
])

# Science - Biology
add_batch("Science", "Biology", [
    ["Prof. LI, Jianming", "li-jianming@hkbu.edu.hk"], ["Prof. QIU, Jianwen", "qiujw@hkbu.edu.hk"],
    ["Prof. XIA, Yiji", "yxia@hkbu.edu.hk"], ["Prof. ZHANG, Jianhua", "jzhang@hkbu.edu.hk"],
    ["Prof. WONG, Chris Kong Chu", "ckcwong@hkbu.edu.hk"], ["Prof. PITSILADIS, Yannis", "ypitsiladis@hkbu.edu.hk"],
    ["Prof. ZHAO, Zhongying", "zyzhao@hkbu.edu.hk"], ["Prof. CHEUNG, Allen Ka Loon", "akcheung@hkbu.edu.hk"]
])

# Business - AEF
add_batch("Business", "Accountancy, Economics and Finance", [
    ["Prof. Byron SONG", "yangsong@hkbu.edu.hk"], ["Prof. Ting CHEN", "tingchen@hkbu.edu.hk"],
    ["Dr. Man KO", "manko@hkbu.edu.hk"], ["Prof. Bingbing HU", "bingbing@hkbu.edu.hk"],
    ["Dr. Jing LIU", "jingliu@hkbu.edu.hk"], ["Prof. Amanda AW YONG", "awyongamanda@hkbu.edu.hk"],
    ["Dr. Kar Lun CHAN", "ckarlun@hkbu.edu.hk"], ["Prof. Sihao CHEN", "chensihao@hkbu.edu.hk"]
])

# Business - MMIS
add_batch("Business", "Management, Marketing and Information Systems", [
    ["Prof. Song CHANG", "schang@hkbu.edu.hk"], ["Prof. Danny WANG", "dtwang@hkbu.edu.hk"],
    ["Dr. Jamie CHEUNG", "yhcheung@hkbu.edu.hk"], ["Prof. Kimmy CHAN", "kimmychan@hkbu.edu.hk"],
    ["Prof. Emily HUANG", "mnhgh@hkbu.edu.hk"], ["Prof. Amy CHEN", "chenyy@hkbu.edu.hk"]
])

# Arts & Social Sciences - History
add_batch("Arts and Social Sciences", "History", [
    ["Dr. FAN, Wing Chung", "siumo216@hkbu.edu.hk"], ["Dr. DING, Jie", "djxdd@hkbu.edu.hk"],
    ["Dr. KWOK, Kam Chau", "daniel_kc@hkbu.edu.hk"], ["Dr. LAW, Yuen Han", "yhlaw@hkbu.edu.hk"],
    ["Prof. CHU, Yik Yi Cindy", "cindychu@hkbu.edu.hk"], ["Prof. CHUNG, Po Yin Stephanie", "s53096@hkbu.edu.hk"]
])

# Arts & Social Sciences - Sociology
add_batch("Arts and Social Sciences", "Sociology", [
    ["KOO, Anita C.H.", ""], ["PATULNY, Roger", ""], ["SAKAMOTO, Arthur", ""],
    ["CHAN, Kwok Shing", ""], ["CHEUNG, Adam K.L.", ""], ["PENG, Yinni", "ynpeng@hkbu.edu.hk"],
    ["SIU, Kaxton Y.K.", "kaxton_siu@hkbu.edu.hk"]
])

# Creative Arts - Music
add_batch("Creative Arts", "Music", [
    ["Roberto ALONSO TRILLO", "robertoalonso@hkbu.edu"], ["Taurin BARRERA", "taurin@hkbu.edu"],
    ["Joydeep BHATTACHARYA", "jbhattacharya@hkbu.edu"], ["Eugene Birman", ""], ["David Chung", ""]
])

# Final Write
fieldnames = ['Faculty', 'Department', 'Name', 'Title', 'ImageURL', 'Email', 'SourceURL']
with open('../../data/parsed/hkbu_teachers.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(final_data)

print(f"Total consolidated rows: {len(final_data)}")
