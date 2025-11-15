//lib/config.ts

//Detectar automaticamente la IP o si utiliza un .env
export const getBaseURL = () => {
  let baseUrl: string;
  let source: string;

  if (process.env.NEXT_PUBLIC_API_URL) {
    baseUrl = process.env.NEXT_PUBLIC_API_URL;
    source = "🌍Variable de entorno NEXT_PUBLIC_API_URL";
  }

  else if (typeof window !== "undefined") {
    const ip = localStorage.getItem("server_ip");

    if (ip) {
      baseUrl = `http://${ip}:3000`;
      source = `📱IP configurada manualmente desde el celular: ${ip}`;
    } else {
      baseUrl = `http://${window.location.hostname}:3000`;
      source = `💻IP local detectada desde PC: ${window.location.hostname}`;
    }
  }

  else {
    baseUrl = "http://localhost:3000";
    source = "🧩Fallback por defecto (localhost)";
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[API CONFIG] Usando base URL: ${baseUrl}`);
    console.log(`[API CONFIG] Fuente detectada: ${source}`);
  }
  return baseUrl;
};

export const API_URL = getBaseURL();
