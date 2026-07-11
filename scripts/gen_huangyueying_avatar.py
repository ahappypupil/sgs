# -*- coding: utf-8 -*-
"""
生成黄月英默认头像 - 水墨古风风格
"""

import os
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', 'heroes')
AVATAR_SIZE = (420, 437)

def create_avatar():
    """创建黄月英的默认头像"""
    
    # 创建画布 - 深色背景（匹配其他头像风格）
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
    
    # 圆形边框 - 蜀国绿色
    draw.ellipse(
        [center_x - avatar_radius, center_y - avatar_radius,
         center_x + avatar_radius, center_y + avatar_radius],
        outline='#22aa22',
        width=4
    )
    
    # ===== 女性人物剪影（黄月英特征）=====
    silhouette_color = (30, 28, 40)
    
    # 头部轮廓（女性特征，稍微柔和）
    head_cx, head_cy = center_x, center_y - 20
    draw.ellipse([head_cx-42, head_cy-52, head_cx+42, head_cy+32], fill=silhouette_color)
    
    # 发髻装饰（女性发饰）
    hair_color = (45, 40, 55)
    # 顶部发髻
    draw.ellipse([head_cx-25, head_cy-75, head_cx+25, head_cy-35], fill=hair_color)
    # 两侧发髻
    draw.ellipse([head_cx-50, head_cy-55, head_cx-30, head_cy-25], fill=hair_color)
    draw.ellipse([head_cx+30, head_cy-55, head_cx+50, head_cy-25], fill=hair_color)
    
    # 发簪装饰
    draw.line([(head_cx-5, head_cy-70), (head_cx-5, head_cy-85)], fill='#c9a227', width=2)
    draw.ellipse([head_cx-8, head_cy-88, head_cx-2, head_cy-82], fill='#cc4444')
    
    # 身体/肩膀轮廓（女性服饰）
    body_points = [
        (center_x - 75, AVATAR_SIZE[1] - 80),
        (center_x - 45, center_y + 50),
        (center_x + 45, center_y + 50),
        (center_x + 75, AVATAR_SIZE[1] - 80),
    ]
    draw.polygon(body_points, fill=silhouette_color)
    
    # 服饰装饰线（女性衣裙）
    dress_color = (70, 65, 80)
    # 衣领
    draw.line([(center_x - 40, center_y + 55), (center_x, center_y + 85), (center_x + 40, center_y + 55)], 
              fill=dress_color, width=3)
    # 腰带
    draw.line([(center_x - 50, center_y + 90), (center_x + 50, center_y + 90)], 
              fill=dress_color, width=2)
    # 裙摆线条
    for i in range(-2, 3):
        x_offset = i * 20
        draw.line([(center_x + x_offset, center_y + 95), (center_x + x_offset, AVATAR_SIZE[1] - 85)], 
                  fill=dress_color, width=1)
    
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
    except:
        try:
            font_large = ImageFont.truetype("simhei.ttf", 32)
        except:
            font_large = ImageFont.load_default()
    
    name = "黄月英"
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
    
    # ===== 右上角势力标识 =====
    badge_x, badge_y = AVATAR_SIZE[0] - 45, 25
    draw.ellipse([badge_x-18, badge_y-18, badge_x+18, badge_y+18], fill='#22aa22')  # 蜀 - 绿色
    draw.ellipse([badge_x-18, badge_y-18, badge_x+18, badge_y+18], outline='#c9a227', width=2)
    
    try:
        badge_font = ImageFont.truetype("msyh.ttc", 18)
    except:
        try:
            badge_font = ImageFont.truetype("simhei.ttf", 18)
        except:
            badge_font = ImageFont.load_default()
    
    badge_bbox = draw.textbbox((0, 0), "蜀", font=badge_font)
    badge_tw = badge_bbox[2] - badge_bbox[0]
    badge_th = badge_bbox[3] - badge_bbox[1]
    draw.text((badge_x - badge_tw//2, badge_y - badge_th//2 - 2), "蜀", 
              font=badge_font, fill='#ffffff')
    
    return img


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    img = create_avatar()
    output_path = os.path.join(OUTPUT_DIR, "huangyueying.png")
    img.save(output_path, 'PNG')
    print(f"[OK] Generated huangyueying.png (黄月英)")
    print(f"[INFO] 头像尺寸: {AVATAR_SIZE}")
    print(f"[INFO] 保存路径: {output_path}")


if __name__ == '__main__':
    main()
