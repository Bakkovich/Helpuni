// func.add('CallRecordLink', {
//     class: 'API',
//     menu: 'Формирование записи звонка',
//     header: 'Формирование ссылки на запись разговора',
//     input: [
//       {type:'text', label:'ID:', name: 'id', placeholder:'Введите id'},
//       {type:'text', label:'User:', name: 'user', placeholder:'Введите user'},
//       {type:'text', label:'Secret:', name: 'secret', placeholder:'Введите secret'}
//     ],
//     button: 'Отправить запрос'  
//   },async (...args) => {
//     const form = new FormData(...args);   
//     const id = form.get('id');
//     const user = form.get('user');
//     const secret = form.get('secret');
//     const requestData = { id, user, secret };
//     return await fetch('/record_link', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(requestData)
//     })
//     .then(response => {
//         if (!response.ok) throw new Error('Network response was not ok');
//         return response.json();
//     })
//     .then(data => {
//         if(!document.getElementById('result').innerText) {
//             let btn = document.createElement("button");
//             btn.textContent = 'Скопировать ссылку'
//             btn.onclick = function() {
//             navigator.clipboard.writeText(document.querySelector("#result").innerText)
//                 .then(function() {
//                     btn.setCustomValidity('Ссылка скопирована в буфер обмена');
//                     btn.reportValidity();
//                 })
//                 .catch(function(error) {
//                     btn.setCustomValidity(error);
//                     btn.reportValidity();
//                 });
//             }
//             document.getElementById('container').appendChild(document.createElement("br"));
//             document.getElementById('container').appendChild(btn);
//         }
//         return data.link;
//     })
//     .catch(error => {
//         console.error('There has been a problem with your fetch operation:', error);
//         return 'Ошибка при запросе. Пожалуйста, попробуйте еще раз.';
//     });
// })

// func.add('GetCallById', {
//     class: 'API',
//     menu: 'Найти звонок по ID',
//     header: 'Найти звонок по ID',
//     input: [
//       {type:'text', label:'Номер кабинета:', name: 'admin_url', placeholder:'Укажите номер личного кабинета Sipuni',notrequired:'1'},
//       {type:'text', label:'ID звонка:', name: 'callid', placeholder:'ID звонка',notrequired:'1'}
//     ],
//     button: 'Найти'  
//   },async (...args) => {
//     let form = new FormData(...args);
//     return await fetch('/getcallbyid?cab_number='+form.get('admin_url')+'&call_id='+form.get('callid'), {
//       method: 'GET',
//       headers: {
//           'Content-Type': 'application/json'
//       }
//       })
//       .then(response => {
//           if (!response.ok) throw new Error(response.status+' '+response.statusText);
//           return response.json();
//       })
//       .then((data) => {
//           if (!data) throw new Error('Нет результатов для отображения');
//           if(data['error']) return data['error'];
//           let record = '';
//           if(!data['callrecordlink']) record = 'Запись разговора отсутствует';
//           else record = 'Запись разговора:<br><audio controls src="'+data['callrecordlink']+'"></audio><br>Ссылка на запись разговора: <br><textarea>'+data['callrecordlink']+'</textarea>';
//           return 'ID: '+data['id']+'<br>'+'Тип: '+data['type']+'<br>Схема: '+data['scheme']+'<br>Откуда: '+data['from']+'<br>Куда: '+data['to']+'<br>Кто ответил: '+data['answer']+'<br>Длительность звонка: '+data['duration']+'<br>Длительность разговора: '+data['talkduration']+'<br>Время ответа: '+data['answerduration']+'<br>'+record;
//       })
//       .catch((err) => {
//       return err;
//     });
// })