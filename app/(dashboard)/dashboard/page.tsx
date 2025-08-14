"use client"

import { useEffect, useState } from 'react'
import { AnalysisProgress } from '@/components/dashboard/AnalysisProgress'
import { JobUploadCard } from '@/components/dashboard/JobUploadCard'
import { RequirementSelector } from '@/components/dashboard/RequirementSelector'
import { CVUploadCard } from '@/components/dashboard/CVUploadCard'
import { ProcessingSection } from '@/components/dashboard/ProcessingSection'
import { ResultsSection } from '@/components/dashboard/ResultsSection'
import { supabase } from '@/lib/supabase/client'
import { uploadCVsInBatches, uploadJobDescription } from '@/lib/storage/upload'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import jsPDF from 'jspdf'

export default function DashboardPage() {
  type Step = 1 | 2 | 3 | 4
  const [step, setStep] = useState<Step>(1)

  // Simple client-side route protection
  const [checkingAuth, setCheckingAuth] = useState(true)
  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      if (!user) {
        window.location.href = '/login'
      } else {
        setCheckingAuth(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const [jobFile, setJobFile] = useState<File | null>(null)
  // Midlertidige, neutrale krav indtil automatisk udtræk fra jobopslag er implementeret
  const [requirements, setRequirements] = useState([
    { id: '1', text: 'Dokumenteret ledelseserfaring', selected: false },
    { id: '2', text: 'Relevant faglig erfaring (angiv i jobopslaget)', selected: false },
    { id: '3', text: 'Stærke kommunikationsevner', selected: false },
    { id: '4', text: 'Dokumenterbar erfaring med arbejdsmetoder/processer fra opslaget', selected: false },
    { id: '5', text: 'Eventuelle obligatoriske certificeringer fra opslaget', selected: false },
  ])
  const [cvFiles, setCvFiles] = useState<File[]>([])

  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | undefined>()

  const [results, setResults] = useState<any[]>([])

  // Recent analyses (client-side list for last 30 days) – hooks must be before any early returns
  const [recent, setRecent] = useState<Array<{ id: string; createdAt: Date; title: string; version: string; analysisId?: string; reportPath?: string }>>([])
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('recent-analyses') : null
    if (!raw) return
    const list = (JSON.parse(raw) as any[])
      .map((x) => ({ ...x, createdAt: new Date(x.createdAt) }))
      .filter((x) => Date.now() - x.createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    setRecent(list)
  }, [])

  // Block rendering until auth checked
  if (checkingAuth) {
    return <main className="min-h-screen bg-brand-base" />
  }

  const startFromJob = async () => {
    if (!jobFile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    const analysisId = crypto.randomUUID()
    try {
      await uploadJobDescription(jobFile, user.id, analysisId)
      // Forsøg at udtrække krav fra jobopslaget via server-API (best-effort)
      try {
        const r = await fetch('/api/requirements/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, analysisId }),
        })
        const data = await r.json()
        if (data?.ok && Array.isArray(data.requirements) && data.requirements.length) {
          setRequirements(data.requirements)
        }
      } catch {}

      setStep(2)
      ;(window as any).__analysisId = analysisId
      ;(window as any).__userId = user.id
    } catch (e: any) {
      alert(e.message)
    }
  }

  const toggleReq = (id: string) => setRequirements(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r))
  const contFromReq = () => setStep(3)

  const onFiles = (files: File[]) => setCvFiles(files)

  const analyze = async () => {
    const analysisId = (window as any).__analysisId as string
    const userId = (window as any).__userId as string
    if (!analysisId || !userId) {
      alert('Session ikke oprettet. Start forfra.')
      return
    }
    setStep(4)
    setTotal(cvFiles.length)
    setProcessed(0)
    try {
      await uploadCVsInBatches(cvFiles, {
        userId,
        analysisId,
        batchSize: 10,
        concurrency: 5,
        onProgress: (done, tot, current) => {
          setProcessed(done)
          setTotal(tot)
          setCurrentFile(current)
        }
      })
      // Call server-side AI analyzer
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          analysisId,
          requirements: requirements.filter((r) => r.selected).map((r) => r.text),
          title: jobFile?.name?.replace(/\.pdf$/i, '') || 'Analyse',
        }),
      })
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('application/json')) {
        const txt = await res.text()
        throw new Error(`Serverfejl (${res.status}). ${txt.slice(0, 120)}`)
      }
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Analyse fejlede')
      setResults(Array.isArray(data.results) ? data.results : [])
      const title = jobFile?.name?.replace(/\.pdf$/i, '') || 'Analyse'
      recordAnalysis(title)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const startNewAnalysis = () => {
    setStep(1)
    setJobFile(null)
    setRequirements((prev) => prev.map((r) => ({ ...r, selected: false })))
    setCvFiles([])
    setTotal(0)
    setProcessed(0)
    setCurrentFile(undefined)
    setResults([])
    ;(window as any).__analysisId = undefined
  }

  const downloadPdf = async () => {
    if (!results?.length) return

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })

    // Layout geometri
    const margin = { x: 40, y: 60, right: 40, bottom: 60 }
    const page = doc.internal.pageSize
    const pageWidth = page.getWidth()
    const pageHeight = page.getHeight()
    const tableWidth = pageWidth - margin.x - margin.right
    const rowHeight = 22

    // Kolonner (skaleres til tabellens bredde)
    const cols = [
      { key: 'name', label: 'Kandidat', width: 220, align: 'left' as const },
      { key: 'overall', label: 'Overall', width: 80, align: 'center' as const },
      { key: 'js', label: 'JavaScript', width: 100, align: 'center' as const },
      { key: 'react', label: 'React', width: 80, align: 'center' as const },
      { key: 'agile', label: 'Agile', width: 80, align: 'center' as const },
    ]
    const scale = tableWidth / cols.reduce((s, c) => s + c.width, 0)
    cols.forEach((c) => (c.width = c.width * scale))

    // Titel
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Analyse resultater', margin.x, margin.y)

    // Headerbaggrund
    let y = margin.y + 28
    doc.setFillColor(245, 245, 245)
    doc.rect(margin.x, y - 16, tableWidth, 24, 'F')
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')

    // Headertekst
    let x = margin.x
    cols.forEach((col) => {
      const tx = col.align === 'left' ? x + 6 : x + col.width / 2
      doc.text(col.label, tx, y, { align: col.align === 'left' ? 'left' : 'center' })
      x += col.width
    })

    // Divider
    doc.setLineWidth(0.6)
    doc.line(margin.x, y + 6, margin.x + tableWidth, y + 6)
    y += 22

    // Rækker
    doc.setFont('helvetica', 'normal')
    const cell = (r: any, key: string) =>
      key === 'overall'
        ? String(r.overall)
        : key === 'js'
        ? String(r.scores?.JavaScript ?? '')
        : key === 'react'
        ? String(r.scores?.React ?? '')
        : key === 'agile'
        ? String(r.scores?.Agile ?? '')
        : String(r.name)

    for (const r of results) {
      // Sideskift og gentag header
      if (y + rowHeight > pageHeight - margin.bottom) {
        doc.addPage()
        y = margin.y + 12
        doc.setFillColor(245, 245, 245)
        doc.rect(margin.x, y - 16, tableWidth, 24, 'F')
        doc.setFont('helvetica', 'bold')
        let hx = margin.x
        cols.forEach((col) => {
          const tx = col.align === 'left' ? hx + 6 : hx + col.width / 2
          doc.text(col.label, tx, y, { align: col.align === 'left' ? 'left' : 'center' })
          hx += col.width
        })
        doc.setLineWidth(0.6)
        doc.line(margin.x, y + 6, margin.x + tableWidth, y + 6)
        y += 22
        doc.setFont('helvetica', 'normal')
      }

      let rx = margin.x
      cols.forEach((col) => {
        const tx = col.align === 'left' ? rx + 6 : rx + col.width / 2
        doc.text(cell(r, col.key), tx, y, { align: col.align === 'left' ? 'left' : 'center' })
        rx += col.width
      })
      y += rowHeight
    }

    doc.save('analyse-resultater.pdf')

    // Upload rapport til Supabase Storage og opdatér localStorage entry
    try {
      // Sikr at buckets findes (idempotent)
      try { await fetch('/api/storage/ensure', { method: 'POST' }) } catch {}

      const analysisId = (window as any).__analysisId as string
      const { data: { user } } = await supabase.auth.getUser()
      if (!analysisId || !user) return
      const path = `${user.id}/${analysisId}/report.pdf`
      const blob = doc.output('blob')
      const { error: upErr } = await supabase.storage.from('reports').upload(path, blob, { contentType: 'application/pdf', upsert: true })
      if (upErr) {
        alert(`Upload af rapport fejlede: ${upErr.message}`)
        return
      }

      // Verificér at objektet findes ved at lave en signerede URL
      const { data: signed, error: signErr } = await supabase.storage.from('reports').createSignedUrl(path, 60)
      if (signErr || !signed?.signedUrl) {
        alert(`Kunne ikke verificere rapporten: ${signErr?.message ?? 'ukendt fejl'}`)
        return
      }

      const stored: any[] = JSON.parse(localStorage.getItem('recent-analyses') || '[]')
      const updated = stored.map((x) => (x.analysisId === analysisId ? { ...x, reportPath: path } : x))
      localStorage.setItem('recent-analyses', JSON.stringify(updated))
      setRecent(updated.map((x) => ({ ...x, createdAt: new Date(x.createdAt) })))
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('report upload failed:', (e as any)?.message)
    }
  }

  const recordAnalysis = (title: string) => {
    const stored: any[] = JSON.parse(localStorage.getItem('recent-analyses') || '[]')
    const previous = stored.filter((x) => x.title === title)
    const version = String(previous.length + 1).padStart(2, '0')
    const entry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), title, version, analysisId: (window as any).__analysisId as string }
    const next = [entry, ...stored].filter((x) => Date.now() - new Date(x.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000)
    localStorage.setItem('recent-analyses', JSON.stringify(next))
    setRecent(next.map((x) => ({ ...x, createdAt: new Date(x.createdAt) })))
  }

  return (
    <main className="min-h-screen bg-brand-base">
      <AnalysisProgress currentStep={step} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin: manual cleanup trigger (hidden unless flag is set) */}
        {process.env.NEXT_PUBLIC_ENABLE_ADMIN_CLEANUP === '1' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-end">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch('/api/admin/cleanup', { method: 'POST' })
                  const data = await res.json()
                  alert(data?.ok ? `Slettede ${data.deleted} filer` : data?.error || 'Fejl')
                } catch (e: any) {
                  alert(e.message)
                }
              }}
            >
              Kør 30-dages oprydning
            </Button>
          </div>
        )}
        {step === 1 && (
          <JobUploadCard fileName={jobFile?.name} onFileSelected={(f) => setJobFile(f)} onStart={startFromJob} canStart={!!jobFile} />
        )}
        {step === 1 && recent.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Seneste analyser</h3>
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.id}>
                  <button
                    className="text-primary hover:underline"
                    onClick={async () => {
                      if (!r.reportPath) { alert('Ingen rapport gemt endnu. Åbn analysen og tryk Download først.'); return }
                      const { data, error } = await supabase.storage.from('reports').createSignedUrl(r.reportPath, 60)
                      if (error) { alert(error.message); return }
                      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                    }}
                  >
                    {r.createdAt.toLocaleDateString('da-DK')} – {r.title} – v{r.version}
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-2">Viser kun analyser fra de seneste 30 dage.</p>
          </div>
        )}
        {step === 2 && (
          <RequirementSelector requirements={requirements} onToggle={toggleReq} onContinue={contFromReq} />
        )}
        {step === 3 && (
          <CVUploadCard count={cvFiles.length} onFilesSelected={onFiles} onAnalyze={analyze} />
        )}
        {step === 4 && (
          <>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Tilbage til dashboard</Link>
              </Button>
              <Button variant="outline" onClick={startNewAnalysis}>Start ny analyse</Button>
              <Button onClick={downloadPdf}>Download</Button>
            </div>
            <ProcessingSection total={total} processed={processed} currentFile={currentFile} />
            <ResultsSection results={results} />
          </>
        )}
      </div>
    </main>
  )
}
