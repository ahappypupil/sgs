# -*- coding: utf-8 -*-
"""
为缺失的6个武将生成占位头像
风格匹配已切割的水墨古风头像
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', 'heroes')
AVATAR_SIZE = (420, 437)

# 缺失的武将: id, name, 势力色
MISSING_HEROES = [
    ('sunquan',   '孙权',   '#cc4444'),  # 吴 - 红
    ('lvmeng',    '吕蒙',   '#cc4444'),  # 吴 - 红
    ('daqiao',    '大乔',   '#cc4444'),  # 吴 - 红
    ('zhaoyun',   '赵云',   '#22aa22'),  # 蜀 - 绿
    ('weiyan',    '魏延',   '#22aa22'),  # 蜀 - 绿
    ('diaochan',  '貂蝉',   '#888888'),  # 群 - 灰
]

def create_avatar(hero_id, name, faction_color):
    """创建一个水墨风格的占位头像"""
    
    # 创建画布 - 深色背景（匹配原图风格）
    img = Image.new('RGB', AVATAR_SIZE, '#1a1a2e')
    draw = ImageDraw.Draw(img)
    
    # ===== 背景渐变效果 =====
    for y in range(AVATAR_SIZE[1]):
        ratio = y / AVATAR_SIZE[1]
        r = int(26 + ratio * 15)
        g = int(26 + ratio * 10)
        b = int(46 + ratio * 20)
        draw.line([(0, y), (AVATAR_SIZE[0], y)], fill=(r, g, b))
    
    # ===== 装饰边框 - 金色 =====
    border_width = 8
    inner_margin = 12
    
    # 外边框
    draw.rectangle(
        [0, 0, AVATAR_SIZE[0]-1, AVATAR_SIZE[1]-1],
        outline='#c9a227',
        width=border_width
    )
    
    # 内边框
    draw.rectangle(
        [inner_margin, inner_margin, 
         AVATAR_SIZE[0]-inner_margin-1, AVATAR_SIZE[1]-inner_margin-1],
        outline='#8b7355',
        width=2
    )
    
    # ===== 云纹装饰背景 =====
    cloud_color = (60, 55, 70)
    # 左上角云纹
    for i in range(3):
        cx, cy = 40 + i*30, 50 + i*20
        r = 25 + i*8
        draw.ellipse([cx-r, cy-r*0.6, cx+r, cy+r*0.6], fill=cloud_color)
    # 右下角云纹
    for i in range(3):
        cx, cy = AVATAR_SIZE[0] - 50 - i*25, AVATAR_SIZE[1] - 60 - i*18
        r = 20 + i*7
        draw.ellipse([cx-r, cy-r*0.6, cx+r, cy+r*0.6], fill=cloud_color)
    
    # ===== 中央圆形区域（人物区域）=====
    center_x = AVATAR_SIZE[0] // 2
    center_y = AVATAR_SIZE[1] // 2 - 20
    avatar_radius = 120
    
    # 圆形背景 - 渐变
    for r in range(avatar_radius, 0, -1):
        ratio = r / avatar_radius
        base_r = int(40 + (1-ratio) * 30)
        base_g = int(35 + (1-ratio) * 25)
        base_b = int(50 + (1-ratio) * 35)
        draw.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=(base_r, base_g, base_b)
        )
    
    # 圆形边框 - 势力色
    draw.ellipse(
        [center_x - avatar_radius, center_y - avatar_radius,
         center_x + avatar_radius, center_y + avatar_radius],
        outline=faction_color,
        width=4
    )
    
    # ===== 人物剪影 =====
    silhouette_color = (30, 28, 40)
    
    # 头部轮廓
    head_cx, head_cy = center_x, center_y - 20
    draw.ellipse([head_cx-45, head_cy-55, head_cx+45, head_cy+35], fill=silhouette_color)
    
    # 身体/肩膀轮廓
    body_points = [
        (center_x - 80, AVATAR_SIZE[1] - 80),
        (center_x - 50, center_y + 50),
        (center_x + 50, center_y + 50),
        (center_x + 80, AVATAR_SIZE[1] - 80),
    ]
    draw.polygon(body_points, fill=silhouette_color)
    
    # 盔甲装饰线
    armor_color = (70, 65, 80)
    draw.line([(center_x - 60, center_y + 60), (center_x, center_y + 90), (center_x + 60, center_y + 60)], 
              fill=armor_color, width=3)
    draw.line([(center_x - 40, center_y + 95), (center_x, center_y + 120), (center_x + 40, center_y + 95)], 
              fill=armor_color, width=2)
    
    # ===== 底部名字标签 =====
    label_y = AVATAR_SIZE[1] - 75
    label_height = 45
    label_margin = 30
    
    # 标签背景
    label_points = [
        (label_margin, label_y),
        (AVATAR_SIZE[0] - label_margin, label_y),
        (AVATAR_SIZE[0] - label_margin + 15, label_y + label_height),
        (label_margin - 15, label_y + label_height),
    ]
    draw.polygon(label_points, fill='#1a1510')
    
    # 标签边框 - 金色
    draw.polygon(label_points, outline='#c9a227', width=2)
    
    # 武将名字
    try:
        font_large = ImageFont.truetype("msyh.ttc", 32)
        font_small = ImageFont.truetype("msyh.ttc", 14)
    except:
        try:
            font_large = ImageFont.truetype("simhei.ttf", 32)
            font_small = ImageFont.truetype("simhei.ttf", 14)
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
    
    # 名字文字居中
    bbox = draw.textbbox((0, 0), name, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_x = (AVATAR_SIZE[0] - text_width) // 2
    text_y = label_y + 5
    
    # 文字描边效果
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            if dx != 0 or dy != 0:
                draw.text((text_x + dx, text_y + dy), name, font=font_large, fill='#000000')
    
    # 主文字
    draw.text((text_x, text_y), name, font=font_large, fill='#f0e6d2')
    
    # "待补充"标记
    small_text = "[待补充]"
    small_bbox = draw.textbbox((0, 0), small_text, font=font_small)
    small_width = small_bbox[2] - small_bbox[0]
    small_x = (AVATAR_SIZE[0] - small_width) // 2
    draw.text((small_x, label_y + 36), small_text, font=font_small, fill='#888888')
    
    # ===== 右上角势力标识 =====
    faction_names = {
        '#cc4444': '吴',
        '#22aa22': '蜀',
        '#888888': '群',
        '#2266cc': '魏',
    }
    faction_char = faction_names.get(faction_color, '?')
    
    # 势力小圆标
    badge_x, badge_y = AVATAR_SIZE[0] - 45, 25
    draw.ellipse([badge_x-18, badge_y-18, badge_x+18, badge_y+18], fill=faction_color)
    draw.ellipse([badge_x-18, badge_y-18, badge_x+18, badge_y+18], outline='#c9a227', width=2)
    
    try:
        badge_font = ImageFont.truetype("msyh.ttc", 18)
    except:
        try:
            badge_font = ImageFont.truetype("simhei.ttf", 18)
        except:
            badge_font = ImageFont.load_default()
    
    badge_bbox = draw.textbbox((0, 0), faction_char, font=badge_font)
    badge_tw = badge_bbox[2] - badge_bbox[0]
    badge_th = badge_bbox[3] - badge_bbox[1]
    draw.text((badge_x - badge_tw//2, badge_y - badge_th//2 - 2), faction_char, 
              font=badge_font, fill='#ffffff')
    
    return img


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for hero_id, name, color in MISSING_HEROES:
        img = create_avatar(hero_id, name, color)
        output_path = os.path.join(OUTPUT_DIR, f"{hero_id}.png")
        img.save(output_path, 'PNG')
        print(f"[OK] Generated {hero_id}.png ({name})")
    
    print(f"\n[DONE] Generated {len(MISSING_HEROES)} missing avatars")


if __name__ == '__main__':
    main()
