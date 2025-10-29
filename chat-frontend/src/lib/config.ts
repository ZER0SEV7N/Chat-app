//lib/confing.ts

//Detectar automaticamente la IP o si utiliza un .env
export const getBaseURL = () => {
    let baseUrl: string;
    let source: string;
    //Si esta definido en el .env
    if(process.env.NEXT_PUBLIC_API_URL){ 
        baseUrl = process.env.NEXT_PUBLIC_API_URL;
        source = "🌍Variable de entorno NEXT_PUBLIC_API_URL";
    }

    //Si se utiliza en un navegador, se toma del hostname actual
    else if (typeof window !== "undefined"){
        baseUrl = `http://${window.location.hostname}:3000`;
        source = `💻IP local detectada: ${window.location.hostname}`;
    }else {
        //Fallback para entornos donde window no existe (SSR o build)
        baseUrl = "http://localhost:3000";
        source = "🧩Fallback por defecto (localhost)";
    }
      // 🪵 Mostrar log solo en modo desarrollo
  if (process.env.NODE_ENV === "development") {
    console.log(`[API CONFIG] Usando base URL: ${baseUrl}`);
    console.log(`[API CONFIG] Fuente detectada: ${source}`);
  }
  return baseUrl;
};
export const API_URL = getBaseURL();