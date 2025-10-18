# Phase 2: Stripe Integration - Implementation Plan

## 🎯 Hvad Er Stripe?

**Stripe** er en betalingsplatform (ligesom PayPal eller MobilePay). Den håndterer:
- Kreditkort betalinger
- Abonnementer (recurring payments)
- Fakturaer
- Sikkerhed (PCI compliance)

**Hvorfor Stripe?**
- Virker i Danmark med DKK
- Let at integrere
- Håndterer abonnementer automatisk
- Veldokumenteret

---

## 📋 Hvad Skal Vi Bygge? (Simple Terms)

Forestil dig dette flow:

### Flow 1: Bruger Køber Credits (Pay as you go)
```
1. User klikker "Køb 200 credits" button
2. Vores app sender user til Stripe's checkout page
3. User betaler med kreditkort på Stripe
4. Stripe sender besked tilbage til vores app: "Betaling OK!"
5. Vores app giver user 200 credits
```

### Flow 2: Bruger Opretter Abonnement (Pro)
```
1. User klikker "Køb Pro (400 credits/måned)"
2. Sendes til Stripe checkout
3. Betaler første måned
4. Stripe sender besked: "Subscription created!"
5. Vores app giver user 400 credits + markerer som "Pro subscriber"
6. Hver måned: Stripe betaler automatisk → sender besked → vi resetter credits til 400
```

### Flow 3: Bruger Køber Top-Up (Ekstra Credits)
```
1. Pro user har brugt alle credits, køber "Boost 100"
2. Sendes til Stripe (vi tjekker først at de HAR et abonnement)
3. Betaler 159 DKK
4. Stripe sender besked
5. Vi tilføjer 100 PURCHASED credits (lifetime, udløber ikke)
```

---

## 🏗️ Hvad Skal Vi Bygge? (Technical)

Vi skal bygge **3 ting**:

### 1. Checkout Endpoint (`/api/checkout`)
**Formål:** Sender user til Stripe's betalingsside

**Input fra user:**
- Hvilken pakke vil de købe? (Pro, Business, Pay as you go, etc.)

**Output til user:**
- URL til Stripe checkout page

**Hvad den gør:**
- Opretter/henter Stripe customer for user
- Tjekker om top-up → verificer at user har abonnement
- Opretter Stripe checkout session
- Returnerer URL som user redirectes til

---

### 2. Webhook Endpoint (`/api/webhooks/stripe`)
**Formål:** Modtager beskeder fra Stripe når noget sker

**Hvad er en webhook?**
En webhook er som et "callback" - Stripe ringer til vores server og siger "Hej, der skete noget!"

**Hvilke beskeder modtager vi?**
- `checkout.session.completed` - "User betalte!"
- `invoice.paid` - "Månedlig betaling gik igennem"
- `customer.subscription.updated` - "Subscription blev ændret"
- `customer.subscription.deleted` - "User opsagde abonnement"

**Hvad den gør:**
- Verificerer at beskeden VIRKELIG kommer fra Stripe (security!)
- Læser hvad der skete
- Opdaterer database (tilføj credits, opdater subscription status)

---

### 3. Stripe Service (`/lib/services/stripe.service.ts`)
**Formål:** Helper funktioner til at snakke med Stripe

**Metoder:**
- `createCheckoutSession()` - Opret checkout session
- `getOrCreateCustomer()` - Find/opret Stripe customer
- `handleCheckoutCompleted()` - Håndter succesful payment
- `handleSubscriptionUpdated()` - Håndter subscription ændringer

---

## 📝 Implementation Steps

### Step 1: Stripe Setup (I Stripe Dashboard) 🌐
**Før vi koder noget**, skal vi sætte Stripe op.

**Hvad skal du gøre:**
1. Opret Stripe account (hvis du ikke har en)
2. Få API keys (test mode først!)
3. Opret produkter i Stripe dashboard:
   - Pay as you go (499 DKK, one-time)
   - Pro Plan (349 DKK/måned)
   - Business Plan (699 DKK/måned)
   - 4 Top-ups (99, 159, 199, 249 DKK)
4. Kopier Price IDs til `.env.local`

**Jeg guider dig igennem dette!**

---

### Step 2: Environment Variables 🔐
Tilføj Stripe keys til `.env.local`:

```bash
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs
STRIPE_PAYG_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_BUSINESS_PRICE_ID=price_xxx
STRIPE_BOOST_50_PRICE_ID=price_xxx
STRIPE_BOOST_100_PRICE_ID=price_xxx
STRIPE_BOOST_250_PRICE_ID=price_xxx
STRIPE_BOOST_500_PRICE_ID=price_xxx
```

---

### Step 3: Install Stripe NPM Package 📦
```bash
npm install stripe
```

---

### Step 4: Build Stripe Service 🔧
Opret `/lib/services/stripe.service.ts` med metoder til at snakke med Stripe.

---

### Step 5: Build Checkout Endpoint 🛒
Opret `/app/api/checkout/route.ts` - sender user til Stripe.

---

### Step 6: Build Webhook Endpoint 📨
Opret `/app/api/webhooks/stripe/route.ts` - modtager beskeder fra Stripe.

---

### Step 7: Test i Test Mode 🧪
Test med Stripe test cards (4242 4242 4242 4242).

---

### Step 8: Go Live 🚀
Switch til production keys.

---

## 🎓 Vigtige Koncepter (For Rookies)

### Hvad Er En "Stripe Customer"?
Hver user i din app skal have en "Stripe Customer" ID.
- Din app's user ID: `abc-123` (fra Supabase auth)
- Stripe customer ID: `cus_xxxxx` (fra Stripe)
- Vi gemmer denne i `user_subscriptions.stripe_customer_id`

