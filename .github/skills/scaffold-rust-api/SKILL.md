---
name: scaffold-rust-api
description: "Cria estrutura completa de projeto Rust seguindo Clean Architecture com Axum + SQLx + PostgreSQL. Usa cargo via WSL para inicializar o projeto. Use quando: iniciar um novo projeto Rust, configurar Axum, definir estrutura de handlers, repositórios e use cases."
user-invocable: true
---

# Scaffold Rust API

## Quando Usar

- Ao iniciar um novo projeto de API em Rust
- Antes de qualquer implementação de código de negócio
- Quando o usuário solicitar "criar estrutura do projeto Rust"

## Premissas de Stack (Padrão)

| Camada | Tecnologia |
|---|---|
| Framework HTTP | Axum 0.7.x |
| Runtime async | Tokio 1.x |
| Banco de dados | PostgreSQL via SQLx 0.8.x |
| Serialização | Serde + serde_json |
| Erros | thiserror + anyhow |
| Validação | validator (derive) |
| Logging | tracing + tracing-subscriber |
| Auth | jsonwebtoken + argon2 |

---

## Procedimento

### Passo 1 — Confirmar nome e perguntas mínimas

Pergunte em **uma única mensagem**:
- Nome do projeto (snake_case, ex: `user-api`)
- Confirmação da stack (Axum + SQLx + PostgreSQL é o padrão)
- Qualquer variação: auth JWT inclusa? (sim por padrão)

### Passo 2 — Criar projeto via cargo no WSL

```bash
# No WSL
cargo new <nome-do-projeto>
cd <nome-do-projeto>

# Adicionar dependências
cargo add tokio --features full
cargo add axum --features macros
cargo add tower
cargo add tower-http --features cors,trace,compression-gzip
cargo add sqlx --features runtime-tokio,postgres,uuid,chrono,migrate
cargo add serde --features derive
cargo add serde_json
cargo add thiserror anyhow
cargo add validator --features derive
cargo add uuid --features v4,serde
cargo add chrono --features serde
cargo add tracing
cargo add tracing-subscriber --features env-filter,json
cargo add dotenvy
cargo add jsonwebtoken
cargo add argon2
cargo add async-trait

# Dev dependencies
cargo add --dev tokio --features full
cargo add --dev axum-test
cargo add --dev mockall
cargo add --dev rstest

# Verificar que compila
cargo check
```

### Passo 3 — Criar estrutura de diretórios

```bash
mkdir -p src/domain
mkdir -p src/application/user
mkdir -p src/infrastructure/database
mkdir -p src/infrastructure/http/handlers
mkdir -p src/infrastructure/http/middleware
mkdir -p src/infrastructure/http/dto
mkdir -p src/config
mkdir -p migrations
mkdir -p tests
```

### Passo 4 — Criar arquivos base

#### `src/main.rs`
```rust
use std::net::SocketAddr;
use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod domain;
mod application;
mod infrastructure;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // Env
    dotenvy::dotenv().ok();
    let config = config::AppConfig::from_env()?;

    // Database
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    // App state & router
    let state = infrastructure::http::AppState::new(pool);
    let app = infrastructure::http::router::create_router(state);

    // Serve
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
```

#### `src/config/mod.rs`
```rust
#[derive(Debug)]
pub struct AppConfig {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
}

impl AppConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            database_url: std::env::var("DATABASE_URL")?,
            jwt_secret: std::env::var("JWT_SECRET")?,
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "8080".into())
                .parse()?,
        })
    }
}
```

#### `src/domain/mod.rs`
```rust
pub mod error;
pub mod user;
```

#### `src/domain/error.rs`
```rust
use uuid::Uuid;

#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("Entity not found: {id}")]
    NotFound { id: Uuid },

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
}
```

#### `src/domain/user.rs`
```rust
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
}

impl User {
    pub fn new(email: String, name: String, password_hash: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            email,
            name,
            password_hash,
            created_at: Utc::now(),
        }
    }
}

/// Port: Repositório de usuário (trait)
#[async_trait::async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, crate::domain::error::DomainError>;
    async fn find_by_email(&self, email: &str) -> Result<Option<User>, crate::domain::error::DomainError>;
    async fn save(&self, user: &User) -> Result<(), crate::domain::error::DomainError>;
}
```

