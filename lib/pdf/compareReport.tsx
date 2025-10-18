/**
 * Generate Combined Analysis Report PDF
 * 
 * Creates a PDF report for multiple analyses combined
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #333',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    width: '40%',
  },
  value: {
    fontSize: 11,
    width: '60%',
  },
  distributionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionLabel: {
    fontSize: 10,
    width: '25%',
  },
  distributionBarContainer: {
    width: '60%',
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  distributionCount: {
    fontSize: 10,
    width: '15%',
    textAlign: 'right',
  },
  candidateCard: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    border: '1px solid #ddd',
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottom: '1px solid #ddd',
    paddingBottom: 5,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  candidateScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  candidateMeta: {
    fontSize: 9,
    color: '#666',
    marginBottom: 5,
  },
  requirement: {
    fontSize: 10,
    marginBottom: 3,
    paddingLeft: 10,
  },
  requirementMet: {
    color: '#4CAF50',
  },
  requirementNotMet: {
    color: '#f44336',
  },
  resume: {
    fontSize: 10,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderLeft: '3px solid #4CAF50',
  },
  resumeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
})

interface ComparisonData {
  totalCandidates: number
  analysisCount: number
  analyses: Array<{ id: string; title: string; date: string }>
  jobTitle: string
  requirements: string[] // Extracted from first candidate's scores in DB
  scoreDistribution: Record<string, number>
  candidates: any[]
}

export function CompareReportDocument({ data }: { data: ComparisonData }) {
  const maxCount = Math.max(...Object.values(data.scoreDistribution))

  return (
    <Document>
      {/* Page 1: Overview */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Samlet Analyse Rapport</Text>
          <Text style={styles.subtitle}>
            {data.jobTitle} - {data.totalCandidates} kandidater fra {data.analysisCount} analyser
          </Text>
        </View>

        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oversigt</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Stillingsbetegnelse:</Text>
            <Text style={styles.value}>{data.jobTitle}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total kandidater:</Text>
            <Text style={styles.value}>{data.totalCandidates}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Antal analyser:</Text>
            <Text style={styles.value}>{data.analysisCount}</Text>
          </View>
        </View>

        {/* Analyses Included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inkluderede Analyser</Text>
          {data.analyses.map((analysis, idx) => (
            <View key={analysis.id} style={styles.row}>
              <Text style={styles.label}>Analyse {idx + 1}:</Text>
              <Text style={styles.value}>
                {analysis.title} ({new Date(analysis.date).toLocaleDateString('da-DK')})
              </Text>
            </View>
          ))}
        </View>

        {/* Score Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Fordeling</Text>
          {Object.entries(data.scoreDistribution).map(([range, count]) => (
            <View key={range} style={styles.distributionBar}>
              <Text style={styles.distributionLabel}>{range}:</Text>
              <View style={styles.distributionBarContainer}>
                <View 
                  style={[
                    styles.distributionBarFill, 
                    { width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.distributionCount}>
                {count} {count === 1 ? 'kandidat' : 'kandidater'}
              </Text>
            </View>
          ))}
        </View>
      </Page>

      {/* Page 2+: All Candidates */}
      {data.candidates.map((candidate, idx) => {
        const isFirstOnPage = idx % 3 === 0
        
        return (
          <Page key={candidate._analysisId + candidate.name + idx} size="A4" style={styles.page} wrap={false}>
            {isFirstOnPage && (
              <View style={styles.header}>
                <Text style={styles.title}>Alle Kandidater (Sorteret efter Score)</Text>
                <Text style={styles.subtitle}>Højeste score først</Text>
              </View>
            )}

            <View style={styles.candidateCard}>
              {/* Header */}
              <View style={styles.candidateHeader}>
                <Text style={styles.candidateName}>
                  #{idx + 1}. {candidate.name}
                </Text>
                <Text style={styles.candidateScore}>
                  {Math.round(candidate.totalScore || candidate.score || 0)}%
                </Text>
              </View>

              {/* Meta info */}
              <Text style={styles.candidateMeta}>
                Fra: {candidate._analysisTitle} • {new Date(candidate._analysisDate).toLocaleDateString('da-DK')}
              </Text>

              {/* Requirements */}
              <View style={{ marginBottom: 8 }}>
                {candidate.requirements?.map((req: any, reqIdx: number) => (
                  <Text
                    key={reqIdx}
                    style={[
                      styles.requirement,
                      req.met ? styles.requirementMet : styles.requirementNotMet,
                    ]}
                  >
                    {req.met ? '✓' : '✗'} {req.requirement}
                  </Text>
                ))}
              </View>

              {/* Resume/Summary */}
              {candidate.resume && (
                <View style={styles.resume}>
                  <Text style={styles.resumeTitle}>Resumé:</Text>
                  <Text>{candidate.resume}</Text>
                </View>
              )}
            </View>
          </Page>
        )
      })}
    </Document>
  )
}

