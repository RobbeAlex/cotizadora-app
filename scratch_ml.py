import urllib.request
from bs4 import BeautifulSoup
import re

def search_ml(query):
    query_fmt = query.replace(" ", "-")
    url = f"https://listado.mercadolibre.com.mx/{query_fmt}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        items = soup.find_all('li', class_='ui-search-layout__item')
        for item in items[:5]:
            title_el = item.find('h2')
            price_el = item.find('span', class_='andes-money-amount__fraction')
            link_el = item.find('a')
            
            title = title_el.text if title_el else ''
            price = price_el.text if price_el else ''
            link = link_el['href'] if link_el else ''
            print("ML:", title, "| Price:", price, "| Link:", link)
    except Exception as e:
        print("ML Err", e)

search_ml("yeso 40 kg")
search_ml("cemento cruz azul")
