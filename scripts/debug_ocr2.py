# -*- coding: utf-8 -*-
"""
对未匹配的8张图片做精细OCR，结果写入文件避免编码问题
"""

import os
import json
import ddddocr
from PIL import Image, ImageEnhance

HEROES_DIR = os.path.join(os.path.dirname(__file__), '..', 'img', 'heroes')

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

REMAINING_IDS = ['simayi','xiahoudun','xuachu','guojia','xunyu','zhouyu','huatuo','jiaxu']
REMAINING_NAMES = ['司马懿','夏侯惇','许褚','郭嘉','荀彧','周瑜','华佗','贾诩']


def main():
    ocr = ddddocr.DdddOcr(show_ad=False)
    results = []
    
    for filename in UNMATCHED:
        filepath = os.path.join(HEROES_DIR, filename)
        img = Image.open(filepath)
        w, h = img.size
        
        # 裁剪底部名字区域
        region = img.crop((0, int(h*0.78), w, h))
        enhancer = ImageEnhance.Contrast(region)
        enhanced = enhancer.enhance(2.0)
        gray = enhanced.convert('L')
        
        text = ocr.classification(gray)
        results.append({'file': filename, 'ocr': text})
        
        # 写入每张图片的底部裁剪作为参考
        preview_path = os.path.join(HEROES_DIR, f'_debug_{filename}')
        small = gray.resize((w//6, int(h*0.22)//6), Image.LANCZOS)
        small.save(preview_path)
    
    # 输出JSON到文件
    output_file = os.path.join(HEROES_DIR, '_ocr_results.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"Done! Results saved to {output_file}")
    print(f"Remaining heroes: {REMAINING_NAMES}")
    for r in results:
        print(f"  {r['file']}: {r['ocr']}")


if __name__ == '__main__':
    main()
