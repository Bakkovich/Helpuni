import HelpuniURL from '../modules/url.js';

export async function login(authData) {
    return fetch(HelpuniURL+'/auth/login/', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: authData
    })
    .then(response => {
        if(!response.ok) throw new Error(response.status);
        return response.json();
    })
    .then(data => {
        if(!data.access_token) throw new Error(512);
        return getMe(data.access_token).then((status) => {
            if(status!=200) throw new Error(status);
            chrome.storage.local.set({ token: data.access_token });
            chrome.cookies.set({
                url: HelpuniURL,
                name: 'users_access_token',
                value: data.access_token,
                path: '/',
            });   
            return {success: true, message: 'Вы успешно авторизованы'}
        }); 
    })
    .catch((error) => {
        let errMsg;
        switch(error.message){
            case '401':
                errMsg='Неверный логин или пароль';
                break;
            case '408':
                errMsg='Не дождались ответа от сервера';
                break;
            case '418':
                errMsg='Cервер не может приготовить кофе, потому что он чайник';
                break;  
            case '422':
                errMsg='Неверный формат данных';
                break;
            case '500':
                errMsg='Серверная ошибка'
                break;
            case '503':
                errMsg='Сервис недоступен'
                break;
            case '512':
                errMsg='Сервер не выдал токен';
                break;
            case '514':
                errMsg='Пользователь не найден'; //Авторизация прошла успешно, сервер выдал токен, но при запросе в /auth/me не был найден пользователь.
                break;    
            default:
                errMsg='Неизвестная ошибка';
                console.error('[Auth] Неизвестная ошибка: '+error.message);     
        }
        console.log('[Auth] Ошибка при запросе в /auth/login: '+errMsg);
        return {success: false, message: errMsg};
    })
}

async function getMe(token) {
    return fetch(HelpuniURL+'/auth/me/', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => {
        if(!response.ok) throw new Error(response.status);
        return response.json();
    })
    .then((data) => {
        if(!data.id) throw new Error(514);
        chrome.storage.local.set({ email: data.email });
        chrome.storage.local.set({ first_name: data.first_name });
        chrome.storage.local.set({ last_name: data.last_name });
        return 200;
    })
    .catch((error) => {
        console.error('[Auth] Ошибка при запросе в /auth/me: '+error);
        return error.message;
    });
}

export function logout() {
    return chrome.storage.local.get(["token"]).then((storage) => {
        return fetch(HelpuniURL+'/auth/logout/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            })
            .then(response => {
              if (response.ok){
                chrome.storage.local.clear();
                return true;
              }
              else {
                console.error('Не удалось выполнить запрос logout');
                return false;
              }
            })
    });
}

export default function isAuth() {
    return chrome.storage.local.get(["token"]).then((storage) => {
        if(storage.token) return true;
        else return false;
    });
}