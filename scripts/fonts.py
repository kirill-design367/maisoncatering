#!/usr/bin/env python3
"""Подготовка шрифтов: из полных TTF делает лёгкие woff2 с латиницей и кириллицей.

Нужен только при смене гарнитуры. Требует: pip install fonttools brotli
Запуск: python3 scripts/fonts.py <папка с исходными TTF>

Исходники (SIL Open Font License) — репозиторий google/fonts, папка ofl/<семейство>.
Результат лежит в src/fonts и закоммичен; на CI скрипт не запускается.
"""
import io
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'fonts')

# Латиница, цифры, знаки, русская кириллица (А–я, Ё, ё), кавычки-ёлочки, тире, №, ₽.
UNICODES = (
    list(range(0x20, 0x7F))
    + [0xA0, 0xAB, 0xBB, 0xB7, 0xD7, 0x401, 0x451]
    + list(range(0x410, 0x450))
    + list(range(0x2010, 0x2016))
    + [0x2018, 0x2019, 0x201C, 0x201D, 0x201E, 0x2026, 0x202F, 0x2009, 0x2116, 0x20BD, 0x2212]
)
FEATURES = ['kern', 'liga', 'locl', 'lnum', 'tnum', 'pnum', 'case', 'ccmp', 'cpsp', 'mark', 'mkmk']

# имя файла на выходе: (исходный TTF, оси для фиксации / ограничения)
FONTS = {
    # ── Пара A (стоит на сайте) ──
    'noto-serif-display-300.woff2': ('NotoSerifDisplay[wdth,wght].ttf', {'wght': 300, 'wdth': 100}),
    'noto-serif-display-200.woff2': ('NotoSerifDisplay[wdth,wght].ttf', {'wght': 200, 'wdth': 100}),
    'jost-300-500.woff2': ('Jost[wght].ttf', {'wght': (300, 500)}),
    # ── Пара B (страница /fonts) ──
    'playfair-300-opsz.woff2': ('Playfair[opsz,wdth,wght].ttf', {'wght': 300, 'wdth': 100, 'opsz': (5, 1200)}),
    'manrope-300-500.woff2': ('Manrope[wght].ttf', {'wght': (300, 500)}),
    # ── Пара C (страница /fonts) ──
    'literata-200-opsz72.woff2': ('Literata[opsz,wght].ttf', {'wght': 200, 'opsz': 72}),
}


def build(src_dir: str) -> None:
    os.makedirs(OUT, exist_ok=True)
    for out_name, (src_name, axes) in FONTS.items():
        src = os.path.join(src_dir, src_name)
        if not os.path.exists(src):
            print(f'пропуск: нет {src_name}')
            continue
        font = TTFont(src)
        if 'fvar' in font:
            # После фиксации осей шрифт сохраняется и читается заново: иначе subsetter
            # спотыкается о лениво загруженную таблицу gvar.
            buffer = io.BytesIO()
            instancer.instantiateVariableFont(font, axes).save(buffer)
            buffer.seek(0)
            font = TTFont(buffer)
        options = subset.Options()
        options.flavor = 'woff2'
        options.layout_features = FEATURES
        options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
        options.notdef_outline = True
        options.desubroutinize = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=UNICODES)
        subsetter.subset(font)
        missing = [f'U+{u:04X}' for u in UNICODES if u not in font.getBestCmap() and u not in (0x202F, 0x2009, 0x2010, 0x2011, 0x2012, 0x2015, 0xB7)]
        dst = os.path.join(OUT, out_name)
        font.flavor = 'woff2'
        font.save(dst)
        print(f'{out_name}: {os.path.getsize(dst) / 1024:.1f} КБ' + (f'  нет в шрифте: {", ".join(missing)}' if missing else ''))


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else '.')
