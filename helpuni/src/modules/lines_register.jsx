
import {AnsiUp} from '../../node_modules/ansi_up/ansi_up.js';
export default function Lines_register({selection, response}){
    if(!response.error) {
        if(response.detail) return(<><h1>Регистрация линий</h1><pre className="preErr">{response.detail}</pre></>);
        const ansi_up = new AnsiUp();
        let html="";
        for(let line of response) html += 'Линия '+line['Линия']+' Экстрег '+line['extreg']+' Ответ сервера:'+ansi_up.ansi_to_html(line['Ответ сервера']);
        return (<><h1>Регистрация линий в кабинете {selection}</h1><pre dangerouslySetInnerHTML={{ __html: html}}></pre></>);
    }
    return(<><h1>Регистрация линий</h1><pre className="preErr">{response.error}</pre></>);
}
