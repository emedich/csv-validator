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
    // Only flag if Co/Company is at the very end
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

  return errors.length > 0 ? errors.join('; ') : null;
}

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

export function validateTitle(value) {
  if (!value) return null;
  const val = String(value).trim();
  const validTitles = ['CEO', 'President', 'Owner'];

  if (!validTitles.includes(val)) {
    return `Must be exactly one of: ${validTitles.join(', ')}`;
  }

  return null;
}

export function validateState(value) {
  if (!value) return null;
  const val = String(value).trim();

  if (val.length !== 2 || !/^[A-Za-z]{2}$/.test(val)) {
    return 'Must be exactly 2 letters';
  }

  return null;
}

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
  const genericPrefixes = ['info', 'support', 'contact', 'hello', 'noreply', 'admin', 'sales', 'help', 'service', 'team'];
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
    // Only last name
    lastNameClean,
    // Only first name
    firstNameLower,
    // Only first initial
    firstInitial,
    // Only last initial
    lastInitial,
    // First initial + last initial
    firstInitial + lastInitial,
    // Last initial + first initial
    lastInitial + firstInitial,
    // First name + last initial
    firstNameLower + lastInitial,
    // Last initial + first name
    lastInitial + firstNameLower,
    // First initial + last name
    firstInitial + lastNameClean,
    // Last name + first initial
    lastNameClean + firstInitial,
    // First name + last name
    firstNameLower + lastNameClean,
    // Last name + first name
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
  // Extract base domain from website (remove www, subdomains, and anything after .com)
  const websiteBaseDomain = extractBaseDomain(websiteDomain);
  const websiteBaseDomainName = websiteBaseDomain.split('.')[0]; // e.g., 'company' from 'company.com'

  // Check if email domain matches company domain (with or without subdomains)
  if (emailDomain === websiteBaseDomain || emailDomain.endsWith('.' + websiteBaseDomain)) {
    return true;
  }

  // Check for partial domain match (e.g., 'townegroup.com' email with 'townellc.com' website)
  const emailDomainName = emailDomain.split('.')[0]; // e.g., 'townegroup' from 'townegroup.com'
  const websiteDomainNameOnly = websiteBaseDomainName; // e.g., 'townellc' from 'townellc.com'
  
  if (emailDomainName.length > 2 && websiteDomainNameOnly.length > 2) {
    if (websiteDomainNameOnly.includes(emailDomainName) || emailDomainName.includes(websiteDomainNameOnly)) {
      return true;
    }
  }
  
  // Check for partial domain match after stripping generic suffixes
  // e.g., 'townegroup' and 'townellc' both become 'towne' after stripping 'group' and 'llc'
  const emailDomainStripped = stripGenericSuffixes(emailDomainName);
  const websiteDomainStripped = stripGenericSuffixes(websiteDomainNameOnly);
  
  if (emailDomainStripped && websiteDomainStripped && emailDomainStripped === websiteDomainStripped) {
    return true;
  }

  // Check if it's company name + public email provider
  const publicProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'protonmail.com'];

  if (publicProviders.includes(emailDomain)) {
    // For public email providers, check if local part matches company name or website domain
    // This will be validated in the calling function by checking the local part
    return false; // Will be flagged for verification
  }

  return false;
}

function stripGenericSuffixes(domainName) {
  // List of generic suffixes to remove when comparing domain names
  const suffixes = ['group', 'llc', 'company', 'corp', 'inc', 'ltd', 'solutions', 'services', 'consulting', 'partners', 'associates', 'holdings', 'ventures', 'capital'];
  
  let cleaned = domainName.toLowerCase();
  
  // Remove suffixes from the end
  for (const suffix of suffixes) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.substring(0, cleaned.length - suffix.length).trim();
      break; // Only remove one suffix
    }
  }
  
  return cleaned;
}

function extractBaseDomain(domain) {
  // Remove protocol (http://, https://)
  let cleaned = domain.replace(/^https?:\/\//,  '');
  
  // Remove www and any subdomains, keep only base domain + TLD
  cleaned = cleaned.replace(/^www\./, '');
  
  // Remove trailing slashes and paths
  cleaned = cleaned.split('/')[0];
  
  // Split by dots and get the last two parts (domain + TLD)
  const parts = cleaned.split('.');
  if (parts.length >= 2) {
    // Get last two parts (e.g., 'company.com')
    return parts.slice(-2).join('.');
  }
  
  return cleaned;
}

export function validateCsvData(data, headers) {
  const columnMap = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/\s+/g, '');
    columnMap[normalized] = header;
  }

  // Accept multiple column name variations for each field
  const companyCol   = columnMap['companyname']   || columnMap['company'];
  const lastNameCol  = columnMap['executivelastname']  || columnMap['lastname']  || columnMap['last name'] || columnMap['contactlastname'];
  const firstNameCol = columnMap['executivefirstname'] || columnMap['firstname'] || columnMap['first name'] || columnMap['contactfirstname'];
  const titleCol     = columnMap['executivetitle'] || columnMap['title'];
  const stateCol     = columnMap['state'];
  const emailCol     = columnMap['email'];
  const websiteCol   = columnMap['website'];

  const errors = [];
  let errorRowCount = 0;

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

    if (rowHasError) {
      errors.push({ row: rowNum, message: rowErrors.join('; ') });
      errorRowCount++;
    }
  });

  return {
    totalRows: data.length,
    errorRows: errorRowCount,
    errors,
  };
}

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
    const values = [issues, ...headers.map((h) => row[h] || '')];

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
