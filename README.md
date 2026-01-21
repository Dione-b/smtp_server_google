# Serviço de Validação de Email API

## Visão Geral
Um serviço de verificação de email robusto e escalável construído com Flask, projetado para gerenciar múltiplos projetos com configurações de email individuais. O serviço fornece uma API RESTful para fluxos de trabalho de verificação de email, suportando modelos de email personalizados e configurações SMTP específicas para cada projeto.

## Stack Tecnológica
- **Framework**: Flask 3.0.0
- **Banco de Dados**: SQLAlchemy com SQLite
- **Autenticação**: JWT (JSON Web Tokens)
- **Serviço de Email**: Flask-Mail
- **Suporte CORS**: Flask-CORS
- **Segurança**: URL Safe Timed Serializer para geração de tokens

## Arquitetura
A aplicação segue uma arquitetura modular com:
- **Models**: Esquema de banco de dados e relacionamentos
- **Routes**: Endpoints da API e lógica de negócios
- **Utils**: Funções auxiliares e manipulação de email
- **Config**: Configurações específicas do ambiente

## Esquema do Banco de Dados

### Project (Projeto)
```sql
CREATE TABLE project (
    id INTEGER PRIMARY KEY,
    api_key VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    mail_username VARCHAR(120),
    mail_password VARCHAR(120),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### User (Usuário)
```sql
CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    email VARCHAR(120) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### VerificationStatus (Status de Verificação)
```sql
CREATE TABLE verification_status (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (project_id) REFERENCES project(id)
);
```

## Documentação da API

### Autenticação
A API usa JWT (JSON Web Tokens) para autenticação. Todas as rotas protegidas exigem um token Bearer no cabeçalho de Autorização.

```http
Authorization: Bearer <seu_token_jwt>
```

### Endpoints

#### 1. Criar Projeto
```http
POST /api/projects
Content-Type: application/json

{
    "name": "Nome do Projeto",
    "description": "Descrição do Projeto",
    "mail_username": "usuario_smtp@exemplo.com",
    "mail_password": "senha_smtp"
}
```
**Resposta**: 
```json
{
    "message": "Projeto criado com sucesso",
    "project": {
        "id": 1,
        "api_key": "chave_api_gerada",
        "name": "Nome do Projeto",
        "description": "Descrição do Projeto",
        "mail_username": "usuario_smtp@exemplo.com"
    }
}
```

#### 2. Autenticação do Projeto
```http
POST /api/login
Content-Type: application/json

{
    "api_key": "sua_chave_api_do_projeto"
}
```
**Resposta**:
```json
{
    "message": "Login realizado com sucesso",
    "project": {
        "id": 1,
        "api_key": "sua_chave_api_do_projeto",
        "name": "Nome do Projeto",
        "description": "Descrição do Projeto"
    },
    "access_token": "token_jwt"
}
```

#### 3. Login de Administrador
```http
POST /api/admin-login
Content-Type: application/json

{
    "email": "admin@exemplo.com",
    "password": "senha_admin"
}
```
**Resposta**:
```json
{
    "access_token": "token_jwt"
}
```

#### 4. Listar Projetos (Requer autenticação JWT)
```http
GET /api/projects
Authorization: Bearer <token_jwt>
```
**Resposta**:
```json
{
    "projects": [
        {
            "id": 1,
            "name": "Nome do Projeto",
            "description": "Descrição do Projeto",
            "api_key": "chave_api_do_projeto",
            "mail_username": "usuario_smtp@exemplo.com",
            "created_at": "2025-03-25T14:59:23"
        }
    ]
}
```

#### 5. Registrar Email para Verificação
```http
POST /api/register
Content-Type: application/json

{
    "email": "usuario@exemplo.com",
    "api_key": "chave_api_do_projeto"
}
```
**Resposta**:
```json
{
    "message": "Registro realizado com sucesso. Verifique seu email.",
    "user": {
        "id": 1,
        "email": "usuario@exemplo.com",
        "project": "Nome do Projeto",
        "verified": false
    }
}
```

#### 6. Verificar Email
```http
GET /api/verify/<token_verificacao>
```
**Resposta**:
```json
{
    "message": "Email verificado com sucesso",
    "project": "Nome do Projeto"
}
```

#### 7. Verificar Status de Verificação (Requer autenticação JWT)
```http
POST /api/check-verification?email=usuario@exemplo.com&api_key=chave_api_do_projeto
Authorization: Bearer <token_jwt>
```
**Resposta**:
```json
{
    "verified": true,
    "verified_at": "2025-03-25T15:30:45"
}
```

#### 8. Listar Usuários (Requer autenticação JWT)
```http
GET /api/users
Authorization: Bearer <token_jwt>
```
**Resposta**:
```json
[
    {
        "id": 1,
        "email": "usuario@exemplo.com",
        "verified": true,
        "created_at": "2025-03-25T14:59:23"
    }
]
```

