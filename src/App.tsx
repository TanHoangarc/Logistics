/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  CheckCircle2, 
  Wallet, 
  Users, 
  ChevronDown, 
  ChevronRight,
  Menu,
  X,
  CreditCard,
  FileText,
  TrendingUp,
  ArrowRightLeft,
  Receipt,
  CalendarCheck,
  Bell,
  Search,
  User as UserIcon,
  LayoutDashboard,
  Upload,
  Eye,
  Check,
  ShieldCheck,
  Briefcase,
  Phone,
  Lock,
  Copy,
  Mail,
  Globe,
  MapPin,
  Info,
  Settings,
  Download,
  Plus,
  Filter,
  Save,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Ship,
  Plane,
  Truck,
  Train,
  UploadCloud,
  CloudDownload,
  Calendar,
  FileSpreadsheet,
  CloudUpload,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import * as XLSX from 'xlsx';

import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  getDocFromServer,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

// --- Global Helpers ---
export const formatDateDDMMYYYY = (dateVal: string | Date | undefined) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// --- Types ---

type UserRole = 'Admin' | 'Manager' | 'Accountant';

interface Activity {
  id: string;
  timestamp: string;
  content: string;
  type: 'submit' | 'approve' | 'settle' | 'other';
}

interface Expense {
  id: string;
  date: string;
  type: string;
  amount: number;
  submitter: string;
  invoiceFile: string;
  isApproved: boolean;
  isSettled: boolean;
}

// --- Mock Data ---
interface Employee {
  id: string;
  fullName: string;
  position: string;
  name: string;
  email: string;
  phone: string;
  line: string;
  accountNumber: string;
  bankName: string;
  avatarUrl?: string;
  role?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
}

interface CashTransaction {
  id: string;
  date: string;
  voucherNumber: string;
  description: string;
  type: 'receipt' | 'payment';
  amount: number;
  person: string;
}

interface InitialBalanceInfo {
  date: string;
  amount: number;
}

interface KimberryJob {
  id: string;
  monthYear: string;
  job: string;
  booking: string;
  hbl: string;
  line: string;
  cont20: number;
  cont40: number;
  sell: number;
}

interface BankTransaction {
  id: string;
  bank: 'TCB' | 'MB';
  date: string;
  amount: number;
  description: string;
}

interface VatRecord {
  monthYear: string;
  amount: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'X' | 'P' | 'KL' | 'P/2' | 'KL/2' | 'Co' | '';
  note: string;
  attachedFile?: string;
}

// --- Mock Data ---
const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: '1',
    fullName: 'Hoang Dan',
    position: 'Admin',
    name: 'Hoang Dan',
    email: 'hoangdan@gmail.com',
    phone: '0901234567',
    line: 'L1',
    accountNumber: '123456789',
    bankName: 'Vietcombank'
  },
  {
    id: '2',
    fullName: 'Nguyễn Văn A',
    position: 'Giám đốc',
    name: 'A Nguyễn',
    email: 'vana@gmail.com',
    phone: '0901234567',
    line: 'L1',
    accountNumber: '123456789',
    bankName: 'Vietcombank'
  },
  {
    id: '3',
    fullName: 'Phạm Thị B',
    position: 'Kế toán',
    name: 'B Phạm',
    email: 'thib@gmail.com',
    phone: '0907654321',
    line: 'L2',
    accountNumber: '987654321',
    bankName: 'Techcombank'
  }
];

const INITIAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: '1', name: 'Tiền điện' },
  { id: '2', name: 'Tiền nước' },
  { id: '3', name: 'Tiền mạng' },
  { id: '4', name: 'Tiền thuê nhà' },
  { id: '5', name: 'Mua văn phòng phẩm' },
  { id: '6', name: 'Tiếp khách' },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: '1',
    date: '2026-04-20',
    type: 'Mua văn phòng phẩm',
    amount: 1500000,
    submitter: 'Yaang',
    invoiceFile: 'https://images.unsplash.com/photo-1554224155-1697439ceff5?auto=format&fit=crop&q=80&w=400',
    isApproved: true,
    isSettled: false
  },
  {
    id: '2',
    date: '2026-04-25',
    type: 'Tiền điện tháng 4',
    amount: 5200000,
    submitter: 'Phạm',
    invoiceFile: 'https://images.unsplash.com/photo-1554224155-1697439ceff5?auto=format&fit=crop&q=80&w=400',
    isApproved: false,
    isSettled: false
  }
];

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  to, 
  isActive, 
  children 
}: { 
  icon?: any, 
  label: string, 
  to?: string, 
  isActive?: boolean,
  children?: React.ReactNode 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = !!children;

  const content = (
    <div 
      className={cn(
        "flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all duration-200 group no-underline cursor-pointer",
        isActive && !hasChildren ? "bg-brand-accent/10 text-brand-accent font-medium shadow-sm" : "hover:bg-slate-200/50 text-slate-600"
      )}
      onClick={() => hasChildren && setIsOpen(!isOpen)}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon size={20} className={cn(isActive && !hasChildren ? "text-brand-accent" : "group-hover:text-slate-900")} />}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {hasChildren && (
        isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
      )}
    </div>
  );

  return (
    <div className="mb-1">
      {to ? <Link to={to} className="block no-underline">{content}</Link> : content}
      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-6 mt-1 space-y-1 overflow-hidden"
          >
            {children}
          </motion.div>
        ) }
      </AnimatePresence>
    </div>
  );
};

const SYSTEM_ACCOUNTS = [
  { username: 'TeddyDiem', password: 'JwcLH@100', role: 'Manager' as UserRole },
  { username: 'IrisHuynh', password: 'JwcLH@856', role: 'Admin' as UserRole },
  { username: 'SallyYen', password: 'JwcLH@561', role: 'Accountant' as UserRole },
  { username: 'TinaThao', password: 'JwcLH@890', role: 'Accountant' as UserRole },
];

