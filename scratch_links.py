import urllib.request
import urllib.parse
import re

url = "https://lite.duckduckgo.com/lite/"
data = urllib.parse.urlencode({'q': 'Arena precio comprar mexico ferreteria'}).encode('utf-8')
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, data=data, headers=headers)
html = urllib.request.urlopen(req).read().decode('utf-8')

snippets = re.findall(r'<td class=[\'"]result-snippet[\'"][^>]*>(.*?)</td>', html, re.DOTALL | re.IGNORECASE)
links = re.findall(r'<a[^>]+class=[\'"]result-url[\'"][^>]+href=[\'"]([^\'"]+)[\'"]', html, re.IGNORECASE)
if not links:
    links = re.findall(r'<a[^>]+href=[\'"]([^\'"]+)[\'"][^>]*>(.*?://.*?)</a>', html, re.IGNORECASE)
    links = [l[0] for l in links]

print("Snippets:", len(snippets))
print("Links:", len(links))
for i in range(min(len(snippets), len(links), 2)):
    print(links[i], snippets[i][:50])
