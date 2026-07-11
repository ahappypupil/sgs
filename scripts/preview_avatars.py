# -*- coding: utf-8 -*-
"""
预览头像图片底部区域，帮助确认文字内容
裁剪每张图片的底部名字区域并保存为缩略图用于检查
"""

import os
from PIL import Image

HEROES_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', 'heroes')
PREVIEW_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', '_preview')

os.makedirs(PREVIEW_DIR, exist_ok=True)

files = sorted([f for f in os.listdir(HEROES_DIR) 
                if f.startswith('三国人物宫格头像') and f.endswith('.png')],
               key=lambda x: int(__import__('re').search(r'\((\d+)\)', x).group(1)))

print(f"共 {len(files)} 张图片\n")

for filename in files:
    filepath = os.path.join(HEROES_DIR, filename)
    img = Image.open(filepath)
    
    # 裁剪底部区域 (名字通常在底部 25% 区域)
    w, h = img.size
    bottom_region = img.crop((0, int(h * 0.75), w, h))
    
    # 缩小到便于查看
    bottom_small = bottom_region.resize((w // 4, h // 4), Image.LANCZOS)
    
    # 保存预览
    preview_path = os.path.join(PREVIEW_DIR, f"preview_{filename}")
    bottom_small.save(preview_path)
    
    print(f"{filename} -> preview saved ({img.size})")

print(f"\n预览图保存在: {PREVIEW_DIR}")
