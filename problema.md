# Diário de Bordo e Resolução de Problemas

Este documento descreve todo o histórico recente de problemas enfrentados na plataforma e as soluções aplicadas.

## 1. Problema de Login do Administrador
- **Problema:** Ao tentar acessar o painel com o usuário `admin` gerado pelo comando `seedadmin`, a página retornava "Credenciais inválidas".
- **Causa:** O Nginx Proxy Manager (NPM) não estava conseguindo se comunicar com a porta `5174` do servidor, resultando em um erro 502/404 de rede. No entanto, o front-end estava programado para mascarar qualquer erro e exibir "Credenciais inválidas" por padrão.
- **Solução:** O front-end foi ajustado para mostrar o erro HTTP real. Com as portas configuradas corretamente no servidor (e o NPM alcançando o `/api`), o login voltou a funcionar perfeitamente.

## 2. Erro ao Salvar Novo Produto ("Erro ao salvar produto")
- **Problema:** Ao cadastrar um produto, um balão vermelho genérico exibia erro de salvamento e a imagem não carregava.
- **Causa:** O banco de dados SQLite estava sem duas colunas essenciais (`images_json` e `specs_json`), fazendo o comando de inserção no back-end falhar (Erro 500).
- **Solução:** Rodamos comandos SQL diretos via terminal (`ALTER TABLE`) para criar as colunas ausentes no banco.

## 3. Imagens Quebradas Após o Upload (Configuração NPM)
- **Problema:** Mesmo com o upload da imagem sendo salvo corretamente na pasta `./data/uploads` do container, o navegador mostrava a imagem quebrada.
- **Causa:** O NPM não estava repassando a rota `/uploads/` corretamente para a porta `5174` do back-end, fazendo com que o container do front-end tentasse achar a imagem e retornasse erro 404.
- **Solução:** O código do back-end foi alterado para servir as imagens em `/api/v1/uploads/`. Isso tira a necessidade de criar regras adicionais no NPM, pegando "carona" na regra do `/api` que já estava configurada e funcionando.

## 4. O "Sumiço" dos Produtos (Lista Vazia)
- **Problema:** A listagem de produtos repentinamente parou de exibir qualquer item cadastrado e passou a mostrar "Nenhum produto encontrado", com erros na comunicação.
- **Causa:** Ao criarmos as colunas `images_json` manualmente no banco, o SQLite as preencheu com valores `NULL` para produtos antigos. O Go é muito rigoroso com tipagem e, ao tentar ler `NULL` em variáveis `string`, causava um erro interno na leitura da linha (`row.Scan()`) e "pulava" aquele produto.
- **Solução:** Atualizamos o código do Go para usar o tipo seguro `sql.NullString`, que lida graciosamente com vazios sem gerar erros.

## 5. Queda do Servidor Back-end (Erro HTTP 502)
- **Problema:** Erro 502 retornado no painel indicando que a API estava fora do ar.
- **Causa:** Ao refatorar a rota de imagens para `/api/v1/uploads/`, uma linha de configuração de segurança (`r.Use(middleware.Logger)`) foi declarada acidentalmente *após* a declaração de uma rota (`/api/v1/health`). O framework `chi` não permite isso e o sistema caiu com o erro fatal (*panic*).
- **Solução:** A linha duplicada/mal posicionada foi apagada e o serviço estabilizou.

---

## 6. ✅ Imagens Não Apareciam (CAUSA RAIZ FINAL - RESOLVIDO)
- **Problema:** Imagens continuavam quebradas mesmo depois de corrigir URLs, banco de dados e rotas do back-end.
- **Causa raiz:** O arquivo `frontend/nginx.conf` (que roda dentro do container Docker do front-end) **não tinha nenhuma regra de proxy reverso para `/api/`**. Quando o navegador pedia `/api/v1/uploads/foto.jpg`, o nginx do front-end não sabia o que fazer e devolvia o `index.html` do React em vez da imagem. Isso fazia com que todas as imagens e até chamadas de API que passassem pelo domínio principal quebrassem silenciosamente.
- **Solução:** Adicionamos um bloco `location /api/` no `nginx.conf` do front-end com `proxy_pass http://backend:8080`, fazendo o nginx do front-end encaminhar automaticamente qualquer requisição `/api/` para o container do back-end. 
- **Data da resolução:** 22/06/2026

### Resumo da Arquitetura Final

```
Navegador → NPM (porta 443/80) → Container Frontend (nginx:80)
                                        ├── / → Arquivos React (SPA)
                                        └── /api/ → proxy_pass → Container Backend (Go:8080)
                                                                      ├── /api/v1/products (CRUD)
                                                                      ├── /api/v1/uploads/* (imagens estáticas)
                                                                      ├── /api/v1/admin/login
                                                                      └── /api/v1/upload (upload de imagens)
```

