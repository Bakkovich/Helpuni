func.add('linedata', {
  class: 'АТС',
  menu: 'Данные линий',
  header: 'Данные линий',
  input: [
    {type:'text', label:'Номер кабинета:', name: 'cab', placeholder:'Введите номер кабинета'},
    {type:'checkbox', label:' Настроить отображение', name: 'checkbox', onclick: function(){
      let items = new Map([
          ["id", "ID"],
          ["descr", "Название"],
          ["login", "Логин"],
          ["licensed", "Лицензировано"],
          ["subtype", "Подтип"],
          ["audioId", "Аудио ID"],
          ["noLicenseBlocked", "Блокировка без лицензии"],
          ["treeId", "ID дерева"],
          ["viewAccess", "Доступ к просмотру"],
          ["editAccess", "Доступ к редактированию"],
          ["tags", "Теги"],
          ["status", "Статус"],
          ["numberPrefix", "Префикс номера"],
          ["name", "Имя"],
          ["password", "Пароль"],
          ["email", "Электронная почта"],
          ["proxy", "Прокси"],
          ["dtmf", "DTMF"],
          ["authUsername", "Имя пользователя для аутентификации"],
          ["directDial", "Прямой доступ"],
          ["encryption", "Шифрование"],
          ["type", "Тип"],
          ["allow", "Разрешить"],
          ["callLimit", "Лимит вызовов"],
          ["ip", "IP-адрес"],
          ["operatorId", "ID оператора"],
          ["number", "Номер"],
          ["outlineNumber", "Внешний номер"],
          ["linkedNumber", "Связанный номер"],
          ["callerID", "Caller ID"],
          ["setDiversion", "Установка перенаправления"],
          ["chromeApiKey", "Ключ API Google Chrome"],
          ["webphoneHash", "Хэш веб-телефона"],
          ["webphoneComment", "Комментарий веб-телефона"],
          ["fakenum", "Фейк-номер"],
          ["extNumber", "Внешний номер"],
          ["extregNotify", "Уведомление об внешнем номере"],
          ["mobile", "Мобильный"],
          ["mobilePin", "ПИН-код мобильного"],
          ["mobileTransferTime", "Время передачи мобильного"],
          ["redirectPhone", "Перенаправление телефона"],
          ["redirectPin", "ПИН-код перенаправления"],
          ["hidden", "Скрытый"],
          ["ignored", "Игнорируемый"],
          ["lineId", "ID линии"],
          ["crmCallbackType", "Тип обратного вызова CRM"],
          ["personalLine", "Персональный линии"],
          ["sipTreeId", "ID дерева SIP"],
          ["mirrorId", "ID зеркала"],
          ["mainId", "Основной ID"],
          ["activeExtensionId", "ID активного расширения"],
          ["copyId", "ID копии"],
          ["simCard", "SIM-карта"],
          ["addNumbers", "Добавление номеров"],
          ["editableTree", "Редактируемое дерево"],
          ["isSipuniSimCard", "SIPuni SIM-карта"],
          ["isANumber", "А-номер"],
          ["isHotDesk", "Горячий рабочий стол"],
          ["host", "Хост"],
          ["isBot", "Бот"]
      ]);
      if(document.getElementById('linedatainput1').checked)
      {
          let checkboxes = document.createElement("div");
          checkboxes.setAttribute("id", 'checkboxes');
          items.forEach((item, key, map) => {
              let checkbox = document.createElement("input");
              let label = document.createElement("label"); 
              checkbox.setAttribute("type", "checkbox");
              checkbox.setAttribute("name", key);
              if(localStorage[key]) checkbox.setAttribute("checked", 1);
              checkbox.onclick = function(){ 
                  console.log(checkbox.checked);
                  if(checkbox.checked) {
                      localStorage.setItem(key, true)
                      checkbox.setAttribute("checked", 1);
                  }
                  else {
                      localStorage.removeItem(key);
                      checkbox.removeAttribute("checked");
                  }
              }
              label.style = 'font:inherit; color:inherit;';
              label.textContent = item;
              checkboxes.append(label);
              label.prepend(checkbox);
          });
          document.getElementById('linedata').getElementsByTagName('button')[0].before(checkboxes);
      }
      else document.getElementById('checkboxes').remove();
    }, notrequired:'1'}
  ],
  button: 'Запросить'  
},async (...args) => {
  let form = new FormData(...args);
  let items = new Map([
      ["id", "ID"],
      ["descr", "Название"],
      ["login", "Логин"],
      ["licensed", "Лицензировано"],
      ["subtype", "Подтип"],
      ["audioId", "Аудио ID"],
      ["noLicenseBlocked", "Блокировка без лицензии"],
      ["treeId", "ID дерева"],
      ["viewAccess", "Доступ к просмотру"],
      ["editAccess", "Доступ к редактированию"],
      ["tags", "Теги"],
      ["status", "Статус"],
      ["numberPrefix", "Префикс номера"],
      ["name", "Имя"],
      ["password", "Пароль"],
      ["email", "Электронная почта"],
      ["proxy", "Прокси"],
      ["dtmf", "DTMF"],
      ["authUsername", "Имя пользователя для аутентификации"],
      ["directDial", "Прямой доступ"],
      ["encryption", "Шифрование"],
      ["type", "Тип"],
      ["allow", "Разрешить"],
      ["callLimit", "Лимит вызовов"],
      ["ip", "IP-адрес"],
      ["operatorId", "ID оператора"],
      ["number", "Номер"],
      ["outlineNumber", "Внешний номер"],
      ["linkedNumber", "Связанный номер"],
      ["callerID", "Caller ID"],
      ["setDiversion", "Установка перенаправления"],
      ["chromeApiKey", "Ключ API Google Chrome"],
      ["webphoneHash", "Хэш веб-телефона"],
      ["webphoneComment", "Комментарий веб-телефона"],
      ["fakenum", "Фейк-номер"],
      ["extNumber", "Внешний номер"],
      ["extregNotify", "Уведомление об внешнем номере"],
      ["mobile", "Мобильный"],
      ["mobilePin", "ПИН-код мобильного"],
      ["mobileTransferTime", "Время передачи мобильного"],
      ["redirectPhone", "Перенаправление телефона"],
      ["redirectPin", "ПИН-код перенаправления"],
      ["hidden", "Скрытый"],
      ["ignored", "Игнорируемый"],
      ["lineId", "ID линии"],
      ["crmCallbackType", "Тип обратного вызова CRM"],
      ["personalLine", "Персональный линии"],
      ["sipTreeId", "ID дерева SIP"],
      ["mirrorId", "ID зеркала"],
      ["mainId", "Основной ID"],
      ["activeExtensionId", "ID активного расширения"],
      ["copyId", "ID копии"],
      ["simCard", "SIM-карта"],
      ["addNumbers", "Добавление номеров"],
      ["editableTree", "Редактируемое дерево"],
      ["isSipuniSimCard", "SIPuni SIM-карта"],
      ["isANumber", "А-номер"],
      ["isHotDesk", "Горячий рабочий стол"],
      ["host", "Хост"],
      ["isBot", "Бот"]
    ]);
  let html = '';
  return await fetch('/line_data?cab_number='+form.get('cab'), {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
    })
    .then(response => {
        if (!response.ok) throw new Error(response.status+' '+response.statusText);
        return response.json();
    })
    .then((data) => {
      console.log(data);
        if (!data) throw new Error('Нет результатов для отображения');
        if (!data.success) throw new Error('Неуспешный запрос');
        for(let line of data.items)
          { 
              html+='<pre class="result" style="margin-top:0px;">';
              items.forEach((item, key, map) => {
                  if(!localStorage[key]) return;
                  if(key == "tags")
                  {
                      html+=item+':\n';
                      for(let tag in line.tags) html+='\tТег '+tag+': '+line.tags[tag]+'\n';
                      return;
                  }
                  if(key == "addNumbers")
                  {
                      html+=item+':\n';
                      for(let addnumber of line.addNumbers) html+='\tID '+addnumber.id+': '+addnumber.number+'\n';
                      return;
                  }
                  html+=item+': '+line[key]+'\n';
              });
              html+='</pre>';
          }
          return html;
    })
    .catch((err) => {
    return err;
  });
})


