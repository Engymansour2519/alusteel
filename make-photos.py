"""
Scans your photo folder and writes photos.js, which the event pages read.

Usage (put this file next to index.html and run it):
    python make_photos.py                 # finds your photo folder by itself
    python make_photos.py "C:\\path\\to\\folder"   # or point it at the folder yourself

With no argument it looks for a folder named المعارض, events, photos or معارض inside the website
folder, then on your Desktop (also the OneDrive Desktop). It reads the images where they are;
nothing is copied or renamed.

It works with either layout, as long as each photo's path contains the event name
and the year (folder or file name, any letter case):
    photos/CAFEX/2025/img1.jpg
    photos/2025/CAFEX/img1.jpg
    photos/CAFEX 2025/img1.jpg
Events: cafex, hace, horeca, iatf.   Years: any 4-digit year such as 2019.
Run it again whenever you add photos.
"""
import json, os, re, sys
from pathlib import Path
from urllib.parse import quote

EVENTS = ["cafex", "hace", "horeca", "iatf"]
EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif")

def natural(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]

# Your photo folder. Change this line if you move the folder.
PHOTO_FOLDER = r"C:\Users\w.i\OneDrive\Desktop\المعارض"

NAMES = ["المعارض", "events", "photos", "معارض"]

def find_root(here):
    if len(sys.argv) > 1:
        return Path(sys.argv[1]).expanduser()
    if PHOTO_FOLDER and Path(PHOTO_FOLDER).is_dir():
        return Path(PHOTO_FOLDER)
    home = Path.home()
    places = [Path(here), Path(here).parent, home / "Desktop"] + [d / "Desktop" for d in home.glob("OneDrive*")]
    for base in places:
        for n in NAMES:
            if (base / n).is_dir():
                return base / n
    return None

def web_path(full, here):
    try:
        rel = os.path.relpath(full, here).replace("\\", "/")
        return "/".join(quote(p) if p != ".." else p for p in rel.split("/")), rel.startswith("..")
    except ValueError:                      # different drive: use the full file address
        return Path(full).as_uri(), True

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = find_root(here)
    if not root or not root.is_dir():
        sys.exit("Could not find your photo folder. Run:  python make_photos.py \"full path to the folder\"")
    root_abs = os.path.abspath(root)
    print("Reading photos from:", root_abs)
    data, skipped, outside = {}, [], False
    for dirpath, _, files in os.walk(root_abs):
        for f in sorted(files, key=natural):
            if not f.lower().endswith(EXT):
                continue
            full = os.path.join(dirpath, f)
            rel_from_root = os.path.relpath(full, root_abs).replace("\\", "/")
            parts = rel_from_root.lower().split("/")
            ev = next((e for p in parts for e in EVENTS if e in p), None)
            m = next((re.search(r"(?<!\d)((?:19|20)\d\d)(?!\d)", p) for p in parts if re.search(r"(?<!\d)((?:19|20)\d\d)(?!\d)", p)), None)
            if not ev or not m:
                skipped.append(rel_from_root)
                continue
            web, out = web_path(full, here)
            outside = outside or out
            data.setdefault(ev, {}).setdefault(m.group(1), []).append(web)
    for ev in data:
        for y in data[ev]:
            data[ev][y].sort(key=natural)
    with open(os.path.join(here, "photos.js"), "w", encoding="utf-8") as fh:
        fh.write("window.EVENT_PHOTOS = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n")
    print("photos.js written")
    for ev in EVENTS:
        for y in sorted(data.get(ev, {}), reverse=True):
            print(f"  {ev.upper():7} {y}: {len(data[ev][y])} photos")
    if skipped:
        print(f"\n{len(skipped)} image(s) skipped (no event name or year in the path):")
        for sk in skipped[:20]:
            print("  ", sk)
    if outside:
        print("\nNOTE: the photo folder is outside the website folder. It works on your computer,")
        print("but before uploading the site, move that folder inside the website folder and run this again.")

main()