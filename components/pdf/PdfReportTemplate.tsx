import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Types matching your existing results structure
interface ResultItem {
  name: string
  overall: number
  scores: Record<string, number>
  strengths: string[]
  concerns: string[]
}

interface PdfReportTemplateProps {
  results: ResultItem[]
}

// Styles based on your exact design specifications
const styles = StyleSheet.create({
  // Page and document styles
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
  },
  
  // Header styles - matching your design title
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#000000',
  },
  
  // Candidate card styles - base style (will be overridden with dynamic colors)
  candidateCard: {
    border: '1px solid #000000', // Lighter stroke weight to match original design
    borderRadius: 8, // Smaller rounded corners to match compact design
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  
  // Alternating background colors for candidate cards
  candidateCardColored: {
    backgroundColor: '#f5f5f0', // Light background for odd cards (1st, 3rd, 5th...)
  },
  
  candidateCardWhite: {
    backgroundColor: '#ffffff', // White background for even cards (2nd, 4th, 6th...)
  },
  
  // Card header with name, score, and ranking
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  
  candidateName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  
  scoreText: {
    fontSize: 12,
    color: '#000000',
  },
  
  scoreValue: {
    color: '#ff6f61', // Score color matching your design specs
    fontWeight: 'bold',
  },
  
  rankingBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  
  // Two-column layout for strengths and concerns - matching design specs
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16, // Reduced spacing for compact design
  },
  
  column: {
    flex: 1,
  },
  
  columnTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000000',
  },
  
  listItem: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 3,
    paddingLeft: 0, // Remove extra padding for cleaner bullet alignment
    lineHeight: 1.3,
  },
  
  // Table styles for comparison section - matching your design specs
  tableContainer: {
    marginTop: 30,
  },
  
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000000',
  },
  
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
  },
  
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  
  tableHeaderRow: {
    backgroundColor: '#f5f5f0', // Same background as cards, matching design
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  
  tableColHeader: {
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    textAlign: 'center',
    padding: 8,
    alignItems: 'center', // Vertical alignment to middle
    justifyContent: 'center', // Horizontal centering
  },
  
  tableCol: {
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    textAlign: 'center',
    padding: 8,
    alignItems: 'center', // Vertical alignment to middle
    justifyContent: 'center', // Horizontal centering for most columns
  },
  
  tableColLeft: {
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    textAlign: 'left', // Required property for TypeScript consistency
    padding: 8,
    alignItems: 'center', // Vertical alignment to middle
    justifyContent: 'flex-start', // Left alignment for candidate names
    flexDirection: 'row', // Ensure content flows left-to-right
  },
  
  tableCellHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 1.2,
  },
  
  tableCell: {
    fontSize: 10,
    color: '#000000',
  },
  
  tableCellLeft: {
    fontSize: 10,
    color: '#000000',
  },
  
  tableCellScore: {
    fontSize: 10,
    color: '#ff6f61',
    fontWeight: 'bold',
  },
  
  // Requirement legend styles (below comparison table)
  requirementLegend: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
  },
  
  requirementLegendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  
  requirementLegendItem: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 4,
    lineHeight: 1.4,
  },
})

