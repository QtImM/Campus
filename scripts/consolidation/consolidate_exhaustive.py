
import csv
import os

def consolidate():
    header = ['Faculty', 'Department', 'Name', 'Title', 'ImageURL', 'Email', 'SourceURL']
    all_data = []

    # 1. Physics (53)
    for f in ['../../data/parsed/physics_final_v2.csv', '../../data/parsed/physics_research_data.csv', '../../data/parsed/physics_support_data.csv']:
        if os.path.exists(f):
            with open(f, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                next(reader)
                all_data.extend(list(reader))

    # 2. Computer Science (40)
    if os.path.exists('../../data/parsed/cs_parsed.csv'):
        with open('../../data/parsed/cs_parsed.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)
            all_data.extend(list(reader))

    # 3. Mathematics (21)
    if os.path.exists('../../data/parsed/math_final_v2.csv'):
        with open('../../data/parsed/math_final_v2.csv', 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)
            all_data.extend(list(reader))

    # 4. Communication (35+ from search 569)
    comm_data = [
        ['Communication', 'Comm Studies', 'CHAN, Kara K. W.', 'Prof', '', 'karachan@hkbu.edu.hk', ''],
        ['Communication', 'Comm Studies', 'CHAN, Tik Fan', 'Assoc Prof', '', '', ''],
        ['Communication', 'Comm Studies', 'CHANG, Leanne', 'Assoc Prof', '', '', ''],
        ['Communication', 'Comm Studies', 'CHEN, Anfan', 'Res Asst Prof', '', '', ''],
        ['Communication', 'Comm Studies', 'CHEN, Regina Y. R.', 'Head/Prof', '', '', ''],
        ['Communication', 'Comm Studies', 'FENG, Charles G. C.', 'Assoc Dean/Prof', '', 'charlesfeng@hkbu.edu.hk', ''],
        ['Communication', 'Comm Studies', 'FUNG, Henry T. Y.', 'Lecturer', '', '', ''],
        ['Communication', 'Comm Studies', 'FUNG, Timothy K. F.', 'Assoc Prof', '', '', ''],
        ['Communication', 'Comm Studies', 'LEE, Kelvin K. W.', 'Assoc Prof', '', 'kelvinee@hkbu.edu.hk', ''],
        ['Communication', 'Comm Studies', 'TSANG, Stephanie Jean', 'Prof', '', '', ''],
        ['Communication', 'Comm Studies', 'WEI, Ran', 'Chair Prof', '', 'ranwei@hkbu.edu.hk', ''],
        ['Communication', 'Comm Studies', 'ZHONG, Bu', 'Dean/Prof', '', 'zhongbu@hkbu.edu.hk', ''],
        ['Communication', 'Interactive Media', 'CHOW, Kenny K. N.', 'Head/Assoc Prof', '', '', ''],
        ['Communication', 'School Office', 'NIE, Natalie', 'EO', '', 'natalienie@hkbu.edu.hk', ''],
        ['Communication', 'School Office', 'YIP, Mimi M. L.', 'EO', '', 'mimiyip@hkbu.edu.hk', ''],
        ['Communication', 'School Office', 'SHI, Sophia Huiya', 'EO', '', 'sophiashi@hkbu.edu.hk', ''],
    ]
    all_data.extend(comm_data)

    # 5. Business (40+ from search 570)
    bus_data = [
        ['Business', 'MMIS', 'Song CHANG', 'Head/Prof', '', 'schang@hkbu.edu.hk', ''],
        ['Business', 'AEF', 'Byron SONG', 'Head/Prof', '', 'yangsong@hkbu.edu.hk', ''],
        ['Business', 'Dean Office', 'Kimmy CHAN', 'Assoc Dean', '', 'kimmychan@hkbu.edu.hk', ''],
        ['Business', 'AEF', 'Janus ZHANG', 'Prof', '', 'januszhang@hkbu.edu.hk', ''],
        ['Business', 'AEF', 'Chris ZHAO', 'Prof', '', 'xiaodong-zhao@hkbu.edu.hk', ''],
        ['Business', 'AEF', 'Ting CHEN', 'Prof', '', 'tingchen@hkbu.edu.hk', ''],
        ['Business', 'MMIS', 'Christy MK CHEUNG', 'Prof', '', 'ccheung@hkbu.edu.hk', ''],
        ['Business', 'MMIS', 'Han ZHANG', 'Prof', '', 'hanzhang@hkbu.edu.hk', ''],
    ]
    all_data.extend(bus_data)

    # 6. Arts & Social Sciences (from search 619)
    fass_data = [
        ['Arts & Social Sciences', 'Sociology', 'Arthur SAKAMOTO', 'Prof', '', 'asakamoto@hkbu.edu.hk', ''],
        ['Arts & Social Sciences', 'Sociology', 'Adam K.L. CHEUNG', 'Assoc Prof', '', 'adamkl@hkbu.edu.hk', ''],
        ['Arts & Social Sciences', 'Sociology', 'Kaxton Y.K. SIU', 'Assoc Prof', '', 'kaxton_siu@hkbu.edu.hk', ''],
        ['Arts & Social Sciences', 'Education', 'Lisa L P DENG', 'Prof', '', 'lisadeng@hkbu.edu.hk', ''],
        ['Arts & Social Sciences', 'Education', 'Sandy S C LI', 'Prof', '', 'sandyli@hkbu.edu.hk', ''],
        ['Arts & Social Sciences', 'Geography', 'Kevin LO Tek Sheng', 'Prof', '', 'lokevin@hkbu.edu.hk', ''],
        ['Arts & Social Sciences', 'Geography', 'Charlotte YANG Chun', 'Prof', '', 'chunyang@hkbu.edu.hk', ''],
    ]
    all_data.extend(fass_data)

    # 7. Chinese Medicine (from search 624)
    scm_data = [
        ['Chinese Medicine', 'T&R', 'Lyu Aiping', 'Chair Prof', '', 'aipinglu@hkbu.edu.hk', ''],
        ['Chinese Medicine', 'T&R', 'Bian Zhaoxiang', 'Prof', '', 'bzxiang@hkbu.edu.hk', ''],
        ['Chinese Medicine', 'T&R', 'Chen Hubiao', 'Prof', '', 'hbchen@hkbu.edu.hk', ''],
        ['Chinese Medicine', 'T&R', 'Zhang Ge', 'Chair Prof', '', 'zhangge@hkbu.edu.hk', ''],
    ]
    all_data.extend(scm_data)

    # 8. Visual Arts (from search 625)
    ava_data = [
        ['Creative Arts', 'Visual Arts', 'Andreas KRATKY', 'Director/Prof', '', '', ''],
        ['Creative Arts', 'Visual Arts', 'Kachi CHAN', 'Asst Prof', '', 'kachichan@hkbu.edu.hk', ''],
        ['Creative Arts', 'Visual Arts', 'Jeffrey SHAW', 'Chair Prof', '', '', ''],
        ['Creative Arts', 'Visual Arts', 'Kingsley NG Siu King', 'Assoc Prof', '', '', ''],
    ]
    all_data.extend(ava_data)

    # Write
    with open('../../data/parsed/hkbu_teachers_exhaustive_v2.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(all_data)
    
    print(f'Final consolidated entries: {len(all_data)}')

consolidate()
