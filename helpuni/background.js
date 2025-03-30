const serverVersionUrl = 'http://10.2.3.53:8097/version.json';

// Функция для получения URL ресурса внутри расширения
function getResourceUrl(resourcePath) {
  return chrome.runtime.getURL(resourcePath);
}

function getLocalVersion(callback) {
  fetch(getResourceUrl('manifest.json'))
    .then(response => {
      if (!response.ok) throw new Error('Не удалось загрузить манифест');
      return response.json();
    })
    .then(manifest => {
      callback(manifest.version);
    })
    .catch(err => console.error('Ошибка при загрузке манифеста:', err));
}

function downloadAndUpdateExtension(downloadUrl) {
  fetch(downloadUrl)
    .then(response => {
      if (!response.ok) throw new Error('Не удалось загрузить расширение');
      return response.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extension-chrome.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      alert('Новая версия загружена. Пожалуйста, извлеките и перезагрузите расширение вручную.');
    })
    .catch(err => console.error('Ошибка при загрузке расширения:', err));
}

function notifyUpdateAvailable(version, downloadUrl) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Доступно обновление',
    message: `Новая версия ${version} доступна. Нажмите, чтобы скачать скрипт обновления.`,
    buttons: [{ title: 'Скачать скрипт' }],
    isClickable: true
  }, (notificationId) => {
    chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
      if (id === notificationId && buttonIndex === 0) {
        // Открываем страницу с инструкциями и ссылкой на скачивание скрипта
        chrome.tabs.create({ url: 'instructions.html' });
      }
    });
  });
}

function checkForUpdates() {
  console.log('Проверка обновлений...');
  fetch(serverVersionUrl)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch version info');
      return response.json();
    })
    .then(serverVersionInfo => {
      getLocalVersion(localVersion => {
        console.log(`Локальная версия: ${localVersion}, Серверная версия: ${serverVersionInfo.version}`);
        if (localVersion !== serverVersionInfo.version) {
          console.log(`Доступна новая версия: ${serverVersionInfo.version}.`);
          chrome.storage.local.set({
            updateAvailable: true,
            downloadUrl: serverVersionInfo.downloadUrl
          });
          notifyUpdateAvailable(serverVersionInfo.version, serverVersionInfo.downloadUrl);
        } else {
          console.log('Расширение обновлено.');
          chrome.storage.local.set({ updateAvailable: false });
        }
      });
    })
    .catch(err => console.error('Ошибка при проверке обновлений:', err));
}
// Check for updates every hour
const isolatedTabs = new Map(); // tabId -> domain
const isolatedCookies = new Map(); // tabId -> cookies
const originalCookies = new Map(); // domain -> cookies
const isolatedGroups = new Map(); // tabId -> groupId
const ISOLATION_GROUP_NAME = "Изолированные вкладки";
const TAB_COLORS = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan'
];
let currentColorIndex = 0;

// Функция для получения следующего цвета
function getNextColor() {
  const color = TAB_COLORS[currentColorIndex];
  currentColorIndex = (currentColorIndex + 1) % TAB_COLORS.length;
  return color;
}

// Безопасное создание URL
function tryCreateURL(urlString) {
    try {
      return new URL(urlString);
    } catch (e) {
      console.log('Invalid URL:', urlString);
      return null;
    }
  }
  
  // Безопасная установка куки
  async function safeSetCookie(cookie, url) {
    try {
      const urlObj = new URL(url);
      const baseUrl = `${urlObj.protocol}//${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}`;
  
      const cookieProperties = {
        url: baseUrl + (cookie.path || '/'),
        name: cookie.name,
        value: cookie.value || '',
        domain: cookie.domain,
        path: cookie.path || '/',
        secure: !!cookie.secure,
        httpOnly: !!cookie.httpOnly,
        sameSite: cookie.sameSite || 'lax'
      };
  
      if (cookie.expirationDate && cookie.expirationDate > Date.now() / 1000) {
        cookieProperties.expirationDate = cookie.expirationDate;
      }
  
      delete cookieProperties.hostOnly;
      delete cookieProperties.session;
      delete cookieProperties.storeId;
  
      if (cookieProperties.domain.startsWith('.')) {
        cookieProperties.domain = cookieProperties.domain.slice(1);
      }
  
      Object.keys(cookieProperties).forEach(key => 
        cookieProperties[key] === undefined && delete cookieProperties[key]
      );
  
      console.log('Setting cookie with properties:', cookieProperties);
      await chrome.cookies.set(cookieProperties);
    } catch (e) {
      console.log('Error setting cookie:', {
        name: cookie.name,
        error: e,
        details: cookie,
        stack: e.stack
      });
    }
  }
  
  // Функция для фильтрации и нормализации куки
  function filterValidCookies(cookies) {
    return cookies.filter(cookie => {
      if (!cookie.name || !cookie.domain) {
        return false;
      }
  
      cookie.value = cookie.value || '';
      cookie.path = cookie.path || '/';
      cookie.sameSite = cookie.sameSite || 'lax';
      
      delete cookie.hostOnly;
      delete cookie.session;
      delete cookie.storeId;
  
      return true;
    });
  }
  
  // Безопасное удаление куки
  async function safeRemoveCookie(url, name, domain, path) {
    try {
      const urlObj = new URL(url);
      const baseUrl = `${urlObj.protocol}//${domain.startsWith('.') ? domain.slice(1) : domain}`;
      
      await chrome.cookies.remove({
        url: baseUrl + (path || '/'),
        name: name
      });
    } catch (e) {
      console.log('Error removing cookie:', {
        name: name,
        error: e,
        url: url,
        domain: domain,
        path: path
      });
    }
  }

  // Функция для генерации уникального названия группы
