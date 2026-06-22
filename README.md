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

O projeto já está configurado para ambiente de produção com SSL (HTTPS) automático via Traefik.

1. Clone o repositório no seu servidor de produção.
2. Crie o arquivo de configuração e preencha com seus dados (JWT, usuário admin, etc):
   ```bash
   cp .env.example .env
   ```
3. Inicie os containers usando o Docker Compose:
   ```bash
   docker compose up -d --build
   ```

**Nota:** O `docker-compose.yml` está configurado para responder automaticamente pelo domínio `catalogo.newlifefibra.com.br` e gerará os certificados SSL via Let's Encrypt. Certifique-se de que os apontamentos DNS (tipo A) do domínio já estejam apontando para o IP público do seu servidor.
