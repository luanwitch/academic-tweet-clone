# Twitter Clone - Fullstack Social Network

Aplicação fullstack inspirada no Twitter, desenvolvida com foco em **arquitetura de APIs REST, experiência do usuário e integração frontend/backend**.

O projeto implementa funcionalidades típicas de uma rede social moderna, como feed dinâmico, sistema de seguidores, curtidas, comentários e hashtags.

---

# Demonstração

Frontend  
https://academic-tweet-clone.vercel.app

Backend API  
https://luanvlw31.pythonanywhere.com/api/

---

# Tecnologias utilizadas

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Context API

## Backend

- Python
- Django
- Django REST Framework
- Token Authentication
- PostgreSQL

---

# Funcionalidades

### Autenticação
- Cadastro de usuários
- Login com autenticação por token
- Persistência de sessão

### Posts
- Criar post
- Editar post
- Excluir post
- Curtir / descurtir post
- Comentários em posts

### Feed
- Feed personalizado
- Infinite scroll
- Busca de posts
- Busca por hashtag

### Hashtags
- Hashtags clicáveis
- Filtragem de feed por hashtag
- Trending hashtags

### Social
- Sistema de seguidores
- Perfil de usuário
- Upload de avatar

### Trending
- Trending posts
- Trending hashtags
- Top 3 postagens mais populares

---

# Funcionalidades com foco em produto real

O projeto também implementa melhorias de experiência do usuário comuns em aplicações modernas:

- Skeleton loading
- Tratamento de erros na interface
- Infinite scroll no feed
- Ranking visual de trending posts
- Hashtags clicáveis
- Filtro dinâmico de conteúdo

---

# Arquitetura do projeto

## Frontend
src/
components/
pages/
services/
context/
hooks/
types/


- **components** → componentes reutilizáveis
- **pages** → páginas da aplicação
- **services** → comunicação com API
- **context** → gerenciamento de autenticação
- **hooks** → hooks customizados
- **types** → tipagens TypeScript

---

## Backend
core/
models/
serializers/
views/
urls/


- **models** → estrutura do banco
- **serializers** → conversão JSON
- **views** → endpoints da API
- **urls** → roteamento

---

# Deploy

O projeto está publicado em ambiente de produção:

Frontend → Vercel  
Backend → PythonAnywhere

---

# Como rodar o projeto localmente

## Backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver


## Frontend
npm install
npm run dev


---

# Aprendizados com o projeto

Durante o desenvolvimento deste projeto pratiquei:

- construção de APIs REST
- autenticação baseada em token
- organização de código em serviços
- gerenciamento de estado no React
- integração frontend/backend
- tratamento de erros na interface
- paginação e infinite scroll

---

# Autor

Luan  
Backend Python Developer

## Screenshots

### Feed

![Feed](screenshots/feed.png)

### Perfil

![Profile](screenshots/profile.png)