function generateUniqueGroupName(selectionText) {
    const groupNumber = isolatedGroups.size + 1;
    return `🔒${groupNumber} ${selectionText}`;
  }
  
  // Функция для инъекции CSS в вкладку
  function injectCSS(tabId, groupName) {
    const cssCode = `
      body::before {
        content: "Сессия изолирована: 🔒";
        display: block;
        text-align: center;
        background-color: #f0f0f0;
        color: #333;
        font-weight: bold;
        padding: 5px;
        border-bottom: 2px solid #ccc;
        z-index: 9999;
        position: relative;
      }
    `;
    chrome.scripting.insertCSS({
      target: { tabId: tabId },
      css: cssCode
    });
  }

  // Функция для создания изолированной вкладки
async function createIsolatedTab(url,selectionText, sourceTabId = null) {
    const urlObj = tryCreateURL(url);
    if (!urlObj) return null;
    
    const domain = urlObj.hostname;
    
    if (!originalCookies.has(domain)) {
      const cookies = await chrome.cookies.getAll({ domain });
      originalCookies.set(domain, filterValidCookies(cookies));
    }
    
    const currentCookies = await chrome.cookies.getAll({ domain });
    for (const cookie of currentCookies) {
      await safeRemoveCookie(
        `${urlObj.protocol}//${domain}${cookie.path}`,
        cookie.name,
        domain,
        cookie.path
      );
    }
    
    const newTab = await chrome.tabs.create({ url });
    isolatedTabs.set(newTab.id, domain);
  
    // Если есть родительская вкладка, копируем её куки
    if (sourceTabId && isolatedTabs.has(sourceTabId)) {
      const sourceDomain = isolatedTabs.get(sourceTabId);
      
      if (isolatedCookies.has(sourceTabId)) {
        isolatedCookies.set(newTab.id, isolatedCookies.get(sourceTabId));
      }
    }
  
    // Создаем новую группу с уникальным названием
    await chrome.tabs.group({ tabIds: newTab.id });
    const groupId = (await chrome.tabs.get(newTab.id)).groupId;
    
    const uniqueGroupName = generateUniqueGroupName(selectionText);
    await chrome.tabGroups.update(groupId, {
      title: uniqueGroupName,
      collapsed: false,
      color: getNextColor()
    });
  
    isolatedGroups.set(newTab.id, groupId);
  
    // Инъекция CSS для отображения названия группы
    injectCSS(newTab.id, uniqueGroupName);
  
    return newTab;
  }

 //Обновление расширения
chrome.runtime.onStartup.addListener(() => {
  setTimeout(checkForUpdates, 30);
});

chrome.runtime.onInstalled.addListener(() => {
  checkForUpdates();
});

//Вызов контекстного меню
chrome.runtime.onInstalled.addListener(() => {
  const contextMenus = [
    { id: "calllog", title: "Calllog", contexts: ["selection"] },
    { id: "events_ats", title: "События на АТС", contexts: ["selection"] },
    { id: "reg", title: "Регистрация линий", contexts: ["selection"] },
    { id: "ats_ip", title: "SSH в АТС", contexts: ["selection"] },
    { id: "openInTempSession", title: "Открыть в изолированной вкладке", contexts: ["link"] },
    { id: "amocrm", title: "AmoCRM", contexts: ["selection"] }
  ];

  contextMenus.forEach(menu => chrome.contextMenus.create(menu));
});

