let localUsers = [];
let domain = '';
let oauthAccessToken = '';
let crmUsers = []; // Массив для пользователей из get_crm_configuration

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const cabNumber = urlParams.get('cab_number');

    if (!cabNumber) {
        console.error('Номер кабинета не указан');
        return;
    }

    await getCrmConfiguration(cabNumber); // Получаем конфигурацию CRM

    const getUsersButton = document.getElementById('getUsers');
    if (getUsersButton) {
        getUsersButton.addEventListener('click', async () => {
            await fetchUsers();
        });
    }

    const searchContact = document.getElementById('searchContact');
    if (searchContact) {
        searchContact.addEventListener('click', async () => {
            const tel = prompt("Введите номер телефона:");
            if (tel) {
                await searchForContact(tel); // Убедитесь, что эта функция определена
            } else {
                alert("Номер телефона не может быть пустым.");
            }
        });
    }

    const searchLead = document.getElementById('searchLead');
    if (searchLead) {
        searchLead.addEventListener('click', async () => {
            const phoneNumber = prompt("Введите номер телефона для поиска сделок:");
            if (phoneNumber) {
                await searchForLeadsByPhone(phoneNumber);
            } else {
                alert("Номер телефона не может быть пустым.");
            }
        });
    }
});

async function getCrmConfiguration(cabNumber) {
    try {
        const response = await fetch(`http://10.2.3.53:8097/amo/get_crm_configuration/${encodeURIComponent(cabNumber)}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        localUsers = data.users; // Сохраняем пользователей из конфигурации
        domain = data.domain; // Сохраняем домен
        oauthAccessToken = data.oauth_access_token; // Сохраняем токен доступа

        // Отображаем домен
        const domainElement = document.getElementById('domain');
        domainElement.innerText = `Домен: ${domain}`;
    } catch (error) {
        console.error('Ошибка при получении конфигурации CRM:', error);
    }
}

async function fetchUsers() {
    const resultContainer = document.getElementById('result');
    const loader = document.getElementById('loader');
    
    // Проверяем, существует ли loader
    if (loader) {
        loader.style.display = 'block';
    }
    
    resultContainer.innerHTML = '';

    try {
        const response = await fetch(`https://${domain}/api/v4/users`, {
            headers: {
                'Authorization': `Bearer ${oauthAccessToken}`,
            },
            credentials: 'omit',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        resultContainer.innerHTML = formatUsers(data);

        // Сравнение пользователей
        compareUsers(data._embedded.users);
    } catch (error) {
        resultContainer.innerHTML = `<p style="color: #FF6347;">Ошибка: ${error.message}</p>`;
    } finally {
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

async function searchForContact(phoneNumber) {
    const resultContainer = document.getElementById('result');
    const loader = document.getElementById('loader');
    
    // Проверяем, существует ли loader
    if (loader) {
        loader.style.display = 'block';
    }
    
    resultContainer.innerHTML = '';

    try {
        const response = await fetch(`https://${domain}/api/v4/contacts?query=${encodeURIComponent(phoneNumber)}&with=leads`, {
            headers: {
                'Authorization': `Bearer ${oauthAccessToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'omit',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();
        function convertTimestampToReadable(timestamp) {
            const date = new Date(timestamp * 1000);
            return date.toISOString().replace('T', ' ').substring(0, 19);
        }
    
        data._embedded.contacts.forEach(contact => {
            contact.created_at = convertTimestampToReadable(contact.created_at);
            contact.updated_at = convertTimestampToReadable(contact.updated_at);
            contact.responsible_user_id = localUsers.find(user => user.id === contact.responsible_user_id)?.name+' ('+contact.responsible_user_id+')' || 'Неизвестный пользователь';
        });
        resultContainer.innerHTML = '<pre>' + JSON.stringify(data, null, 2)+'</pre>';
        // resultContainer.innerHTML = formatContacts(data);
    } catch (error) {
        resultContainer.innerHTML = `<p style="color: #FF6347;">Ошибка: ${error.message}</p>`;
    } finally {
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

async function searchForLeadsByPhone(phoneNumber) {
    const resultContainer = document.getElementById('result');
    const loader = document.getElementById('loader');
    
    // Проверяем, существует ли loader
    if (loader) {
        loader.style.display = 'block';
    }
    
    resultContainer.innerHTML = '';

    try {
        const response = await fetch(`https://${domain}/api/v4/contacts?query=${encodeURIComponent(phoneNumber)}&with=leads`, {
            headers: {
                'Authorization': `Bearer ${oauthAccessToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'omit',
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();
    
        // Функция для получения данных лида
        async function fetchLeadDetails(leadId) {
            const leadResponse = await fetch(`https://${domain}/api/v4/leads/${leadId}`, {
                headers: {
                    'Authorization': `Bearer ${oauthAccessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'omit',
            });
            if (!leadResponse.ok) {
                throw new Error(`HTTP error! status: ${leadResponse.status}`);
            }
            return await leadResponse.json();
        }
    
        // Перебираем все контакты и получаем данные о лидах
        for (let contact of data._embedded.contacts) {
        resultContainer.innerHTML += '<br><br> Из контакта: '+contact.id+' Название контакта: '+contact.name+'<br>';
            const leads = contact._embedded.leads;
            for (let lead of leads) {
                const leadDetails = await fetchLeadDetails(lead.id);
                resultContainer.innerHTML += '<pre>' + JSON.stringify(leadDetails, null, 2)+'</pre><br>';
            }
        }
    
        resultContainer.innerHTML +=  '';
        // resultContainer.innerHTML = formatContacts(data);
    } catch (error) {
        resultContainer.innerHTML = `<p style="color: #FF6347;">Ошибка: ${error.message}</p>`;
    } finally {
        if (loader) {
            loader.style.display = 'none';
        }
    }
}


// Функция для сравнения пользователей
function compareUsers(apiUsers) {
    const missingUsers = [];
    const usersWithoutShortNumber = [];

    // Проверяем, каких пользователей нет в localUsers
    apiUsers.forEach(apiUser => {
        const found = localUsers.find(crmUser => crmUser.id === apiUser.id);
        if (!found) {
            missingUsers.push(apiUser);
        } else if (!found.short_number) {
            usersWithoutShortNumber.push(apiUser);
        }
    });

    // Выводим результаты сравнения
    const resultContainer = document.getElementById('result');
    if (missingUsers.length > 0) {
        resultContainer.innerHTML += '<h4>Пользователи, отсутствующие в get_crm_configuration:</h4>';
        missingUsers.forEach(user => {
            resultContainer.innerHTML += `<p>${user.name} (ID: ${user.id})</p>`;
        });
    } else {
        resultContainer.innerHTML += '<p>Все пользователи присутствуют в get_crm_configuration.</p>';
    }

    if (usersWithoutShortNumber.length > 0) {
        resultContainer.innerHTML += '<h4>Пользователи без короткого номера:</h4>';
        usersWithoutShortNumber.forEach(user => {
            resultContainer.innerHTML += `<p>${user.name} (ID: ${user.id})</p>`;
        });
    } else {
        resultContainer.innerHTML += '<p>Все пользователи имеют короткий номер.</p>';
    }
}

function convertTimestampToReadable(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Функция для форматирования информации о сделке
function formatLead(lead) {
    let html = `
        <div class="lead-card" id="lead-${lead.id}">
            <div class="lead-header">
                <div class="lead-name">Сделка: ${lead.name} (ID: ${lead.id})</div>
            </div>
            <div class="lead-details">
                <p><strong>ID:</strong> ${lead.id}</p>
                <p><strong>Название:</strong> ${lead.name}</p>
                <p><strong>Цена:</strong> ${lead.price || 'Не указана'}</p>
                <p><strong>Ответственный:</strong> ${lead.responsible_user_id || 'Не назначен'}</p>
                <p><strong>Группа:</strong> ${lead.group_id || 'Не указана'}</p>
                <p><strong>Статус:</strong> ${lead.status_id}</p>
                <p><strong>Pipeline ID:</strong> ${lead.pipeline_id}</p>
                <p><strong>Причина потери:</strong> ${lead.loss_reason_id || 'Нет'}</p>
                <p><strong>Создан:</strong> ${new Date(lead.created_at * 1000).toLocaleString()}</p>
                <p><strong>Обновлен:</strong> ${new Date(lead.updated_at * 1000).toLocaleString()}</p>
                <p><strong>Закрыт:</strong> ${lead.closed_at ? new Date(lead.closed_at * 1000).toLocaleString() : 'Не закрыта'}</p>
                <p><strong>Ближайшая задача:</strong> ${lead.closest_task_at ? new Date(lead.closest_task_at * 1000).toLocaleString() : 'Нет'}</p>
                <p><strong>Удалена:</strong> ${lead.is_deleted ? 'Да' : 'Нет'}</p>
                <p><strong>Пользовательские поля:</strong> ${lead.custom_fields_values ? JSON.stringify(lead.custom_fields_values) : 'Нет'}</p>
                <p><strong>Счет:</strong> ${lead.score || 'Не указано'}</p>
                <p><strong>Account ID:</strong> ${lead.account_id}</p>
                <p><strong>Трудозатраты:</strong> ${lead.labor_cost || 'Не указаны'}</p>
                <p><strong>Цена рассчитана:</strong> ${lead.is_price_computed ? 'Да' : 'Нет'}</p>
                <p><strong>Ссылки:</strong></p>
                <ul>
                    <li><a href="${lead._links.self.href}" target="_blank">Ссылка на сделку</a></li>
                    <li><a href="https://${domain}/api/v4/leads/${lead.id}" target="_blank">Голый ответ сервера</a></li>
                </ul>
            </div>
        </div>
    `;
    return html;
}

// Функция для форматирования информации о контакте
function formatContacts(data) {
    return JSON.stringify(data, null, 2);
}
// Функция для форматирования телефонных номеров
function formatPhoneNumbers(customFields) {
    const phoneField = customFields.find(field => field.field_name === "Телефон");
    if (phoneField && phoneField.values.length > 0) {
        return phoneField.values.map(value => value.value).join(', ');
    }
    return 'Нет';
}

// Функция для форматирования информации о пользователе
function formatUsers(data) {
    let html = `
        <div class="users-summary">
            <p>Всего пользователей: ${data._total_items}</p>
            <p>Страница: ${data._page} из ${data._page_count}</p>
        </div>
        
    `;

    if (data._embedded && data._embedded.users) {
        data._embedded.users.forEach((user) => {
            html += `
                <div class="user-card" id="user-${user.id}">
                    <div class="user-header">
                        <div class="user-name">${user.name} (ID: ${user.id})</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                    <div class="user-details">
                        <p>ID: ${user.id}</p>
                        <p>Имя: ${user.name}</p>
                        <p>Email: ${user.email}</p>
                        <p>Язык: ${user.lang}</p>
                        <p>Активен: ${user.rights.is_active ? 'Да' : 'Нет'}</p>
                        <p>Администратор: ${user.rights.is_admin ? 'Да' : 'Нет'}</p>
                        <p>Права доступа:</p>
                        <ul>
                            <li>Права на сделки: ${JSON.stringify(user.rights.leads)}</li>
                            <li>Права на контакты: ${JSON.stringify(user.rights.contacts)}</li>
                            <li>Права на компании: ${JSON.stringify(user.rights.companies)}</li>
                            <li>Права на задачи: ${JSON.stringify(user.rights.tasks)}</li>
                        </ul>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p>Пользователи не найдены</p>';
    }
    return html;
}