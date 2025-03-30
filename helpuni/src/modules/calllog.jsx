
import {AnsiUp} from '../../node_modules/ansi_up/ansi_up.js';
export default function Calllog({selection, response}){
    if(!response.error) {
        const ansi_up = new AnsiUp();
        return (<><h1>{'Calllog '+selection}</h1><pre dangerouslySetInnerHTML={{ __html: 'Постоянная ссылка:<a href="'+response.link+'">'+response.link+'</a><br>'+ansi_up.ansi_to_html(response.func_result) }}></pre></>);
    }
    return(<><h1>{'Calllog '+selection}</h1><pre className="preErr">{response.error}</pre></>);
}
