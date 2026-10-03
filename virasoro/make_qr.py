"""Uso: python3 make_qr.py https://tu-dominio/carpeta"""
import sys, os, qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw, ImageFont, ImageOps
base = sys.argv[1].rstrip('/')
SITE = os.path.dirname(os.path.abspath(__file__)) if os.path.isdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'img')) else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')
OUT = os.path.join(SITE, 'qr'); os.makedirs(OUT, exist_ok=True)
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
items = [
 ('plano', 'PLANO Y EXTINTORES', 'Recorrido virtual 360° del predio', 'plano_hero.jpg', (14, 110, 60)),
 ('contingencias', 'PLAN DE CONTINGENCIAS', 'Emergencia 360° + simulador de extintor', 'contingencias_hero.jpg', (192, 57, 43)),
 ('trabajar-seguro', 'TRABAJAR SEGURO', 'Cazá los riesgos 360° + juego de EPP', 'seguro_hero.jpg', (211, 84, 0)),
 ('', 'SEGURIDAD E HIGIENE', 'Las 3 experiencias interactivas', 'plano_hero.jpg', (31, 58, 147)),
]
W, Hh = 1200, 1800
for slug, title, sub, img, col in items:
    url = f'{base}/{slug}/' if slug else f'{base}/'
    q = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=20, border=2); q.add_data(url); q.make(fit=True)
    qi = q.make_image(fill_color=(15, 20, 25), back_color='white').convert('RGB').resize((820, 820), Image.NEAREST)
    # center badge
    b = 190; d = ImageDraw.Draw(qi); c = 410
    d.rounded_rectangle([c-b//2, c-b//2, c+b//2, c+b//2], 30, fill='white')
    d.rounded_rectangle([c-b//2+14, c-b//2+14, c+b//2-14, c+b//2-14], 22, fill=col)
    d.text((c, c), '360°', font=ImageFont.truetype(F, 52), fill='white', anchor='mm')
    name = slug or 'indice'
    qi.save(f'{OUT}/qr_{name}.png')
    card = Image.new('RGB', (W, Hh), 'white')
    hero = ImageOps.fit(Image.open(f'{SITE}/img/{img}').convert('RGB'), (W, 620))
    card.paste(hero, (0, 0)); dc = ImageDraw.Draw(card)
    ov = Image.new('RGBA', (W, 620), (0, 0, 0, 0)); do = ImageDraw.Draw(ov)
    for y in range(260, 620): do.line([(0, y), (W, y)], fill=col + (int(235 * (y - 260) / 360),))
    card.paste(ov, (0, 0), ov)
    dc.text((60, 470), title, font=ImageFont.truetype(F, 64), fill='white')
    dc.text((60, 555), sub, font=ImageFont.truetype(FR, 36), fill='white')
    dc.rectangle([0, 620, W, 640], fill=col)
    card.paste(qi, ((W - 820) // 2, 690))
    dc.text((W // 2, 1560), 'ESCANEÁ CON LA CÁMARA DEL CELULAR', font=ImageFont.truetype(F, 42), fill=col, anchor='mm')
    dc.text((W // 2, 1625), url, font=ImageFont.truetype(FR, 28), fill=(90, 90, 90), anchor='mm')
    dc.text((W // 2, 1720), 'Corralón Municipal · Gobernador Virasoro', font=ImageFont.truetype(FR, 30), fill=(60, 60, 60), anchor='mm')
    card.save(f'{OUT}/cartel_{name}.png'); print(name, url)
# A4 PDF with the 4 posters
imgs = [Image.open(f'{OUT}/cartel_{n}.png') for n in ['plano', 'contingencias', 'trabajar-seguro', 'indice']]
imgs[0].save(f'{OUT}/carteles_QR.pdf', save_all=True, append_images=imgs[1:], resolution=150)