// Изолированная вкладка из контекстного меню
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "openInTempSession") {
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
              chrome.notifications.create({
                  type: 'basic',
                  iconUrl: 'icons/icon48.png',
                  title: 'Ошибка',
                  message: 'Родительский элемент с классом "sonata-ba-list-field sonata-ba-list-field-integer" не найден или span пуст.'
              });
              createIsolatedTab(info.linkUrl, '', tab.id);
          } else {
              const spanContent = result[0].result;
              chrome.notifications.create({
                  type: 'basic',
                  iconUrl: 'icons/icon48.png',
                  title: 'Содержимое <span>',
                  message: spanContent
              });
              createIsolatedTab(info.linkUrl, spanContent, tab.id);
          }
      });
  } else if (info.menuItemId === "amocrm") {
      const cabNumber = info.selectionText;
      chrome.windows.create({
          url: chrome.runtime.getURL(`Amocrm.html?cab_number=${encodeURIComponent(cabNumber)}`),
          type: "popup",
          width: 800,
          height: 600,
          focused: true
      });
  } else {
      chrome.windows.create({
          url: chrome.runtime.getURL("pop.html"),
          type: "popup",
          focused: true
      }, (win) => {
          setTimeout(() => {
              chrome.tabs.sendMessage(win.tabs[0].id, info, (resp) => {
                  chrome.tabs.update(win.tabs[0].id, { active: true });
              });
          }, 500);
      });
  }
});

// Обработчик для инъекции CSS после полной загрузки страницы
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isolatedTabs.has(tabId)) {
    const groupId = isolatedGroups.get(tabId);
    const groupName = `🔒${groupId}`;
    injectCSS(tabId, groupName);
  }
});

// Обработчик создания новых вкладок
chrome.tabs.onCreated.addListener(async (tab) => {
  // Проверяем, была ли вкладка создана из изолированной вкладки
  const openerTab = tab.openerTabId ? await chrome.tabs.get(tab.openerTabId) : null;
  if (openerTab && isolatedTabs.has(openerTab.id)) {
    // Если URL еще не установлен, ждем его установки
    if (!tab.url || tab.url === 'about:blank') {
      const listener = (tabId, changeInfo, updatedTab) => {
        if (tabId === tab.id && changeInfo.url) {
          // Вместо создания новой вкладки, обновляем текущую
          const domain = new URL(changeInfo.url).hostname;
          isolatedTabs.set(tab.id, domain);
          
          // Копируем куки от родительской вкладки
          if (isolatedCookies.has(openerTab.id)) {
            isolatedCookies.set(tab.id, isolatedCookies.get(openerTab.id));
          }
          
          // Добавляем в ту же группу
          const sourceGroupId = isolatedGroups.get(openerTab.id);
          if (sourceGroupId) {
            chrome.tabs.group({ tabIds: tab.id, groupId: sourceGroupId });
            isolatedGroups.set(tab.id, sourceGroupId);
          }
          
          chrome.tabs.onUpdated.removeListener(listener);
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    } else {
      // Для вкладок с уже установленным URL
      const domain = new URL(tab.url).hostname;
      isolatedTabs.set(tab.id, domain);
      
      if (isolatedCookies.has(openerTab.id)) {
        isolatedCookies.set(tab.id, isolatedCookies.get(openerTab.id));
      }
      
      const sourceGroupId = isolatedGroups.get(openerTab.id);
      if (sourceGroupId) {
        await chrome.tabs.group({ tabIds: tab.id, groupId: sourceGroupId });
        isolatedGroups.set(tab.id, sourceGroupId);
      }
    }
  }
});

// Обработчик обновления вкладки
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
if (changeInfo.status === 'complete') {
  const url = tryCreateURL(tab.url);
  if (!url) return;

  const domain = url.hostname;
  const urlPrefix = `${url.protocol}//${domain}`;
  
  if (isolatedTabs.has(tabId)) {
    console.log('Processing isolated tab update:', tabId);
    
    if (isolatedCookies.has(tabId)) {
      const currentCookies = await chrome.cookies.getAll({ domain });
      const isolatedTabCookies = isolatedCookies.get(tabId);
      
      if (JSON.stringify(currentCookies) !== JSON.stringify(isolatedTabCookies)) {
        console.log('Restoring isolated cookies after update');
        
        for (const cookie of currentCookies) {
          await safeRemoveCookie(
            `${urlPrefix}${cookie.path}`,
            cookie.name,
            domain,
            cookie.path
          );
        }
        
        for (const cookie of isolatedTabCookies) {
          await safeSetCookie(
            cookie,
            `${urlPrefix}${cookie.path}`
          );
        }
      }
    } else {
      console.log('Initial save of isolated cookies');
      const cookies = await chrome.cookies.getAll({ domain });
      if (cookies && cookies.length > 0) {
        const validCookies = filterValidCookies(cookies);
        isolatedCookies.set(tabId, validCookies);
      }
    }
  } else {
    if (originalCookies.has(domain)) {
      const cookies = await chrome.cookies.getAll({ domain });
      if (JSON.stringify(cookies) !== JSON.stringify(originalCookies.get(domain))) {
        const origCookies = originalCookies.get(domain);
        
        for (const cookie of cookies) {
          await safeRemoveCookie(
            `${urlPrefix}${cookie.path}`,
            cookie.name,
            domain,
            cookie.path
          );
        }
        
        for (const cookie of origCookies) {
          await safeSetCookie(
            cookie,
            `${urlPrefix}${cookie.path}`
          );
        }
      }
    }
  }
}
});

