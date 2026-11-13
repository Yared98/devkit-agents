---
name: scaffold-react
description: "Configura o projeto React ou Next.js do zero com estrutura de pastas, dependências e convenções padrão do agente de frontend DevKit. Use quando: iniciar um novo projeto frontend, definir estrutura de componentes, configurar Tailwind, React Query, Zustand e roteamento."
---

# Scaffold React / Next.js

## Quando Usar

- Ao iniciar qualquer projeto frontend do zero
- Antes de criar componentes ou páginas
- Quando o agente de arquitetura definir frontend React/Next.js

## Decisão: React SPA vs Next.js

| Critério | React SPA (Vite) | Next.js |
|---|---|---|
| App sem SEO, dashboard interno | ✅ | — |
| App pública, landing, e-commerce | — | ✅ |
| SSR / SSG necessário | — | ✅ |
| Simples, deploy estático | ✅ | — |
| Full-stack com API Routes | — | ✅ |

**Padrão**: sempre sugira Next.js para projetos novos. Use React SPA apenas quando SEO não for relevante e a arquitetura for explicitamente SPA.

## Procedimento

### Passo 1 — Criar projeto base

#### Next.js (padrão)
```bash
npx create-next-app@latest {nome-projeto} \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

#### React SPA (Vite)
```bash
npm create vite@latest {nome-projeto} -- --template react-ts
cd {nome-projeto}
npm install
```

### Passo 2 — Instalar dependências padrão

```bash
# HTTP e estado de servidor
npm install @tanstack/react-query axios

# Estado global
npm install zustand

# Validação de formulários
npm install react-hook-form zod @hookform/resolvers

# Utilitários de UI (se Tailwind estiver ativo)
npm install clsx tailwind-merge

# Testes
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Passo 3 — Definir estrutura de pastas

```
src/
├── app/                    # Next.js App Router (ou pages/ para Pages Router)
│   ├── layout.tsx
│   ├── page.tsx
│   └── (rotas)/
├── components/
│   ├── ui/                 # Componentes genéricos reutilizáveis (Button, Input, Modal)
│   └── features/           # Componentes de domínio (OrderCard, UserProfile)
├── hooks/                  # Custom hooks
├── services/               # Funções de chamada à API (axios/fetch)
│   └── api/
├── stores/                 # Stores Zustand
├── types/                  # Tipos e interfaces TypeScript
├── utils/                  # Funções utilitárias puras
└── lib/                    # Configurações de libs (queryClient, axios instance)
```

### Passo 4 — Configurar axios instance

Criar `src/lib/axios.ts`:
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para token de autenticação
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined'
    ? sessionStorage.getItem('token')
    : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
```

### Passo 5 — Configurar React Query

Criar `src/lib/query-client.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});
```

Adicionar provider em `src/app/layout.tsx` (Next.js) ou `src/main.tsx` (Vite).

### Passo 6 — Criar utilitário cn() para Tailwind

Criar `src/utils/cn.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### Passo 7 — Criar .env.example

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Passo 8 — Configurar Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

## Convenções de Componentes

Todo componente deve seguir:

```typescript
// Sempre tipado com interface Props explícita
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

// Função com nome explícito (não arrow function anônima)
export function Button({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded font-medium',
        variant === 'primary' && 'bg-blue-600 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        variant === 'danger' && 'bg-red-600 text-white',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {label}
    </button>
  );
}
```

## Output Esperado

- Projeto criado com estrutura de pastas completa
- Dependências instaladas
- `src/lib/axios.ts` configurado
- `src/lib/query-client.ts` configurado
- `src/utils/cn.ts` criado
- `.env.example` criado
- Instruções para rodar (`npm run dev`)
