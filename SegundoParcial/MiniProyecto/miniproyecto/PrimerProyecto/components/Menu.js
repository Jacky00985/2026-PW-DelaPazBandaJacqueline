import Link from 'next/link'; 
 
export default function Menu() {
  return (
    <nav>  
        <Link href="/"><a>Inicio</a></Link>
        <Link href="/practica/1"><a>Practica</a></Link>    
    </nav>
  );
}