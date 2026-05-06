const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add agents state
code = code.replace(
  'const [payees, setPayees] = useState<Payee[]>([]);',
  'const [payees, setPayees] = useState<Payee[]>([]);\n  const [agents, setAgents] = useState<Payee[]>([]);'
);

// 2. Add agents fetcher
code = code.replace(
  "const unsub = onSnapshot(collection(db, 'payees'), (snapshot) => {",
  `const unsubAgents = onSnapshot(collection(db, 'agents'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payee));
      setAgents(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'agents'));
    
    const unsub = onSnapshot(collection(db, 'payees'), (snapshot) => {`
);

// 3. Add handleSaveAgent & handleDeleteAgent
const payeeHandlers = `
  const handleSavePayee = async (data: { name: string }) => {
    try {
      if (editPayee) {
        await updateDoc(doc(db, 'payees', editPayee.id), { name: data.name });
      } else {
        await addDoc(collection(db, 'payees'), data);
      }
      setIsPayeeModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'payees');
    }
  };

  const handleDeletePayee = async (id: string) => {
    if (confirm('Xác nhận xóa người nhận/nộp này?')) {
      try {
        await deleteDoc(doc(db, 'payees', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'payees');
      }
    }
  };

  const handleSaveAgent = async (data: { name: string }) => {
    try {
      if (editPayee) {
        await updateDoc(doc(db, 'agents', editPayee.id), { name: data.name });
      } else {
        await addDoc(collection(db, 'agents'), data);
      }
      setIsPayeeModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'agents');
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (confirm('Xác nhận xóa Agent này?')) {
      try {
        await deleteDoc(doc(db, 'agents', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'agents');
      }
    }
  };
`;

code = code.replace(/const handleSavePayee = async \([\s\S]*?handleFirestoreError\(error, OperationType\.DELETE, 'payees'\);\n\s+\}\n\s+\}\n\s+\};/, payeeHandlers);


// 4. Update WCA routing to pass agents
code = code.replace(
  'payees={payees}\n              descriptionTemplates={descriptionTemplates}\n              onAddTransaction={handleAddWcaTransaction}',
  'payees={agents}\n              descriptionTemplates={descriptionTemplates}\n              onAddTransaction={handleAddWcaTransaction}'
);

// 5. Update DataManagement View
code = code.replace(
  'payees: Payee[];',
  'payees: Payee[];\n  agents: Payee[];\n  onAddAgent: () => void;\n  onEditAgent: (a: Payee) => void;\n  onDeleteAgent: (id: string) => void;'
);

code = code.replace(
  'onEditPayee,\n  onDeletePayee,\n  onAddTemplate,',
  'onEditPayee,\n  onDeletePayee,\n  agents,\n  onAddAgent,\n  onEditAgent,\n  onDeleteAgent,\n  onAddTemplate,'
);

code = code.replace(
  "const [activeTab, setActiveTab] = useState<'categories' | 'payees' | 'templates'>('categories');",
  "const [activeTab, setActiveTab] = useState<'categories' | 'payees' | 'agents' | 'templates'>('categories');"
);

code = code.replace(
  "{ id: 'categories', label: 'Chi phí', icon: Tag },\n    { id: 'payees', label: 'Agent', icon: Users },\n    { id: 'templates', label: 'Nội dung mẫu', icon: FileText },",
  "{ id: 'categories', label: 'Chi phí', icon: Tag },\n    { id: 'payees', label: 'Người nhận/Nộp', icon: Users },\n    { id: 'agents', label: 'Agent', icon: Users },\n    { id: 'templates', label: 'Nội dung mẫu', icon: FileText },"
);


code = code.replace(
  "if (activeTab === 'payees') onAddPayee();\n            if (activeTab === 'templates') onAddTemplate();",
  "if (activeTab === 'payees') onAddPayee();\n            if (activeTab === 'agents') onAddAgent();\n            if (activeTab === 'templates') onAddTemplate();"
);

code = code.replace(
  "{activeTab === 'categories' ? 'Thêm Loại chi phí' : activeTab === 'payees' ? 'Thêm Người nhận/Nộp' : 'Thêm Mẫu nội dung'}",
  "{activeTab === 'categories' ? 'Thêm Loại chi phí' : activeTab === 'payees' ? 'Thêm Người nhận/Nộp' : activeTab === 'agents' ? 'Thêm Agent' : 'Thêm Mẫu nội dung'}"
);


