// func.add('checkoperator', {
//   class: 'API',
//   menu: 'Проверка по оператору',
//   header: 'Проверка по оператору',
//   input: [
//     {type:'textarea', label:'Телефонные номера:', name: 'phones', placeholder:'Введите номеры телефонов'},
//   ],
//   button: 'Определить'  
// },async (...args) => {
//   let form = new FormData(...args);
//   let phones = form.get('phones').match(/(?<=^|\s|>|\;|\:|\))(?:\+|7|8|9|\()[\d\-\(\) ]{8,}\d/g);
//   let result ='';
//   let operators = new Map();
//   for(let phone in phones)
//   {
//     let p = phones[phone].replaceAll(/\D/g, '');
//     p = p.replace(/^8/, "7");
//     result += p+' ';
//     result += await fetch('/checkoperator?phone='+p, {
//       method: 'GET',
//       headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//       }
//       })
//       .then(response => {
//           if (!response.ok) throw new Error(response.status+' '+response.statusText);
//           return response.json();
//       })
//       .then((data) => {
//           if (!data) throw new Error('Нет результатов для отображения');
//           if(JSON.parse(data)['data'].length<1) throw new Error('Нет результатов для отображения');
//           let oper = JSON.parse(data)['data'][0];
//           if(operators.has(oper['operator'])) operators.set(oper['operator'], (operators.get(oper['operator']))+1);
//           else operators.set(oper['operator'], 1);
//           return oper['operator']+' '+oper['region'];
//       })
//       .catch((err) => {
//       return err;
//     });
//     result += '<br><br>';
//   }
//   for (let o of operators) result += o[0] +' - '+o[1]+'<br>';
//   return 'Всего номеров: '+phones.length+'<br>Уникальных операторов: '+operators.size+'<br><br>'+result;
// })