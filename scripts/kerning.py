#!/usr/bin/env python3
"""Таблица кернинга для «перелистывания» ссылок.

При наведении слово ссылки разбирается на отдельные буквы (каждая едет сама), а браузер
кернит только соседние знаки одной строки. Чтобы набор не «рассыпался», компонент Flip
возвращает буквам их кернинг из шрифта. Эта таблица — пары знаков и поправка в тысячных кегля.

Нужен только при смене гарнитуры. Требует: pip install fonttools brotli
Запуск: python3 scripts/kerning.py
Результат — src/data/kerning.gen.ts — закоммичен; на CI скрипт не запускается.
"""
import json
import os

from fontTools.ttLib import TTFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# ключ в таблице: файл шрифта
FONTS = {
    'display': 'noto-serif-display-300.woff2',
    'text': 'jost-300-500.woff2',
}

# Буквы и знаки, которые встречаются в ссылках. Цифры не кернятся (в телефоне они табличные).
CHARS = (
    [chr(c) for c in range(ord('A'), ord('Z') + 1)]
    + [chr(c) for c in range(ord('a'), ord('z') + 1)]
    + [chr(c) for c in range(0x410, 0x450)]
    + ['Ё', 'ё', ' ', ' ', '-', '—', '–', '.', ',', '«', '»', '+']
)


def pair_value(lookup, first: str, second: str) -> int:
    """Поправка к ширине первого знака пары. Работает первая подходящая подтаблица."""
    for sub in lookup.SubTable:
        if sub.LookupType == 9:
            sub = sub.ExtSubTable
        coverage = sub.Coverage.glyphs
        if first not in coverage:
            continue
        if sub.Format == 1:
            for record in sub.PairSet[coverage.index(first)].PairValueRecord:
                if record.SecondGlyph == second:
                    return (record.Value1.XAdvance if record.Value1 else 0) or 0
            continue
        row = sub.Class1Record[sub.ClassDef1.classDefs.get(first, 0)]
        record = row.Class2Record[sub.ClassDef2.classDefs.get(second, 0)]
        return (record.Value1.XAdvance if record.Value1 else 0) or 0
    return 0


def table(path: str) -> dict:
    font = TTFont(path)
    units = font['head'].unitsPerEm
    cmap = font.getBestCmap()
    gpos = font['GPOS'].table
    indices = sorted(
        {i for rec in gpos.FeatureList.FeatureRecord if rec.FeatureTag == 'kern' for i in rec.Feature.LookupListIndex}
    )
    lookups = [gpos.LookupList.Lookup[i] for i in indices if gpos.LookupList.Lookup[i].LookupType in (2, 9)]
    glyphs = {ch: cmap[ord(ch)] for ch in CHARS if ord(ch) in cmap}
    pairs = {}
    for a, ga in glyphs.items():
        for b, gb in glyphs.items():
            value = sum(pair_value(lookup, ga, gb) for lookup in lookups)
            if value:
                pairs[a + b] = round(value * 1000 / units)
    return pairs


def main() -> None:
    data = {name: table(os.path.join(ROOT, 'src', 'fonts', file)) for name, file in FONTS.items()}
    lines = [
        '// Сгенерировано scripts/kerning.py по файлам из src/fonts — не править руками.',
        '// Кернинг пар знаков в тысячных кегля: display — Noto Serif Display Light, text — Jost.',
        '// Нужен компоненту Flip (src/components/ui/Flip.tsx); в браузер таблица не попадает.',
        '',
        "export const kerning: Record<'display' | 'text', Record<string, number>> = {",
    ]
    for name, pairs in data.items():
        body = json.dumps(pairs, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
        lines.append(f'  {name}: {body},')
        print(f'{name}: {len(pairs)} пар')
    lines.append('}')
    out = os.path.join(ROOT, 'src', 'data', 'kerning.gen.ts')
    with open(out, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(lines) + '\n')
    print('записано', os.path.relpath(out, ROOT))


if __name__ == '__main__':
    main()
