import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Loader2, Info, Zap, ShieldCheck, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { validateCsvData, generateCsvContent, CALDER_INDUSTRIES } from './validation';

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState(null);
  const [fileName, setFileName] = useState(null);

  // Modes: 'calder', 'standard', 'strategic'
  const [mode, setMode] = useState('calder');
  const [showWarning, setShowWarning] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  const fileInputRef = useRef(null);

  const handleModeChange = (newMode) => {
    if (mode === 'calder' && newMode !== 'calder') {
      setPendingMode(newMode);
      setShowWarning(true);
    } else {
      setMode(newMode);
      if (csvData && csvHeaders) {
        const result = validateCsvData(csvData, csvHeaders, newMode);
        setValidationResult(result);
      }
    }
  };

  const confirmModeChange = () => {
    setMode(pendingMode);
    setShowWarning(false);
    if (csvData && csvHeaders) {
      const result = validateCsvData(csvData, csvHeaders, pendingMode);
      setValidationResult(result);
    }
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
            setCsvHeaders(headers);
            setCsvData(results.data);
            const result = validateCsvData(results.data, headers, mode);
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

  const handleDownload = () => {
    if (!validationResult || !csvData || !csvHeaders) return;
    const csvContent = generateCsvContent(csvData, csvHeaders, validationResult);
    const validatedFileName = `${fileName.replace('.csv', '')}-validated.csv`;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', validatedFileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const styles = {
    container: { minHeight: '100vh', padding: '32px', background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', fontFamily: 'system-ui, -apple-system, sans-serif' },
    maxWidth: { maxWidth: '64rem', margin: '0 auto' },
    header: { marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' },
    title: { fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' },
    subtitle: { color: '#64748b', marginTop: '4px' },
    
    // Mode Selector
    modeSelector: { display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', gap: '4px' },
    modeBtn: (active) => ({
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: active ? 'white' : 'transparent',
      color: active ? '#0f172a' : '#64748b',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    }),

    // Warning Modal
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' },
    modal: { background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
    modalIcon: { width: '48px', height: '48px', color: '#f59e0b', marginBottom: '16px' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' },
    modalBody: { fontSize: '15px', color: '#475569', lineHeight: '1.6', marginBottom: '24px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px' },
    modalButtons: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
    btnCancel: { padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
    btnConfirm: { padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },

    // Main Card
    card: { background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '40px', border: '1px solid #e2e8f0' },
    dropZone: { border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '64px', textAlign: 'center', transition: 'all 0.2s', background: isDragging ? '#f1f5f9' : '#f8fafc', cursor: 'pointer' },
    
    // Results
    resultBox: { marginTop: '32px', padding: '24px', borderRadius: '12px', border: '1px solid #bbf7d0', background: '#f0fdf4' },
    downloadBtn: { width: '100%', marginTop: '16px', padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontSize: '16px' },
    
    // Info Section
    infoGrid: { marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' },
    infoBox: { background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>CSV Validator</h1>
            <p style={styles.subtitle}>Professional data cleaning & validation</p>
          </div>
          
          <div style={styles.modeSelector}>
            <button onClick={() => handleModeChange('calder')} style={styles.modeBtn(mode === 'calder')}>
              <ShieldCheck size={18} /> Calder
            </button>
            <button onClick={() => handleModeChange('standard')} style={styles.modeBtn(mode === 'standard')}>
              <FileText size={18} /> Standard
            </button>
            <button onClick={() => handleModeChange('strategic')} style={styles.modeBtn(mode === 'strategic')}>
              <Zap size={18} /> Strategic
            </button>
          </div>
        </header>

        {showWarning && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <AlertCircle style={styles.modalIcon} />
              <div style={styles.modalTitle}>Switching from Calder Mode?</div>
              <div style={styles.modalBody}>
                Calder Industry field is required for all Seller Prospecting lists. This helps us identify which client launch emails they will be receiving.
              </div>
              <div style={styles.modalButtons}>
                <button style={styles.btnCancel} onClick={() => setShowWarning(false)}>Keep Calder</button>
                <button style={styles.btnConfirm} onClick={confirmModeChange}>Switch Anyway</button>
              </div>
            </div>
          </div>
        )}

        <div style={styles.card}>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            style={styles.dropZone}
          >
            <Upload style={{ width: '48px', height: '48px', color: '#94a3b8', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#334155' }}>
              {fileName ? fileName : 'Drop your CSV here or click to browse'}
            </p>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={(e) => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
          </div>

          {isProcessing && (
            <div style={{ marginTop: '24px', textAlign: 'center', color: '#6366f1' }}>
              <Loader2 className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <p>Cleaning your data...</p>
            </div>
          )}

          {validationResult && !isProcessing && (
            <div style={styles.resultBox}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <CheckCircle style={{ color: '#10b981' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontWeight: '700', color: '#064e3b' }}>Processing Complete</h3>
                  <p style={{ color: '#065f46', marginTop: '4px' }}>
                    {validationResult.totalRows} rows processed • {validationResult.errorRows} issues flagged
                    {mode === 'strategic' && ' • Auto-corrections applied'}
                  </p>
                  <button onClick={handleDownload} style={styles.downloadBtn}>
                    <Download size={20} /> Download Cleaned CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {validationResult?.missingColumns?.length > 0 && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', gap: '12px' }}>
              <AlertCircle style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: '700', color: '#991b1b' }}>Missing Columns</p>
                <p style={{ fontSize: '14px', color: '#b91c1c' }}>{validationResult.missingColumns.join(', ')}</p>
              </div>
            </div>
          )}
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoBox}>
            <h3 style={{ fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="#6366f1" /> {mode === 'strategic' ? 'Strategic Auto-Fixes' : 'Validation Rules'}
            </h3>
            <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.8' }}>
              {mode === 'strategic' ? (
                <>
                  <div>• <b>Company:</b> Auto-formats LLC/Corp, strips DBAs &amp; parentheses</div>
                  <div>• <b>Titles:</b> Abbreviates CEO, CTO, GM, VP, etc.</div>
                  <div>• <b>Names:</b> Strips Jr/Sr/II, fixes ALL CAPS, trims spaces</div>
                  <div>• <b>State:</b> Auto-capitalizes 2-letter codes</div>
                </>
              ) : (
                <>
                  <div>• <b>Company:</b> Flags Inc/LLC/Corp formatting &amp; DBAs</div>
                  <div>• <b>Names:</b> Flags capitalization &amp; Mc-prefix checkpoints</div>
                  <div>• <b>Titles:</b> CEO, President, or Owner only</div>
                  <div>• <b>Email:</b> Flags generic prefixes &amp; name mismatches</div>
                </>
              )}
            </div>
          </div>
          
          <div style={styles.infoBox}>
            <h3 style={{ fontWeight: '700', marginBottom: '12px' }}>Mode Description</h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
              {mode === 'calder' && "Default mode. Requires 'Calder Industry' field and flags all formatting issues for manual review."}
              {mode === 'standard' && "Same as Calder mode but does not require the Industry field. Best for general lists."}
              {mode === 'strategic' && "Aggressive cleaning mode. Automatically fixes formatting, casing, and titles to save manual cleanup time."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
