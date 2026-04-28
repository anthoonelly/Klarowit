# Memoist

> *transcript → document* — Polski generator dokumentacji projektowej z transkrypcji spotkań.

Memoist zamienia transkrypcję omówienia projektu w 7 dokumentów: opis projektu, dokumentację B+R (z odwołaniem do art. 4a CIT), harmonogram, kosztorys, rejestr ryzyk, SOW i brief executive. Aplikacja Next.js 14 z autentykacją, systemem tokenów, persystencją projektów i panelem administratora.

## Stack

- **Next.js 14** (App Router, Server Components, Edge middleware)
- **TypeScript** (strict)
- **OpenAI SDK** (gpt-5.4 default; konfigurowalny via `OPENAI_MODEL`)
- **Prisma** + **PostgreSQL** (auth, projekty, dokumenty, transakcje)
- **Własna autentykacja** — bcryptjs + JWT (jose) + cookies httpOnly
- **Mammoth** — parsowanie .docx (transkrypcje wgrywane przez użytkowników)
- **docx** — eksport wygenerowanych dokumentów do .docx

## Kluczowe funkcje

- 7 typów dokumentów, każdy z dedykowanym promptem (B+R z odwołaniem do art. 4a CIT).
- Autentykacja: rejestracja, logowanie, sesje 30-dniowe (JWT + DB record do unieważniania).
- System tokenów: 1 token ≈ prosty dokument, 2 tokeny ≈ standardowy, 3 tokeny ≈ B+R.
- Per-user projekty: każda generacja zapisuje się w projekcie, dostępnym pod `/projects/[id]`.
- Konto admina: pełen wgląd w użytkowników, doładowania tokenów, reset haseł, podgląd sesji.
- Tryb jasny / ciemny.
- Eksport do .docx z polskimi znakami i pełną hierarchią nagłówków.

## Setup lokalny — krok po kroku

### 1. Klucz OpenAI

Załóż konto na <https://platform.openai.com/api-keys>, wygeneruj klucz `sk-proj-...`. Doładuj choć $5 na konto żeby aktywować dostęp do gpt-5.4.

### 2. Baza danych Postgres

Najprostsze opcje (free tier):

