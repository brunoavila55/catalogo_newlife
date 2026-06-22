# Catálogo New Life Fibra

Catálogo de equipamentos e módulo de elaboração de projetos da New Life Fibra.

## Tecnologias

- **Frontend:** React, TypeScript, Vite, TailwindCSS, GSAP.
- **Backend:** Go, Chi, SQLite.

## Estrutura do Projeto

- `/frontend`: Aplicação web para usuários finais e painel administrativo.
- `/backend`: API RESTful para gerenciar equipamentos, tags, categorias e projetos.

## Como Executar Localmente

### Backend (API)
```bash
cd backend
go run .
```
O servidor iniciará em `http://localhost:8080`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
O site estará disponível em `http://localhost:5173`.

## Deploy em Produção (Docker)

O projeto já está configurado para ser servido facilmente através de um Proxy Reverso (como o Nginx Proxy Manager).

1. Clone o repositório no seu servidor de produção.
2. Crie o arquivo de configuração e preencha com seus dados (JWT, usuário admin, etc):
   ```bash
   cp .env.example .env
   ```
3. Inicie os containers usando o Docker Compose:
   ```bash
   docker compose up -d --build
   ```

Isso fará com que o Frontend fique exposto na porta `3000` e o Backend na porta `8080` do seu servidor. 

**Configuração no Nginx Proxy Manager:**
- Crie um Proxy Host para o seu domínio (ex: `catalogo.newlifefibra.com.br`) apontando para o IP do seu servidor na porta `3000`.
- Na aba **Custom Locations**, adicione:
  - Local: `/api` apontando para o IP na porta `8080`.
  - Local: `/uploads` apontando para o IP na porta `8080`.
Isso fará o roteamento correto para a interface e para a API!