// Обработка переключения вкладок
chrome.tabs.onActivated.addListener(async (activeInfo) => {
try {
  const tabId = activeInfo.tabId;
  const tab = await chrome.tabs.get(tabId);
  
  if (!tab.url) return;
  
  const url = tryCreateURL(tab.url);
  if (!url) return;
  
  const domain = url.hostname;
  const urlPrefix = `${url.protocol}//${domain}`;

  if (isolatedTabs.has(tabId)) {
    if (isolatedCookies.has(tabId)) {
      console.log('Restoring isolated cookies on tab activation:', tabId);
      const currentCookies = await chrome.cookies.getAll({ domain });
      const isolatedTabCookies = isolatedCookies.get(tabId);
      
      for (const cookie of currentCookies) {
        await safeRemoveCookie(
          `${urlPrefix}${cookie.path}`,
          cookie.name,
          domain,
          cookie.path
        );
      }
      
      for (const cookie of isolatedTabCookies) {
        await safeSetCookie(
          cookie,
          `${urlPrefix}${cookie.path}`
        );
      }
    }
  } else {
    if (originalCookies.has(domain)) {
      const origCookies = originalCookies.get(domain);
      const currentCookies = await chrome.cookies.getAll({ domain });
      
      if (JSON.stringify(currentCookies) !== JSON.stringify(origCookies)) {
        for (const cookie of currentCookies) {
          await safeRemoveCookie(
            `${urlPrefix}${cookie.path}`,
            cookie.name,
            domain,
            cookie.path
          );
        }
        
        for (const cookie of origCookies) {
          await safeSetCookie(
            cookie,
            `${urlPrefix}${cookie.path}`
          );
        }
      }
    }
  }
} catch (e) {
  console.log('Error in tab activation handler:', e);
}
});

// // Добавляем обработик для webRequest
// chrome.webRequest.onBeforeRequest.addListener(
// async (details) => {
//   if (details.tabId === -1) return;
  
//   const url = tryCreateURL(details.url);
//   if (!url) return;
  
//   const domain = url.hostname;
//   const tabId = details.tabId;

//   if (isolatedTabs.has(tabId) && isolatedCookies.has(tabId)) {
//     const currentCookies = await chrome.cookies.getAll({ domain });
//     const isolatedTabCookies = isolatedCookies.get(tabId);
    
//     if (JSON.stringify(currentCookies) !== JSON.stringify(isolatedTabCookies)) {
//       const urlPrefix = `${url.protocol}//${domain}`;
      
//       for (const cookie of currentCookies) {
//         await safeRemoveCookie(
//           `${urlPrefix}${cookie.path}`,
//           cookie.name,
//           domain,
//           cookie.path
//         );
//       }
      
//       for (const cookie of isolatedTabCookies) {
//         await safeSetCookie(
//           cookie,
//           `${urlPrefix}${cookie.path}`
//         );
//       }
//     }
//   }
// },
// { urls: ["<all_urls>"] }
// );

// Очистка данных при закрытии вкладки
chrome.tabs.onRemoved.addListener((tabId) => {
isolatedTabs.delete(tabId);
isolatedCookies.delete(tabId);
isolatedGroups.delete(tabId);
});

