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

export default function checkForUpdates() {
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