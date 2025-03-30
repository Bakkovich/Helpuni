window.URL = 'http://10.2.3.53:8097';  //ССЫЛКА К СЕРВЕРУ


document.addEventListener("DOMContentLoaded", function() {
  let html = '';  
  chrome.cookies.get({ url: window.URL, name: 'users_access_token'}, function (cookie) {
    if (cookie && localStorage.getItem('user')) {
      let user = localStorage.getItem('user');
      html += '<div class="profile" id="form">';
      html += '<div style="display: flex;flex-direction: row; flex-wrap:nowrap;">';
      html += '<svg xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 24 24" style="margin-right:20px;"><g fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"><path d="M16 9a4 4 0 1 1-8 0a4 4 0 0 1 8 0m-2 0a2 2 0 1 1-4 0a2 2 0 0 1 4 0"/><path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11s11-4.925 11-11S18.075 1 12 1M3 12c0 2.09.713 4.014 1.908 5.542A8.99 8.99 0 0 1 12.065 14a8.98 8.98 0 0 1 7.092 3.458A9 9 0 1 0 3 12m9 9a8.96 8.96 0 0 1-5.672-2.012A6.99 6.99 0 0 1 12.065 16a6.99 6.99 0 0 1 5.689 2.92A8.96 8.96 0 0 1 12 21"/></g></svg>';
      html += '<div id="username">'+user+'</div>';
      html += '</div>';
      html += '<div><a id="settings" style="cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M13.765 2.152C13.398 2 12.932 2 12 2s-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083c-.092.223-.129.484-.143.863a1.62 1.62 0 0 1-.79 1.353a1.62 1.62 0 0 1-1.567.008c-.336-.178-.579-.276-.82-.308a2 2 0 0 0-1.478.396C4.04 5.79 3.806 6.193 3.34 7s-.7 1.21-.751 1.605a2 2 0 0 0 .396 1.479c.148.192.355.353.676.555c.473.297.777.803.777 1.361s-.304 1.064-.777 1.36c-.321.203-.529.364-.676.556a2 2 0 0 0-.396 1.479c.052.394.285.798.75 1.605c.467.807.7 1.21 1.015 1.453a2 2 0 0 0 1.479.396c.24-.032.483-.13.819-.308a1.62 1.62 0 0 1 1.567.008c.483.28.77.795.79 1.353c.014.38.05.64.143.863a2 2 0 0 0 1.083 1.083C10.602 22 11.068 22 12 22s1.398 0 1.765-.152a2 2 0 0 0 1.083-1.083c.092-.223.129-.483.143-.863c.02-.558.307-1.074.79-1.353a1.62 1.62 0 0 1 1.567-.008c.336.178.579.276.819.308a2 2 0 0 0 1.479-.396c.315-.242.548-.646 1.014-1.453s.7-1.21.751-1.605a2 2 0 0 0-.396-1.479c-.148-.192-.355-.353-.676-.555A1.62 1.62 0 0 1 19.562 12c0-.558.304-1.064.777-1.36c.321-.203.529-.364.676-.556a2 2 0 0 0 .396-1.479c-.052-.394-.285-.798-.75-1.605c-.467-.807-.7-1.21-1.015-1.453a2 2 0 0 0-1.479-.396c-.24.032-.483.13-.82.308a1.62 1.62 0 0 1-1.566-.008a1.62 1.62 0 0 1-.79-1.353c-.014-.38-.05-.64-.143-.863a2 2 0 0 0-1.083-1.083Z"/></g></svg></a>';
      html += '<a id="logout" style="cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" width="36px" height="36px" viewBox="0 0 24 24"><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="#d14543" d="M12 3a1 1 0 0 1 .117 1.993L12 5H7a1 1 0 0 0-.993.883L6 6v12a1 1 0 0 0 .883.993L7 19h4.5a1 1 0 0 1 .117 1.993L11.5 21H7a3 3 0 0 1-2.995-2.824L4 18V6a3 3 0 0 1 2.824-2.995L7 3zm5.707 5.464l2.828 2.829a1 1 0 0 1 0 1.414l-2.828 2.829a1 1 0 1 1-1.414-1.415L17.414 13H12a1 1 0 1 1 0-2h5.414l-1.121-1.121a1 1 0 0 1 1.414-1.415"/></g></svg></a></div>';
      html += '</div>';
      document.getElementById('container').innerHTML = html;
      document.getElementById('logout').style = 'cursor:pointer;';

      document.getElementById('settings').onclick = function(){
        fetch(window.URL+'/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Cookie': 'users_access_token='+cookie.value
          }
        })
        .then(response => {
          return response.json();
        })
        .then((data) => {
          if(data.id) {
            html =  '<div class="container" id="settings_form" style="margin-top:40px;">';
            html += '<form id="change_settings">';
            html += '<input type="text" name="sipun_login" placeholder="Логин Sipuni" value="'+data.sipun_login+'">';
            html += '<input type="password" name="sipun_password" placeholder="Пароль Sipuni" value="'+data.sipun_password+'">';
            html += '<input type="text" name="ssh_login" placeholder="Логин SSH" value="'+data.Login_ssh+'">';
            html += '<textarea style="resize: none; height:100px;" name="ssh_key" placeholder="Ключ SSH">'+data.key_ssh+'</textarea>';
            html += '<span id="settings_error"></span>';
            html += '<button type="submit" id="savesettingsbtn">Сохранить</button>';
            html += '</form>';
            html += '</div>';
            document.getElementById('container').innerHTML += html;
            document.getElementById('logo').style="opacity: 0; visibility: hidden;";
            document.getElementById('form').style="opacity: 0; visibility: hidden;";
            document.getElementById('settings_form').onsubmit = async (e) => {
            e.preventDefault();
                let form = new FormData(document.getElementById('change_settings'));
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
                fetch(window.URL+'/auth/update', { 
                  method: 'PUT',
                  credentials: 'include',
                  headers: {
                      'Content-Type': 'application/json',
                      'Cookie': 'users_access_token='+cookie.value
                  },
                  body: JSON.stringify(requestData)
                  })
                  .then(resp => {
                    if (resp.ok){
                      document.getElementById('settings_form').innerHTML = "Изменения сохранены";
                      document.getElementById('logo').style="opacity: 1; visible: hidden; transition: opacity 1s ease-in-out; transition-delay: .3s;";
                      document.getElementById('form').style="opacity: 1; visible: hidden; transition: opacity 1s ease-in-out; transition-delay: .3s;";
                      document.getElementById('settings_form').style="margin-top:65%; opacity: 0; transition: opacity 1.5s ease-in-out; transition-delay: 2.5s; "; 
                    }
                    else document.getElementById('settings_error').innerHTML = '<center>Не удалось выполнить запрос</center><br>';
                  });       
          }
          
          }
          else document.getElementById('settings_error').innerHTML = '<center>Не удалось выполнить запрос</center><br>';
        });
      };

      document.getElementById('logout').onclick = function(){
        fetch(window.URL+'/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Cookie': 'users_access_token='+cookie.value,
          }
          })
          .then(response => {
            if (response.ok){
              localStorage.removeItem('user');
              document.getElementById('form').textContent = 'Вы покинули сессию';
            }
            else document.getElementById('form').textContent = 'Не удалось выполнить запрос';
          });
        };
    }
    else {
      html += '<div class="container" id="form">';
      html += '<form id="auth">';
      html += '<input type="text" name="login" placeholder="Логин" required>';
      html += '<input type="password" name="password" placeholder="Пароль" required>';
      html += '<button type="submit" id="authbtn">Вход</button>';
      html += '</form>';
      html += '</div>';
      document.getElementById('container').innerHTML = html;

      document.getElementById('auth').addEventListener('submit', function(event) {
        event.preventDefault(); 
        let form = new FormData(event.target);
        let requestData ={
          "email": form.get('login'),
          "password": form.get('password')
        };
        fetch(window.URL+'/auth/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })
        .then(response => {
          return response.json();
        })
        .then(data => {
          if (data.access_token) {
            // Сохраняем токен в куки через API Chrome
            chrome.cookies.set({
              url: window.URL,
              name: 'users_access_token',
              value: data.access_token,
              path: '/',
            });
      
            fetch(window.URL+'/auth/me', {
              method: 'GET',
              credentials: 'include',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Cookie': `users_access_token=${data.access_token}`,
              }
            })
            .then(response => {
              return response.json();
            })
            .then((data) => {
              if(data.id) {
                localStorage.setItem('user', data.first_name);
                document.getElementById('form').style = 'margin-top:430px';
                document.getElementById('form').textContent = 'Вы успешно авторизованы';
              }
            });
          }
          else {
            let btn = document.getElementById("authbtn");
            btn.setCustomValidity('Неверный логин или пароль');
            btn.reportValidity();
          }
        })
        .catch(err => {
          console.error(err);
          return err;
        });
      });
      
    }
  });
});