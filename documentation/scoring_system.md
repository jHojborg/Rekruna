# Scoring System & Display Requirements

## Scoring Scale (0-10 Numeric Rating)

The system uses a standardized 10-point scale for evaluating candidates against each requirement:

- **10 - Strategisk / Ledende Niveau:** Experience significantly exceeds requirements
- **8-9 - Dyb Erfaring / Ekspertniveau:** Deep and central experience
- **6-7 - Solid & Selvstændig Erfaring:** Good match, independent experience
- **4-5 - Praktisk Grundlæggende Erfaring:** Practical application, meets minimum
- **2-3 - Begrænset/Teoretisk Erfaring:** Mentioned, but without concrete application
- **0 - Nul Dokumentation:** Absolutely no evidence in CV

## Display Hierarchy

### 1. Job Level View (Dashboard)
- **Job Title/Description Name**
- **Date of Analysis**
- **Number of Candidates Analyzed**
- **Top Candidate Name & Score**
- **Expandable to full candidate list**

### 2. Applicant Level View (Detailed Results)

#### Per Candidate Display:
```
Kandidat: [Full Name]

• Overall Rating: [X.X]

• Vurdering pr. krav:
    • Krav 1 [Requirement Title]: [Score]
        • Begrundelse: [Detailed reasoning with specific examples from CV]
    
    • Krav 2 [Requirement Title]: [Score]
        • Begrundelse: [Detailed reasoning with specific examples from CV]
    
    • Krav 3 [Requirement Title]: [Score]
        • Begrundelse: [Detailed reasoning with specific examples from CV]
```

## Visual Design Requirements

### Typography Hierarchy
- **Candidate Name**: Bold, Large (H2)
- **Overall Rating**: Bold, Prominent (H3)
- **Section Headers**: Medium weight (H4)
- **Requirement Titles**: Regular weight with score emphasized
- **Reasoning Text**: Regular body text, justified

### Color Coding for Scores
- **9-10**: Deep green (#10B981) - Excellent match
- **7-8**: Light green (#34D399) - Good match
- **5-6**: Yellow (#F59E0B) - Adequate match
- **3-4**: Orange (#FB923C) - Below expectations
- **0-2**: Red (#EF4444) - Poor match

### Layout Structure
- Card-based design for each candidate
- Collapsible sections for detailed reasoning
- Clear visual separation between requirements
- Consistent indentation for hierarchy
- Link/chain icons to indicate related evidence across requirements

## Data Storage Requirements

### Analysis Session Table
- `id`: UUID
- `user_id`: Reference to auth.users
- `job_title`: String
- `job_description_url`: Storage reference
- `requirements`: JSONB (array of selected requirements)
- `created_at`: Timestamp
- `completed_at`: Timestamp
- `status`: Enum (processing, completed, failed)
- `candidate_count`: Integer

### Candidate Results Table
- `id`: UUID
- `analysis_id`: Reference to analysis session
- `candidate_name`: String
- `cv_url`: Storage reference
- `overall_score`: Decimal (0-10)
- `requirement_scores`: JSONB
  ```json
  [
    {
      "requirement_id": "1",
      "title": "Dokumenteret Ledelseserfaring",
      "score": 10,
      "reasoning": "Har ledet marketingteams på op til 15 medarbejdere..."
    }
  ]
  ```
- `created_at`: Timestamp

## PDF Report Format

The downloadable PDF should maintain the same visual hierarchy with:
- Company branding header
- Analysis metadata (date, job title, analyst)
- Candidate results in descending score order
- Professional typography and spacing
- Page breaks between candidates for clarity