let agentTable = `
{activeTab === 'agents' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tên Agent</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agents.length === 0 ? (
                  <tr><td colSpan={2} className="px-8 py-12 text-center text-slate-400 italic">Chưa có Agent nào</td></tr>
                ) : agents.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 text-sm font-bold text-slate-700">{a.name}</td>
                    <td className="px-8 py-4 text-right space-x-2">
                      <button onClick={() => onEditAgent(a)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => onDeleteAgent(a.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
`;

code = code.replace(
  "{activeTab === 'templates' && (",
  agentTable + '\n\n        {activeTab === \'templates\' && ('
);


// 6. Provide to DataManagementView in App
code = code.replace(
  '<DataManagementView \n              expenseCategories={expenseCategories}\n              payees={payees}',
  `<DataManagementView \n              expenseCategories={expenseCategories}\n              payees={payees}\n              agents={agents}\n              onAddAgent={() => { setEditPayee(undefined); setActiveDataTab('agents'); setIsPayeeModalOpen(true); }}\n              onEditAgent={(p) => { setEditPayee(p); setActiveDataTab('agents'); setIsPayeeModalOpen(true); }}\n              onDeleteAgent={handleDeleteAgent}`
);

// Oh wait, activeDataTab? Let me define it or remove it. We don't have activeDataTab in App state, only in DataManagementView locally or we can use a ref or something.
// But setIsPayeeModalOpen(true) uses the same modal 'PayeeModal'. Let's differentiate the save callback depending on if we are editing an agent or payee. Or we can just create a separate agent modal.
// Wait, for simplicity, add a state in App: const [isAgentModalOpen, setIsAgentModalOpen] = useState(false); and editAgent.

code = code.replace(
  'const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);\n  const [editPayee, setEditPayee] = useState<Payee | undefined>();',
  `const [isPayeeModalOpen, setIsPayeeModalOpen] = useState(false);\n  const [editPayee, setEditPayee] = useState<Payee | undefined>();\n  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);\n  const [editAgent, setEditAgent] = useState<Payee | undefined>();`
);

code = code.replace(
  'onAddAgent={() => { setEditPayee(undefined); setActiveDataTab(\'agents\'); setIsPayeeModalOpen(true); }}\n              onEditAgent={(p) => { setEditPayee(p); setActiveDataTab(\'agents\'); setIsPayeeModalOpen(true); }}\n              onDeleteAgent={handleDeleteAgent}',
  'onAddAgent={() => { setEditAgent(undefined); setIsAgentModalOpen(true); }}\n              onEditAgent={(p) => { setEditAgent(p); setIsAgentModalOpen(true); }}\n              onDeleteAgent={handleDeleteAgent}'
);

if (code.includes('handleSaveAgent')) {
  code = code.replace(
    'if (editPayee) {\n        await updateDoc(doc(db, \'agents\', editPayee.id), { name: data.name });',
    'if (editAgent) {\n        await updateDoc(doc(db, \'agents\', editAgent.id), { name: data.name });'
  );
  code = code.replace(
    'setIsPayeeModalOpen(false);\n    } catch (error) {',
    'setIsAgentModalOpen(false);\n    } catch (error) {'
  );
}

// 7. Add AgentModal in App render
code = code.replace(
  '{isPayeeModalOpen && (\n        <PayeeModal\n          editData={editPayee}\n          onClose={() => setIsPayeeModalOpen(false)}\n          onSave={handleSavePayee}\n        />\n      )}',
  `{isPayeeModalOpen && (
        <PayeeModal
          editData={editPayee}
          onClose={() => setIsPayeeModalOpen(false)}
          onSave={handleSavePayee}
        />
      )}
      {isAgentModalOpen && (
        <PayeeModal
          editData={editAgent}
          onClose={() => setIsAgentModalOpen(false)}
          onSave={handleSaveAgent}
        />
      )}`
);

// 8. Modify TransactionModal to have a + button
code = code.replace(
  '<label className="text-xs font-bold text-slate-500 uppercase">{agentLabel}</label>\n                  <select',
  `<label className="text-xs font-bold text-slate-500 uppercase">{agentLabel}</label>
                  <div className="flex items-center gap-2">
                    <select`
);

code = code.replace(
  '<option value="Khác">Khác / Nhập trực tiếp</option>\n                  </select>',
  `<option value="Khác">Khác / Nhập trực tiếp</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onAddPayee && onAddPayee()}
                      className="bg-[#2563eb] text-white p-2.5 rounded-xl text-sm font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>`
);

fs.writeFileSync('src/App.tsx', code);
