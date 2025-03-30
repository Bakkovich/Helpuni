import {createRoot} from 'react-dom/client';
import Calllog from '../../modules/calllog';
import Events_ATS from '../../modules/events_ats';
import AmoCRM from '../../modules/amocrm';
import Lines_register from '../../modules/lines_register';
import "./style.css";


const root = createRoot(document.getElementById('root'));

chrome.runtime.onMessage.addListener(function(message,sender,sendResponse) {
    let msg = JSON.parse(message);
    switch(msg.type) {
        case 'calllog':
            root.render(<Calllog selection={msg.selection} response={msg.response} />);
            break;
        case 'events_ats':
            root.render(<Events_ATS response={msg.response} />);
            break;
        case 'lines_register':
            root.render(<Lines_register selection={msg.selection} response={msg.response} />);
            break;            
        case 'amocrm':
            root.render(<AmoCRM response={msg.response} />);
            break;
        default:
            root.render(<pre>{msg.response}</pre>);      
    }
    sendResponse(sender);
    return true;
});


