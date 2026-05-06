import * as fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Revert Agent back to Người nhận/Nộp globally except in WCA (we will use props)
code = code.replace(/Xác nhận xóa Agent này\?/g, 'Xác nhận xóa người nhận/nộp này?');
code = code.replace(/'Sửa Agent'/g, "'Sửa Người nhận/Nộp'");
code = code.replace(/'Thêm Agent'/g, "'Thêm Người nhận/Nộp'");
code = code.replace(/>Agent</g, '>Người nhận/Nộp<');
code = code.replace(/>Tên Agent</g, '>Tên người nhận/nộp<');
code = code.replace(/>Chưa có Agent nào</g, '>Chưa có người nhận/nộp nào<');
code = code.replace(/-- Chọn Agent --/g, '-- Chọn người nhận/nộp --');
code = code.replace(/Nhập tên Agent/g, 'Nhập tên người nhận/nộp');

// Modify CashBookView
code = code.replace(
  'onUpdateInitialBalance\n}: {\n  transactions: CashTransaction[];',
  `onUpdateInitialBalance,\n  title = "Nhật ký chi tiêu",\n  agentLabel = "Người nhận/Nộp",\n  showImportExport = true\n}: {\n  transactions: CashTransaction[];\n  title?: string;\n  agentLabel?: string;\n  showImportExport?: boolean;`
);

code = code.replace(
  /<h2 className="text-2xl font-bold text-slate-900 italic">WCA<\/h2>/g,
  '<h2 className="text-2xl font-bold text-slate-900 italic">{title}</h2>'
);

code = code.replace(
  /<th className="px-6 py-4 text-\[10px\] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Người nhận\/Nộp<\/th>/g,
  '<th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{agentLabel}</th>'
);

code = code.replace(
  /<label className="text-xs font-bold text-slate-500 uppercase">Người nhận \/ Nộp<\/label>/g,
  '<label className="text-xs font-bold text-slate-500 uppercase">{agentLabel}</label>'
);

code = code.replace(
  /-- Chọn người nhận\/nộp --/g,
  '-- Chọn {agentLabel.toLowerCase()} --'
);

code = code.replace(
  /Nhập tên người nhận\/nộp/g,
  'Nhập tên {agentLabel.toLowerCase()}'
);

// Conditionally hide buttons
code = code.replace(
  '<button \n            onClick={() => setIsImportModalOpen(true)}',
  '{showImportExport && <button \n            onClick={() => setIsImportModalOpen(true)}'
);

code = code.replace(
  'Import (Excel)\n          </button>\n          <button ',
  'Import (Excel)\n          </button>}\n          {showImportExport && <button '
);

code = code.replace(
  'In Sổ (Excel)\n          </button>\n          <div className="relative group">',
  'In Sổ (Excel)\n          </button>}\n          <div className="relative group">'
);

// Add wcaTransactions and wcaInitialBalance state to App
let wcaStateDefinition = `
  const [wcaTransactions, setWcaTransactions] = useState<CashTransaction[]>([]);
  const [wcaInitialBalance, setWcaInitialBalance] = useState<InitialBalanceInfo>({ date: new Date().toISOString().split('T')[0], amount: 0 });
`;

if(!code.includes('wcaTransactions')) {
  code = code.replace(
    'const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);',
    `const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);${wcaStateDefinition}`
  );
}

// Add data fetching for WCA
let wcaDataFetching = `
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'wcaTransactions'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CashTransaction));
      setWcaTransactions(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'wcaTransactions'));
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchWcaBal = async () => {
      try {
        const docRef = doc(db, 'config', 'wcaInitialBalance');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setWcaInitialBalance(docSnap.data() as InitialBalanceInfo);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'config/wcaInitialBalance');
      }
    };
    fetchWcaBal();
  }, []);
`;
if(!code.includes('wcaTransactions)')) {
  code = code.replace(
    /useEffect\(\(\) => \{\s+const fetchInitialBal/g,
    `${wcaDataFetching}\n  useEffect(() => {\n    const fetchInitialBal`
  );
}

// Map WCA handlers
let wcaHandlers = `
  const handleAddWcaTransaction = async (t: Omit<CashTransaction, 'id' | 'voucherNumber'>) => {
    try {
      let vn = t.voucherNumber;
      if (!vn) {
        if (t.type === 'receipt') {
          const receipts = wcaTransactions.filter(tx => tx.type === 'receipt');
          let maxNum = 0;
          receipts.forEach(r => {
            const m = r.voucherNumber.match(/PTWCA(\\d+)/);
            if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
          });
          vn = \`PTWCA\${String(maxNum + 1).padStart(5, '0')}\`;
        } else {
          const payments = wcaTransactions.filter(tx => tx.type === 'payment');
          let maxNum = 0;
          payments.forEach(p => {
            const m = p.voucherNumber.match(/PCWCA(\\d+)/);
            if (m) maxNum = Math.max(maxNum, parseInt(m[1]));
          });
          vn = \`PCWCA\${String(maxNum + 1).padStart(5, '0')}\`;
        }
      }
      
      await addDoc(collection(db, 'wcaTransactions'), {
        ...t,
        voucherNumber: vn
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'wcaTransactions');
    }
  };

  const handleEditWcaTransaction = async (t: CashTransaction) => {
    try {
      const { id, ...rest } = t;
      await updateDoc(doc(db, 'wcaTransactions', id), rest);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'wcaTransactions');
    }
  };

  const handleDeleteWcaTransaction = async (id: string) => {
    if (confirm('Xác nhận xóa chứng từ này?')) {
      try {
        await deleteDoc(doc(db, 'wcaTransactions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'wcaTransactions');
      }
    }
  };

  const handleUpdateWcaInitialBalance = async (b: InitialBalanceInfo) => {
    try {
      await setDoc(doc(db, 'config', 'wcaInitialBalance'), b);
      setWcaInitialBalance(b);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'config/wcaInitialBalance');
    }
  };
`;
if(!code.includes('handleAddWcaTransaction')) {
  code = code.replace(
    '  const handleAddBankTransaction',
    `${wcaHandlers}\n  const handleAddBankTransaction`
  );
}

// Modify the WCA route
let wcaRoute = `<Route path="/tai-chinh/luu-chuyen" element={
            <CashBookView 
              transactions={wcaTransactions}
              initialBalance={wcaInitialBalance}
              payees={payees}
              descriptionTemplates={descriptionTemplates}
              onAddTransaction={handleAddWcaTransaction}
              onBulkAddTransactions={async () => {}} 
              onEditTransaction={handleEditWcaTransaction}
              onDeleteTransaction={handleDeleteWcaTransaction}
              onUpdateInitialBalance={handleUpdateWcaInitialBalance}
              title="WCA"
              agentLabel="Agent"
              showImportExport={false}
            />
          } />`;

code = code.replace(
  /<Route path="\/tai-chinh\/luu-chuyen" element=\{[\s\S]*?<\/CashBookView>[\s\S]*?\} \/>/m,
  wcaRoute
);


fs.writeFileSync('src/App.tsx', code);
