func.add('login', {
    header: 'Авторизация',
    input: [
      {label:'Логин:', name: 'login', placeholder:'e-mail'},
      {type:'password', label:'Пароль:', name: 'password', placeholder:'Пароль'},
    ],
    button: 'Войти'  
  }, async (...args) => {
      let form = new FormData(...args);
      let requestData = {
        "email": form.get('login'),
        "password": form.get('password')
      };
      try {
          const response = await fetch('/auth/login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestData)
          });
          // if (!response.ok) throw new Error(response.status+' '+response.statusText);
          const data = await response.json();
          console.log(data);
          if (data.access_token) {
              location.reload(true);
          } else {
              return 'Неверный логин или пароль';
          }
          return data.message;
      } catch (err) {
          console.error(err);
          return err;
      }
  })
  func.add('register2', {
    header: 'Регистрация',
    input: [
      {label:'Имя:', name: 'first_name', placeholder:'Имя'},
      {label:'Фамилия:', name: 'last_name', placeholder:'Фамилия'},
      {label:'E-mail:', name: 'email', placeholder:'E-mail от админки Sipuni'},
      {label:'Пароль:', name: 'password', placeholder:'Пароль от админки Sipuni'},
      {label:'Логин SSH:', name: 'Login_ssh', placeholder:'Логин SSH'},
      {label:'Ключ SSH:', name: 'key_ssh', placeholder:'Ключ SSH', type:'textarea'},
    ],
    button: 'Зарегистрировать'  
  }, async (...args) => {
      let form = new FormData(...args);
      let requestData = {
        "email": form.get('email'),
        "password": form.get('password'),
        "first_name": form.get('first_name'),
        "last_name": form.get('last_name'),
        "Login_ssh": form.get('Login_ssh'),
        "key_ssh": form.get('key_ssh'),
        "sipun_password": form.get('password'),
      };
      try {
          const response = await fetch('/auth/register', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestData)
          });
          if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
          const data = await response.json();
          return data.message;
      } catch (err) {
          console.error(err);
          return err;
      }
  })