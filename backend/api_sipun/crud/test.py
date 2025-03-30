import requests
from bs4 import BeautifulSoup
cab_number = '078741'
sess = requests.Session()
login_CSRF = sess.get("https://exemple.com/ru_RU/login")
soup_CSRF = BeautifulSoup(login_CSRF.content.decode("utf-8"), "html.parser")
CSRF = soup_CSRF.find ("input", id ="login__token").get('value')

login_data = {
        'login[username_email]': 'mail@mail.ru',
        'login[password]' : "password",
        'login[_token]' : CSRF
    }


login = sess.post("https://exemple.com/ru_RU/login", login_data)


callstat = sess.get(f"https://exemple.com/manage/user/list?filter{cab_number}")
callstat_soup = BeautifulSoup(callstat.content.decode("utf-8"), "html.parser")
table = callstat_soup.find('table', class_='table table-bordered table-striped sonata-ba-list')
headers = [header.get_text(strip=True) for header in table.find('thead').find_all('th')]

# Извлекаем строки из таблицы и создаем словарь
data_list = []
rows = table.find('tbody').find_all('tr')
for row in rows:
    cols = row.find_all('td')
    if cols:  # Проверяем, что есть ячейки
        row_data = {headers[i]: cols[i].get_text(strip=True) for i in range(len(cols))}
        data_list.append(row_data)


test = BeautifulSoup(data_list, "html.parser")
find = test.find_all('td', class_='sonata-ba-list-field sonata-ba-list-field-id')
print(find)
