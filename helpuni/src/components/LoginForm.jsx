import { useState } from 'react';
export default function LoginForm(){

    const [isWaitResponse, setWaitResponse] = useState(false);
    const [response, setResponse] = useState("");
    async function SubmitLogin(e) {
        e.preventDefault();
        setWaitResponse(true);
        let form = new FormData(e.target);
        let requestData = {
            "email": form.get('login'),
            "password": form.get('password')
        };

        let msg = {
            "type": "auth",
            "data": JSON.stringify(requestData)
        }
        
        chrome.runtime.sendMessage(JSON.stringify(msg), (response) => {
            console.log('ответ:', response);
            setResponse(response);
            setWaitResponse(false);
        });
    }

    return (
        <div className="container">
            <form onSubmit={SubmitLogin}>
                <input type="text" name="login" placeholder="E-mail" required/>
                <input type="password" name="password" placeholder="Пароль" required/>
                <button type="submit" disabled={isWaitResponse}>            
                    { isWaitResponse ? <div class="btn-loader"></div> : 'Вход' }
                </button>
                { response !== "" && <center style={{margin:"15px 0"}}>{JSON.parse(response).message}</center> }
            </form>
        </div>
    )
}