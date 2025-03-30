func.add('amoAddCall', {
    class: 'AmoCRM',
    menu: 'Добавить звонок',
    is_service: true,
    header: 'Добавить звонок в AmoCRM',
    input: [
      {type:'text', label:'Номер кабинета:', name: 'admin_url', placeholder:'Укажите номер кабинета'},
      {type:'text', label:'ID звонка:', name: 'callid', placeholder:'Укажите ID звонка'},
      {type:'checkbox', label:'Заполнить вручную', name: 'amocheckbox', onclick: function(){createForm('amoAddCallEdit')}, notrequired:'1'}
    ],
    button: 'Найти звонок'  
  },async (...args) => {
    let form = new FormData(...args);
    let result ='';
    return await fetch('/amo/addcallinfo?cab_number='+form.get('admin_url')+'&call_id='+form.get('callid'), {
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
          if (!data) throw new Error('Нет результатов для отображения');
          if (Object.keys(data).length != 2){
            if ((Object.keys(data).length == 1)&&(data['error'])) throw new Error(data['error']);
            throw new Error('Фатальная ошибка');
          }
          if(data[1]['error']) console.log('Ошибка с CRM'+data[1]['error']);
          else result += 'Домен: '+data[1]['domain']+'<br>';
          result += 'Timestamp: '+data[0]['created_at']+'<br>';
          result += 'Номер телефона: '+data[0]['phone']+'<br>';
          result += 'Ответственный: '+data[0]['created_by'];
          if(!data[1]['error']) result += ' '+data[1]['responsible']+'<br>';
          else result += '<br>';
          result += 'Направление: '+data[0]['direction']+'<br>';
          result += 'Длительность звонка: '+data[0]['duration']+' сек.<br>';
          result += 'Результат: '+data[0]['call_result']+'<br>';
          result += 'Статус: '+data[0]['call_status']+'<br>';
          if(data[0]['link']){
            result += 'Запись разговора:<br><audio controls src="'+data[0]['link']+'"></audio><br>';
            result += 'Ссылка на запись разговора: <a href='+data[0]['link']+'>'+data[0]['link']+'</a>';
          }
          let btn = document.createElement("button");
          btn.textContent = 'Добавить звонок'; 
          btn.style = 'margin-top:4vh';
          btn.onclick = async function() {
            if(data[1]['error']) {
                btn.setCustomValidity('Нет информации из AmoCRM');
                btn.reportValidity();
                return;
            }
            btn.remove();
            document.getElementById('loader').style.display = 'block';
            let formData = document.createElement("form");
            let requestData ={
                "domain": data[1]['domain'],
                "token": data[1]['token'],
                "duration": data[0]['duration'],
                "phone": data[0]['phone'],
                "link": data[0]['link'],
                "direction": data[0]['direction'],
                "call_status": data[0]['call_status'],
                "created_by": data[0]['created_by'],
                "created_at": data[0]['created_at']
            };
            for (let name in requestData) {
                let input = document.createElement("input");
                input.setAttribute("name", name);
                input.setAttribute("value", requestData[name]);
                formData.append(input)
              }
            await func.run('amoAddCallEdit', formData)
            .then(data =>{
                document.getElementById('result').innerText = data;
                document.getElementById('loader').style.display = 'none';
            })
          }
          if(document.getElementById('amoaddcallbtn')) document.getElementById('amoaddcallbtn').remove();
          btn.setAttribute('id','amoaddcallbtn');
          document.getElementById('container').appendChild(btn);
          return result;
      })
      .catch((err) => {
      return err;
    });
})
func.add('amoAddCallEdit', {
    header: 'Добавить звонок в AmoCRM',
    input: [
      {label:'Домен:', name: 'domain', placeholder:'domain.amocrm.ru'},
      {label:'Токен:', name: 'token', placeholder:'oAuth_access_key'},
      {label:'Timestamp:', name: 'created_at', placeholder:'Timestamp'},
      {label:'Номер телефона:', name: 'phone', placeholder:'Номер контакта'},
      {label:'Ответственный:', name: 'created_by', placeholder:'ID сотрудника из AmoCRM'},
      {label:'Длительность звонка:', name: 'duration', placeholder:'Длительность звонка в секундах'},
      {label:'Ссылка на запись разговора:', name: 'link', placeholder:'Ссылка на запись разговора', value:'', notrequired:'1'},
      {type:'label', label:'Направление:'},
      {type:'radio', label:'Входящий', name: 'direction', value:'inbound'},
      {type:'radio', label:'Исходящий', name: 'direction', value:'outbound', style:'margin-bottom:4vh'},
      {type:'label', label:'Статус:'},
      {type:'radio', label:'Отвеченный', name: 'call_status', value: '4'},
      {type:'radio', label:'Неотвеченный', name: 'call_status', style:'margin-bottom:8vh', value: '6'},
      {type:'checkbox', label:'Заполнить вручную', name: 'amocheckbox', onclick: function(){createForm('amoAddCall')}, notrequired:'1', checked:'1'}
    ],
    button: 'Добавить звонок'  
  },async (...args) => {
      let form = new FormData(...args);
      let requestData ={
        "domain": form.get('domain'),
        "token": form.get('token'),
        "duration": form.get('duration'),
        "link": form.get('link'),
        "phone": form.get('phone'),
        "direction": form.get('direction'),
        "created_by": form.get('created_by'),
        "created_at": form.get('created_at')
      };
      if(form.get('call_status')=='4') requestData.call_status = 4;
      else {
        if(requestData.direction == 'inbound') requestData.call_status = 2;
        else requestData.call_status = 6;
      }
      return await fetch('/amo/addcall', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) throw new Error(response.status+' '+response.statusText);
        return response.json();
    })
    .then(data => {
        data = JSON.parse(data);
        console.log(data);
        if(data.errors.length>0) return data.errors[0].title+'\n'+data.errors[0].detail;
        if(data._embedded.calls.length<1) return 'Добавили '+data._embedded.calls.length+'звонков';
        let result = '';
        for(let i=0; i<data._embedded.calls.length; i++) {
            result += 'ID добавленного примечания: '+data._embedded.calls[i].id+'\n';
            result += 'ID сущности, в которую добавлен звонок: '+data._embedded.calls[i].entity_id+'\n';
            result += 'Тип сущности, в которую добавили звонок: '+data._embedded.calls[i].entity_type+'\n';
            result += 'Данные вложенных сущностей:\n';
            result += 'ID: '+data._embedded.calls[0]._embedded.entity.id+' | Links: '+data._embedded.calls[0]._embedded.entity._links.self.href+'\n';
        }
        return result;
    })
    .catch(err => {
        console.error(err);
        return err;
    });
  })


