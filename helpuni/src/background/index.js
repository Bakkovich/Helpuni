import HelpuniURL from '../modules/url.js';
import {login, logout} from '../modules/auth.js';
import opencab from '../modules/opencab.js';
import createIsolatedTab from '../modules/isolated_tabs.js';
import checkForUpdates from '../modules/update.js';
import {openoldcabtest, opennewcabtest} from '../modules/opencabtest.js';

chrome.runtime.onInstalled.addListener(() => {
    checkForUpdates();
  });

chrome.runtime.onInstalled.addListener(() => {
    const contextMenus = [
      { id: "openNewCab", title: "Новый кабинет", contexts: ["selection"]},
      { id: "openOldCab", title: "Старый кабинет", contexts: ["selection"]},
      { id: "calllog", title: "Calllog", contexts: ["selection"] },
      { id: "events_ats", title: "События на АТС", contexts: ["selection"] },
      { id: "amocrm", title: "AmoCRM", contexts: ["selection"] },
      { id: "lines_register", title: "Регистрация линий", contexts: ["selection"] },
      { id: "ssh_ats", title: "SSH в АТС", contexts: ["selection"] },
      { id: "openInTempSession", title: "Открыть в изолированной вкладке", contexts: ["link"] }
    ];
    contextMenus.forEach(menu => chrome.contextMenus.create(menu));
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    chrome.storage.local.get(["token"]).then((storage) => {
        if(!storage.token) return notify('Требуется авторизация', 'Авторизуйтесь в расширении');
        chrome.cookies.get({ url: HelpuniURL, name: 'users_access_token'}, function (cookie) {
            if(!cookie) chrome.cookies.set({
                url: HelpuniURL,
                name: 'users_access_token',
                value: storage.token,
                path: '/',
            });   
                
            switch(info.menuItemId)
            {
                case 'calllog':              
                    if(!/^\d{10}\.\d{1,10}$/.test(info.selectionText)) notify('Неверный CallID', 'Для просмотра лога звонка требуется выделить ID звонка');
                    else popup(info, '/calllog/')
                    break;
                case 'amocrm':
                    if(!/^0\d{5}$/.test(info.selectionText)) notify('Неверный номер кабинета', 'Для просмотра информации из AmoCRM требуется выделить номер кабинета');
                    else popup(info, '/amo/get_crm_configuration/');
                    break;            
                case 'events_ats':
                    if(!/^\d{10}\.\d{1,10}$/.test(info.selectionText)) notify('Неверный CallID', 'Для просмотра событий на АТС требуется выделить ID звонка');
                    else popup(info, '/events_ats/')
                    break;
                case 'lines_register':
                    if(!/^0\d{5}$/.test(info.selectionText)) notify('Неверный номер кабинета', 'Для просмотра регистрации линий требуется выделить номер кабинета');
                    else popup(info, '/reg/');
                    break;            
                case 'ssh_ats':
                    let sshurl = HelpuniURL;
                    if(/^0\d{5}$/.test(info.selectionText)) sshurl = sshurl+'/ats_ip/'+info.selectionText;
                    else if(/^\d{4}$/.test(info.selectionText)) sshurl = sshurl+'/get_ip_ats/'+info.selectionText;    
                    else if(/^\d{1,3}$/.test(info.selectionText)) sshurl = sshurl+'/get_ip_extreg/'+info.selectionText;
                    else if(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(info.selectionText)) {
                        chrome.tabs.create({url: 'ssh://'+info.selectionText});
                        break;
                    }
                    else {
                        notify('SSH', 'Выделите номер кабинета, ID сервера, IP-адрес или домен');
                        break;
                    }
                    fetch(sshurl, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                    .then(response => {
                        if(!response.ok) throw new Error(response.status);
                        return response.json();
                    })
                    .then((data) => {
                        console.log(data);
                        chrome.tabs.create({url: 'ssh://'+data});
                    })
                    .catch((error) => {
                        notify('SSH', 'Ошибка: '+error);
                    });

                    break;
                case 'openNewCab':
                    opennewcabtest(info.selectionText);
                    break;
                case 'openOldCab':
                    openoldcabtest(info.selectionText);
                    break;
                case 'openInTempSession':
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (linkUrl) => {
                            const linkElement = document.querySelector(`a[href="${linkUrl}"]`);
                            if (linkElement) {
                                const parentElement = linkElement.closest('.sonata-ba-list-field.sonata-ba-list-field-integer');
                                if (parentElement) {
                                    const spanElement = parentElement.querySelector('span');
                                    return spanElement ? spanElement.innerText : null;
                                }
                            }
                            return null;
                        },
                        args: [info.linkUrl]
                    }, (result) => {
                        if (chrome.runtime.lastError || !result || !result[0].result) {
                            createIsolatedTab(info.linkUrl, '', tab.id);
                        } else {
                            const spanContent = result[0].result;
                            createIsolatedTab(info.linkUrl, spanContent, tab.id);
                        }
                    });
                break;
            }
        });
    });
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let msg = JSON.parse(message);
    switch(msg.type) {
        case 'auth':
            login(msg.data).then((response) => {
                sendResponse(JSON.stringify(response));
            });  
            break;
        case 'logout':
            logout().then((response) => {
                notify('Авторизация', 'Ушел');
                sendResponse(response);
            });  
            break;
    }
    return true;
});

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

function popup(info, path) {
    chrome.windows.create({
        url: chrome.runtime.getURL("response.html"),
        type: "popup",
        focused: true
    }, (win) => {
        fetch(HelpuniURL+path+info.selectionText, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        })
        .then(response => {
            if(response.status=='200') return response.json();
            else throw new Error(response.status);
        })
        .then(data => {
            return data;
        })
        .catch(error => { 
            switch (error.message) {
                case '401': return {'error': 'Требуется повторная авторизация'};
                case '404': return {'error': 'Страница не найдена'};
                case '408': return {'error': 'Не дождались ответа от сервера'};
                case '418': return {'error': 'Cервер не может приготовить кофе, потому что он чайник'};   
                case '422': return {'error': 'Неверный формат данных'};
                case '500': return {'error': 'Серверная ошибка'};
                case '503': return {'error': 'Сервис недоступен'};
                default: return {'error': 'Неизвестная ошибка '+error.message};                
            }
        })
        .then(msg=> {
            setTimeout(() => {
                chrome.tabs.sendMessage(win.tabs[0].id, JSON.stringify({"type": info.menuItemId, "response": msg, "selection": info.selectionText}), (resp) => {
                    chrome.tabs.update(win.tabs[0].id, { active: true });
                });
            }, 500);
        }); 
    });
}