// API endpoint til at håndtere kontaktformular submissions
// Sender emails til support@rekruna.dk via Resend service
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    // Parse form data fra request body
    const { name, company, email, subject, message } = await req.json()

    // Validate required fields - tjek at alle påkrævede felter er med
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Udfyld venligst alle påkrævede felter' },
        { status: 400 }
      )
    }

    // Email validation - tjek at email er i korrekt format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ugyldig email adresse' },
        { status: 400 }
      )
    }

    // Log submission for debugging (kun i development)
    console.log('Contact form submission:', {
      name,
      company,
      email,
      subject,
      timestamp: new Date().toISOString()
    })

    // Send email via Resend
    // Dette sender en professionel email til support@rekruna.dk
    const { data, error } = await resend.emails.send({
      from: 'Rekruna Kontaktformular <noreply@rekruna.dk>',
      to: ['support@rekruna.dk'],
      replyTo: email, // Så I kan svare direkte til kunden
      subject: subject ? `Kontakt: ${subject}` : 'Ny henvendelse fra Rekruna',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Ny henvendelse fra Rekruna</h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Navn:</strong> ${name}</p>
            ${company ? `<p style="margin: 10px 0;"><strong>Firma:</strong> ${company}</p>` : ''}
            <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
            ${subject ? `<p style="margin: 10px 0;"><strong>Emne:</strong> ${subject}</p>` : ''}
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <p style="margin: 0 0 10px 0;"><strong>Besked:</strong></p>
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Sendt via Rekruna kontaktformular
          </p>
        </div>
      `,
    })

    // Check for errors fra Resend
    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Der skete en fejl ved afsendelse af email' },
        { status: 500 }
      )
    }

    // Success! Email er sendt
    console.log('Email sent successfully:', data)
    return NextResponse.json(
      { success: true, message: 'Beskeden er sendt' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'Der skete en fejl. Prøv venligst igen.' },
      { status: 500 }
    )
  }
}

