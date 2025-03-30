
export default function Events_ATS({response}){
    if(!response.error) return (<><h1>События на АТС</h1><pre>{response.info}</pre></>);
    return(<><h1>События на АТС</h1><pre className="preErr">{response.error}</pre></>);
}