### Hvad Er En "Price ID"?
Stripe kalder hver pris for en "Price" med et ID.
- Pro Plan koster 349 DKK → Stripe giver dig `price_xxx123`
- Vi bruger dette ID når vi opretter checkout

### Hvad Er En "Checkout Session"?
En midlertidig "checkout page" Stripe opretter til os.
- Vi spørger Stripe: "Opret checkout for price_xxx123"
- Stripe svarer: "OK, her er URL: https://checkout.stripe.com/abc123"
- Vi redirecter user til denne URL
- User betaler
- Stripe sender webhook til os

### Hvad Er "Webhook Signature Verification"?
Sikkerhed! Når Stripe sender en webhook, sætter de en "signature" (ligesom en digital signatur).
Vi verificerer at beskeden VIRKELIG kommer fra Stripe (ikke en hacker).

```typescript
// Uden verification: Farligt!
app.post('/webhook', (req) => {
  // Anyone kan sende fake beskeder!
})

// Med verification: Sikkert!
app.post('/webhook', (req) => {
  const signature = req.headers['stripe-signature']
  const event = stripe.webhooks.constructEvent(body, signature, secret)
  // Nu ved vi det kommer fra Stripe!
})
```

---

## ⚠️ Kritiske Sikkerhedsting

### 1. ALDRIG Expose Secret Key
```typescript
// ❌ NEVER i client-side code
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY) 

// ✅ ONLY i server-side (API routes)
export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
}
```

### 2. ALTID Verificer Webhooks
```typescript
// ❌ BAD - Anyone kan sende fake data
app.post('/webhook', async (req) => {
  const { amount, userId } = req.body
  await addCredits(userId, amount) // FARLIGT!
})

// ✅ GOOD - Kun Stripe kan sende valid data
app.post('/webhook', async (req) => {
  const signature = req.headers['stripe-signature']
  const event = stripe.webhooks.constructEvent(...)
  // Nu er det sikkert!
})
```

### 3. ALDRIG Trust Client Data
```typescript
// ❌ BAD - Client siger "giv mig 1000 credits"
app.post('/checkout', async (req) => {
  const { credits } = req.body // Client kan lyve!
  await addCredits(userId, credits) // FARLIGT!
})

// ✅ GOOD - Stripe fortæller os hvad de betalte
app.post('/webhook', async (req) => {
  const event = verifiedStripeEvent
  const credits = event.metadata.credits // Fra Stripe, kan stoles på
  await addCredits(userId, credits)
})
```

---

## 📊 Database Flow

### One-Time Purchase (Pay as you go)
```
1. Webhook: checkout.session.completed
2. Read: metadata.credits = 200
3. Update: credit_balances.purchased_credits += 200
4. Insert: credit_transactions (type: purchase)
5. NO subscription record (one-time)
```

### Subscription (Pro/Business)
```
1. Webhook: checkout.session.completed
2. Read: subscription_id, price_id, metadata
3. Insert: user_subscriptions (tier, status, etc.)
4. Update: credit_balances.subscription_credits = 400
5. Insert: credit_transactions (type: subscription_allocation)
```

### Monthly Renewal
```
1. Webhook: invoice.paid
2. Find: user_subscriptions by subscription_id
3. Update: credit_balances.subscription_credits = 400 (RESET, not add!)
4. Update: last_subscription_reset = NOW()
5. Insert: credit_transactions (type: subscription_reset)
```

### Cancellation
```
1. Webhook: customer.subscription.deleted
2. Find: user_subscriptions by subscription_id
3. Update: status = 'canceled'
4. Update: credit_balances.subscription_credits = 0 (remove)
5. Keep: purchased_credits (lifetime!)
```

---

## 🧪 Test Plan

### Test 1: Pay as you go Purchase
```
1. Click "Køb 200 credits"
2. Pay with test card
3. Verify: +200 purchased_credits in database
4. Verify: Transaction logged
```

### Test 2: Pro Subscription
```
1. Click "Start Pro"
2. Pay with test card
3. Verify: user_subscriptions created
4. Verify: 400 subscription_credits added
5. Verify: Can buy top-ups now
```

### Test 3: Top-Up
```
1. As Pro user, buy Boost 100
2. Pay with test card
3. Verify: +100 purchased_credits
4. Verify: subscription_credits unchanged
```

### Test 4: Monthly Renewal (Simulated)
```
1. Use Stripe CLI to trigger invoice.paid event
2. Verify: subscription_credits reset to 400
3. Verify: purchased_credits unchanged
```

---

## 🎯 Success Criteria

Phase 2 complete når:
- [ ] User kan købe Pay as you go (200 credits)
- [ ] User kan subscribe til Pro (400/måned)
- [ ] User kan subscribe til Business (1000/måned)
- [ ] Pro/Business users kan købe top-ups
- [ ] Webhooks opdaterer database korrekt
- [ ] Credits tilføjes efter betaling
- [ ] Subscription tracking virker
- [ ] Alle payments logges i transactions

---

## 📚 Næste Steps

### Umiddelbart Nu:
**Step 1: Stripe Account Setup**

Jeg guider dig igennem at:
1. Oprette Stripe account (hvis ikke allerede)
2. Skifte til test mode
3. Oprette produkter
4. Få API keys
5. Sætte op i `.env.local`

**Skal vi starte med Stripe setup?** 

Eller vil du have mig til at forklare noget mere først?

---

## 💡 Forståelses-Check

Før vi går videre, lad mig vide hvis du vil have mig til at forklare:
- Hvad er en webhook mere detaljeret?
- Hvordan virker Stripe checkout flow?
- Hvordan mapper vi Stripe → vores database?
- Security omkring API keys?

**Du bestemmer tempoet!** 🚀





