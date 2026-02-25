"use client"

import { useEffect, useState } from 'react'
import { AnalysisProgress } from '@/components/dashboard/AnalysisProgress'
import { JobUploadCard } from '@/components/dashboard/JobUploadCard'
import { RequirementSelector } from '@/components/dashboard/RequirementSelector'
import { CVUploadCard } from '@/components/dashboard/CVUploadCard'
import { ProcessingSection } from '@/components/dashboard/ProcessingSection'
import { ResultsSection } from '@/components/dashboard/ResultsSection'
import { SaveTemplateModal } from '@/components/dashboard/SaveTemplateModal'
import { supabase } from '@/lib/supabase/client'
// GDPR: Fjern direkte filuploads til Supabase Storage. CV'er og job sendes nu direkte til /api/analyze som FormData
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { downloadAnalysisReportPdf, generatePdfForUpload } from '@/lib/pdf'
import { User, GitCompare } from 'lucide-react'
import { parseError, errorToast, loadingToast } from '@/lib/errors/errorHandler'
import { useRouter } from 'next/navigation'
import { UPLOAD_LIMITS, uploadHelpers } from '@/lib/constants'
import { downloadCompareReportPdf } from '@/lib/pdf'

// Phase 2: Locked dashboard - package selection for users who haven't paid yet
function LockedDashboardContent({ userId, userName }: { userId: string; userName: string }) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  
  const handleBuyPackage = async (tier: 'rekruna_1' | 'rekruna_5' | 'rekruna_10') => {
    try {
      setLoadingTier(tier)
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        window.location.href = '/login'
        return
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tier })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout fejl')
      if (data.url) window.location.href = data.url
    } catch (e: any) {
      alert(e.message || 'Der opstod en fejl')
    } finally {
      setLoadingTier(null)
    }
  }

  // Phase 3: Rekruna 1/5/10 - antal stillingsopslag, ubegrænsede CV'er
  const plans = [
    { tier: 'rekruna_1' as const, name: 'Rekruna 1', price: '2.495 kr', desc: '1 stillingsopslag · Engangsbetaling' },
    { tier: 'rekruna_5' as const, name: 'Rekruna 5', price: '9.995 kr', desc: '5 stillingsopslag · Engangsbetaling' },
    { tier: 'rekruna_10' as const, name: 'Rekruna 10', price: '17.995 kr', desc: '10 stillingsopslag · Engangsbetaling' }
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Køb en pakke for at komme i gang</h2>
        <p className="text-gray-600 mt-2">
          Vælg en pakke nedenfor for at få adgang til CV screening
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.tier} className="border rounded-lg p-6 hover:border-primary transition-colors">
            <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
            <p className="text-2xl font-bold text-primary mt-2">{p.price}</p>
            <p className="text-sm text-gray-500 mt-1">{p.desc}</p>
            <Button
              className="w-full mt-4"
              onClick={() => handleBuyPackage(p.tier)}
              disabled={!!loadingTier}
            >
              {loadingTier === p.tier ? 'Indlæser...' : 'Køb'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  
  type Step = 1 | 2 | 3 | 4
  const [step, setStep] = useState<Step>(1)
  const [userId, setUserId] = useState<string>('')
  
  // User profile state for welcome message
  const [userName, setUserName] = useState<string>('')
  
  // EVENT account tracking
  const [isEventAccount, setIsEventAccount] = useState(false)
  const [eventDaysRemaining, setEventDaysRemaining] = useState(0)
  const [eventExpired, setEventExpired] = useState(false)

  // Simple client-side route protection
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // Failed files tracking for partial success
  const [failedFiles, setFailedFiles] = useState<Array<{ name: string; reason: string }>>([])
  
  // Retry state
  const [isRetrying, setIsRetrying] = useState(false)
  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      if (!user) {
        window.location.href = '/login'
      } else {
        setUserId(user.id)
        setCheckingAuth(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const [jobFile, setJobFile] = useState<File | null>(null)
  // Requirements extracted from job description (or custom added by user)
  // Start empty - will be populated by AI extraction or user input
  const [requirements, setRequirements] = useState<Array<{ id: string; text: string; selected: boolean; isCustom?: boolean }>>([])
  const [cvFiles, setCvFiles] = useState<File[]>([])

  const [total, setTotal] = useState(0)
  const [processed, setProcessed] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | undefined>()

  const [results, setResults] = useState<any[]>([])
  // Loading state for requirement extraction after job upload
  const [loadingRequirements, setLoadingRequirements] = useState(false)

  // Recent analyses from database (last 30 days) – hooks must be before any early returns
  const [recent, setRecent] = useState<Array<{ id: string; createdAt: Date; title: string; name: string; analysisId?: string; reportPath?: string; candidateCount?: number }>>([])
  const [loadingRecent, setLoadingRecent] = useState(false)
  
  // Plan/tier state (Phase 1: credits removed)
  const [userTier, setUserTier] = useState<string>('')
  
  // Phase 4: Current analysis ID for flow tracking (75-day expiry, 14-day warning)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string>('')
  const [flowInfo, setFlowInfo] = useState<{ daysRemaining: number; warning14Days: boolean } | null>(null)
  
  // Phase 2: Payment gate - has user bought a package? (or EVENT demo active)
  const [hasPaid, setHasPaid] = useState(false)
  const [accessCheckDone, setAccessCheckDone] = useState(false)
  
  // Template state
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [usingTemplate, setUsingTemplate] = useState(false)
  
  // Compare mode state
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  const [showDifferentRequirementsWarning, setShowDifferentRequirementsWarning] = useState(false)
  const [pendingComparisonData, setPendingComparisonData] = useState<any>(null)
  
  // Load user profile data for welcome message
  useEffect(() => {
    if (!userId) return
    
    const loadUserProfile = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        
        if (!accessToken) return
        
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'  // Altid hent friske profil-data (fx efter demo-forlængelse i Supabase)
        })
        
        const result = await response.json()
        
        // Extract first name from contact_person field
        if (result.success && result.data?.contact_person) {
          const firstName = result.data.contact_person.split(' ')[0].toUpperCase()
          setUserName(firstName)
        }
        
        // Check if EVENT account and calculate days remaining
        if (result.success && result.data) {
          const profile = result.data
          
          if (profile.account_type === 'EVENT') {
            setIsEventAccount(true)
            
            // Calculate days remaining
            if (profile.event_expiry_date) {
              const expiryDate = new Date(profile.event_expiry_date)
              const now = new Date()
              const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              
              setEventDaysRemaining(daysRemaining)
              setEventExpired(daysRemaining <= 0 || !profile.is_active)
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }
    
    loadUserProfile()
  }, [userId])
  
  // Load plan/tier + Phase 2: Check if user has paid (subscription or EVENT demo)
  useEffect(() => {
    if (!userId) return
    
    const loadPlanAndAccess = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) return
        
        // Fetch profile (for EVENT check) and subscription (for payment check) in parallel
        const [profileRes, { data: subscription }] = await Promise.all([
          fetch('/api/profile', { headers: { 'Authorization': `Bearer ${accessToken}` }, cache: 'no-store' }),
          supabase.from('user_subscriptions').select('product_tier, status').eq('user_id', userId).eq('status', 'active').single()
        ])
        
        const profileResult = await profileRes.json()
        const profile = profileResult.success ? profileResult.data : null
        
        // EVENT account with active demo = has access
        const isEventActive = profile?.account_type === 'EVENT' && profile?.is_active
        const eventNotExpired = profile?.event_expiry_date ? new Date(profile.event_expiry_date) > new Date() : false
        const eventHasAccess = isEventActive && eventNotExpired
        
        // Active subscription/purchase = has paid
        const hasActiveSubscription = !!subscription?.product_tier
        
        setHasPaid(eventHasAccess || hasActiveSubscription)
        if (subscription) setUserTier(subscription.product_tier)
      } catch (error) {
        console.error('Error loading plan/access:', error)
      } finally {
        setAccessCheckDone(true)
      }
    }
    
    loadPlanAndAccess()
  }, [userId])
  
  // Load recent analyses from database
  useEffect(() => {
    if (!userId) return
    
    const loadRecentAnalyses = async () => {
      try {
        setLoadingRecent(true)
        
        // Get analyses from last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data, error } = await supabase
          .from('analysis_results')
          .select('id, analysis_id, title, created_at, name')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (error) {
          console.error('Error loading analyses:', error)
          return
        }
        
        // Group by analysis_id to avoid duplicates (one analysis can have multiple candidates)
        const analysesMap = new Map()
        ;(data || []).forEach((a: any) => {
          if (!analysesMap.has(a.analysis_id)) {
            analysesMap.set(a.analysis_id, {
              id: a.id,
              analysisId: a.analysis_id,
              createdAt: new Date(a.created_at),
              title: a.title || 'Analyse',
              name: a.name, // This will be the first candidate's name, but we'll show count
              candidateCount: 1,
              reportPath: undefined
            })
          } else {
            // Increment count for this analysis
            const existing = analysesMap.get(a.analysis_id)
            existing.candidateCount++
          }
        })
        
        const analyses = Array.from(analysesMap.values())
        setRecent(analyses)
      } catch (error) {
        console.error('Error loading recent analyses:', error)
      } finally {
        setLoadingRecent(false)
      }
    }
    
    loadRecentAnalyses()
  }, [userId])

  // Phase 4: Fetch flow info for 14-day warning banner (when in analysis flow)
  useEffect(() => {
    if (step < 2 || !currentAnalysisId || !userId) {
      setFlowInfo(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken || cancelled) return
      try {
        const res = await fetch(`/api/flows?analysisId=${encodeURIComponent(currentAnalysisId)}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const data = await res.json()
        if (cancelled) return
        if (data?.ok && data?.flow?.exists && data?.flow?.daysRemaining !== undefined) {
          setFlowInfo({
            daysRemaining: data.flow.daysRemaining,
            warning14Days: !!data.flow.warning14Days
          })
        } else {
          setFlowInfo(null)
        }
      } catch {
        if (!cancelled) setFlowInfo(null)
      }
    })()
    return () => { cancelled = true }
  }, [step, currentAnalysisId, userId, results.length]) // Refresh when results change (flow created after first batch)

  // Block rendering until auth checked
  if (checkingAuth) {
    return <main className="min-h-screen bg-brand-base" />
  }

  // Phase 2: Show loading while checking payment status
  if (!accessCheckDone) {
    return (
      <main className="min-h-screen bg-brand-base flex items-center justify-center">
        <p className="text-gray-600">Indlæser...</p>
      </main>
    )
  }

  // Phase 2: Locked dashboard - user must buy package before using screening
  const showLockedDashboard = !hasPaid

  // Format tier name for display (Phase 3: Rekruna 1/5/10)
  const getTierDisplayName = (tier?: string) => {
    if (!tier) return 'Ingen plan'
    if (tier === 'rekruna_1') return 'Rekruna 1'
    if (tier === 'rekruna_5') return 'Rekruna 5'
    if (tier === 'rekruna_10') return 'Rekruna 10'
    if (tier === 'pay_as_you_go') return 'Rekruna One'
    if (tier === 'pro') return 'Rekruna Pro'
    if (tier === 'business') return 'Rekruna Business'
    return tier
  }

  const startFromJob = async () => {
    if (!jobFile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    const analysisId = crypto.randomUUID()
    
    try {
      // Show loading indicator while extracting requirements
      setLoadingRequirements(true)
      setStep(2)
      
      console.log('🔍 Starting requirements extraction for:', jobFile.name)
      
      // Extract requirements from job description
      const formData = new FormData()
      formData.append('jobFile', jobFile)
      
      const response = await fetch('/api/requirements/extract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to extract requirements')
      }
      
      // Update requirements with extracted ones
      if (data.requirements && Array.isArray(data.requirements)) {
        console.log('✅ Extracted requirements:', data.requirements.map((r: any) => r.text))
        setRequirements(data.requirements)
      } else {
        console.warn('⚠️ No requirements in response, keeping defaults')
      }
      
      // Set up analysis session
      ;(window as any).__analysisId = analysisId
      ;(window as any).__userId = user.id
      setCurrentAnalysisId(analysisId)
      
    } catch (e: any) {
      console.error('Requirements extraction failed:', e)
      
      // Use toast instead of alert for better UX
      const error = parseError(e)
      errorToast.info('Vi kunne ikke udtrække krav automatisk. Du kan nu skrive dine egne krav.')
      
      // Clear requirements - user must write their own
      setRequirements([])
      console.log('Cleared requirements - user will write their own')
      
      // Still set up analysis session
      ;(window as any).__analysisId = analysisId
      ;(window as any).__userId = user.id
      setCurrentAnalysisId(analysisId)
    } finally {
      setLoadingRequirements(false)
    }
  }

  const toggleReq = (id: string) => setRequirements(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r))
  const contFromReq = () => setStep(3)
  const goBackFromReq = () => {
    setStep(1)
    setCurrentAnalysisId('')
    setFlowInfo(null)
  }

  // Add custom requirement
  const addCustomRequirement = (text: string) => {
    const newReq = {
      id: `custom-${Date.now()}`,
      text: text,
      selected: true, // Auto-select when added
      isCustom: true
    }
    setRequirements(prev => [...prev, newReq])
  }

  // Remove custom requirement
  const removeCustomRequirement = (id: string) => {
    setRequirements(prev => prev.filter(r => r.id !== id))
  }

  // Handle template selection
  const handleTemplateSelected = (template: any) => {
    console.log('Template selected:', template.title)
    // Set requirements from template (all selected by default)
    const templateReqs = template.requirements.map((req: any) => ({
      ...req,
      selected: true  // Auto-select all from template
    }))
    setRequirements(templateReqs)
    setUsingTemplate(true)
    // Move to step 2
    setLoadingRequirements(false)
    setStep(2)
  }

  // Open save template modal
  const openSaveTemplateModal = () => {
    setShowSaveTemplateModal(true)
  }

  // Save template
  const saveTemplate = async (title: string, description: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        errorToast.show({
          type: 'auth',
          message: 'Du skal være logget ind for at gemme template'
        })
        return
      }

      // Get selected requirements
      const selectedReqs = requirements.filter(r => r.selected)
      
      if (selectedReqs.length < 2 || selectedReqs.length > 5) {
        errorToast.show({
          type: 'validation',
          message: 'Du skal vælge 2-5 krav før du kan gemme template'
        })
        return
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          description,
          jobFileName: jobFile?.name,
          requirements: selectedReqs
        })
      })

      const data = await response.json()
      
      if (!data.ok) {
        console.error('Template save failed. Server response:', data)
        throw new Error(data.error || 'Failed to save template')
      }

      errorToast.success('Template gemt! Du kan nu genbruge den til fremtidige analyser.')
      console.log('✅ Template saved:', data.template.id)
      
    } catch (error: any) {
      console.error('Failed to save template:', error)
      errorToast.show({
        type: 'unknown',
        message: 'Kunne ikke gemme template. Prøv igen.',
        technical: error.message
      })
    }
  }

  // Toggle analysis selection for comparison
  // Only allows selection within same job title
  const toggleAnalysisSelection = (analysisId: string, jobTitle: string) => {
    // First check if we can add this analysis
    const currentSelected = selectedAnalyses
    
    // If clicking to add
    if (!currentSelected.includes(analysisId)) {
      // If first selection, allow any
      if (currentSelected.length === 0) {
        setSelectedAnalyses([analysisId])
        return
      }
      
      // Check if this analysis has same job title as already selected ones
      const firstSelected = recent.find(r => r.analysisId === currentSelected[0])
      if (firstSelected && firstSelected.title !== jobTitle) {
        // Show error AFTER checking, not during setState
        errorToast.show({
          type: 'validation',
          message: 'Du kan kun sammenligne analyser af samme stillingsbeskrivelse'
        })
        return
      }
      
      // Check max limit
      if (currentSelected.length >= 5) {
        return
      }
      
      setSelectedAnalyses([...currentSelected, analysisId])
    } else {
      // If clicking to remove
      setSelectedAnalyses(currentSelected.filter(id => id !== analysisId))
    }
  }

  // Handle compare analyses
  const handleCompareAnalyses = async () => {
    if (selectedAnalyses.length < 2) {
      errorToast.show({
        type: 'validation',
        message: 'Vælg mindst 2 analyser at sammenligne'
      })
      return
    }

    setComparing(true)
    let toastId = loadingToast.start('Sammenligner analyser...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/analyze/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          analysisIds: selectedAnalyses
        })
      })

      const data = await response.json()

      if (!data.ok) {
        console.error('Compare API error:', data)
        throw new Error(data.error || 'Failed to compare analyses')
      }

      // Check for warning about different requirements
      if (data.warning === 'different_requirements') {
        loadingToast.dismiss(toastId)
        setPendingComparisonData(data)
        setShowDifferentRequirementsWarning(true)
        return
      }

      // Generate and download PDF
      loadingToast.dismiss(toastId)
      toastId = loadingToast.start('Genererer rapport...')
      
      const filename = `${data.comparison.jobTitle}-samlet-analyse.pdf`
        .replace(/[^a-zA-Z0-9-_\.]/g, '-')
        .replace(/-+/g, '-')
      
      await downloadCompareReportPdf(data.comparison, filename)
      
      loadingToast.success(toastId, 'Samlet rapport downloadet!')
      setSelectedAnalyses([]) // Clear selection

    } catch (error: any) {
      console.error('Compare error:', error)
      loadingToast.error(toastId, 'Kunne ikke sammenligne analyser')
      errorToast.show({
        type: 'unknown',
        message: error.message || 'Kunne ikke sammenligne analyser',
        technical: error.message
      })
    } finally {
      setComparing(false)
    }
  }

  // Proceed with comparison despite different requirements
  const proceedWithComparison = async () => {
    setShowDifferentRequirementsWarning(false)
    setComparing(true)
    
    if (!selectedAnalyses.length) return

    const toastId = loadingToast.start('Genererer rapport...')

    try {
      // Re-call API with skipRequirementsCheck=true
      const token = await supabase.auth.getSession().then(s => s.data.session?.access_token)
      if (!token) throw new Error('Not authenticated')

      const response = await fetch('/api/analyze/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          analysisIds: selectedAnalyses,
          skipRequirementsCheck: true // Skip the warning this time
        })
      })

      const data = await response.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to compare analyses')
      }

      // Generate and download PDF
      const filename = `samlet-analyse-${data.comparison.jobTitle}.pdf`
        .toLowerCase()
        .replace(/[æøå]/g, (m) => ({ æ: 'ae', ø: 'oe', å: 'aa' })[m] || m)
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
      
      await downloadCompareReportPdf(data.comparison, filename)
      
      loadingToast.success(toastId, 'Samlet rapport downloadet!')
      setSelectedAnalyses([]) // Clear selection
      setPendingComparisonData(null)

    } catch (error: any) {
      console.error('PDF generation error:', error)
      loadingToast.error(toastId, 'Kunne ikke generere rapport')
    } finally {
      setComparing(false)
    }
  }

  const onFiles = (files: File[]) => {
    // Validate files using centralized validation
    const validation = uploadHelpers.validateFiles(files)
    if (!validation.valid) {
      errorToast.show({
        type: 'validation',
        message: validation.error || 'Ugyldige filer',
        technical: `File validation failed: ${files.length} files, total size: ${files.reduce((s, f) => s + f.size, 0)} bytes`
      })
      return
    }
    setCvFiles(files)
  }
  
  const goBackFromCVUpload = () => setStep(2)

  // Analyze with SSE for real-time progress updates
  // Falls back to regular API if SSE not supported or fails
  // Includes partial success handling and retry functionality
  const analyze = async () => {
    const analysisId = (window as any).__analysisId as string
    const userId = (window as any).__userId as string
    if (!analysisId || !userId) {
      errorToast.show({
        type: 'validation',
        message: 'Session ikke oprettet. Start forfra.',
        technical: 'Missing analysisId or userId'
      })
      return
    }
    setStep(4)
    setTotal(cvFiles.length)
    setProcessed(0)
    setCurrentFile(undefined)
    setFailedFiles([]) // Reset failed files on new analysis
    
    try {
      const selectedReqs = requirements.filter((r) => r.selected).map((r) => r.text)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      const fd = new FormData()
      fd.append('analysisId', analysisId)
      fd.append('title', jobFile?.name?.replace(/\.pdf$/i, '') || 'Analyse')
      fd.append('requirements', JSON.stringify(selectedReqs))
      if (jobFile) fd.append('job', jobFile)
      cvFiles.forEach((f) => fd.append('cvs', f))

      // Try SSE first for real-time updates
      const useSSE = typeof EventSource !== 'undefined'
      
      if (useSSE) {
        console.log('🔄 Using SSE for real-time analysis updates')
        
        // Use fetch with streaming for SSE
        const res = await fetch('/api/analyze/stream', {
          method: 'POST',
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: fd,
        })

        if (!res.ok) {
          // SSE failed, try fallback
          console.warn('SSE endpoint failed, falling back to regular API')
          throw new Error('SSE not available')
        }

        // Read SSE stream
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        const tempResults: any[] = []

        if (!reader) {
          throw new Error('Stream reader not available')
        }

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          
          // Keep last incomplete chunk in buffer
          buffer = lines.pop() || ''
          
          // Process complete events
          for (const line of lines) {
            if (!line.trim()) continue
            
            // Parse SSE format: "event: eventType\ndata: {...}"
            const eventMatch = line.match(/event:\s*(\w+)\ndata:\s*([\s\S]+)/)
            if (!eventMatch) continue
            
            const eventType = eventMatch[1]
            const dataStr = eventMatch[2]
            
            try {
              const data = JSON.parse(dataStr)
              
              // Handle different event types
              if (eventType === 'progress') {
                // Update progress bar and current file
                setProcessed(data.processed || 0)
                setCurrentFile(data.currentFile || undefined)
                console.log(`📊 Progress: ${data.processed}/${data.total} - ${data.currentFile || data.status}`)
              } else if (eventType === 'result') {
                // Individual result received - add to temp array
                if (data.result) {
                  tempResults.push(data.result)
                  setProcessed(data.processed || 0)
                  console.log(`✅ Result received: ${data.result.name}`)
                }
              } else if (eventType === 'complete') {
                // Analysis complete - use final results
                console.log('🎉 Analysis complete!')
                const finalResults = data.results && Array.isArray(data.results) 
                  ? data.results 
                  : tempResults.length > 0 
                    ? tempResults 
                    : []
                
                setResults(finalResults)
                setProcessed(cvFiles.length)
                setCurrentFile(undefined)
                
                // Automatically save report to storage after successful analysis
                await saveReportToStorage(finalResults)
                
                const title = jobFile?.name?.replace(/\.pdf$/i, '') || 'Analyse'
                recordAnalysis(title)
                return
              } else if (eventType === 'error') {
                // Error occurred
                console.error('❌ SSE Error:', data.error)
                
                // Parse error and show appropriate toast
                const error = parseError(data)
                
                // Special handling for credit errors
                if (error.type === 'credit') {
                  errorToast.showCreditError(error, () => router.push('/dinprofil'))
                  throw new Error(data.error || 'Ikke nok credits')
                }
                
                // Show error with retry option
                errorToast.showWithRetry(error, () => {
                  setStep(3) // Go back to CV upload step
                })
                
                throw new Error(data.error || 'Analyse fejlede')
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE event:', parseError)
            }
          }
        }
        
        // If we exit the loop without completion event, use temp results
        if (tempResults.length > 0) {
          setResults(tempResults)
          setProcessed(cvFiles.length)
          setCurrentFile(undefined)
          
          // Automatically save report to storage
          await saveReportToStorage(tempResults)
          
          const title = jobFile?.name?.replace(/\.pdf$/i, '') || 'Analyse'
          recordAnalysis(title)
        } else {
          throw new Error('Ingen resultater modtaget')
        }
        
      } else {
        // Fallback to regular API (no SSE support)
        console.log('📡 Using regular API (SSE not supported)')
        await analyzeWithRegularAPI(fd, accessToken)
      }
    } catch (e: any) {
      console.error('Analysis error:', e)
      
      // Parse error for user-friendly message
      const error = parseError(e)
      
      // Try fallback to regular API if SSE failed
      if (e.message.includes('SSE') || e.message.includes('Stream')) {
        console.log('🔄 Attempting fallback to regular API...')
        errorToast.info('Real-time opdateringer fejlede. Bruger standard analyse...')
        
        try {
          const selectedReqs = requirements.filter((r) => r.selected).map((r) => r.text)
          const { data: sessionData } = await supabase.auth.getSession()
          const accessToken = sessionData.session?.access_token

          const fd = new FormData()
          fd.append('analysisId', (window as any).__analysisId)
          fd.append('title', jobFile?.name?.replace(/\.pdf$/i, '') || 'Analyse')
          fd.append('requirements', JSON.stringify(selectedReqs))
          if (jobFile) fd.append('job', jobFile)
          cvFiles.forEach((f) => fd.append('cvs', f))
          
          await analyzeWithRegularAPI(fd, accessToken)
          return
        } catch (fallbackError: any) {
          const fallbackErrorParsed = parseError(fallbackError)
          
          // Special handling for credit errors
          if (fallbackErrorParsed.type === 'credit') {
            errorToast.showCreditError(fallbackErrorParsed, () => router.push('/dinprofil'))
            return
          }
          
          // Show error with retry
          errorToast.showWithRetry(fallbackErrorParsed, () => analyze())
          return
        }
      }
      
      // Credit error handling
      if (error.type === 'credit') {
        errorToast.showCreditError(error, () => router.push('/dinprofil'))
        return
      }
      
      // Other errors - show with retry option
      errorToast.showWithRetry(error, () => {
        // Retry analysis
        analyze()
      })
    }
  }

  // Fallback function using regular API (non-SSE)
  const analyzeWithRegularAPI = async (fd: FormData, accessToken: string | undefined) => {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: fd,
    })
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      const txt = await res.text()
      throw new Error(`Serverfejl (${res.status}). ${txt.slice(0, 120)}`)
    }
    const data = await res.json()
    if (!res.ok || !data?.ok) {
      // Handle error response with proper error object
      if (data?.error) {
        throw Object.assign(new Error(data.error), data)
      }
      throw new Error(data?.error || 'Analyse fejlede')
    }
    
    // Success - set results
    const analysisResults = Array.isArray(data.results) ? data.results : []
    setResults(analysisResults)
    setProcessed(cvFiles.length)
    setCurrentFile(undefined)
    
    const title = jobFile?.name?.replace(/\.pdf$/i, '') || 'Analyse'
    
    // Automatically save report to storage after successful analysis
    await saveReportToStorage(analysisResults)
    
    recordAnalysis(title)
    
    // Show success toast
    errorToast.success(`✅ ${cvFiles.length} CVer analyseret succesfuldt!`)
  }
  
  // Save report to Supabase Storage (called automatically after analysis)
  const saveReportToStorage = async (analysisResults: any[]) => {
    if (!analysisResults?.length) return
    
    try {
      // Ensure buckets exist
      try { await fetch('/api/storage/ensure', { method: 'POST' }) } catch {}

      const analysisId = (window as any).__analysisId as string
      const { data: { user } } = await supabase.auth.getUser()
      if (!analysisId || !user) return
      
      const path = `${user.id}/${analysisId}/report.pdf`
      
      // Generate PDF blob using React-PDF generator
      const blob = await generatePdfForUpload({ results: analysisResults })
      
      const { error: upErr } = await supabase.storage.from('reports').upload(path, blob, { 
        contentType: 'application/pdf', 
        upsert: true 
      })
      
      if (upErr) {
        console.warn('Report upload failed:', upErr.message)
        return
      }

      // Verify the object exists by creating a signed URL
      const { data: signed, error: signErr } = await supabase.storage.from('reports').createSignedUrl(path, 60)
      if (signErr || !signed?.signedUrl) {
        console.warn('Could not verify report:', signErr?.message)
        return
      }

      console.log('✅ Report automatically saved to storage:', path)
    } catch (e) {
      console.warn('Auto-save report failed:', (e as any)?.message)
    }
  }

  // Reset dashboard to initial view (step 1)
  // Used when user clicks "Tilbage til dashboard" button
  const goBackToDashboard = () => {
    console.log('🔄 Going back to dashboard - resetting to step 1')
    // Clear results and reset to main dashboard
    setResults([])
    setStep(1)
    setCurrentAnalysisId('')
    setFlowInfo(null)
    setTotal(0)
    setProcessed(0)
    setCurrentFile(undefined)
    // Scroll to top so user sees the main dashboard
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const startNewAnalysis = () => {
    setStep(1)
    setCurrentAnalysisId('')
    setFlowInfo(null)
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

    const toastId = loadingToast.start('Genererer PDF rapport...')
    
    try {
      // Download PDF to user's computer
      // (Report is already saved to storage automatically after analysis)
      await downloadAnalysisReportPdf({ 
        results, 
        filename: 'cv-analyse-resultat.pdf' 
      })

      loadingToast.success(toastId, 'PDF rapport downloadet!')
    } catch (error: any) {
      console.error('PDF generation failed:', error)
      loadingToast.error(toastId, 'Kunne ikke generere PDF rapport')
      
      const parsedError = parseError(error)
      errorToast.showWithRetry(parsedError, () => downloadPdf())
    }
  }

  const recordAnalysis = async (title: string) => {
    // Analyses are now automatically saved to analysis_results table by /api/analyze
    // Just reload the recent analyses list and stats from database
    if (!userId) return
    
    try {
      // Reload recent analyses
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data, error } = await supabase
        .from('analysis_results')
        .select('id, analysis_id, title, created_at, name')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) {
        console.error('Error reloading analyses:', error)
        return
      }
      
      // Group by analysis_id to avoid duplicates
      const analysesMap = new Map()
      ;(data || []).forEach((a: any) => {
        if (!analysesMap.has(a.analysis_id)) {
          analysesMap.set(a.analysis_id, {
            id: a.id,
            analysisId: a.analysis_id,
            createdAt: new Date(a.created_at),
            title: a.title || 'Analyse',
            name: a.name,
            candidateCount: 1,
            reportPath: undefined
          })
        } else {
          const existing = analysesMap.get(a.analysis_id)
          existing.candidateCount++
        }
      })
      
      const analyses = Array.from(analysesMap.values())
      setRecent(analyses)
      
      // Reload plan/tier info
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('product_tier, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      if (subscription) {
        setUserTier(subscription.product_tier)
      }
    } catch (error) {
      console.error('Error reloading analyses and plan:', error)
    }
  }

  // Phase 2: Locked dashboard - match mockup: Welcome, Din plan, Upload preview, Package selection
  // Demo banner shows ONLY for EVENT accounts (they have hasPaid=true, so never see this locked view)
  if (showLockedDashboard) {
    return (
      <main className="min-h-screen bg-brand-base">
        <AnalysisProgress currentStep={1} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Welcome Header - match mockup */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {userName ? `Hej ${userName}` : 'Dashboard'}
                </h1>
                <p className="text-gray-600 mt-1">Velkommen til dit CV screening dashboard</p>
              </div>
              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link href="/dinprofil">
                  <User className="w-4 h-4" />
                  Min Profil
                </Link>
              </Button>
            </div>
          </div>

          {/* Din plan: Ingen plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Din plan: <span className="font-semibold text-gray-900">Ingen plan</span></p>
          </div>

          {/* Upload section - preview/teaser (disabled until payment) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">(1) Upload Stillingsbeskrivelsen</h3>
            <p className="text-gray-600 mb-4">Upload stillingsbeskrivelsen som PDF og klik Start analyse</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Klik for at vælge fil</span>
                <span className="text-sm">Kun PDF-filer accepteres</span>
              </div>
            </div>
            <Button disabled className="mt-4 w-full bg-gray-400 cursor-not-allowed">
              Start Analyse
            </Button>
            <p className="text-sm text-gray-500 mt-2 text-center">Køb en pakke for at aktivere screening</p>
          </div>

          {/* Package selection - Køb en pakke for at komme i gang */}
          <LockedDashboardContent userId={userId} userName={userName} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-brand-base">
      <AnalysisProgress currentStep={step} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* EVENT Account Banner */}
        {isEventAccount && !eventExpired && eventDaysRemaining > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
                  {eventDaysRemaining}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Demo konto aktiv
                  </h3>
                  <p className="text-blue-700">
                    Du har <strong>{eventDaysRemaining} dage</strong> tilbage af din demo periode
                  </p>
                </div>
              </div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/">
                  Køb en pakke for at fortsætte
                </Link>
              </Button>
            </div>
          </div>
        )}
        
        {/* Phase 4: 14-day flow expiry warning */}
        {flowInfo?.warning14Days && flowInfo.daysRemaining > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-xl font-bold">
                {flowInfo.daysRemaining}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-900">
                  Rekrutteringsflow udløber snart
                </h3>
                <p className="text-amber-800">
                  Du har <strong>{flowInfo.daysRemaining} dage</strong> tilbage af dette flow. Efter udløb kan du ikke tilføje flere CV'er. Historik forbliver tilgængelig.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* EVENT Account Expired Banner */}
        {isEventAccount && eventExpired && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <span className="text-2xl">⚠</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    Din demo er udløbet
                  </h3>
                  <p className="text-red-700">
                    For at fortsætte skal du købe en pakke
                  </p>
                </div>
              </div>
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link href="/">
                  Køb pakke her
                </Link>
              </Button>
            </div>
          </div>
        )}
        
        {/* Only show overview sections when on step 1 (main dashboard) */}
        {step === 1 && (
          <>
            {/* Welcome Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {userName ? `Hej ${userName}` : 'Dashboard'}
                  </h1>
                  <p className="text-gray-600 mt-1">Velkommen til dit CV screening dashboard</p>
                </div>
                <Button asChild variant="outline" className="flex items-center gap-2">
                  <Link href="/dinprofil">
                    <User className="w-4 h-4" />
                    Min Profil
                  </Link>
                </Button>
              </div>
            </div>

            {/* Plan Section - Phase 1: Credits removed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <p className="text-sm text-gray-600">Din plan: <span className="font-semibold text-gray-900">{getTierDisplayName(userTier)}</span></p>
            </div>
          </>
        )}
        
        {/* Admin: manual cleanup trigger (hidden unless flag is set) */}
        {process.env.NEXT_PUBLIC_ENABLE_ADMIN_CLEANUP === '1' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-end">
            <Button
              variant="outline"
              onClick={async () => {
                const toastId = loadingToast.start('Rydder op i gamle filer...')
                try {
                  const res = await fetch('/api/admin/cleanup', { method: 'POST' })
                  const data = await res.json()
                  if (data?.ok) {
                    loadingToast.success(toastId, `Slettede ${data.deleted} filer`)
                  } else {
                    loadingToast.error(toastId, data?.error || 'Oprydning fejlede')
                  }
                } catch (e: any) {
                  loadingToast.error(toastId, 'Oprydning fejlede')
                  const error = parseError(e)
                  errorToast.show(error)
                }
              }}
            >
              Kør 30-dages oprydning
            </Button>
          </div>
        )}
        
        {/* Job Upload Step */}
        {step === 1 && (
          <JobUploadCard 
            file={jobFile} 
            onFileSelected={(f) => setJobFile(f)} 
            onStart={startFromJob} 
            onTemplateSelected={handleTemplateSelected}
            canStart={!!jobFile} 
          />
        )}
        {/* Recent Analyses Section - Always visible on step 1 */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Seneste analyser</h3>
              <span className="text-sm text-gray-500">(Sidste 30 dage)</span>
            </div>
            
            {loadingRecent ? (
              <p className="text-gray-500 text-center py-8">Henter analyser...</p>
            ) : recent.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Ingen analyser endnu</p>
                <p className="text-sm text-gray-400">Start din første analyse ved at uploade et jobopslag ovenfor</p>
              </div>
            ) : (
              <>
                {/* Compare Mode Actions */}
                {selectedAnalyses.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitCompare className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {selectedAnalyses.length} {selectedAnalyses.length === 1 ? 'analyse' : 'analyser'} valgt
                      </span>
                      {selectedAnalyses.length >= 5 && (
                        <span className="text-xs text-gray-500">(max 5)</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedAnalyses([])}
                      >
                        Ryd valg
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleCompareAnalyses}
                        disabled={selectedAnalyses.length < 2 || comparing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {comparing ? 'Sammenligner...' : 'Sammenlign valgte'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {recent.map((r) => {
                    const formattedDate = r.createdAt.toLocaleDateString('da-DK', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                    const formattedTime = r.createdAt.toLocaleTimeString('da-DK', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    
                    const isSelected = r.analysisId ? selectedAnalyses.includes(r.analysisId) : false
                    const canSelect = selectedAnalyses.length < 5 || isSelected
                    
                    return (
                      <div 
                        key={r.id}
                        className={`flex items-center gap-3 p-4 rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                        }`}
                      >
                        {/* Checkbox for selection */}
                        {r.analysisId && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAnalysisSelection(r.analysisId!, r.title)}
                            disabled={!canSelect}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            title="Vælg til sammenligning"
                          />
                        )}
                        
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{r.title}</p>
                          <p className="text-sm text-gray-600">
                            {r.candidateCount ? `${r.candidateCount} ${r.candidateCount === 1 ? 'kandidat' : 'kandidater'}` : r.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{formattedDate} kl. {formattedTime}</p>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Try to find report in storage
                            if (!r.analysisId || !userId) {
                              errorToast.show({
                                type: 'validation',
                                message: 'Analyse detaljer ikke tilgængelige',
                                technical: 'Missing analysisId or userId'
                              })
                              return
                            }
                            
                            const toastId = loadingToast.start('Henter rapport...')
                            const path = `${userId}/${r.analysisId}/report.pdf`
                            const { data, error } = await supabase.storage.from('reports').createSignedUrl(path, 60)
                            
                            if (error || !data?.signedUrl) {
                              loadingToast.error(toastId, 'Ingen rapport gemt endnu')
                              return
                            }
                            
                            loadingToast.dismiss(toastId)
                            window.open(data.signedUrl, '_blank')
                          }}
                        >
                          Se rapport
                        </Button>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  💡 Vælg 2-5 analyser af samme stillingsbeskrivelse for at sammenligne • Rapporter gemmes i 30 dage
                </p>
              </>
            )}
          </div>
        )}
        {step === 2 && (
          loadingRequirements ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-lg font-medium text-gray-900">Vi analyserer dit stillingsopslag…</p>
              <p className="text-gray-600 mt-2">Det tager typisk under 10 sekunder</p>
            </div>
          ) : (
            <RequirementSelector 
              requirements={requirements} 
              onToggle={toggleReq} 
              onContinue={contFromReq}
              onBack={goBackFromReq}
              onAddCustom={addCustomRequirement}
              onRemoveCustom={removeCustomRequirement}
              onSaveTemplate={openSaveTemplateModal}
              showSaveTemplate={!usingTemplate}
            />
          )
        )}
        {step === 3 && (
          <CVUploadCard 
            files={cvFiles} 
            onFilesSelected={onFiles} 
            onAnalyze={analyze}
            onBack={goBackFromCVUpload}
          />
        )}
        {step === 4 && (
          <>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={goBackToDashboard}>Tilbage til dashboard</Button>
              <Button variant="outline" onClick={startNewAnalysis}>Start ny analyse</Button>
              <Button onClick={downloadPdf}>Download</Button>
            </div>
            <ProcessingSection total={total} processed={processed} currentFile={currentFile} />
            <ResultsSection results={results} />
          </>
        )}
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        onSave={saveTemplate}
        jobFileName={jobFile?.name}
      />

      {/* Warning Modal - Different Requirements */}
      {showDifferentRequirementsWarning && pendingComparisonData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Analyserne har forskellige krav
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    De valgte analyser har ikke samme krav. Sammenligning kan være misvisende.
                  </p>

                  {/* Show requirements for each analysis */}
                  <div className="space-y-4 mb-6">
                    {pendingComparisonData.analyses?.map((analysis: any, idx: number) => (
                      <div key={analysis.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-900 mb-2">
                          Analyse {idx + 1}: {analysis.title}
                        </p>
                        <ul className="space-y-1">
                          {analysis.requirements?.map((req: any, reqIdx: number) => (
                            <li key={reqIdx} className="text-sm text-gray-600 pl-4">
                              • {req.text || req.requirement || req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-gray-700 mb-6">
                    Vil du stadig køre sammenligningen?
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDifferentRequirementsWarning(false)
                    setPendingComparisonData(null)
                    setSelectedAnalyses([])
                  }}
                >
                  Annuller
                </Button>
                <Button
                  onClick={proceedWithComparison}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Ja, fortsæt alligevel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
