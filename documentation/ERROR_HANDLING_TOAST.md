# Error Handling med Toast Notifications

## ✅ Hvad er implementeret

Komplet error handling system med brugervenlige toast notifications i stedet for alerts.

---

## 🎯 Features

### **1. Toast Notifications**
- ✅ Elegante pop-up beskeder i top-right hjørne
- ✅ Forsvinder automatisk efter 5 sekunder
- ✅ Kan have action buttons (Retry, Køb credits, osv.)
- ✅ Mobile-friendly design
- ✅ Ikke-blokerende (brugeren kan fortsætte arbejde)

### **2. Danske Fejlbeskeder**
- ✅ User-friendly beskeder på dansk
- ✅ Kategoriseret efter fejltype (credit, network, PDF, AI, osv.)
- ✅ Klar forklaring af hvad der gik galt
- ✅ Handlingsanvisninger ("Prøv igen", "Upload tekst-PDF", osv.)

### **3. Retry Functionality**
- ✅ Alle fejl har retry knap hvor det giver mening
- ✅ Automatic fallback til regular API hvis SSE fejler
- ✅ Smart retry logic (går tilbage til relevant step)

### **4. Credit Error Handling**
- ✅ Dedikeret UI for credit fejl
- ✅ Viser præcist: har X, skal bruge Y, mangler Z
- ✅ "Køb credits" knap går direkte til profil
- ✅ Ingen analyse starter hvis ikke nok credits

### **5. Partial Success** (Framework klar)
- ✅ Infrastruktur til at vise hvilke CVer der lykkedes/fejlede
- ✅ Toast notification med liste over failed files
- ✅ Mulighed for at se de CVer der virkede

### **6. Loading States**
- ✅ Loading toasts under long operations
- ✅ PDF generation: "Genererer PDF rapport..."
- ✅ Analysis: Vises i progress bar
- ✅ Cleanup: "Rydder op i gamle filer..."

---

## 📁 Nye/Opdaterede Filer

```
✅ lib/errors/errorHandler.ts         (NY - Error parsing & toast helpers)
✅ app/layout.tsx                      (OPDATERET - Toaster component)
✅ app/(dashboard)/dashboard/page.tsx  (OPDATERET - Alle alerts → toasts)
✅ package.json                        (OPDATERET - react-hot-toast dependency)
```

---

## 🧪 Test Guide

### **Test 1: Credit Error**
1. Prøv at analysere flere CVer end du har credits til
2. **Forventet:**
   ```
   ┌─────────────────────────────────────────┐
   │ 💳 Ikke nok credits                     │
   │                                         │
   │ Du har: 5 credits                      │
   │ Du skal bruge: 20 credits              │
   │ Du mangler: 15 credits                 │
   │                                         │
   │ [Køb credits]  [Luk]                   │
   └─────────────────────────────────────────┘
   ```
3. Klik "Køb credits" → Du sendes til /dinprofil

### **Test 2: Network Error**
1. Slå WiFi fra midtvejs i en analyse
2. **Forventet:**
   ```
   ┌─────────────────────────────────────────┐
   │ ⚠️ Forbindelsesfejl                     │
   │ Tjek din internetforbindelse og        │
   │ prøv igen.                             │
   │                                         │
   │ [↻ Prøv igen]                          │
   └─────────────────────────────────────────┘
   ```
3. Klik "Prøv igen" → Analysen genstartes

### **Test 3: PDF Error**
1. Prøv at uploade en scannet/korrupt PDF
2. **Forventet:**
   ```
   ┌─────────────────────────────────────────┐
   │ ❌ Kunne ikke læse PDF-filen            │
   │ Den kan være scannet eller beskadiget. │
   │ Upload en tekst-baseret PDF.           │
   └─────────────────────────────────────────┘
   ```

### **Test 4: SSE Fallback**
1. Start en analyse (brug SSE)
2. Hvis SSE fejler, ser du:
   ```
   ┌─────────────────────────────────────────┐
   │ ℹ️ Real-time opdateringer fejlede.     │
   │ Bruger standard analyse...             │
   └─────────────────────────────────────────┘
   ```
3. Analysen fortsætter uden live updates

### **Test 5: Success Toast**
1. Gennemfør en vellykket analyse
2. **Forventet:**
   ```
   ┌─────────────────────────────────────────┐
   │ ✅ 20 CVer analyseret succesfuldt!      │
   └─────────────────────────────────────────┘
   ```

### **Test 6: Loading Toasts**
1. Klik "Download" på en rapport
2. **Forventet:**
   ```
   ┌─────────────────────────────────────────┐
   │ 🔄 Genererer PDF rapport...             │
   └─────────────────────────────────────────┘
   ```
3. Når færdig:
   ```
   ┌─────────────────────────────────────────┐
   │ ✅ PDF rapport downloadet og gemt!      │
   └─────────────────────────────────────────┘
   ```

