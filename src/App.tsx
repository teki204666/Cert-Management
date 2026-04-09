/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileBadge, 
  Bell, 
  QrCode, 
  LogOut, 
  Plus, 
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Download,
  Trash2,
  Folder,
  ChevronDown,
  Building2,
  Settings,
  Tags,
  UserCircle,
  RefreshCw,
  Upload
} from 'lucide-react';
import { format, addDays, isBefore, parseISO, differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import type { Staff, Machine, Certificate, UserProfile, Role, CertType, VerificationLog } from './types';

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }) => {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm ring-1 ring-slate-900/10',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-600/10'
  };
  return (
    <button 
      className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2', variants[variant], className)} 
      {...props} 
    />
  );
};

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('bg-white border border-slate-200/60 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] overflow-hidden', className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'success' | 'warning' | 'danger' | 'neutral' }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
    neutral: 'bg-slate-50 text-slate-700 ring-1 ring-slate-600/20'
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider', variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('app_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('app_current_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('app_staff');
    return saved ? JSON.parse(saved) : [];
  });
  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem('app_machines');
    return saved ? JSON.parse(saved) : [];
  });
  const [certs, setCerts] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem('app_certs');
    return saved ? JSON.parse(saved) : [];
  });
  const [certTypes, setCertTypes] = useState<CertType[]>(() => {
    const saved = localStorage.getItem('app_certTypes');
    return saved ? JSON.parse(saved) : [];
  });
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('app_all_users');
    if (saved) return JSON.parse(saved);
    return [
      { uid: 'mock-uid', userId: 'admin', displayName: 'Admin User', role: 'admin', password: 'password123' },
      { uid: 'mock-uid-2', userId: 'teki204666', displayName: 'Admin User 2', role: 'admin', password: 'password123' },
      { uid: 'mock-staff-uid', userId: 'staff', displayName: 'Staff User', role: 'staff', password: 'password123' }
    ];
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'machines' | 'certs' | 'certTypes' | 'settings' | 'contracts' | 'profile'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [activeContract, setActiveContract] = useState<string | null>(null);
  const [isContractsOpen, setIsContractsOpen] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{type: 'staff'|'machine'|'cert'|'certType', id: string, name?: string} | null>(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{docId: string, name: string, newRole: string} | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{docId: string, name: string} | null>(null);
  const [showAddCertType, setShowAddCertType] = useState(false);
  const [newCertTypeName, setNewCertTypeName] = useState('');

  const [staffSort, setStaffSort] = useState<{key: keyof Staff, dir: 'asc'|'desc'}>({key: 'name', dir: 'asc'});
  const [certSort, setCertSort] = useState<{key: keyof Certificate, dir: 'asc'|'desc'}>({key: 'expiryDate', dir: 'asc'});
  const [showAddUser, setShowAddUser] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('staff');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [detailCert, setDetailCert] = useState<Certificate | null>(null);
  const [renewCert, setRenewCert] = useState<Certificate | null>(null);

  const [notificationDays, setNotificationDays] = useState(30);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Profile state
  const [profileEmail, setProfileEmail] = useState('');
  const [profileNotif, setProfileNotif] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  // Persist state
  useEffect(() => {
    localStorage.setItem('app_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('app_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('app_machines', JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem('app_certs', JSON.stringify(certs));
  }, [certs]);

  useEffect(() => {
    localStorage.setItem('app_certTypes', JSON.stringify(certTypes));
  }, [certTypes]);

  useEffect(() => {
    if (user) localStorage.setItem('app_current_user', JSON.stringify(user));
    else localStorage.removeItem('app_current_user');
  }, [user]);

  useEffect(() => {
    if (profile) {
      localStorage.setItem('app_current_profile', JSON.stringify(profile));
      setProfileEmail(profile.email || '');
      setProfileNotif(profile.emailNotifications || false);
    } else {
      localStorage.removeItem('app_current_profile');
    }
  }, [profile]);

  // Auth Listener
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    if (staff.length === 0) {
      setStaff([
        { id: '1', name: '王大明', staffNumber: 'EMP001', department: '工程部', contractNumber: 'TC-2026-001', createdAt: new Date().toISOString() }
      ]);
    }
    if (machines.length === 0) {
      setMachines([
        { id: '1', name: '挖土機', machineNumber: 'EXC-001', department: '工程部', contractNumber: 'TC-2026-001', createdAt: new Date().toISOString() }
      ]);
    }
    if (certs.length === 0) {
      setCerts([
        { id: '1', ownerType: 'staff', ownerId: '1', type: '勞工安全衛生管理員', certNumber: 'A001', expiryDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'), documentUrl: '', ownerName: '王大明', contractNumber: 'TC-2026-001', status: 'valid', createdAt: new Date().toISOString() }
      ]);
    }
    if (certTypes.length === 0) {
      setCertTypes([
        { id: '1', name: '勞工安全衛生管理員', category: 'staff', createdAt: new Date().toISOString() },
        { id: '2', name: '起重機操作證', category: 'machine', createdAt: new Date().toISOString() }
      ]);
    }
    setNotificationDays(30);
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const registeredUser = allUsers.find(u => u.userId.toLowerCase() === loginId.toLowerCase());
      
      if (registeredUser && registeredUser.password === loginPassword) {
        setUser({ uid: registeredUser.uid, userId: registeredUser.userId, displayName: registeredUser.displayName });
        setProfile(registeredUser);
        setLoginError(null);
      } else {
        setLoginError('User ID 或密碼錯誤，請重新輸入。');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(`登入失敗: ${error.message || '請稍後再試。'}`);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    if (currentPwd || newPwd) {
      if (currentPwd !== profile.password) {
        setProfileMsg('當前密碼錯誤');
        return;
      }
      if (!newPwd) {
        setProfileMsg('請輸入新密碼');
        return;
      }
    }

    const updatedUser = { 
      ...profile, 
      email: profileEmail, 
      emailNotifications: profileNotif 
    };
    if (newPwd) updatedUser.password = newPwd;

    setAllUsers(prev => prev.map(u => u.uid === profile.uid ? updatedUser : u));
    setProfile(updatedUser);
    setProfileMsg('設定已更新');
    setCurrentPwd('');
    setNewPwd('');
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const handleLogout = async () => {
    setUser(null);
    setProfile(null);
    setLoginId('');
    setLoginPassword('');
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'staff') {
      setStaff(prev => prev.filter(s => s.id !== confirmDelete.id));
    } else if (confirmDelete.type === 'machine') {
      setMachines(prev => prev.filter(m => m.id !== confirmDelete.id));
    } else if (confirmDelete.type === 'cert') {
      setCerts(prev => prev.filter(c => c.id !== confirmDelete.id));
    } else if (confirmDelete.type === 'certType') {
      setCertTypes(prev => prev.filter(c => c.id !== confirmDelete.id));
    }
    setConfirmDelete(null);
  };

  const handleAddCertType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertTypeName.trim()) return;
    const categoryElement = document.getElementById('certTypeCategory') as HTMLSelectElement;
    const category = (categoryElement?.value as 'staff' | 'machine') || 'staff';
    const newType: CertType = {
      id: Date.now().toString(),
      name: newCertTypeName.trim(),
      category: category,
      createdAt: new Date().toISOString()
    };
    setCertTypes(prev => [...prev, newType]);
    setShowAddCertType(false);
    setNewCertTypeName('');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim() || !newUserName.trim() || !newUserPassword.trim()) return;
    const newUser: UserProfile = {
      uid: Date.now().toString(),
      userId: newUserId.trim(),
      role: newUserRole as Role,
      displayName: newUserName.trim(),
      password: newUserPassword
    };
    setAllUsers(prev => [...prev, newUser]);
    setShowAddUser(false);
    setNewUserId('');
    setNewUserName('');
    setNewUserRole('staff');
    setNewUserPassword('');
  };

  const handleRoleChange = async () => {
    if (!confirmRoleChange) return;
    setAllUsers(prev => prev.map(u => u.uid === confirmRoleChange.docId ? { ...u, role: confirmRoleChange.newRole as Role } : u));
    setConfirmRoleChange(null);
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    setAllUsers(prev => prev.filter(u => u.uid !== confirmDeleteUser.docId));
    setConfirmDeleteUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-mono">INITIALIZING_SYSTEM...</div>;

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-3">
            <div className="inline-flex p-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10 mb-2">
              <Building2 size={40} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">泰錦建築工程有限公司</h1>
            <p className="text-slate-500 text-sm">工程人員證書管理系統</p>
          </div>
          
          <Card className="p-8 space-y-6 shadow-lg shadow-slate-200/50 border-slate-200/60">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-left flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            <p className="text-sm text-slate-600">請輸入管理員為您建立的帳號密碼登入系統。</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="text" 
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="輸入 User ID" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                required
              />
              <input 
                type="password" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="輸入密碼" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                required
              />
              <Button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white">
                登入
              </Button>
            </form>
          </Card>
          
          <div className="pt-8 flex justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
              <CheckCircle2 size={14} /> 企業級加密
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
              <Clock size={14} /> 即時查驗
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const expiringSoon = certs.filter(c => {
    const days = differenceInDays(parseISO(c.expiryDate), new Date());
    return days > 0 && days <= notificationDays;
  });

  const expired = certs.filter(c => isBefore(parseISO(c.expiryDate), new Date()));

  const uniqueContracts = Array.from(new Set([
    ...staff.map(s => s.contractNumber),
    ...machines.map(m => m.contractNumber)
  ].filter(Boolean))) as string[];
  const filteredStaff = activeContract ? staff.filter(s => s.contractNumber === activeContract) : staff;
  const filteredCerts = activeContract ? certs.filter(c => c.contractNumber === activeContract) : certs;

  const sortedStaff = [...filteredStaff].sort((a, b) => {
    const aVal = String(a[staffSort.key] || '');
    const bVal = String(b[staffSort.key] || '');
    if (aVal < bVal) return staffSort.dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return staffSort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedCerts = [...filteredCerts].sort((a, b) => {
    const aVal = String(a[certSort.key] || '');
    const bVal = String(b[certSort.key] || '');
    if (aVal < bVal) return certSort.dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return certSort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleStaffSort = (key: keyof Staff) => {
    setStaffSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const handleCertSort = (key: keyof Certificate) => {
    setCertSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const exportDataToCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(item => `"${String(item || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStaff = () => exportDataToCSV('人員清單', ['姓名', '工號', '部門', '合約編號'], staff.map(s => [s.name, s.staffNumber, s.department, s.contractNumber]));
  const exportMachines = () => exportDataToCSV('機械清單', ['機械名稱', '機械編號', '部門', '合約編號'], machines.map(m => [m.name, m.machineNumber, m.department, m.contractNumber]));
  const exportCerts = () => exportDataToCSV('證書清單', ['持有人/機械', '類型', '證書類型', '證書編號', '到期日', '狀態'], certs.map(c => [c.ownerName, c.ownerType === 'staff' ? '人員' : '機械', c.type, c.certNumber, c.expiryDate, isBefore(parseISO(c.expiryDate), new Date()) ? '已過期' : '有效']));
  const exportCertTypes = () => exportDataToCSV('證書類型清單', ['證書類型名稱', '分類'], certTypes.map(ct => [ct.name, ct.category === 'staff' ? '人員證書' : '機械證書']));
  const exportContracts = () => exportDataToCSV('工程合約清單', ['合約編號', '持有人/機械', '證書類型', '證書編號', '到期日', '狀態'], certs.filter(c => c.contractNumber).map(c => [c.contractNumber, c.ownerName, c.type, c.certNumber, c.expiryDate, isBefore(parseISO(c.expiryDate), new Date()) ? '已過期' : '有效']));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-slate-900 text-slate-300 flex flex-col z-50 border-r border-slate-800 transition-transform duration-300",
          "fixed inset-y-0 left-0 md:relative w-[260px]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-2 text-white">
            <Building2 size={20} className="text-blue-500" />
            <span className="font-bold tracking-tight text-sm">泰錦建築工程</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 transition-colors md:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-6">
          <div className="px-3 space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              主選單
            </p>
            <NavItem 
              icon={<LayoutDashboard size={18} />} 
              label="總覽儀表板" 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setActiveContract(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            />
            <NavItem 
              icon={<Users size={18} />} 
              label="人員管理" 
              active={activeTab === 'staff'} 
              onClick={() => { setActiveTab('staff'); setActiveContract(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            />
            <NavItem 
              icon={<Building2 size={18} />} 
              label="機械管理" 
              active={activeTab === 'machines'} 
              onClick={() => { setActiveTab('machines'); setActiveContract(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            />
            <NavItem 
              icon={<FileBadge size={18} />} 
              label="證書清單" 
              active={activeTab === 'certs'} 
              onClick={() => { setActiveTab('certs'); setActiveContract(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            />
            <NavItem 
              icon={<Tags size={18} />} 
              label="證書類型管理" 
              active={activeTab === 'certTypes'} 
              onClick={() => { setActiveTab('certTypes'); setActiveContract(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            />
            <NavItem 
              icon={<Folder size={18} />} 
              label="工程合約" 
              active={activeTab === 'contracts' && !activeContract} 
              onClick={() => { setActiveTab('contracts'); setActiveContract(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            />
            <div className="mt-1 space-y-1 pl-4 border-l border-slate-800 ml-5">
              {uniqueContracts.map(contract => (
                <button
                  key={contract}
                  onClick={() => { setActiveContract(contract); setActiveTab('contracts'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-all truncate",
                    activeContract === contract ? "bg-blue-600/20 text-blue-400 font-medium" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  {contract}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-slate-800/50 space-y-2">
          {profile?.role === 'admin' && (
            <NavItem 
              icon={<Settings size={18} />} 
              label="權限與設定" 
              active={activeTab === 'settings'} 
              onClick={() => { setActiveTab('settings'); setActiveContract(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
            />
          )}
          <NavItem 
            icon={<UserCircle size={18} />} 
            label="個人設定" 
            active={activeTab === 'profile'} 
            onClick={() => { setActiveTab('profile'); setActiveContract(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
          />
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 mt-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
              {user.displayName?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">{profile?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="font-semibold text-slate-800 tracking-tight flex items-center gap-3">
              {activeContract && <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-mono hidden md:inline-block">{activeContract}</span>}
              {activeTab === 'dashboard' && '系統概況'}
              {activeTab === 'staff' && '人員管理'}
              {activeTab === 'machines' && '機械管理'}
              {activeTab === 'certs' && '證書清單'}
              {activeTab === 'certTypes' && '證書類型管理'}
              {activeTab === 'settings' && '權限與設定'}
              {activeTab === 'profile' && '個人設定'}
              {activeTab === 'contracts' && '工程合約'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
            >
              <Bell size={18} />
              {expiringSoon.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f6d13b] rounded-full ring-2 ring-white" />
              )}
            </button>
            <div className="h-4 w-[1px] bg-slate-200" />
            <span className="text-xs font-mono text-slate-500">{format(new Date(), 'yyyy-MM-dd HH:mm')}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="總人員" value={staff.length} icon={<Users className="text-blue-500" />} />
                <StatCard label="總證書" value={certs.length} icon={<FileBadge className="text-purple-500" />} />
                <StatCard label="即將到期" value={expiringSoon.length} icon={<AlertTriangle className="text-[#ffbc00]" />} trend="30天內" />
                <StatCard label="已過期" value={expired.length} icon={<X className="text-red-500" />} variant="danger" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Calendar */}
                <div className="lg:col-span-2">
                  <CalendarWidget certs={certs} />
                </div>

                {/* Right Side: Expiring Soon, Quick Actions, System Status */}
                <div className="space-y-6">
                  {/* Expiring Soon List */}
                  <Card className="flex flex-col max-h-[400px]">
                    <div className="p-4 border-b border-black/10 flex items-center justify-between bg-white">
                      <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1d293d]">
                        <Clock size={14} /> 即將到期通知
                      </h3>
                      <Badge variant="warning">{expiringSoon.length}</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {expiringSoon.length === 0 ? (
                        <div className="p-12 text-center text-black/30 italic text-sm">目前無即將到期證書</div>
                      ) : (
                        expiringSoon.map(cert => (
                          <div key={cert.id} className="data-row p-4 grid-cols-[1fr_auto]">
                            <div>
                              <p className="font-bold text-sm">{cert.ownerName}</p>
                              <p className="text-xs opacity-50">{cert.type} - {cert.certNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono text-brand-accent font-bold">
                                {differenceInDays(parseISO(cert.expiryDate), new Date())} 天後到期
                              </p>
                              <p className="text-[10px] opacity-30">{cert.expiryDate}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* Recent Activity / Quick Actions */}
                  <Card className="p-6 bg-white text-slate-800 shadow-xl shadow-slate-200/50">
                    <h3 className="text-sm font-semibold mb-4 text-[#1d293d]">快速操作</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {profile?.role === 'admin' && (
                        <>
                          <QuickActionBtn 
                            icon={<Plus size={18} />} 
                            label="新增人員" 
                            onClick={() => { setActiveTab('staff'); setShowAddStaff(true); }} 
                            className="bg-slate-100 text-slate-800 hover:bg-slate-200"
                          />
                          <QuickActionBtn 
                            icon={<FileBadge size={18} />} 
                            label="上傳證書" 
                            onClick={() => { setActiveTab('certs'); setShowAddCert(true); }} 
                            className="bg-slate-100 text-slate-800 hover:bg-slate-200"
                          />
                        </>
                      )}
                      <QuickActionBtn 
                        icon={<Download size={18} />} 
                        label="匯出試算表" 
                        onClick={exportCerts} 
                        className="bg-slate-100 text-slate-800 hover:bg-slate-200"
                      />
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="text-[11px] font-semibold text-[#1d293d] uppercase tracking-wider mb-4">系統狀態與通知設定</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20" />
                        <span className="text-sm text-slate-600 font-medium">資料庫連線正常</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full ring-4 ring-emerald-500/20" />
                        <span className="text-sm text-slate-600 font-medium">自動通知排程已啟動</span>
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                        <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
                          提前通知天數
                          <input 
                            type="number" 
                            value={notificationDays}
                            onChange={async (e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                setNotificationDays(val);
                              }
                            }}
                            disabled={profile?.role !== 'admin'}
                            className="w-16 p-1.5 border border-slate-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </label>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                  <input 
                    type="text" 
                    placeholder="搜尋姓名或工號..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-black/10 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black/20"
                  />
                </div>
                <div className="flex gap-2">
                  <ImportButton 
                    onImport={(data) => setStaff(prev => [...prev, ...data])} 
                    expectedHeaders={['姓名', '工號', '部門', '合約編號']}
                    rowMapper={(row) => ({
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: row[0],
                      staffNumber: row[1],
                      department: row[2],
                      contractNumber: row[3],
                      createdAt: new Date().toISOString()
                    })}
                  />
                  <Button onClick={exportStaff} variant="outline" className="flex items-center gap-2">
                    <Download size={18} /> 匯出
                  </Button>
                  {profile?.role === 'admin' && (
                    <Button onClick={() => setShowAddStaff(true)} className="flex items-center gap-2">
                      <Plus size={18} /> 新增人員
                    </Button>
                  )}
                </div>
              </div>

              <Card>
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_100px] p-4 border-b border-slate-200 bg-slate-50/50">
                  <button onClick={() => handleStaffSort('name')} className="col-header flex items-center gap-1 hover:text-slate-700">姓名 / 工號 {staffSort.key === 'name' && (staffSort.dir === 'asc' ? '▲' : '▼')}</button>
                  <button onClick={() => handleStaffSort('department')} className="col-header flex items-center gap-1 hover:text-slate-700">部門 {staffSort.key === 'department' && (staffSort.dir === 'asc' ? '▲' : '▼')}</button>
                  <button onClick={() => handleStaffSort('contractNumber')} className="col-header flex items-center gap-1 hover:text-slate-700">合約編號 {staffSort.key === 'contractNumber' && (staffSort.dir === 'asc' ? '▲' : '▼')}</button>
                  <span className="col-header">證書數量</span>
                  <span className="col-header">操作</span>
                </div>
                {sortedStaff.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 italic text-sm">尚無人員資料</div>
                ) : (
                  sortedStaff.map(s => (
                    <div key={s.id} className="data-row grid-cols-[1.5fr_1fr_1fr_1fr_100px] p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className="text-xs font-mono text-slate-500">{s.staffNumber}</p>
                      </div>
                      <p className="text-sm text-slate-700">{s.department}</p>
                      <p className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">{s.contractNumber || '-'}</p>
                      <p className="data-value">{certs.filter(c => c.ownerId === s.id && c.ownerType === 'staff').length}</p>
                      {profile?.role === 'admin' && (
                        <div className="flex gap-1">
                          <button onClick={() => setConfirmDelete({type: 'staff', id: s.id})} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors text-slate-500" title="刪除">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </Card>
            </div>
          )}

          {activeTab === 'machines' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                  <input 
                    type="text" 
                    placeholder="搜尋機械名稱或編號..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-black/10 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black/20"
                  />
                </div>
                <div className="flex gap-2">
                  <ImportButton 
                    onImport={(data) => setMachines(prev => [...prev, ...data])} 
                    expectedHeaders={['機械名稱', '機械編號', '部門', '合約編號']}
                    rowMapper={(row) => ({
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: row[0],
                      machineNumber: row[1],
                      department: row[2],
                      contractNumber: row[3],
                      createdAt: new Date().toISOString()
                    })}
                  />
                  <Button onClick={exportMachines} variant="outline" className="flex items-center gap-2">
                    <Download size={18} /> 匯出
                  </Button>
                  {profile?.role === 'admin' && (
                    <Button onClick={() => setShowAddMachine(true)} className="flex items-center gap-2">
                      <Plus size={18} /> 新增機械
                    </Button>
                  )}
                </div>
              </div>

              <Card>
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_100px] p-4 border-b border-slate-200 bg-slate-50/50">
                  <span className="col-header">機械名稱 / 編號</span>
                  <span className="col-header">部門</span>
                  <span className="col-header">合約編號</span>
                  <span className="col-header">證書數量</span>
                  <span className="col-header">操作</span>
                </div>
                {machines.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 italic text-sm">尚無機械資料</div>
                ) : (
                  machines.map(m => (
                    <div key={m.id} className="data-row grid-cols-[1.5fr_1fr_1fr_1fr_100px] p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{m.name}</p>
                        <p className="text-xs font-mono text-slate-500">{m.machineNumber}</p>
                      </div>
                      <p className="text-sm text-slate-700">{m.department}</p>
                      <p className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">{m.contractNumber || '-'}</p>
                      <p className="data-value">{certs.filter(c => c.ownerId === m.id && c.ownerType === 'machine').length}</p>
                      {profile?.role === 'admin' && (
                        <div className="flex gap-1">
                          <button onClick={() => setConfirmDelete({type: 'machine', id: m.id})} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors text-slate-500" title="刪除">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </Card>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 text-sm">依工程合約檢視人員與機械證書狀態。</p>
                <div className="flex gap-2">
                  <Button onClick={exportContracts} variant="outline" className="flex items-center gap-2">
                    <Download size={18} /> 匯出
                  </Button>
                </div>
              </div>

              {(activeContract ? [activeContract] : uniqueContracts).length === 0 ? (
                <Card className="p-12 text-center text-slate-400 italic text-sm">尚無合約資料</Card>
              ) : (
                (activeContract ? [activeContract] : uniqueContracts).map(contract => {
                  const contractCerts = certs.filter(c => c.contractNumber === contract);
                  const staffCerts = contractCerts.filter(c => c.ownerType === 'staff');
                  const machineCerts = contractCerts.filter(c => c.ownerType === 'machine');

                  return (
                    <Card key={contract} className="mb-8">
                      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <Folder className="text-blue-500" size={20} />
                          {contract}
                        </h3>
                        <Badge variant="neutral">共 {contractCerts.length} 張證書</Badge>
                      </div>
                      
                      <div className="p-6 space-y-8">
                        {/* Staff Certs */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Users size={16} className="text-slate-400" /> 人員證書 ({staffCerts.length})
                          </h4>
                          {staffCerts.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">無人員證書</p>
                          ) : (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                              <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_100px] p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <span>持有人</span>
                                <span>證書類型 / 編號</span>
                                <span>到期日</span>
                                <span>狀態</span>
                                <span>操作</span>
                              </div>
                              {staffCerts.map(c => {
                                const isExpired = isBefore(parseISO(c.expiryDate), new Date());
                                const isExpiringSoon = differenceInDays(parseISO(c.expiryDate), new Date()) > 0 && differenceInDays(parseISO(c.expiryDate), new Date()) <= 30;
                                return (
                                  <div key={c.id} className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_100px] p-3 border-b last:border-0 border-slate-100 items-center text-sm hover:bg-slate-50/50">
                                    <span className="font-medium text-slate-900">{c.ownerName}</span>
                                    <div>
                                      <p className="text-slate-800">{c.type}</p>
                                      <p className="text-[10px] font-mono text-slate-500">{c.certNumber}</p>
                                    </div>
                                    <span className={cn(isExpired ? "text-red-600 font-semibold" : isExpiringSoon ? "text-amber-600 font-semibold" : "text-slate-600")}>{c.expiryDate}</span>
                                    <div>
                                      {isExpired ? <Badge variant="danger">已過期</Badge> : isExpiringSoon ? <Badge variant="warning">即將到期</Badge> : <Badge variant="success">有效</Badge>}
                                    </div>
                                    <div className="flex gap-1">
                                      <button onClick={() => setDetailCert(c)} className="p-1.5 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-colors text-slate-500"><FileBadge size={14} /></button>
                                      <CertQRModal cert={c} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Machine Certs */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Building2 size={16} className="text-slate-400" /> 機械證書 ({machineCerts.length})
                          </h4>
                          {machineCerts.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">無機械證書</p>
                          ) : (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                              <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_100px] p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <span>機械名稱</span>
                                <span>證書類型 / 編號</span>
                                <span>到期日</span>
                                <span>狀態</span>
                                <span>操作</span>
                              </div>
                              {machineCerts.map(c => {
                                const isExpired = isBefore(parseISO(c.expiryDate), new Date());
                                const isExpiringSoon = differenceInDays(parseISO(c.expiryDate), new Date()) > 0 && differenceInDays(parseISO(c.expiryDate), new Date()) <= 30;
                                return (
                                  <div key={c.id} className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_100px] p-3 border-b last:border-0 border-slate-100 items-center text-sm hover:bg-slate-50/50">
                                    <span className="font-medium text-slate-900">{c.ownerName}</span>
                                    <div>
                                      <p className="text-slate-800">{c.type}</p>
                                      <p className="text-[10px] font-mono text-slate-500">{c.certNumber}</p>
                                    </div>
                                    <span className={cn(isExpired ? "text-red-600 font-semibold" : isExpiringSoon ? "text-amber-600 font-semibold" : "text-slate-600")}>{c.expiryDate}</span>
                                    <div>
                                      {isExpired ? <Badge variant="danger">已過期</Badge> : isExpiringSoon ? <Badge variant="warning">即將到期</Badge> : <Badge variant="success">有效</Badge>}
                                    </div>
                                    <div className="flex gap-1">
                                      <button onClick={() => setDetailCert(c)} className="p-1.5 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-colors text-slate-500"><FileBadge size={14} /></button>
                                      <CertQRModal cert={c} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'certs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
                    <input 
                      type="text" 
                      placeholder="搜尋證書名稱或編號..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-black/10 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-black/20"
                    />
                  </div>
                  <select className="bg-white border border-black/10 rounded-md px-3 text-sm focus:outline-none">
                    <option>所有狀態</option>
                    <option>有效</option>
                    <option>即將到期</option>
                    <option>已過期</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <ImportButton 
                    onImport={(data) => setCerts(prev => [...prev, ...data])} 
                    expectedHeaders={['持有人/機械', '類型', '證書類型', '證書編號', '到期日', '狀態']}
                    rowMapper={(row) => ({
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      ownerName: row[0],
                      ownerType: row[1] === '人員' ? 'staff' : 'machine',
                      type: row[2],
                      certNumber: row[3],
                      expiryDate: row[4],
                      status: row[5] === '已過期' ? 'expired' : 'valid',
                      ownerId: 'imported',
                      documentUrl: '',
                      contractNumber: '',
                      createdAt: new Date().toISOString()
                    })}
                  />
                  <Button onClick={exportCerts} variant="outline" className="flex items-center gap-2">
                    <Download size={18} /> 匯出
                  </Button>
                  {profile?.role === 'admin' && (
                    <Button onClick={() => setShowAddCert(true)} className="flex items-center gap-2">
                      <Plus size={18} /> 上傳證書
                    </Button>
                  )}
                </div>
              </div>

              <Card>
                <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr_120px] p-4 border-b border-slate-200 bg-slate-50/50">
                  <button onClick={() => handleCertSort('ownerName')} className="col-header flex items-center gap-1 hover:text-slate-700">持有人/機械 {certSort.key === 'ownerName' && (certSort.dir === 'asc' ? '▲' : '▼')}</button>
                  <button onClick={() => handleCertSort('contractNumber')} className="col-header flex items-center gap-1 hover:text-slate-700">合約編號 {certSort.key === 'contractNumber' && (certSort.dir === 'asc' ? '▲' : '▼')}</button>
                  <button onClick={() => handleCertSort('type')} className="col-header flex items-center gap-1 hover:text-slate-700">證書類型 / 編號 {certSort.key === 'type' && (certSort.dir === 'asc' ? '▲' : '▼')}</button>
                  <button onClick={() => handleCertSort('expiryDate')} className="col-header flex items-center gap-1 hover:text-slate-700">到期日 {certSort.key === 'expiryDate' && (certSort.dir === 'asc' ? '▲' : '▼')}</button>
                  <span className="col-header">狀態</span>
                  <span className="col-header">操作</span>
                </div>
                {sortedCerts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 italic text-sm">尚無證書資料</div>
                ) : (
                  sortedCerts.map(c => {
                    const isExpired = isBefore(parseISO(c.expiryDate), new Date());
                    const daysToExpiry = differenceInDays(parseISO(c.expiryDate), new Date());
                    const isExpiringSoon = daysToExpiry > 0 && daysToExpiry <= 30;
                    return (
                      <div key={c.id} className="data-row grid-cols-[1.5fr_1fr_1.5fr_1fr_1fr_120px] p-4">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{c.ownerName}</p>
                          <p className="text-[10px] font-mono text-slate-500">{c.ownerType === 'staff' ? '人員' : '機械'}</p>
                        </div>
                        <p className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">{c.contractNumber || '-'}</p>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{c.type}</p>
                          <p className="text-[10px] font-mono text-slate-500">{c.certNumber}</p>
                        </div>
                        <p className={cn("data-value", isExpired ? "text-red-600 font-semibold" : isExpiringSoon ? "text-amber-600 font-semibold" : "")}>
                          {c.expiryDate}
                        </p>
                        <div>
                          {isExpired ? <Badge variant="danger">已過期</Badge> : 
                           isExpiringSoon ? <Badge variant="warning">即將到期</Badge> : 
                           <Badge variant="success">有效</Badge>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setDetailCert(c)} className="p-2 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-colors text-slate-500" title="詳細資料">
                            <FileBadge size={16} />
                          </button>
                          <CertQRModal cert={c} />
                          {c.documentUrl && (
                            <a href={c.documentUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-200 rounded-md transition-colors text-slate-500" title="查看檔案">
                              <ExternalLink size={16} />
                            </a>
                          )}
                          {profile?.role === 'admin' && (
                            <>
                              <button onClick={() => setRenewCert(c)} className="p-2 hover:bg-emerald-100 hover:text-emerald-600 rounded-md transition-colors text-slate-500" title="展延證書">
                                <RefreshCw size={16} />
                              </button>
                              <button onClick={() => setConfirmDelete({type: 'cert', id: c.id})} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors text-slate-500" title="刪除">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </Card>
            </div>
          )}
          {activeTab === 'certTypes' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm">檢視系統中可用的證書類型。</p>
                <div className="flex gap-2">
                  <ImportButton 
                    onImport={(data) => setCertTypes(prev => [...prev, ...data])} 
                    expectedHeaders={['證書類型名稱', '分類']}
                    rowMapper={(row) => ({
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: row[0],
                      category: row[1] === '人員證書' ? 'staff' : 'machine',
                      createdAt: new Date().toISOString()
                    })}
                  />
                  <Button onClick={exportCertTypes} variant="outline" className="flex items-center gap-2">
                    <Download size={18} /> 匯出
                  </Button>
                  {profile?.role === 'admin' && (
                    <Button onClick={() => setShowAddCertType(true)} className="flex items-center gap-2">
                      <Plus size={18} /> 新增證書類型
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Staff Cert Types */}
                <Card>
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <Users size={18} className="text-blue-500" />
                    <h3 className="font-bold text-slate-800">人員證書</h3>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] p-3 border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>證書類型名稱</span>
                    <span>操作</span>
                  </div>
                  {certTypes.filter(ct => ct.category === 'staff').length === 0 ? (
                    <div className="p-12 text-center text-slate-400 italic text-sm">尚無人員證書類型</div>
                  ) : (
                    certTypes.filter(ct => ct.category === 'staff').map(ct => (
                      <div key={ct.id} className="data-row grid-cols-[1fr_auto] p-3">
                        <p className="font-semibold text-slate-900">{ct.name}</p>
                        {profile?.role === 'admin' && (
                          <button onClick={() => setConfirmDelete({type: 'certType', id: ct.id, name: ct.name})} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors text-slate-500" title="刪除">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </Card>

                {/* Machine Cert Types */}
                <Card>
                  <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                    <Building2 size={18} className="text-blue-500" />
                    <h3 className="font-bold text-slate-800">機械證書</h3>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] p-3 border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>證書類型名稱</span>
                    <span>操作</span>
                  </div>
                  {certTypes.filter(ct => ct.category === 'machine').length === 0 ? (
                    <div className="p-12 text-center text-slate-400 italic text-sm">尚無機械證書類型</div>
                  ) : (
                    certTypes.filter(ct => ct.category === 'machine').map(ct => (
                      <div key={ct.id} className="data-row grid-cols-[1fr_auto] p-3">
                        <p className="font-semibold text-slate-900">{ct.name}</p>
                        {profile?.role === 'admin' && (
                          <button onClick={() => setConfirmDelete({type: 'certType', id: ct.id, name: ct.name})} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors text-slate-500" title="刪除">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && profile?.role === 'admin' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm">管理系統使用者權限。您可以預先加入使用者的 ID 並設定權限。</p>
                <div className="flex items-center gap-4">
                  <Button onClick={() => setShowAddUser(true)} className="flex items-center gap-2">
                    <Plus size={18} /> 預先加入使用者
                  </Button>
                </div>
              </div>

              <Card>
                <div className="grid grid-cols-[1.5fr_1.5fr_1fr_120px] p-4 border-b border-slate-200 bg-slate-50/50">
                  <span className="col-header">使用者名稱</span>
                  <span className="col-header">User ID</span>
                  <span className="col-header">目前權限</span>
                  <span className="col-header">操作</span>
                </div>
                {allUsers.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 italic text-sm">載入中...</div>
                ) : (
                  allUsers.map(u => {
                    const docId = u.uid;
                    return (
                    <div key={docId} className="data-row grid-cols-[1.5fr_1.5fr_1fr_120px] p-4">
                      <p className="font-semibold text-slate-900">{u.displayName}</p>
                      <p className="text-sm text-slate-500">{u.userId}</p>
                      <div>
                        <Badge variant={u.role === 'admin' ? 'warning' : 'neutral'}>
                          {u.role === 'admin' ? '管理員' : '一般人員'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {u.userId !== 'admin' && (
                          <>
                            <select 
                              value={u.role}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                setConfirmRoleChange({docId, name: u.displayName, newRole});
                              }}
                              className="text-xs p-1.5 border border-slate-200 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="staff">一般人員</option>
                              <option value="admin">管理員</option>
                            </select>
                            <button onClick={() => setConfirmDeleteUser({docId, name: u.displayName})} className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors text-slate-500" title="刪除">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                ))}
              </Card>
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-6">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">個人設定</h3>
                  <p className="text-sm text-slate-500">更新您的密碼與通知設定</p>
                </div>
                
                {profileMsg && (
                  <div className={cn("p-3 text-sm rounded-lg", profileMsg === '設定已更新' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
                    {profileMsg}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">聯絡資訊</h4>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">聯絡 Email</label>
                      <input 
                        type="email"
                        value={profileEmail} 
                        onChange={e => setProfileEmail(e.target.value)} 
                        placeholder="輸入 Email 以接收通知"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                      />
                    </div>
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={profileNotif}
                        onChange={e => setProfileNotif(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">接收證書到期通知</span>
                        <span className="text-xs text-slate-500">當證書即將到期時，發送 Email 通知我</span>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">變更密碼</h4>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">當前密碼</label>
                      <input 
                        type="password"
                        value={currentPwd} 
                        onChange={e => setCurrentPwd(e.target.value)} 
                        placeholder="若不更改密碼請留空"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">新密碼</label>
                      <input 
                        type="password"
                        value={newPwd} 
                        onChange={e => setNewPwd(e.target.value)} 
                        placeholder="輸入新密碼"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button type="submit">儲存設定</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAddStaff && (
          <Modal title="新增人員資料" onClose={() => setShowAddStaff(false)}>
            <AddStaffForm onComplete={() => setShowAddStaff(false)} onAdd={(newStaff) => setStaff(prev => [...prev, newStaff])} />
          </Modal>
        )}
        {showAddMachine && (
          <Modal title="新增機械資料" onClose={() => setShowAddMachine(false)}>
            <AddMachineForm onComplete={() => setShowAddMachine(false)} onAdd={(newMachine) => setMachines(prev => [...prev, newMachine])} />
          </Modal>
        )}
        {showAddCert && (
          <Modal title="上傳證書資料" onClose={() => setShowAddCert(false)}>
            <AddCertForm staffList={staff} machineList={machines} certTypes={certTypes} onComplete={() => setShowAddCert(false)} onAdd={(newCert) => setCerts(prev => [...prev, newCert])} />
          </Modal>
        )}
        {renewCert && (
          <Modal title="展延證書" onClose={() => setRenewCert(null)}>
            <RenewCertForm 
              cert={renewCert} 
              onComplete={() => setRenewCert(null)} 
              onRenew={(newExpiryDate) => {
                setCerts(prev => prev.map(c => c.id === renewCert.id ? { ...c, expiryDate: newExpiryDate } : c));
              }} 
            />
          </Modal>
        )}
        {confirmDelete && (
          <Modal title="確認刪除" onClose={() => setConfirmDelete(null)}>
            <div className="space-y-6">
              <p className="text-slate-600 text-sm">
                您確定要刪除這筆{confirmDelete.type === 'staff' ? '人員' : confirmDelete.type === 'cert' ? '證書' : '證書類型'}{confirmDelete.name ? `「${confirmDelete.name}」` : ''}資料嗎？此操作無法復原。
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setConfirmDelete(null)}>取消</Button>
                <Button variant="danger" onClick={handleDelete}>確認刪除</Button>
              </div>
            </div>
          </Modal>
        )}
        {confirmRoleChange && (
          <Modal title="確認更改權限" onClose={() => setConfirmRoleChange(null)}>
            <div className="space-y-6">
              <p className="text-slate-600 text-sm">
                確定要將 {confirmRoleChange.name} 的權限更改為 {confirmRoleChange.newRole === 'admin' ? '管理員' : '一般人員'} 嗎？
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setConfirmRoleChange(null)}>取消</Button>
                <Button onClick={handleRoleChange}>確認更改</Button>
              </div>
            </div>
          </Modal>
        )}
        {confirmDeleteUser && (
          <Modal title="確認刪除使用者" onClose={() => setConfirmDeleteUser(null)}>
            <div className="space-y-6">
              <p className="text-slate-600 text-sm">
                確定要刪除使用者「{confirmDeleteUser.name}」嗎？此操作無法復原。
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setConfirmDeleteUser(null)}>取消</Button>
                <Button variant="danger" onClick={handleDeleteUser}>確認刪除</Button>
              </div>
            </div>
          </Modal>
        )}
        {showAddCertType && (
          <Modal title="新增證書類型" onClose={() => setShowAddCertType(false)}>
            <form onSubmit={handleAddCertType} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">證書類型名稱</label>
                  <input 
                    required 
                    autoFocus
                    value={newCertTypeName} 
                    onChange={e => setNewCertTypeName(e.target.value)} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">分類</label>
                  <select 
                    required
                    onChange={e => {
                      // We need to update the handleAddCertType to use this value, 
                      // or just use a state for category. Let's add a state or just use a ref.
                      // Actually, let's just use a select and update the form submission.
                    }}
                    id="certTypeCategory"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  >
                    <option value="staff">人員證書</option>
                    <option value="machine">機械證書</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowAddCertType(false)}>取消</Button>
                <Button type="submit">確認新增</Button>
              </div>
            </form>
          </Modal>
        )}
        {showAddUser && (
          <Modal title="預先加入使用者" onClose={() => setShowAddUser(false)}>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">使用者名稱</label>
                    <input 
                      required 
                      type="text"
                      value={newUserName} 
                      onChange={e => setNewUserName(e.target.value)} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">使用者 ID</label>
                    <input 
                      required 
                      type="text"
                      value={newUserId} 
                      onChange={e => setNewUserId(e.target.value)} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">登入密碼</label>
                    <input 
                      required 
                      type="text"
                      value={newUserPassword} 
                      onChange={e => setNewUserPassword(e.target.value)} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
                    />
                    <p className="text-[10px] opacity-40 mt-1">使用者將使用此密碼登入系統。</p>
                  </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">指派權限</label>
                  <select 
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  >
                    <option value="staff">一般人員</option>
                    <option value="admin">管理員</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowAddUser(false)}>取消</Button>
                <Button type="submit">確認加入</Button>
              </div>
            </form>
          </Modal>
        )}
        {showNotifications && (
          <Modal title="即將到期通知" onClose={() => setShowNotifications(false)}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {expiringSoon.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-sm">目前無即將到期證書</div>
              ) : (
                expiringSoon.map(cert => (
                  <div key={cert.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-slate-800">{cert.ownerName}</p>
                      <p className="text-xs text-slate-500">{cert.type} - {cert.certNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-amber-600 font-bold">
                        {differenceInDays(parseISO(cert.expiryDate), new Date())} 天後到期
                      </p>
                      <p className="text-[10px] text-slate-400">{cert.expiryDate}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowNotifications(false)}>關閉</Button>
            </div>
          </Modal>
        )}
        {detailCert && (
          <Modal title="證書詳細資料與查驗紀錄" onClose={() => setDetailCert(null)}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <InfoBlock label={detailCert.ownerType === 'staff' ? '持有人' : '機械'} value={detailCert.ownerName} />
                <InfoBlock label="證書類型" value={detailCert.type} />
                <InfoBlock label="證書編號" value={detailCert.certNumber} />
                <InfoBlock label="到期日期" value={detailCert.expiryDate} highlight={isBefore(parseISO(detailCert.expiryDate), new Date())} />
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" /> 查驗紀錄 (Logs)
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {(() => {
                    const logs = JSON.parse(localStorage.getItem(`cert_logs_${detailCert.id}`) || '[]');
                    if (logs.length === 0) return <p className="text-xs text-slate-400 italic">尚無查驗紀錄</p>;
                    return logs.map((log: any) => (
                      <div key={log.id} className="flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={14} className="text-emerald-500" />
                          <span className="font-mono text-slate-600">{format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</span>
                        </div>
                        <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded">{log.user}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setDetailCert(null)}>關閉</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm font-medium",
        active ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, trend, variant = 'neutral' }: { label: string, value: number, icon: React.ReactNode, trend?: string, variant?: 'neutral' | 'danger' }) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-slate-50 rounded-xl ring-1 ring-slate-100">{icon}</div>
        {trend && <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-3xl font-mono tracking-tight", variant === 'danger' && value > 0 ? "text-red-600" : "text-slate-900")}>{value}</p>
    </Card>
  );
}

function InfoBlock({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={cn("font-medium", highlight ? "text-red-600" : "text-slate-900")}>{value}</p>
    </div>
  );
}

function ImportButton({ onImport, expectedHeaders, rowMapper }: { onImport: (data: any[]) => void, expectedHeaders: string[], rowMapper: (row: string[]) => any }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const parseCSVRow = (row: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let text = event.target?.result as string;
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length < 2) {
          alert('匯入失敗：檔案為空或無資料列');
          return;
        }

        const headers = parseCSVRow(lines[0]);
        const headersMatch = expectedHeaders.every((h, i) => headers[i] === h);
        if (!headersMatch) {
          alert(`匯入失敗：檔案格式不符。預期標題為：${expectedHeaders.join(', ')}`);
          return;
        }

        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVRow(lines[i]);
          if (row.length >= expectedHeaders.length) {
            data.push(rowMapper(row));
          }
        }
        
        onImport(data);
        alert(`成功匯入 ${data.length} 筆資料`);
      } catch (err) {
        alert('匯入失敗：無效的 CSV 檔案或資料格式錯誤');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <>
      <input 
        type="file" 
        accept=".csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex items-center gap-2">
        <Upload size={16} />
        匯入 CSV
      </Button>
    </>
  );
}

function QuickActionBtn({ icon, label, onClick, className }: { icon: React.ReactNode, label: string, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn("flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl transition-all border border-slate-200 shadow-sm group", className)}
    >
      <div className="transition-colors text-slate-600 group-hover:text-slate-900">{icon}</div>
      <span className="text-xs font-medium transition-colors text-[#1d293d] group-hover:text-slate-900">{label}</span>
    </button>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-black/10 flex justify-between items-center bg-black/[0.02]">
          <h3 className="font-serif italic text-xl">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function CalendarWidget({ certs }: { certs: Certificate[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addDays(monthEnd, 1));
  const prevMonth = () => setCurrentDate(addDays(monthStart, -1));

  return (
    <Card className="p-6 flex flex-col h-full min-h-[400px] bg-white">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-[#1d293d]">{format(currentDate, 'yyyy年 MM月')}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 bg-[#eeeeee] hover:bg-slate-200 rounded-md transition-colors text-[#1d293d]"><ChevronRight size={18} className="rotate-180" /></button>
          <button onClick={nextMonth} className="p-1.5 bg-[#eeeeee] hover:bg-slate-200 rounded-md transition-colors text-[#1d293d]"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day, i) => {
          const dayCerts = certs.filter(c => c.expiryDate === format(day, 'yyyy-MM-dd'));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={i} className={cn(
              "border border-slate-100 p-1.5 flex flex-col min-h-[80px] rounded-lg transition-colors",
              !isCurrentMonth ? "bg-slate-50/50 opacity-40" : "bg-white hover:border-blue-200",
              isToday && "ring-1 ring-blue-500 bg-blue-50/30"
            )}>
              <span className={cn(
                "text-xs font-medium mb-1.5 w-6 h-6 flex items-center justify-center rounded-full",
                isToday ? "bg-blue-600 text-white" : "text-slate-600"
              )}>
                {format(day, dateFormat)}
              </span>
              <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                {dayCerts.map(c => (
                  <div key={c.id} className="text-[9px] leading-tight bg-amber-100 text-amber-800 px-1.5 py-1 rounded truncate font-medium border border-amber-200/50" title={`${c.ownerName} - ${c.type}`}>
                    {c.ownerName}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AddStaffForm({ onComplete, onAdd }: { onComplete: () => void, onAdd: (staff: Staff) => void }) {
  const [formData, setFormData] = useState({ name: '', staffNumber: '', department: '', contractNumber: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      onAdd({
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      });
      onComplete();
      setSubmitting(false);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">姓名</label>
          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">工號</label>
          <input required value={formData.staffNumber} onChange={e => setFormData({...formData, staffNumber: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">部門</label>
          <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">合約編號 - 選填</label>
          <input value={formData.contractNumber} onChange={e => setFormData({...formData, contractNumber: e.target.value})} placeholder="例如: TC-2026-001" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={onComplete}>取消</Button>
        <Button type="submit" disabled={submitting}>{submitting ? '儲存中...' : '確認新增'}</Button>
      </div>
    </form>
  );
}

function AddMachineForm({ onComplete, onAdd }: { onComplete: () => void, onAdd: (machine: Machine) => void }) {
  const [formData, setFormData] = useState({ name: '', machineNumber: '', department: '', contractNumber: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      onAdd({
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      });
      onComplete();
      setSubmitting(false);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">機械名稱</label>
          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">機械編號</label>
          <input required value={formData.machineNumber} onChange={e => setFormData({...formData, machineNumber: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">部門</label>
          <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">合約編號 - 選填</label>
          <input value={formData.contractNumber} onChange={e => setFormData({...formData, contractNumber: e.target.value})} placeholder="例如: TC-2026-001" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={onComplete}>取消</Button>
        <Button type="submit" disabled={submitting}>{submitting ? '儲存中...' : '確認新增'}</Button>
      </div>
    </form>
  );
}

function RenewCertForm({ cert, onComplete, onRenew }: { cert: Certificate, onComplete: () => void, onRenew: (newExpiryDate: string) => void }) {
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpiryDate) return;
    setSubmitting(true);
    setTimeout(() => {
      onRenew(newExpiryDate);
      setSubmitting(false);
      onComplete();
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4 text-sm">
        <p><span className="text-slate-500">持有人/機械：</span> <span className="font-semibold text-slate-900">{cert.ownerName}</span></p>
        <p><span className="text-slate-500">證書類型：</span> <span className="font-semibold text-slate-900">{cert.type}</span></p>
        <p><span className="text-slate-500">原到期日：</span> <span className="font-semibold text-slate-900">{cert.expiryDate}</span></p>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">新到期日期</label>
        <input type="date" required value={newExpiryDate} onChange={e => setNewExpiryDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onComplete}>取消</Button>
        <Button type="submit" disabled={submitting}>{submitting ? '處理中...' : '確認展延'}</Button>
      </div>
    </form>
  );
}

function AddCertForm({ staffList, machineList, certTypes, onComplete, onAdd }: { staffList: Staff[], machineList: Machine[], certTypes: CertType[], onComplete: () => void, onAdd: (cert: Certificate) => void }) {
  const [formData, setFormData] = useState({ ownerType: 'staff' as 'staff' | 'machine', ownerId: '', type: '', certNumber: '', expiryDate: '', documentUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      let ownerName = 'Unknown';
      let contractNumber = '';
      if (formData.ownerType === 'staff') {
        const selectedStaff = staffList.find(s => s.id === formData.ownerId);
        ownerName = selectedStaff?.name || 'Unknown';
        contractNumber = selectedStaff?.contractNumber || '';
      } else {
        const selectedMachine = machineList.find(m => m.id === formData.ownerId);
        ownerName = selectedMachine?.name || 'Unknown';
        contractNumber = selectedMachine?.contractNumber || '';
      }

      onAdd({
        id: Date.now().toString(),
        ownerType: formData.ownerType,
        ownerId: formData.ownerId,
        type: formData.type,
        certNumber: formData.certNumber,
        expiryDate: formData.expiryDate,
        documentUrl: formData.documentUrl,
        ownerName: ownerName,
        contractNumber: contractNumber,
        status: 'valid',
        createdAt: new Date().toISOString()
      });
      onComplete();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`新增失敗: ${err.message || '請檢查網路連線。'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCertTypes = certTypes.filter(ct => ct.category === formData.ownerType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">證書分類</label>
          <select required value={formData.ownerType} onChange={e => setFormData({...formData, ownerType: e.target.value as 'staff' | 'machine', ownerId: '', type: ''})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all">
            <option value="staff">人員證書</option>
            <option value="machine">機械證書</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">{formData.ownerType === 'staff' ? '持有人' : '機械'}</label>
          <select required value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all">
            <option value="">選擇{formData.ownerType === 'staff' ? '人員' : '機械'}...</option>
            {formData.ownerType === 'staff' ? (
              staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.staffNumber})</option>)
            ) : (
              machineList.map(m => <option key={m.id} value={m.id}>{m.name} ({m.machineNumber})</option>)
            )}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">證書類型</label>
          <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all">
            <option value="">選擇證書類型...</option>
            {filteredCertTypes.map(ct => <option key={ct.id} value={ct.name}>{ct.name}</option>)}
          </select>
          {filteredCertTypes.length === 0 && (
            <p className="text-[10px] text-amber-600 mt-1">請先請管理員在「證書類型管理」新增類型。</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">證書編號</label>
          <input required value={formData.certNumber} onChange={e => setFormData({...formData, certNumber: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">到期日</label>
          <input required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">證書檔案連結 (Google Drive / Dropbox) - 選填</label>
          <input 
            type="url" 
            placeholder="https://drive.google.com/..."
            value={formData.documentUrl} 
            onChange={e => setFormData({...formData, documentUrl: e.target.value})} 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all" 
          />
          <p className="text-[10px] opacity-40 mt-1">請將檔案上傳至公司雲端硬碟並貼上共用連結，以節省系統空間。</p>
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full py-4">
        {submitting ? '處理中...' : '確認新增'}
      </Button>
    </form>
  );
}

function CertQRModal({ cert }: { cert: Certificate }) {
  const [isOpen, setIsOpen] = useState(false);
  const verifyUrl = `${window.location.origin}/verify/${cert.id}`;

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="p-2 hover:bg-black/5 rounded transition-colors" title="查驗 QR Code">
        <QrCode size={16} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <Modal title="證書查驗 QR Code" onClose={() => setIsOpen(false)}>
            <div className="flex flex-col items-center space-y-6">
              <div className="p-4 bg-white border border-black/10 rounded-2xl shadow-inner">
                <QRCodeSVG value={verifyUrl} size={200} level="H" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-lg">{cert.type}</p>
                <p className="text-sm opacity-50">{cert.ownerName} - {cert.certNumber}</p>
              </div>
              <div className="w-full p-4 bg-black/[0.02] rounded-xl border border-black/5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-1">查驗連結</p>
                <p className="text-xs font-mono break-all opacity-50">{verifyUrl}</p>
              </div>
              <p className="text-xs text-black/40 italic">現場查驗員可使用手機掃描此碼即時確認證書效期。</p>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
