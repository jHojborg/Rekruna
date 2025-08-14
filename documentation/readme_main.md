# Recruitment Screening SaaS

An AI-powered recruitment screening tool that analyzes CVs against job requirements, providing objective candidate rankings in minutes.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/recruitment-screener.git
cd recruitment-screener

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- OpenAI API key (with GPT-4o-mini access)
- Stripe account (for payments)

## 🏗️ Project Structure

```
recruitment-screener/
├── frontend/                 # Next.js 15 application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and hooks
│   └── types/               # TypeScript types
├── backend/                 # API and services
│   ├── api/                 # API route handlers
│   ├── lib/                 # Core libraries
│   ├── services/            # Business logic
│   └── utils/               # Utilities
├── shared/                  # Shared types
├── specs/                   # Project documentation
└── e2e/                     # End-to-end tests
```

## 📚 Documentation

All project documentation is in the `specs/` directory:

- **[Project Overview](specs/project-overview.md)** - Business requirements and features
- **[Technical Architecture](specs/technical-architecture.md)** - System design and tech stack
- **[Development Roadmap](specs/development-roadmap.md)** - Step-by-step implementation guide
- **[API Specification](specs/api-specification.md)** - Complete API documentation
- **[UI/UX Specification](specs/ui-ux-specification.md)** - Component library and design
- **[Security & Privacy](specs/security-privacy-spec.md)** - GDPR compliance and security

## 🛠️ Key Technologies

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Supabase (Auth, Database, Storage, Realtime)
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe Payment Links
- **Testing**: Jest, Playwright
- **Deployment**: Vercel

## 🔧 Development Setup

### 1. Supabase Setup

1. Create a new Supabase project
2. Run the database migrations from `specs/technical-architecture.md`
3. Enable Row Level Security policies from `specs/security-privacy-spec.md`
4. Copy your project URL and keys to `.env.local`

### 2. OpenAI Setup

1. Create an OpenAI account
2. Generate an API key with GPT-4o-mini access
3. Add to `.env.local` as `OPENAI_API_KEY`

### 3. Stripe Setup

1. Create a Stripe account
2. Create a Payment Link for 299 DKK monthly subscription
3. Set up webhook endpoint for `/api/auth/stripe-webhook`
4. Add keys to `.env.local`

## 🧪 Testing

```bash
# Run component tests
npm test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

## 📦 Deployment

The project is configured for Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

See [Testing & Deployment Guide](specs/testing-deployment-guide.md) for detailed instructions.

## 🎯 Core Features

- **Job Analysis**: Upload job descriptions and extract key requirements
- **CV Processing**: Batch process 20-50 CVs with AI-powered analysis
- **Objective Scoring**: 0-10 rating scale with detailed reasoning
- **Danish Language**: Full Danish UI and language support
- **Real-time Updates**: Progress tracking during analysis
- **PDF Reports**: Downloadable candidate assessment reports
- **GDPR Compliant**: 30-day automatic CV deletion

## 🤝 Contributing

1. Follow the coding standards in [Architectural Guidelines](specs/architectural-guidelines.md)
2. Keep files small and modular (< 150 lines)
3. Write tests for new features
4. Use Danish for all user-facing text
5. Reference specification docs in commits

## 📝 License

[Your License Here]

## 🆘 Support

- Check the [FAQ](specs/ui-ux-specification.md#faq-section)
- Review error codes in [API Specification](specs/api-specification.md#error-codes)
- Contact: support@yourcompany.dk

---

Built with ❤️ for Danish SMBs to revolutionize recruitment