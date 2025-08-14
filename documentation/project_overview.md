# Recruitment Screening SaaS - Project Overview

## Executive Summary
A micro-SaaS solution that enables companies to efficiently screen and analyze multiple candidates' CVs or LinkedIn profiles against job requirements. The AI-powered tool analyzes job descriptions, extracts key requirements, and provides a prioritized list of candidates with individual ratings and justifications.

## Core Purpose
**Problem Solved**: Manual CV screening is time-consuming and prone to bias. Companies spend significant time reviewing CVs that may not match their requirements.

**Value Provided**: 
- 80% reduction in screening time
- Objective, consistent evaluation of all candidates
- Prioritized candidate list for efficient interview planning
- Elimination of unconscious bias in initial screening

## Target Market
- **Primary**: Small and medium-sized businesses (SMBs) in Denmark
- **Secondary**: HR departments, recruitment agencies, and companies hiring frequently
- **Use Cases**: 
  - Internal recruitment teams screening candidates
  - Small business owners handling their own recruitment
  - External recruiters evaluating candidates for clients

## Key Features (MVP)
1. **Landing Page & Authentication**
   - Professional landing page with value proposition
   - User registration and login system
   - Secure user accounts with email verification
   - Password reset functionality

2. **Job Description Analysis**
   - Upload job description
   - AI extracts up to 7 key requirements
   - User selects 3 most critical requirements
   - Save job descriptions for reuse

3. **CV Processing**
   - Batch upload of 20-50 CV PDFs
   - Text extraction and parsing
   - Support for Danish language content
   - Store CVs securely per user

4. **AI-Powered Analysis**
   - Individual scoring against each requirement
   - Overall candidate rating
   - Brief justification for each score
   - Analysis history per user

5. **Results Presentation**
   - Prioritized candidate list
   - Detailed scoring matrix
   - Downloadable PDF report
   - Save and access previous analyses

6. **User Dashboard**
   - View analysis history
   - Manage saved job descriptions
   - Account settings
   - Usage statistics

## Technical Architecture
- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Node.js (integrated with Next.js API routes)
- **Authentication**: Supabase Auth (email/password only)
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage (for PDFs and reports)
- **Real-time Updates**: Supabase Realtime (for analysis progress)
- **AI Service**: OpenAI Files API + Chat Completions
- **PDF Processing**: Stream directly from Supabase Storage to OpenAI
- **Deployment**: Vercel (unified frontend + backend)

## User Journey
1. **First-time User**
   - Land on homepage → View value proposition
   - Click "Try for Free" or "Get Started"
   - Sign up with email → Verify email
   - Access dashboard

2. **Analysis Flow**
   - From dashboard → Click "New Analysis"
   - Upload job description PDF → Review extracted requirements
   - Select 3 critical requirements → Save selection
   - Upload multiple CV PDFs (drag & drop)
   - View real-time processing progress
   - Review results → Download report
   - Results saved to history

3. **Returning User**
   - Login → Dashboard
   - View previous analyses
   - Reuse saved job descriptions
   - Start new analysis

## Success Metrics
- Time to complete full analysis: < 5 minutes
- Accuracy of requirement extraction: > 90%
- User satisfaction with candidate rankings
- Report clarity and usefulness

## Future Enhancements (Post-MVP)
- LinkedIn profile integration
- Email notifications for completed analyses
- Team collaboration features (share analyses)
- Advanced analytics dashboard
- API access for integration
- Multiple language support beyond Danish
- Subscription tiers with usage limits
- Bulk operations and templates
- Integration with ATS systems
- Chrome extension for LinkedIn scanning