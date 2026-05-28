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

/**
 * Normalise a string for fuzzy comparison:
 * lowercase, collapse whitespace, remove punctuation except & and -
 */
function normaliseIndustry(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9&\- ]/g, ' ')  // keep letters, digits, &, -
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple Levenshtein distance between two strings.
 */
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

/**
 * Validate (and auto-correct) a Calder Industry value.
 * Returns: { corrected: string|null, error: string|null }
 *   - corrected: the canonical value if a close match was found (null if already exact)
 *   - error: error message if no match at all
 */
export function validateCalderIndustry(value) {
  if (!value || String(value).trim() === '') {
    return { corrected: null, error: 'Must have a Calder Industry listed' };
  }

  const raw = String(value).trim();
  const normRaw = normaliseIndustry(raw);

  // 1. Exact canonical match (case-insensitive, punctuation-insensitive)
  for (const industry of CALDER_INDUSTRIES) {
    if (normaliseIndustry(industry) === normRaw) {
      // Return corrected only if the original casing/punctuation differs
      if (raw === industry) return { corrected: null, error: null };
      return { corrected: industry, error: null };
    }
  }

  // 2. Fuzzy match — find the closest canonical value
  let bestMatch = null;
  let bestDist = Infinity;
  for (const industry of CALDER_INDUSTRIES) {
    const dist = levenshtein(normRaw, normaliseIndustry(industry));
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = industry;
    }
  }

  // Allow up to 40% of the longer string's length as edit distance
  const threshold = Math.ceil(Math.max(normRaw.length, normaliseIndustry(bestMatch).length) * 0.4);
  if (bestDist <= threshold) {
    return { corrected: bestMatch, error: null };
  }

  // 3. No close match found
  return { corrected: null, error: 'Must have a Calder Industry listed' };
}

// ─── Company Name ─────────────────────────────────────────────────────────────

export function validateCompanyName(value) {
  if (!value) return null;
  const val = String(value).trim();
  const errors = [];

  const abbreviations = {
    '\\bSvc\\b': 'Services',
    '\\bMfg\\b': 'Manufacturing',
  };

  for (const [abbr, full] of Object.entries(abbreviations)) {
    if (new RegExp(abbr, 'i').test(val)) {
      errors.push(`Abbreviation found: should use "${full}" instead`);
    }
  }

  if (/\bInc\b/i.test(val) || /\bIncorporated\b/i.test(val)) {
    if (!/,\s*Inc\./.test(val)) {
      errors.push('Must use ", Inc." (with comma and period)');
    }
  }

  if (/\bLLC\b/i.test(val) || /\bL\.L\.C\.\b/i.test(val)) {
    if (!/,\s*LLC/.test(val)) {
      errors.push('Must use ", LLC" (with comma)');
    }
  }
  // Check for "Co" or "Company" ONLY at the end of company name
  if (/\b(Co|Company)\s*$/i.test(val)) {
    errors.push('Must use "Co." (with period) - not "Co" or "Company"');
  }
  // Separately check for Co with proper formatting (with comma or period)
  else if (/\bCo\b/i.test(val) && !/,\s*Co\./.test(val) && !/\bCo\./.test(val)) {
    errors.push('Must use "Co." (with period)');
  }

  if (/\bCorp\b/i.test(val) && !/,\s*Corp\./.test(val)) {
    if (!/\bCorp\./.test(val)) {
      errors.push('Must use "Corp." (with period)');
    }
  }

  // Check for "Ltd" variations
  if (/\bLtd\b/i.test(val) || /\bLimited\b/i.test(val)) {
    if (!/,\s*Ltd\./.test(val)) {
      errors.push('Must use ", Ltd." (with comma and period)');
    }
  }

  // Check for "dba" (case-insensitive, with or without dots)
  if (/\bd\.?b\.?a\.?\b/i.test(val)) {
    errors.push('Should not contain "dba" or nicknames');
  }

  // Check for parentheses (XXX)
  if (/\(.*\)/.test(val)) {
    errors.push('Should not contain parentheses or nicknames');
  }

  return errors.length > 0 ? errors.join('; ') : null;
}

// ─── Last Name ────────────────────────────────────────────────────────────────

export function validateLastName(value) {
  if (!value) return null;
  const val = String(value).trim();
  const errors = [];

  if (val.length <= 1) {
    errors.push('Must be more than one letter');
  }

  const forbiddenSuffixes = ['Jr', 'Sr', 'Jr.', 'Sr.', 'II', 'III', 'IV'];
  for (const suffix of forbiddenSuffixes) {
    if (new RegExp(`\\b${suffix}\\b`).test(val)) {
      errors.push(`Contains forbidden suffix "${suffix}"`);
    }
  }

  return errors.length > 0 ? errors.join('; ') : null;
}

