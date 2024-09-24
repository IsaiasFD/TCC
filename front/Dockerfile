# Author: Fabiano Henrique
# Date: 2024/09/10

# Utilizar a imagem oficial do NodeJS como base do build
FROM node:16-bullseye-slim AS builder


# Definir o diretório de trabalho
WORKDIR /src

# Usar as mudanças do package.json para forçar o Docker invalidar o cache
# quando houver mudanças nas dependências
COPY front/package.json /src

# Resolver as dependencias do projeto
RUN set -eux; \
      apt update; \
      npm config set always-auth true; \
      npm install;

#  Copiar o fonte do projeto para a imagem de build
COPY front/ /src

# Buildar o front end
RUN npm run build;

# Etapa 2: Aqui eu crio forma de acessar a aplicação.
FROM nginx:alpine

# Copie os arquivos construídos da etapa de construção para o diretório do Nginx
COPY --from=builder /src/build /usr/share/nginx/html

# # Exponha a porta em que o Nginx estará ouvindo
# EXPOSE 80

# # Comando para iniciar o Nginx
# CMD ["nginx", "-g", "daemon off;"]