#### 9. Enviar Email Customizado (Requer autenticação JWT)
```http
POST /api/send-custom-email
Authorization: Bearer <token_jwt>
Content-Type: application/json

{
    "recipients": ["destinatario@exemplo.com", "outro@exemplo.com"],
    "api_key": "chave_api_do_projeto",
    "subject": "Assunto do Email",
    "body": "Corpo do email em texto simples",
    "html_content": "<h1>Corpo do email em HTML</h1><p>Conteúdo formatado</p>",
    "sender": "seu_email@exemplo.com",
    "attachments": [
        ["nome_do_arquivo.pdf", "application/pdf", "conteúdo_codificado_em_base64"]
    ],
    "cc": ["copia@exemplo.com"],
    "bcc": ["copia_oculta@exemplo.com"],
    "reply_to": "responder_para@exemplo.com"
}
```
**Resposta**:
```json
{
    "message": "Email enviado com sucesso",
    "details": {
        "recipients_count": 2,
        "subject": "Assunto do Email",
        "api_key": "chave_api_do_projeto",
        "project_name": "Nome do Projeto"
    }
}
```

### Detalhes do Envio de Email Customizado

A funcionalidade de envio de email customizado suporta diversos parâmetros para personalização completa das mensagens:

#### Parâmetros Obrigatórios:
- **recipients**: Lista de endereços de email dos destinatários (array de strings)
- **api_key**: Chave API do projeto (string)

#### Parâmetros Opcionais:
- **subject**: Assunto do email (string, padrão: "Sem assunto")
- **body**: Corpo do email em texto simples (string)
- **html_content**: Corpo do email em formato HTML (string)
- **sender**: Email do remetente (string, padrão: configuração do projeto)
- **attachments**: Anexos do email (array de arrays no formato [nome_arquivo, tipo_mime, conteúdo])
- **cc**: Lista de emails em cópia (array de strings)
- **bcc**: Lista de emails em cópia oculta (array de strings)
- **reply_to**: Email para resposta (string)
- **date**: Data de envio (string no formato ISO)
- **charset**: Conjunto de caracteres (string, padrão: "utf-8")
- **extra_headers**: Cabeçalhos adicionais (objeto)
- **mail_options**: Opções de envio SMTP (array)
- **rcpt_options**: Opções de recebimento SMTP (array)

#### Detalhes sobre Anexos:

Os anexos devem ser fornecidos como um array de arrays, onde cada anexo segue o formato:
```
["nome_do_arquivo.extensao", "tipo_mime", "conteudo_codificado_em_base64"]
```

Exemplos de tipos MIME comuns:
- PDF: "application/pdf"
- Imagem JPEG: "image/jpeg"
- Imagem PNG: "image/png"
- Documento Word: "application/msword"
- Planilha Excel: "application/vnd.ms-excel"
- Arquivo ZIP: "application/zip"

Exemplo de como anexar um arquivo PDF:
```json
"attachments": [
    ["documento.pdf", "application/pdf", "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL1hPYmplY3QvU3VidHlwZS9JbWFnZS9XaWR0..."],
    ["imagem.jpg", "image/jpeg", "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a..."],
]
```

## Recursos de Segurança

1. **Geração de Chave API**: Geração segura usando o módulo `secrets` do Python
2. **Autenticação JWT**: Autenticação baseada em token com expiração de 1 hora
3. **Verificação de Email**: Tokens com limite de tempo para verificação de email
4. **Proteção CORS**: Políticas CORS configuradas para acesso à API
5. **Segurança de Senha**: Credenciais SMTP do projeto são armazenadas de forma segura
6. **Validação de Entrada**: Validação de formato de email e sanitização de entrada

## Tratamento de Erros
A API implementa tratamento abrangente de erros:
- Chaves API inválidas
- Tokens expirados
- Formatos de email inválidos
- Erros de configuração SMTP
- Violações de restrições do banco de dados

## Recomendações de Limitação de Taxa
Para proteger contra abusos, implemente limitação de taxa em:
- Solicitações de verificação de email
- Tentativas de login
- Criação de projeto
- Envio de email

## Variáveis de Ambiente
Crie um arquivo `.env` com:
```env
FLASK_ENV=development
SECRET_KEY=sua_chave_secreta
JWT_SECRET_KEY=sua_chave_jwt_secreta
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
ADMIN_EMAIL=admin@exemplo.com
ADMIN_PASSWORD=senha_admin_segura
```

## Instalação e Configuração

1. Clone o repositório
```bash
git clone <url_do_repositorio>
cd validator_email_jm2
```

2. Crie e ative o ambiente virtual
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

3. Instale as dependências
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

5. Inicialize o banco de dados
```bash
python init_db.py
```

6. Execute a aplicação
```bash
python app.py
```

## Testes
```bash
pytest tests/
```

## Considerações de Desempenho
- Indexação de banco de dados em campos frequentemente consultados
- Cache para dados acessados com frequência
- Envio assíncrono de email
- Pooling de conexão para operações de banco de dados

## Monitoramento e Logging
Implementar monitoramento para:
- Tempos de resposta da API
- Taxas de sucesso de envio de email
- Taxas de conclusão de verificação
- Taxas e tipos de erro

## Melhorias Futuras
1. Suporte a múltiplos provedores de email
2. API de personalização de modelos
3. Notificações por webhook
4. Painel de análise
5. Suporte a verificação em massa
6. Suporte a domínio personalizado

## Contribuindo
Por favor, leia [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e o processo para enviar pull requests.

## Licença
Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
