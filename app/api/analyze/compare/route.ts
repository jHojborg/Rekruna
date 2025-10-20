/**
 * Compare Multiple Analyses
 * 
 * Combines results from multiple analyses (same job template) 
 * into a single report with all candidates sorted by score
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// Increase timeout for comparison analysis
// NOTE: If using Hobby plan, this will cause timeout errors - upgrade to Pro recommended
export const maxDuration = 60 // 60 seconds (requires Vercel Pro or higher)
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { analysisIds, skipRequirementsCheck } = body

    console.log('📥 Received analysisIds:', analysisIds)
    console.log('📥 skipRequirementsCheck:', skipRequirementsCheck)

    // Validation
    if (!analysisIds || !Array.isArray(analysisIds) || analysisIds.length < 2) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Mindst 2 analyser skal vælges' 
      }, { status: 400 })
    }

    if (analysisIds.length > 5) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Max 5 analyser kan sammenlignes ad gangen' 
      }, { status: 400 })
    }

    console.log(`📊 Comparing ${analysisIds.length} analyses for user ${user.id}`)

    // Fetch all analysis results
    // Note: analysis_results has one row per candidate, so we need to group by analysis_id
    // Note: requirements are stored as keys in the 'scores' JSONB column
    const { data: rawAnalyses, error: fetchError } = await supabaseAdmin
      .from('analysis_results')
      .select('analysis_id, title, created_at, scores')
      .in('analysis_id', analysisIds)
      .eq('user_id', user.id)

    if (fetchError || !rawAnalyses || rawAnalyses.length === 0) {
      console.error('Error fetching analyses:', fetchError)
      console.error('Raw analyses length:', rawAnalyses?.length)
      return NextResponse.json({ 
        ok: false, 
        error: 'Kunne ikke hente analyser' 
      }, { status: 500 })
    }

    console.log(`✅ Fetched ${rawAnalyses.length} rows from analysis_results`)

    // Group by analysis_id (since we have one row per candidate)
    // Extract requirements from first candidate's scores for each analysis
    const analysesMap = new Map()
    rawAnalyses.forEach((a: any) => {
      if (!analysesMap.has(a.analysis_id)) {
        // Extract requirements from scores object (keys are requirement strings)
        const requirements = a.scores ? Object.keys(a.scores) : []
        
        analysesMap.set(a.analysis_id, {
          analysis_id: a.analysis_id,
          title: a.title,
          created_at: a.created_at,
          requirements: requirements // Extract from first candidate in this analysis
        })
      }
    })
    
    const analyses = Array.from(analysesMap.values())

    console.log(`📦 Grouped into ${analyses.length} unique analyses`)
    console.log('Expected analysisIds:', analysisIds)
    console.log('Found analysis_ids:', analyses.map(a => a.analysis_id))

    if (analyses.length !== analysisIds.length) {
      console.error(`❌ Mismatch: Expected ${analysisIds.length} analyses, got ${analyses.length}`)
      return NextResponse.json({ 
        ok: false, 
        error: `Nogle analyser kunne ikke findes. Forventede ${analysisIds.length}, fandt ${analyses.length}` 
      }, { status: 404 })
    }

    // Check if all analyses have same requirements (validation)
    const firstRequirements = JSON.stringify(analyses[0].requirements?.sort() || [])
    const hasSameRequirements = analyses.every(a => 
      JSON.stringify((a.requirements || []).sort()) === firstRequirements
    )

    if (!hasSameRequirements && !skipRequirementsCheck) {
      console.warn('⚠️ Analyses have different requirements')
      // Return warning but allow to continue with user confirmation
      return NextResponse.json({
        ok: true,
        warning: 'different_requirements',
        message: 'Analyserne har forskellige krav. Sammenligning kan være misvisende.',
        analyses: analyses.map(a => ({
          id: a.analysis_id,
          title: a.title,
          requirements: a.requirements
        }))
      })
    }

    if (!hasSameRequirements) {
      console.log('⚠️ User confirmed: proceeding with different requirements')
    }

    // Fetch all candidate results for these analyses from analysis_results table
    const { data: allResults, error: resultsError } = await supabaseAdmin
      .from('analysis_results')
      .select('analysis_id, name, overall, scores, strengths, concerns, created_at')
      .in('analysis_id', analysisIds)
      .eq('user_id', user.id)
      .order('overall', { ascending: false })

    if (resultsError || !allResults) {
      console.error('Error fetching analysis results:', resultsError)
      return NextResponse.json({ 
        ok: false, 
        error: 'Kunne ikke hente analyse resultater' 
      }, { status: 500 })
    }

    console.log(`📋 Fetched ${allResults.length} candidate results`)

    // Combine all results and add context
    const allCandidates: any[] = []
    let totalCandidates = 0

    for (const result of allResults) {
      const analysisInfo = analyses.find(a => a.analysis_id === result.analysis_id)
      
      // Transform scores object to requirements array format for PDF
      const requirements = result.scores ? Object.entries(result.scores).map(([req, score]) => ({
        requirement: req,
        score: score,
        met: (score as number) >= 60 // Consider met if score >= 60%
      })) : []
      
      // Transform to match expected format
      allCandidates.push({
        name: result.name,
        totalScore: result.overall * 10, // Convert 0-10 to 0-100 scale
        score: result.overall * 10,
        overall: result.overall,
        scores: result.scores,
        requirements: requirements, // Add formatted requirements for PDF
        strengths: result.strengths,
        concerns: result.concerns,
        // Add metadata about which analysis this came from
        _analysisId: result.analysis_id,
        _analysisTitle: analysisInfo?.title || 'Ukendt',
        _analysisDate: analysisInfo?.created_at || result.created_at
      })
      
      totalCandidates++
    }

    console.log(`✅ Combined ${totalCandidates} candidates from ${analysisIds.length} analyses`)

    // Sort all candidates by score (highest first)
    allCandidates.sort((a, b) => {
      const scoreA = a.totalScore || a.score || 0
      const scoreB = b.totalScore || b.score || 0
      return scoreB - scoreA
    })

    // Calculate score distribution
    const scoreRanges = {
      '90-100%': 0,
      '80-89%': 0,
      '70-79%': 0,
      '60-69%': 0,
      '<60%': 0
    }

    allCandidates.forEach(candidate => {
      const score = candidate.totalScore || candidate.score || 0
      if (score >= 90) scoreRanges['90-100%']++
      else if (score >= 80) scoreRanges['80-89%']++
      else if (score >= 70) scoreRanges['70-79%']++
      else if (score >= 60) scoreRanges['60-69%']++
      else scoreRanges['<60%']++
    })

    // Prepare response
    const result = {
      ok: true,
      comparison: {
        totalCandidates,
        analysisCount: analysisIds.length,
        analyses: analyses.map(a => ({
          id: a.analysis_id,
          title: a.title,
          date: a.created_at
        })),
        jobTitle: analyses[0].title, // Use first analysis title
        requirements: analyses[0].requirements || [], // Requirements extracted from scores
        scoreDistribution: scoreRanges,
        candidates: allCandidates
      }
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('POST /api/analyze/compare error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Intern server fejl' 
    }, { status: 500 })
  }
}

