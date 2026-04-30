import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import Papa from 'papaparse';
import { validateCsvData, generateCsvContent, CALDER_INDUSTRIES } from './validation';

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState(null);
  const [fileName, setFileName] = useState(null);

  // Calder Industry mode — ON by default
  const [calderMode, setCalderMode] = useState(true);
  const [showCalderWarning, setShowCalderWarning] = useState(false);

  const fileInputRef = useRef(null);

  const handleCalderToggle = () => {
    if (calderMode) {
      // User is trying to turn it OFF — show warning first
      setShowCalderWarning(true);
    } else {
      // Turning back ON — no warning needed
      setCalderMode(true);
      setShowCalderWarning(false);
    }
  };

  const confirmDisableCalder = () => {
    setCalderMode(false);
    setShowCalderWarning(false);
    // Re-run validation if a file is already loaded
    if (csvData && csvHeaders) {
      const result = validateCsvData(csvData, csvHeaders, false);
      setValidationResult(result);
    }
  };

  const cancelDisableCalder = () => {
    setShowCalderWarning(false);
  };

  const handleFileSelect = (file) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Strip UTF-8 BOM (\uFEFF) if present — Excel-exported CSVs often include it
        const csv = e.target.result.replace(/^\uFEFF/, '');
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data.length === 0) {
              alert('CSV is empty');
              setIsProcessing(false);
              return;
            }

            const headers = results.meta.fields || Object.keys(results.data[0] || {});
            const data = results.data;

            setCsvHeaders(headers);
            setCsvData(data);

            const result = validateCsvData(data, headers, calderMode);
            setValidationResult(result);
            setIsProcessing(false);
          },
          error: (error) => {
            alert(`Error parsing CSV: ${error.message}`);
            setIsProcessing(false);
          },
        });
      } catch (error) {
        alert(`Error: ${error.message}`);
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDownload = () => {
    if (!validationResult || !csvData || !csvHeaders) return;

    const csvContent = generateCsvContent(csvData, csvHeaders, validationResult);
    const fileNameWithoutExt = fileName.replace('.csv', '');
    const validatedFileName = `${fileNameWithoutExt}-validated.csv`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', validatedFileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      padding: '32px',
      background: 'linear-gradient(to bottom right, #f0f9ff, #e0e7ff)',
    },
    maxWidth: {
      maxWidth: '56rem',
      margin: '0 auto',
    },
    header: {
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '24px',
      flexWrap: 'wrap',
    },
    headerText: {},
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#4b5563',
    },
    // ── Calder Industry toggle panel ──
    calderPanel: {
      background: calderMode ? '#eff6ff' : '#f9fafb',
      border: `1.5px solid ${calderMode ? '#3b82f6' : '#d1d5db'}`,
      borderRadius: '10px',
      padding: '14px 18px',
      minWidth: '220px',
      maxWidth: '280px',
      flexShrink: 0,
    },
    calderPanelTitle: {
      fontWeight: '700',
      fontSize: '13px',
      color: '#1e3a5f',
      marginBottom: '6px',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
    },
    calderToggleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    toggleTrack: {
      position: 'relative',
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      background: calderMode ? '#2563eb' : '#d1d5db',
      cursor: 'pointer',
      transition: 'background 0.2s',
      flexShrink: 0,
      border: 'none',
      outline: 'none',
    },
    toggleThumb: {
      position: 'absolute',
      top: '3px',
      left: calderMode ? '23px' : '3px',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      background: 'white',
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    },
    calderLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: calderMode ? '#1d4ed8' : '#6b7280',
    },
    calderNote: {
      marginTop: '8px',
      fontSize: '12px',
      color: '#4b5563',
      lineHeight: '1.5',
    },
    // ── Warning modal overlay ──
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px',
    },
    modal: {
      background: 'white',
      borderRadius: '12px',
      padding: '28px',
      maxWidth: '440px',
      width: '100%',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    },
    modalIcon: {
      width: '40px',
      height: '40px',
      color: '#d97706',
      marginBottom: '12px',
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '10px',
    },
    modalBody: {
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.6',
      marginBottom: '20px',
      background: '#fffbeb',
      border: '1px solid #fcd34d',
      borderRadius: '8px',
      padding: '12px 14px',
    },
    modalButtons: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
    },
    btnCancel: {
      padding: '9px 18px',
      background: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '7px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
    },
    btnConfirm: {
      padding: '9px 18px',
      background: '#dc2626',
      color: 'white',
      border: 'none',
      borderRadius: '7px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '14px',
    },
    // ── Upload card ──
    card: {
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      padding: '32px',
    },
    cardTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '24px',
    },
    dropZone: {
      border: '2px dashed',
      borderColor: isDragging ? '#3b82f6' : '#d1d5db',
      borderRadius: '8px',
      padding: '48px',
      textAlign: 'center',
      transition: 'all 0.3s',
      background: isDragging ? '#eff6ff' : '#f9fafb',
    },
    dropIcon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 16px',
      color: '#9ca3af',
    },
    dropText: {
      fontSize: '18px',
      color: '#374151',
      marginBottom: '8px',
    },
    dropSubtext: {
      color: '#4b5563',
      marginBottom: '16px',
    },
    button: {
      padding: '12px 24px',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background 0.3s',
    },
    resultBox: {
      marginTop: '32px',
      padding: '24px',
      background: 'linear-gradient(to right, #f0fdf4, #f0fef9)',
      borderRadius: '8px',
      border: '1px solid #86efac',
    },
    resultHeader: {
      display: 'flex',
      gap: '16px',
    },
    resultIcon: {
      width: '24px',
      height: '24px',
      color: '#16a34a',
      flexShrink: 0,
      marginTop: '4px',
    },
    resultContent: {
      flex: 1,
    },
    resultTitle: {
      fontWeight: '600',
      color: '#111827',
      marginBottom: '8px',
    },
    resultStats: {
      color: '#374151',
      marginBottom: '16px',
    },
    downloadButton: {
      width: '100%',
      padding: '12px 16px',
      background: '#16a34a',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background 0.3s',
    },
    errorBox: {
      marginTop: '16px',
      padding: '16px',
      background: '#fef3c7',
      borderRadius: '8px',
      border: '1px solid #fcd34d',
      display: 'flex',
      gap: '12px',
    },
    errorIcon: {
      width: '20px',
      height: '20px',
      color: '#d97706',
      flexShrink: 0,
      marginTop: '2px',
    },
    infoGrid: {
      marginTop: '32px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
    },
    infoBox: {
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '24px',
    },
    infoTitle: {
      fontWeight: '600',
      color: '#111827',
      marginBottom: '12px',
    },
    infoList: {
      fontSize: '14px',
      color: '#4b5563',
      lineHeight: '1.6',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>

        {/* ── Header row with title + Calder toggle ── */}
        <div style={styles.header}>
          <div style={styles.headerText}>
            <h1 style={styles.title}>CSV Validator</h1>
            <p style={styles.subtitle}>Free online tool to validate and correct your CSV files</p>
          </div>

          {/* Calder Industry toggle panel */}
          <div style={styles.calderPanel}>
            <div style={styles.calderPanelTitle}>Calder Industry</div>
            <div style={styles.calderToggleRow}>
              <button
                onClick={handleCalderToggle}
                style={styles.toggleTrack}
                aria-label="Toggle Calder Industry validation"
              >
                <div style={styles.toggleThumb} />
              </button>
              <span style={styles.calderLabel}>
                {calderMode ? 'Validation ON' : 'Validation OFF'}
              </span>
            </div>
            <p style={styles.calderNote}>
              {calderMode
                ? 'Calder Industry field will be validated and auto-corrected.'
                : 'Calder Industry field will not be checked.'}
            </p>
          </div>
        </div>

        {/* ── Warning modal ── */}
        {showCalderWarning && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <AlertCircle style={styles.modalIcon} />
              <div style={styles.modalTitle}>Disable Calder Industry Validation?</div>
              <div style={styles.modalBody}>
                Calder Industry field is required for all Seller Prospecting lists. This helps us identify which client launch emails they will be receiving.
              </div>
              <div style={styles.modalButtons}>
                <button style={styles.btnCancel} onClick={cancelDisableCalder}>
                  Keep Enabled
                </button>
                <button style={styles.btnConfirm} onClick={confirmDisableCalder}>
                  Disable Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Upload card ── */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Upload CSV File</h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={styles.dropZone}
          >
            <Upload style={styles.dropIcon} />
            <p style={styles.dropText}>Drag and drop your CSV file here</p>
            <p style={styles.dropSubtext}>or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={styles.button}
              onMouseEnter={(e) => (e.target.style.background = '#1d4ed8')}
              onMouseLeave={(e) => (e.target.style.background = '#2563eb')}
            >
              Select File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>

          {isProcessing && (
            <div style={{ marginTop: '32px', padding: '24px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Loader2 style={{ width: '24px', height: '24px', color: '#2563eb', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#1e40af', fontWeight: '500' }}>Processing your file...</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {validationResult && !isProcessing && (
            <div>
              <div style={styles.resultBox}>
                <div style={styles.resultHeader}>
                  <CheckCircle style={styles.resultIcon} />
                  <div style={styles.resultContent}>
                    <div style={styles.resultTitle}>Validation Complete</div>
                    <p style={styles.resultStats}>
                      {validationResult.totalRows} rows • {validationResult.errorRows} errors
                      {calderMode && ' • Calder Industry validated'}
                    </p>
                    <button
                      onClick={handleDownload}
                      style={styles.downloadButton}
                      onMouseEnter={(e) => (e.target.style.background = '#15803d')}
                      onMouseLeave={(e) => (e.target.style.background = '#16a34a')}
                    >
                      <Download style={{ width: '20px', height: '20px' }} />
                      Download {fileName?.replace('.csv', '-validated.csv')}
                    </button>
                  </div>
                </div>
              </div>

              {validationResult.errorRows > 0 && (
                <div style={styles.errorBox}>
                  <AlertCircle style={styles.errorIcon} />
                  <div>
                    <p style={{ fontWeight: '600', color: '#111827' }}>
                      {validationResult.errorRows} row(s) with errors
                    </p>
                    <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>
                      Check the "Issues" column in the downloaded CSV for details
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Info cards ── */}
        <div style={styles.infoGrid}>
          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>Validation Rules</h3>
            <div style={styles.infoList}>
              <div>✓ Company Name: Inc., LLC, Co., Corp., Ltd. formatting</div>
              <div>✓ Last Name: No suffixes (Jr, Sr, II, III, IV)</div>
              <div>✓ Title: CEO, President, or Owner only</div>
              <div>✓ State: Exactly 2 letters</div>
              <div>✓ Email: Name &amp; domain matching</div>
              {calderMode && (
                <div style={{ color: '#1d4ed8', fontWeight: '500' }}>
                  ✓ Calder Industry: Must match approved list (auto-corrected when close)
                </div>
              )}
            </div>
          </div>

          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>
              {calderMode ? 'Calder Industry Categories' : 'How It Works'}
            </h3>
            <div style={styles.infoList}>
              {calderMode
                ? CALDER_INDUSTRIES.map((ind) => (
                    <div key={ind}>· {ind}</div>
                  ))
                : (
                  <>
                    <div>1. Upload your CSV file</div>
                    <div>2. We validate against all rules</div>
                    <div>3. Download with Issues column</div>
                    <div>4. Fix errors and re-validate</div>
                  </>
                )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
