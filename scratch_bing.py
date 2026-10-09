import urllib.request
import urllib.parse
from bs4 import BeautifulSoup

def search_bing(query):
    url = "https://www.bing.com/search?q=" + urllib.parse.quote(query)
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        for li in soup.find_all('li', class_='b_algo'):
            title = li.find('h2')
            title = title.text if title else ''
            
            snippet = li.find('p')
            snippet = snippet.text if snippet else ''
            
            print("T:", title)
            print("S:", snippet)
            print("---")
            
    except Exception as e:
        print("Err", e)

search_bing("Yeso bulto precio site:homedepot.com.mx OR site:sodimac.com.mx")
