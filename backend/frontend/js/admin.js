func.add('admin', {
    class: 'Админка',
    menu: 'Пользователи',
    is_admin: true,
    html: () => {
      const table = document.createElement("table");
      table.setAttribute("id", "container");
      table.setAttribute("class", "userstable");

      fetch('/auth/all_users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        })
        .then(response => {
            if (!response.ok) throw new Error(response.status+'\n'+response.statusText);
            return response.json();
        })
        .then(data => {
            if(data.detail) return data.detail;
            // <thead>
            const theaders = ['ID','Имя','Фамилия','E-mail','Уровень доступа', 'Дата регистрации','Дата изменения','Действия'];
            const thead = document.createElement("thead");
            const trhead = document.createElement("tr");
            thead.setAttribute('align', 'left');
            for(let theader of theaders) {
                let th = document.createElement("th");
                th.textContent = theader;
                trhead.append(th);
            }
            thead.append(trhead);
            table.append(thead);
            // </thead>
            // <tbody>
            const tbody = document.createElement("tbody");
            for(let user of data) {
              let tr = document.createElement("tr");
              tr.setAttribute("id", 'tr'+user.id);
              let level = 'Пользователь';
              if(user.is_admin && user.is_service) level = 'Сервисный администратор';
              else if (user.is_admin) level = 'Администратор';
              else if (user.is_service) level = 'Сервис';

              const regdates = new Date(user.created_at);
              const editdates = new Date(user.updated_at);
              const regdate = `${regdates.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} ${regdates.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
              const editdate = `${editdates.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} ${editdates.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
             
              let actions = document.createElement("div");
              let editbtn = document.createElement("a");
              let deletebtn = document.createElement("a");
              editbtn.setAttribute("style", "cursor:ponter;");
              deletebtn.setAttribute("style", "cursor:ponter;");
              editbtn.setAttribute("id", 'e'+user.id);
              deletebtn.setAttribute("id", 'd'+user.id);
              editbtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 24 24"><path fill="currentColor" d="m7 17.013l4.413-.015l9.632-9.54c.378-.378.586-.88.586-1.414s-.208-1.036-.586-1.414l-1.586-1.586c-.756-.756-2.075-.752-2.825-.003L7 12.583zM18.045 4.458l1.589 1.583l-1.597 1.582l-1.586-1.585zM9 13.417l6.03-5.973l1.586 1.586l-6.029 5.971L9 15.006z"/><path fill="currentColor" d="M5 21h14c1.103 0 2-.897 2-2v-8.668l-2 2V19H8.158c-.026 0-.053.01-.079.01c-.033 0-.066-.009-.1-.01H5V5h6.847l2-2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2"/></svg>';
              deletebtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 24 24"><path fill="#d14543" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"/></svg>';
              editbtn.onclick = function () {

                document.getElementById('u1'+user.id).innerHTML = '<input style="padding-right:0px; margin-bottom:0px;" type="text" id="i1'+user.id+'" placeholder="Имя" value="'+user.first_name+'">';
                document.getElementById('u2'+user.id).innerHTML = '<input style="padding-right:0px; margin-bottom:0px;" type="text" id="i2'+user.id+'" placeholder="Фамилия" value="'+user.last_name+'">';
                document.getElementById('u3'+user.id).innerHTML = '<input style="padding-right:0px; margin-bottom:0px;" type="text" id="i3'+user.id+'" placeholder="E-mail" value="'+user.email+'">';
                //document.getElementById('u4'+user.id).innerHTML = '<select id="i4'+user.id+'"><option value="user">Пользоветель</option><option value="admin">Администратор</option><option value="service">Сервис</option><option value="serviceadmin">Сервисный администратор</option></select>';
                
                //
                if(user.is_admin && user.is_service) document.getElementById('u4'+user.id).innerHTML = '<select id="i4'+user.id+'"><option value="user">Пользоветель</option><option value="admin">Администратор</option><option value="service">Сервис</option><option value="serviceadmin" selected>Сервисный администратор</option></select>';
                else if (user.is_admin) document.getElementById('u4'+user.id).innerHTML = '<select id="i4'+user.id+'"><option value="user">Пользоветель</option><option value="admin" selected>Администратор</option><option value="service">Сервис</option><option value="serviceadmin">Сервисный администратор</option></select>';
                else if (user.is_service) document.getElementById('u4'+user.id).innerHTML = '<select id="i4'+user.id+'"><option value="user">Пользоветель</option><option value="admin">Администратор</option><option value="service" selected>Сервис</option><option value="serviceadmin">Сервисный администратор</option></select>';
                else document.getElementById('u4'+user.id).innerHTML = '<select id="i4'+user.id+'"><option value="user" selected>Пользоветель</option><option value="admin">Администратор</option><option value="service">Сервис</option><option value="serviceadmin">Сервисный администратор</option></select>';
                //
                document.getElementById('e'+user.id).style = 'display:none';
                document.getElementById('d'+user.id).style = 'display:none';

                let selection = document.getElementById('i4'+user.id);
                let is_service = user.is_service;
                let is_admin = user.is_admin;
                selection.addEventListener("change", function() {
                  switch(selection.value) {
                    case 'user':
                      is_service = false;
                      is_admin = false;
                      break;
                    case 'admin':
                      is_admin = true;
                      is_service = false;
                      break;
                    case 'service':
                      is_admin = false;
                      is_service = true;
                      break;
                    case 'serviceadmin':
                      is_service = true;
                      is_admin = true;
                      break;
                  }
                });
                

                let allow = document.createElement("a");
                let decline = document.createElement("a");
                allow.setAttribute("style", "cursor:pointer;");
                decline.setAttribute("style", "cursor:pointer;");
                allow.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 24 24"><path fill="#23d93e" d="m9 20.42l-6.21-6.21l2.83-2.83L9 14.77l9.88-9.89l2.83 2.83z"/></svg>';
                decline.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 48 48"><path fill="#d14543" fill-rule="evenodd" stroke="#d14543" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="m6 11l5-5l13 13L37 6l5 5l-13 13l13 13l-5 5l-13-13l-13 13l-5-5l13-13z" clip-rule="evenodd"/></svg>';
               
                allow.onclick = function () {
                  let requestData = {
                    "id": user.id,
                    "is_service": is_service,
                    "is_admin": is_admin,
                    "first_name": document.getElementById('i1'+user.id).value,
                    "last_name": document.getElementById('i2'+user.id).value,
                    "email": document.getElementById('i3'+user.id).value,
                    "sipun_login": user.sipun_login,
                    "sipun_password": user.sipun_password,
                    "Login_ssh": user.Login_ssh,
                    "key_ssh": user.key_ssh
                  }

                  fetch('/auth/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                  })
                  .then(response => {
                      if (!response.ok) {
                        throw new Error(response.status+'\n'+response.statusText);
                      }
                      return response.json();
                  })
                  .then(data => {
                      console.log(data);
                      document.getElementById('u1'+user.id).innerHTML = requestData.first_name;
                      document.getElementById('u2'+user.id).innerHTML = requestData.last_name;
                      document.getElementById('u3'+user.id).innerHTML = requestData.email;
                      if(is_admin && is_service) level = 'Сервисный администратор';
                      else if (is_admin) level = 'Администратор';
                      else if (is_service) level = 'Сервис';
                      else level = 'Пользователь';
                      document.getElementById('u4'+user.id).innerHTML = level;
                      document.getElementById('e'+user.id).style = 'display:inline';
                      document.getElementById('d'+user.id).style = 'display:inline';
                      allow.remove();
                      decline.remove();
                  });

                }
                decline.onclick = function () {
                  document.getElementById('u1'+user.id).innerHTML = user.first_name;
                  document.getElementById('u2'+user.id).innerHTML = user.last_name;
                  document.getElementById('u3'+user.id).innerHTML = user.email;
                  document.getElementById('u4'+user.id).innerHTML = level;
                  document.getElementById('e'+user.id).style = 'display:inline';
                  document.getElementById('d'+user.id).style = 'display:inline';
                  allow.remove();
                  decline.remove();
                }
                
                document.getElementById('u7'+user.id).append(allow);
                document.getElementById('u7'+user.id).append(decline);

              }

              deletebtn.onclick = function () {
                result = confirm('Удалить пользователя '+user.first_name+' '+user.last_name+'?');
                if(result) {
                  let reqdata = {'id': user.id};
                  fetch('/auth/Delete', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reqdata)
                  })
                  .then(response => {
                    if (!response.ok) {
                      alert('Ошибка '+response.status+'\n'+response.statusText);
                      throw new Error(response.status+'\n'+response.statusText);
                    }
                    alert('Пользователь '+user.first_name+' '+user.last_name+' удален');
                    document.getElementById('tr'+user.id).remove();
                    return response.json();
                  })
                  .then(data => {
                      console.log(data);
                  });
                }
              }
              actions.append(editbtn);
              actions.append(deletebtn);  
              let userdataset = [user.id,user.first_name,user.last_name,user.email,level,regdate,editdate,actions];
              for(let userdata in userdataset) {
                let td = document.createElement("td");
                td.append(userdataset[userdata]);
                td.setAttribute("id", 'u'+userdata+user.id);
                tr.append(td);
              }
              tbody.append(tr);
            }
            table.append(tbody);
            //</tbody>
        })
        .catch(err => {
            console.error(err);
        }); 
      return table;
    } 
  },async (...args) => {
    return true;
  })

func.add('register', {
    header: 'Регистрация',
    class: 'Админка',
    menu: 'Регистрация',
    input: [
      {label:'Имя:', name: 'first_name', placeholder:'Имя'},
      {label:'Фамилия:', name: 'last_name', placeholder:'Фамилия'},
      {label:'E-mail:', name: 'email', placeholder:'E-mail'},
      {label:'Пароль:', name: 'password', placeholder:'Пароль'},
    ],
    button: 'Зарегистрировать'  
  },async (...args) => {
      let form = new FormData(...args);
      let requestData ={
        "email": form.get('email'),
        "password": form.get('password'),
        "first_name": form.get('first_name'),
        "last_name": form.get('last_name'),
      };
      return await fetch('/auth/register', {
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
        return data.message;
    })
    .catch(err => {
        console.error(err);
        return err;
    });
  })