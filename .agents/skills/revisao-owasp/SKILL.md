---
name: revisao-owasp
description: "Revisa código backend em busca de vulnerabilidades do OWASP Top 10. Use quando: código de endpoint foi escrito, autenticação foi implementada, validações foram adicionadas, ou antes de considerar qualquer feature como completa. Aplicável a qualquer linguagem."
---

# Revisão de Segurança OWASP Top 10

## Quando Usar

- Após implementar qualquer endpoint público
- Após configurar autenticação ou autorização
- Após implementar queries ao banco de dados
- Antes de marcar qualquer funcionalidade de backend como concluída

## Procedimento

### Passo 1 — Identificar o escopo

Leia os arquivos de controllers, services e repositórios relevantes antes de iniciar a revisão.

### Passo 2 — Executar checklist por categoria

Percorra cada categoria abaixo e documente os achados com arquivo e linha.

---

### A01 — Broken Access Control

- [ ] Todos os endpoints verificam se o usuário autenticado tem permissão para o recurso solicitado (não apenas se está autenticado)
- [ ] IDs de recursos na URL são validados contra o usuário da sessão (`orders/:id` deve pertencer ao usuário logado)
- [ ] Nenhum endpoint admin está acessível sem role verificada
- [ ] Métodos HTTP corretos: leitura em GET, escrita em POST/PUT/PATCH/DELETE
- [ ] Listagens não retornam dados de outros usuários

**Padrão seguro:**
```typescript
// ✅ Verifica ownership antes de retornar
const order = await orderRepository.findById(orderId);
if (order.userId !== req.user.id) throw new ForbiddenError();
```

---

### A02 — Cryptographic Failures

- [ ] Senhas hasheadas com bcrypt (custo ≥ 12) ou Argon2 — nunca MD5, SHA1 ou SHA256 puro
- [ ] Tokens JWT usam algoritmo HS256 ou RS256 — nunca `none`
- [ ] Dados sensíveis não aparecem em logs (senhas, tokens, CPF, cartão)
- [ ] HTTPS obrigatório em produção
- [ ] Cookies com `Secure`, `HttpOnly` e `SameSite=Strict`

**Padrão seguro:**
```typescript
// ✅ bcrypt com custo adequado
const hashedPassword = await bcrypt.hash(password, 12);

// ❌ Proibido
const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
```

---

### A03 — Injection (SQL, NoSQL, Command)

- [ ] Nenhuma query construída por concatenação de string com input do usuário
- [ ] Uso de queries parametrizadas ou ORM em toda interação com banco
- [ ] Inputs não são passados para `exec()`, `eval()`, `child_process` ou equivalentes
- [ ] Nomes de tabelas/colunas dinâmicos têm whitelist explícita

**Padrão seguro:**
```typescript
// ✅ Query parametrizada
const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ Injeção possível
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

---

### A04 — Insecure Design

- [ ] Rate limiting configurado em endpoints de autenticação (login, reset de senha)
- [ ] Tentativas de login com falha têm limite e backoff
- [ ] Tokens de reset de senha são de uso único e expiram (máx. 15 min)
- [ ] Enumeração de usuários impossível (respostas iguais para email válido/inválido)

---

### A05 — Security Misconfiguration

- [ ] Headers de segurança configurados (`Helmet` no Node.js ou equivalente)
- [ ] CORS restrito a origens conhecidas — nunca `*` em produção
- [ ] Modo debug/stacktrace desativado em produção
- [ ] Variáveis de ambiente não têm valores default de produção no código
- [ ] Dependências atualizadas sem CVEs críticos conhecidos

**Headers obrigatórios:**
```
Content-Security-Policy
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
```

---

### A06 — Vulnerable and Outdated Components

- [ ] Verificar `npm audit` / `pip-audit` / equivalente no output de build
- [ ] Nenhuma dependência com CVE crítico ou alto sem mitigação documentada
- [ ] Versões de frameworks e libs estão na faixa de suporte ativo

---

### A07 — Identification and Authentication Failures

- [ ] JWT tem `exp` (expiração) configurado — máx. 15 min para access token
- [ ] Refresh token tem rotação (um uso por token) e expiração (7-30 dias)
- [ ] Logout invalida o token no servidor (blacklist ou rotação de chave por usuário)
- [ ] Múltiplas sessões simultâneas têm controle se for requisito de negócio

---

### A08 — Software and Data Integrity Failures

- [ ] Dependências instaladas de registros oficiais (npmjs, PyPI, Maven Central)
- [ ] Hashes de dependências verificados (package-lock.json, poetry.lock, etc.)
- [ ] CI/CD não aceita input externo não confiável como parâmetro de build

---

### A09 — Security Logging and Monitoring Failures

- [ ] Falhas de autenticação são logadas (email tentado, IP, timestamp)
- [ ] Acessos negados (403) são logados
- [ ] Logs não contêm dados sensíveis (senhas, tokens completos)
- [ ] Logs têm nível estruturado (JSON) para facilitar análise

---

### A10 — Server-Side Request Forgery (SSRF)

- [ ] URLs fornecidas por usuário não são requisitadas diretamente pelo servidor
- [ ] Se o servidor faz fetch de URLs externas, há whitelist de domínios permitidos
- [ ] Respostas de serviços internos não são repassadas diretamente ao cliente

---

### Passo 3 — Classificar achados

| Severidade | Critério |
|---|---|
| Crítica | Permite acesso a dados de outros usuários, RCE, bypass de autenticação |
| Alta | Expõe dados sensíveis, permite SSRF, injeção possível |
| Média | Configuração insegura, falta de rate limit, logs inadequados |
| Baixa | Headers ausentes, mensagens de erro verbosas |

### Passo 4 — Corrigir imediatamente

Toda vulnerabilidade **Crítica** ou **Alta** deve ser corrigida antes de reportar conclusão ao orquestrador. Vulnerabilidades **Média** e **Baixa** devem ser documentadas como pendências.

## Output Esperado

- Lista de vulnerabilidades encontradas com arquivo, linha e severidade
- Código corrigido para achados Críticos e Altos
- Lista de pendências para achados Médios e Baixos
- Confirmação de que os itens do checklist foram revisados
