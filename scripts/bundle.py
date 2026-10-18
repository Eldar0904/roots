"""Keep the standalone HTML in sync with its editable CSS and JavaScript."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
page = root / 'index.html'
html = page.read_text()
for name, tag, source in [('STYLE', 'style', 'style.css'), ('SCRIPT', 'script', 'app.js')]:
    pattern = rf'<!-- ROOTS_{name} -->.*?<!-- /ROOTS_{name} -->'
    content = (root / source).read_text()
    replacement = f'<!-- ROOTS_{name} -->\n<{tag}>{content}</{tag}>\n<!-- /ROOTS_{name} -->'
    html, count = re.subn(pattern, lambda _: replacement, html, flags=re.S)
    if count != 1:
        raise RuntimeError(f'Expected one {name} section, found {count}')
page.write_text(html)
