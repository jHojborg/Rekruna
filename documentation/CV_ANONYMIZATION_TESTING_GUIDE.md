# CV Anonymization - Testing Guide

## 🧪 Manual Testing Procedure

### Pre-requisites
- Local development environment running
- Access to test CVs with various data types
- Browser developer tools open

### Test Cases

#### Test 1: Basic Personal Information Removal
**Objective**: Verify CPR, phone, email are removed

**Test CV Content**:
```
John Doe
CPR: 150390-1234
Email: john.doe@email.com
Telefon: +45 12 34 56 78

Senior Developer med 5 års erfaring
```

**Expected Result**:
- Name "John Doe" is visible in results
- CPR/phone/email NOT visible in console logs
- Analysis focuses on "Senior Developer" and "5 års erfaring"

**How to Test**:
1. Upload the test CV
2. Open browser DevTools → Network tab
3. Filter for `/api/analyze/stream` or `/api/analyze`
4. Check console logs for: `🔒 Anonymized CV for John Doe`
5. Verify request payload doesn't contain sensitive data

---

#### Test 2: Bias Factor Removal
**Objective**: Verify age, gender, marital status are removed

**Test CV Content**:
```
Maria Hansen
Født: 15-03-1990 (34 år)
Civilstand: Gift, 2 børn
Køn: Kvinde

Hun har arbejdet som projektleder i 8 år.
Hendes erfaring omfatter teamledelse og strategisk planlægning.
```

**Expected Result**:
- Name "Maria Hansen" visible
- Age, marital status, children info removed
- Gender pronouns replaced with "vedkommende"
- Professional experience preserved

**How to Verify**:
1. Check analysis results mention "projektleder" and "8 år"
2. Verify no mention of age or family status
3. Confirm pronouns are gender-neutral in cached text

---

#### Test 3: Address and Location Removal
**Objective**: Verify addresses and locations are anonymized

**Test CV Content**:
```
Peter Jensen
Hovedgaden 123
2100 København Ø
LinkedIn: linkedin.com/in/peterjensen

Full-stack udvikler
```

**Expected Result**:
- Address and postal code removed
- LinkedIn profile anonymized
- Professional title preserved

---

#### Test 4: Professional Qualifications Preserved
**Objective**: Ensure technical skills and experience are NOT removed

**Test CV Content**:
```
Anders Andersen
Email: anders@email.com

KOMPETENCER
- React, TypeScript, Node.js
- AWS, Azure, Docker
- Agile, Scrum, TDD

ERFARING
Senior Developer - TDC Net (2018-2024)
- Ledede team på 5 udviklere
- Implementerede microservices
- 6 års erfaring med frontend udvikling
```

**Expected Result**:
- All technical skills preserved: React, TypeScript, Node.js, AWS, Azure, Docker
- Work experience preserved: "Senior Developer", "TDC Net", years
- Management experience preserved: "Ledede team på 5 udviklere"
- Email removed

**How to Verify**:
1. Check analysis scores for mentioned technologies
2. Verify "strengths" section references skills
3. Confirm overall score reflects experience level

---

#### Test 5: Real-World Complex CV
**Objective**: Test with realistic, complex CV

**Test CV** (create a realistic Danish CV with):
- Full contact information
- Photo placeholder
- Age and birth date
- Multiple jobs with dates
- Education with institutions
- Technical skills
- Languages
- Hobbies
- References

**Expected Result**:
- Name visible in UI
- All contact info removed
- Professional history preserved
- Skills and education preserved
- Analysis quality maintained

---

## 🔍 Automated Testing

### Run Unit Tests
```bash
npm test lib/__tests__/anonymization.test.ts
```

**Expected Output**:
```
✓ should remove CPR numbers
✓ should remove phone numbers in various formats
✓ should remove email addresses
✓ should remove addresses and postal codes
✓ should remove age and date of birth
✓ should replace gender pronouns
✓ should remove social media profiles
✓ should preserve candidate name
✓ should preserve professional qualifications
✓ should handle real-world CV example
```

### Integration Test Checklist

- [ ] Streaming endpoint anonymizes correctly
- [ ] Non-streaming endpoint anonymizes correctly
- [ ] Cache stores anonymized text only
- [ ] Resume generation uses anonymized text
- [ ] Compare mode works with anonymized data
- [ ] PDF reports show candidate names correctly

