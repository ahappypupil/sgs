# -*- coding: utf-8 -*-
"""
使用ddddocr识别27张新头像图片中的武将名字，然后重命名替换旧头像
"""

import os
import re
import ddddocr
from PIL import Image

# ===== 配置 =====
HEROES_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', 'heroes')

# 27个武将的 id -> 名字 映射
HERO_NAME_MAP = {
    'liubei': '刘备', 'guanyu': '关羽', 'zhangfei': '张飞',
    'zhaoyun': '赵云', 'zhugeliang': '诸葛亮', 'machao': '马超',
    'huangzhong': '黄忠', 'weiyan': '魏延',
    'caocao': '曹操', 'simayi': '司马懿', 'xiahoudun': '夏侯惇',
    'xuachu': '许褚', 'guojia': '郭嘉', 'xunyu': '荀彧', 'zhangliao': '张辽',
    'sunquan': '孙权', 'zhouyu': '周瑜', 'lvmeng': '吕蒙',
    'huanggai': '黄盖', 'ganning': '甘宁', 'daqiao': '大乔',
    'luxun': '陆逊', 'lvbu': '吕布', 'diaochan': '貂蝉',
    'huatuo': '华佗', 'yanliangwenchou': '颜良文丑', 'jiaxu': '贾诩',
}

# 特征字 -> id 映射 (用于模糊匹配)
CHAR_TO_ID = {
    '刘备': 'liubei', '备': 'liubei',
    '关羽': 'guanyu', '羽': 'guanyu',
    '张飞': 'zhangfei', '飞': 'zhangfei',
    '赵云': 'zhaoyun', '云': 'zhaoyun',
    '诸葛亮': 'zhugeliang', '亮': 'zhugeliang',
    '马超': 'machao', '超': 'machao',
    '黄忠': 'huangzhong',
    '魏延': 'weiyan', '延': 'weiyan',
    '曹操': 'caocao', '操': 'caocao',
    '司马懿': 'simayi', '懿': 'simayi',
    '夏侯惇': 'xiahoudun', '惇': 'xiahoudun',
    '许褚': 'xuachu', '褚': 'xuachu',
    '郭嘉': 'guojia',
    '荀彧': 'xunyu', '彧': 'xunyu',
    '张辽': 'zhangliao', '辽': 'zhangliao',
    '孙权': 'sunquan', '权': 'sunquan',
    '周瑜': 'zhouyu', '瑜': 'zhouyu',
    '吕蒙': 'lvmeng', '蒙': 'lvmeng',
    '黄盖': 'huanggai', '盖': 'huanggai',
    '甘宁': 'ganning', '宁': 'ganning',
    '大乔': 'daqiao', '乔': 'daqiao',
    '陆逊': 'luxun', '逊': 'luxun',
    '吕布': 'lvbu', '布': 'lvbu',
    '貂蝉': 'diaochan', '蝉': 'diaochan',
    '华佗': 'huatuo', '佗': 'huatuo',
    '颜良文丑': 'yanliangwenchou', '颜良': 'yanliangwenchou', '文丑': 'yanliangwenchou',
    '贾诩': 'jiaxu', '诩': 'jiaxu',
}


def ocr_image(image_path, ocr):
    """对图片进行OCR识别，返回识别到的文字"""
    img = Image.open(image_path)
    # 裁剪底部区域 (名字通常在底部 20-30% 区域)
    w, h = img.size
    bottom = img.crop((0, int(h * 0.78), w, h))
    text = ocr.classification(bottom)
    return text.strip()


def find_hero_id(ocr_text):
    """从OCR文本中找到匹配的武将ID"""
    cleaned = ocr_text.replace(' ', '').replace('\n', '').strip()
    
    # 精确匹配 (优先长名字)
    for name in sorted(CHAR_TO_ID.keys(), key=len, reverse=True):
        if name in cleaned:
            return CHAR_TO_ID[name]
    
    return None


def main():
    print("[初始化] 加载OCR模型...")
    ocr = ddddocr.DdddOcr(show_ad=False)
    
    # 找到所有新图片文件
    files = [f for f in os.listdir(HEROES_DIR) 
             if f.startswith('三国人物宫格头像') and f.endswith('.png')]
    
    files.sort(key=lambda x: int(re.search(r'\((\d+)\)', x).group(1)) 
               if re.search(r'\((\d+)\)', x) else 0)
    
    print(f"[INFO] 找到 {len(files)} 张新头像图片\n")
    
    results = []
    unmatched = []
    
    for filename in files:
        filepath = os.path.join(HEROES_DIR, filename)
        
        print(f"[处理] {filename}...", end=' ')
        
        try:
            ocr_text = ocr_image(filepath, ocr)
            hero_id = find_hero_id(ocr_text)
            
            if hero_id:
                hero_name = HERO_NAME_MAP.get(hero_id, '?')
                print(f"=> {hero_name} ({hero_id}) [OCR: {ocr_text[:15]}]")
                results.append((filename, hero_id, hero_name))
            else:
                print(f"=> 未匹配! [OCR: {ocr_text}]")
                unmatched.append((filename, ocr_text))
        except Exception as e:
            print(f"=> 错误: {e}")
            unmatched.append((filename, f"ERROR: {e}"))
    
    # 汇总
    print(f"\n{'='*60}")
    print(f"[汇总] 成功匹配 {len(results)}/{len(files)}")
    
    if unmatched:
        print(f"\n[未匹配 {len(unmatched)} 个]:")
        for fn, txt in unmatched:
            print(f"  {fn}: {txt}")
    
    # 执行重命名
    print(f"\n{'='*60}")
    print("[执行重命名]")
    
    used_ids = set()
    duplicates = []
    
    for src_filename, hero_id, hero_name in results:
        dst_filename = f"{hero_id}.png"
        src_path = os.path.join(HEROES_DIR, src_filename)
        dst_path = os.path.join(HEROES_DIR, dst_filename)
        
        if hero_id in used_ids:
            duplicates.append((src_filename, hero_id, hero_name))
            print(f"  [重复!] {src_filename} -> {dst_filename} ({hero_name}) [ID已使用!]")
            continue
        
        used_ids.add(hero_id)
        
        # 删除旧文件
        if os.path.exists(dst_path):
            os.remove(dst_path)
        
        # 重命名
        os.rename(src_path, dst_path)
        print(f"  [OK] {src_filename} -> {dst_filename} ({hero_name})")
    
    if duplicates:
        print(f"\n[警告] {len(duplicates)} 个重复ID，需要手动处理:")
        for fn, hid, name in duplicates:
            print(f"  {fn} => {hid} ({name})")
    
    # 保留未匹配文件
    for src_filename, _ in unmatched:
        print(f"  [保留] {src_filename}")
    
    print(f"\n[DONE] 完成! 成功替换 {len(results) - len(duplicates)}/{len(files)} 个头像")


if __name__ == '__main__':
    main()
