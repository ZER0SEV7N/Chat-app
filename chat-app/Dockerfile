# Usa una imagen base oficial de Node.js con Alpine para tamaño reducido
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias para instalar primero y aprovechar cache
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente al contenedor
COPY . .

# Construye el proyecto TypeScript a JavaScript
RUN npm run build

# Expone el puerto en el que tu app escuchará (debe coincidir con el puerto en el código)
EXPOSE 3000

# Comando para iniciar la aplicación (el archivo compilado en /dist/main.js)
CMD ["node", "dist/main"]
