const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'onSave: (data: Omit<CashTransaction, \'id\' | \'voucherNumber\'>) => void;\n}) => {',
  'onSave: (data: Omit<CashTransaction, \'id\' | \'voucherNumber\'>) => void;\n  onAddPayee?: () => void;\n}) => {'
);


code = code.replace(
  'agentLabel={agentLabel}\n            />',
  'agentLabel={agentLabel}\n              onAddPayee={onAddPayeeDirect}\n            />'
);

code = code.replace(
  'const [transactionModalMode, setTransactionModalMode] = useState',
  'const onAddPayeeDirect = () => { prompt("Please enter name to add directly:"); };\n  const [transactionModalMode, setTransactionModalMode] = useState'
);

// We need a proper way to add an agent or payee directly. If we just use prompt for now we can call handleSavePayee or handleSaveAgent.
// Wait, we can pass it down from App.tsx.

code = code.replace(
  'onBulkAddTransactions: (batch: (Omit<CashTransaction, \'id\' | \'voucherNumber\'> & { voucherNumber?: string })[]) => void;\n  onEditTransaction: (t: CashTransaction) => void;',
  'onBulkAddTransactions: (batch: (Omit<CashTransaction, \'id\' | \'voucherNumber\'> & { voucherNumber?: string })[]) => void;\n  onEditTransaction: (t: CashTransaction) => void;\n  onAddAgentOrPayee: () => void;'
);

code = code.replace(
  'onAddTransaction,\n  onBulkAddTransactions,\n  onEditTransaction,\n  onDeleteTransaction,\n  onUpdateInitialBalance,\n  title = "Nhật ký chi tiêu",',
  'onAddTransaction,\n  onBulkAddTransactions,\n  onEditTransaction,\n  onDeleteTransaction,\n  onUpdateInitialBalance,\n  onAddAgentOrPayee,\n  title = "Nhật ký chi tiêu",'
);

code = code.replace(
  'const onAddPayeeDirect = () => { prompt("Please enter name to add directly:"); };',
  ''
);

code = code.replace(
  'onAddPayee={onAddPayeeDirect}',
  'onAddPayee={onAddAgentOrPayee}'
);

code = code.replace(
  'descriptionTemplates={descriptionTemplates}\n              onAddTransaction={handleAddCashTransaction}',
  'descriptionTemplates={descriptionTemplates}\n              onAddAgentOrPayee={() => setIsPayeeModalOpen(true)}\n              onAddTransaction={handleAddCashTransaction}'
);

code = code.replace(
  'descriptionTemplates={descriptionTemplates}\n              onAddTransaction={handleAddWcaTransaction}',
  'descriptionTemplates={descriptionTemplates}\n              onAddAgentOrPayee={() => setIsAgentModalOpen(true)}\n              onAddTransaction={handleAddWcaTransaction}'
);

// We'll run this to apply changes.
fs.writeFileSync('src/App.tsx', code);
