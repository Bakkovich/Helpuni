document.addEventListener('submit', function(event) {
  event.preventDefault(); 
  request(event.target);
});
document.addEventListener("DOMContentLoaded", function() {
   fetch('/auth/me', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    })
    .then(response => {
        return response.json();
    })
    .then((data) => {
      if(data.id) {
        func.createMenu(data);
        document.getElementById('profile').style.display = 'flex';
        document.getElementById('username').innerHTML = data.first_name;
        document.getElementById('logout').onclick = function(){
          fetch('/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            })
          .then(response => {
            if (!response.ok) throw new Error(response.status+' '+response.statusText);
            return response.json();
          })
          .then(data => {
            location.reload(true);
          })
        }
      }
      else {
        document.getElementById('menubtn').style.display = 'none';
        document.getElementById('loginbtn').style.display = 'block';
        document.getElementById('regbtn').style.display = 'block';
      }
    })
    .catch((err) => {
    return err;
  });
  if(window.location.hash) createForm(window.location.hash.replace('#',''));  
})


async function request(target) {
  document.getElementById('loader').style.display = 'block';
  let result = await func.run(target.getAttribute('id'),target);
  document.getElementById('loader').style.display = 'none';
  document.getElementById('result').innerHTML = result;
}
function openNav() {
  document.getElementById("mySidenav").style.width = "320px";
}
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}
let func = new function() {
  let funcs = [];
  let forms = [];
  let menus = new Set();
  this.add = function() {
      if (arguments.length!=3) return console.error('Ошибка');
      funcs[arguments[0]] = arguments[2];
      forms[arguments[0]] = arguments[1];
      forms[arguments[0]].id = arguments[0];
      if(arguments[1].class) menus.add(arguments[1].class);
  };
  this.run = function(name, ...args) {
      if (name && name in funcs) return funcs[name](...args);
      return undefined;
  };
  this.form  = function(name) {
    if (name && name in forms) return forms[name];
    return undefined;
  }
  this.createMenu = function(user) {
    let ul = document.createElement("ul");
    let menuid = 0;
    for (let menuItem of menus) {
      if(!user.is_admin && (menuItem == 'Админка')) continue;
      menuid++;
      let amount = 0;
      let li = document.createElement("li");
      let span = document.createElement("span");
      let p = document.createElement("p");
      let arrow = document.createElement("i");
      p.textContent = menuItem;
      arrow.classList.add('arrow');
      span.append(p);
      span.append(arrow);
      let liul = document.createElement("ul");
      for (let item in forms) {
        if(forms[item].is_service && (!user.is_service || !user.is_admin)) continue;
        if(forms[item].is_admin && !user.is_admin) continue;
        if(forms[item].class == menuItem) {
          let liulli = document.createElement("li");
          let a = document.createElement("a");  
          a.setAttribute("href", '#'+forms[item].id);
          a.onclick = function(event) {
            createForm(forms[item].id);
            for (let elem of document.getElementsByClassName('form-active')) elem.classList.remove('form-active');
            event.currentTarget.parentNode.classList.add('form-active');
          }
          a.textContent = forms[item].menu;
          liulli.append(a);
          liul.append(liulli);
          amount++;
        }
      }
      let liid = "menu"+menuid;
      liul.setAttribute("id", liid);
      span.onclick = function(event) {
        let element = document.getElementById("mySidenav").querySelectorAll('ul > li > ul');        
        for (let elem of element) {
          elem.style.height='0px';
          elem.parentNode.querySelector('span').classList.remove('menu-active');
        }
        if(event.target.matches('span')) event.target.classList.add('menu-active');
        else event.target.parentNode.classList.add('menu-active');
        document.getElementById(liid).style.height=(amount*67)+'px';
      }  
      li.append(span);
      li.append(liul);
      ul.append(li);
    }
    document.getElementById("mySidenav").append(ul);
  }
}
function createForm(id) {
  let f = func.form(id);
  if(document.getElementById("container")) {
  document.getElementById("container").remove(); 
  }
  else document.getElementById('logo').style.display='none';
  if(f.input) {
    let div = document.createElement("div");
    let form = document.createElement("form");
    div.setAttribute("class", "container");
    div.setAttribute("id", "container");
    if(f.header) {
      let h2 = document.createElement("h2");
      h2.textContent = f.header;
      div.append(h2);
    }
    if(f.id) form.setAttribute("id", f.id);
    for(let i=0; i<f.input.length; i++) {
      if(f.input[i].type == 'label') {
        let label = document.createElement("label"); 
        label.textContent = f.input[i].label;
        label.setAttribute("id", f.id+'input'+[i]);
        form.append(label);
        continue;
      }
      let input;
      if(f.input[i].type == 'textarea') {
        input = document.createElement("textarea");
      }
      else {
        input = document.createElement("input");
        if(f.input[i].type) input.setAttribute("type", f.input[i].type);
        else input.setAttribute("type", "text");
      }
      if(f.input[i].onclick) input.onclick = f.input[i].onclick;
      if(f.input[i].value) input.setAttribute("value", f.input[i].value);
      if(f.input[i].name) input.setAttribute("name", f.input[i].name);
      if(f.input[i].style) input.setAttribute("style", f.input[i].style);
      if(f.input[i].placeholder) input.setAttribute("placeholder", f.input[i].placeholder);
      if(f.input[i].label) {
          let label = document.createElement("label"); 
          let inputid = f.id+'input'+[i];
          label.textContent = f.input[i].label;
          input.setAttribute("id", inputid);
          label.setAttribute("for", inputid);
          if((f.input[i].type == 'checkbox')||(f.input[i].type == 'radio')) {
            label.style = 'font:inherit; color:inherit;';
            label.prepend(input);
          }
          form.append(label);
      }
      if(!f.input[i].notrequired) input.setAttribute("required", "");
      if(f.input[i].checked) input.setAttribute("checked", "");
      if((f.input[i].type != 'checkbox')&&(f.input[i].type != 'radio')) form.append(input);      
    }
    let btn = document.createElement("button");
    btn.setAttribute("type", "submit");
    btn.textContent = f.button;
    btn.style = 'margin-top:8vh';
    form.append(btn);
    div.append(form);
    let loader = document.createElement("div");
    loader.setAttribute("class", "loader");
    loader.setAttribute("id", "loader");
    div.append(loader);
    let result = document.createElement("div");
    result.setAttribute("class", "result");
    result.setAttribute("id", "result");
    div.append(result);
    document.getElementById("wrapper").append(div);
    return form;
  }
  else if(f.html) document.getElementById("wrapper").append(f.html());
}
/*
func.add('example', {
  class: 'Тест',
  menu: 'Пункт меню',
  header: 'Заголовок формы',
  input: [
    {type:'text', label:'Поле ввода 1:', name: 'fieldName1', placeholder:'Текст внутри поля',notrequired:'1'},
    {type:'text', label:'Поле ввода 2:', name: 'fieldName2', placeholder:'Текст внутри поля',notrequired:'1'}
  ],
  button: 'Текст кнопки для отправки формы'  
},async (...args) => {
  //код
  let form = new FormData(...args);

  return await fetch('/url', {
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
*/


