
import csv
import os


def consolidate():
    header = ['Faculty', 'Department', 'Name',
              'Title', 'ImageURL', 'Email', 'SourceURL']
    all_data = []

    # 定义数据文件及其所属
    files_to_load = [
        ('Science', 'Physics', '../../data/parsed/physics_final_v2.csv'),
        ('Science', 'Physics', '../../data/parsed/physics_research_data.csv'),
        ('Science', 'Physics', '../../data/parsed/physics_support_data.csv'),
        ('Science', 'Mathematics', '../../data/parsed/math_final_v2.csv'),
        ('Science', 'Computer Science',
         '../../data/parsed/hkbu_cs_faculty_parsed_v2.csv'),
        ('Communication', 'Communication Studies',
         '../../data/parsed/hkbu_comm_faculty_parsed_v2.csv')
    ]

    for faculty, dept, filename in files_to_load:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader, None)  # 跳过表头
                for row in reader:
                    if len(row) >= 7:
                        # 确保部门和学院信息正确
                        row[0] = faculty
                        row[1] = dept
                        all_data.append(row)

    # 添加手动搜索到的数据 (商学院, 中医药, 视觉艺术, FASS)
    manual_data = [
        ['Business', 'Management', 'Song CHANG',
            'Professor', '', 'schang@hkbu.edu.hk', ''],
        ['Business', 'AEF', 'Byron SONG', 'Professor',
            '', 'yangsong@hkbu.edu.hk', ''],
        ['Business', 'MMIS', 'Christy MK CHEUNG',
            'Professor', '', 'ccheung@hkbu.edu.hk', ''],
        ['Chinese Medicine', 'Teaching & Research', 'Lyu Aiping',
            'Chair Professor', '', 'aipinglu@hkbu.edu.hk', ''],
        ['Chinese Medicine', 'Teaching & Research', 'Bian Zhaoxiang',
            'Professor', '', 'bzxiang@hkbu.edu.hk', ''],
        ['Creative Arts', 'Visual Arts', 'Andreas KRATKY', 'Director', '', '', ''],
        ['Creative Arts', 'Visual Arts', 'Jeffrey SHAW',
            'Chair Professor', '', '', ''],
        ['Arts & Social Sciences', 'Sociology', 'Adam K.L. CHEUNG',
            'Associate Professor', '', 'adamkl@hkbu.edu.hk', ''],
        ['Arts & Social Sciences', 'Education', 'Sandy S C LI',
            'Professor', '', 'sandyli@hkbu.edu.hk', ''],
    ]
    all_data.extend(manual_data)

    # 去重 (基于姓名)
    seen_names = set()
    unique_data = []
    for row in all_data:
        if row[2] not in seen_names:
            unique_data.append(row)
            seen_names.add(row[2])

    # 写入最终文件
    output_file = '../../data/parsed/../../data/parsed/hkbu_teachers_final_exhaustive.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(unique_data)

    print(f'成功合并 {len(unique_data)} 条唯一的教职工记录。')


if __name__ == '__main__':
    consolidate()
