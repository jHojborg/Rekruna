/**
 * API endpoint til demo video signup (bruges ikke længere – /demo bruger demo-signup)
 *
 * Modtager: navn, firma, e-mail, wantsVideo (checkbox)
 * Sender email til support@rekruna.dk med lead-info.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const { name, company, email, wantsVideo } = await req.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Udfyld venligst navn og e-mail' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ugyldig e-mail adresse' },
        { status: 400 }
      )
    }

    const resend = getResendClient()
    const videoStatus = wantsVideo ? 'Ja' : 'Nej'

    const { error } = await resend.emails.send({
      from: 'Rekruna Demo Video <noreply@rekruna.dk>',
      to: ['support@rekruna.dk'],
      replyTo: email,
      subject: `🎬 Demo Video Signup - ${company || 'Ikke angivet'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Demo Video Signup</h2>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Navn:</strong> ${name}</p>
            <p><strong>Firma:</strong> ${company || 'Ikke angivet'}</p>
            <p><strong>E-mail:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Ja tak til video:</strong> ${videoStatus}</p>
            <p style="color: #6B7280; font-size: 12px; margin-top: 15px;">
              Sendt via Rekruna demo-sider • ${new Date().toLocaleString('da-DK')}
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Der skete en fejl ved afsendelse' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Demo video signup API error:', error)
    return NextResponse.json(
      { error: 'Der skete en fejl. Prøv venligst igen.' },
      { status: 500 }
    )
  }
}
