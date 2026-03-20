import React, { useState, useEffect } from 'react';
import { 
  Youtube, Sparkles, FileText, Video, Clipboard, Terminal,
  Download, Clock, Trash2, Calendar, User, Eye, CheckCircle2, AlertCircle, Loader2, Copy,
  Github, Linkedin, Mail, Globe, ExternalLink, Share2, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const API_BASE = "http://localhost:5000";

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className="toast-notification"
    >
      <CheckCircle2 size={16} color="var(--success)" />
      <span>{message}</span>
    </motion.div>
  );
};

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('summarize'); 
  const [result, setResult] = useState(null);
  const [shorts, setShorts] = useState([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [numShorts, setNumShorts] = useState(3);
  const [history, setHistory] = useState([]);
  
  const [statusLog, setStatusLog] = useState([]);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('yt_summarizer_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (data) => {
    const newEntry = {
      url,
      title: data.metadata?.title || "Untitled Video",
      date: new Date().toLocaleDateString(),
      id: Date.now()
    };
    const updated = [newEntry, ...history.slice(0, 4)];
    setHistory(updated);
    localStorage.setItem('yt_summarizer_history', JSON.stringify(updated));
  };

  const resetData = () => {
    setResult(null);
    setShorts([]);
    setError('');
    setStatusLog([]);
    setMetadata(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      showToast("URL Pasted from clipboard!");
    } catch (err) {
      console.error("Paste failed", err);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const downloadTranscript = (text, filename = "transcript.txt") => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    showToast("File Downloaded!");
  };

  const addStatus = (msg, type = 'info') => {
    setStatusLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!url) return;
    resetData();
    setLoading(true);

    try {
      addStatus("Connecting to summarization engine...", 'info');
      const pingResp = await fetch(`${API_BASE}/ping`);
      if (!pingResp.ok) throw new Error("Backend offline.");
      addStatus("Connection established.", 'success');

      const response = await fetch(`${API_BASE}/stream_process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, mode, num_shorts: numShorts })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Process failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          let chunk;
          try {
            chunk = JSON.parse(line);
          } catch (parseError) {
            continue;
          }
          
          if (chunk.status === "error") {
             setError(chunk.message);
             addStatus(`Error: ${chunk.message}`, 'error');
             setLoading(false);
             return;
          }

          if (chunk.message) addStatus(`${chunk.message}`);
          
          if (chunk.data) {
             if (chunk.status === "metadata_done") setMetadata(chunk.data);
             if (chunk.status === "complete") {
                if (mode === 'summarize') {
                  setResult(chunk.data);
                  saveToHistory(chunk.data);
                }
                if (mode === 'shorts') setShorts(chunk.data.shorts);
                addStatus("Generation Complete.", 'success');
             }
          }
        }
      }
    } catch (err) {
      setError(err.message || "Failed to execute. Check console.");
      addStatus(`Execution Fault: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
        <div className="bg-grid" />
        <div className="bg-vignette" />
      </div>

      <div className="max-w-container" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Navbar Upgrade */}
        <nav className="navbar">
          <div className="navbar-logo">
            <div className="logo-icon">
              <Youtube size={16} color="#ffffff" strokeWidth={3} />
            </div>
            <span><span className="logo-text-yt">YouTube</span> <span className="logo-text-s">Summarizer</span></span>
          </div>
          
          <div className="navbar-center">
             Video Intelligence
          </div>

          <div className="navbar-actions">
             <a href="https://github.com/anandc23" target="_blank" rel="noreferrer" className="nav-icon-btn"><Github size={16} /></a>
             <a href="https://linkedin.com/in/anand-chaudhari-ac2004" target="_blank" rel="noreferrer" className="nav-icon-btn"><Linkedin size={16} /></a>
             <a href="mailto:anandchaudhri850@gmail.com" className="nav-icon-btn"><Mail size={16} /></a>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="hero">
          <div className="hero-eyebrow">AI Video Analysis</div>
          <h1 className="hero-title">
            <span className="title-accent">YouTube</span> Summarizer
          </h1>
          <p className="hero-subtitle">
            Extract high-value insights from massive unstructured video data with a single click. Transform multi-hour content into strategic reports instantly.
          </p>
        </header>

        {error && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="error-banner" style={{ background: 'var(--error-glow)', border: '1px solid var(--error)', color: 'var(--text-primary)', padding: '16px 24px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '780px', margin: '0 auto 24px', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
            <AlertCircle size={20} color="var(--error)" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* URL Input Box */}
        <div className="input-card hover-lift">
          <form onSubmit={handleProcess}>
            <div className="url-input-row">
              <div className="url-input-wrapper">
                <Youtube className="url-input-icon" size={18} color="var(--primary)"/>
                <input 
                  type="text" 
                  placeholder="Paste YouTube Video URL..." 
                  className="url-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button type="button" className="paste-btn" onClick={handlePaste}>
                  Paste URL
                </button>
              </div>
              <button type="submit" className="cta-btn" disabled={loading}>
                {loading ? <><Loader2 className="spinner" size={16} /> GENERATING...</> : <><Sparkles size={16} /> Build Summary</>}
              </button>
            </div>

            <div className="separator" />

            <div className="tab-bar">
              {[ 
                {id: 'summarize', icon: FileText, label: 'Report'},
                {id: 'shorts', icon: Video, label: 'Viral Extractions'}
              ].map(opt => (
                <button 
                  key={opt.id} 
                  type="button"
                  className={`tab-btn ${mode === opt.id ? 'active' : ''}`}
                  onClick={() => { setMode(opt.id); resetData(); }}
                >
                  <opt.icon size={16} /> {opt.label}
                </button>
              ))}
              <button type="button" className="cleanup-btn" onClick={() => { setUrl(''); resetData(); }}>
                <Trash2 size={16}/> Clear
              </button>
            </div>

            {mode === 'shorts' && (
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'var(--bg-highlight)', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                <label style={{ fontSize: '0.8rem', fontFamily: 'var(--font-ui)', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  Clip Count: <span style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{numShorts}</span>
                </label>
                <input 
                  type="range" 
                  min="1" max="10" 
                  value={numShorts} 
                  onChange={(e) => setNumShorts(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  title="Number of shorts to generate"
                />
              </div>
            )}
          </form>

          {/* Feature: History */}
          {history.length > 0 && (
            <div style={{ marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
               <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}><History size={14}/> Recent:</span>
               {history.map(item => (
                 <button key={item.id} className="history-chip" onClick={() => setUrl(item.url)}>
                    {item.title.substring(0, 25)}...
                 </button>
               ))}
            </div>
          )}
        </div>

        {/* Loading / Terminal Output */}
        {loading && statusLog.length > 0 && (
          <div className="content-card hover-lift" style={{ maxWidth: '780px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Terminal size={14} /> Active Operations Log
            </div>
            <div className="processing-steps">
              {statusLog.map((log, i) => {
                const isSuccess = log.type === 'success';
                const isError = log.type === 'error';
                return (
                  <div key={i} className={`step-item ${isSuccess ? 'done' : isError ? '' : 'active'}`} style={isError ? {color: 'var(--error)'} : {}}>
                    <div className="step-dot" style={isError ? {borderColor: 'var(--error)', background: 'var(--error)', boxShadow: '0 0 8px var(--error)', animation: 'none'} : {}} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>[{log.time}]</span> {log.msg}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Result Area */}
        <AnimatePresence mode="wait">
          {result && !loading && (
            <motion.div 
              className="result-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              {metadata && (
                <div className="content-card hover-lift" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={metadata.thumbnail} alt="Ref" style={{ width: '220px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} />
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {metadata.duration}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{metadata.title}</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} color="var(--primary-dim)"/> {metadata.author}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={14} color="var(--primary-dim)"/> {metadata.views.toLocaleString()}</span>
                      <span className="badge-tag">SUMMARIZED</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="content-card hover-lift">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-soft)', paddingBottom: '20px' }}>
                    <Sparkles size={20} color="var(--primary)"/> 
                    <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Summary Report</h2>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                      <button type="button" className="tab-btn" onClick={() => copyToClipboard(result.summary)}><Copy size={14} /> Copy</button>
                      <button type="button" className="cta-btn" style={{ height: '36px', padding: '0 16px', fontSize: '0.8rem' }} onClick={() => downloadTranscript(result.summary, "Report.txt")}><Download size={14} /> Export</button>
                    </div>
                  </div>

                  <div style={{ fontStyle: 'italic', marginBottom: '2rem', padding: '1.25rem', borderLeft: '3px solid var(--primary)', background: 'var(--primary-glow)', borderRadius: '0 8px 8px 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    {result.intro}
                  </div>

                  <div style={{ lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>{result.summary}</div>
                  
                  <div className="separator" style={{ marginTop: '40px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Access</h4>
                    <button type="button" className="tab-btn" onClick={() => downloadTranscript(result.transcript, "transcript.txt")}>
                      <FileText size={16} /> Download Full Transcript
                    </button>
                  </div>
              </div>
            </motion.div>
          )}

          {shorts.length > 0 && !loading && (
            <motion.div 
              className="result-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <div className="content-card hover-lift" style={{ padding: '24px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <Video size={20} color="var(--primary)"/> 
                  <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Viral Pattern Extractions</h2>
                </div>
                
                <div className="shorts-grid">
                  {shorts.map((s, i) => (
                    <div key={i} className="short-item">
                      <div style={{ position: 'relative' }}>
                         <img src={`${API_BASE}${s.thumb}`} style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover' }} alt="Viral Clip Thumbnail" />
                         <div style={{ position: 'absolute', top: '12px', right: '12px' }}><span className="badge-tag">H-RETENTION</span></div>
                      </div>
                      <div style={{ padding: '16px' }}>
                         <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: '16px', color: 'var(--text-primary)' }}>Fragment 0{i+1}</div>
                         <a href={`${API_BASE}${s.url}`} download target="_blank" rel="noopener noreferrer" className="cta-btn" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', fontSize: '0.8rem', height: '40px' }}>
                           <Download size={14}/> Extract Video
                         </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && <Toast message={toast} onClose={() => setToast('')} />}
        </AnimatePresence>

        <footer className="footer">
          <div className="footer-inner">
             <div className="footer-brand">
               <div className="navbar-logo" style={{ marginBottom: '12px' }}>
                 <div className="logo-icon">
                   <Youtube size={16} color="#ffffff" strokeWidth={3} />
                 </div>
                 <span><span className="logo-text-yt">YouTube</span> <span className="logo-text-s">Summarizer</span></span>
               </div>
               <p>Harnessing Whisper-L-v3 & BART-CNN neural models for elite content intelligence. Transforming massive unstructured data sets into strategic insights.</p>
             </div>
             <div className="footer-col">
               <h4>Capability</h4>
               <a href="#">Report Dashboard</a>
               <a href="#">Viral Extractions</a>
               <a href="#">Analytics</a>
               <a href="#">Pro API Access</a>
             </div>
             <div className="footer-col">
               <h4>Company</h4>
               <a href="#">AI Ethics Policy</a>
               <a href="#">Safety Center</a>
               <a href="#">Cloud Sync</a>
               <a href="#">Contact Us</a>
             </div>
          </div>
          <div className="footer-bottom">
            ARCHITECTED BY ANAND CHAUDHARI · © 2026 YOUTUBE SUMMARIZER
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
