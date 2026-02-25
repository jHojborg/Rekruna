# Implementeringsplan – Rekruna CV Screener

## Status oversigt

| Fase | Beskrivelse | Status |
|------|-------------|--------|
| **Fase 1** | Credits fjernet (credit_balances, credit_transactions) | ✅ Færdig |
| **Fase 2** | Ny signup-flow (profil uden betaling → betal ved første brug) | ✅ Færdig |
| **Fase 3** | Ny prisstruktur (Rekruna 1/5/10) | ✅ Kode færdig |
| **Fase 4** | Rekrutteringsflow 75 dage | ✅ Kode færdig |

---

## Deployment-rækkefølge

### 1. Først: Deploy kodeændringer
Kode kan deployes til produktion uden at påvirke live-systemet. Koden er bagudkompatibel.

### 2. Derefter: Gennemgå øvrige rettelser
Først gennemgås alle andre ændringer og rettelser.

### 3. Sidst: SQL-migration + Stripe
**Kør kun når alt er klar – påvirker produktion.** I samme rækkefølge:

1. **Database Phase 3:** Kør `database_migrations/phase3_rekruna_packages.sql` i Supabase SQL Editor ✅  
2. **Database Phase 4:** Kør `database_migrations/phase4_recruitment_flows.sql` i Supabase SQL Editor ✅  
3. **Stripe:** Opret 3 produkter (Rekruna 1: 2495 kr, Rekruna 5: 9995 kr, Rekruna 10: 17995 kr)  
4. **Env:** Opdater `.env` med `STRIPE_REKRUNA_1_PRICE_ID`, `STRIPE_REKRUNA_5_PRICE_ID`, `STRIPE_REKRUNA_10_PRICE_ID`  
5. **Test:** Verificer checkout-flow i produktion  

---

## Fase 3 – Hvad er implementeret (kode)

- Stripe service: rekruna_1, rekruna_5, rekruna_10 (alle engangsbetaling)
- Checkout API: nye tiers
- Dashboard (låst): pakkevalg Rekruna 1/5/10
- Landing: nye priser og features
- Din profil: visning af Rekruna 1/5/10
- `job_slots_available` i webhook (forberedt til Fase 4)

---

## Fase 4 – Hvad er implementeret (kode)

- `recruitment_flows` tabel (migration)
- `recruitment-flow.service.ts`: job_slots check, deduct, flow oprettelse
- `/api/analyze` og `/api/analyze/stream`: flow-tjek før processing
- `/api/flows`: hent flow-info til 14-dages advarsel
- Dashboard: advarselsbanner når flow udløber inden for 14 dage
- EVENT-konti: springer slot-tjek over (demo)
- Graceful fallback hvis migration ikke er kørt

---

## Fase 3 – Hvad venter (sidste skridt)

- [x] Kør `phase3_rekruna_packages.sql` ✅
- [x] Opret Stripe-produkter
- [x] Opdater env med Price IDs
- [x] Test checkout i produktion

---

## Fase 4 – Hvad venter (sidste skridt)

- [x] Kør `phase4_recruitment_flows.sql` ✅
