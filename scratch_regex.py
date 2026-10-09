import urllib.request
import urllib.parse
import re

html = """
<a rel="nofollow" href="https://www.homedepot.com.mx" class='result-link'>Arena</a>
"""

# Extract all <a> tags that have class="result-link" or class='result-link'
a_tags = re.findall(r'<a[^>]*class=[\'"]result-link[\'"][^>]*>.*?</a>|<a[^>]*>[^<]*</a>', html, re.IGNORECASE)
# Actually, just find the content of a tags:
links_match = []
for m in re.finditer(r'<a\s+([^>]*)>(.*?)</a>', html, re.IGNORECASE):
    attrs = m.group(1)
    text = m.group(2)
    if 'result-link' in attrs:
        href_m = re.search(r'href=[\'"]([^\'"]+)[\'"]', attrs)
        if href_m:
            links_match.append((href_m.group(1), text))

print(links_match)