// ─── Title ────────────────────────────────────────────────────────────────────

export function validateTitle(value) {
  if (!value) return null;
  const val = String(value).trim();
  const validTitles = ['CEO', 'President', 'Owner'];

  if (!validTitles.includes(val)) {
    return `Must be exactly one of: ${validTitles.join(', ')}`;
  }

  return null;
}

// ─── State ────────────────────────────────────────────────────────────────────

export function validateState(value) {
  if (!value) return null;
  const val = String(value).trim();

  if (val.length !== 2 || !/^[A-Za-z]{2}$/.test(val)) {
    return 'Must be exactly 2 letters';
  }

  return null;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export function validateEmail(email, firstName, lastName, websiteDomain, companyName) {
  if (!email) return null;
  const emailLower = String(email).trim().toLowerCase();
  const errors = [];

  // Basic email format validation — must contain exactly one '@' and at least one '.'
  const atCount = (emailLower.match(/@/g) || []).length;
  if (atCount !== 1 || !emailLower.includes('.')) {
    return 'Invalid email format';
  }

  const atIndex = emailLower.indexOf('@');
  const localPart = emailLower.substring(0, atIndex);
  const domain = emailLower.substring(atIndex + 1);
  if (!localPart || !domain) {
    return 'Invalid email format';
  }

  const firstNameLower = String(firstName || '').trim().toLowerCase();
  const lastNameLower = String(lastName || '').trim().toLowerCase();
  const firstInitial = firstNameLower.charAt(0);
  // Strip spaces, hyphens, and apostrophes from last name for comparison
  const lastNameClean = lastNameLower.replace(/[\s\-']/g, '');
  const lastInitial = lastNameClean.charAt(0);

  // Check for generic email prefixes
  const genericPrefixes = [
    'info', 'support', 'contact', 'hello', 'noreply', 'admin', 'sales', 'help', 'service', 'team',
    'office', 'mail', 'jobs', 'careers', 'marketing', 'inquiry', 'queries', 'billing', 'account', 'reception'
  ];
  // Strip the + alias suffix (e.g. "john+work" → "john") before checking generic prefix
  const localPartBase = localPart.split('+')[0];
  const isGenericPrefix = genericPrefixes.includes(localPartBase);
  if (isGenericPrefix) {
    errors.push('Please make sure that there are no options for the contact name to be used here before defaulting to ' + localPartBase + '@');
  }

  // Remove separators and + alias for name comparison
  const localPartClean = localPartBase.replace(/[._-]/g, '');

  // Check if name is valid in email
  const validNamePatterns = [
    lastNameClean,
    firstNameLower,
    firstInitial,
    lastInitial,
    firstInitial + lastInitial,
    lastInitial + firstInitial,
    firstNameLower + lastInitial,
    lastInitial + firstNameLower,
    firstInitial + lastNameClean,
    lastNameClean + firstInitial,
    firstNameLower + lastNameClean,
    lastNameClean + firstNameLower,
  ];

  // Also accept patterns where the local part merely *starts with* a valid name pattern
  // (handles number suffixes like jsmith2 → matches "jsmith")
  const nameIsValid = validNamePatterns.some(
    (pattern) => pattern && (localPartClean === pattern || localPartClean.startsWith(pattern))
  );

  // Only check name validity if it's not a generic prefix (already flagged above)
  if (!nameIsValid && !isGenericPrefix) {
    errors.push('Email name does not match first/last name');
  }

  // Validate domain
  if (websiteDomain) {
    const websiteDomainLower = String(websiteDomain).trim().toLowerCase();
    const isValidDomain = validateEmailDomain(domain, websiteDomainLower, companyName);
    if (!isValidDomain) {
      errors.push('Email domain and website do not match, please check that these are both correct');
    }
  }

  return errors.length > 0 ? errors.join('; ') : null;
}

function validateEmailDomain(emailDomain, websiteDomain, companyName) {
  const websiteBaseDomain = extractBaseDomain(websiteDomain);
  const websiteBaseDomainName = websiteBaseDomain.split('.')[0];

  if (emailDomain === websiteBaseDomain || emailDomain.endsWith('.' + websiteBaseDomain)) {
    return true;
  }

  const emailDomainName = emailDomain.split('.')[0];
  const websiteDomainNameOnly = websiteBaseDomainName;

  if (emailDomainName.length > 2 && websiteDomainNameOnly.length > 2) {
    if (websiteDomainNameOnly.includes(emailDomainName) || emailDomainName.includes(websiteDomainNameOnly)) {
      return true;
    }
  }

  const emailDomainStripped = stripGenericSuffixes(emailDomainName);
  const websiteDomainStripped = stripGenericSuffixes(websiteDomainNameOnly);

  if (emailDomainStripped && websiteDomainStripped && emailDomainStripped === websiteDomainStripped) {
    return true;
  }

  const publicProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'protonmail.com'];
  if (publicProviders.includes(emailDomain)) {
    return false;
  }

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
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return cleaned;
}

// ─── Main CSV Validation ──────────────────────────────────────────────────────

/**
 * @param {object[]} data         - Parsed CSV rows
 * @param {string[]} headers      - CSV column headers
 * @param {boolean}  calderMode   - Whether to validate the Calder Industry field
 */
export function validateCsvData(data, headers, calderMode = true) {
  const columnMap = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/\s+/g, '');
    columnMap[normalized] = header;
  }

  // Accept multiple column name variations for each field
  const companyCol     = columnMap['companyname']   || columnMap['company'];
  const lastNameCol    = columnMap['executivelastname']  || columnMap['lastname']  || columnMap['last name'] || columnMap['contactlastname'];
  const firstNameCol   = columnMap['executivefirstname'] || columnMap['firstname'] || columnMap['first name'] || columnMap['contactfirstname'];
  const titleCol       = columnMap['executivetitle'] || columnMap['title'];
  const stateCol       = columnMap['state'];
  const emailCol       = columnMap['email'] || columnMap['emailaddress'] || columnMap['executiveemail'] || columnMap['contactemail'];
  const websiteCol     = columnMap['website'];
  const industryCol    = columnMap['calderindustry'] || columnMap['industry'];

  const errors = [];
  let errorRowCount = 0;

  // Track auto-corrections to apply to the data
  const corrections = {}; // { rowIndex: { colHeader: correctedValue } }

  data.forEach((row, rowIndex) => {
    const rowNum = rowIndex + 2;
    let rowHasError = false;
    const rowErrors = [];

    if (companyCol) {
      const error = validateCompanyName(row[companyCol]);
      if (error) {
        rowErrors.push(`${companyCol}: ${error}`);
        rowHasError = true;
      }
    }

    if (lastNameCol) {
      const error = validateLastName(row[lastNameCol]);
      if (error) {
        rowErrors.push(`${lastNameCol}: ${error}`);
        rowHasError = true;
      }
    }

    if (titleCol) {
      const error = validateTitle(row[titleCol]);
      if (error) {
        rowErrors.push(`${titleCol}: ${error}`);
        rowHasError = true;
      }
    }

    if (stateCol) {
      const error = validateState(row[stateCol]);
      if (error) {
        rowErrors.push(`${stateCol}: ${error}`);
        rowHasError = true;
      }
    }

    if (emailCol) {
      const error = validateEmail(
        row[emailCol],
        firstNameCol ? row[firstNameCol] : '',
        lastNameCol ? row[lastNameCol] : '',
        websiteCol ? row[websiteCol] : '',
        companyCol ? row[companyCol] : ''
      );
      if (error) {
        rowErrors.push(`${emailCol}: ${error}`);
        rowHasError = true;
      }
    }

    // Calder Industry validation (only when calderMode is enabled)
    if (calderMode) {
      const industryValue = industryCol ? row[industryCol] : '';
      const { corrected, error } = validateCalderIndustry(industryValue);

      if (error) {
        // No match at all — flag as error
        rowErrors.push(`Calder Industry: ${error}`);
        rowHasError = true;
      } else if (corrected) {
        // Close match found — auto-correct silently in the output
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
  if (calderMode && !industryCol) missingColumns.push('Calder Industry');

  return {
    totalRows: data.length,
    errorRows: errorRowCount,
    errors,
    corrections,
    industryCol,
    missingColumns,
  };
}

// ─── CSV Output Generation ────────────────────────────────────────────────────

export function generateCsvContent(data, headers, validationResult) {
  const newHeaders = ['Issues', ...headers];
  const errorMap = {};
  validationResult.errors.forEach((err) => {
    errorMap[err.row] = err.message;
  });

  const csvRows = [];
  csvRows.push(newHeaders.map((h) => `"${h}"`).join(','));

  data.forEach((row, rowIndex) => {
    const rowNum = rowIndex + 2;
    const issues = errorMap[rowNum] || '';

    // Apply any auto-corrections (e.g. Calder Industry fuzzy fix)
    const corrections = validationResult.corrections || {};
    const rowCorrections = corrections[rowIndex] || {};

    const values = [issues, ...headers.map((h) => {
      const corrected = rowCorrections[h];
      return corrected !== undefined ? corrected : (row[h] || '');
    })];

    const csvRow = values
      .map((val) => {
        // Strip BOM and other invisible Unicode control characters from cell values
        const strVal = String(val).replace(/^\uFEFF/, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return `"${strVal}"`;
      })
      .join(',');

    csvRows.push(csvRow);
  });

  return csvRows.join('\n');
}
