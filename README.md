# Rekruna - AI-drevet CV Screening

En AI-powered recruitment screening tool der analyserer CV'er mod jobkrav og giver objektive kandidat rankings på minutter.

## 🚀 Quick Start

```bash
# Installer dependencies
npm install

# Kopier environment variables
cp env.example .env.local
# Udfyld dine credentials i .env.local

# Kør development server
npm run dev

# Åbn http://localhost:3000
```

## 📋 Krav

- Node.js 18+ og npm
- Supabase konto (gratis tier virker)
- OpenAI API key (med GPT-4o-mini adgang)
- Stripe konto (til betalinger)

## 🏗️ Projekt Struktur

```
recruitment-screener/
├── app/                     # Next.js 15 App Router
│   ├── (auth)/             # Autentificering routes
│   ├── (dashboard)/        # Dashboard routes
│   ├── api/                # API routes
│   ├── globals.css         # Global styling
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/             # React komponenter
│   ├── ui/                 # shadcn/ui komponenter
│   ├── landing/            # Landing page komponenter
│   ├── auth/               # Auth komponenter
│   └── analysis/           # Analyse komponenter
├── lib/                    # Utilities og hooks
│   ├── supabase/          # Supabase konfiguration
│   ├── utils/             # Hjælpefunktioner
│   └── hooks/             # Custom React hooks
├── types/                  # TypeScript types
└── documentation/          # Projekt dokumentation
```

## 🔧 Setup Guide

### 1. Supabase Setup

1. Opret nyt Supabase projekt på [supabase.com](https://supabase.com)
2. Kør database migrationer fra `documentation/technical_architecture.md`
3. Aktiver Row Level Security policies fra `documentation/security_privacy_spec.md`
4. Kopier projekt URL og keys til `.env.local`

### 2. OpenAI Setup

1. Opret OpenAI konto på [platform.openai.com](https://platform.openai.com)
2. Generer API key med GPT-4o-mini adgang
3. Tilføj til `.env.local` som `OPENAI_API_KEY`

### 3. Stripe Setup

1. Opret Stripe konto på [stripe.com](https://stripe.com)
2. Opret Payment Link for 299 DKK månedligt abonnement
3. Setup webhook endpoint til `/api/auth/stripe-webhook`
4. Tilføj keys til `.env.local`

## 🎯 Nøgle Funktioner

- **Job Analyse**: Upload jobopslag og udtræk nøglekrav
- **CV Processing**: Batch proces 20-50 CV'er med AI-powered analyse
- **Objektiv Scoring**: 0-10 rating skala med detaljeret begrundelse
- **Dansk Sprog**: Fuld dansk UI og sprogunderstøttelse
- **Real-time Updates**: Fremskridt tracking under analyse
- **PDF Rapporter**: Download kandidat assessment rapporter
- **GDPR Compliant**: 30-dages automatisk CV sletning

## 🧪 Testing

```bash
# Kør component tests
npm test

# Kør E2E tests
npm run test:e2e

# Kør alle tests
npm run test:all
```

## 📦 Deployment

Projektet er konfigureret til Vercel deployment:

```bash
# Installer Vercel CLI
npm i -g vercel

# Deploy til production
vercel --prod
```

## 📚 Dokumentation

Al projekt dokumentation findes i `documentation/` mappen:

- **[Project Overview](documentation/project_overview.md)** - Business krav og features
- **[Technical Architecture](documentation/technical_architecture.md)** - System design og tech stack
- **[Development Roadmap](documentation/development_roadmap.md)** - Trin-for-trin implementerings guide
- **[API Specification](documentation/api_specification.md)** - Komplet API dokumentation
- **[UI/UX Specification](documentation/ui_ux_specification.md)** - Komponent bibliotek og design
- **[Scoring System](documentation/scoring_system.md)** - 0-10 skala og display krav

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Next.js API routes
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: OpenAI GPT-4o-mini
- **Betalinger**: Stripe Payment Links
- **Testing**: Jest, Playwright
- **Deployment**: Vercel

## 🔄 Migration fra Bolt

Dette projekt er migreret fra Vite til Next.js 15 for at matche specifikationerne:

### Vigtige ændringer:
- ✅ **Framework**: Vite → Next.js 15 App Router
- ✅ **Arkitektur**: Single page → Full-stack med API routes
- ✅ **Styling**: Custom CSS → Tailwind + shadcn/ui
- ✅ **Språg**: Blandet → Konsistent dansk
- ✅ **Scoring**: Procenter → 0-10 skala
- ✅ **Types**: Manglende → Komplet TypeScript setup

### Næste skridt:
1. Implementer Supabase integration
2. Tilføj autentificering
3. Opret analyse workflow
4. Integrer OpenAI
5. Setup betalinger

## 🤝 Bidrag

1. Følg coding standards i [Architectural Guidelines](documentation/architectural_guidelines.md)
2. Hold filer små og modulære (< 150 linjer)
3. Skriv tests for nye features
4. Brug dansk til al brugervendt tekst
5. Referer til specifikations docs i commits

## 📝 License

[Din License Her]

## 🆘 Support

- Tjek [FAQ](documentation/ui_ux_specification.md#faq-section)
- Gennemgå error codes i [API Specification](documentation/api_specification.md#error-codes)
- Kontakt: support@rekruna.dk

---

Bygget med ❤️ for danske SMV'er til at revolutionere rekruttering 