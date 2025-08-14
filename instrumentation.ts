// Ensure Sentry initializes in the Next.js App Router runtime.
// Next.js calls this register() during boot. We dynamically import the
// relevant Sentry config based on the runtime.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  // If we later add edge/edge API routes, enable this:
  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('./sentry.edge.config')
  // }
}


