import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { validateCsvData, generateCsvContent } from './validation';

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState(null);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);

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

            const result = validateCsvData(data, headers);
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
      marginBottom: '32px',
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#4b5563',
    },
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
    buttonHover: {
      background: '#1d4ed8',
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
        <div style={styles.header}>
          <h1 style={styles.title}>CSV Validator</h1>
          <p style={styles.subtitle}>Free online tool to validate and correct your CSV files</p>
        </div>

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

        <div style={styles.infoGrid}>
          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>Validation Rules</h3>
            <div style={styles.infoList}>
              <div>✓ Company Name: Inc., LLC, Co., Corp., Ltd. formatting</div>
              <div>✓ Last Name: No suffixes (Jr, Sr, II, III, IV)</div>
              <div>✓ Title: CEO, President, or Owner only</div>
              <div>✓ State: Exactly 2 letters</div>
              <div>✓ Email: Name & domain matching</div>
            </div>
          </div>

          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>How It Works</h3>
            <div style={styles.infoList}>
              <div>1. Upload your CSV file</div>
              <div>2. We validate against all rules</div>
              <div>3. Download with Issues column</div>
              <div>4. Fix errors and re-validate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