#### `src/application/mod.rs`
```rust
pub mod user;
```

#### `src/infrastructure/mod.rs`
```rust
pub mod database;
pub mod http;
```

#### `src/infrastructure/http/mod.rs`
```rust
pub mod dto;
pub mod handlers;
pub mod middleware;
pub mod router;

use std::sync::Arc;
use sqlx::PgPool;
use crate::application::user::{CreateUserUseCase, GetUserUseCase};
use crate::infrastructure::database::user_repository::PostgresUserRepository;

#[derive(Clone)]
pub struct AppState {
    pub create_user: Arc<CreateUserUseCase>,
    pub get_user: Arc<GetUserUseCase>,
}

impl AppState {
    pub fn new(pool: PgPool) -> Self {
        let repo = Arc::new(PostgresUserRepository::new(pool));
        Self {
            create_user: Arc::new(CreateUserUseCase::new(repo.clone())),
            get_user: Arc::new(GetUserUseCase::new(repo)),
        }
    }
}
```

#### `src/infrastructure/http/router.rs`
```rust
use axum::{Router, routing::{get, post}};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use super::{AppState, handlers::user_handler::{create_user_handler, get_user_handler}};

pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/api/v1/users", post(create_user_handler))
        .route("/api/v1/users/:id", get(get_user_handler))
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(state)
}
```

#### `src/infrastructure/http/middleware/mod.rs`
```rust
pub mod error;
```

#### `src/infrastructure/http/middleware/error.rs`
```rust
use axum::{http::StatusCode, response::{IntoResponse, Response}, Json};
use serde_json::json;
use crate::domain::error::DomainError;

pub struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self.0.downcast_ref::<DomainError>() {
            Some(DomainError::NotFound { id }) =>
                (StatusCode::NOT_FOUND, format!("Not found: {id}")),
            Some(DomainError::Conflict(msg)) =>
                (StatusCode::CONFLICT, msg.clone()),
            Some(DomainError::Validation(msg)) =>
                (StatusCode::UNPROCESSABLE_ENTITY, msg.clone()),
            Some(DomainError::Unauthorized) =>
                (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
            _ => {
                tracing::error!("Unhandled error: {:?}", self.0);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl<E: Into<anyhow::Error>> From<E> for AppError {
    fn from(err: E) -> Self {
        Self(err.into())
    }
}
```

#### `.env.example`
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=8080
RUST_LOG=info
```

#### `migrations/0001_create_users.sql`
```sql
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
```

### Passo 5 — Verificar e compilar

```bash
cargo check           # Erros de tipo e borrowing
cargo clippy          # Lints
cargo fmt             # Formatação
cargo test            # Testes (nenhum ainda, mas valida setup)
```

### Passo 6 — Registrar estrutura criada

Confirme ao usuário:
- Estrutura de pastas criada
- Arquivo `Cargo.toml` com dependências
- `domain/` com structs e trait de repositório
- `infrastructure/http/` com router, handlers e error middleware
- `migrations/` com migration inicial
- `.env.example` com variáveis necessárias
- Próximos passos: implementar use cases e repositório PostgreSQL

---

## Estrutura Final Esperada

```
<nome-do-projeto>/
├── Cargo.toml
├── Cargo.lock
├── .env.example
├── migrations/
│   └── 0001_create_users.sql
├── src/
│   ├── main.rs
│   ├── config/
│   │   └── mod.rs
│   ├── domain/
│   │   ├── mod.rs
│   │   ├── error.rs
│   │   └── user.rs
│   ├── application/
│   │   ├── mod.rs
│   │   └── user/
│   │       ├── mod.rs
│   │       ├── create_user.rs
│   │       └── get_user.rs
│   └── infrastructure/
│       ├── mod.rs
│       ├── database/
│       │   ├── mod.rs
│       │   └── user_repository.rs
│       └── http/
│           ├── mod.rs
│           ├── router.rs
│           ├── handlers/
│           │   ├── mod.rs
│           │   └── user_handler.rs
│           ├── middleware/
│           │   ├── mod.rs
│           │   └── error.rs
│           └── dto/
│               ├── mod.rs
│               ├── request.rs
│               └── response.rs
└── tests/
    └── integration_test.rs
```
