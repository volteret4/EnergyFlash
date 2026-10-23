#!/usr/bin/env python3
"""Texto por capítulos de Energy Flash. Un viaje a través de la música rave y la cultura de baile (Simon Reynolds; Contra, 2020).

Uso: python3 -I tools/split.py <dir_xhtml> <dir_salida>

Lee directamente los XHTML del ePub. Capítulo 1: nota del autor, prefacio a la edición actualizada,
introducción y prólogo («Todo empieza por M»); 2-26: los capítulos 1-25 del libro. Las cabeceras salen
como «## …»; las llamadas a nota (a.noteref) se descartan. Escribe <dir>/NN.txt y <dir>/book.json (párrafos
{ch, sec, segs: [[pág, texto]]}, el formato de tools/refs.py). El ePub no trae paginación impresa: la
página se estima a 300 palabras por página desde la nota del autor.
"""
import html
import json
import re
import sys
from pathlib import Path

WORDS_PER_PAGE = 300
FILES = {1: ['nota', 'prefacio', 'introduccion', 'prologo']} | {n + 1: [f'c{n:02d}'] for n in range(1, 26)}
BLOCK = re.compile(r'<(p|h[1-6])\b([^>]*)>(.*?)</\1>', re.S)


def clean(s):
    s = re.sub(r'<a class="noteref".*?</a>|<sup[^>]*>.*?</sup>', '', s, flags=re.S)
    s = html.unescape(re.sub(r'<[^>]+>', '', s)).replace('⁠', '')
    return re.sub(r'\s+', ' ', s).strip()


def main(src, out):
    src, out = Path(src), Path(out)
    out.mkdir(parents=True, exist_ok=True)
    paras, words = [], 0
    for ch, names in FILES.items():
        sec, text = None, []
        for name in names:
            doc = (src / f'{name}.xhtml').read_text()
            for m in BLOCK.finditer(doc[doc.index('<body'):]):
                tag, attrs, inner = m.groups()
                line = clean(inner)
                if not line:
                    continue
                if tag != 'p' or 'subtitle' in attrs:
                    sec = line
                    text.append(f'## {line}')
                    continue
                page = words // WORDS_PER_PAGE + 1
                paras.append({'ch': ch, 'sec': sec, 'segs': [[page, line]]})
                text.append(f'[pág. ≈{page}] {line}')
                words += len(line.split())
        (out / f'{ch:02d}.txt').write_text('\n\n'.join(text) + '\n')
        print(f'cap. {ch}: {sum(len(p["segs"][0][1].split()) for p in paras if p["ch"] == ch)} palabras')
    (out / 'book.json').write_text(json.dumps(paras, ensure_ascii=False))


if __name__ == '__main__':
    main(*sys.argv[1:])
