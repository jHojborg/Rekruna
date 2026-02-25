'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react'

// =====================================================
// ADMIN: PENDING EVENT SIGNUPS PAGE
// Administrer og godkend EVENT signup anmodninger
// =====================================================

interface PendingSignup {
  id: string
  company_name: string
  contact_name: string
  phone: string
  email: string
  campaign_source: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
  notes: string | null
}

export default function AdminPendingSignupsPage() {
  
  // =====================================================
  // STATE
  // =====================================================
  
  const [signups, setSignups] = useState<PendingSignup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [statistics, setStatistics] = useState({ pending: 0, approved: 0, rejected: 0 })
  
  // =====================================================
  // FETCH DATA
  // =====================================================
  
  const fetchSignups = async () => {
    setIsLoading(true)
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Du skal være logget ind som admin')
        return
      }
      
      // Fetch pending signups
      const response = await fetch(`/api/admin/pending-signups?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const result = await response.json()
      
      if (!result.success) {
        toast.error(result.error || 'Kunne ikke hente signups')
        return
      }
      
      setSignups(result.data || [])
      setStatistics(result.statistics || { pending: 0, approved: 0, rejected: 0 })
      
    } catch (error) {
      console.error('Error fetching signups:', error)
      toast.error('Der opstod en fejl')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load on mount and when filter changes
  useEffect(() => {
    fetchSignups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])
  
  // =====================================================
  // APPROVE SIGNUP
  // =====================================================
  
  const handleApprove = async (signupId: string) => {
    setProcessingId(signupId)
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Du skal være logget ind som admin')
        return
      }
      
      // Approve signup
      const response = await fetch('/api/admin/approve-event-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          pendingId: signupId
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        toast.error(result.error || 'Kunne ikke godkende signup')
        return
      }
      
      toast.success(`✅ ${result.message}`)
      
      // Refresh list
      fetchSignups()
      
    } catch (error) {
      console.error('Error approving signup:', error)
      toast.error('Der opstod en fejl')
    } finally {
      setProcessingId(null)
    }
  }
  
  // =====================================================
  // REJECT SIGNUP
  // =====================================================
  
  const handleReject = async (signupId: string) => {
    if (!confirm('Er du sikker på at du vil afvise denne signup?')) {
      return
    }
    
    setProcessingId(signupId)
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Du skal være logget ind som admin')
        return
      }
      
      // Reject signup
      const response = await fetch(`/api/admin/approve-event-signup?id=${signupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const result = await response.json()
      
      if (!result.success) {
        toast.error(result.error || 'Kunne ikke afvise signup')
        return
      }
      
      toast.success('Signup afvist')
      
      // Refresh list
      fetchSignups()
      
    } catch (error) {
      console.error('Error rejecting signup:', error)
      toast.error('Der opstod en fejl')
    } finally {
      setProcessingId(null)
    }
  }
  
  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-brand-base py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            EVENT Signup Administration
          </h1>
          <p className="text-gray-600">
            Administrer og godkend demo anmodninger
          </p>
        </div>
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-all ${filter === 'pending' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Afventer godkendelse</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${filter === 'approved' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('approved')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Godkendte</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all ${filter === 'rejected' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Afviste</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Refresh Button */}
        <div className="mb-4 flex justify-end">
          <Button 
            variant="outline" 
            onClick={fetchSignups}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Opdater
          </Button>
        </div>
        
        {/* Signups List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'pending' && 'Afventer godkendelse'}
              {filter === 'approved' && 'Godkendte signups'}
              {filter === 'rejected' && 'Afviste signups'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : signups.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                Ingen signups fundet
              </div>
            ) : (
              <div className="space-y-4">
                {signups.map((signup) => (
                  <div 
                    key={signup.id} 
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {signup.company_name}
                          </h3>
                          <Badge variant={
                            signup.status === 'pending' ? 'default' :
                            signup.status === 'approved' ? 'secondary' : 'destructive'
                          }>
                            {signup.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <p><strong>Kontakt:</strong> {signup.contact_name}</p>
                          <p><strong>Email:</strong> {signup.email}</p>
                          <p><strong>Telefon:</strong> {signup.phone}</p>
                          <p><strong>Oprettet:</strong> {new Date(signup.created_at).toLocaleDateString('da-DK')}</p>
                          {signup.campaign_source && (
                            <p><strong>Kampagne:</strong> {signup.campaign_source}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions (only for pending) */}
                      {signup.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(signup.id)}
                            disabled={processingId === signup.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === signup.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Godkend
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(signup.id)}
                            disabled={processingId === signup.id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Afvis
                          </Button>
                        </div>
                      )}
                      
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
    </main>
  )
}

