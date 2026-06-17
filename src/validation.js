// ─── Calder Industry ─────────────────────────────────────────────────────────

export const CALDER_INDUSTRIES = [
  'Construction & Engineering',
  'Field Services',
  'Health & Personal Care',
  'Hospitality Recreation & Travel',
  'Logistics',
  'Materials & Resources',
  'Manufacturing',
  'Pet Products & Services',
  'Professional Services',
  'Real Estate',
  'Restaurants & Bars',
  'Retail & E-Commerce',
  'Software',
  'Wholesale & Distribution',
];

function normaliseIndustry(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9&\- ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function validateCalderIndustry(value) {
  if (!value || String(value).trim() === '') {
    return { corrected: null, error: 'Must have a Calder Industry listed' };
  }
  const raw = String(value).trim();
  const normRaw = normaliseIndustry(raw);
  for (const industry of CALDER_INDUSTRIES) {
    if (normaliseIndustry(industry) === normRaw) {
      if (raw === industry) return { corrected: null, error: null };
      return { corrected: industry, error: null };
    }
  }
  let bestMatch = null;
  let bestDist = Infinity;
  for (const industry of CALDER_INDUSTRIES) {
    const dist = levenshtein(normRaw, normaliseIndustry(industry));
    if (dist < bestDist) { bestDist = dist; bestMatch = industry; }
  }
  const threshold = Math.ceil(Math.max(normRaw.length, normaliseIndustry(bestMatch).length) * 0.4);
  if (bestDist <= threshold) {
    return { corrected: bestMatch, error: null };
  }
  return { corrected: null, error: 'Must have a Calder Industry listed' };
}

// ─── Strategic Mode Helpers ──────────────────────────────────────────────────

function toProperCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export function strategicAutoFix(row, headers, columnMap) {
  const correctedRow = { ...row };
  
  const companyCol = columnMap['companyname'] || columnMap['company'];
  const lastNameCol = columnMap['executivelastname'] || columnMap['lastname'] || columnMap['last name'] || columnMap['contactlastname'];
  const firstNameCol = columnMap['executivefirstname'] || columnMap['firstname'] || columnMap['first name'] || columnMap['contactfirstname'];
  const titleCol = columnMap['executivetitle'] || columnMap['title'];
  const stateCol = columnMap['state'];

  // 1. Company Name Auto-Fixes
  if (companyCol && row[companyCol]) {
    let val = String(row[companyCol]).trim();
    
    // Remove dba and everything after
    const dbaMatch = val.match(/\s+d\.?b\.?a\.?\b.*/i);
    if (dbaMatch) {
      val = val.substring(0, dbaMatch.index).trim();
    }

    // Remove parentheses abbreviations: "Calder Capital (CC)" -> "Calder Capital"
    val = val.replace(/\s*\(.*?\)\s*$/, '').trim();

    // Fix ALL CAPS (if > 4 letters)
    if (val.length > 4 && val === val.toUpperCase() && /[A-Z]/.test(val)) {
      val = toProperCase(val);
    }

    // Auto-format suffixes
    val = val.replace(/\bInc\b(?!.)/i, ', Inc.');
    val = val.replace(/\bIncorporated\b/i, ', Inc.');
    val = val.replace(/\bLLC\b/i, ', LLC');
    val = val.replace(/\bPLLC\b/i, ', PLLC');
    val = val.replace(/\bPLC\b/i, ', PLC');
    val = val.replace(/\bPC\b/i, ', PC');
    val = val.replace(/\b(Co|Company)\b$/i, 'Co.');
    val = val.replace(/\bCorporation\b/i, 'Corp.');
    val = val.replace(/\bCorp\b(?!.)/i, 'Corp.');
    val = val.replace(/\bLtd\b(?!.)/i, ', Ltd.');
    val = val.replace(/\bLimited\b/i, ', Ltd.');

    // Clean up double commas or spaces
    val = val.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
    
    correctedRow[companyCol] = val;
  }

  // 2. Last Name Auto-Fixes
  if (lastNameCol && row[lastNameCol]) {
    let val = String(row[lastNameCol]).trim();
    // Remove suffixes
    const suffixes = ['Jr', 'Sr', 'Jr.', 'Sr.', 'II', 'III', 'IV'];
    for (const s of suffixes) {
      const regex = new RegExp(`\\s+\\b${s}\\b.*$`, 'i');
      val = val.replace(regex, '').trim();
    }
    // Always capitalize (Proper Case)
    if (val.length > 0) val = toProperCase(val);
    correctedRow[lastNameCol] = val;
  }

  // 3. First Name Auto-Fixes
  if (firstNameCol && row[firstNameCol]) {
    let val = String(row[firstNameCol]).trim();
    // Always capitalize (Proper Case)
    if (val.length > 0) val = toProperCase(val);
    correctedRow[firstNameCol] = val;
  }

  // 4. Title Auto-Fixes
  if (titleCol && row[titleCol]) {
    let val = String(row[titleCol]).trim();
    const titleMap = {
      'Chief Executive Officer': 'CEO',
      'Chief Technology Officer': 'CTO',
      'Chief Operating Officer': 'COO',
      'Chief Financial Officer': 'CFO',
      'General Manager': 'GM',
      'Co-Owner': 'Owner',
      'Vice President': 'VP',
    };
    for (const [full, abbr] of Object.entries(titleMap)) {
      if (val.toLowerCase() === full.toLowerCase()) {
        val = abbr;
        break;
      }
    }
    correctedRow[titleCol] = val;
  }

  // 5. State Auto-Fixes
  if (stateCol && row[stateCol]) {
    let val = String(row[stateCol]).trim();
    if (val.length === 2) val = val.toUpperCase();
    correctedRow[stateCol] = val;
  }

  return correctedRow;
}

// ─── Validation Functions ────────────────────────────────────────────────────

export function validateCompanyName(value) {
  if (!value) return null;
  const val = String(value).trim();
  const errors = [];
  const abbreviations = { '\\bSvc\\b': 'Services', '\\bMfg\\b': 'Manufacturing' };
  for (const [abbr, full] of Object.entries(abbreviations)) {
    if (new RegExp(abbr, 'i').test(val)) errors.push(`Abbreviation found: should use "${full}" instead`);
  }
  if (/\bInc\b/i.test(val) || /\bIncorporated\b/i.test(val)) {
    if (!/,\s*Inc\./.test(val)) errors.push('Must use ", Inc." (with comma and period)');
  }
  if (/\bLLC\b/i.test(val) || /\bL\.L\.C\.\b/i.test(val)) {
    if (!/,\s*LLC/.test(val)) errors.push('Must use ", LLC" (with comma)');
  }
  if (/\bPLLC\b/i.test(val) || /\bP\.L\.L\.C\.\b/i.test(val)) {
    if (!/,\s*PLLC/.test(val)) errors.push('Must use ", PLLC" (with comma)');
  }
  if (/\bPLC\b/i.test(val) || /\bP\.L\.C\.\b/i.test(val)) {
    if (!/,\s*PLC/.test(val)) errors.push('Must use ", PLC" (with comma)');
  }
  if (/\bPC\b/i.test(val) || /\bP\.C\.\b/i.test(val)) {
    if (!/,\s*PC/.test(val)) errors.push('Must use ", PC" (with comma)');
  }
  if (/\b(Co|Company)\s*$/i.test(val)) errors.push('Must use "Co." (with period) - not "Co" or "Company"');
  else if (/\bCo\b/i.test(val) && !/,\s*Co\./.test(val) && !/\bCo\./.test(val)) errors.push('Must use "Co." (with period)');
  if (/\b(Corp|Corporation)\b/i.test(val)) {
    if (!/,\s*Corp\./.test(val) && !/\bCorp\./.test(val)) errors.push('Must use "Corp." (with period)');
  }
  if (/\bLtd\b/i.test(val) || /\bLimited\b/i.test(val)) {
    if (!/,\s*Ltd\./.test(val)) errors.push('Must use ", Ltd." (with comma and period)');
  }
  if (/\bd\.?b\.?a\.?\b/i.test(val)) errors.push('Should not contain "dba" or nicknames');
  if (/\(.*\)/.test(val)) errors.push('Should not contain parentheses or nicknames');
  
  // Flag special characters that might break Keap/CRM imports
  // Allowed: Letters, Numbers, Spaces, &, -, ', ., ,
  if (/[^a-zA-Z0-9\s&\-'\.,]/.test(val)) {
    errors.push('Contains special characters that may break CRM import');
  }

  return errors.length > 0 ? errors.join('; ') : null;
}

export function validateFirstName(value) {
  if (!value) return null;
  const val = String(value).trim();
  const errors = [];
  if (val.length > 0 && val[0] !== val[0].toUpperCase()) errors.push('Must start with a capitalized letter');
  
  // Flag special characters in First Name
  // Allowed: Letters, Spaces, -, ', .
  if (/[^a-zA-Z\s\-'\.]/.test(val)) {
    errors.push('Contains special characters that may break CRM import');
  }

  return errors.length > 0 ? errors.join('; ') : null;
}

export function validateLastName(value) {
  if (!value) return null;
  const val = String(value).trim();
  const errors = [];
  if (val.length > 0 && val[0] !== val[0].toUpperCase()) errors.push('Must start with a capitalized letter');
  if (val.length <= 1) errors.push('Must be more than one letter');
  if (val.startsWith('Mc') && val.length > 2 && val[2] !== val[2].toUpperCase()) {
    errors.push('Checkpoint: Names starting with "Mc" usually have the third letter capitalized (e.g., McDonald)');
  }
  const forbiddenSuffixes = ['Jr', 'Sr', 'Jr.', 'Sr.', 'II', 'III', 'IV'];
  for (const suffix of forbiddenSuffixes) {
    if (new RegExp(`\\b${suffix}\\b`).test(val)) errors.push(`Contains forbidden suffix "${suffix}"`);
  }

  // Flag special characters in Last Name
  // Allowed: Letters, Spaces, -, ', .
  if (/[^a-zA-Z\s\-'\.]/.test(val)) {
    errors.push('Contains special characters that may break CRM import');
  }

  return errors.length > 0 ? errors.join('; ') : null;
}

export function validateTitle(value, mode = 'calder') {
  if (!value) return null;
  const val = String(value).trim();
  
  // In Strategic Mode, we don't flag titles as errors
  if (mode === 'strategic') return null;

  const validTitles = ['CEO', 'President', 'Owner'];
  if (!validTitles.includes(val)) {
    return `Must be exactly one of: ${validTitles.join(', ')}`;
  }

  return null;
}

export function validateState(value) {
  if (!value) return null;
  const val = String(value).trim();
  if (val.length !== 2 || !/^[A-Za-z]{2}$/.test(val)) return 'Must be exactly 2 letters';
  return null;
}

export function validateEmail(email, firstName, lastName, websiteDomain, companyName) {
  if (!email) return null;
  const emailLower = String(email).trim().toLowerCase();
  const errors = [];
  const atCount = (emailLower.match(/@/g) || []).length;
  if (atCount !== 1 || !emailLower.includes('.')) return 'Invalid email format';
  const atIndex = emailLower.indexOf('@');
  const localPart = emailLower.substring(0, atIndex);
  const domain = emailLower.substring(atIndex + 1);
  if (!localPart || !domain) return 'Invalid email format';
  const firstNameLower = String(firstName || '').trim().toLowerCase();
  const lastNameLower = String(lastName || '').trim().toLowerCase();
  const firstInitial = firstNameLower.charAt(0);
  const lastNameClean = lastNameLower.replace(/[\s\-']/g, '');
  const lastInitial = lastNameClean.charAt(0);
  const genericPrefixes = ['info', 'support', 'contact', 'hello', 'noreply', 'admin', 'sales', 'help', 'service', 'team', 'office', 'mail', 'jobs', 'careers', 'marketing', 'inquiry', 'queries', 'billing', 'account', 'reception'];
  const localPartBase = localPart.split('+')[0];
  const isGenericPrefix = genericPrefixes.includes(localPartBase);
  if (isGenericPrefix) errors.push('Please make sure that there are no options for the contact name to be used here before defaulting to ' + localPartBase + '@');
  const localPartClean = localPartBase.replace(/[._-]/g, '');
  const validNamePatterns = [lastNameClean, firstNameLower, firstInitial, lastInitial, firstInitial + lastInitial, lastInitial + firstInitial, firstNameLower + lastInitial, lastInitial + firstNameLower, firstInitial + lastNameClean, lastNameClean + firstInitial, firstNameLower + lastNameClean, lastNameClean + firstNameLower];
  const nameIsValid = validNamePatterns.some((pattern) => {
    if (!pattern) return false;
    if (localPartClean === pattern) return true;
    if (localPartClean.startsWith(pattern)) {
      const suffix = localPartClean.substring(pattern.length);
      return suffix.length > 0 && /^\d+$/.test(suffix);
    }
    return false;
  });
  if (!nameIsValid && !isGenericPrefix) errors.push('Email name does not match first/last name');
  if (websiteDomain) {
    const websiteDomainLower = String(websiteDomain).trim().toLowerCase();
    const isValidDomain = validateEmailDomain(domain, websiteDomainLower, companyName);
    if (!isValidDomain) errors.push('Email domain and website do not match, please check that these are both correct');
  }
  return errors.length > 0 ? errors.join('; ') : null;
}

function validateEmailDomain(emailDomain, websiteDomain, companyName) {
  const websiteBaseDomain = extractBaseDomain(websiteDomain);
  const websiteBaseDomainName = websiteBaseDomain.split('.')[0];
  if (emailDomain === websiteBaseDomain || emailDomain.endsWith('.' + websiteBaseDomain)) return true;
  const emailDomainName = emailDomain.split('.')[0];
  const websiteDomainNameOnly = websiteBaseDomainName;
  if (emailDomainName.length > 2 && websiteDomainNameOnly.length > 2) {
    if (websiteDomainNameOnly.includes(emailDomainName) || emailDomainName.includes(websiteDomainNameOnly)) return true;
  }
  const emailDomainStripped = stripGenericSuffixes(emailDomainName);
  const websiteDomainStripped = stripGenericSuffixes(websiteDomainNameOnly);
  if (emailDomainStripped && websiteDomainStripped && emailDomainStripped === websiteDomainStripped) return true;
  const publicProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'protonmail.com'];
  if (publicProviders.includes(emailDomain)) return false;
  return false;
}

function stripGenericSuffixes(domainName) {
  const suffixes = ['group', 'llc', 'company', 'corp', 'inc', 'ltd', 'solutions', 'services', 'consulting', 'partners', 'associates', 'holdings', 'ventures', 'capital'];
  let cleaned = domainName.toLowerCase();
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.substring(0, cleaned.length - suffix.length).trim();
      break;
    }
  }
  return cleaned;
}

function extractBaseDomain(domain) {
  let cleaned = domain.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.split('/')[0];
  const parts = cleaned.split('.');
  if (parts.length >= 2) return parts.slice(-2).join('.');
  return cleaned;
}

// ─── Main CSV Validation ──────────────────────────────────────────────────────

export function validateCsvData(data, headers, mode = 'calder') {
  const columnMap = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/\s+/g, '');
    columnMap[normalized] = header;
  }

  const companyCol = columnMap['companyname'] || columnMap['company'];
  const lastNameCol = columnMap['executivelastname'] || columnMap['lastname'] || columnMap['last name'] || columnMap['contactlastname'];
  const firstNameCol = columnMap['executivefirstname'] || columnMap['firstname'] || columnMap['first name'] || columnMap['contactfirstname'];
  const titleCol = columnMap['executivetitle'] || columnMap['title'];
  const stateCol = columnMap['state'];
  const websiteCol = columnMap['website'];
  const industryCol = columnMap['calderindustry'] || columnMap['industry'];
  
  let emailCol = columnMap['email'] || columnMap['emailaddress'] || columnMap['executiveemail'] || columnMap['contactemail'];
  if (!emailCol) {
    const fallback = Object.keys(columnMap).find(key => key.includes('email'));
    if (fallback) emailCol = columnMap[fallback];
  }

  const errors = [];
  let errorRowCount = 0;
  const corrections = {}; 

  data.forEach((row, rowIndex) => {
    let currentRow = { ...row };
    
    // Strategic Mode Auto-Fixes
    if (mode === 'strategic') {
      currentRow = strategicAutoFix(row, headers, columnMap);
      corrections[rowIndex] = currentRow;
    }

    const rowNum = rowIndex + 2;
    let rowHasError = false;
    const rowErrors = [];

    if (companyCol) {
      const error = validateCompanyName(currentRow[companyCol]);
      if (error) { rowErrors.push(`${companyCol}: ${error}`); rowHasError = true; }
    }
    if (firstNameCol) {
      const error = validateFirstName(currentRow[firstNameCol]);
      if (error) { rowErrors.push(`${firstNameCol}: ${error}`); rowHasError = true; }
    }
    if (lastNameCol) {
      const error = validateLastName(currentRow[lastNameCol]);
      if (error) { rowErrors.push(`${lastNameCol}: ${error}`); rowHasError = true; }
    }
    if (titleCol) {
      const error = validateTitle(currentRow[titleCol], mode);
      if (error) { rowErrors.push(`${titleCol}: ${error}`); rowHasError = true; }
    }
    if (stateCol) {
      const error = validateState(currentRow[stateCol]);
      if (error) { rowErrors.push(`${stateCol}: ${error}`); rowHasError = true; }
    }
    if (emailCol) {
      const error = validateEmail(currentRow[emailCol], currentRow[firstNameCol], currentRow[lastNameCol], currentRow[websiteCol], currentRow[companyCol]);
      if (error) { rowErrors.push(`${emailCol}: ${error}`); rowHasError = true; }
    }
    if (mode === 'calder') {
      const industryValue = industryCol ? currentRow[industryCol] : '';
      const { corrected, error } = validateCalderIndustry(industryValue);
      if (error) { rowErrors.push(`Calder Industry: ${error}`); rowHasError = true; }
      else if (corrected) {
        if (!corrections[rowIndex]) corrections[rowIndex] = {};
        corrections[rowIndex][industryCol || 'Calder Industry'] = corrected;
      }
    }

    if (rowHasError) {
      errors.push({ row: rowNum, message: rowErrors.join('; ') });
      errorRowCount++;
    }
  });

  const missingColumns = [];
  if (!firstNameCol) missingColumns.push('First Name');
  if (!lastNameCol) missingColumns.push('Last Name');
  if (!emailCol) missingColumns.push('Email');
  if (!stateCol) missingColumns.push('State');
  if (mode === 'calder' && !industryCol) missingColumns.push('Calder Industry');

  return { totalRows: data.length, errorRows: errorRowCount, errors, corrections, industryCol, missingColumns };
}

export function generateCsvContent(data, headers, validationResult) {
  const newHeaders = ['Issues', ...headers];
  const errorMap = {};
  validationResult.errors.forEach((err) => { errorMap[err.row] = err.message; });
  const csvRows = [];
  csvRows.push(newHeaders.map((h) => `"${h}"`).join(','));
  data.forEach((row, rowIndex) => {
    const rowNum = rowIndex + 2;
    const issues = errorMap[rowNum] || '';
    const rowCorrections = (validationResult.corrections || {})[rowIndex] || {};
    const values = [issues, ...headers.map((h) => {
      const corrected = rowCorrections[h];
      return corrected !== undefined ? corrected : (row[h] || '');
    })];
    const csvRow = values.map((val) => {
      const strVal = String(val).replace(/^\uFEFF/, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) return `"${strVal.replace(/"/g, '""')}"`;
      return `"${strVal}"`;
    }).join(',');
    csvRows.push(csvRow);
  });
  return csvRows.join('\n');
}
