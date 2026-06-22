# Status do Projeto: New Life Catálogo

Este documento fornece uma visão geral completa e atualizada do estado do projeto, suas tecnologias, infraestrutura e funcionalidades implementadas até o momento.

## 🛠 Tecnologias Utilizadas

### Frontend
- **Framework base:** React 19 + TypeScript.
- **Build Tool:** Vite (rápido e otimizado).
- **Estilização:** Tailwind CSS (versão 4) focado num design system premium com *glassmorphism* (`bg-surface-dark`, transições em backdrop-blur, scrollbars customizadas).
- **Animações:** GSAP (junto com o plugin ScrollTrigger) para criar animações complexas, parallax e interações de scroll; mais micro-animações CSS nativas (shimmer, pulse).
- **Roteamento:** React Router DOM para navegação SPA (Single Page Application).
- **Ícones:** Lucide React.

### Backend
- **Linguagem:** Go (Golang).
- **Roteador da API:** [Chi](https://github.com/go-chi/chi), um roteador leve e idiomático para Go.
- **Banco de Dados:** SQLite, utilizando o driver CGO-free `modernc.org/sqlite`.
- **CORS:** Configurado para aceitar requisições do frontend com o pacote `go-chi/cors`.

### Infraestrutura
- **Docker & Docker Compose:** Containerização do Frontend e Backend.
- **Traefik:** Gateway / Proxy Reverso configurado no `docker-compose.yml` para lidar com rotas (`/api` para backend e raiz para frontend) associadas ao domínio `catalogo.newlifefibra.com.br`.

---

## 🚀 Funcionalidades Atuais

### 1. Página Inicial (Home)
A página de entrada foi focada em causar um alto impacto visual (WOW effect).
- **Hero Section Imersiva:** Ocupa `100vh` da tela. Possui um fundo escuro e estrelado de partículas animadas.
- **Efeito Flashlight Interativo:** O logotipo no centro possui um efeito que segue o mouse, revelando as cores por trás usando máscaras CSS.
- **Shrink-on-Scroll Parallax:** Quando o usuário rola a página para baixo, a Hero Section trava no lugar (fica fixa) e passa por uma animação de encolhimento, enquanto o Catálogo sobrepõe o conteúdo.
- **Product Cards Premium:** Cards arredondados com glassmorphism, exibindo badges animados de status, e hover com transição para a segunda imagem do produto.

### 2. Catálogo e Produtos
A visualização do catálogo principal com sistema de filtros dinâmicos e design premium.
- **Listagem Responsiva:** O catálogo exibe produtos com informações refinadas, esqueletos de carregamento (shimmer) e busca instantânea.
- **Filtros Dinâmicos (Glassmorphism):** Painel colapsável para filtros de Categoria e Tags.
- **Comparador Flutuante:** Barra flutuante tipo *pill* para adicionar até 3 produtos.
- **Página de Comparação:** Tabela elegante zebrada para confrontar status, tags e especificações.
- **Página de Detalhes (`/produto/:slug`):** Galeria de imagens completas com miniaturas responsivas, download de PDF e exibição detalhada da ficha técnica em containers glass.
- **Resolução Automática de Imagens:** Utilitário inteligente (`src/utils/image.ts`) que mescla o campo antigo `image_url` (Unsplash) com os novos arrays `images_json` (uploads locais) garantindo compatibilidade com versões anteriores.

### 3. Painel Administrativo (Gestor Catálogo)
Uma área privada para a gestão do conteúdo.
- **Autenticação:** Tela de login centralizada (design glassmorphism), comunicando-se com o backend real em `/admin/login` e gerando JWT, persistido no LocalStorage.
- **Navegação em Abas:** Transições suaves entre a gestão de `Produtos`, `Categorias` e `Tags` (removido o dashboard genérico, indo direto para Produtos).
- **Gestão de Categorias e Tags:** 
  - Possibilidade de criar novas Categorias e Tags via formulário.
- **Gestão de Produtos:**
  - Formulário completo para registro de equipamentos (nome, marca, especificações).
  - Drag and drop real integrado ao backend Go para fazer o upload e ordenação das imagens.
  - Tabela de Visualização com thumbnail em tempo real, status e deleção com Modal de confirmação seguro.

### 4. API Backend (Endpoints)
- `GET /api/health`: Checagem de disponibilidade.
- `GET & POST /api/products`: Listagem e criação de produtos com conversão automática de nome para slug, e tags para JSON array no banco.
- `GET & POST /api/categories`: Recuperação e criação de novas categorias.
- `GET & POST /api/tags`: Recuperação e criação de etiquetas para as especificações técnicas (ex: "Wi-Fi 6", "Datacenter").
- `POST /api/admin/login`: Rota em base (atualmente retorna um token genérico `dummy`).

---

## 📂 Próximos Passos (Sugestões)
- **Segurança da API JWT:** Implementar validação via Middleware JWT nas rotas POST/PUT/DELETE em Go (atualmente em desenvolvimento) e criar usuários reais com hash bcrypt.
- **Testes Responsivos:** Fazer um pente fino geral no visual em telas muito pequenas (mobile 320px).
- **Deploy:** Configurar os volumes Docker finais e preparar Traefik para Let's Encrypt (SSL automático).
