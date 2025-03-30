func.add('Line_data', {
    class: 'CabAPI',
    menu: 'Линии в кабинете',
    header: 'Получить данные о линиях в кабинете',
    input: [
      {type:'text', label:'Номер кабинета', name: 'cab_number', placeholder:'Введите номер',notrequired:'1'}
    ],
    button: 'Добавить'  
  },async (...args) => {
    let form = new FormData(...args);
    let cab_number = form.get('cab_number');
  }
)