### **Test 7: Retry Functionality**
1. Simuler en fejl (f.eks. disconnect WiFi under analyse)
2. Se retry knap i toast
3. Klik "Prøv igen"
4. **Forventet:** Analysen starter forfra fra relevant step

---

## 🎨 Toast Styling

Toasts vises i **top-right hjørne** med:
- ✅ Hvid baggrund
- ✅ Subtil skygge
- ✅ Afrundede hjørner (8px)
- ✅ Max width 500px
- ✅ Auto-dismiss efter 5 sekunder (8-10 sek for errors)
- ✅ Manual dismiss med "Luk" knap hvor relevant

### **Ikoner:**
- ✅ Success (grøn check)
- ❌ Error (rød kryds)
- ℹ️ Info (blå info)
- 🔄 Loading (spinner)

---

## 🔧 API Reference

### **parseError(error: any): AppError**
Parser enhver fejl til struktureret AppError object.

```typescript
const error = parseError(e)
// Returns:
{
  type: 'credit' | 'network' | 'pdf' | 'ai' | 'auth' | 'validation' | 'unknown',
  message: 'User-friendly Danish message',
  technical: 'Technical error for logging',
  action: 'retry' | 'buy-credits' | 'contact-support' | 'login' | 'upload-again',
  data: { ... } // Additional context
}
```

### **errorToast.show(error: AppError)**
Viser simpel fejlbesked.

```typescript
errorToast.show({
  type: 'validation',
  message: 'Maks 50 CVer pr. analyse'
})
```

### **errorToast.showWithRetry(error: AppError, onRetry: () => void)**
Viser fejl med retry knap.

```typescript
errorToast.showWithRetry(error, () => {
  analyze() // Retry function
})
```

### **errorToast.showCreditError(error: AppError, onBuyCredits: () => void)**
Viser credit fejl med "Køb credits" knap.

```typescript
errorToast.showCreditError(error, () => {
  router.push('/dinprofil')
})
```

### **errorToast.success(message: string)**
Viser success besked.

```typescript
errorToast.success('✅ 20 CVer analyseret!')
```

### **errorToast.info(message: string)**
Viser info besked.

```typescript
errorToast.info('Vi kunne ikke udtrække krav automatisk')
```

### **loadingToast.start(message: string): string**
Starter loading toast, returnerer toast ID.

```typescript
const toastId = loadingToast.start('Genererer PDF...')
```

### **loadingToast.success(toastId: string, message: string)**
Opdaterer loading toast til success.

```typescript
loadingToast.success(toastId, 'PDF genereret!')
```

### **loadingToast.error(toastId: string, message: string)**
Opdaterer loading toast til error.

```typescript
loadingToast.error(toastId, 'PDF fejlede')
```

---

## 📝 Error Kategorier

### **Credit Errors**
- Ikke nok credits
- Shows: nuværende balance, required, shortfall
- Action: "Køb credits" button

### **Network Errors**
- Timeout
- Connection failed
- Rate limiting
- Action: "Prøv igen"

### **PDF Errors**
- Extraction failed
- Scanned PDF
- Corrupt file
- Action: "Upload tekst-PDF"

### **AI Errors**
- OpenAI API fejl
- Model fejl
- Timeout
- Action: "Prøv igen om lidt"

### **Auth Errors**
- Session expired
- Missing token
- Unauthorized
- Action: Redirect til /login

### **Validation Errors**
- Missing fields
- Invalid input
- Too many files
- Action: Context-specific

---

## 🐛 Kendte Issues

### **TypeScript Language Server Cache**
Efter installation af react-hot-toast kan TypeScript language server i VS Code cache gamle types.

**Løsning:**
1. Tryk `Ctrl+Shift+P` (Cmd+Shift+P på Mac)
2. Vælg "TypeScript: Restart TS Server"
3. ELLER genstart VS Code

**Note:** Dette er KUN et IDE problem. Koden virker perfekt runtime.

---

## ✅ Checklist før production

- [x] react-hot-toast installeret
- [x] Toaster component i layout.tsx
- [x] Alle alerts erstattet med toasts
- [x] Error parsing med danske beskeder
- [x] Retry functionality
- [x] Credit error med CTA
- [x] Loading states
- [ ] Test på forskellige browsers
- [ ] Test på mobile devices
- [ ] Monitor toast interactions i production

---

## 🚀 Næste Features (Future)

1. **Partial Success Visning**
   - Liste med failed files i ResultsSection
   - Mulighed for at downloade kun successful results
   - Re-run kun failed files

2. **Error Analytics**
   - Track fejl types i Sentry
   - Monitor retry success rate
   - A/B test error messages

3. **Offline Support**
   - Queue actions når offline
   - Sync når connection returns
   - Persistent error log

---

**Implementeret:** December 2024  
**Status:** ✅ Klar til test  
**Næste:** Manuel test + browser compatibility check