const Login = ({ onLogin }: { onLogin: (user: { username: string, role: UserRole }) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = SYSTEM_ACCOUNTS.find(a => a.username === username && a.password === password);
    if (account) {
      onLogin({ username: account.username, role: account.role });
    } else {
      setError('Sai tên đăng nhập hoặc mật khẩu');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-brand-accent" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">KIMBERRY SYSTEM</h1>
          <p className="text-slate-500 text-sm mt-2">Dành cho Khách hàng & Nhân viên</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Tên đăng nhập</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                placeholder="TeddyDiem, IrisHuynh..."
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            className="w-full bg-brand-accent text-white py-3 rounded-xl font-bold shadow-lg shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all active:scale-[0.98]"
          >
            Đăng nhập
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-xs italic">
            Phiên bản 1.0.0 - Bế mật quân sự
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ username: string, role: UserRole } | null>(null);

  // States moved from old App
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(INITIAL_EXPENSE_CATEGORIES);
  
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [initialBalance, setInitialBalance] = useState<InitialBalanceInfo>({ date: new Date().toISOString().split('T')[0], amount: 0 });
  const [kimberryJobs, setKimberryJobs] = useState<KimberryJob[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [vatRecords, setVatRecords] = useState<VatRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  
  const [editEmp, setEditEmp] = useState<Employee | undefined>();
  const [editCat, setEditCat] = useState<ExpenseCategory | undefined>();

  const [receiptCount, setReceiptCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);

  const addActivity = (content: string, type: 'submit' | 'approve' | 'settle' | 'other') => {
    setActivities(prev => {
      const newActivities = [
        { id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString(), content, type },
        ...prev
      ];
      return newActivities.slice(0, 20);
    });
  };

  const handleUpdateAttendance = (record: AttendanceRecord) => {
    const existingIndex = attendanceRecords.findIndex(r => r.employeeId === record.employeeId && r.date === record.date);
    if (existingIndex >= 0) {
      const newRecords = [...attendanceRecords];
      newRecords[existingIndex] = record;
      setAttendanceRecords(newRecords);
    } else {
      setAttendanceRecords([...attendanceRecords, record]);
    }
  };

  const handleAddKimberryJob = (j: Omit<KimberryJob, 'id'>) => {
    setKimberryJobs([...kimberryJobs, { id: Math.random().toString(36).substring(2, 9), ...j }]);
  };

  const handleEditKimberryJob = (j: KimberryJob) => {
    setKimberryJobs(kimberryJobs.map(job => job.id === j.id ? j : job));
  };

  const handleDeleteKimberryJob = (id: string) => {
    if (confirm('Xác nhận xóa job này?')) {
      setKimberryJobs(kimberryJobs.filter(job => job.id !== id));
    }
  };

  const handleAddBankTransaction = (t: Omit<BankTransaction, 'id'>) => {
    setBankTransactions([...bankTransactions, { id: Math.random().toString(36).substring(2, 9), ...t }]);
  };

  const handleEditBankTransaction = (t: BankTransaction) => {
    setBankTransactions(bankTransactions.map(tx => tx.id === t.id ? t : tx));
  };

  const handleDeleteBankTransaction = (id: string) => {
    if (confirm('Xác nhận xóa giao dịch này?')) {
      setBankTransactions(bankTransactions.filter(tx => tx.id !== id));
    }
  };

  const handleUpdateVat = (r: VatRecord) => {
    const existingIndex = vatRecords.findIndex(v => v.monthYear === r.monthYear);
    if (existingIndex >= 0) {
      const newRecords = [...vatRecords];
      newRecords[existingIndex] = r;
      setVatRecords(newRecords);
    } else {
      setVatRecords([...vatRecords, r]);
    }
  };

  const handleSaveExpense = (data: Partial<Expense>) => {
    const newExpense: Expense = {
      id: Math.random().toString(36).substring(2, 9),
      date: data.date!,
      type: data.type!,
      amount: Number(data.amount) || 0,
      submitter: currentUser?.username || 'System',
      invoiceFile: data.invoiceFile || 'https://images.unsplash.com/photo-1554224155-1697439ceff5?auto=format&fit=crop&q=80&w=400',
      isApproved: false,
      isSettled: false
    };
    setExpenses([newExpense, ...expenses]);
    addActivity(`${currentUser?.username} đã gửi yêu cầu quyết toán ${new Intl.NumberFormat('vi-VN').format(newExpense.amount)} vnđ cho hoá đơn ${newExpense.type}`, 'submit');
    setIsModalOpen(false);
  };

  const handleApprove = (id: string) => {
    setExpenses(expenses.map(ex => {
      if (ex.id === id) {
        addActivity(`Cấp quản lý đã phê duyệt yêu cầu quyết toán ${ex.type} của ${ex.submitter}`, 'approve');
        return { ...ex, isApproved: true };
      }
      return ex;
    }));
  };

  const handleSettle = (id: string) => {
    setExpenses(expenses.map(ex => {
      if (ex.id === id) {
        addActivity(`Kế toán đã quyết toán hoá đơn ${ex.type} cho ${ex.submitter} với số tiền ${new Intl.NumberFormat('vi-VN').format(ex.amount)} vnđ`, 'settle');
        return { ...ex, isSettled: true };
      }
      return ex;
    }));
  };

  const handleSaveEmployee = (data: Partial<Employee>) => {
    if (editEmp) {
      setEmployees(employees.map(e => e.id === editEmp.id ? { ...e, ...data } as Employee : e));
    } else {
      const newEmp: Employee = {
        id: Math.random().toString(36).substring(2, 9),
        ...data
      } as Employee;
      setEmployees([...employees, newEmp]);
    }
    setIsEmpModalOpen(false);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Xác nhận xóa nhân viên này?')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleSaveCategory = (data: Partial<ExpenseCategory>) => {
    if (editCat) {
      setExpenseCategories(expenseCategories.map(c => c.id === editCat.id ? { ...c, ...data } as ExpenseCategory : c));
    } else {
      const newCat: ExpenseCategory = {
        id: Math.random().toString(36).substring(2, 9),
        ...data
      } as ExpenseCategory;
      setExpenseCategories([...expenseCategories, newCat]);
    }
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Xác nhận xóa loại chi phí này?')) {
      setExpenseCategories(expenseCategories.filter(c => c.id !== id));
    }
  };

  const handleAddCashTransaction = (t: Omit<CashTransaction, 'id' | 'voucherNumber'>) => {
    let vn = '';
    if (t.type === 'receipt') {
      vn = `PT${String(receiptCount + 1).padStart(5, '0')}`;
      setReceiptCount(prev => prev + 1);
    } else {
      vn = `PC${String(paymentCount + 1).padStart(5, '0')}`;
      setPaymentCount(prev => prev + 1);
    }
    
    const newTx: CashTransaction = {
      id: Math.random().toString(36).substring(2, 9),
      voucherNumber: vn,
      ...t
    };
    setCashTransactions([...cashTransactions, newTx]);
  };

  const handleEditCashTransaction = (t: CashTransaction) => {
    setCashTransactions(cashTransactions.map(tx => tx.id === t.id ? t : tx));
  };

  const handleDeleteCashTransaction = (id: string) => {
    if (confirm('Xác nhận xóa chứng từ này?')) {
      setCashTransactions(cashTransactions.filter(tx => tx.id !== id));
    }
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const currentUserAvatar = `https://ui-avatars.com/api/?name=${currentUser.username}&background=random`;

  return (
    <Router>
      <Layout 
        role={currentUser.role} 
        setRole={() => {}} 
        currentUserName={currentUser.username}
        currentUserAvatar={currentUserAvatar}
        onLogout={() => setCurrentUser(null)}
      >
        <Routes>
          <Route path="/" element={<WelcomeView onOpenModal={() => setIsModalOpen(true)} userName={currentUser.username} activities={activities} />} />
          <Route path="/bao-cao" element={<WelcomeView onOpenModal={() => setIsModalOpen(true)} userName={currentUser.username} activities={activities} />} />
          <Route path="/phe-duyet" element={<ApprovalView expenses={expenses} role={currentUser.role} onApprove={handleApprove} onSettle={handleSettle} />} />
          <Route path="/tai-chinh/nhat-ky" element={
            <CashBookView 
              transactions={cashTransactions}
              initialBalance={initialBalance}
              onAddTransaction={handleAddCashTransaction}
              onEditTransaction={handleEditCashTransaction}
              onDeleteTransaction={handleDeleteCashTransaction}
              onUpdateInitialBalance={setInitialBalance}
            />
          } />
          <Route path="/tai-chinh/luu-chuyen" element={
            <CashBookView 
              transactions={cashTransactions}
              initialBalance={initialBalance}
              onAddTransaction={handleAddCashTransaction}
              onEditTransaction={handleEditCashTransaction}
              onDeleteTransaction={handleDeleteCashTransaction}
              onUpdateInitialBalance={setInitialBalance}
            />
          } />
          <Route path="/tai-chinh/kimberry" element={
            <KimberryView
              jobs={kimberryJobs}
              onAddJob={handleAddKimberryJob}
              onEditJob={handleEditKimberryJob}
              onDeleteJob={handleDeleteKimberryJob}
            />
          } />
          <Route path="/tai-chinh/balance" element={
            <BalanceView 
              transactions={bankTransactions}
              vatRecords={vatRecords}
              kimberryJobs={kimberryJobs}
              onAddTransaction={handleAddBankTransaction}
              onEditTransaction={handleEditBankTransaction}
              onDeleteTransaction={handleDeleteBankTransaction}
              onUpdateVat={handleUpdateVat}
            />
          } />
          <Route path="/nhan-vien/cham-cong" element={<AttendanceView employees={employees} attendanceRecords={attendanceRecords} onUpdateAttendance={handleUpdateAttendance} />} />
          <Route path="/nhan-vien/nghi-phep" element={<LeaveManagementView employees={employees} attendanceRecords={attendanceRecords} onUpdateAttendance={handleUpdateAttendance} />} />
          <Route path="/hanh-chinh/nhan-vien" element={
            <EmployeeManagementView 
              employees={employees} 
              onAdd={() => { setEditEmp(undefined); setIsEmpModalOpen(true); }}
              onEdit={(e) => { setEditEmp(e); setIsEmpModalOpen(true); }}
              onDelete={handleDeleteEmployee}
            />
          } />
          <Route path="/cong-viec/pricing/freights" element={<FreightsView username={currentUser.username} />} />
          <Route path="/cong-viec/pricing/local-charges" element={<LocalChargesView />} />
          <Route path="/cong-viec/pricing/services" element={<ServicesView />} />
          <Route path="/cong-viec/pricing/custom-charge" element={<CustomChargeView />} />
          <Route path="/cong-viec/pricing/sales-request" element={<SalesRequestView />} />
          <Route path="/cong-viec/setting" element={<div className="p-8 font-bold">Settings View</div>} />
        </Routes>

        <SendExpenseModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveExpense}
          categories={expenseCategories}
          onAddCategory={() => { setEditCat(undefined); setIsCatModalOpen(true); }}
        />

        <EmployeeModal 
          isOpen={isEmpModalOpen} 
          onClose={() => setIsEmpModalOpen(false)}
          onSave={handleSaveEmployee}
          editData={editEmp}
        />

        <CategoryModal 
          isOpen={isCatModalOpen} 
          onClose={() => setIsCatModalOpen(false)}
          onSave={handleSaveCategory}
          editData={editCat}
        />
      </Layout>
    </Router>
  );
}

const Layout = ({ 
  children, 
  role, 
  setRole,
  currentUserAvatar,
  currentUserName,
  onLogout
}: { 
  children: React.ReactNode, 
  role: UserRole, 
  setRole: (r: UserRole) => void,
  currentUserAvatar?: string,
  currentUserName: string,
  onLogout?: () => void
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col shadow-sm",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-50">
          <div className="w-12 h-12 mr-3 shrink-0">
            <img src="https://i.ibb.co/yc7Zwg89/LOGO-HD.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">LONG HOANG PRO</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">SYSTEM</p>
          </div>
          <button className="lg:hidden ml-auto text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={Home} 
            label="Chào mừng" 
            to="/" 
            isActive={location.pathname === '/'} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Báo cáo tổng quan" 
            to="/bao-cao" 
            isActive={location.pathname === '/bao-cao'} 
          />
          <SidebarItem 
            icon={CheckCircle2} 
            label="Phê duyệt" 
            to="/phe-duyet" 
            isActive={location.pathname === '/phe-duyet'} 
          />

          <div className="mt-8 mb-2 px-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Phân hệ Tài chính</p>
          </div>

          <SidebarItem icon={Wallet} label="Tài chính">
            <SidebarItem label="Nhật ký chi tiêu" to="/tai-chinh/nhat-ky" isActive={location.pathname === '/tai-chinh/nhat-ky'} />
            <SidebarItem label="WCA" to="/tai-chinh/luu-chuyen" isActive={location.pathname === '/tai-chinh/luu-chuyen'} />
            <SidebarItem label="Kimberry" to="/tai-chinh/kimberry" isActive={location.pathname === '/tai-chinh/kimberry'} />
            <SidebarItem label="Balance" to="/tai-chinh/balance" isActive={location.pathname === '/tai-chinh/balance'} />
          </SidebarItem>

          <SidebarItem icon={Users} label="Quản lý nhân viên">
            <SidebarItem label="Chấm công" to="/nhan-vien/cham-cong" isActive={location.pathname === "/nhan-vien/cham-cong"} />
            <SidebarItem label="Quản lý nghỉ phép" to="/nhan-vien/nghi-phep" isActive={location.pathname === "/nhan-vien/nghi-phep"} />
            <SidebarItem label="Lương" to="/nhan-vien/luong" isActive={location.pathname === "/nhan-vien/luong"} />
          </SidebarItem>

          <div className="mt-4">
            <SidebarItem icon={Briefcase} label="Hành chính nhân sự">
              <SidebarItem label="Nhân viên" to="/hanh-chinh/nhan-vien" isActive={location.pathname === "/hanh-chinh/nhan-vien"} />
              <SidebarItem label="Chi phí" to="/hanh-chinh/chi-phi" isActive={location.pathname === "/hanh-chinh/chi-phi"} />
            </SidebarItem>
          </div>

          <div className="mt-8 mb-2 px-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Phân hệ Công việc</p>
          </div>

          <SidebarItem icon={DollarSign} label="Pricing">
            <SidebarItem label="Freights" to="/cong-viec/pricing/freights" isActive={location.pathname === "/cong-viec/pricing/freights"} />
            <SidebarItem label="Local charges" to="/cong-viec/pricing/local-charges" isActive={location.pathname === "/cong-viec/pricing/local-charges"} />
            <SidebarItem label="Services" to="/cong-viec/pricing/services" isActive={location.pathname === "/cong-viec/pricing/services"} />
            <SidebarItem label="Custom Charge" to="/cong-viec/pricing/custom-charge" isActive={location.pathname === "/cong-viec/pricing/custom-charge"} />
            <SidebarItem label="Sales Request" to="/cong-viec/pricing/sales-request" isActive={location.pathname === "/cong-viec/pricing/sales-request"} />
          </SidebarItem>

          <SidebarItem icon={ShoppingCart} label="Sales">
            <SidebarItem label="Quotes" to="/cong-viec/sales/quotes" isActive={location.pathname === "/cong-viec/sales/quotes"} />
            <SidebarItem label="Customer Request" to="/cong-viec/sales/customer-request" isActive={location.pathname === "/cong-viec/sales/customer-request"} />
          </SidebarItem>

          <SidebarItem icon={Settings} label="Setting" to="/cong-viec/setting" isActive={location.pathname === "/cong-viec/setting"} />
        </nav>

        <div className="p-4 border-t border-slate-100 italic text-[10px] text-slate-400 uppercase tracking-tighter text-center">
          Powered by Google AI Studio
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center">
            <button 
              className="lg:hidden p-2 -ml-2 mr-2 text-slate-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhanh..." 
                className="bg-slate-100 border-none rounded-full py-1.5 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-brand-accent/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 bg-red-50 px-2 py-1 rounded"
              >
                Đăng xuất
              </button>
            )}
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">{currentUserName}</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{role}</p>
              </div>
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200 group-hover:border-slate-300 transition-colors overflow-hidden">
                {currentUserAvatar ? (
                  <img src={currentUserAvatar} alt={currentUserName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={20} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

// --- Modal ---

const SendExpenseModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  categories,
  onAddCategory
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (data: Partial<Expense>) => void,
  categories: ExpenseCategory[],
  onAddCategory: () => void
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '',
    amount: '',
    invoiceFile: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#00875A] text-white">
          <h3 className="text-lg font-bold">Lập lệnh Quyết toán</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Ngày ghi nhận</label>
            <input 
              type="date" 
              value={formData.date}
              disabled
              className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-sm font-medium text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Loại chi phí</label>
            <div className="flex gap-2">
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] outline-none transition-all"
              >
                <option value="" disabled>-- Chọn loại chi phí --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button 
                onClick={onAddCategory}
                className="shrink-0 bg-[#00875A] text-white w-10 h-10 rounded-lg flex items-center justify-center hover:brightness-110 transition-all font-bold text-lg"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Số tiền (VNĐ)</label>
            <input 
              type="number" 
              placeholder="0.000"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Hóa đơn đính kèm</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative">
              <Upload size={24} className="text-slate-400 group-hover:text-[#00875A] mb-2" />
              <p className="text-xs text-slate-500 font-medium">Bấm để tải lên hoặc kéo thả vào đây</p>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) setFormData({...formData, invoiceFile: URL.createObjectURL(file)});
                }}
              />
              {formData.invoiceFile && (
                <div className="mt-2 text-[10px] text-[#00875A] font-bold">✓ Đã chọn file</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-1 py-2.5 rounded-lg bg-[#00875A] text-white text-sm font-bold shadow-lg shadow-[#00875A]/20 hover:brightness-110 active:scale-95 transition-all"
          >
            Lưu lệnh
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Views ---

const WelcomeView = ({ onOpenModal, userName, activities }: { onOpenModal: () => void, userName: string, activities: Activity[] }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => date.toLocaleTimeString('en-GB', { hour12: false });
  const formatDateDay = (date: Date) => {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return `${days[date.getDay()]}, ${formatDateDDMMYYYY(date)}`;
  };
  const formatDateLong = (date: Date) => formatDateDay(date);
  const formatDateShort = (date: Date) => formatDateDay(date);

  // Calculate leave days: 1 day per month starting from January
  const currentMonth = now.getMonth() + 1; // 1-12
  const leaveDaysRemaining = currentMonth; // Simple logic: 1 day/month
  const attendanceDays = 22; // Mocked value for attendance days

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submit': return <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100"><FileText size={20} /></div>;
      case 'approve': return <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100"><FileText size={20} /></div>;
      case 'settle': return <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100"><FileText size={20} /></div>;
      default: return <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-100"><FileText size={20} /></div>;
    }
  };

  return (
    <div id="welcome-view" className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#00875A] italic">Chào mừng trở lại, {userName}!</h2>
          <p className="text-slate-500 font-medium tracking-tight">{formatDateLong(now)}</p>
        </div>
        <button 
          onClick={onOpenModal}
          className="bg-white border border-slate-200 px-6 py-2.5 rounded-lg font-bold flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-all shadow-sm group"
        >
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#00875A] group-hover:text-white transition-colors">
            <FileText size={16} />
          </div>
          Quyết toán
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-slate-700">
            <div className="p-1.5 bg-blue-50 rounded-full"><CalendarCheck size={18} className="text-blue-600" /></div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Hệ thống chấm công</h3>
          </div>

          <div className="text-center space-y-1 py-4">
            <h4 className="text-5xl font-bold text-slate-800 tracking-widest font-mono">{formatTime(now)}</h4>
            <p className="text-slate-400 text-sm font-medium">{formatDateShort(now)}</p>
          </div>

          <div className="bg-[#f8faff] p-5 rounded-2xl border border-blue-50 space-y-4">
            <h5 className="font-bold text-[#1e3a8a] text-xs uppercase tracking-wider">Thông tin chấm công</h5>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              {[
                { label: 'Giờ vào', value: '08:15' },
                { label: 'Giờ ra', value: '17:30' },
                { label: 'Số ngày phép còn lại', value: `${leaveDaysRemaining} ngày` },
                { label: 'Số ngày chấm công', value: `${attendanceDays} ngày` }
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-bold text-slate-700">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center mt-4">
            <p className="text-xs text-slate-400 italic font-medium tracking-tight">Hệ thống chấm công được liên kết tự động với thiết bị. Giờ vào và giờ ra sẽ được cập nhật tự động.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6 flex flex-col">
          <div className="flex items-center gap-3 text-slate-700">
            <div className="p-1.5 bg-indigo-50 rounded-full"><TrendingUp size={18} className="text-indigo-600" /></div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Hoạt động gần đây</h3>
          </div>

          <div className="flex-1 space-y-1 pt-4 overflow-y-auto custom-scrollbar pr-1">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4">Chưa có hoạt động nào</p>
            ) : (
              activities.map(act => (
                <div key={act.id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
                  {getActivityIcon(act.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-medium group-hover:text-[#00875A] transition-colors">{act.content}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-wider">{formatDateDDMMYYYY(act.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ApprovalView = ({ 
  expenses, 
  role, 
  onApprove, 
  onSettle 
}: { 
  expenses: Expense[], 
  role: UserRole,
  onApprove: (id: string) => void,
  onSettle: (id: string) => void
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);

  const handleConfirmApprove = () => {
    if (confirmApproveId) {
      onApprove(confirmApproveId);
      setConfirmApproveId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 italic">Quản lý Phê duyệt</h2>
        <div className="flex gap-2">
            <div className="bg-white border p-1 rounded-lg flex items-center gap-2 px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quyền hạn hiện tại:</span>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{role}</span>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ngày</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Người lập</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loại chi phí</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số tiền</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hóa đơn</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phê duyệt (Manager)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quyết toán (Acc)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDateDDMMYYYY(ex.date)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold">{ex.submitter[0]}</div>
                      <span className="text-sm font-bold text-slate-800">{ex.submitter}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{ex.type}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{new Intl.NumberFormat('vi-VN').format(ex.amount)} đ</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedInvoice(ex.invoiceFile)}
                      className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase",
                      ex.isApproved ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {ex.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase",
                      ex.isSettled ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {ex.isSettled ? 'Đã quyết toán' : 'Chưa quyết toán'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                       {role === 'Manager' || role === 'Admin' ? (
                          <button 
                            disabled={ex.isApproved}
                            onClick={() => setConfirmApproveId(ex.id)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              ex.isApproved ? "text-slate-300 pointer-events-none" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                            )}
                          >
                            <Check size={16} />
                          </button>
                       ) : null}
                       
                       {role === 'Accountant' || role === 'Admin' ? (
                          <button 
                            disabled={!ex.isApproved || ex.isSettled}
                            onClick={() => onSettle(ex.id)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              (!ex.isApproved || ex.isSettled) ? "text-slate-200 pointer-events-none" : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                            )}
                          >
                            <Receipt size={16} />
                          </button>
                       ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full"
            >
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="absolute -top-12 right-0 text-white hover:text-red-400 p-2"
              >
                <X size={32} />
              </button>
              <img src={selectedInvoice} alt="Invoice" className="w-full rounded-2xl shadow-2xl border-4 border-white" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Approve Modal */}
      <AnimatePresence>
        {confirmApproveId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center text-slate-800">
                <h3 className="text-lg font-bold">Xác nhận</h3>
                <button onClick={() => setConfirmApproveId(null)} className="hover:bg-slate-100 p-1 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-slate-600 text-center">Quyết định phê duyệt để kế toán quyết toán Đồng ý / Hủy?</p>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setConfirmApproveId(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all">Huỷ</button>
                <button onClick={handleConfirmApprove} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:brightness-110 active:scale-95 transition-all">Đồng ý</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CashBookView = ({
  transactions,
  initialBalance,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onUpdateInitialBalance
}: {
  transactions: CashTransaction[];
  initialBalance: InitialBalanceInfo;
  onAddTransaction: (t: Omit<CashTransaction, 'id' | 'voucherNumber'>) => void;
  onEditTransaction: (t: CashTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateInitialBalance: (b: InitialBalanceInfo) => void;
}) => {
  const [filterType, setFilterType] = useState<'all' | 'receipt' | 'payment'>('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [targetPerson, setTargetPerson] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CashTransaction | undefined>();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingDate, setSettingDate] = useState(initialBalance.date);
  const [settingAmount, setSettingAmount] = useState(initialBalance.amount.toString());

  const [formData, setFormData] = useState<Omit<CashTransaction, 'id' | 'voucherNumber'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'receipt',
    amount: 0,
    person: ''
  });

  const handleOpenModal = (item?: CashTransaction) => {
    if (item) {
      setEditItem(item);
      setFormData({
        date: item.date,
        description: item.description,
        type: item.type,
        amount: item.amount,
        person: item.person
      });
    } else {
      setEditItem(undefined);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'receipt',
        amount: 0,
        person: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      onEditTransaction({ ...editItem, ...formData });
    } else {
      onAddTransaction(formData);
    }
    setIsModalOpen(false);
  };

  const handleSaveSettings = () => {
    onUpdateInitialBalance({ date: settingDate, amount: Number(settingAmount) || 0 });
    setIsSettingsOpen(false);
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importHistory, setImportHistory] = useState([
    { id: '1', date: 'Mar 13, 2026 16:50:49', fileName: 'Import_Cash_Book_Q1.xlsx', user: 'TeddyDiem' },
    { id: '2', date: 'Jan 21, 2026 14:47:46', fileName: 'Expenses_2025_Final.xlsx', user: 'IrisHuynh' },
  ]);

  const handleDownloadTemplate = () => {
    const templateData = [
      { 'Ngày (YYYY-MM-DD)': '2024-05-20', 'Diễn giải': 'Thu tiền bán hàng', 'Đối tượng': 'Khách hàng A', 'Số tiền': 5000000, 'Loại (Thu/Chi)': 'Thu' },
      { 'Ngày (YYYY-MM-DD)': '2024-05-21', 'Diễn giải': 'Thanh toán tiền điện', 'Đối tượng': 'EVN', 'Số tiền': 1200000, 'Loại (Thu/Chi)': 'Chi' },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Kimberry_CashBook_Template.xlsx");
  };

  const handleImportExcel = (data: any[], fileName: string) => {
    const newTransactions: Omit<CashTransaction, 'id' | 'voucherNumber'>[] = data.map(item => ({
      date: item['Ngày (YYYY-MM-DD)'] || new Date().toISOString().split('T')[0],
      description: item['Diễn giải'] || 'Import from Excel',
      person: item['Đối tượng'] || '-',
      amount: Number(item['Số tiền']) || 0,
      type: (item['Loại (Thu/Chi)']?.toLowerCase() === 'thu' || item['Loại (Thu/Chi)']?.toLowerCase() === 'receipt') ? 'receipt' : 'payment'
    }));

    newTransactions.forEach(t => onAddTransaction(t));
    
    setImportHistory(prev => [
      { id: Math.random().toString(36).substring(2, 9), date: new Date().toLocaleString(), fileName, user: 'Hoang Dan' },
      ...prev.slice(0, 5)
    ]);
    
    setIsImportModalOpen(false);
    alert(`Đã import thành công ${newTransactions.length} chứng từ.`);
  };

  const handleExportExcel = () => {
    // Sort transactions properly before exporting
    const sortedForExport = [...transactions].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.id.localeCompare(b.id);
    });

    let runningBal = initialBalance.amount;
    const dataToExport = sortedForExport.map(t => {
      if (t.date >= initialBalance.date) {
        if (t.type === 'receipt') runningBal += t.amount;
        else runningBal -= t.amount;
      }
      
      return {
        'Ngày': formatDateDDMMYYYY(t.date),
        'Số chứng từ': t.voucherNumber,
        'Diễn giải': t.description,
        'Đối tượng': t.person,
        'Thu': t.type === 'receipt' ? t.amount : 0,
        'Chi': t.type === 'payment' ? t.amount : 0,
        'Số dư': runningBal
      };
    });

    // Add initial balance row at top
    dataToExport.unshift({
      'Ngày': formatDateDDMMYYYY(initialBalance.date),
      'Số chứng từ': '-',
      'Diễn giải': 'Số dư đầu kỳ',
      'Đối tượng': '-',
      'Thu': initialBalance.amount >= 0 ? initialBalance.amount : 0,
      'Chi': initialBalance.amount < 0 ? Math.abs(initialBalance.amount) : 0,
      'Số dư': initialBalance.amount
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "NhatKyChiTieu");

    // Set column widths
    const wscols = [
      {wch: 12}, // Ngày
      {wch: 15}, // Số chứng từ
      {wch: 40}, // Diễn giải
      {wch: 25}, // Đối tượng
      {wch: 15}, // Thu
      {wch: 15}, // Chi
      {wch: 15}  // Số dư
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Nhat_Ky_Chi_Tieu_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Sort and calculate balance
  // We should sort transactions by date ascending, then ID ascending to have a stable order
  const sortedAll = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.id.localeCompare(b.id);
  });

  let runningBalance = initialBalance.amount;
  const processedTransactions = sortedAll.map(t => {
    if (t.date >= initialBalance.date) {
        if (t.type === 'receipt') runningBalance += t.amount;
        else runningBalance -= t.amount;
    }
    return { ...t, computedBalance: runningBalance };
  });

  // Then apply filters
  const filtered = processedTransactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (search && !t.voucherNumber.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (fromDate && t.date < fromDate) return false;
    if (toDate && t.date > toDate) return false;
    if (targetPerson && !t.person.toLowerCase().includes(targetPerson.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 italic">Tiền mặt</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Settings size={16} />
            Cài đặt
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload size={16} />
            Import (Excel)
          </button>
          <button 
            onClick={handleExportExcel}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={16} />
            In Sổ (Excel)
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Lập Chứng Từ Mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
             <label className="text-[10px] font-bold text-slate-500 uppercase">LOẠI QUỸ</label>
             <div className="flex rounded-lg overflow-hidden border border-slate-200">
                <button 
                  onClick={() => setFilterType('all')} 
                  className={cn("flex-1 py-2 text-xs font-bold transition-colors", filterType === 'all' ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
                >
                  Tất cả
                </button>
                <div className="w-px bg-slate-200"></div>
                <button 
                  onClick={() => setFilterType('receipt')} 
                  className={cn("flex-1 py-2 text-xs font-bold transition-colors", filterType === 'receipt' ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
                >
                  Thu
                </button>
                <div className="w-px bg-slate-200"></div>
                <button 
                  onClick={() => setFilterType('payment')} 
                  className={cn("flex-1 py-2 text-xs font-bold transition-colors", filterType === 'payment' ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
                >
                  Chi
                </button>
             </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">TÌM KIẾM</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Số phiếu, nội dung..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">TỪ NGÀY</label>
            <input 
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">ĐẾN NGÀY</label>
            <input 
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">ĐỐI TƯỢNG</label>
            <input 
              type="text"
              placeholder="Người nộp/nhận..."
              value={targetPerson}
              onChange={e => setTargetPerson(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Ngày CT</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Số phiếu</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap min-w-[200px]">Diễn giải</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Thu (Nợ)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Chi (Có)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Số tồn</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Người nhận/Nộp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic font-medium text-sm">
                    Chưa có giao dịch nào được ghi lại
                  </td>
                </tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">{formatDateDDMMYYYY(t.date)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 whitespace-nowrap">{t.voucherNumber}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{t.description}</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">{t.type === 'receipt' ? new Intl.NumberFormat('vi-VN').format(t.amount) : ''}</td>
                  <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right whitespace-nowrap">{t.type === 'payment' ? new Intl.NumberFormat('vi-VN').format(t.amount) : ''}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(t.computedBalance)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{t.person}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(t)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteTransaction(t.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Write transaction modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#2563eb] text-white">
                <h3 className="text-lg font-bold">{editItem ? 'Sửa chứng từ' : 'Lập chứng từ mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Loại chứng từ</label>
                    <select 
                      value={formData.type} 
                      onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="receipt">Thu tiền (Nợ)</option>
                      <option value="payment">Chi tiền (Có)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ngày chứng từ</label>
                    <input 
                      type="date" 
                      value={formData.date} 
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Số tiền</label>
                  <input 
                    type="number" 
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="Nhập số tiền..." 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Diễn giải</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="VD: Thu tiền bán hàng..." 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Người nhận / Nộp</label>
                  <input 
                    type="text" 
                    value={formData.person}
                    onChange={e => setFormData({ ...formData, person: e.target.value })}
                    placeholder="VD: Nguyễn Văn A" 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all">Hủy bỏ</button>
                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-[#2563eb] text-white text-sm font-bold hover:brightness-110 active:scale-95 transition-all">Lưu chứng từ</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center text-slate-800">
                <h3 className="text-lg font-bold">Cài đặt số dư ban đầu</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="hover:bg-slate-100 p-1 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ngày chốt số dư</label>
                  <input 
                    type="date" 
                    value={settingDate}
                    onChange={e => setSettingDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Số dư tiền mặt</label>
                  <input 
                    type="number" 
                    value={settingAmount}
                    onChange={e => setSettingAmount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all">Đóng</button>
                <button onClick={handleSaveSettings} className="flex-1 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:brightness-110 active:scale-95 transition-all">Lưu cập nhật</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImportExcelModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExcel}
        onDownloadTemplate={handleDownloadTemplate}
        history={importHistory}
      />
    </div>
  );
};

interface ImportHistoryItem {
  id: string;
  date: string;
  fileName: string;
  user: string;
}

const ImportExcelModal = ({ 
  isOpen, 
  onClose, 
  onImport, 
  onDownloadTemplate,
  history 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onImport: (data: any[], fileName: string) => void,
  onDownloadTemplate: () => void,
  history: ImportHistoryItem[]
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
    } else {
      alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processFile = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        onImport(data, file.name);
        setFile(null);
      } catch (error) {
        alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng file.');
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#f8fafc] rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh]"
      >
        <div className="flex-1 p-10 bg-white">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-800">Select File <span className="text-red-500 font-normal">*</span></h3>
            <button onClick={onClose} className="md:hidden p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center transition-all cursor-pointer",
              isDragging ? "border-blue-400 bg-blue-50/50" : "border-blue-200 bg-slate-50/30 hover:bg-slate-50 hover:border-blue-300",
              file ? "border-emerald-500 bg-emerald-50/30" : ""
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden" 
              accept=".xlsx,.xls"
            />
            <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-3xl flex items-center justify-center mb-6">
              {file ? (
                <FileSpreadsheet className="text-emerald-500" size={36} />
              ) : (
                <CloudUpload className="text-slate-400" size={36} />
              )}
            </div>
            {file ? (
              <div className="text-center">
                <p className="font-bold text-slate-800 text-lg mb-1">{file.name}</p>
                <p className="text-sm text-slate-500 font-medium tracking-wide">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-slate-600 font-semibold text-lg">
                  Drop files here or <span className="text-blue-500 hover:underline">click to upload</span>
                </p>
                <p className="text-xs text-slate-400 mt-3 font-medium uppercase tracking-wider">excel files with a size less than 5mb</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button 
              onClick={(e) => { e.stopPropagation(); onDownloadTemplate(); }}
              className="text-blue-500 hover:text-blue-600 text-sm font-bold flex items-center gap-2 w-fit transition-colors"
            >
              <Download size={16} />
              <span className="underline underline-offset-4">Download template</span>
            </button>
          </div>

          <div className="flex gap-4 mt-12">
            <button 
              onClick={onClose}
              className="px-8 py-3.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={processFile}
              disabled={!file}
              className={cn(
                "flex-1 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg active:scale-[0.98]",
                file ? "bg-[#2563eb] hover:bg-blue-600 shadow-blue-500/20" : "bg-slate-300 cursor-not-allowed shadow-none"
              )}
            >
              Next
            </button>
          </div>
        </div>

        <div className="w-full md:w-[400px] p-10 border-l border-slate-100 bg-[#f8fafc] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <History size={16} className="text-slate-600" />
              </div>
              Import History
            </h3>
            <button onClick={onClose} className="hidden md:block p-2 hover:bg-slate-200 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-8 relative ml-4 border-l border-slate-200 pl-8 pb-4">
            <p className="text-[11px] font-bold text-slate-400 mb-8 uppercase tracking-widest -ml-4 bg-[#f8fafc] py-1 px-2 w-fit z-10 sticky top-0">
               Recent Imports
            </p>
            
            {history.map((item, idx) => (
              <div key={item.id} className="relative">
                <div className={cn(
                  "absolute -left-[37px] top-1.5 w-4 h-4 rounded-full border-[3px] border-[#f8fafc] shadow-sm z-20",
                  idx === 0 ? "bg-purple-500" : idx === 1 ? "bg-slate-900" : "bg-blue-400"
                )}></div>
                <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">{item.date}</div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all group">
                  <p className="text-[13px] text-slate-700 leading-relaxed mb-3">
                    Upload <span className="font-bold text-slate-900 break-all">{item.fileName}</span> by <span className="font-bold text-slate-900">{item.user}</span>
                  </p>
                  <div className="flex gap-4 font-bold text-[10px] uppercase tracking-widest">
                    <button className="text-slate-400 hover:text-slate-800">View details</button>
                    <button className="text-blue-500 hover:text-blue-700">Download</button>
                  </div>
                </div>
              </div>
            ))}
            
            {history.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <History size={40} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">No import history found</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const KimberryView = ({
  jobs,
  onAddJob,
  onEditJob,
  onDeleteJob,
}: {
  jobs: KimberryJob[];
  onAddJob: (j: Omit<KimberryJob, 'id'>) => void;
  onEditJob: (j: KimberryJob) => void;
  onDeleteJob: (id: string) => void;
}) => {
  const [filterMonth, setFilterMonth] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<KimberryJob | undefined>();
  const [formData, setFormData] = useState<Omit<KimberryJob, 'id'>>({
    monthYear: new Date().toISOString().slice(0, 7), // YYYY-MM
    job: '',
    booking: '',
    hbl: '',
    line: '',
    cont20: 0,
    cont40: 0,
    sell: 0,
  });

  const handleOpenModal = (item?: KimberryJob) => {
    if (item) {
      setEditItem(item);
      setFormData({
        monthYear: item.monthYear,
        job: item.job,
        booking: item.booking,
        hbl: item.hbl,
        line: item.line,
        cont20: item.cont20,
        cont40: item.cont40,
        sell: item.sell,
      });
    } else {
      setEditItem(undefined);
      setFormData({
        monthYear: new Date().toISOString().slice(0, 7),
        job: '',
        booking: '',
        hbl: '',
        line: '',
        cont20: 0,
        cont40: 0,
        sell: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      onEditJob({ ...editItem, ...formData });
    } else {
      onAddJob(formData);
    }
    setIsModalOpen(false);
  };

  const filtered = jobs.filter(j => !filterMonth || j.monthYear === filterMonth);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 italic">Kimberry Jobs</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => alert('Chức năng đồng bộ đang được phát triển')}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
            Đồng bộ Web
          </button>
          <button 
            onClick={() => alert('Chức năng upload excel đang được phát triển')}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Upload size={16} />
            Import (Excel)
          </button>
          <button 
            onClick={() => alert('Chức năng export excel đang được phát triển')}
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={16} />
            Export (Excel)
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Thêm Job
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-end gap-4">
        <div className="space-y-1.5 w-64">
          <label className="text-[10px] font-bold text-slate-500 uppercase">LỌC THEO THÁNG</label>
          <input 
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        {filterMonth && (
          <button 
            onClick={() => setFilterMonth('')}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-transparent"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Tháng/Năm</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Job</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Booking</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">HBL</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Line</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Cont 20</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Cont 40</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Sell</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic font-medium text-sm">
                    Chưa có job nào
                  </td>
                </tr>
              ) : filtered.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">{j.monthYear}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 whitespace-nowrap">{j.job}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{j.booking}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{j.hbl}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{j.line}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium text-right">{j.cont20}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium text-right">{j.cont40}</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(j.sell)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(j)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteJob(j.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Write transaction modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#2563eb] text-white">
                <h3 className="text-lg font-bold">{editItem ? 'Sửa Job' : 'Thêm Job'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tháng/Năm</label>
                    <input 
                      type="month" 
                      value={formData.monthYear} 
                      onChange={e => setFormData({ ...formData, monthYear: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Job</label>
                    <input 
                      type="text" 
                      value={formData.job}
                      onChange={e => setFormData({ ...formData, job: e.target.value })}
                      placeholder="Nhập tên job..." 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Booking</label>
                    <input 
                      type="text" 
                      value={formData.booking}
                      onChange={e => setFormData({ ...formData, booking: e.target.value })}
                      placeholder="Nhập số booking..." 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">HBL</label>
                    <input 
                      type="text" 
                      value={formData.hbl}
                      onChange={e => setFormData({ ...formData, hbl: e.target.value })}
                      placeholder="Nhập HBL..." 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Line</label>
                  <input 
                    type="text" 
                    value={formData.line}
                    onChange={e => setFormData({ ...formData, line: e.target.value })}
                    placeholder="Nhập Line..." 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Số lượng Cont 20</label>
                    <input 
                      type="number" 
                      value={formData.cont20 || ''}
                      onChange={e => setFormData({ ...formData, cont20: Number(e.target.value) })}
                      placeholder="0" 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Số lượng Cont 40</label>
                    <input 
                      type="number" 
                      value={formData.cont40 || ''}
                      onChange={e => setFormData({ ...formData, cont40: Number(e.target.value) })}
                      placeholder="0" 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-1 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Sell</label>
                    <input 
                      type="number" 
                      value={formData.sell || ''}
                      onChange={e => setFormData({ ...formData, sell: Number(e.target.value) })}
                      placeholder="Số tiền..." 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all">Hủy bỏ</button>
                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-[#2563eb] text-white text-sm font-bold hover:brightness-110 active:scale-95 transition-all">Lưu Job</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BalanceView = ({
  transactions,
  vatRecords,
  kimberryJobs,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onUpdateVat,
}: {
  transactions: BankTransaction[];
  vatRecords: VatRecord[];
  kimberryJobs: KimberryJob[];
  onAddTransaction: (t: Omit<BankTransaction, 'id'>) => void;
  onEditTransaction: (t: BankTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onUpdateVat: (r: VatRecord) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'TCB' | 'MB'>('summary');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<BankTransaction | undefined>();
  const [txFormData, setTxFormData] = useState<Omit<BankTransaction, 'id'>>({
    bank: 'TCB',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
  });

  const [isVatModalOpen, setIsVatModalOpen] = useState(false);
  const [vatFormData, setVatFormData] = useState<VatRecord>({
    monthYear: '',
    amount: 0,
  });

  const handleOpenTxModal = (item?: BankTransaction) => {
    if (item) {
      setEditTx(item);
      setTxFormData({ bank: item.bank, date: item.date, amount: item.amount, description: item.description });
    } else {
      setEditTx(undefined);
      setTxFormData({ bank: activeTab === 'MB' ? 'MB' : 'TCB', date: new Date().toISOString().split('T')[0], amount: 0, description: '' });
    }
    setIsTxModalOpen(true);
  };

  const handleSaveTx = () => {
    if (editTx) {
      onEditTransaction({ ...editTx, ...txFormData });
    } else {
      onAddTransaction(txFormData);
    }
    setIsTxModalOpen(false);
  };

  const handleOpenVatModal = (monthYear: string) => {
    const existing = vatRecords.find(v => v.monthYear === monthYear);
    setVatFormData(existing || { monthYear, amount: 0 });
    setIsVatModalOpen(true);
  };
  
  const handleSaveVat = () => {
    onUpdateVat(vatFormData);
    setIsVatModalOpen(false);
  };

  const renderSummary = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const monthStr = m < 10 ? `0${m}` : `${m}`;
      const monthYear = `${filterYear}-${monthStr}`;
      
      const tcbTotal = transactions.filter(t => t.bank === 'TCB' && t.date.startsWith(monthYear)).reduce((sum, t) => sum + t.amount, 0);
      const mbTotal = transactions.filter(t => t.bank === 'MB' && t.date.startsWith(monthYear)).reduce((sum, t) => sum + t.amount, 0);
      const dnttKim = kimberryJobs.filter(j => j.monthYear === monthYear).reduce((sum, j) => sum + j.sell, 0);
      const vatKim = vatRecords.find(v => v.monthYear === monthYear)?.amount || 0;
      
      const traMB = dnttKim + tcbTotal - mbTotal - vatKim;

      return {
        month: m,
        monthYear,
        tcbTotal,
        mbTotal,
        dnttKim,
        vatKim,
        traMB
      };
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
           <div className="space-y-1.5 w-48">
              <label className="text-[10px] font-bold text-slate-500 uppercase">NĂM TỔNG HỢP</label>
              <input 
                type="number"
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                min="2000"
                max="2100"
              />
            </div>
            <div className="flex mt-6 gap-2">
               <button 
                onClick={() => alert('Chức năng export excel đang được phát triển')}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download size={16} />
                Export (Excel)
              </button>
            </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Tháng</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Kimberry TCB</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Long Hoàng MB</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">DNTT KIM</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">VAT thu KIM</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Trả MB</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {months.map(m => (
                  <tr key={m.month} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 whitespace-nowrap">Tháng {m.month}</td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-600 text-right whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(m.tcbTotal)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600 text-right whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(m.mbTotal)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(m.dnttKim)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(m.vatKim)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(m.traMB)}</td>
                    <td className="px-6 py-4 text-center">
                       <button onClick={() => handleOpenVatModal(m.monthYear)} className="text-xs font-bold text-white bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition">Nhập VAT</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderBankDetails = (bank: 'TCB' | 'MB') => {
    const list = transactions.filter(t => t.bank === bank && (!filterMonth || t.date.startsWith(filterMonth))).sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4 py-4 border-b border-slate-200">
           <div className="flex gap-4">
             <div className="space-y-1.5 w-48">
                <label className="text-[10px] font-bold text-slate-500 uppercase">LỌC THEO THÁNG</label>
                <input 
                  type="month"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex mt-6 gap-2">
                <button 
                  onClick={() => alert('Chức năng upload excel đang được phát triển')}
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Upload size={16} />
                  Import
                </button>
                <button 
                  onClick={() => alert('Chức năng export excel đang được phát triển')}
                  className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Download size={16} />
                  Export
                </button>
              </div>
           </div>
           <button 
            onClick={() => handleOpenTxModal()}
            className="bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Thêm Giao Dịch
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Ngày</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right whitespace-nowrap">Số tiền</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-full">Nội dung</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium text-sm">
                    Chưa có giao dịch
                  </td>
                </tr>
              ) : list.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 whitespace-nowrap">{formatDateDDMMYYYY(t.date)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right whitespace-nowrap">{new Intl.NumberFormat('vi-VN').format(t.amount)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t.description}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenTxModal(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={16} /></button>
                      <button onClick={() => onDeleteTransaction(t.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><X size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 italic">Balance</h2>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('summary')}
          className={cn("px-6 py-3 text-sm font-bold border-b-2 transition-colors", activeTab === 'summary' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300")}
        >
          Tổng hợp
        </button>
        <button 
          onClick={() => setActiveTab('TCB')}
          className={cn("px-6 py-3 text-sm font-bold border-b-2 transition-colors", activeTab === 'TCB' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300")}
        >
          Techcom Bank
        </button>
        <button 
          onClick={() => setActiveTab('MB')}
          className={cn("px-6 py-3 text-sm font-bold border-b-2 transition-colors", activeTab === 'MB' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300")}
        >
          MB Bank
        </button>
      </div>

      <div>
        {activeTab === 'summary' && renderSummary()}
        {activeTab === 'TCB' && renderBankDetails('TCB')}
        {activeTab === 'MB' && renderBankDetails('MB')}
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isTxModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#2563eb] text-white">
                <h3 className="text-lg font-bold">{editTx ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h3>
                <button onClick={() => setIsTxModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ngân hàng</label>
                    <select 
                      value={txFormData.bank} 
                      onChange={e => setTxFormData({ ...txFormData, bank: e.target.value as 'TCB' | 'MB' })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="TCB">Techcom Bank</option>
                      <option value="MB">MB Bank</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ngày</label>
                    <input 
                      type="date" 
                      value={txFormData.date} 
                      onChange={e => setTxFormData({ ...txFormData, date: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Số tiền</label>
                  <input 
                    type="number" 
                    value={txFormData.amount || ''}
                    onChange={e => setTxFormData({ ...txFormData, amount: Number(e.target.value) })}
                    placeholder="Nhập số tiền..." 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nội dung</label>
                  <input 
                    type="text" 
                    value={txFormData.description}
                    onChange={e => setTxFormData({ ...txFormData, description: e.target.value })}
                    placeholder="Nội dung giao dịch..." 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setIsTxModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all">Hủy bỏ</button>
                <button onClick={handleSaveTx} className="flex-1 py-3 rounded-xl bg-[#2563eb] text-white text-sm font-bold hover:brightness-110 active:scale-95 transition-all">Lưu giao dịch</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VAT Modal */}
      <AnimatePresence>
        {isVatModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center text-slate-800">
                <h3 className="text-lg font-bold">Nhập VAT thu KIM</h3>
                <button onClick={() => setIsVatModalOpen(false)} className="hover:bg-slate-100 p-1 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tháng cập nhật</label>
                  <input type="text" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-500 font-bold outline-none" value={vatFormData.monthYear} />
                 </div>
                 <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">VAT thu KIM</label>
                  <input 
                    type="number" 
                    value={vatFormData.amount || ''}
                    onChange={e => setVatFormData({ ...vatFormData, amount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                 </div>
              </div>
               <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setIsVatModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all">Hủy</button>
                <button onClick={handleSaveVat} className="flex-1 py-3 rounded-xl bg-[#2563eb] text-white text-sm font-bold hover:brightness-110 active:scale-95 transition-all">Lưu</button>
              </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

const AttendanceView = ({ 
  employees, 
  attendanceRecords, 
  onUpdateAttendance 
}: { 
  employees: Employee[]; 
  attendanceRecords: AttendanceRecord[]; 
  onUpdateAttendance: (r: AttendanceRecord) => void;
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [search, setSearch] = useState('');

  const [selectedCell, setSelectedCell] = useState<{employeeId: string, day: number} | null>(null);
  const [formData, setFormData] = useState<Omit<AttendanceRecord, 'id' | 'employeeId' | 'date'>>({
    checkIn: '',
    checkOut: '',
    status: '',
    note: ''
  });

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCellClick = (employeeId: string, day: number) => {
    const dStr = new Date(selectedYear, selectedMonth - 1, day);
    // Don't allow click on weekends
    if (dStr.getDay() === 0 || dStr.getDay() === 6) return;
    // Don't allow click on future days
    if (dStr > currentDate) return;

    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existing = attendanceRecords.find(r => r.employeeId === employeeId && r.date === dateStr);
    if (existing) {
      setFormData({
        checkIn: existing.checkIn || '',
        checkOut: existing.checkOut || '',
        status: existing.status || '',
        note: existing.note || ''
      });
    } else {
      setFormData({
        checkIn: '',
        checkOut: '',
        status: 'X',
        note: ''
      });
    }
    setSelectedCell({ employeeId, day });
  };

  const handleSave = () => {
    if (!selectedCell) return;
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedCell.day).padStart(2, '0')}`;
    
    onUpdateAttendance({
      id: Math.random().toString(36).substr(2, 9),
      employeeId: selectedCell.employeeId,
      date: dateStr,
      ...formData as any
    });
    setSelectedCell(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase">Bảng chấm công & KPI</h2>
          <p className="text-slate-500 text-sm">Tháng {selectedMonth}/{selectedYear}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => alert('Chức năng Load Excel đang được phát triển')}
            className="bg-[#10b981] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#059669] transition-colors shadow-sm"
          >
            <Upload size={16} />
            Load Excel
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm nhân viên..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-48 pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <select 
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
          <select 
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button 
            onClick={() => alert('Chức năng xuất báo cáo đang được phát triển')}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Download size={16} />
            Xuất Báo Cáo
          </button>
          <button className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-slate-200 text-[#fff]">
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-center bg-[#8cc63f] border-r border-white/20 whitespace-nowrap">STT</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider bg-[#8cc63f] border-r border-white/20 whitespace-nowrap">Họ Tên</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider bg-[#8cc63f] border-r border-white/20 whitespace-nowrap">Chức vụ</th>
                {daysArray.map(day => (
                  <th key={day} className="px-1.5 py-3 text-[10px] font-bold text-center bg-[#8cc63f] border-r border-white/20 w-8">{day}</th>
                ))}
                <th className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-center bg-[#fbbf24] text-slate-900 border-r border-white/20 whitespace-nowrap">KPI (CÔNG)</th>
                <th className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-center bg-[#fbbf24] text-slate-900 border-r border-white/20 whitespace-nowrap">P</th>
                <th className="px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-center bg-[#fbbf24] text-slate-900 border-r border-white/20 whitespace-nowrap">KL</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider bg-[#8cc63f] border-r border-white/20 whitespace-nowrap">Ghi chú</th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-center bg-[#8cc63f] whitespace-nowrap">Cài đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={daysArray.length + 8} className="px-6 py-12 text-center text-slate-400 italic font-medium text-sm">
                    Không tìm thấy nhân viên
                  </td>
                </tr>
              ) : filteredEmployees.map((emp, idx) => {
                const empRecords = attendanceRecords.filter(r => r.employeeId === emp.id && r.date.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`));
                let totalCong = 0;
                let totalP = 0;
                let totalKL = 0;

                const daysData = daysArray.map(day => {
                  const date = new Date(selectedYear, selectedMonth - 1, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isFuture = date > currentDate;
                  const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const record = empRecords.find(r => r.date === dateStr);
                  
                  let displayStatus = '';
                  if (!isWeekend && !isFuture) {
                    displayStatus = record?.status || 'X'; // Default to X for past working days
                    if (displayStatus === 'X') totalCong += 1;
                    else if (displayStatus === 'P/2') { totalCong += 0.5; totalP += 0.5; }
                    else if (displayStatus === 'KL/2') { totalCong += 0.5; totalKL += 0.5; }
                    else if (displayStatus === 'P') totalP += 1;
                    else if (displayStatus === 'KL') totalKL += 1;
                    else if (displayStatus === 'Co') totalP += 1; // Assuming con ốm is like phép
                  }

                  return { day, isWeekend, isFuture, displayStatus, record };
                });

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-3 text-xs font-medium text-slate-500 text-center border-r border-slate-100 bg-slate-50">{idx + 1}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap">{emp.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 border-r border-slate-100 whitespace-nowrap">{emp.position || emp.role}</td>
                    {daysData.map(({ day, isWeekend, isFuture, displayStatus }) => (
                      <td 
                        key={day} 
                        onClick={() => handleCellClick(emp.id, day)}
                        className={cn(
                          "px-1 py-3 text-[10px] text-center border-r border-slate-100 font-bold cursor-pointer transition-colors hover:brightness-95", 
                          isWeekend ? "bg-rose-50 text-rose-500" : isFuture ? "bg-slate-50 text-slate-300" : displayStatus !== 'X' && displayStatus !== '' ? "bg-amber-100 text-amber-700" : "text-green-600 bg-white"
                        )}
                      >
                        {displayStatus}
                      </td>
                    ))}
                    <td className="px-2 py-3 text-xs font-bold text-slate-800 text-center border-r border-slate-100 bg-orange-50/30">
                      {totalCong}
                    </td>
                    <td className="px-2 py-3 text-xs font-medium text-slate-600 text-center border-r border-slate-100 bg-orange-50/30">{totalP}</td>
                    <td className="px-2 py-3 text-xs font-medium text-slate-600 text-center border-r border-slate-100 bg-orange-50/30">{totalKL}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 border-r border-slate-100"></td>
                    <td className="px-3 py-3 text-center">
                      <button className="text-slate-400 hover:text-blue-600 transition-colors">
                        <Settings size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Cell Modal */}
      <AnimatePresence>
        {selectedCell && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#8cc63f] text-white">
                <h3 className="text-lg font-bold">Chấm công</h3>
                <button onClick={() => setSelectedCell(null)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Giờ làm việc • {selectedCell.day}/{selectedMonth}/{selectedYear}</p>
                  <p className="text-lg font-bold text-slate-800">{employees.find(e => e.id === selectedCell.employeeId)?.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Giờ vào</label>
                    <input 
                      type="time" 
                      value={formData.checkIn} 
                      onChange={e => setFormData({ ...formData, checkIn: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Giờ ra</label>
                    <input 
                      type="time" 
                      value={formData.checkOut} 
                      onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Trạng thái (Thông tin)</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="X">X (Bình thường)</option>
                    <option value="P">P (Nghỉ có phép)</option>
                    <option value="KL">KL (Nghỉ không lương)</option>
                    <option value="P/2">P/2 (Nghỉ phép 1 buổi)</option>
                    <option value="KL/2">KL/2 (Nghỉ không lương 1 buổi)</option>
                    <option value="Co">Co (Con ốm)</option>
                    <option value="">Trống (Chưa có TT)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ghi chú</label>
                  <input 
                    type="text" 
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Lý do..." 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button onClick={() => setSelectedCell(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all">Đóng</button>
                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-[#8cc63f] text-white text-sm font-bold hover:brightness-110 active:scale-95 transition-all">Lưu</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LeaveManagementView = ({
  employees,
  attendanceRecords,
  onUpdateAttendance
}: {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (r: AttendanceRecord) => void;
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const leaveStatuses = ['P', 'KL', 'P/2', 'KL/2', 'Co'];

  const getLeaveDays = (empId: string) => {
    const records = attendanceRecords.filter(r => 
      r.employeeId === empId && 
      r.date.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`) &&
      leaveStatuses.includes(r.status)
    );
    let total = 0;
    records.forEach(r => {
      if (r.status === 'P/2' || r.status === 'KL/2') total += 0.5;
      else total += 1;
    });
    return total;
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) && getLeaveDays(e.id) > 0
  );

  const getLeaveRecords = (empId: string) => {
    return attendanceRecords.filter(r => 
      r.employeeId === empId && 
      r.date.startsWith(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`) &&
      leaveStatuses.includes(r.status)
    ).sort((a, b) => a.date.localeCompare(b.date));
  };

  const employeeLeaveRecords = selectedEmployee ? getLeaveRecords(selectedEmployee.id) : [];

  const handleFileUpload = (record: AttendanceRecord, file: File) => {
    // In a real app, this would upload to server. Here we mock it by saving file name.
    onUpdateAttendance({
      ...record,
      attachedFile: file.name
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase">Quản lý nghỉ phép</h2>
          <p className="text-slate-500 text-sm">Tháng {selectedMonth}/{selectedYear}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm nhân viên..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-48 pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <select 
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
          <select 
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-slate-200 text-[#fff]">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-center bg-[#8cc63f] border-r border-white/20 whitespace-nowrap w-16">STT</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider bg-[#8cc63f] border-r border-white/20 whitespace-nowrap">Họ Tên</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider bg-[#8cc63f] border-r border-white/20 whitespace-nowrap">Chức vụ</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-center bg-[#8cc63f] border-r border-white/20 whitespace-nowrap">Số ngày nghỉ phép</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-center bg-[#8cc63f] whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-medium text-sm">
                    Không tìm thấy nhân viên
                  </td>
                </tr>
              ) : filteredEmployees.map((emp, idx) => {
                const leaveDays = getLeaveDays(emp.id);
                const records = getLeaveRecords(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-slate-500 text-center border-r border-slate-100 bg-slate-50">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap">{emp.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 border-r border-slate-100 whitespace-nowrap">{emp.position || emp.role}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-center border-r border-slate-100">
                      <span className={cn("px-3 py-1 rounded-full", leaveDays > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600")}>
                        {leaveDays} ngày
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedEmployee(emp)}
                        disabled={records.length === 0}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                          records.length > 0 
                            ? "bg-blue-50 text-blue-600 hover:bg-blue-100" 
                            : "bg-slate-50 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#8cc63f] text-white shrink-0">
                <div>
                  <h3 className="text-lg font-bold">Chi tiết nghỉ phép</h3>
                  <p className="text-sm opacity-90">{selectedEmployee.name} • Tháng {selectedMonth}/{selectedYear}</p>
                </div>
                <button onClick={() => setSelectedEmployee(null)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                {employeeLeaveRecords.length === 0 ? (
                  <p className="text-slate-500 text-center italic py-8">Không có dữ liệu nghỉ phép trong tháng.</p>
                ) : (
                  <div className="space-y-4">
                    {employeeLeaveRecords.map((record, i) => {
                      const getStatusLabel = (status: string) => {
                        switch (status) {
                          case 'P': return 'Nghỉ có phép';
                          case 'KL': return 'Nghỉ không lương';
                          case 'P/2': return 'Nghỉ nửa ngày';
                          case 'KL/2': return 'Nghỉ nửa ngày (KL)';
                          case 'Co': return 'Con ốm';
                          default: return status;
                        }
                      };
                      return (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                        <div>
                          <p className="font-bold text-slate-800">
                            Ngày {formatDateDDMMYYYY(record.date)}
                          </p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">
                              {getStatusLabel(record.status)}
                            </span>
                            {record.note && (
                              <span className="text-sm text-slate-500 italic">- {record.note}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {record.attachedFile ? (
                            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                              <FileText size={16} />
                              <span className="max-w-[150px] truncate" title={record.attachedFile}>{record.attachedFile}</span>
                              <button 
                                onClick={() => onUpdateAttendance({ ...record, attachedFile: undefined })}
                                className="ml-2 text-rose-500 hover:text-rose-700"
                                title="Xóa file"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                              <Upload size={16} />
                              Tải lên giấy phép
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={e => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileUpload(record, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NewFreightRateForm = ({ onCancel, username }: { onCancel: () => void, username: string }) => {
  const [activeTransport, setActiveTransport] = useState('FCL');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const transportModes = [
    { id: 'FCL', label: 'FCL', icon: Ship },
    { id: 'LCL', label: 'LCL', icon: Ship },
    { id: 'AIR', label: 'AIR', icon: Plane },
    { id: 'FCL_TRUCK', label: 'FCL', icon: Truck },
    { id: 'FTL', label: 'FTL', icon: Truck },
    { id: 'LTL', label: 'LTL', icon: Truck },
    { id: 'RAIL', label: 'RAIL', icon: Train },
  ];

  const isTrucking = ['FCL_TRUCK', 'FTL', 'LTL'].includes(activeTransport);

  const handleSave = async () => {
    if (!voucherNumber) {
      alert('Vui lòng nhập Số phiếu!');
      return;
    }

    setIsSaving(true);
    try {
      // Check for duplicates
      const q = query(collection(db, "vouchers"), where("voucherNumber", "==", voucherNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Find existing voucher numbers to suggest the next one
        const allVouchers = await getDocs(collection(db, "vouchers"));
        const count = allVouchers.size + 1;
        const suggested = `PK-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
        
        alert(`Số phiếu "${voucherNumber}" đã tồn tại! Vui lòng sử dụng số khác. Gợi ý: ${suggested}`);
        setVoucherNumber(suggested);
        setIsSaving(false);
        return;
      }

      // Save new record
      await addDoc(collection(db, "vouchers"), {
        voucherNumber,
        transport: activeTransport,
        createdBy: username,
        createdAt: serverTimestamp(),
        data: { /* Placeholder for actual form data */ }
      });

      alert('Đã lưu dữ liệu thành công lên Firebase!');
      onCancel();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'vouchers');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#f0f4f8] -m-6 p-6 min-h-screen flex flex-col">
       <div className="w-full border-b border-gray-200 mb-6">
        <div className="flex items-center gap-6 px-2 overflow-x-auto">
          {transportModes.map((mode) => (
            <button
              key={`new-${mode.id}`}
              onClick={() => setActiveTransport(mode.id)}
              className={cn(
                "flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap",
                activeTransport === mode.id
                  ? "border-[#0ea5e9] text-[#0ea5e9]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <mode.icon size={16} />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Số phiếu (Voucher Number) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={voucherNumber}
              onChange={(e) => setVoucherNumber(e.target.value)}
              placeholder="VD: PK-2024-001" 
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all font-bold" 
            />
          </div>
          <div className="space-y-1.5 opacity-50">
            <label className="text-sm font-semibold text-slate-700">Người tạo</label>
            <input type="text" value={username} disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" />
          </div>
        </div>
        
        <div className={cn("grid gap-6", isTrucking ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Nhà cung cấp <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="text" placeholder="Chọn nhà cung cấp hoặc thêm mới" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">{activeTransport === 'AIR' ? 'Hãng hàng không' : 'Hãng tàu'}</label>
            <input type="text" placeholder={activeTransport === 'AIR' ? 'Select Airline' : 'Chọn nhà cung cấp'} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
          </div>
          {isTrucking && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Loại <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="w-full px-3 py-2 border border-gray-300 rounded flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-400">Chọn</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {isTrucking ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Điểm đi <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="w-1/3 relative">
                  <div className="w-full px-3 py-2 border border-gray-300 rounded flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium">Địa điểm</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                </div>
                <input type="text" placeholder="Type something" className="w-2/3 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Điểm đến <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="w-1/3 relative">
                  <div className="w-full px-3 py-2 border border-gray-300 rounded flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium">Địa điểm</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                </div>
                <input type="text" placeholder="Type something" className="w-2/3 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Điểm đi <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Cổng tìm kiếm" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Cảng trung chuyển</label>
              <div className="flex gap-2">
                <div className="w-1/3 relative">
                  <div className="w-full px-3 py-2 border border-gray-300 rounded flex items-center justify-between cursor-pointer">
                    <span className="text-sm">Port</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                </div>
                <input type="text" placeholder="Search port" className="w-2/3 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Điểm đến <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Cổng tìm kiếm" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
            </div>
          </div>
        )}

        <div className={cn("grid gap-6", isTrucking ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
          {!isTrucking && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Cảng dỡ hàng</label>
              <input type="text" placeholder="Type something" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Thời gian quá cảnh (ngày)</label>
            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
          </div>
          {!isTrucking && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Lịch trình</label>
              <div className="relative">
                <div className="w-full px-3 py-2 border border-gray-300 rounded flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-400">Chọn</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {activeTransport === 'LCL' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-start-3 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">DDC</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Loại</label>
            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Hàng hóa</label>
            <div className="px-3 py-2 border border-gray-300 rounded text-slate-400 text-sm">Select commodity</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Có hiệu lực từ</label>
            <div className="relative">
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded pr-10" />
              <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Có hiệu lực đến <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded pr-10" />
              <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Tiền tệ <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="w-full px-3 py-2 border border-gray-300 rounded flex items-center justify-between cursor-pointer">
                <span className="text-sm">VND</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Ghi chú</label>
          <textarea className="w-full px-3 py-2 border border-gray-300 rounded h-20 focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all resize-none"></textarea>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Sale note</label>
          <textarea className="w-full px-3 py-2 border border-gray-300 rounded h-20 focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all resize-none"></textarea>
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-6 pt-2">
          <h3 className="font-bold text-lg text-slate-800">
            {isTrucking ? 'Phí vận chuyển' : (activeTransport === 'AIR' ? 'Air Freight' : 'Ocean Freight')}
          </h3>
          
          {activeTransport === 'LTL' ? (
            <div className="space-y-12">
              {['KGS', 'CBM'].map((unit) => (
                <div key={unit} className="space-y-6 border-b border-gray-100 last:border-0 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Đo đạc <span className="text-red-500">*</span></label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded flex items-center justify-between bg-gray-50/50">
                        <span className="text-sm text-slate-700">{unit}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Giá mua <span className="text-red-500">*</span></label>
                      <div className="flex">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 border-r-0 rounded-l text-sm text-slate-500">VND</div>
                        <input type="number" defaultValue={0} className="w-full px-3 py-2 border border-gray-300 rounded-r focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Giá mua cố định</label>
                      <div className="flex">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 border-r-0 rounded-l text-sm text-slate-500 flex items-center gap-1">
                          VND <ChevronDown size={10} />
                        </div>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-r focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Giá bán cố định</label>
                      <div className="flex">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 border-r-0 rounded-l text-sm text-slate-500 flex items-center gap-1">
                          VND <ChevronDown size={10} />
                        </div>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-r focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="bg-[#0ea5e9] text-white px-4 py-2 rounded text-xs font-bold shadow-sm hover:bg-[#0284c7] transition-colors whitespace-nowrap">
                      Add Surcharges
                    </button>
                    <button className="bg-[#0ea5e9] text-white px-4 py-2 rounded text-xs font-bold shadow-sm hover:bg-[#0284c7] transition-colors whitespace-nowrap">
                      Add Commissions
                    </button>
                    <button className="bg-[#0ea5e9] text-white px-4 py-2 rounded text-xs font-bold shadow-sm hover:bg-[#0284c7] transition-colors whitespace-nowrap">
                      Add Origin Charges
                    </button>
                    <button className="bg-[#0ea5e9] text-white px-4 py-2 rounded text-xs font-bold shadow-sm hover:bg-[#0284c7] transition-colors whitespace-nowrap">
                      Add Destination Charges
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    {activeTransport === 'AIR' ? 'Tổng trọng lượng' : (activeTransport === 'LCL') ? 'Đo đạc' : (activeTransport === 'FTL' || activeTransport === 'FCL_TRUCK') ? 'Vận tải đường bộ' : 'Containers'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    {activeTransport === 'LCL' ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded flex items-center justify-between bg-gray-50/50">
                        <span className="text-sm text-slate-700">CBM</span>
                      </div>
                    ) : (
                      <div className={cn("w-full px-3 py-2 border rounded flex items-center justify-between cursor-pointer", (activeTransport === 'LCL') ? "border-gray-300" : "border-red-300 bg-red-50/10")}>
                        <span className="text-sm text-slate-400">Chọn</span>
                        <ChevronDown size={14} className="text-slate-400" />
                      </div>
                    )}
                    {activeTransport === 'AIR' && <p className="text-[10px] text-red-500 mt-1">Trường GW là bắt buộc</p>}
                    {(activeTransport === 'FTL' || activeTransport === 'FCL_TRUCK') && <p className="text-[10px] text-red-500 mt-1">Trường truck type là bắt buộc</p>}
                    {(activeTransport === 'FCL' || activeTransport === 'RAIL') && <p className="text-[10px] text-red-500 mt-1">Trường container là bắt buộc</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Giá mua <span className="text-red-500">*</span></label>
                  <div className="flex">
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 border-r-0 rounded-l text-sm text-slate-500">VND</div>
                    <input type="number" defaultValue={0} className="w-full px-3 py-2 border border-gray-300 rounded-r focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Giá mua cố định</label>
                  <div className="flex">
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 border-r-0 rounded-l text-sm text-slate-500 flex items-center gap-1">
                      VND <ChevronDown size={10} />
                    </div>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-r focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Giá bán cố định</label>
                  <div className="flex">
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 border-r-0 rounded-l text-sm text-slate-500 flex items-center gap-1">
                      VND <ChevronDown size={10} />
                    </div>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-r focus:ring-1 focus:ring-[#0ea5e9] focus:outline-none transition-all" />
                  </div>
                </div>
              </div>

              {activeTransport === 'LCL' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">Surcharges</span>
                    </div>
                    <button className="bg-[#0ea5e9] text-white px-4 py-1.5 rounded text-xs font-semibold shadow-sm hover:bg-[#0284c7] transition-colors">
                      Add Surcharges
                    </button>
                    <div className="border border-gray-200 rounded p-4 relative group bg-gray-50/30">
                      <button className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-gray-200 rounded text-red-500 flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors">
                        <span className="text-lg">×</span>
                      </button>
                      <div className="space-y-3">
                        <input type="text" placeholder="Enter price" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white" />
                        <div className="relative">
                          <div className="w-full px-3 py-1.5 border border-gray-300 rounded flex items-center justify-between bg-white text-sm text-slate-400">
                            Select charge <ChevronDown size={14} />
                          </div>
                        </div>
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" placeholder="Please Input" className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 flex flex-col items-start px-1 pt-12">
                    <button className="bg-[#0ea5e9] text-white px-4 py-1.5 rounded text-xs font-semibold shadow-sm hover:bg-[#0284c7] transition-colors">
                      Add Commissions
                    </button>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <button className="bg-[#0ea5e9] text-white px-4 py-1.5 rounded text-xs font-semibold shadow-sm hover:bg-[#0284c7] transition-colors">
                      Add Origin Charges
                    </button>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <button className="bg-[#0ea5e9] text-white px-4 py-1.5 rounded text-xs font-semibold shadow-sm hover:bg-[#0284c7] transition-colors">
                      Add Destination Charges
                    </button>
                  </div>
                </div>
              ) : (
                <button className="flex items-center gap-2 text-[#0ea5e9] font-semibold text-sm hover:underline py-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#0ea5e9] flex items-center justify-center">
                    <Plus size={10} strokeWidth={3} />
                  </div>
                  Thêm đơn vị khác
                </button>
              )}
            </>
          )}
        </div>

        <hr className="border-gray-200" />

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider text-xs">Term</label>
          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>

        <div className="flex justify-start gap-3 pt-4 pb-10">
          <button 
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded font-bold text-slate-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "px-10 py-2 bg-[#0ea5e9] text-white rounded font-bold hover:bg-[#0284c7] transition-all shadow-sm",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

const FreightsView = ({ username }: { username: string }) => {
  const [activeTransport, setActiveTransport] = useState('FCL');
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [showNewRateForm, setShowNewRateForm] = useState(false);

  const transportModes = [
    { id: 'FCL', label: 'FCL', icon: Ship },
    { id: 'LCL', label: 'LCL', icon: Ship },
    { id: 'AIR', label: 'AIR', icon: Plane },
    { id: 'FCL_TRUCK', label: 'FCL', icon: Truck },
    { id: 'FTL', label: 'FTL', icon: Truck },
    { id: 'LTL', label: 'LTL', icon: Truck },
    { id: 'RAIL', label: 'RAIL', icon: Train },
  ];

  const statusTabs = [
    { id: 'All', label: 'Tất cả' },
    { id: 'Available', label: 'Có hiệu lực' },
    { id: 'Expiring soon', label: 'Sắp hết hạn' },
    { id: 'Expired', label: 'Hết hạn' }
  ];

  if (showNewRateForm) {
    return <NewFreightRateForm onCancel={() => setShowNewRateForm(false)} username={username} />;
  }

  return (
    <div className="space-y-0 h-full flex flex-col bg-[#f0f4f8] -m-6 p-6">
      <div className="w-full border-b border-gray-200">
        <div className="flex items-center gap-6 px-2 overflow-x-auto">
          {transportModes.map((mode) => (
            <button
              key={`${mode.id}-${mode.label}`}
              onClick={() => setActiveTransport(mode.id)}
              className={cn(
                "flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap",
                activeTransport === mode.id
                  ? "border-[#0ea5e9] text-[#0ea5e9]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              <mode.icon size={16} />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white mx-[-24px] px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
         <div className="flex items-center bg-gray-100 rounded text-sm overflow-hidden">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.label)}
                className={cn(
                  "px-4 py-2 font-medium transition-colors",
                  activeTab === tab.label
                    ? "bg-[#0ea5e9] text-white"
                    : "text-slate-600 hover:bg-gray-200 bg-white border-r border-gray-200 last:border-0"
                )}
              >
                {tab.label}
              </button>
            ))}
         </div>

         <div className="flex items-center gap-3 ml-auto">
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm">
              <UploadCloud size={16} />
              Tải lên tệp Excel
            </button>
            <button 
              onClick={() => setShowNewRateForm(true)}
              className="flex items-center gap-2 bg-[#0ea5e9] text-white px-4 py-2 rounded font-medium text-sm hover:bg-[#0284c7] transition-colors shadow-sm"
            >
              <Plus size={16} />
              Giá mới
            </button>
         </div>
      </div>

      <div className="bg-[#f8fafc] mx-[-24px] px-6 py-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] bg-white rounded flex items-center px-3 py-2 border border-slate-200 shadow-sm">
          <Search size={16} className="text-slate-400 mr-2" />
          <input type="text" placeholder="Nhà cung cấp" className="w-full outline-none text-sm bg-transparent" />
        </div>
        <div className="flex-1 min-w-[200px] bg-white rounded flex items-center px-3 py-2 border border-slate-200 shadow-sm">
          <Search size={16} className="text-slate-400 mr-2" />
          <input type="text" placeholder="Điểm đi" className="w-full outline-none text-sm bg-transparent" />
        </div>
        <div className="flex-1 min-w-[200px] bg-white rounded flex items-center px-3 py-2 border border-slate-200 shadow-sm">
          <Search size={16} className="text-slate-400 mr-2" />
          <input type="text" placeholder="Điểm đến" className="w-full outline-none text-sm bg-transparent" />
        </div>
        <div className="flex-1 min-w-[200px] bg-white rounded flex items-center px-3 py-2 border border-slate-200 shadow-sm">
          <Search size={16} className="text-slate-400 mr-2" />
          <input type="text" placeholder="Hàng hóa" className="w-full outline-none text-sm bg-transparent" />
        </div>
      </div>

      <div className="bg-[#f8fafc] mx-[-24px] px-6 pb-4 flex items-center gap-4 border-b border-gray-200">
        <button className="bg-[#0ea5e9] text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium">
          <Filter size={14} />
          <ChevronDown size={14} />
        </button>
        <button className="text-slate-400 hover:text-slate-600">
          <CloudDownload size={20} />
        </button>
      </div>

      <div className="bg-white flex-1 mx-[-24px] mb-[-24px] overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                 <tr className="border-b border-gray-200 text-slate-500 font-semibold bg-[#f8fafc] uppercase text-[10px] tracking-wider">
                    <td className="p-4 w-10"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="p-4">NHÀ CUNG CẤP</td>
                    <td className="p-4">HÃNG TÀU</td>
                    <td className="p-4">ĐẠI LÝ</td>
                    <td className="p-4">ĐIỂM ĐI</td>
                    <td className="p-4">ĐIỂM ĐẾN</td>
                    <td className="p-4">CẢNG TRUNG CHUYỂN</td>
                    <td className="p-4">THỜI GIAN QUÁ CẢNH (NGÀY)</td>
                    <td className="p-4">OCEAN FREIGHT 20'DC</td>
                    <td className="p-4">OCEAN FREIGHT 20'RF</td>
                    <td className="p-4">OCEAN FREIGHT 40'DC</td>
                    <td className="p-4">OCEAN FREIGHT 40'RF</td>
                    <td className="p-4">OCEAN FREIGHT 40'HC</td>
                    <td className="p-4">OCEAN FREIGHT 20'TANK</td>
                    <td className="p-4 text-center"><Plus size={14} className="inline-block" /></td>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                   <td colSpan={15} className="p-10 text-center text-slate-500 text-sm font-semibold italic">
                      No Data
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-auto border-t border-gray-200 p-4 flex items-center gap-6 text-xs font-semibold text-slate-500 bg-[#f8fafc]">
             <span>TOTAL: 0</span>
             <div className="flex items-center gap-1">
                 <span>10 ITEMS</span>
                 <ChevronDown size={12} />
             </div>
             <div className="flex items-center gap-2 ml-4">
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors">«</button>
                 <button className="w-6 h-6 rounded bg-[#0ea5e9] text-white flex items-center justify-center">1</button>
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors">»</button>
             </div>
          </div>
      </div>
    </div>
  );
};

const LocalChargesView = () => {
  const [activeTransport, setActiveTransport] = useState('FCL');
  const [activeTab, setActiveTab] = useState('All');
  const [activeDirection, setActiveDirection] = useState('All');

  const transportModes = [
    { id: 'FCL', label: 'FCL', icon: Ship },
    { id: 'LCL', label: 'LCL', icon: Ship },
    { id: 'AIR', label: 'AIR', icon: Plane },
    { id: 'ROAD_FCL', label: 'ROAD FCL', icon: Truck },
    { id: 'ROAD_FTL', label: 'ROAD FTL', icon: Truck },
    { id: 'ROAD_LTL', label: 'ROAD LTL', icon: Truck },
    { id: 'OTHER', label: 'OTHER', icon: null },
    { id: 'RAIL', label: 'RAIL', icon: Train },
  ];

  const statusTabs = ['All', 'Available', 'Expiring soon', 'Expired'];
  const directionTabs = ['All', 'Origin', 'Destination'];

  return (
    <div className="space-y-0 h-full flex flex-col bg-[#f0f4f8] -m-6 p-6">
      <div className="w-full border-b border-gray-200">
        <div className="flex items-center gap-6 px-2 overflow-x-auto">
          {transportModes.map((mode) => (
            <button
              key={`${mode.id}-${mode.label}`}
              onClick={() => setActiveTransport(mode.id)}
              className={cn(
                "flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap",
                activeTransport === mode.id
                  ? "border-[#0ea5e9] text-[#0ea5e9]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {mode.icon && <mode.icon size={16} />}
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white mx-[-24px] px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
         <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center bg-gray-100 rounded text-sm overflow-hidden">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 font-medium transition-colors cursor-pointer",
                    activeTab === tab
                      ? "bg-[#0ea5e9] text-white"
                      : "text-slate-600 hover:bg-gray-200 bg-white border-r border-gray-200 last:border-0"
                  )}
                >
                  {tab}
                </button>
              ))}
           </div>
           
           <div className="flex items-center bg-gray-100 rounded text-sm overflow-hidden">
              {directionTabs.map((tab) => (
                <button
                  key={`dir-${tab}`}
                  onClick={() => setActiveDirection(tab)}
                  className={cn(
                    "px-4 py-2 font-medium transition-colors cursor-pointer",
                    activeDirection === tab
                      ? "bg-[#0ea5e9] text-white"
                      : "text-slate-600 hover:bg-gray-200 bg-white border-r border-gray-200 last:border-0"
                  )}
                >
                  {tab}
                </button>
              ))}
           </div>
         </div>

         <div className="flex items-center gap-3 ml-auto">
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm">
              <UploadCloud size={16} />
              Upload Excel File
            </button>
            <button className="flex items-center gap-2 bg-[#0ea5e9] text-white px-4 py-2 rounded font-medium text-sm hover:bg-[#0284c7] transition-colors shadow-sm cursor-pointer">
              <Plus size={16} />
              New Local Charge
            </button>
         </div>
      </div>

      <div className="bg-[#f8fafc] mx-[-24px] px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4 max-w-sm bg-white rounded px-3 py-2 border border-slate-200 shadow-sm">
          <Search size={16} className="text-slate-400" />
          <input type="text" placeholder="Search" className="w-full outline-none text-sm bg-transparent" />
        </div>
      </div>

      <div className="bg-[#f8fafc] mx-[-24px] px-6 pb-4 pt-4 flex items-center gap-4">
        <button className="bg-[#0ea5e9] text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium cursor-pointer">
          <Filter size={14} />
          <ChevronDown size={14} />
        </button>
        <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
          <CloudDownload size={20} />
        </button>
      </div>

      <div className="bg-white flex-1 mx-[-24px] mb-[-24px] overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                 <tr className="border-b border-gray-200 text-slate-500 font-semibold bg-[#f8fafc] uppercase text-[10px] tracking-wider">
                    <td className="p-4 w-10"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="p-4">PROVIDER</td>
                    <td className="p-4">CHARGE NAME</td>
                    <td className="p-4">TYPE</td>
                    <td className="p-4">PORT</td>
                    <td className="p-4">CURRENCY</td>
                    <td className="p-4">BUYING RATE</td>
                    <td className="p-4">CURRENCY SELLING</td>
                    <td className="p-4">FIXED SELLING RATE</td>
                    <td className="p-4">REMARK</td>
                    <td className="p-4">VALID FROM</td>
                    <td className="p-4">VALID UNTIL</td>
                    <td className="p-4">VIEWABLE</td>
                    <td className="p-4">CREATE TYPE</td>
                    <td className="p-4">CREATED AT</td>
                    <td className="p-4 text-center"><Plus size={14} className="inline-block" /></td>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                   <td colSpan={16} className="p-10 text-center text-slate-500 text-sm font-semibold italic">
                      No Data
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-auto border-t border-gray-200 p-4 flex items-center gap-6 text-xs font-semibold text-slate-500 bg-[#f8fafc]">
             <span>TOTAL: 0</span>
             <div className="flex items-center gap-1 cursor-pointer">
                 <span>10 ITEMS</span>
                 <ChevronDown size={12} />
             </div>
             <div className="flex items-center gap-2 ml-4">
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">«</button>
                 <button className="w-6 h-6 rounded bg-[#0ea5e9] text-white flex items-center justify-center">1</button>
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">»</button>
             </div>
          </div>
      </div>
    </div>
  );
};

const ServicesView = () => {
  const [activeTab, setActiveTab] = useState('All');
  const statusTabs = ['All', 'Available', 'Expiring soon', 'Expired'];

  return (
    <div className="space-y-0 h-full flex flex-col bg-[#f0f4f8] -m-6 p-6">
      <div className="bg-white mx-[-24px] px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
         <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center bg-gray-100 rounded text-sm overflow-hidden">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 font-medium transition-colors cursor-pointer",
                    activeTab === tab
                      ? "bg-[#0ea5e9] text-white"
                      : "text-slate-600 hover:bg-gray-200 bg-white border-r border-gray-200 last:border-0"
                  )}
                >
                  {tab}
                </button>
              ))}
           </div>
         </div>

         <div className="flex items-center gap-3 ml-auto">
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm">
              <UploadCloud size={16} />
              Upload Excel File
            </button>
            <button className="flex items-center gap-2 bg-[#0ea5e9] text-white px-4 py-2 rounded font-medium text-sm hover:bg-[#0284c7] transition-colors shadow-sm cursor-pointer">
              <Plus size={16} />
              New Service
            </button>
         </div>
      </div>

      <div className="bg-[#f8fafc] mx-[-24px] px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4 max-w-sm bg-white rounded px-3 py-2 border border-slate-200 shadow-sm">
          <Search size={16} className="text-slate-400" />
          <input type="text" placeholder="Search" className="w-full outline-none text-sm bg-transparent" />
        </div>
      </div>

      <div className="bg-[#f8fafc] mx-[-24px] px-6 pb-4 pt-4 flex items-center gap-4">
        <button className="bg-[#0ea5e9] text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium cursor-pointer">
          <Filter size={14} />
          <ChevronDown size={14} />
        </button>
        <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
          <CloudDownload size={20} />
        </button>
      </div>

      <div className="bg-white flex-1 mx-[-24px] mb-[-24px] overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                 <tr className="border-b border-gray-200 text-slate-500 font-semibold bg-[#f8fafc] uppercase text-[10px] tracking-wider">
                    <td className="p-4 w-10"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="p-4">SERVICE NAME</td>
                    <td className="p-4">CALCULATION TYPE</td>
                    <td className="p-4">CURRENCY</td>
                    <td className="p-4">PRICE</td>
                    <td className="p-4">REMARK</td>
                    <td className="p-4">VALID FROM</td>
                    <td className="p-4">VALID UNTIL</td>
                    <td className="p-4">VIEWABLE</td>
                    <td className="p-4">CREATED BY</td>
                    <td className="p-4">CREATED ON</td>
                    <td className="p-4">HTCB</td>
                    <td className="p-4 text-center"><Plus size={14} className="inline-block" /></td>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                   <td colSpan={13} className="p-10 text-center text-slate-500 text-sm font-semibold italic">
                      No Data
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-auto border-t border-gray-200 p-4 flex items-center gap-6 text-xs font-semibold text-slate-500 bg-[#f8fafc]">
             <span>TOTAL: 0</span>
             <div className="flex items-center gap-1 cursor-pointer">
                 <span>10 ITEMS</span>
                 <ChevronDown size={12} />
             </div>
             <div className="flex items-center gap-2 ml-4">
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">«</button>
                 <button className="w-6 h-6 rounded bg-[#0ea5e9] text-white flex items-center justify-center">1</button>
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">»</button>
             </div>
          </div>
      </div>
    </div>
  );
};

const CustomChargeView = () => {
  const [activeTransport, setActiveTransport] = useState('FCL');
  const [activeTab, setActiveTab] = useState('All');

  const transportModes = [
    { id: 'FCL', label: 'FCL', icon: Ship },
    { id: 'LCL', label: 'LCL', icon: Ship },
    { id: 'AIR', label: 'AIR', icon: Plane },
    { id: 'ROAD_FCL', label: 'FCL', icon: Truck },
    { id: 'ROAD_FTL', label: 'FTL', icon: Truck },
    { id: 'ROAD_LTL', label: 'LTL', icon: Truck },
    { id: 'OTHER', label: 'Other', icon: null },
    { id: 'RAIL', label: 'Rail', icon: Train },
  ];

  const statusTabs = ['All', 'Available', 'Expiring soon', 'Expired'];

  return (
    <div className="space-y-0 h-full flex flex-col bg-[#f0f4f8] -m-6 p-6">
      <div className="w-full border-b border-gray-200">
        <div className="flex items-center gap-6 px-2 overflow-x-auto">
          {transportModes.map((mode) => (
            <button
              key={`${mode.id}-${mode.label}`}
              onClick={() => setActiveTransport(mode.id)}
              className={cn(
                "flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap",
                activeTransport === mode.id
                  ? "border-[#0ea5e9] text-[#0ea5e9]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {mode.icon && <mode.icon size={16} />}
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white mx-[-24px] px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
         <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center bg-gray-100 rounded text-sm overflow-hidden">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 font-medium transition-colors cursor-pointer",
                    activeTab === tab
                      ? "bg-[#0ea5e9] text-white"
                      : "text-slate-600 hover:bg-gray-200 bg-white border-r border-gray-200 last:border-0"
                  )}
                >
                  {tab}
                </button>
              ))}
           </div>
         </div>

         <div className="flex items-center gap-3 ml-auto">
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-4 py-2 rounded font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm">
              <UploadCloud size={16} />
              Upload Excel File
            </button>
            <button className="flex items-center gap-2 bg-[#0ea5e9] text-white px-4 py-2 rounded font-medium text-sm hover:bg-[#0284c7] transition-colors shadow-sm cursor-pointer">
              <Plus size={16} />
              New Custom
            </button>
         </div>
      </div>

      <div className="bg-[#f8fafc] mx-[-24px] px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4 max-w-sm bg-white rounded px-3 py-2 border border-slate-200 shadow-sm">
          <Search size={16} className="text-slate-400" />
          <input type="text" placeholder="Search" className="w-full outline-none text-sm bg-transparent" />
        </div>
      </div>

      <div className="bg-[#f8fafc] mx-[-24px] px-6 pb-4 pt-4 flex items-center gap-4">
        <button className="bg-[#0ea5e9] text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium cursor-pointer">
          <Filter size={14} />
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="bg-white flex-1 mx-[-24px] mb-[-24px] overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                 <tr className="border-b border-gray-200 text-slate-500 font-semibold bg-[#f8fafc] uppercase text-[10px] tracking-wider">
                    <td className="p-4 w-10"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="p-4">PROVIDER</td>
                    <td className="p-4">CUSTOM NAME</td>
                    <td className="p-4">TYPE</td>
                    <td className="p-4">CALCULATION TYPE</td>
                    <td className="p-4">CURRENCY</td>
                    <td className="p-4">PRICE</td>
                    <td className="p-4">VALID FROM</td>
                    <td className="p-4">VALID UNTIL</td>
                    <td className="p-4">VIEWABLE</td>
                    <td className="p-4 text-center"><Plus size={14} className="inline-block" /></td>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                   <td colSpan={11} className="p-10 text-center text-slate-500 text-sm font-semibold italic">
                      No Data
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-auto border-t border-gray-200 p-4 flex items-center gap-6 text-xs font-semibold text-slate-500 bg-[#f8fafc]">
             <span>TOTAL: 0</span>
             <div className="flex items-center gap-1 cursor-pointer">
                 <span>10 ITEMS</span>
                 <ChevronDown size={12} />
             </div>
             <div className="flex items-center gap-2 ml-4">
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">«</button>
                 <button className="w-6 h-6 rounded bg-[#0ea5e9] text-white flex items-center justify-center">1</button>
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">»</button>
             </div>
          </div>
      </div>
    </div>
  );
};

const SalesRequestView = () => {
  const [activeTransport, setActiveTransport] = useState('ALL');

  const transportModes = [
    { id: 'ALL', label: 'ALL', icon: null },
    { id: 'FCL', label: 'FCL', icon: Ship },
    { id: 'LCL', label: 'LCL', icon: Ship },
    { id: 'AIR', label: 'AIR', icon: Plane },
    { id: 'ROAD_FCL', label: 'FCL', icon: Truck },
    { id: 'ROAD_FTL', label: 'FTL', icon: Truck },
    { id: 'ROAD_LTL', label: 'LTL', icon: Truck },
    { id: 'RAIL', label: 'RAIL', icon: Train },
    { id: 'OTHER', label: 'OTHER', icon: null },
  ];

  return (
    <div className="space-y-0 h-full flex flex-col bg-[#f0f4f8] -m-6 p-6">
      <div className="bg-white mx-[-24px] px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
         <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center min-w-[150px] bg-white rounded px-3 py-2 border border-slate-200 shadow-sm cursor-pointer">
              <span className="text-sm font-medium text-slate-700 flex-1">All</span>
              <ChevronDown size={16} className="text-slate-400" />
           </div>

           <div className="flex items-center bg-gray-100 rounded text-sm overflow-hidden border border-gray-200">
              {transportModes.map((mode) => (
                <button
                  key={`req-${mode.id}-${mode.label}`}
                  onClick={() => setActiveTransport(mode.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 font-semibold transition-colors cursor-pointer",
                    activeTransport === mode.id
                      ? "bg-[#0ea5e9] text-white"
                      : "text-slate-600 hover:bg-gray-200 bg-white border-r border-gray-200 last:border-0"
                  )}
                >
                  {mode.icon && <mode.icon size={14} className={activeTransport === mode.id ? "text-white" : "text-slate-500"} />}
                  {mode.label}
                </button>
              ))}
           </div>
         </div>

         <div className="flex items-center gap-3 ml-auto">
            <button className="flex items-center gap-2 bg-[#0ea5e9] text-white px-4 py-2 rounded font-semibold text-sm hover:bg-[#0284c7] transition-colors shadow-sm cursor-pointer border border-[#0ea5e9]">
              <Plus size={16} />
              Add Request
            </button>
         </div>
      </div>

      <div className="bg-[#f8fafc] mx-[-24px] px-6 pt-4 pb-2 flex flex-col gap-2 border-b border-gray-200">
        <div className="flex justify-end w-full">
            <div className="flex flex-col gap-1 items-start w-72">
               <label className="text-[10px] font-semibold text-slate-500">Created On</label>
               <div className="flex items-center bg-white rounded px-3 py-1.5 border border-slate-200 shadow-sm w-full gap-2">
                 <div className="text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
                 <input type="text" placeholder="Start" className="w-full text-xs outline-none bg-transparent" />
                 <span className="text-slate-300">-</span>
                 <input type="text" placeholder="End" className="w-full text-xs outline-none bg-transparent" />
               </div>
            </div>
        </div>
      </div>
      
      <div className="bg-[#f8fafc] mx-[-24px] px-6 pb-4 pt-4 flex items-center gap-4">
        <button className="bg-[#0ea5e9] text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium cursor-pointer">
          <Filter size={14} />
          <ChevronDown size={14} />
        </button>
        <button className="text-slate-400 hover:text-slate-600 cursor-pointer border border-transparent hover:border-slate-300 rounded p-1">
          <CloudDownload size={18} />
        </button>
      </div>

      <div className="bg-white flex-1 mx-[-24px] mb-[-24px] overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                 <tr className="border-b border-gray-200 text-slate-500 font-semibold bg-[#f8fafc] uppercase text-[10px] tracking-wider">
                    <td className="p-4 w-10"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="p-4">REQUEST ID</td>
                    <td className="p-4">CUSTOMER NAME</td>
                    <td className="p-4">VOLUME</td>
                    <td className="p-4">ORIGIN</td>
                    <td className="p-4">DESTINATION</td>
                    <td className="p-4">ATTACHMENT</td>
                    <td className="p-4">STATUS</td>
                    <td className="p-4">CREATED BY</td>
                    <td className="p-4">TYPE</td>
                    <td className="p-4">MODE</td>
                    <td className="p-4">RATE ID</td>
                    <td className="p-4">DATE OF PRICE U...</td>
                    <td className="p-4 text-center"><Plus size={14} className="inline-block" /></td>
                 </tr>
              </thead>
              <tbody>
                 <tr>
                   <td colSpan={14} className="p-10 text-center text-slate-500 text-sm font-semibold italic">
                      No Data
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-auto border-t border-gray-200 p-4 flex items-center gap-6 text-xs font-semibold text-slate-500 bg-[#f8fafc]">
             <span>TOTAL: 0</span>
             <div className="flex items-center gap-1 cursor-pointer">
                 <span>10 ITEMS</span>
                 <ChevronDown size={12} />
             </div>
             <div className="flex items-center gap-2 ml-4">
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">«</button>
                 <button className="w-6 h-6 rounded bg-[#0ea5e9] text-white flex items-center justify-center">1</button>
                 <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">»</button>
             </div>
          </div>
      </div>
    </div>
  );
};

const ViewPlaceholder = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-slate-900 italic tracking-tight">{title}</h2>
      <button className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm active:scale-95 transition-transform hover:brightness-110">
        Đang cập nhật
      </button>
    </div>
    
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white border border-slate-100 rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border border-slate-50">
          <BarChart3 size={40} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-bold text-slate-800">Tính năng đang được thiết lập</h4>
          <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium leading-relaxed italic">
            Dữ liệu cho phần "{title}" sẽ được đồng bộ hóa sớm nhất. Cảm ơn sự kiên nhẫn của bạn.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const EmployeeManagementView = ({ 
  employees, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  employees: Employee[], 
  onAdd: () => void, 
  onEdit: (e: Employee) => void, 
  onDelete: (id: string) => void 
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-slate-900 italic">Quản lý Nhân viên</h2>
      <button 
        onClick={onAdd}
        className="bg-[#00875A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all hover:brightness-110 flex items-center gap-2"
      >
        <Users size={16} />
        Thêm nhân viên
      </button>
    </div>

    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Họ tên</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chức vụ</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sđt</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Line</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">STK</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ngân hàng</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-800">{emp.fullName}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{emp.position}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{emp.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{emp.email}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{emp.phone}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{emp.line}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{emp.accountNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{emp.bankName}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(emp)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(emp.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ExpenseCategoryManagementView = ({ 
  categories, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  categories: ExpenseCategory[], 
  onAdd: () => void, 
  onEdit: (c: ExpenseCategory) => void, 
  onDelete: (id: string) => void 
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-slate-900 italic">Quản lý Loại chi phí</h2>
      <button 
        onClick={onAdd}
        className="bg-[#00875A] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all hover:brightness-110 flex items-center gap-2"
      >
        <Wallet size={16} />
        Thêm loại chi phí
      </button>
    </div>

    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm max-w-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loại chi phí</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-800">{cat.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEdit(cat)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(cat.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const EmployeeModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editData 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (e: Partial<Employee>) => void, 
  editData?: Employee 
}) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '',
    position: '',
    name: '',
    email: '',
    phone: '',
    line: '',
    accountNumber: '',
    bankName: ''
  });

  useEffect(() => {
    if (editData) setFormData(editData);
    else setFormData({ fullName: '', position: '', name: '', email: '', phone: '', line: '', accountNumber: '', bankName: '' });
  }, [editData, isOpen]);

  const handleCopySignature = () => {
    alert('Đã sao chép chữ ký vào Clipboard! (Tính năng giả lập)');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md overflow-y-auto p-4 md:p-10 custom-scrollbar group/modal">
      <div className="min-h-full flex items-start justify-center">
        <motion.div 
          initial={{ scale: 0.98, opacity: 0, y: 10 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          className="bg-[#ebf2f7] rounded-[40px] w-full max-w-7xl shadow-2xl my-auto overflow-hidden border border-white/40"
        >
        {/* Header Section */}
        <div className="p-10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              CÀI ĐẶT CÁ NHÂN
            </h3>
            <p className="text-sm font-bold text-slate-400">Cập nhật hồ sơ và thiết lập chữ ký email Outlook chuyên nghiệp</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => onSave(formData)} 
              className="bg-[#f58220] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <Save size={18} />
              Lưu thông tin
            </button>
            <button onClick={onClose} className="bg-white/80 hover:bg-white p-3 rounded-2xl text-slate-400 transition-all border border-white shadow-sm">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-10 pt-4 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* System Information Card */}
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-white space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-50 shadow-inner">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">Thông tin hệ thống</h4>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-6 pb-4 border-b border-slate-100 mb-4">
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center relative group shrink-0">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={32} className="text-slate-400" />
                    )}
                    <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload size={16} className="text-white mb-1" />
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">THAY ĐỔI</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFormData({ ...formData, avatarUrl: URL.createObjectURL(e.target.files[0]) });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-lg">Ảnh đại diện</h5>
                    <p className="text-xs text-slate-500 mt-0.5">Nên sử dụng ảnh vuông, kích thước tối đa 2MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    HỌ VÀ TÊN <Lock size={10} className="opacity-50" />
                  </label>
                  <input 
                    type="text" 
                    value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full bg-[#f8fafc] border border-transparent rounded-2xl py-4 px-8 text-base font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-100 transition-all shadow-inner"
                    placeholder="Administrator"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      CHỨC VỤ <Lock size={10} className="opacity-50" />
                    </label>
                    <input 
                      type="text" 
                      value={formData.position} 
                      onChange={e => setFormData({...formData, position: e.target.value})}
                      className="w-full bg-[#f8fafc] border border-transparent rounded-2xl py-4 px-8 text-base font-bold text-slate-700 outline-none shadow-inner"
                      placeholder="ADMIN"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      TÊN TIẾNG ANH <Lock size={10} className="opacity-50" />
                    </label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#f8fafc] border border-transparent rounded-2xl py-4 px-8 text-base font-bold text-slate-700 outline-none shadow-inner"
                      placeholder="ADMIN"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    EMAIL CÔNG VỤ <Lock size={10} className="opacity-50" />
                  </label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#f8fafc] border border-transparent rounded-2xl py-4 px-8 text-base font-bold text-slate-700 outline-none shadow-inner"
                    placeholder="admin@longhoanglogistics.com"
                  />
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400 italic mt-6 opacity-80">
                * Thông tin hệ thống được quản lý bởi bộ phận Admin/Nhân sự.
              </p>
            </div>

            {/* Contact & Bank Info Card */}
            <div className="bg-white p-10 rounded-[32px] shadow-sm border border-white space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-[#e6fcf5] text-[#00875A] rounded-2xl flex items-center justify-center border border-[#c2f2e1] shadow-sm">
                  <UserIcon size={24} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">Thông tin liên lạc & Ngân hàng</h4>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SỐ ĐIỆN THOẠI ZALO</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 transition-colors" />
                    <input 
                      type="text" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-8 text-base font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#00875A]/5 focus:border-[#00875A] transition-all"
                      placeholder="VD: 090..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SỐ MÁY LẺ (LINE)</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xl">#</div>
                    <input 
                      type="text" 
                      value={formData.line} 
                      onChange={e => setFormData({...formData, line: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-8 text-base font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#00875A]/5 focus:border-[#00875A] transition-all"
                      placeholder="VD: 1000"
                    />
                  </div>
                </div>

                <div className="col-span-2 mt-2 space-y-4">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">THÔNG TIN CHUYỂN KHOẢN LƯƠNG</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <CreditCard size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        value={formData.accountNumber} 
                        onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-8 text-base font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#00875A]/5 focus:border-[#00875A] transition-all"
                        placeholder="Số tài khoản..."
                      />
                    </div>
                    <div className="relative">
                      <Briefcase size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        value={formData.bankName} 
                        onChange={e => setFormData({...formData, bankName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-8 text-base font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#00875A]/5 focus:border-[#00875A] transition-all"
                        placeholder="Techcombank..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-orange-500 font-extrabold mt-6 uppercase tracking-tight">
                Vui lòng cập nhật thông tin liên lạc để hoàn thiện mẫu chữ ký bên dưới.
              </p>
            </div>

            {/* Email Signature Section */}
            <div className="lg:col-span-2 bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
              <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">CHỮ KÝ EMAIL OUTLOOK</h4>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">Mẫu chuẩn Long Hoang Logistics (WCA Member ID: 130841)</p>
                  </div>
                </div>
                <button 
                  onClick={handleCopySignature}
                  className="bg-[#0f172a] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
                >
                  <Copy size={18} />
                  SAO CHÉP CHỮ KÝ
                </button>
              </div>

              <div className="p-8 md:p-12 bg-[#fcfcfc]">
                <div className="max-w-4xl mx-auto bg-white p-12 rounded-2xl shadow-sm border border-slate-50">
                   {/* Real Signature HTML Structure Simulation */}
                   <div style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                      <p className="italic text-[#1e3a8a] text-sm font-bold mb-4">Thanks and Regards!</p>
                      <hr className="border-[#ef4444] border-t-2 mb-6" />
                      
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-48 space-y-4 flex flex-col items-center border-r border-slate-100 pr-8">
                          <div className="w-40">
                             <div className="flex items-center gap-2 mb-1">
                               <div className="w-8 h-8 bg-[#1e3a8a] rounded-full"></div>
                               <div className="flex flex-col">
                                  <p className="text-[8px] font-black text-[#1e3a8a] leading-tight">LONG HOANG LOGISTICS</p>
                                  <p className="text-[5px] text-slate-500 tracking-tighter">THINK LOGISTICS - THINK US</p>
                               </div>
                             </div>
                          </div>
                          <div className="flex gap-2 justify-center">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 flex items-center justify-center text-[6px]">WCA</div>
                            <div className="w-8 h-8 bg-blue-100 text-blue-800 flex items-center justify-center text-[6px]">LOGO2</div>
                          </div>
                          <p className="text-[10px] font-bold text-amber-600 uppercase border-t border-slate-100 pt-2 tracking-widest">ID WCA: 130841</p>
                        </div>

                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="text-xl font-bold text-slate-900 leading-tight">Mr. {formData.fullName || 'Administrator'} | {formData.position || 'Admin'}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-1 tracking-wider">{formData.name || 'ADMIN'}</p>
                            <p className="text-xs font-bold text-[#ef4444] uppercase mt-2 tracking-tight underline decoration-2 underline-offset-4">LONG HOANG LOGISTICS CO., LTD</p>
                          </div>
                          
                          <div className="space-y-1.5 pt-2">
                             <div className="flex items-center gap-3 text-xs text-slate-600">
                               <Phone size={12} className="text-[#ef4444]" />
                               <span className="font-bold underline">028 7303 2677</span>
                               <span className="text-slate-400 font-medium">| {formData.phone || 'chưa nhập'} (zalo)</span>
                             </div>
                             <div className="flex items-center gap-3 text-xs text-slate-600">
                               <Mail size={12} className="text-[#ef4444]" />
                               <span className="font-bold underline">{formData.email || 'admin@longhoanglogistics.com'}</span>
                             </div>
                             <div className="flex items-center gap-3 text-xs text-slate-600">
                               <Globe size={12} className="text-[#ef4444]" />
                               <span className="font-bold underline">www.longhoanglogistics.com</span>
                             </div>
                             <div className="flex items-start gap-3 text-xs text-slate-600 pt-1">
                               <MapPin size={12} className="text-[#ef4444] mt-1 shrink-0" />
                               <p><span className="text-[#ef4444] font-bold">Head office:</span> 132 - 134 Nguyen Gia Tri Str, Thanh My Tay Ward, Binh Thanh Dist, HCMC, Vietnam.</p>
                             </div>
                             <div className="ml-6 text-xs text-slate-500">
                               <p><span className="text-blue-600 font-bold">Branch Hai Phong:</span> Floor 3A, Plot No. 17, Area B1 - Lot 7B Le Hong Phong Street, Dong Khe Ward, Ngo Quyen District, Hai Phong City, Viet Nam</p>
                             </div>
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-8 bg-[#eef5ff]">
                <div className="flex gap-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0"><Info size={20} /></div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-[#1e3a8a]">Hướng dẫn cài đặt chữ ký:</h5>
                    <ol className="text-xs text-[#1e3a8a]/70 font-bold space-y-1 list-decimal ml-4">
                      <li>Nhấn nút <span className="text-blue-600">"SAO CHÉP CHỮ KÝ"</span> bên trên.</li>
                      <li>Mở ứng dụng Outlook, vào menu <span className="text-slate-600 uppercase">File &gt; Options &gt; Mail &gt; Signatures.</span></li>
                      <li>Tạo chữ ký mới (New), nhấn <span className="text-slate-800">Ctrl+V</span> để dán nội dung vào ô soạn thảo.</li>
                      <li>Nhấn <span className="text-slate-800">OK</span> để lưu lại. Hệ thống sẽ tự động hiển thị chữ ký này trong mỗi email mới của bạn.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 pt-0 flex gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 rounded-3xl border border-slate-200 text-sm font-bold text-slate-400 hover:bg-white transition-all bg-white/40 shadow-sm"
          >
            ĐÓNG LẠI
          </button>
        </div>
      </motion.div>
    </div>
  </div>
  );
};

const CategoryModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editData 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (c: Partial<ExpenseCategory>) => void, 
  editData?: ExpenseCategory 
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (editData) setName(editData.name);
    else setName('');
  }, [editData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#00875A] text-white">
          <h3 className="text-lg font-bold">{editData ? 'Cập nhật loại chi phí' : 'Thêm mới loại chi phí'}</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Tên loại chi phí</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Vd: Tiền điện..." className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-[#00875A]/20 focus:border-[#00875A] outline-none transition-all" />
          </div>
        </div>
        <div className="p-6 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all">Hủy bỏ</button>
          <button onClick={() => onSave({ name })} className="flex-1 py-2.5 rounded-lg bg-[#00875A] text-white text-sm font-bold shadow-lg shadow-[#00875A]/20 hover:brightness-110 active:scale-95 transition-all">Lưu lại</button>
        </div>
      </motion.div>
    </div>
  );
};






