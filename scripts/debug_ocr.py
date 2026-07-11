# -*- coding: utf-8 -*-
"""
对未匹配的8张图片做更精细的OCR，尝试不同区域和参数
"""

import os
import ddddocr
from PIL import Image, ImageEnhance, ImageFilter

HEROES_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', 'heroes')

# 未匹配的文件
UNMATCHED = [
    '三国人物宫格头像 (10).png',
    '三国人物宫格头像 (11).png',
    '三国人物宫格头像 (12).png',
    '三国人物宫格头像 (13).png',
    '三国人物宫格头像 (15).png',
    '三国人物宫格头像 (17).png',
    '三国人物宫格头像 (25).png',
    '三国人物宫格头像 (27).png',
]

# 已使用的ID
USED = {'liubei','guanyu','zhangfei','zhaoyun','zhugeliang','machao',
        'huangzhong','weiyan','caocao','zhangliao','sunquan','lvmeng',
        'huanggai','ganning','daqiao','luxun','lvbu','diaochan','yanliangwenchou'}

# 剩余未分配的hero id
REMAINING = ['simayi','xiahoudun','xuachu','guojia','xunyu','zhouyu','huatuo','jiaxu']


def main():
    ocr = ddddocr.DdddOcr(show_ad=False)
    
    for filename in UNMATCHED:
        filepath = os.path.join(HEROES_DIR, filename)
        img = Image.open(filepath)
        w, h = img.size
        
        print(f"\n{'='*50}")
        print(f"[{filename}]")
        
        # 尝试多个区域
        regions = {
            'bottom20%': img.crop((0, int(h*0.80), w, h)),
            'bottom25%': img.crop((0, int(h*0.75), w, h)),
            'bottom30%': img.crop((0, int(h*0.70), w, h)),
            'center_bottom': img.crop((int(w*0.2), int(h*0.72), int(w*0.8), int(h*0.95))),
        }
        
        for region_name, region_img in regions.items():
            # 增强对比度
            enhancer = ImageEnhance.Contrast(region_img)
            enhanced = enhancer.enhance(2.0)
            
            # 转灰度
            gray = enhanced.convert('L')
            
            text = ocr.classification(gray)
            print(f"  {region_name}: {repr(text)}")


if __name__ == '__main__':
    main()
