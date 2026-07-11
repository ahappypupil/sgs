# -*- coding: utf-8 -*-
"""
切割三国杀武将头像图片
图片为 3行 x 7列 = 21个武将
"""

import os
import base64
from PIL import Image
from io import BytesIO

# ===== 配置 =====
# 图片路径 - 用户提供的图片
SOURCE_IMAGE = r'C:\Users\34511\Downloads\三国人物宫格头像.png'
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', 'heroes')

# 网格配置: 3行 x 7列
ROWS = 3
COLS = 7

# 图片中武将的名字排列顺序 (从左到右, 从上到下)
# 第1行: 刘备 关羽 张飞 诸葛亮 马超 黄忠 曹操
# 第2行: 司马懿 夏侯惇 许褚 郭嘉 荀彧(图中标郭嘉位置) 张辽 周瑜  
# 第3行: 黄盖 甘宁 陆逊 吕布 华佗 颜良文丑 贾诩
HERO_NAMES_GRID = [
    ['liubei',    'guanyu',   'zhangfei', 'zhugeliang', 'machao',    'huangzhong', 'caocao'],
    ['simayi',    'xiahoudun','xuachu',   'guojia',     'xunyu',     'zhangliao',  'zhouyu'],
    ['huanggai',  'ganning',  'luxun',    'lvbu',       'huatuo',    'yanliangwenchou', 'jiaxu'],
]

def crop_and_save():
    """切割图片并保存为单独的头像文件"""
    
    # 确保输出目录存在
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 打开源图片
    if not os.path.exists(SOURCE_IMAGE):
        print(f"[ERROR] 源图片不存在: {SOURCE_IMAGE}")
        print("请将武将头像图片命名为 source_avatars.png 放在项目根目录")
        return False
    
    img = Image.open(SOURCE_IMAGE)
    width, height = img.size
    
    print(f"[INFO] 源图片尺寸: {width} x {height}")
    print(f"[INFO] 网格: {ROWS} 行 x {COLS} 列")
    
    # 计算每个格子的大小
    cell_width = width // COLS
    cell_height = height // ROWS
    
    print(f"[INFO] 单个头像尺寸: {cell_width} x {cell_height}")
    
    success_count = 0
    
    for row in range(ROWS):
        for col in range(COLS):
            # 计算裁剪区域 (left, upper, right, lower)
            left = col * cell_width
            upper = row * cell_height
            right = left + cell_width
            lower = upper + cell_height
            
            # 裁剪
            avatar_img = img.crop((left, upper, right, lower))
            
            # 获取对应的武将ID
            hero_id = HERO_NAMES_GRID[row][col]
            
            # 保存为 PNG (保留原始质量)
            output_path = os.path.join(OUTPUT_DIR, f"{hero_id}.png")
            avatar_img.save(output_path, 'PNG')
            
            print(f"[OK] {hero_id}.png ({cell_width}x{cell_height})")
            success_count += 1
    
    print(f"\n[SUCCESS] 共生成 {success_count} 个头像，保存至: {OUTPUT_DIR}")
    return True


if __name__ == '__main__':
    crop_and_save()
