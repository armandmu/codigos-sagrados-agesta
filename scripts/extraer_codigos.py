#!/usr/bin/env python3
"""Convierte el PDF aportado en un catálogo navegable conservando el texto original.
No requiere conexión a Internet. Se preservan códigos como texto (incluye ceros iniciales).
"""
import re, json, os, sys, unicodedata, collections
from pathlib import Path
import fitz

SOURCE=Path(sys.argv[1]) if len(sys.argv)>1 else Path('CodigosSagradosAgesta_2018_05_31_DianaCeronOtoya.pdf')
DEST=Path(sys.argv[2]) if len(sys.argv)>2 else Path('data')
DEST.mkdir(parents=True, exist_ok=True)
DOC=fitz.open(SOURCE)
pattern_header=re.compile(r'CÓDIGOS SAGRADOS NUMÉRICOS')
pattern_digits=re.compile(r'^(?:[0-9][0-9\. ]{0,20})(?:\s+o\s+\d+)?$')

def clean(t):
    t=t.replace('\u00ad','').replace('\xa0',' ')
    return re.sub(r'\s+', ' ', t).strip()

def is_code(t):
    return bool(pattern_digits.fullmatch(t.strip()) and re.search(r'\d',t))

def find_codes(leading):
    codes=[]
    for s in leading:
        s=s.strip()
        if is_code(s):
            # Preserve multi-code groups, order, and leading zeros
            codes.extend(re.findall(r'\d[\d.]*',s))
        elif s.lower().startswith('salmo ') or s.lower().startswith('o '):
            codes.append(s)
    return codes

entries=[];pages=[];warnings=[]
for pnum,page in enumerate(DOC,1):
    if pnum in (1,len(DOC)):
        continue
    blocks=[]
    for b in page.get_text('blocks'):
        x0,y0,x1,y1,txt,*_=b
        if pattern_header.search(txt):continue
        if 'Canalizados por José Gabriel Uribe:' in txt:continue
        if re.match(r'^\s*\d+\.\s*Cada cuenta del Collar',txt):continue
        # Exclude other footnotes tied to the collar sequences
        if re.match(r'^\s*\d+\.\s*Cada cuenta',txt):continue
        txt=txt.strip()
        if not txt:continue
        if y0>=732:continue
        if pnum == 2 and x0<22 and y0<45:continue
        blocks.append({'x':x0,'y':y0,'x1':x1,'y1':y1,'text':txt, 'lines':[clean(v) for v in txt.splitlines() if clean(v)]})

    # A standalone number block positioned immediately to the left of its description
    paired=set()
    for i,b in enumerate(blocks):
        if not b['lines'] or not all(is_code(t) or t.startswith('Salmo ') or t.startswith('o ') for t in b['lines']):continue
        candidates=[]
        for j,other in enumerate(blocks):
            if i==j or j in paired:continue
            if other['x']<b['x1']+3 or other['x']>b['x1']+90:continue
            d=abs(other['y']-b['y'])
            if d>20:continue
            if not other['lines'] or all(is_code(x) for x in other['lines']):continue
            candidates.append((d,j))
        if candidates:
            _,j=min(candidates)
            other=blocks[j]
            other['linked_codes']=find_codes(b['lines'])
            paired.add(i)
    for i,b in enumerate(blocks):
        if i in paired:continue
        lines=b['lines']
        if not lines:continue
        # If numeric codes precede the description in the same block
        leading=[]
        for line in lines:
            if is_code(line) and len(leading)<12:
                leading.append(line)
            else: break
        codes=b.get('linked_codes',[]) + find_codes(leading)
        body=clean(' '.join(lines[len(leading):]))
        # Notas cuyo código figura dentro del título o al final de la línea.
        if not codes:
            m=re.match(r'^Código Sagrado (\d[\d.]*)\s*:\s*(.+)$',body,re.I)
            if m: codes=[m.group(1)]
            else:
                m=re.match(r'^(\d+)\s+o\s+Salmo\s+(\d+)$',body,re.I)
                if m: codes=[m.group(1)]; body='Salmo '+m.group(2)+' (referencia alternativa en el PDF)'
                else:
                    m=re.match(r'^(.{5,70}?)\s+(\d{2,9})$',body)
                    if m and not re.search(r'\d',m.group(1)):codes=[m.group(2)];body=m.group(1)
        if pnum in (14,15) and len(codes)==4:
            body=re.sub(r'(?<=[A-Za-zÁÉÍÓÚáéíóú])([1-5])$', '', body)
        if not body and codes:
            warnings.append({'pagina':pnum,'motivo':'bloque solo numerico sin asociar','text':b['text'][:70]})
            continue
        if not body:continue
        # Some document section titles/no-code notes remain available as text entries
        # but never fabricate a code for them.
        if body.startswith('Cada cuenta del Collar debe incluír') or 'Cada cuenta del Collar debe incluír' in body:continue
        entry={'id':f'p{pnum}-{len([e for e in entries if e["pagina"]==pnum])+1}',
             'codigos':codes,'titulo':body.split(' (')[0].split(' (')[0][:180].strip(' :'),
             'descripcion':body,'pagina':pnum}
        # Page 16+ contains paragraphs, don't call them codes without actual number.
        entries.append(entry)
    # A searchable, cleaned transcription of each source page, including unnumbered notes
    ordered=sorted((b for i,b in enumerate(blocks) if i not in paired),key=lambda a:(a['x']>=320,a['y'],a['x']))
    fulltext='\n'.join([clean(b['text']) for b in ordered])
    pages.append({'pagina':pnum,'texto':fulltext})

out={'fuente':'Códigos Sagrados Numéricos, canalizados por José Gabriel Uribe (Agesta), compilados por Diana Cerón Otoya (PDF, 31/05/2018)',
     'paginas_pdf':len(DOC),'registros':entries}
(DEST/'codigos.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(DEST/'paginas.json').write_text(json.dumps(pages,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(DEST/'auditoria.json').write_text(json.dumps({'total_registros':len(entries),'con_codigo':sum(bool(e['codigos']) for e in entries),'sin_codigo':sum(not e['codigos'] for e in entries),'paginas':len(pages),'advertencias':warnings},ensure_ascii=False,indent=2),encoding='utf-8')
print('total registros',len(entries),'con codigo',sum(bool(e['codigos']) for e in entries),'sin codigo',sum(not e['codigos'] for e in entries),'tamaño catálogo',round((DEST/'codigos.json').stat().st_size/1024),'kB')
print('Top sin número:');print('\n'.join(str((e['pagina'],e['titulo'][:80])) for e in [e for e in entries if not e['codigos']][:25]))
print('Sample first', entries[:4]);print('warnings',len(warnings))