---

## 📊 Monitoring in Production

### Console Log Indicators

Look for these log entries:
```
🔒 Anonymized CV for John Doe: 4532 → 4123 chars
```

This indicates:
- ✅ Anonymization is active
- ✅ Text was reduced (personal data removed)
- ✅ Candidate name preserved

### Red Flags

**WARNING Signs**:
- No `🔒` logs appearing
- Text length unchanged (e.g., 4532 → 4532)
- Sensitive data in cache tables

**Action**:
1. Check `lib/anonymization.ts` is imported
2. Verify function is called before `extractJobRelevantInfo`
3. Clear caches: `DELETE FROM cv_text_cache; DELETE FROM analysis_cache;`

---

## 🔐 GDPR Compliance Verification

### Manual Audit Procedure

1. **Database Check**:
```sql
-- Check cv_text_cache for sensitive data
SELECT 
  text_hash,
  LEFT(cv_text, 200) as preview,
  candidate_name
FROM cv_text_cache
WHERE created_at > NOW() - INTERVAL '1 hour'
LIMIT 10;
```

**Verify**:
- No email addresses in `cv_text`
- No phone numbers in `cv_text`
- No CPR numbers in `cv_text`
- `candidate_name` column may contain names (acceptable)

2. **OpenAI Request Inspection**:
   - Use browser DevTools Network tab
   - Check payload sent to OpenAI
   - Verify no raw personal data in request

3. **Cache Validation**:
```typescript
import { detectSensitiveInfo } from '@/lib/anonymization'

// In browser console after analysis
const cached = await fetch('/api/cache/check?hash=...').then(r => r.json())
const sensitive = detectSensitiveInfo(cached.cv_text)
console.log(sensitive) 
// Should show all false
```

---

## 🐛 Common Issues and Solutions

### Issue: Analysis quality degraded after anonymization

**Symptoms**:
- Lower overall scores
- Missing technical skills in analysis
- "Concerns" mention lack of information

**Diagnosis**:
1. Check if regex patterns are too aggressive
2. Verify professional terms aren't being removed
3. Review console log character reduction

**Solution**:
- Adjust regex patterns in `lib/anonymization.ts`
- Test with specific CV causing issues
- Add exception patterns for domain-specific terms

### Issue: Personal data still visible in UI

**Symptoms**:
- Email/phone visible in PDF reports
- Addresses shown in analysis results

**Diagnosis**:
1. Check if data is in `candidateName` variable
2. Verify anonymization runs BEFORE analysis
3. Check if caching is bypassing anonymization

**Solution**:
- Clear all caches
- Verify call order in route handlers
- Check if old cached data is being used

### Issue: Candidate names showing as [PERSON]

**Symptoms**:
- UI shows "[PERSON]" instead of real name
- PDF reports have "[PERSON]" in candidate cards

**Diagnosis**:
- Anonymization running on candidate name itself
- Name extraction happening after anonymization

**Solution**:
- Ensure `candidateName` extracted BEFORE anonymization
- Pass `candidateName` to anonymization function
- Verify anonymization doesn't target the preserved name

---

## ✅ Acceptance Criteria

Before considering anonymization complete:

- [x] All personal identifiers removed from OpenAI requests
- [x] Bias factors eliminated from analysis input
- [x] Professional qualifications fully preserved
- [x] Analysis quality maintained (compared to non-anonymized baseline)
- [x] Candidate names visible in UI and reports
- [x] No performance degradation (< 10ms overhead per CV)
- [x] Console logs show anonymization activity
- [x] Unit tests pass 100%
- [x] Integration tests pass
- [x] Manual testing completed across all test cases
- [x] GDPR compliance verified
- [x] Documentation complete

---

## 📞 Support

If you encounter issues during testing:

1. Check console logs for `🔒` emoji and error messages
2. Review `documentation/CV_ANONYMIZATION_SYSTEM.md`
3. Run unit tests to verify function correctness
4. Check database for cached data contamination

**Emergency Rollback**:
If anonymization causes critical issues:
1. Comment out anonymization calls in both route files
2. Clear caches
3. Deploy hotfix
4. Investigate and fix before re-enabling

