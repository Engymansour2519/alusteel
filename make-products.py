"""
Reads your product folder and writes products.js (the product list) and
images/products/ (small web-ready copies of the photos).

Folder layout it expects (exactly like yours):
    تقسيم المنتجات / <category> / <product> / photo.png

    category folder name  -> category name   (e.g. افران)
    product folder name   -> product name    (e.g. فرن عيش)
    every image inside    -> that product's photos

Usage (run it from the website folder, next to index.html):
    python make-products.py                       # finds the folder by itself
    python make-products.py "C:\\path\\to\\تقسيم المنتجات"

It looks for a folder named  تقسيم المنتجات / المنتجات / products  inside the website
folder, then on your Desktop (also the OneDrive Desktop).

Install once (only needed to make the small web copies of the photos):
    pip install pillow
Without Pillow it still works, but uses the original (big) photos.

Run it again whenever you add or rename products.
"""
import json, os, re, sys
from pathlib import Path
from urllib.parse import quote

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif")
ROOT_NAMES = ["تقسيم المنتجات", "المنتجات", "products"]

# These categories come first on the home page (use the folder names). The rest follow A-Z.
PRIORITY = ["افران", "شوايات", "قلاية", "بوتجاز", "جريل", "ثلاجات", "خط سخن", "بوفيه"]

# English names. Anything missing here shows its Arabic name in English too,
# and is listed at the end of the run so you can add it.
EN_CATEGORIES = {
    "افران": "Ovens", "باستا ستيشن": "Pasta station", "بان مارى": "Bain-marie",
    "بروست": "Broast fryers", "بوتجاز": "Gas ranges", "بوفيه": "Buffet",
    "ثلاجات": "Refrigerators", "جريل": "Grills", "حلة": "Cooking pots",
    "خط ثلاجات مساحة اقل": "Compact refrigeration line", "خط سخن": "Hot line",
    "خط سناك اوفر كونتر": "Over-counter snack line", "دامب ستيشن": "Dump station",
    "ريشو": "Hot plates", "شوايات": "Rotisseries and broilers", "قلاية": "Fryers",
    "كارفن ستيشن": "Carving station", "موقد": "Stoves",
}
EN_PRODUCTS = {
    "فرن بيتزا": "Pizza oven",
    "فرن بيتزا حجرى 1 بلاطة": "Stone pizza oven (1 deck)",
    "فرن بيتزا حجرى 2 بلاطة": "Stone pizza oven (2 decks)",
    "فرن بيتزا حجرى نص برميل": "Stone pizza oven (half barrel)",
    "فرن تدخين": "Smoker oven", "فرن دك": "Deck oven", "فرن طواجن": "Tagine oven",
    "فرن عيش": "Bread oven", "فرن كاسبر حواوشي": "Hawawshi oven (Kasper)",
    "فرن كومبير بطاطس": "Kumpir potato oven",
}

MAX_FULL, MAX_THUMB = 1000, 480          # photo sizes in pixels (large view / card)


def norm(s):
    s = re.sub(r"[\u064B-\u0652\u0640]", "", s)
    s = s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ى", "ي").replace("ة", "ه")
    return re.sub(r"\s+", " ", s).strip().lower()


EN_C = {norm(k): v for k, v in EN_CATEGORIES.items()}
EN_P = {norm(k): v for k, v in EN_PRODUCTS.items()}


