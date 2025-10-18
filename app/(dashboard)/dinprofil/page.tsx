"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Building2, MapPin, Hash, Mail, Lock, CreditCard, Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { parseError, errorToast, loadingToast } from '@/lib/errors/errorHandler'

// User profile data structure
interface UserProfile {
  company_name: string
  contact_person: string
  cvr_number: string
  address: string
  postal_code: string
  city: string
  email: string
  phone?: string
  marketing_consent: boolean
}

// Credits data structure
interface CreditsData {
  total: number
  subscription: number
  purchased: number
  tier?: string
}

// Analysis result structure
interface AnalysisResult {
  id: string
  analysis_id: string
  title: string
  created_at: string
  name: string
  candidateCount?: number // Number of candidates in this analysis batch
}

export default function ProfilPage() {
  const router = useRouter()
  
  // Auth state
  const [userId, setUserId] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  
  // Credits state
  const [credits, setCredits] = useState<CreditsData | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [loadingTopup, setLoadingTopup] = useState(false)
  const [selectedBoostTier, setSelectedBoostTier] = useState<'boost_50' | 'boost_100' | 'boost_250' | 'boost_500' | null>(null)
  const [creditsUsedThisMonth, setCreditsUsedThisMonth] = useState<number>(0)
  
  // Recent analyses state
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState<UserProfile>({
    company_name: '',
    contact_person: '',
    cvr_number: '',
    address: '',
    postal_code: '',
    city: '',
    email: '',
    phone: '',
    marketing_consent: false
  })

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Load data when user is authenticated
  useEffect(() => {
    if (userId) {
      loadProfile()
      loadCredits()
      loadRecentAnalyses()
    }
  }, [userId])

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUserId(user.id)
      setUserEmail(user.email || '')
      
      // No default name - will be set when profile loads
      // If profile doesn't exist, we just show "Hej" without a name
      setUserName('')
      
      setCheckingAuth(false)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  // Load user profile from database
  const loadProfile = async () => {
    try {
      setLoadingProfile(true)
      
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      
      if (!accessToken) return
      
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      const result = await response.json()
      
      if (result.success && result.data) {
        setProfile(result.data)
        setFormData(result.data)
        
        // Extract first name from contact_person field
        // Example: "Jan Højborg Henriksen" -> "JAN"
        if (result.data.contact_person) {
          const firstName = result.data.contact_person.split(' ')[0].toUpperCase()
          setUserName(firstName)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoadingProfile(false)
    }
  }

  // Load credits information
  const loadCredits = async () => {
    try {
      setLoadingCredits(true)
      
      // Get credit balance
      const { data: balance, error } = await supabase
        .from('credit_balances')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading credits:', error)
        return
      }
      
      // Get subscription info
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('product_tier, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      if (balance) {
        setCredits({
          total: balance.total_credits,
          subscription: balance.subscription_credits,
          purchased: balance.purchased_credits,
          tier: subscription?.product_tier
        })
        
        // Calculate credits used this month from transactions
        // Get all deduction transactions since last subscription reset
        const resetDate = balance.last_subscription_reset || balance.created_at
        
        const { data: transactions, error: txError } = await supabase
          .from('credit_transactions')
          .select('amount, transaction_type, created_at')
          .eq('user_id', userId)
          .eq('transaction_type', 'deduction')
          .gte('created_at', resetDate)
        
        if (txError) {
          console.error('Error loading transactions:', txError)
        } else if (transactions) {
          // Sum up all deductions (amounts are negative, so we use abs)
          const totalUsed = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
          setCreditsUsedThisMonth(totalUsed)
        }
      }
    } catch (error) {
      console.error('Error loading credits:', error)
    } finally {
      setLoadingCredits(false)
    }
  }

  // Load recent analyses from database
  const loadRecentAnalyses = async () => {
    try {
      setLoadingAnalyses(true)
      
      // Get analyses from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data, error } = await supabase
        .from('analysis_results')
        .select('id, analysis_id, title, created_at, name')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100) // Increase limit to get all, then group
      
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
            analysis_id: a.analysis_id,
            created_at: a.created_at,
            title: a.title || 'Analyse',
            name: a.name, // First candidate's name
            candidateCount: 1
          })
        } else {
          // Increment count for this analysis
          const existing = analysesMap.get(a.analysis_id)
          existing.candidateCount++
        }
      })
      
      // Convert to array and take top 10 unique analyses
      const uniqueAnalyses = Array.from(analysesMap.values()).slice(0, 10)
      
      setRecentAnalyses(uniqueAnalyses)
    } catch (error) {
      console.error('Error loading analyses:', error)
    } finally {
      setLoadingAnalyses(false)
    }
  }

  // Handle profile form submission
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSavingProfile(true)
      
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      
      if (!accessToken) {
        alert('Session udløbet. Log venligst ind igen.')
        return
      }
      
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        errorToast.success('✅ Profil opdateret!')
        setProfile(result.data)
        
        // Update displayed name with first name
        if (result.data.contact_person) {
          const firstName = result.data.contact_person.split(' ')[0].toUpperCase()
          setUserName(firstName)
        }
      } else {
        errorToast.show({
          type: 'validation',
          message: `Fejl: ${result.error}`,
          technical: result.error
        })
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      const parsedError = parseError(error)
      errorToast.show(parsedError)
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle boost selection (just select, don't purchase yet)
  const handleBoostSelect = (tier: 'boost_50' | 'boost_100' | 'boost_250' | 'boost_500') => {
    setSelectedBoostTier(tier)
  }

  // Handle topup purchase (called when user clicks "Betalt")
  const handleTopupPurchase = async () => {
    if (!selectedBoostTier) {
      errorToast.show({
        type: 'validation',
        message: 'Vælg en boost pakke først',
        technical: 'No boost tier selected'
      })
      return
    }
    
    try {
      setLoadingTopup(true)
      
      // Get authentication token
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      
      if (!accessToken) {
        errorToast.show({
          type: 'auth',
          message: 'Din session er udløbet. Log venligst ind igen.',
          technical: 'No access token',
          action: 'login'
        })
        setTimeout(() => router.push('/login'), 2000)
        return
      }
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ tier: selectedBoostTier }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Topup error:', error)
      const parsedError = parseError(error)
      errorToast.show(parsedError)
    } finally {
      setLoadingTopup(false)
    }
  }
  
  // Handle viewing report for an analysis
  const handleViewReport = async (analysisId: string) => {
    if (!userId || !analysisId) {
      errorToast.show({
        type: 'validation',
        message: 'Analyse detaljer ikke tilgængelige',
        technical: 'Missing userId or analysisId'
      })
      return
    }
    
    const toastId = loadingToast.start('Henter rapport...')
    const path = `${userId}/${analysisId}/report.pdf`
    
    const { data, error } = await supabase.storage.from('reports').createSignedUrl(path, 60)
    
    if (error || !data?.signedUrl) {
      loadingToast.error(toastId, 'Ingen rapport gemt endnu')
      return
    }
    
    loadingToast.dismiss(toastId)
    window.open(data.signedUrl, '_blank')
  }

  // Toggle analysis selection for comparison
  const toggleAnalysisSelection = (analysisId: string) => {
    setSelectedAnalyses(prev => 
      prev.includes(analysisId) 
        ? prev.filter(id => id !== analysisId)
        : prev.length < 5 
          ? [...prev, analysisId]
          : prev // Max 5
    )
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
    const toastId = loadingToast.start('Sammenligner analyser...')

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
      loadingToast.update(toastId, 'Genererer rapport...')
      
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
    
    if (!pendingComparisonData) return

    const toastId = loadingToast.start('Genererer rapport...')

    try {
      const filename = `samlet-analyse.pdf`
      await downloadCompareReportPdf(pendingComparisonData.comparison, filename)
      
      loadingToast.success(toastId, 'Samlet rapport downloadet!')
      setSelectedAnalyses([]) // Clear selection
      setPendingComparisonData(null)

    } catch (error: any) {
      console.error('PDF generation error:', error)
      loadingToast.error(toastId, 'Kunne ikke generere rapport')
    }
  }

  // Show loading state while checking auth
  if (checkingAuth) {
    return <main className="min-h-screen bg-brand-base" />
  }

  // Credits calculation
  // Credits remaining = what's in the balance (subscription + purchased)
  // Credits used = calculated from transactions since last reset
  const creditsRemaining = credits?.total || 0
  const creditsUsed = creditsUsedThisMonth

  // Format tier name for display
  const getTierDisplayName = (tier?: string) => {
    if (!tier) return 'Ingen plan'
    if (tier === 'pay_as_you_go') return 'Rekruna One incl. 200 CVer'
    if (tier === 'pro') return 'Rekruna Pro incl. 400 CVer'
    if (tier === 'business') return 'Rekruna Business incl. 1000 CVer'
    return tier
  }

  return (
    <main className="min-h-screen bg-brand-base">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {userName ? `Hej ${userName}` : 'Hej'}
          </h1>
        </div>

        {/* Credits Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600">Din plan: <span className="font-semibold text-gray-900">{getTierDisplayName(credits?.tier)}</span></p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Column 1: Credits brugt */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Credits brugt</p>
              <p className="text-3xl font-bold text-gray-900">{creditsUsed}</p>
            </div>
            
            {/* Column 2: Credits tilbage */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">Credits tilbage</p>
              <p className="text-3xl font-bold text-blue-900">{creditsRemaining}</p>
              {credits && credits.purchased > 0 && (
                <p className="text-xs text-blue-600 mt-1">Heraf tilkøbte: {credits.purchased}</p>
              )}
            </div>

            {/* Column 3: Køb ekstra credits */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">Køb ekstra credits:</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  variant={selectedBoostTier === 'boost_50' ? 'default' : 'outline'}
                  onClick={() => handleBoostSelect('boost_50')}
                  disabled={loadingTopup}
                  className="flex-1 min-w-[60px]"
                  size="sm"
                >
                  50
                </Button>
                
                <Button
                  variant={selectedBoostTier === 'boost_100' ? 'default' : 'outline'}
                  onClick={() => handleBoostSelect('boost_100')}
                  disabled={loadingTopup}
                  className="flex-1 min-w-[60px]"
                  size="sm"
                >
                  100
                </Button>
                
                <Button
                  variant={selectedBoostTier === 'boost_250' ? 'default' : 'outline'}
                  onClick={() => handleBoostSelect('boost_250')}
                  disabled={loadingTopup}
                  className="flex-1 min-w-[60px]"
                  size="sm"
                >
                  250
                </Button>
                
                <Button
                  variant={selectedBoostTier === 'boost_500' ? 'default' : 'outline'}
                  onClick={() => handleBoostSelect('boost_500')}
                  disabled={loadingTopup}
                  className="flex-1 min-w-[60px]"
                  size="sm"
                >
                  500
                </Button>
              </div>

              <Button
                onClick={handleTopupPurchase}
                disabled={!selectedBoostTier || loadingTopup}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50"
                size="sm"
              >
                {loadingTopup ? 'Behandler...' : 'Betal'}
              </Button>
              
              <p className="text-xs text-gray-500 mt-2">1 credit = 1 CV</p>
            </div>
          </div>
        </div>

        {/* Recent Analyses Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Seneste analyser</h2>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-green-600 hover:bg-green-700"
            >
              Start ny analyse
            </Button>
          </div>

          {loadingAnalyses ? (
            <p className="text-gray-500 text-center py-4">Henter analyser...</p>
          ) : recentAnalyses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Ingen analyser endnu</p>
          ) : (
            <>
              <ul className="space-y-2">
                {recentAnalyses.map((analysis) => {
                  const date = new Date(analysis.created_at)
                  const formattedDate = date.toLocaleDateString('da-DK', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                  
                  return (
                    <li key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{analysis.title || 'Analyse'}</p>
                        <p className="text-sm text-gray-600">
                          {analysis.candidateCount ? `${analysis.candidateCount} kandidat${analysis.candidateCount > 1 ? 'er' : ''}` : analysis.name}
                        </p>
                        <p className="text-xs text-gray-500">{formattedDate}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(analysis.analysis_id)}
                      >
                        Se rapport
                      </Button>
                    </li>
                  )
                })}
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                Viser kun analyser fra de seneste 30 dage.
              </p>
            </>
          )}
        </div>

        {/* Profile Form Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Kontooplysninger</h2>
          
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* Company Name */}
            <div>
              <Label htmlFor="company_name">Firmanavn</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Dit firmanavn"
                required
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Firmaadresse"
                required
              />
            </div>

            {/* Postal Code and City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Postnummer</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="0000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">By</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="By"
                  required
                />
              </div>
            </div>

            {/* CVR Number */}
            <div>
              <Label htmlFor="cvr_number">CVR nr.</Label>
              <Input
                id="cvr_number"
                value={formData.cvr_number}
                onChange={(e) => setFormData({ ...formData, cvr_number: e.target.value })}
                placeholder="12345678"
                required
              />
            </div>

            {/* Contact Person */}
            <div>
              <Label htmlFor="contact_person" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Fulde navn
              </Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Dit fulde navn"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email adresse
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="janhojborghenriksen@gmail.com"
                className="bg-blue-50"
                required
              />
            </div>

            {/* Phone (optional) */}
            <div>
              <Label htmlFor="phone">Telefon (valgfri)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+45 12 34 56 78"
              />
            </div>

            {/* Password Field - Display only */}
            <div>
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Kodeord
              </Label>
              <Input
                id="password"
                type="password"
                value="••••••••••••"
                disabled
                className="bg-blue-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Skal du ændre dit kodeord? <Link href="/forgot-password" className="text-primary hover:underline">Klik her</Link>
              </p>
            </div>

            {/* Marketing Consent */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="marketing_consent"
                checked={formData.marketing_consent}
                onChange={(e) => setFormData({ ...formData, marketing_consent: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <Label htmlFor="marketing_consent" className="font-normal cursor-pointer">
                Ja tak til relevante updates
              </Label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={savingProfile}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              {savingProfile ? 'Opdaterer...' : 'Updater profil'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}