- **Neon** (<https://neon.tech>) — kliknij "Create project", wybierz region eu-central-1, skopiuj `DATABASE_URL` z dashboardu.
- **Vercel Postgres** — zakładka Storage → Create Database → Postgres. Połączy się automatycznie po deployu.
- **Supabase** (<https://supabase.com>) — Project → Settings → Database → Connection string (use *Connection pooling* → *Transaction*).

Skopiuj URL połączenia, będziesz go potrzebował.

### 3. Konfiguracja `.env`

```bash
cp .env.example .env
```

Edytuj `.env` i wypełnij:

```ini
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-5.4

DATABASE_URL=postgresql://...   # z punktu 2

# Wygeneruj losowy sekret (32+ bajtów):
#   openssl rand -base64 32
AUTH_SECRET=...

# Email konta admina. Pierwszy użytkownik zarejestrowany z tym
# adresem dostanie automatycznie rolę ADMIN.
ADMIN_EMAIL=admin@example.com

# Bonus tokenowy dla nowych kont (5 = wystarczy na ~3 generacje)
SIGNUP_TOKEN_GIFT=5
```

### 4. Instalacja zależności

```bash
npm install
```

`postinstall` automatycznie wygeneruje klienta Prismy.

### 5. Migracja schematu DB

Pierwszy raz, na nowej bazie:

```bash
npm run db:push
```

To stworzy tabele User, Project, Document, Transaction, Session.

Dla produkcji preferuj migracje:

```bash
npm run db:migrate          # tworzy plik migracji
npm run db:migrate:deploy   # wykonuje na serwerze
```

### 6. Uruchom dev

```bash
npm run dev
```

Otwórz <http://localhost:3000>.

### 7. Pierwsze logowanie / utworzenie admina

1. Wejdź na <http://localhost:3000/signup>.
2. Zarejestruj się **tym samym emailem** który ustawiłeś w `ADMIN_EMAIL`.
3. Konto otrzymuje rolę ADMIN i bonus tokenowy.
4. Z menu użytkownika (kółko z inicjałami) wybierz "Panel admina".
5. Dla testów możesz w "Workspace" wczytać przykładową transkrypcję ("Wczytaj przykładową transkrypcję") i wygenerować kilka dokumentów.

## Workflow użytkownika końcowego

1. **Rejestracja** — `/signup`. Otrzymuje 5 tokenów na start.
2. **Workspace** — `/workspace`. Nazywa projekt, wkleja/wgrywa transkrypcję, zaznacza typy dokumentów.
3. **Generacja** — system sprawdza saldo. Jeśli za mało tokenów, wyskakuje modal z linkiem do `/account`. Jeśli OK, dokumenty generują się sekwencyjnie z streamingiem stanu.
4. **Persystencja** — projekt + dokumenty zapisują się w DB. Dostęp przez `/projects` (lista) i `/projects/[id]` (detal z bocznym panelem).
5. **Eksport** — każdy dokument można pobrać jako .docx.
6. **Regeneracja** — z konkretnym wskazaniem co poprawić; tworzy v2, v3, … zachowując historię.

## Workflow admina

Po zalogowaniu jako admin masz dodatkowy link "Admin" w nawigacji.

- `/admin` — lista wszystkich użytkowników z saldem i liczbą projektów.
- `/admin/users/[id]` — pełny widok jednego użytkownika:
  - **Doładuj tokeny** (`grant`, +/-) lub **ustaw saldo** (`set`) — z notką w historii.
  - **Reset hasła** — wymusza ponowne zalogowanie (kasuje wszystkie aktywne sesje).
  - **Zmiana roli** USER ↔ ADMIN (nie można zdegradować samego siebie).
  - Lista projektów użytkownika z linkami (admin może otwierać cudze projekty).
  - Historia transakcji tokenowych.
  - Aktywne sesje (User-Agent, IP, daty wygaśnięcia).

## Deployment na Vercel

1. **Push do GitHuba.**
2. **Import projektu** w Vercel: <https://vercel.com/new>.
3. **Environment Variables** — ustaw te same 6 zmiennych co lokalnie:
    - `OPENAI_API_KEY`
    - `OPENAI_MODEL`
    - `DATABASE_URL`
    - `AUTH_SECRET`
    - `ADMIN_EMAIL`
    - `SIGNUP_TOKEN_GIFT`
4. **Build command** — domyślny `npm run build` (uruchamia `prisma generate && next build`).
5. **Postgres**:
    - Jeśli używasz Neon/Supabase — `DATABASE_URL` po prostu wskazuje tam.
    - Jeśli Vercel Postgres — kliknij Storage → Add → Postgres, wybierz region najbliższy `Frankfurt (fra1)`. Vercel automatycznie podstawi `DATABASE_URL`.
6. Po pierwszym deployu uruchom migrację:
    - Jeśli używasz `db:push` — odpal lokalnie z `DATABASE_URL` produkcyjnym.
    - Jeśli używasz migracji Prismy — `npm run db:migrate:deploy` w job postdeploy lub lokalnie.
7. **Region funkcji** — w `vercel.json` (opcjonalnie) ustaw `"functions": { "app/api/**": { "maxDuration": 300 } }`. Aktualnie limit 300s jest ustawiony per-route w `app/api/generate/route.ts`. Plan Hobby ma jednak twardy limit 60s — w razie problemów upgrade do Pro lub skróć generacje.

## Koszty per generacja (token economics)

Wewnętrzny "token Memoist" ≠ token OpenAI. Mapowanie kosztów (1 token Memoist):

| Dokument | Tokeny |
|---|---|
| Brief executive | 1 |
| Harmonogram | 1 |
| Rejestr ryzyk | 1 |
| Opis projektu | 2 |
| Kosztorys | 2 |
| SOW | 2 |
| Dokumentacja B+R | 3 |

Realny koszt API gpt-5.4 dla pełnego pakietu (5 dokumentów ≈ 12 tokenów Memoist) to ~$0.05–0.20 w zależności od długości transkrypcji.

Modyfikacja w `lib/tokens.ts` (`TOKEN_COSTS`).

## Architektura

```
app/
├── (auth)/                  Strony logowania/rejestracji (publiczne)
│   ├── signin/page.tsx
│   └── signup/page.tsx
├── workspace/page.tsx       Generator (chroniony)
├── projects/                Lista i detal projektów (chronione)
│   ├── page.tsx
│   └── [id]/page.tsx
├── account/page.tsx         Saldo i zmiana hasła
├── admin/                   Panel admina (rola ADMIN)
│   ├── page.tsx
│   └── users/[id]/page.tsx
├── api/
│   ├── auth/                signup, signin, signout, me
│   ├── projects/            CRUD
│   ├── admin/users/         lista, tokens, password, role
│   ├── generate/            SSE streaming + token deduction + persist
│   ├── parse-file/          mammoth dla .docx
│   └── export-docx/         eksport JSON → .docx
├── page.tsx                 Landing (publiczna)
└── layout.tsx               Root layout

components/
├── topbar.tsx                Pasek nawigacji (real Linki, theme toggle, user menu)
├── transcript-pane.tsx       Lewy panel — meta NIE nakłada się już na textarea
├── document-pane.tsx         Prawy panel — banner z linkiem do projektu po generacji
├── workspace-client.tsx      Client wrapper z całą logiką generacji
├── auth-form.tsx             Formularz signin/signup
├── insufficient-tokens-modal.tsx  Modal "brak tokenów"
├── project-card.tsx, project-detail-view.tsx
├── account-client.tsx, admin-user-table.tsx, admin-user-client.tsx
├── theme-toggle.tsx          (zastępuje tweaks-panel)
└── ...

lib/
├── auth.ts          bcrypt + jose JWT + sesja
├── session.ts       getSessionUser, requireSessionUser, requireAdmin
├── db.ts            Prisma client singleton
├── tokens.ts        TOKEN_COSTS, deductTokens, refundTokens, grantTokens
├── llm.ts           OpenAI integration z tool_use
├── doc-types.ts     Definicje typów dokumentów + prompty
├── parse-transcript.ts, export-docx.ts, sample-data.ts, types.ts
└── ...

middleware.ts        Edge middleware — chroni /workspace, /projects, /account, /admin

prisma/schema.prisma User, Project, Document, Transaction, Session
```

## Zmienione/naprawione bugi (vs. poprzednia wersja Klarowit)

- **Licznik słów/linii nakładał się na tekst** — `.textarea__meta` przeniesiona z `position: absolute` do osobnego rzędu pod textarea (`globals.css`).
- **Pasek nawigacji nie działał** — `<a>` zamienione na Next.js `<Link>` z prawdziwymi routes; aktywna pozycja podświetlana.
- **Dokumenty nieznajdywalne po generacji** — dodany prominentny banner w prawym panelu z linkiem do `/projects/[id]` ("zobacz wszystkie w projekcie →"), tabki dokumentów lepiej widoczne, każda generacja zapisuje się jako Project w DB.
- **Pasek modyfikacji wyglądu zniknął** — został tylko theme toggle (jasny/ciemny) w topbarze.
- **Wymagane zalogowanie do generowania** — middleware redirectuje niezalogowanych do `/signin?next=...`.
- **Rebrand Klarowit → Memoist** — wszędzie, w tym SEO meta i favicon.

## Skrypty

```bash
npm run dev                  # tryb deweloperski
npm run build                # produkcja (prisma generate && next build)
npm run start                # serwer produkcyjny
npm run typecheck            # tylko typecheck bez emisji
npm run lint                 # eslint
npm run db:push              # synchronizuj schemat z DB (dev/szybkie iteracje)
npm run db:migrate           # utwórz migrację (prod-grade)
npm run db:migrate:deploy    # wykonaj migracje w produkcji
npm run db:studio            # GUI do bazy
```

## Dalsze kroki (V2)

- Stripe Checkout dla zakupu tokenów (admin → użytkownik flow już działa).
- Email reset password (link z tokenem) — obecnie tylko admin może resetować.
- Tagi i wyszukiwanie projektów.
- Współdzielenie projektów (read-only link).
- Webhook export do Google Drive / Notion.