// func.add('AmoGetContact', {
//     class: 'AmoCRM',
//     menu: 'Проверка сущностей',
//     header: 'Запрос сущностей из amoCRM',
//     input: [
//       {type:'text', label:'Номер кабинета:', name: 'cab_number', placeholder:'Укажите номер личного кабинета Sipuni'},
//       {type:'text', label:'Номер телефона:', name: 'phone_number', placeholder:'Введите номер телефона'},
//     ],
//     button: 'Получить информацию'  
//   },async (...args) => {
//     const form = new FormData(...args);   
//     const adminUrl = form.get('cab_number');
//     const phone = form.get('phone_number');
//     let resultPlaceholder = '';
 
//     return await fetch(`/contacts_by_cab_number_and_phone?cab_number=${encodeURIComponent(adminUrl)}&phone_number=${encodeURIComponent(phone)}`, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json'
//             }
//     })
//     .then(response => {
//     if (!response.ok) {
//         throw new Error('Network response was not ok');
//        }
//         return response.json();
//     })
//         .then(data => {
//             if (data && data.length > 0) {
//                 console.log(data);
//                 data.forEach(item => {
//                     if (item.Предупреждение) {
//                         resultPlaceholder += `<p class="warning">${item.Предупреждение}</p>`;
//                     } else {
//                         let html = `<div style="margin-bottom: 20px;">`;
//                         html += `<p><strong>Имя:</strong> ${item["Имя"]}</p>`;
//                         html += `<p><strong>Ссылка на контакт:</strong> <a href="${item["Ссылка на контакт"]}" target="_blank">${item["Ссылка на контакт"]}</a></p>`;
//                         html += `<p><strong>ID Контакта:</strong> ${item["ID Контакта"]}</p>`;
//                         html += `<p><strong>Ответственный:</strong> ${item["Ответственный"]}</p>`;
//                         if (item["Сделки"] && item["Сделки"].length > 0) {
//                             html += `<p><strong>Сделки:</strong></p>`;
//                             item["Сделки"].forEach(deal => {
//                                 let dealClass = deal["Статус"] === "Открыта" ? "open" : "closed";
//                                 html += `<p class="${dealClass}">`;
//                                 html += `${deal["Статус"]}: <a href="${deal["Ссылка"]}" target="_blank">${deal["Ссылка"]}</a>`;
//                                 if (deal["Статус"] === "Открыта") {
//                                     html += `<br><span class="open">Воронка: ${deal["Воронка"]}</span>`;
//                                     html += `<br><span class="open">Этап: ${deal["Этап"]}</span>`;
//                                 } else {
//                                     html += `<br>Воронка: ${deal["Воронка"]}`;
//                                     html += `<br>Этап: ${deal["Этап"]}`;
//                                 }
//                                 if (deal["Время закрытия"]) {
//                                     html += `<br>Закрыта ${deal["Время закрытия"]}`;
//                                 }
//                                 html += `</p>`;
//                             });
//                         }
//                         html += `</div>`;
//                         resultPlaceholder += html;
//                     }
//                 });
//                 console.log(resultPlaceholder);
//                 return resultPlaceholder;
//             } else {
//                 resultPlaceholder = '<p>Нет результатов для отображения.</p>';
//             }
//            
//        })
//    .catch(error => {
//        console.error('There has been a problem with your fetch operation:', error);
//        resultPlaceholder = '<p class="warning">Ошибка при запросе. Пожалуйста, попробуйте еще раз.</p>';
//    });
//  })
  

