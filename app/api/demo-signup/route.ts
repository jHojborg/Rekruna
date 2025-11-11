// API endpoint til at håndtere demo signup submissions
// 1. Gemmer lead i Supabase demo_leads tabel
// 2. Sender notification email til support@rekruna.dk
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/server'

// Lazy initialize Resend - only when API is called, not during build
// This prevents build errors when RESEND_API_KEY is not available
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  try {
    // Parse form data fra request body
    const { companyName, contactName, phone, email, bestDay, bestTime } = await req.json()

    // Validate required fields - tjek at alle påkrævede felter er med
    if (!companyName || !contactName || !phone || !email || !bestDay || !bestTime) {
      return NextResponse.json(
        { error: 'Udfyld venligst alle påkrævede felter' },
        { status: 400 }
      )
    }

    // Email validering - tjek at email er i korrekt format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ugyldig email adresse' },
        { status: 400 }
      )
    }

    // Telefon validering - skal være mindst 8 cifre
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 8) {
      return NextResponse.json(
        { error: 'Telefonnummer skal være mindst 8 cifre' },
        { status: 400 }
      )
    }

    // Log submission for debugging (kun i development)
    console.log('Demo signup submission:', {
      companyName,
      contactName,
      email,
      timestamp: new Date().toISOString()
    })

    // Hent UTM parametre fra URL hvis de findes (tracking af marketing kampagner)
    const url = new URL(req.url)
    const utmSource = url.searchParams.get('utm_source')
    const utmMedium = url.searchParams.get('utm_medium')
    const utmCampaign = url.searchParams.get('utm_campaign')
    const referrer = req.headers.get('referer')

    // GEM LEAD I SUPABASE
    // Bruger supabaseAdmin for at bypasse RLS policies
    const { data: leadData, error: leadError } = await supabaseAdmin
      .from('demo_leads')
      .insert({
        company_name: companyName,
        contact_name: contactName,
        phone: phone,
        email: email,
        best_day: bestDay,
        best_time: bestTime,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        referrer: referrer,
        status: 'new' // Default status er 'new'
      })
      .select()
      .single()

    // Check for database errors
    if (leadError) {
      console.error('Supabase error:', leadError)
      
      // Hvis email allerede eksisterer, giv brugbar fejlbesked
      if (leadError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Denne email er allerede registreret. Kontakt os direkte hvis du har spørgsmål.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Der skete en fejl ved gemning af din anmodning' },
        { status: 500 }
      )
    }

    console.log('Lead saved to database:', leadData)

    // SEND EMAIL TIL SUPPORT
    // Sender en professionel email til support@rekruna.dk med alle detaljer
    const resend = getResendClient()
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Rekruna Demo Signup <noreply@rekruna.dk>',
      to: ['support@rekruna.dk'],
      replyTo: email, // Så I kan svare direkte til leadet
      subject: `🎯 Ny Demo Anmodning - ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 3px solid #4F46E5; padding-bottom: 10px;">
            🎯 Ny Demo Anmodning
          </h2>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">Firma Information</h3>
            <p style="margin: 10px 0;"><strong>Firmanavn:</strong> ${companyName}</p>
            <p style="margin: 10px 0;"><strong>Kontaktperson:</strong> ${contactName}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 10px 0;"><strong>Telefon:</strong> <a href="tel:${phone}">${phone}</a></p>
          </div>
          
          <div style="background: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1E40AF;">Bedste Kontakttid</h3>
            <p style="margin: 10px 0;"><strong>Træffes bedst dag:</strong> ${bestDay}</p>
            <p style="margin: 10px 0;"><strong>Træffes bedst tidspunkt:</strong> ${bestTime}</p>
          </div>

          ${utmSource || utmMedium || utmCampaign ? `
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400E;">📊 Kampagne Tracking</h3>
            ${utmSource ? `<p style="margin: 10px 0;"><strong>UTM Source:</strong> ${utmSource}</p>` : ''}
            ${utmMedium ? `<p style="margin: 10px 0;"><strong>UTM Medium:</strong> ${utmMedium}</p>` : ''}
            ${utmCampaign ? `<p style="margin: 10px 0;"><strong>UTM Campaign:</strong> ${utmCampaign}</p>` : ''}
            ${referrer ? `<p style="margin: 10px 0;"><strong>Referrer:</strong> ${referrer}</p>` : ''}
          </div>
          ` : ''}
          
          <div style="background: #F9FAFB; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;">
              💡 <strong>Næste skridt:</strong> Kontakt ${contactName} på ${phone} eller ${email}
            </p>
          </div>
          
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            Sendt via Rekruna Demo Signup • ${new Date().toLocaleString('da-DK')}
          </p>
        </div>
      `,
    })

    // Check for email errors
    // VIGTIGT: Vi logger fejl men fejler ikke hele requesten hvis email fejler
    // Lead er allerede gemt i databasen, så det er stadig en success
    if (emailError) {
      console.error('Resend error (non-fatal):', emailError)
      // Vi fortsætter alligevel - lead er gemt i database
    } else {
      console.log('Email sent successfully:', emailData)
    }

    // Success! Både lead er gemt og email er sendt (eller attempted)
    return NextResponse.json(
      { 
        success: true, 
        message: 'Demo anmodning modtaget',
        leadId: leadData?.id 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Demo signup API error:', error)
    return NextResponse.json(
      { error: 'Der skete en fejl. Prøv venligst igen.' },
      { status: 500 }
    )
  }
}

