import { useState } from 'react';

function AmoTabNav(){
    return (
        <div className="tab-nav">
          <a className="tab-link" style={{marginLeft:"10px"}} href="#amo-user">Пользователи</a>
          <a className="tab-link" href="#amo-contact">Поиск контакта</a>
          <a className="tab-link" href="#amo-lead">Поиск сделки</a>
          <a className="tab-link" href="#amo-request">Другой запрос</a>
        </div>
    )
}

function AmoSearchBtn({Wait}) {
    return (
        <button className="amo-btn" type="submit" disabled={Wait}>            
            { Wait ? <div class="btn-loader"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="30px" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"></path></svg> }
        </button>
    )
}

function AmoUserForm({data, setResult}){
    const [isWaitResponse, setWaitResponse] = useState(false);

    let UserData = "";
    async function SubmitUser(e) {
        e.preventDefault();
        setWaitResponse(true);
        let resultContainer = document.getElementById('result-container');
        try {
            const response = await fetch(`https://${data.domain}/api/v4/users`, {
                headers: {
                    'Authorization': `Bearer ${data.oauth_access_token}`,
                },
                credentials: 'omit',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const userData = await response.json();

            UserData = formatUsers(userData);
    
            // Сравнение пользователей
            compareUsers(userData._embedded.users);




        } catch (error) {
            setResult(`<p style="color: #FF6347;">Ошибка: ${error.message}</p>`)
        } finally {
            setWaitResponse(false);
        }
    }

    function compareUsers(apiUsers) {
        const missingUsers = [];
        const usersWithoutShortNumber = [];
    
        // Проверяем, каких пользователей нет в localUsers
        apiUsers.forEach(apiUser => {
            const found = data.users.find(crmUser => crmUser.id === apiUser.id);
            if (!found) {
                missingUsers.push(apiUser);
            } else if (!found.short_number) {
                usersWithoutShortNumber.push(apiUser);
            }
        });
    
        // Выводим результаты сравнения
        let resultContainer = UserData;


        if (missingUsers.length > 0) {
            resultContainer += '<h4>Пользователи, отсутствующие в get_crm_configuration:</h4>';
            missingUsers.forEach(user => {
                resultContainer += `<p>${user.name} (ID: ${user.id})</p>`;
            });
        } else {
            resultContainer += '<p>Все пользователи присутствуют в get_crm_configuration.</p>';
        }
    
        if (usersWithoutShortNumber.length > 0) {
            resultContainer += '<h4>Пользователи без короткого номера:</h4>';
            usersWithoutShortNumber.forEach(user => {
                resultContainer += `<p>${user.name} (ID: ${user.id})</p>`;
            });
        } else {
            resultContainer += '<p>Все пользователи имеют короткий номер.</p>';
        }
        setResult(resultContainer);
    }

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

    return (        
        <div className="tab-content" id="amo-user">
            <div className="amo-domain">Домен: {data.domain}</div>
            <form onSubmit={SubmitUser} style={{display:'flex'}}>
                <button type="submit" disabled={isWaitResponse}>            
                    { isWaitResponse ? <div class="btn-loader"></div> : 'Показать' }
                </button>
            </form>
      </div>
    );
}


function AmoContactForm({data, setResult}){
    const [isWaitResponse, setWaitResponse] = useState(false);

    async function SubmitContact(e) {
        e.preventDefault();
        setWaitResponse(true);
        let form = new FormData(e.target);
        try {
            const response = await fetch(`https://${data.domain}/api/v4/contacts?query=${encodeURIComponent(form.get('phone'))}&with=leads`, {
                headers: {
                    'Authorization': `Bearer ${data.oauth_access_token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'omit',
            });
            if(response.status == 204) {
                return setResult(`<p style="color: #FF6347;">'Нет контакта'</p>`)
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let contactData = await response.json();
            function convertTimestampToReadable(timestamp) {
                const date = new Date(timestamp * 1000);
                return date.toISOString().replace('T', ' ').substring(0, 19);
            }
        
            contactData._embedded.contacts.forEach(contact => {
                contact.created_at = convertTimestampToReadable(contact.created_at);
                contact.updated_at = convertTimestampToReadable(contact.updated_at);
                contact.responsible_user_id = data.users.find(user => user.id === contact.responsible_user_id)?.name+' ('+contact.responsible_user_id+')' || 'Неизвестный пользователь';
            });
            
            setResult('<pre>' + JSON.stringify(contactData, null, 2)+'</pre>');

        } catch (error) {
            setResult(`<p style="color: #FF6347;">Ошибка: ${error.message}</p>`);
        } finally {
            setWaitResponse(false);
        }
    }

    return (        
        <div className="tab-content" id="amo-contact">
            <div className="amo-domain">Домен: {data.domain}</div>
            <form onSubmit={SubmitContact} style={{display:'flex'}}>
                <input type="text" name="phone" placeholder="Номер телефона" autocomplete="off" required/>
                <AmoSearchBtn Wait={isWaitResponse}/>
            </form>
      </div>
    );
}

function AmoLeadForm({data, setResult}){
    const [isWaitResponse, setWaitResponse] = useState(false);

    async function SubmitLead(e) {
        e.preventDefault();
        setWaitResponse(true);
        let form = new FormData(e.target);
        let resultContainer = "";
        try {
            const response = await fetch(`https://${data.domain}/api/v4/contacts?query=${encodeURIComponent(form.get('phone'))}&with=leads`, {
                headers: {
                    'Authorization': `Bearer ${data.oauth_access_token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'omit',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            let cData = await response.json();
        
            // Функция для получения данных лида
            async function fetchLeadDetails(leadId) {
                const leadResponse = await fetch(`https://${data.domain}/api/v4/leads/${leadId}`, {
                    headers: {
                        'Authorization': `Bearer ${data.oauth_access_token}`,
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
            for (let contact of cData._embedded.contacts) {
            resultContainer += '<br><br> Из контакта: '+contact.id+' Название контакта: '+contact.name+'<br>';
                const leads = contact._embedded.leads;
                for (let lead of leads) {
                    const leadDetails = await fetchLeadDetails(lead.id);
                    resultContainer += '<pre>' + JSON.stringify(leadDetails, null, 2)+'</pre><br>';
                }
            }
            setResult(resultContainer);
        } catch (error) {
            setResult(`<p style="color: #FF6347;">Ошибка: ${error.message}</p>`);
        } finally {
            setWaitResponse(false);
        }
    }

    return (        
        <div className="tab-content" id="amo-lead">
            <div className="amo-domain">Домен: {data.domain}</div>
            <form onSubmit={SubmitLead} style={{display:'flex'}}>
                <input type="text" name="phone" placeholder="Номер телефона" autocomplete="off" required/>
                <AmoSearchBtn Wait={isWaitResponse}/>
            </form>
      </div>
    );
}



function AmoCustomRequest({data, setResult}){
    const [isWaitResponse, setWaitResponse] = useState(false);

    async function SubmitRequest(e) {
        e.preventDefault();
        setWaitResponse(true);
        let form = new FormData(e.target);
        try {
            const res = await fetch(`https://${data.domain}${form.get('req')}`, {
                headers: {
                    'Authorization': `Bearer ${data.oauth_access_token}`,
                },
                credentials: 'omit',
            });
            console.log(res.status);
            console.log(res.statusText);
            const response = await res.json();

            setResult(`<pre>${JSON.stringify(response, null, 2)}</pre>`);  

        } catch (error) {
            setResult(`<p style="color: #FF6347;">Ошибка: ${error.message}</p>`);
        } finally {
            setWaitResponse(false);
        }
  
    }

    return (        
        <div className="tab-content" id="amo-request">
            <div className="amo-domain">Домен: {data.domain}</div>
            <form onSubmit={SubmitRequest} style={{display:'flex'}}>
                <div className='amo-customDomain'>https://{data.domain}</div>
                <input type="text" name="req" placeholder="/api/v4/" autocomplete="off" style={{borderRadius: '0 8px 8px 0', padding:'12px 12px 12px 0'}} required/>
                <button className="amo-btn" type="submit" disabled={isWaitResponse}>            
                    { isWaitResponse ? <div class="btn-loader"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="28" height="30" viewBox="0 0 24 24"><path fill="currentColor" d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99zM21 9l-3.99-4v3H10v2h7.01v3z"/></svg> }
                </button>
            </form>
      </div>
    );
}


export default function AmoCRM({response}){
    if(response.status_code && (response.status_code != 200)) return (<><pre className="preErr">{response.detail}</pre></>);

    const [result, setResult] = useState("");

    return (
        <>
            <div className="req-container">
                <div className="tab">
                    <AmoUserForm data={response} setResult={setResult}/>
                    <AmoContactForm data={response} setResult={setResult}/>
                    <AmoLeadForm data={response} setResult={setResult}/>
                    <AmoCustomRequest data={response} setResult={setResult}/>
                    <AmoTabNav />
                </div>
            </div>
            { result !== "" && <div className="result-container" id="result-container" dangerouslySetInnerHTML={{__html: result}}></div> }
        </>
    );
}