func.add('settings', {
  header: 'Настройки',
  input: [
    {label:'Логин Sipuni:', name: 'sipun_login', placeholder:'Логин Sipuni'},
    {type:'password', label:'Пароль Sipuni:', name: 'sipun_password', placeholder:'Пароль Sipuni'},
    {label:'SSH логин:', name: 'ssh_login', placeholder:'SSH логин'},
    {type:'textarea', label:'SSH ключ:', name: 'ssh_key', placeholder:'SSH ключ'},
  ],
  button: 'Сохранить'  
},async (...args) => {
    let form = new FormData(...args);

    return await fetch('/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(response => {
      return response.json();
    })
    .then((data) => {
      if(data.id) {
        let requestData = {
          "id": data.id,
          "is_service": data.is_service,
          "is_admin": data.is_admin,
          "first_name": data.first_name,
          "last_name": data.last_name,
          "email": data.email,
          "sipun_login": data.sipun_login,
          "sipun_password": data.sipun_password,
          "Login_ssh": data.Login_ssh,
          "key_ssh": data.key_ssh
        };
        
        if(form.get('sipun_login')) requestData.sipun_login = form.get('sipun_login');
        if(form.get('sipun_password')) requestData.sipun_password = form.get('sipun_password');
        if(form.get('ssh_login')) requestData.Login_ssh = form.get('ssh_login');
        if(form.get('ssh_key')) requestData.key_ssh = form.get('ssh_key');
        console.log(JSON.stringify(requestData));
        fetch('/auth/update', { 
          method: 'PUT',
          credentials: 'include',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
          })
          .then(resp => {
            document.getElementById('loader').style="display:none;";
            if (resp.ok){
              return document.getElementById('result').innerHTML='Данные обновлены!';
            }
            else return document.getElementById('result').innerHTML='Не удалось выполнить запрос';
          });
      }
      else return document.getElementById('result').innerHTML='Не удалось выполнить запрос';
    });
})