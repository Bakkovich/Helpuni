import {createRoot} from 'react-dom/client';
import Logo from '../../components/ui/logo';
import UserForm from '../../components/UserForm';
import LoginForm from '../../components/LoginForm';
import "./style.css";

const root = createRoot(document.getElementById('root'));
chrome.storage.local.get(["token", "first_name"]).then((storage) => {
    function App(){
        if(storage.token) return (
            <>
                <Logo />
                <UserForm username={storage.first_name} />
            </>
        )
        else return (
            <>
                <Logo />
                <LoginForm />
            </>
        )
    }

    root.render(<App />);
}); 