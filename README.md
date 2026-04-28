# Klarowit — transkrypcja → dokumentacja

Aplikacja Next.js do generowania profesjonalnych dokumentów projektowych
z transkrypcji spotkań — opis projektu, dokumentacja B+R, harmonogram,
kosztorys, rejestr ryzyk, SOW i brief executive. Polskie projekty B+R z
odwołaniami do art. 4a pkt 26–28 ustawy o CIT.

Zasilane przez **OpenAI** (GPT-5.4 / GPT-5.5). Edytorska, refined-minimalist
estetyka.

## Funkcje

- **7 typów dokumentów** — każdy z dedykowanym promptem i strukturą sekcji.
- **Streaming generacji** — Server-Sent Events; widać postęp i status każdego dokumentu osobno.
- **Wgrywanie plików** — `.txt`, `.md`, `.vtt`, `.srt`, `.docx` (do 10 MB).
- **Eksport do Word** — pełnoprawny `.docx` z hierarchią nagłówków.
- **Regeneracja z uwagami** — modal z 5 presetami i polem notatki, każda regeneracja tworzy nową wersję.
- **Biblioteka kontekstu** — instrukcje globalne + wzorce / szablony firmowe (zapisywane lokalnie).
- **Personalizacja wyglądu** — 4 akcenty, motyw jasny/ciemny, 3 kroje serif, 2 gęstości.
- **Anulowanie** — przerwij generację w trakcie.
- **TypeScript strict** — pełna kontrola typów.
- **Mobile responsive** — layout adaptuje się przy 1100px i 860px.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- `openai` — generacja przez function calling (gwarantowany strukturalny JSON)
- `mammoth` — parsowanie wgrywanych `.docx`
- `docx` — eksport do Worda
- Plain CSS — pełna paleta tokenów + dark mode + responsive

## Skąd wziąć klucz OpenAI

