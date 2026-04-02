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

  if (/\bCo\b/i.test(val) && !/,\s*Co\./.test(val)) {
    if (!/\bCo\./.test(val)) {
      errors.push('Must use "Co." (with period)');
    }
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

export function validateEmail(email, firstName, lastName, websiteDomain) {
  if (!email) return null;
  const emailLower = String(email).trim().toLowerCase();
  const errors = [];

  // Basic email format validation
  if (!emailLower.includes('@') || !emailLower.includes('.')) {
    return 'Invalid email format';
  }

  const [localPart, domain] = emailLower.split('@');
  if (!localPart || !domain) {
    return 'Invalid email format';
  }

  const firstNameLower = String(firstName || '').trim().toLowerCase();
  const lastNameLower = String(lastName || '').trim().toLowerCase();
  const firstInitial = firstNameLower.charAt(0);

  // Check for generic email prefixes
  const genericPrefixes = ['info', 'support', 'contact', 'hello', 'noreply', 'admin', 'sales', 'help', 'service', 'team'];
  const isGenericPrefix = genericPrefixes.includes(localPart);
  if (isGenericPrefix) {
    errors.push('Please make sure that there are no options for the contact name to be used here before defaulting to ' + localPart + '@');
  }

  // Remove separators for comparison
  const localPartClean = localPart.replace(/[._-]/g, '');

  // Check if name is valid in email
  const validNamePatterns = [
    // Only last name
    lastNameLower,
    // Only first name
    firstNameLower,
    // Only first initial
    firstInitial,
    // First initial + last name
    firstInitial + lastNameLower,
    // Last name + first initial
    lastNameLower + firstInitial,
    // First name + last name
    firstNameLower + lastNameLower,
    // Last name + first name
    lastNameLower + firstNameLower,
  ];

  const nameIsValid = validNamePatterns.some((pattern) => localPartClean === pattern);

  // Only check name validity if it's not a generic prefix (already flagged above)
  if (!nameIsValid && !isGenericPrefix) {
    errors.push('Email name does not match first/last name');
  }

  // Validate domain
  if (websiteDomain) {
    const websiteDomainLower = String(websiteDomain).trim().toLowerCase();
    const isValidDomain = validateEmailDomain(domain, websiteDomainLower, lastNameLower);
    if (!isValidDomain) {
      errors.push('Email domain and website do not match, please check that these are both correct');
    }
  }

  return errors.length > 0 ? errors.join('; ') : null;
}

function validateEmailDomain(emailDomain, websiteDomain, lastName) {
  // Extract base domain from website (remove www, subdomains, and anything after .com)
  const websiteBaseDomain = extractBaseDomain(websiteDomain);

  // Check if email domain matches company domain (with or without subdomains)
  if (emailDomain === websiteBaseDomain || emailDomain.endsWith('.' + websiteBaseDomain)) {
    return true;
  }

  // Check if it's company name + public email provider
  const publicProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'protonmail.com'];
  const companyNameInEmail = emailDomain.split('.')[0];

  if (publicProviders.includes(emailDomain)) {
    // Allow company name + public provider (e.g., acme@gmail.com)
    return true;
  }

  return false;
}

function extractBaseDomain(domain) {
  // Remove protocol (http://, https://)
  let cleaned = domain.replace(/^https?:\/\//, '');
  
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

  const companyCol = columnMap['companyname'];
  const lastNameCol = columnMap['executivelastname'];
  const firstNameCol = columnMap['executivefirstname'];
  const titleCol = columnMap['executivetitle'];
  const stateCol = columnMap['state'];
  const emailCol = columnMap['email'];
  const websiteCol = columnMap['website'];

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
        websiteCol ? row[websiteCol] : ''
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
        const strVal = String(val);
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
