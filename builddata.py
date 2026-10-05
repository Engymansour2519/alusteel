"""Builds data/site-data.js from the scraped files in data/source/.
Run from the project root:  python3 tools/build_data.py"""
import csv, json, re, os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'data', 'source')
B = 'https://alusteel.net'

rows = list(csv.DictReader(open(os.path.join(SRC, 'pages.csv'), encoding='utf-8-sig')))
imgs = list(csv.DictReader(open(os.path.join(SRC, 'images.csv'), encoding='utf-8-sig')))
by_url = {r['url']: r for r in rows}
home = by_url[B]['text']

home_imgs = []
for x in imgs:
    if x['page_url'] == B and x['image_url'] not in home_imgs:
        home_imgs.append(x['image_url'])


def find_img(keyword):
    return next((u for u in home_imgs if keyword in u), '')


# ---- stats: "2550\n<label>" pairs on the Arabic home page
stats_en = ['Completed projects', 'Recent projects', 'Accreditations', 'Employees']
stats = [{'n': n, 'ar': l.strip(), 'en': e}
         for (n, l), e in zip(re.findall(r'^(\d+)\n(.+)$', home, re.M)[:4], stats_en)]

# ---- contact: phones, land-line, fax, emails
contact = by_url[B + '/تواصل-معنا']['text'] + by_url[B + '/en/contact-us']['text']
phones = list(dict.fromkeys(re.findall(r'01\d{9}', contact)))
landline = re.search(r'Land-Line: \(\+2\)(\d+)', contact).group(1)
fax = re.search(r'Fax: \(\+2\)(\d+)', contact).group(1)
emails = list(dict.fromkeys(re.findall(r'[\w.]+@[\w.]+\.\w+', by_url[B + '/en/faqs']['text'])))

# ---- products: names from the home page, photo looked up in images.csv
products = [{'img': find_img(k), 'ar': a, 'en': e} for k, a, e in [
    ('فرن-بيتزا-حطب', 'أفران بيتزا حطب', 'Wood-fired pizza oven'),
    ('شوايات-حطب', 'شوايات حطب', 'Wood-fired grills'),
    ('شوايات-دوارة', 'شوايات دوارة', 'Chicken rotation (gas and wood fire)'),
    ('فرن-بطاطس', 'فرن بطاطس كومبير', 'Potato kumpir oven'),
    ('فرن-عيش', 'فرن عيش', 'Bread oven'),
    ('فرن-تدخين', 'فرن تدخين', 'Smoker oven'),
    ('شواية-فراخ', 'شواية فراخ كهرباء', 'Electric chicken grill')]]

# ---- events: one photo per fair
events = [{'name': n, 'img': find_img(k)} for n, k in
          [('CAFEX', 'cafex2022'), ('HACE', 'hace2023'), ('HORECA', 'horecaR2023'), ('IATF', 'iatf2018')]]

# ---- articles: the Arabic and English lists are in the same order
ar_art = [r for r in rows if r['section'] == 'مقالات'][1:10]
en_art = [r for r in rows if r['url'].startswith(B + '/en/articles/')][:9]
clean = lambda s: s.split(' | ')[0].strip()
cut = lambda s: s[:110].rsplit(' ', 1)[0] + '…'
articles = [{'url': a['url'],
             'ar': {'t': clean(a['title']), 'd': cut(a['meta_description'])},
             'en': {'t': clean(e['title']), 'd': cut(e['meta_description'])}}
            for a, e in zip(ar_art, en_art)]

# ---- client logos
logos = [u for u in home_imgs if 'our-customers' in u]

data = {
    'base': B,
    'hero_img': home_imgs[0],
    'stats': stats,
    'contact': {'phones': phones, 'landline': landline, 'fax': fax, 'emails': emails},
    'products': products, 'events': events, 'articles': articles, 'logos': logos,
    'social': {'Facebook': 'https://www.facebook.com/alusteel.egy',
               'YouTube': 'https://www.youtube.com/channel/UC2ROV7cSLjprGRNswLe6xzw'},
}
out = os.path.join(ROOT, 'data', 'site-data.js')
open(out, 'w', encoding='utf-8').write(
    'window.SITE_DATA = ' + json.dumps(data, ensure_ascii=False, indent=1) + ';\n')
print('wrote', out, '| products', len(products), '| articles', len(articles),
      '| logos', len(logos), '| phones', phones, '| stats', stats)