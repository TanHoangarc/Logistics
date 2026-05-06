import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

if (code.includes('const [currentPage, setCurrentPage]')) {
    console.log("Already has currentPage.");
} else {
    code = code.replace(
        /const \[formData, setFormData\] = useState/,
        `const [currentPage, setCurrentPage] = useState(1);\n  const ITEMS_PER_PAGE = 20;\n\n  const [formData, setFormData] = useState`
    );
    
    code = code.replace(
        /const displayList = \[\.\.\.filtered\]\.reverse\(\);/,
        `const displayListAll = [...filtered].reverse();\n  const totalPages = Math.ceil(displayListAll.length / ITEMS_PER_PAGE) || 1;\n  const displayList = displayListAll.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);\n\n  useEffect(() => {\n    setCurrentPage(1);\n  }, [filterType, search, fromDate, toDate, targetPerson]);`
    );
    
    code = code.replace(
        /<\/table>\n\s+<\/div>\n\s+<\/div>/,
        `</table>\n        </div>\n        {totalPages > 1 && (\n          <div className="border-t border-slate-100 p-4 flex items-center justify-between">\n            <div className="text-sm text-slate-500 font-medium">\n              Trang {currentPage} / {totalPages}\n            </div>\n            <div className="flex items-center flex-wrap gap-1 justify-end">\n              <button \n                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} \n                disabled={currentPage === 1}\n                className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-colors"\n              >\n                Trước\n              </button>\n              <button \n                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} \n                disabled={currentPage === totalPages}\n                className="px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 transition-colors"\n              >\n                Sau\n              </button>\n            </div>\n          </div>\n        )}\n      </div>`
    );
    
    code = code.replace(/px-6 py-4/g, "px-2 py-3"); // Reduce padding for tighter table
    code = code.replace(/<th className="px-2 py-3 text-\[10px\] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap min-w-\[200px\]">Diễn giải<\/th>/g, 
                        `<th className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-full min-w-[150px]">Diễn giải</th>`);

    fs.writeFileSync('src/App.tsx', code);
    console.log("Updated pagination.");
}
