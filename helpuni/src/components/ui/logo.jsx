import logo from '../bg/helpunilogo.webp';  
export default function Logo() {
  return (
    <picture id="logo" className="logo">
      <img src={logo} />
    </picture>
  );
}