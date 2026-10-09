import urllib.request
import urllib.parse
import re

url = "https://lite.duckduckgo.com/lite/"
data = urllib.parse.urlencode({'q': 'Arena precio comprar mexico'}).encode('utf-8')
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, data=data, headers=headers)
html = urllib.request.urlopen(req).read().decode('utf-8')

with open("scratch_html.html", "w", encoding="utf-8") as f:
    f.write(html)