1. Wejdź na [platform.openai.com](https://platform.openai.com/) i zaloguj się.
2. Settings (ikona koła zębatego, prawy górny róg) → **API keys** w lewym menu.
3. **Create new secret key** → nazwij go np. `klarowit` → skopiuj. Klucz pokazuje się tylko raz, zapisz go bezpiecznie.
4. **Billing → Add payment method** i doładuj saldo (minimum $5). Bez salda klucz zwróci błąd 429.

Wygenerowanie kompletu 7 dokumentów na `gpt-5.4` to koszt ok. **$0.05–0.10**.

## Szybki start (lokalnie)

```bash
# 1. Zainstaluj zależności
npm install

# 2. Skonfiguruj API key
cp .env.example .env.local
# Otwórz .env.local i wklej swój klucz z https://platform.openai.com/api-keys

# 3. Uruchom dev server
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

## Deployment na Vercel

### Najszybsza metoda

```bash
# Zainstaluj Vercel CLI (jeśli nie masz)
npm i -g vercel

# Deploy
vercel
```

Vercel zapyta o:
- Link projektu (utwórz nowy)
- Framework (Next.js — wykryje automatycznie)
- Build command (`next build` — domyślny)

Po pierwszym deployu **musisz dodać zmienną środowiskową**:

```bash
vercel env add OPENAI_API_KEY
# Wklej klucz (sk-proj-...), wybierz "Production, Preview, Development", potwierdź.

# (Opcjonalnie) wymuś inny model:
vercel env add OPENAI_MODEL
# np. gpt-5.5

# Zredeployuj żeby zmienne środowiskowe zostały podpięte:
vercel --prod
```

Albo przez dashboard: **Settings → Environment Variables → Add**.

### Deploy via dashboard / GitHub

1. Push repo na GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import.
3. **Environment Variables** — dodaj `OPENAI_API_KEY` (i opcjonalnie `OPENAI_MODEL`).
4. Deploy.

### ⚠️ Limit czasu funkcji na Vercel

Generacja każdego dokumentu zajmuje 15–60s. Vercel ma limity:

- **Hobby (free):** 60s na funkcję — wystarczy na 1–2 dokumenty.
- **Pro:** 300s — wystarczy na wszystkie 7 typów naraz.

W `app/api/generate/route.ts` jest `export const maxDuration = 300;`.
Na hobby będzie zcapowane do 60s (Vercel zignoruje wyższą wartość).

Gdy generujesz wiele dokumentów na hobby tier, spakowanie do 60s
może być za mało. Opcje:
1. Generuj 1–2 dokumenty naraz (najszybsze).
2. Upgrade do Pro.
3. Użyj szybszego modelu (`gpt-5.4-mini`) — generuje szybciej.

## Konfiguracja modelu

W `.env.local` lub Vercel env vars:

```bash
OPENAI_API_KEY=sk-proj-xxx           # wymagane
OPENAI_MODEL=gpt-5.4                 # opcjonalne, default
```

Dostępne modele (kwiecień 2026):
- `gpt-5.5` — najnowszy flagship (Apr 2026), najlepsza jakość, $5/$30 per 1M tokens.
- `gpt-5.4` — domyślny, stabilny, dobry balans jakość/cena.
- `gpt-5.4-mini` — szybszy i tańszy, akceptowalna jakość dla mniej formalnych dokumentów.
- `gpt-5.4-nano` — najtańszy, niższa jakość dokumentacji formalnej.

Dla polskich dokumentów B+R zalecam `gpt-5.4` lub `gpt-5.5`.

## Struktura projektu

```
klarowit/
├── app/
│   ├── api/
│   │   ├── generate/route.ts      # SSE streaming generacji
│   │   ├── parse-file/route.ts    # upload + parsing (txt, vtt, srt, docx)
│   │   └── export-docx/route.ts   # eksport do Worda
│   ├── globals.css                # kompletny system designu
│   ├── layout.tsx
│   └── page.tsx                   # główny komponent
├── components/                    # 11 komponentów React
├── hooks/                         # 3 hooki (generation, localStorage, tweaks)
├── lib/
│   ├── llm.ts                     # OpenAI SDK + prompt builder + function calling
│   ├── doc-types.ts               # 7 typów dokumentów + ich prompty
│   ├── export-docx.ts             # generowanie .docx
│   ├── parse-transcript.ts        # parsowanie plików (vtt/srt/docx)
│   ├── sample-data.ts
│   └── types.ts                   # centralne typy
├── package.json
├── tsconfig.json
├── next.config.mjs
├── .env.example
└── README.md
```

## Architektura

### Generacja jest sekwencyjna i streamowana

`POST /api/generate` zwraca SSE strumień. Dokumenty generowane są
sekwencyjnie żeby zachować kolejność tabów (`queued → generating → done`).

Eventy SSE:
- `progress` — postęp 0–100%
- `doc_start` — zaczynamy generację dokumentu o danym ID
- `doc_complete` — gotowy dokument ze strukturą JSON
- `doc_error` — pojedynczy dokument się wywalił, pozostałe lecą dalej
- `done` — wszystko skończone
- `error` — fatal error całej generacji

### Strukturalny output przez function calling

Zamiast prosić model o JSON w odpowiedzi, używamy
`tool_choice: { type: 'function', function: { name: 'submit_document' } }`.
To wymusza poprawny strukturalny output zgodny z JSON Schema — bez ryzyka
malformed JSON.

### Persystencja w localStorage

- `klarowit:tweaks` — preferencje wyglądu (akcent, motyw, etc.)
- `klarowit:instructions` — instrukcje globalne dla AI
- `klarowit:examples` — biblioteka wzorców

Hook `useLocalStorage` jest SSR-safe (najpierw renderuje wartość
domyślną, potem hydratuje ze storage żeby nie było mismatch'a).

## Customizacja

### Dodanie nowego typu dokumentu

1. W `lib/types.ts` dodaj ID do `DocTypeId`.
2. W `lib/doc-types.ts` dodaj wpis do `DOC_TYPES` z
   `sections` (lista nagłówków) i `guidance` (instrukcje dla modelu).
3. To wszystko — UI automatycznie pokaże nowy typ.

### Zmiana palety akcentu

W `app/globals.css`:

```css
[data-accent="custom"] {
  --accent: #YOUR_HEX;
  --accent-soft: #YOUR_HEX_SOFT;
}
```

I dodaj opcję w `components/tweaks-panel.tsx`.

### Zmiana promptu globalnego

`lib/sample-data.ts` → `DEFAULT_INSTRUCTIONS`. Możesz też zostawić
puste — wtedy `lib/llm.ts → buildSystemPrompt` użyje samego
`docType.guidance`.

## Limity i koszty

- Generacja jednego dokumentu: ~3000–8000 tokenów input + ~2000–4000 output.
- `gpt-5.4`: ~$0.05–0.10 za pełen pakiet 7 dokumentów.
- `gpt-5.5`: ~$0.15–0.30 za pełen pakiet 7 dokumentów.
- `gpt-5.4-mini`: ~$0.01–0.03 za pełen pakiet.
- Plik wgrywany: max 10 MB.
- Transkrypcja: brak twardego limitu, ale >50k słów może spowolnić generację.

## Bezpieczeństwo

- API key trzymany **wyłącznie po stronie serwera** (env var). Nigdy nie
  wysyłany do przeglądarki.
- Plik wgrywany jest parsowany w pamięci, nie zapisywany na dysk.
- Transkrypcje, instrukcje i wzorce zapisywane są **tylko lokalnie**
  w przeglądarce użytkownika (localStorage). Nie są przesyłane na żadne
  zewnętrzne API poza OpenAI w momencie generacji.
- `robots: noindex` w metadanych — domyślnie aplikacja nie jest
  indeksowana przez wyszukiwarki.

## Rozwiązywanie problemów

**"OPENAI_API_KEY is not set"**
→ Dodaj klucz do `.env.local` (lokalnie) lub Vercel Environment Variables (deploy). Restart dev server po edycji `.env.local`.

**HTTP 401 / Incorrect API key provided**
→ Klucz nieprawidłowy lub usunięty. Wygeneruj nowy na [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

**HTTP 429 / Rate limit exceeded lub Insufficient quota**
→ Brak salda na koncie OpenAI. Doładuj na [platform.openai.com/billing](https://platform.openai.com/billing) (min $5).

**HTTP 400 / model_not_found**
→ Model wpisany w `OPENAI_MODEL` nie jest dostępny w twoim tier'ze (np. gpt-5.5 wymaga wyższego tier'a). Przełącz na `gpt-5.4`.

**Generacja zatrzymuje się po 60s na Vercel**
→ Hobby tier ma cap 60s. Upgrade do Pro lub generuj mniej dokumentów naraz.

**"Model nie wywołał funkcji submit_document"**
→ Bardzo rzadkie — zwykle przy bardzo krótkich transkrypcjach. Wydłuż transkrypcję lub spróbuj ponownie.

**Plik .docx nie chce się wczytać**
→ Plik może być uszkodzony lub zaszyfrowany. Otwórz go w Wordzie i zapisz ponownie jako `.docx`, albo skopiuj treść do `.txt`.

**Polskie znaki łamią się w eksporcie**
→ Eksport używa fontu Calibri, który ma pełne wsparcie polskich znaków. Jeśli widzisz krzaczki, sprawdź czy Word ma zainstalowany Calibri.

## Licencja

Prywatne — przeznaczone do użytku komercyjnego dla zespołu wykonującego projekt.
