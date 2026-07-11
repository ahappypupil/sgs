# -*- coding: utf-8 -*-
"""
根据OCR推断结果，完成剩余8个头像的重命名
"""

import os

HEROES_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', 'heroes')

# 手动映射 (基于OCR推断)
MANUAL_MAPPING = {
    '三国人物宫格头像 (10).png': ('simayi',    '司马懿'),
    '三国人物宫格头像 (11).png': ('xiahoudun',  '夏侯惇'),
    '三国人物宫格头像 (12).png': ('xuachu',     '许褚'),
    '三国人物宫格头像 (13).png': ('guojia',     '郭嘉'),
    '三国人物宫格头像 (15).png': ('xunyu',      '荀彧'),
    '三国人物宫格头像 (17).png': ('zhouyu',     '周瑜'),
    '三国人物宫格头像 (25).png': ('huatuo',     '华佗'),
    '三国人物宫格头像 (27).png': ('jiaxu',      '贾诩'),
}


def main():
    success = 0
    for src_filename, (hero_id, hero_name) in MANUAL_MAPPING.items():
        src_path = os.path.join(HEROES_DIR, src_filename)
        dst_filename = f"{hero_id}.png"
        dst_path = os.path.join(HEROES_DIR, dst_filename)
        
        if not os.path.exists(src_path):
            print(f"[SKIP] {src_filename} not found")
            continue
        
        # 删除旧文件
        if os.path.exists(dst_path):
            os.remove(dst_path)
        
        # 重命名
        os.rename(src_path, dst_path)
        print(f"[OK] {src_filename} -> {dst_filename} ({hero_name})")
        success += 1
    
    # 清理调试文件
    for f in os.listdir(HEROES_DIR):
        if f.startswith('_debug_') or f == '_ocr_results.json':
            os.remove(os.path.join(HEROES_DIR, f))
            print(f"[CLEAN] {f}")
    
    # 清理预览目录
    preview_dir = os.path.join(HEROES_DIR, '_preview')
    if os.path.exists(preview_dir):
        import shutil
        shutil.rmtree(preview_dir)
        print(f"[CLEAN] _preview/ directory")
    
    print(f"\n[DONE] 成功替换 {success} 个头像!")


if __name__ == '__main__':
    main()
