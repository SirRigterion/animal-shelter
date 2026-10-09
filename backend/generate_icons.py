"""Генератор иконок админ-панели из фирменных SVG сайта.

Берёт ВСЕ иконки из frontend/src/assets/icons/*.svg и собирает
backend/admin/icons.js – единый источник иконок для админки.

Запуск после изменения иконок сайта:
    python generate_icons.py
"""
import json
import re
from pathlib import Path

SITE_ICONS_DIR = Path(__file__).resolve().parent.parent / "frontend" / "src" / "assets" / "icons"
OUTPUT = Path(__file__).resolve().parent / "admin" / "icons.js"

SVG_TAG = re.compile(r"<svg\b[^>]*>", re.IGNORECASE)
VIEWBOX = re.compile(r'viewBox="([^"]+)"', re.IGNORECASE)

def parse_svg(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8")
    tag = SVG_TAG.search(text)
    if tag is None:
        return None
    open_tag = tag.group(0)
    viewBoxMatch = VIEWBOX.search(open_tag)
    body = text[tag.end(): text.rfind("</svg>")]
    body = body.replace('fill="#000"', 'fill="currentColor"')
    body = body.replace("fill='black'", 'fill="currentColor"')
    is_stroke = 'fill="none"' in open_tag
    return {
        "viewBox": viewBoxMatch.group(1) if viewBoxMatch else "0 0 24 24",
        "body": re.sub(r"\s+", " ", body).strip(),
        "fill": not is_stroke,
    }

def main() -> None:
    icons: dict[str, dict] = {}
    for svg_file in sorted(SITE_ICONS_DIR.glob("*.svg")):
        parsed = parse_svg(svg_file)
        if parsed is None:
            print(f"[icons] Пропущен (не SVG): {svg_file.name}")
            continue
        name = svg_file.stem.replace("-", "_").lower()
        icons[name] = parsed
        print(f"[icons] {name} (viewBox {parsed['viewBox']})")

    icons.update(ADMIN_EXTRA_ICONS)

    lines = [
        "// СГЕНЕРИРОВАНО generate_icons.py из frontend/src/assets/icons/*.svg – не редактировать вручную.",
        "// Перегенерация: python generate_icons.py (или npm run icons в папке backend).",
        '"use strict";',
        f"const SITE_ICONS = {json.dumps(icons, ensure_ascii=False, indent=2)};",
    ]
    OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[icons] Записано {len(icons)} иконок -> {OUTPUT}")

ADMIN_EXTRA_ICONS: dict[str, dict] = {
    "image": {"viewBox": "0 0 24 24", "body": '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>'},
    "camera": {"viewBox": "0 0 24 24", "body": '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>'},
    "trash": {"viewBox": "0 0 24 24", "body": '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>'},
    "upload": {"viewBox": "0 0 24 24", "body": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>'},
    "edit": {"viewBox": "0 0 24 24", "body": '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>'},
    "plus": {"viewBox": "0 0 24 24", "body": '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'},
    "trophy": {"viewBox": "0 0 24 24", "body": '<path d="M8 21h8"></path><path d="M12 17v4"></path><path d="M7 4h10v6a5 5 0 0 1-10 0z"></path><path d="M7 5H4v2a3 3 0 0 0 3 3"></path><path d="M17 5h3v2a3 3 0 0 1-3 3"></path>'},
    "car": {"viewBox": "0 0 24 24", "body": '<path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"></path><path d="M3 16v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"></path><circle cx="7.5" cy="16.5" r="1.8"></circle><circle cx="16.5" cy="16.5" r="1.8"></circle><line x1="9.3" y1="16.5" x2="14.7" y2="16.5"></line>'},
    "medical": {"viewBox": "0 0 24 24", "body": '<rect x="3" y="7" width="18" height="13" rx="2" ry="2"></rect><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path><line x1="12" y1="11" x2="12" y2="16"></line><line x1="9.5" y1="13.5" x2="14.5" y2="13.5"></line>'},
    "syringe": {"viewBox": "0 0 24 24", "body": '<path d="M18 2l4 4"></path><path d="M17 7l-1.5-1.5a2.1 2.1 0 0 0-3 0L7 11l6 6 5.5-5.5a2.1 2.1 0 0 0 0-3L17 7z"></path><line x1="9" y1="13" x2="13" y2="9"></line><line x1="3" y1="21" x2="7" y2="17"></line>'},
    "cut": {"viewBox": "0 0 24 24", "body": '<circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line>'},
    "passport": {"viewBox": "0 0 24 24", "fill": True, "body": '<path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/><path d="M8.5 16.5h7M9.5 19h5" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" fill="none"/>'},
}

if __name__ == "__main__":
    main()
