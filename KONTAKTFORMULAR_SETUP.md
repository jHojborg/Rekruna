# 📧 Kontaktformular Setup Guide

## Hvad er bygget

Vi har oprettet en kontaktformular på `/kontakt` siden, der sender emails til `support@rekruna.dk`.

### Filer oprettet:
- ✅ `app/kontakt/page.tsx` - Kontaktformular side
- ✅ `app/api/contact/route.ts` - API endpoint til email sending
- ✅ Resend package installeret

## 🚀 Setup Resend (5 minutter)

### Trin 1: Opret Resend konto
1. Gå til [https://resend.com/signup](https://resend.com/signup)
2. Opret gratis konto (1000 emails/måned gratis)
3. Bekræft din email

### Trin 2: Tilføj og verificer domæne
1. I Resend dashboard, gå til **Domains**
2. Klik **Add Domain**
3. Indtast `rekruna.dk`
4. Tilføj de 3 DNS records til dit webhotel:
   - **SPF record** (TXT)
   - **DKIM record** (TXT)  
   - **DMARC record** (TXT)
5. Vent 5-10 minutter på DNS propagering
6. Klik **Verify** i Resend

### Trin 3: Hent API key
1. Gå til **API Keys** i Resend dashboard
2. Klik **Create API Key**
3. Navngiv den "Rekruna Production"
4. Kopier API keyen (du ser den kun én gang!)

### Trin 4: Tilføj API key til miljøvariable
1. Åbn `.env.local` filen i dit projekt
2. Tilføj denne linje:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```
3. Gem filen

### Trin 5: Genstart serveren
```bash
npm run dev
```

## 🧪 Test kontaktformularen

1. Åbn [http://localhost:3000/kontakt](http://localhost:3000/kontakt)
2. Udfyld formularen
3. Klik "Send besked"
4. Tjek din `support@rekruna.dk` inbox!

## 📝 Felter i formularen

- **For- og efternavn** (påkrævet) ⭐
- **Firmanavn** (valgfrit)
- **Email** (påkrævet) ⭐
- **Emne** (valgfrit)
- **Besked** (påkrævet) ⭐

## 🎨 Design

Formularen følger samme design som resten af sitet:
- Samme `brand-base` baggrund som Om os siden
- Hvid card med skygge effekt
- Responsivt design (mobile-friendly)
- Toast notifications for feedback

## 🔒 Sikkerhed

- ✅ Server-side email sending (API key er aldrig exposed til klienten)
- ✅ Email validering (både client og server side)
- ✅ Required fields validation
- ✅ Error handling med brugervenlige beskeder

## 💰 Priser (Resend)

- **Gratis tier**: 3000 emails/måned
- **Pro tier**: $20/måned for 50,000 emails

For jeres use case er gratis tier mere end nok! 🎉

## 🐛 Fejlfinding

### "Email ikke sendt" fejl
- Tjek at RESEND_API_KEY er sat korrekt i `.env.local`
- Tjek at domænet er verificeret i Resend
- Tjek server logs for fejlbeskeder

### DNS verificering fejler
- Sørg for at alle 3 DNS records er tilføjet korrekt
- Vent 5-10 minutter mere (DNS kan tage tid)
- Brug [https://mxtoolbox.com/](https://mxtoolbox.com/) til at tjekke DNS records

## 📧 Email format

Emails til support@rekruna.dk vil se sådan ud:
- **Subject**: "Kontakt: [emne]" eller "Ny henvendelse fra kontaktformular"
- **From**: "Rekruna Kontaktformular <noreply@rekruna.dk>"
- **Reply-To**: Kundens email (så du kan svare direkte)
- **Body**: Pænt formateret HTML med alle informationer

## ✨ Næste skridt

1. ⬜ Setup Resend konto
2. ⬜ Verificer rekruna.dk domæne
3. ⬜ Tilføj API key til `.env.local`
4. ⬜ Test formularen
5. ⬜ Deploy til produktion

---

**Bygget med** ❤️ **af din AI assistent**

