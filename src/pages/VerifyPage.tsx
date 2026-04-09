import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldCheck, XCircle, CheckCircle2, AlertTriangle, FileBadge, ArrowLeft } from 'lucide-react';
import { isBefore, parseISO, format } from 'date-fns';
import { motion } from 'motion/react';
import type { Certificate } from '../types';

export default function VerifyPage() {
  const { certId } = useParams<{ certId: string }>();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCert() {
      if (!certId) return;
      try {
        const docRef = doc(db, 'certificates', certId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCert({ id: docSnap.id, ...docSnap.data() } as Certificate);
        } else {
          setError('找不到此證照資料');
        }
      } catch (err) {
        console.error(err);
        setError('讀取資料時發生錯誤');
      } finally {
        setLoading(false);
      }
    }
    fetchCert();
  }, [certId]);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">證照現場查驗系統</h1>
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
                <h2 className="text-2xl font-bold text-red-700 tracking-tight">證照已過期</h2>
                <p className="text-xs text-red-600/80 uppercase font-bold tracking-widest">Status: Expired</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50 mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-emerald-700 tracking-tight">證照有效</h2>
                <p className="text-xs text-emerald-600/80 uppercase font-bold tracking-widest">Status: Valid</p>
              </div>
            )}
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <InfoBlock label="持有人" value={cert.staffName} />
              <InfoBlock label="證照類型" value={cert.type} />
              <InfoBlock label="證照編號" value={cert.certNumber} />
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
                  <FileBadge size={18} className="text-slate-400" /> 查看實體證照掃描檔
                </a>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <FileBadge className="text-slate-400" size={24} />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">系統查驗時間</p>
                  <p className="text-sm font-mono text-slate-700">{format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-semibold">
          &copy; 2026 工程人員證照管理系統
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
