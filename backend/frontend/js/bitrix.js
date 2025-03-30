func.add('bitrixAddCall', {
    class: 'Bitrix24',
    menu: 'Добавить звонок',
    header: 'Добавить звонок в Bitrix24',
    input: [
      {type:'text', label:'Админская ссылка:', name: 'admin_url', placeholder:'https://sipuni.com/l?t=',notrequired:'1'},
      {type:'text', label:'ID звонка:', name: 'callid', placeholder:'Укажите ID звонка',notrequired:'1'},
      {type:'text', label:'Ссылка на запись разговора:', name: 'recordurl', placeholder:'Ссылка на запись разговора',notrequired:'1'}
    ],
    button: 'Добавить'  
  },async (...args) => {
    let form = new FormData(...args);
    let admin_url;
    try { 
        admin_url = new URL(form.get('admin_url'));
    } catch (err) {
        return 'Это не ссылка!'
    }
    if(!admin_url.searchParams.get('t')) return 'Неверная ссылка!';
    return await fetch('/bitrix/addcall?t='+admin_url.searchParams.get('t')+'&callid='+form.get('callid'), {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      }
      })
      .then(response => {
          if (!response.ok) throw new Error(response.status+' '+response.statusText);
          return response.text();
      })
      .then((data) => {
          if (!data) throw new Error('Нет результатов для отображения');
          return data;
      })
      .catch((err) => {
      return err;
    });
})
func.add('bitrixGetContact', {
    class: 'Bitrix24',
    menu: 'Проверка сущностей',
    header: 'Запрос сущностей из Bitrix24',
    input: [
      {type:'text', label:'Админская ссылка:', name: 'admin_url', placeholder:'https://sipuni.com/l?t=',notrequired:'1'},
      {type:'text', label:'Номер телефона:', name: 'phone', placeholder:'Укажите номер телефона',notrequired:'1'}
    ],
    button: 'Проверить'  
  },async (...args) => {
    let form = new FormData(...args);
    let admin_url;
    try {
        admin_url = new URL(form.get('admin_url'));
    } catch (err) {
        return 'Это не ссылка!'
    }
    if(!admin_url.searchParams.get('t')) return 'Неверная ссылка!';
    return await fetch('/bitrix/getcontacts?t='+admin_url.searchParams.get('t')+'&callid='+form.get('phone'), {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      }
      })
      .then(response => {
          if (!response.ok) throw new Error(response.status+' '+response.statusText);
          return response.text();
      })
      .then((data) => {
          if (!data) throw new Error('Нет результатов для отображения');
          return data;
      })
      .catch((err) => {
      return err;
    });
})
func.add('bitrixGetSettings', {
    class: 'Bitrix24',
    menu: 'Настройки интеграции',
    header: 'Настройки интеграции Bitrix24',
    input: [
      {type:'text', label:'Админская ссылка:', name: 'admin_url', placeholder:'https://sipuni.com/l?t=',notrequired:'1'}
    ],
    button: 'Синхронизировать'  
  },async (...args) => {
    let form = new FormData(...args);
    let admin_url;
    try {
        admin_url = new URL(form.get('admin_url'));
    } catch (err) {
        return 'Это не ссылка!'
    }
    if(!admin_url.searchParams.get('t')) return 'Неверная ссылка!'; 
    return await fetch('/bitrix/getsettings?t='+admin_url.searchParams.get('t'), {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      }
      })
      .then(response => {
          if (!response.ok) throw new Error(response.status+' '+response.statusText);
          return response.text();
      })
      .then((data) => {
          if (!data) throw new Error('Нет результатов для отображения');
          return data;
      })
      .catch((err) => {
      return err;
    });
})