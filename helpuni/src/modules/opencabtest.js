import * as cheerio from 'cheerio';
export async function openoldcabtest(selection) {
    try {
        const url = `https://sipuni.com/manage/user/list?filter%5Bpartner%5D%5Bvalue%5D=all&filter%5Bid%5D%5Btype%5D=&filter%5Bid%5D%5Bvalue%5D=${encodeURIComponent(selection)}`;
        const response = await fetch(url);
        if (!response.ok) {
            notify('Ошибка', 'Не авторизованна админка')
        }
        const html = await response.text();

        // Use regex to find the href attribute of the <a> tag with title="Вход"
        const match = html.match(/<a\s+href="([^"]+)"\s+class="btn btn-sm btn-default"\s+title="Вход"/);
        if (!match) {
            notify('Ошибка', 'Не нашли ссылку для входа в кабинет');;
        }

        const href = match[1]; // Extract the href value

        // Open the link in a new incognito window
        chrome.windows.create({
            url: href,
            type: "normal",
            focused: true,
            incognito: true,
            state: "maximized"
        });
    } catch (error) {
        console.error(`Ошибка авторизации в админку: ${error.message}`);
        notify('Ошибка', `Не удалось открыть кабинет: ${error.message}`);
    }
}

export async function opennewcabtest(selection) {
    try {
        const url = `https://sipuni.com/manage/user/list?filter%5Bpartner%5D%5Bvalue%5D=all&filter%5Bid%5D%5Btype%5D=&filter%5Bid%5D%5Bvalue%5D=${encodeURIComponent(selection)}`;
        const response = await fetch(url);
        if (!response.ok) {
            notify('Ошибка', 'Не авторизована админка');
            return;
        }
        const html = await response.text();

        // Используем cheerio для парсинга HTML
        const $ = cheerio.load(html);

        // Используем CSS-селектор для поиска ссылки
        const linkElement = $('a.btn.btn-sm.btn-default[title="Переход на новый сайт"]');
        if (!linkElement.length) {
            notify('Ошибка', 'Не нашли ссылку для входа в кабинет');
        }

        // Извлекаем значение атрибута href
        const href = linkElement.attr('href');

        // Открываем ссылку в новом инкогнито-окне
        chrome.windows.create({
            url: href,
            type: "normal",
            focused: true,
            incognito: true,
            state: "maximized"
        });
    } catch (error) {
        console.error(`Ошибка авторизации в админку: ${error.message}`);
        notify('Ошибка', `Не удалось открыть кабинет: ${error.message}`);
    }
}

export function notify(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message
    }, (notificationId) => { 
        setTimeout(() => {
            chrome.notifications.clear(notificationId);
        }, 3000);
    });
}
