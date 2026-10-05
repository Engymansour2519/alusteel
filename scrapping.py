"""
Full-site scraper for https://alusteel.net

Run:
    python scrapping.py              # crawl every page, save text + image links
    python scrapping.py --images     # also download all images
    python scrapping.py --no-en      # skip the English (/en/) version

Install once:
    pip install requests beautifulsoup4

Results are saved in an "output" folder next to this script:
    pages.json    full data for every page (headings, text, images, links)
    pages.csv     one row per page (opens in Excel, Arabic supported)
    images.csv    one row per image (page, image URL, alt text, local file)
    images/       downloaded images (only with --images)
"""
import argparse
import csv
import hashlib
import json
import re
import time
from collections import deque
from pathlib import Path
from urllib.parse import unquote, urldefrag, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE = "https://alusteel.net"
HOST = urlparse(BASE).netloc
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AlusteelSiteBackup/1.0)"}
DELAY = 0.5  # seconds between requests, keeps the server happy
OUT = Path(__file__).resolve().parent / "output"

IMG_EXT = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg")
SKIP_EXT = IMG_EXT + (".pdf", ".zip", ".rar", ".mp4", ".css", ".js", ".ico", ".xml", ".docx", ".xlsx")


def norm(url):
    """Return a clean internal URL (no #fragment, no ?query, no trailing /), else None."""
    url, _ = urldefrag(url)
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        return None
    if p.netloc.lower() not in (HOST, "www." + HOST):
        return None
    return f"https://{HOST}{p.path.rstrip('/')}"


def want(url, skip_en):
    if url is None or url.lower().endswith(SKIP_EXT):
        return False
    path = urlparse(url).path
    if skip_en and (path == "/en" or path.startswith("/en/")):
        return False
    return True


def sitemap_urls(session):
    """Use sitemap.xml as extra starting points, if the site has one."""
    try:
        r = session.get(BASE + "/sitemap.xml", timeout=20)
        if r.status_code == 200:
            return re.findall(r"<loc>\s*(.*?)\s*</loc>", r.text)
    except requests.RequestException:
        pass
    return []


def parse(url, html):
    soup = BeautifulSoup(html, "html.parser")

    def meta(key):
        tag = soup.find("meta", attrs={"name": key}) or soup.find("meta", attrs={"property": key})
        return (tag.get("content") or "").strip() if tag else ""

    # every link on the page (used for crawling)
    links = []
    for a in soup.find_all("a", href=True):
        href = urljoin(url, a["href"].strip())
        if href not in links:
            links.append(href)

    # remove noise, then keep only the page's own content (no repeated menu/footer)
    for t in soup(["script", "style", "noscript", "nav", "header", "footer"]):
        t.decompose()
    root = soup.find("main") or soup.body or soup

    headings = [
        {"tag": h.name, "text": h.get_text(" ", strip=True)}
        for h in root.find_all(["h1", "h2", "h3", "h4", "h5"])
        if h.get_text(strip=True)
    ]

    images, seen_imgs = [], set()
    for img in root.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
        if not src or src.startswith("data:"):
            continue
        full = urljoin(url, src)
        if full not in seen_imgs:
            seen_imgs.add(full)
            images.append({"url": full, "alt": (img.get("alt") or "").strip()})
    for a in root.find_all("a", href=True):  # gallery links that point straight to an image
        full = urljoin(url, a["href"])
        if urlparse(full).path.lower().endswith(IMG_EXT) and full not in seen_imgs:
            seen_imgs.add(full)
            images.append({"url": full, "alt": (a.get("title") or "").strip()})

    path = unquote(urlparse(url).path).strip("/")
    return {
        "url": url,
        "section": path.split("/")[0] if path else "home",
        "title": soup.title.get_text(strip=True) if soup.title else "",
        "meta_description": meta("description"),
        "h1": next((h["text"] for h in headings if h["tag"] == "h1"), ""),
        "headings": headings,
        "text": root.get_text("\n", strip=True),
        "images": images,
        "links": links,
    }


def download_images(rows, session):
    folder = OUT / "images"
    folder.mkdir(parents=True, exist_ok=True)
    done = {}
    for i, row in enumerate(rows, 1):
        url = row["image_url"]
        if url not in done:
            ext = Path(urlparse(url).path).suffix or ".jpg"
            name = hashlib.md5(url.encode()).hexdigest()[:12] + ext
            target = folder / name
            if not target.exists():
                try:
                    r = session.get(url, timeout=30)
                    if r.status_code == 200:
                        target.write_bytes(r.content)
                    else:
                        name = ""
                except requests.RequestException:
                    name = ""
                time.sleep(0.2)
            done[url] = name
        row["local_file"] = done[url]
        if i % 25 == 0:
            print(f"  images: {i}/{len(rows)}")


def save(pages, session, get_images):
    OUT.mkdir(exist_ok=True)
    (OUT / "pages.json").write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf-8")

    with open(OUT / "pages.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["url", "section", "title", "h1", "meta_description", "text", "image_count"])
        for p in pages:
            w.writerow([p["url"], p["section"], p["title"], p["h1"],
                        p["meta_description"], p["text"], len(p["images"])])

    rows = [{"page_url": p["url"], "image_url": im["url"], "alt": im["alt"], "local_file": ""}
            for p in pages for im in p["images"]]
    if get_images:
        print(f"Downloading {len({r['image_url'] for r in rows})} images...")
        download_images(rows, session)
    with open(OUT / "images.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["page_url", "image_url", "alt", "local_file"])
        w.writeheader()
        w.writerows(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", action="store_true", help="download all images")
    ap.add_argument("--no-en", action="store_true", help="skip /en/ pages")
    args = ap.parse_args()

    session = requests.Session()
    session.headers.update(HEADERS)

    start = [BASE] + sitemap_urls(session)
    queue, seen = deque(), set()
    for u in start:
        n = norm(u)
        if want(n, args.no_en) and n not in seen:
            seen.add(n)
            queue.append(n)

    pages = []
    try:
        while queue:
            url = queue.popleft()
            try:
                r = session.get(url, timeout=20)
            except requests.RequestException as e:
                print(f"[error] {url}  ({e})")
                continue
            if r.status_code != 200 or "text/html" not in r.headers.get("content-type", ""):
                print(f"[skip {r.status_code}] {unquote(url)}")
                continue
            r.encoding = "utf-8"
            page = parse(url, r.text)
            pages.append(page)
            print(f"[{len(pages):>3}] {unquote(url)}  | queue: {len(queue)}")
            for link in page["links"]:
                n = norm(link)
                if want(n, args.no_en) and n not in seen:
                    seen.add(n)
                    queue.append(n)
            time.sleep(DELAY)
    except KeyboardInterrupt:
        print("\nStopped early, saving what was collected...")

    save(pages, session, args.images)
    print(f"\nDone. {len(pages)} pages saved in: {OUT}")


if __name__ == "__main__":
    main()