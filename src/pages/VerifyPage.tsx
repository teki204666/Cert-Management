import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, XCircle, CheckCircle2, AlertTriangle, FileBadge, ArrowLeft, Clock } from 'lucide-react';
import { isBefore, parseISO, format, addDays } from 'date-fns';
import { motion } from 'motion/react';
import type { Certificate, VerificationLog } from '../types';

export default function VerifyPage() {
  const { certId } = useParams<{ certId: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [verifierName, setVerifierName] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    async function fetchCert() {
      if (!certId) return;
      try {
        setTimeout(() => {
          const allCerts = JSON.parse(localStorage.getItem('app_certs') || '[]');
          // Fallback to mock data if empty (for testing)
          if (allCerts.length === 0 && certId === '1') {
            allCerts.push({
              id: '1', ownerType: 'staff', ownerId: '1', type: '勞工安全衛生管理員', certNumber: 'A001', 
              expiryDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'), documentUrl: '', 
              ownerName: '王大明', contractNumber: 'TC-2026-001', status: 'valid', 
              createdAt: new Date().toISOString()
            });
          }
          
          const foundCert = allCerts.find((c: any) => c.id === certId);
          
          if (foundCert) {
            setCert(foundCert);
            const existingLogs = JSON.parse(localStorage.getItem(`cert_logs_${certId}`) || '[]');
            setLogs(existingLogs);
          } else {
            setError('找不到此證書資料');
          }
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error(err);
        setError('讀取資料時發生錯誤');
        setLoading(false);
      }
    }
    fetchCert();
  }, [certId]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifierName.trim() || !certId) return;
    
    const newLog: VerificationLog = {
      id: Date.now().toString(),
      certId: certId,
      timestamp: new Date().toISOString(),
      user: verifierName.trim()
    };
    const existingLogs = JSON.parse(localStorage.getItem(`cert_logs_${certId}`) || '[]');
    const updatedLogs = [newLog, ...existingLogs];
    localStorage.setItem(`cert_logs_${certId}`, JSON.stringify(updatedLogs));
    setLogs(updatedLogs);
    setVerified(true);
    setVerifierName('');
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 font-mono text-slate-400">
      VERIFYING_CERTIFICATE...
    </div>
  );

  if (error || !cert) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
        <XCircle size={32} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">查驗失敗</h1>
      <p className="text-slate-500 mb-8">{error || '無效的查驗連結'}</p>
      <Link to="/" className="text-sm font-semibold text-slate-600 flex items-center gap-2 hover:text-slate-900 transition-colors">
        <ArrowLeft size={16} /> 返回系統
      </Link>
    </div>
  );

  const isExpired = isBefore(parseISO(cert.expiryDate), new Date());

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10 mb-4">
            <ShieldCheck size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">證書現場查驗系統</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-medium">Official Verification Portal</p>
        </div>

        <div className={cn(
          "bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border",
          isExpired ? "border-red-200" : "border-emerald-200"
        )}>
          <div className={cn(
            "p-8 text-center border-b",
            isExpired ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
          )}>
            {isExpired ? (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 ring-8 ring-red-50 mb-2">
                  <XCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-red-700 tracking-tight">證書已過期</h2>
                <p className="text-xs text-red-600/80 uppercase font-bold tracking-widest">Status: Expired</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50 mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-emerald-700 tracking-tight">證書有效</h2>
                <p className="text-xs text-emerald-600/80 uppercase font-bold tracking-widest">Status: Valid</p>
              </div>
            )}
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <InfoBlock label={cert.ownerType === 'machine' ? '機械名稱' : '持有人'} value={cert.ownerName} />
              <InfoBlock label="證書類型" value={cert.type} />
              <InfoBlock label="證書編號" value={cert.certNumber} />
              <InfoBlock label="到期日期" value={cert.expiryDate} highlight={isExpired} />
            </div>

            {cert.documentUrl && (
              <div className="pt-2">
                <a 
                  href={cert.documentUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors shadow-sm"
                >
                  <FileBadge size={18} className="text-slate-400" /> 查看實體證書掃描檔
                </a>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck size={14} className="text-slate-400" /> 現場查驗簽名
              </h4>
              <form onSubmit={handleVerify} className="space-y-3">
                <input 
                  type="text" 
                  value={verifierName}
                  onChange={e => setVerifierName(e.target.value)}
                  placeholder="請輸入您的姓名 (查驗員)" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                  required
                />
                <button 
                  type="submit" 
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  確認查驗並記錄
                </button>
                {verified && (
                  <p className="text-xs text-emerald-600 text-center font-medium">查驗紀錄已成功儲存！</p>
                )}
              </form>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Clock size={14} className="text-slate-400" /> 查驗紀錄
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {logs.map(log => (
                  <div key={log.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span className="font-mono text-slate-600">{format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</span>
                    </div>
                    <span className="text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">{log.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-semibold">
          &copy; 2026 工程人員證書管理系統
        </p>
      </motion.div>
    </div>
  );
}

function InfoBlock({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn("text-sm font-medium", highlight ? "text-red-600 font-bold" : "text-slate-900")}>{value}</p>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
