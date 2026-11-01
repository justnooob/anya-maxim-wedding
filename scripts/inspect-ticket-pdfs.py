"""Local visual QA only. Requires pymupdf, pypdf and opencv-python-headless.
Never reads a database or guest cookie; inputs are synthetic example PDFs.
"""
from pathlib import Path
import json
import pymupdf
import cv2
import numpy as np
from pypdf import PdfReader

root = Path('qa/pdf-examples')
results = []
for name in ['one-guest', 'two-guests', 'three-guests', 'four-guests', 'five-guests', 'long-answers']:
    source = root / f'wedding-ticket-{name}.pdf'
    directory = root / name
    directory.mkdir(exist_ok=True)
    for old in directory.glob('page-*.png'):
        old.unlink()
    pdf = pymupdf.open(source)
    reader = PdfReader(source)
    qr_values = []
    body_font_sizes = []
    for number, page in enumerate(pdf, 1):
        blocks = [b for b in page.get_text('blocks') if str(b[4]).strip()]
        assert len(page.get_text().strip()) > 250 or (number == 1 and max(b[3] for b in blocks) > 350), 'Orphan or empty page'
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1.7, 1.7), alpha=False)
        pix.save(directory / f'page-{number}.png')
        image = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)
        value, _, _ = cv2.QRCodeDetector().detectAndDecode(image)
        if value:
            qr_values.append(value)
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                for span in line['spans']:
                    if span['text'].strip():
                        x0, y0, x1, y1 = span['bbox']
                        if 60 <= y0 <= 780:
                            body_font_sizes.append(span['size'])
                        assert span['size'] >= 13.95 or y0 < 60 or y0 > 780, ('Small body text', source.name, span['text'], span['size'])
                        assert x0 >= 24 and x1 <= 574 and y0 >= 24 and y1 <= 816, (source.name, span['text'])
    columns = 3 if len(pdf) > 5 else 2
    tile_w, tile_h = 420, 610
    sheet = np.full((((len(pdf)+columns-1)//columns)*tile_h, columns*tile_w, 3), 232, np.uint8)
    for index in range(len(pdf)):
        picture = cv2.imread(str(directory / f'page-{index+1}.png'))
        picture = cv2.resize(picture, (410, 580), interpolation=cv2.INTER_AREA)
        x, y = (index % columns)*tile_w+5, (index // columns)*tile_h+5
        sheet[y:y+580, x:x+410] = picture
        cv2.putText(sheet, f'{name}: {index+1}/{len(pdf)}', (x,y+598), cv2.FONT_HERSHEY_SIMPLEX,.4,(50,60,45),1,cv2.LINE_AA)
    cv2.imwrite(str(directory / 'contact-sheet.png'), sheet)
    links = [str(a.get_object().get('/A', {}).get('/URI', '')) for page in reader.pages for a in page.get('/Annots', [])]
    assert 'https://anyaxmaxim.ru' in qr_values
    for url in ['https://t.me/Selesssta', 'https://t.me/sfokin1337', 'https://anyaxmaxim.ru', 'https://anyaxmaxim.ru/#dress-code']:
        assert url in links
    text = '\n'.join(page.extract_text() for page in reader.pages)
    assert 'С любовью' not in text
    assert 'Пушкинская Усадьба' in text and 'Фёдоровское' in text
    results.append({'file':source.name, 'pages':len(pdf), 'qr':qr_values, 'links':len(links), 'bounds':'ok', 'minimum_body_font_pt':round(min(body_font_sizes), 2)})
(root / 'pdf-inspection.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(results, ensure_ascii=True))
