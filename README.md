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