def natural(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", str(s))]


def find_root(here):
    if len(sys.argv) > 1:
        return Path(sys.argv[1]).expanduser()
    home = Path.home()
    bases = [Path(here), Path(here).parent, home / "Desktop"] + [d / "Desktop" for d in home.glob("OneDrive*")]
    for b in bases:
        for n in ROOT_NAMES:
            if (b / n).is_dir():
                return b / n
    return None


def images_in(folder):
    out = [p for p in Path(folder).rglob("*") if p.is_file() and p.suffix.lower() in EXT]
    return sorted(out, key=lambda p: natural(str(p.relative_to(folder))))


def make_web_copies(src, base_name, out_dir):
    """Returns the web path of the large copy (the small one is the same name + -s)."""
    big, small = out_dir / (base_name + ".webp"), out_dir / (base_name + "-s.webp")
    if not (big.exists() and small.exists() and big.stat().st_mtime >= Path(src).stat().st_mtime):
        im = Image.open(src)
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGBA" if "A" in im.getbands() or im.mode == "P" else "RGB")
        for target, size in ((big, MAX_FULL), (small, MAX_THUMB)):
            c = im.copy()
            c.thumbnail((size, size), Image.LANCZOS)
            c.save(target, "WEBP", quality=82, method=4)
    return "images/products/" + big.name


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = find_root(here)
    if not root or not root.is_dir():
        sys.exit('Could not find the product folder. Run:  python make-products.py "full path to تقسيم المنتجات"')
    root = Path(os.path.abspath(root))
    print("Reading products from:", root)
    if Image is None:
        print("NOTE: Pillow is not installed (pip install pillow). Using the original big photos.\n")
    out_dir = Path(here) / "images" / "products"
    if Image:
        out_dir.mkdir(parents=True, exist_ok=True)

    cats = [d for d in root.iterdir() if d.is_dir()]
    cats.sort(key=lambda d: (PRIORITY.index(d.name) if d.name in PRIORITY else 999, natural(d.name)))

    data, missing_c, missing_p, empty = [], [], [], []
    total = 0
    for ci, cat in enumerate(cats, 1):
        items = []
        # products = sub folders; loose photos directly inside the category are products too
        groups = [(d.name, images_in(d)) for d in sorted((x for x in cat.iterdir() if x.is_dir()), key=lambda d: natural(d.name))]
        groups += [(re.sub(r"[_-]+", " ", p.stem).strip(), [p]) for p in images_in(cat) if p.parent == cat]
        for pi, (pname, files) in enumerate(groups, 1):
            if not files:
                empty.append(f"{cat.name} / {pname}")
                continue
            urls = []
            for n, f in enumerate(files, 1):
                if Image:
                    try:
                        urls.append(make_web_copies(f, f"c{ci:02d}-p{pi:02d}-{n}", out_dir))
                    except Exception as e:
                        print("  skipped (cannot read):", f.name, e)
                else:
                    rel = os.path.relpath(f, here).replace("\\", "/")
                    urls.append("/".join(quote(x) if x != ".." else x for x in rel.split("/")))
            if not urls:
                continue
            en = EN_P.get(norm(pname), "")
            if not en:
                missing_p.append(pname)
            items.append({"id": f"c{ci:02d}p{pi:02d}", "ar": pname, "en": en or pname, "imgs": urls})
            total += 1
        if not items:
            continue
        en_c = EN_C.get(norm(cat.name), "")
        if not en_c:
            missing_c.append(cat.name)
        data.append({"id": f"c{ci:02d}", "ar": cat.name, "en": en_c or cat.name, "products": items})

    with open(os.path.join(here, "products.js"), "w", encoding="utf-8") as fh:
        fh.write("window.PRODUCTS = " + json.dumps({"categories": data}, ensure_ascii=False, indent=1) + ";\n")
    print(f"\nproducts.js written: {len(data)} categories, {total} products")
    for c in data:
        print(f"  {c['ar']:28} {len(c['products'])} products")
    if empty:
        print(f"\n{len(empty)} product folder(s) have no photos and were skipped:")
        for e in empty:
            print("  ", e)
    if missing_c or missing_p:
        print("\nNo English name yet (the Arabic name is used). To add them, edit EN_CATEGORIES / EN_PRODUCTS")
        print("at the top of this file, or send me the list:")
        for n in missing_c:
            print(f'   category: "{n}": "",')
        for n in missing_p:
            print(f'   product:  "{n}": "",')


main()