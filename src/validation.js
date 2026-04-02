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

export function validateCsvData(data, headers) {
  const columnMap = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().replace(/\s+/g, '');
    columnMap[normalized] = header;
  }

  const companyCol = columnMap['companyname'];
  const lastNameCol = columnMap['executivelastname'];
  const titleCol = columnMap['executivetitle'];
  const stateCol = columnMap['state'];

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