export function PdfReportTemplate({ results }: PdfReportTemplateProps) {
  // Extract requirement keys for table headers
  const requirementKeys = Object.keys(results[0]?.scores || {})
  
  // Calculate specific column widths based on your design specifications
  const totalRequirementColumns = requirementKeys.length
  const remainingWidthForRequirements = 100 - 8 - 25 - 12 // Total - Column1 - Column2 - Column3
  const requirementColumnWidth = remainingWidthForRequirements / totalRequirementColumns
  
  // Specific column width functions based on your specifications
  const getTableColHeader = (columnType: 'number' | 'candidate' | 'score' | 'requirement') => {
    let width: string
    switch (columnType) {
      case 'number':     // Column 1: Reduce by 50% from equal distribution
        width = '8%'
        break
      case 'candidate':  // Column 2: No changes (keep reasonable width)
        width = '25%'
        break
      case 'score':      // Column 3: Reduce by 25% from equal distribution  
        width = '12%'
        break
      case 'requirement': // Columns 4-6: Distribute evenly
        width = `${requirementColumnWidth}%`
        break
      default:
        width = '15%'
    }
    
    return {
      ...styles.tableColHeader,
      width,
    }
  }
  
  const getTableCol = (columnType: 'number' | 'candidate' | 'score' | 'requirement') => {
    let width: string
    
    switch (columnType) {
      case 'number':
        width = '8%'
        return {
          ...styles.tableCol,
          width,
        }
      case 'candidate':
        width = '25%'
        return {
          ...styles.tableColLeft, // Use left-aligned style for candidate names
          width,
        }
      case 'score':
        width = '12%'
        return {
          ...styles.tableCol,
          width,
        }
      case 'requirement':
        width = `${requirementColumnWidth}%`
        return {
          ...styles.tableCol,
          width,
        }
      default:
        width = '15%'
        return {
          ...styles.tableCol,
          width,
        }
    }
  }
  
  return (
    <Document>
      {/* Page 1: Candidate Cards */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CV-analyse resultat</Text>
        
        {results.map((candidate, index) => {
          // Alternate background colors: 1st card colored, 2nd white, 3rd colored, etc.
          const isEvenIndex = index % 2 === 1 // 0-based index, so index 1 is the 2nd card
          const cardStyle = [
            styles.candidateCard,
            isEvenIndex ? styles.candidateCardWhite : styles.candidateCardColored
          ]
          
          return (
            <View key={index} style={cardStyle}>
              {/* Card Header with Name, Score, and Ranking */}
              <View style={styles.cardHeader}>
              <View>
                <Text style={styles.candidateName}>{candidate.name}</Text>
                <Text style={styles.scoreText}>
                  Score: <Text style={styles.scoreValue}>{candidate.overall} / 10</Text>
                </Text>
              </View>
              <Text style={styles.rankingBadge}>#{index + 1}</Text>
            </View>
            
            {/* Two-column layout for Strengths and Concerns */}
            <View style={styles.twoColumnContainer}>
              <View style={styles.column}>
                <Text style={styles.columnTitle}>Styrker</Text>
                {candidate.strengths.map((strength, i) => (
                  <Text key={i} style={styles.listItem}>
                    • {strength}
                  </Text>
                ))}
              </View>
              
              <View style={styles.column}>
                <Text style={styles.columnTitle}>Opmærksomhedspunkter</Text>
                {candidate.concerns.map((concern, i) => (
                  <Text key={i} style={styles.listItem}>
                    • {concern}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )})}
      </Page>
      
      {/* Page 2: Comparison Table */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.tableTitle}>Kandidat sammenligning</Text>
        
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <View style={getTableColHeader('number')}>
              <Text style={styles.tableCellHeader}>#</Text>
            </View>
            <View style={getTableColHeader('candidate')}>
              <Text style={styles.tableCellHeader}>Kandidat</Text>
            </View>
            <View style={getTableColHeader('score')}>
              <Text style={styles.tableCellHeader}>Score</Text>
            </View>
            {requirementKeys.map((key, index) => (
              <View key={key} style={getTableColHeader('requirement')}>
                <Text style={styles.tableCellHeader}>{String.fromCharCode(65 + index)}</Text>
              </View>
            ))}
          </View>
          
          {/* Table Data Rows */}
          {results.map((candidate, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={getTableCol('number')}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={getTableCol('candidate')}>
                <Text style={styles.tableCellLeft}>{candidate.name}</Text>
              </View>
              <View style={getTableCol('score')}>
                <Text style={styles.tableCellScore}>{candidate.overall} / 10</Text>
              </View>
              {requirementKeys.map((key, reqIndex) => (
                <View key={key} style={getTableCol('requirement')}>
                  <Text style={styles.tableCell}>{candidate.scores[key]}%</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
        
        {/* Requirement Legend (Krav forklaring) */}
        <View style={styles.requirementLegend}>
          <Text style={styles.requirementLegendTitle}>Krav:</Text>
          {requirementKeys.map((key, index) => (
            <Text key={key} style={styles.requirementLegendItem}>
              {String.fromCharCode(65 + index)}) {key}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  )
}
