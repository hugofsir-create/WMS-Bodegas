/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Warehouse, 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  FileSpreadsheet, 
  Plus, 
  History, 
  Search, 
  Database,
  Trash2,
  Download,
  Sun,
  Moon,
  Edit,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '@/src/lib/utils';
import { 
  Material, 
  Transaction, 
  WarehouseType 
} from '@/src/types';

// --- Components ---

const SplashScreen = () => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.8, ease: "easeInOut" }}
    className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center overflow-hidden"
  >
    {/* Animated background elements */}
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1.2, opacity: 0.1 }}
      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
      className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px]"
    />
    <motion.div 
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 0.8, opacity: 0.05 }}
      transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
      className="absolute w-[400px] h-[400px] bg-slate-400 rounded-full blur-[100px] right-20 bottom-20"
    />

    <div className="relative z-10 text-center">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h1 className="text-6xl font-black text-white tracking-tighter mb-4 italic">
          CALICO <span className="text-blue-500 not-italic">S.A.</span>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="relative inline-block px-8 py-2 overflow-hidden"
      >
        <div className="text-blue-400 font-bold uppercase tracking-[0.4em] text-sm animate-shimmer">
          WMS Bodegas
        </div>
      </motion.div>
    </div>

    <motion.div 
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 3, ease: "linear" }}
      className="absolute bottom-0 left-0 h-1 bg-blue-500 w-full origin-left"
    />
  </motion.div>
);

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card = ({ children, className, title }: CardProps) => (
  <div className={cn("bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800", className)}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between dark:bg-slate-800/50 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</h3>
      </div>
    )}
    <div className="p-6">
      {children}
    </div>
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className,
  disabled,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm shadow-sm";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
  };

  const sizes = {
    sm: "px-3 py-1.5",
    md: "px-4 py-1.5",
    lg: "px-6 py-2.5"
  };

  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick} 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
};

// --- Main App ---

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeWarehouse, setActiveWarehouse] = useState<WarehouseType>('Escorihuela Gascón');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'master'>('inventory');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [manualType, setManualType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [manualState, setManualState] = useState<'Apto' | 'No Apto'>('Apto');
  const [inventoryStateFilter, setInventoryStateFilter] = useState<'Apto' | 'No Apto'>('Apto');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  // Handle Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persistence
  useEffect(() => {
    const savedMaterials = localStorage.getItem('wms_materials');
    const savedTransactions = localStorage.getItem('wms_transactions');
    if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
  }, []);

  useEffect(() => {
    localStorage.setItem('wms_materials', JSON.stringify(materials));
    localStorage.setItem('wms_transactions', JSON.stringify(transactions));
  }, [materials, transactions]);

  // Derived State: Inventory
  const inventory = useMemo(() => {
    const inv: Record<WarehouseType, Record<'Apto' | 'No Apto', Record<string, number>>> = {
      'Escorihuela Gascón': { 'Apto': {}, 'No Apto': {} },
      'Rutini wines': { 'Apto': {}, 'No Apto': {} }
    };

    transactions.forEach(t => {
      const state = t.estado || 'Apto';
      const current = inv[t.warehouse][state][t.sku] || 0;
      if (t.tipo === 'ingreso') {
        inv[t.warehouse][state][t.sku] = current + t.cantidad;
      } else {
        inv[t.warehouse][state][t.sku] = current - t.cantidad;
      }
    });

    return inv;
  }, [transactions]);

  // Excel Handlers
  const handleMaterialMasterImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];

      const newMaterials: Material[] = json.map(row => ({
        sku: String(row.sku || row.SKU || ''),
        descripcion: String(row.descripcion || row.DESCRIPCIÓN || row.description || ''),
        cajasPorPallet: Number(row.cantidad_cajas_por_pallet || row['cantidad de cajas por pallet'] || row.cajas_x_pallet || 0)
      })).filter(m => m.sku);

      setMaterials(prev => {
        const existingSkus = new Set(prev.map(m => m.sku));
        const uniqueNew = newMaterials.filter(m => !existingSkus.has(m.sku));
        return [...prev, ...uniqueNew];
      });
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleTransactionImport = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'ingreso' | 'egreso') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];

      const newTransactions: Transaction[] = json.map(row => ({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        sku: String(row.sku || row.SKU || ''),
        tipo,
        uom: String(row.unidad_de_medida || row.UOM || row['unidad de medida'] || 'Unidad'),
        cantidad: Number(row.cantidad || row.CANTIDAD || 0),
        warehouse: activeWarehouse,
        estado: (row.estado || row.ESTADO || 'Apto') as 'Apto' | 'No Apto'
      })).filter(t => t.sku && t.cantidad > 0);

      // Validate SKUs exist in Master
      const invalidSkus = newTransactions.filter(t => !materials.find(m => m.sku === t.sku));
      if (invalidSkus.length > 0) {
        alert(`Los siguientes SKUs no existen en el Maestro: ${invalidSkus.map(t => t.sku).join(', ')}`);
        return;
      }

      setTransactions(prev => [...prev, ...newTransactions]);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const exportCurrentInventory = () => {
    const data = Object.entries(inventory[activeWarehouse][inventoryStateFilter]).map(([sku, cantidad]) => {
      const material = materials.find(m => m.sku === sku);
      const cp = material?.cajasPorPallet;
      const cant = cantidad as number;
      return {
        SKU: sku,
        Descripción: material?.descripcion || 'N/A',
        Stock: cant,
        Estado: inventoryStateFilter,
        'Cajas x Pallet': cp || 0,
        Pallets: cp ? (cant / cp).toFixed(2) : '0.00'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    XLSX.writeFile(workbook, `Stock_${activeWarehouse}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredMaterials = materials.filter(m => 
    m.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = transactions
    .filter(t => t.warehouse === activeWarehouse)
    .filter(t => 
      t.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeB - timeA;
    });

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white overflow-hidden dark:bg-slate-950 dark:text-slate-200">
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>
      
      {/* --- Sidebar --- */}
      <nav className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 z-50 shadow-xl dark:border-slate-800/50">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-blue-400">WMS<span className="text-white">Vinery</span></h1>
            </div>
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 mt-1 font-semibold italic">Logistics Management</p>
        </div>

        <div className="flex-1 py-4 overflow-y-auto px-4 space-y-6">
          <div>
            <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-3 italic">Depósitos</div>
            {(['Escorihuela Gascón', 'Rutini wines'] as WarehouseType[]).map(wh => (
              <button
                key={wh}
                onClick={() => setActiveWarehouse(wh)}
                className={cn(
                  "w-full text-left text-sm py-2 px-3 rounded-md transition-all mb-1 flex items-center justify-between group",
                  activeWarehouse === wh 
                    ? "bg-blue-600/10 text-blue-400 font-bold" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                {wh}
                {activeWarehouse === wh && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
              </button>
            ))}
          </div>

          <div>
            <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-3 italic">Administración</div>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('inventory')}
                className={cn(
                  "w-full text-left text-sm py-2 px-3 rounded-md transition-all flex items-center gap-3",
                  activeTab === 'inventory' ? "bg-blue-600/10 text-blue-400 font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Package className="w-4 h-4" /> INVENTARIO
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "w-full text-left text-sm py-2 px-3 rounded-md transition-all flex items-center gap-3",
                  activeTab === 'history' ? "bg-blue-600/10 text-blue-400 font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <History className="w-4 h-4" /> MOVIMIENTOS
              </button>
              <button 
                onClick={() => setActiveTab('master')}
                className={cn(
                  "w-full text-left text-sm py-2 px-3 rounded-md transition-all flex items-center gap-3",
                  activeTab === 'master' ? "bg-blue-600/10 text-blue-400 font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Database className="w-4 h-4" /> MAESTRO MATERIALES
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950">
          <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-blue-500/0">HS</div>
            <div className="text-xs">
              <p className="font-bold text-slate-100">Hugo Sir</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">ID: #4092</p>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Header Section */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">Gestión de Inventario: <span className="text-blue-600 italic font-medium">{activeWarehouse}</span></h2>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Button variant="outline" className="gap-2 text-xs">
                <Download className="w-3.5 h-3.5 text-slate-400" /> Exportar Planilla
                <input 
                  type="button" 
                  onClick={exportCurrentInventory}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
            <Button 
              onClick={() => {
                setManualType('ingreso');
                setIsManualModalOpen(true);
              }}
              variant="primary" 
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> NUEVA OPERACIÓN
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 dark:bg-slate-950/50">
          {/* Search & Actions Bar */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por SKU, descripción o tipo..." 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2 pl-10 pr-4 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              {activeTab === 'master' ? (
                <div className="flex gap-3">
                  <Button 
                    variant="primary" 
                    className="gap-2"
                    onClick={() => setIsAddMaterialModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" /> Nuevo Material
                  </Button>
                  <div className="relative">
                    <Button variant="secondary" className="gap-2">
                      <FileSpreadsheet className="w-4 h-4" /> Importar Maestro
                      <input 
                        type="file" 
                        accept=".xlsx,.xls" 
                        onChange={handleMaterialMasterImport}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative group">
                    <Button variant="secondary" className="gap-2">
                      <ArrowDownToLine className="w-4 h-4" /> Ingresos (.xlsx)
                      <input 
                        type="file" 
                        accept=".xlsx,.xls" 
                        onChange={(e) => handleTransactionImport(e, 'ingreso')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </Button>
                  </div>
                  <div className="relative group">
                    <Button variant="secondary" className="gap-2">
                      <ArrowUpFromLine className="w-4 h-4" /> Egresos (.xlsx)
                      <input 
                        type="file" 
                        accept=".xlsx,.xls" 
                        onChange={(e) => handleTransactionImport(e, 'egreso')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 italic">Capacidad Operativa</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">SKUs Activos</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{Object.keys(inventory[activeWarehouse]).length}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Total Unidades ({inventoryStateFilter})</p>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-500">{(Object.values(inventory[activeWarehouse][inventoryStateFilter]) as number[]).reduce((a, b) => a + Number(b), 0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 italic">Vista Rápida de Depósito</p>
              <div className="flex items-center gap-8">
                 <div className="flex-1">
                   <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-2">
                     <span>Ocupación Estimada</span>
                     <span>65%</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 rounded-full w-[65%]" />
                   </div>
                 </div>
                 <div className="flex gap-4 border-l border-slate-100 dark:border-slate-800 pl-8">
                   <div>
                     <p className="text-[10px] text-slate-400 uppercase font-bold">Ingresos (24h)</p>
                     <p className="text-lg font-bold text-green-600 dark:text-green-500">+{transactions.filter(t => t.tipo === 'ingreso' && t.warehouse === activeWarehouse).length}</p>
                   </div>
                   <div>
                     <p className="text-[10px] text-slate-400 uppercase font-bold">Egresos (24h)</p>
                     <p className="text-lg font-bold text-red-500 dark:text-red-400">-{transactions.filter(t => t.tipo === 'egreso' && t.warehouse === activeWarehouse).length}</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Content Views */}
          <AnimatePresence mode="wait">
            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 min-h-0"
              >
                <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                  <button 
                    onClick={() => setInventoryStateFilter('Apto')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      inventoryStateFilter === 'Apto' ? "bg-white dark:bg-slate-700 text-green-600 shadow-sm" : "text-slate-400 hover:text-slate-500"
                    )}
                  >
                    <ShieldCheck className="w-4 h-4" /> SUB-DEPÓSITO APTO
                  </button>
                  <button 
                    onClick={() => setInventoryStateFilter('No Apto')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      inventoryStateFilter === 'No Apto' ? "bg-white dark:bg-slate-700 text-red-600 shadow-sm" : "text-slate-400 hover:text-slate-500"
                    )}
                  >
                    <ShieldAlert className="w-4 h-4" /> SUB-DEPÓSITO NO APTO
                  </button>
                </div>
                <Card title={`Planilla de Stock Actual - ${inventoryStateFilter}`} className="h-full">
                  <div className="overflow-auto flex-1 h-[450px]">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="p-4">SKU Material</th>
                          <th className="p-4">Descripción Técnica</th>
                          <th className="p-4 text-right">Stock Disponible</th>
                          <th className="p-4 text-right">Capacidad Pallets</th>
                          <th className="p-4 text-right">Configuración</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-slate-600 dark:text-slate-400">
                        {Object.keys(inventory[activeWarehouse][inventoryStateFilter]).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-12 text-center text-slate-400 italic">No se detectaron registros para esta bodega y estado</td>
                          </tr>
                        ) : (
                          Object.entries(inventory[activeWarehouse][inventoryStateFilter])
                            .filter(([sku, cantidad]) => {
                               const m = materials.find(m => m.sku === sku);
                               return (sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      m?.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                      cantidad !== 0;
                            })
                            .map(([sku, cantidad]) => {
                              const material = materials.find(m => m.sku === sku);
                              const cp = material?.cajasPorPallet;
                              const cant = cantidad as number;
                              const pallets = cp ? (cant / cp).toFixed(2) : '0.00';
                              return (
                                <tr key={sku} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                  <td className="p-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{sku}</td>
                                  <td className="p-4 font-medium dark:text-slate-300">{material?.descripcion || '---'}</td>
                                  <td className="p-4 text-right font-bold text-slate-900 dark:text-slate-100 leading-none">
                                    {cant}
                                  </td>
                                  <td className="p-4 text-right font-medium text-blue-600 dark:text-blue-400">{pallets} PLT</td>
                                  <td className="p-4 text-right text-slate-400 text-[10px] uppercase font-bold">{material?.cajasPorPallet || 0} p/pallet</td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 min-h-0"
              >
                <Card title="Registro Cronológico de Operaciones" className="h-full">
                  <div className="overflow-auto flex-1 h-[450px]">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="p-4">TimeStamp</th>
                          <th className="p-4">SKU Referencia</th>
                          <th className="p-4">Tipo Mov.</th>
                          <th className="p-4">UOM</th>
                          <th className="p-4 text-right">Cant.</th>
                          <th className="p-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-slate-600 dark:text-slate-400">
                        {filteredHistory.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-400 italic">No existen registros históricos para este almacén</td>
                          </tr>
                        ) : (
                          filteredHistory.map(t => (
                            <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                              <td className="p-4 font-mono text-[11px] text-slate-500 tabular-nums">{formatDate(t.date)}</td>
                              <td className="p-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{t.sku}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-tight",
                                  t.tipo === 'ingreso' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-500"
                                )}>
                                  {t.tipo}
                                </span>
                              </td>
                              <td className="p-4 text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t.uom}</td>
                              <td className={cn(
                                "p-4 text-right font-bold tabular-nums",
                                t.tipo === 'ingreso' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {t.tipo === 'ingreso' ? '+' : '-'}{t.cantidad}
                              </td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => setTransactions(prev => prev.filter(p => p.id !== t.id))}
                                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'master' && (
              <motion.div 
                key="master"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 min-h-0"
              >
                <Card title="Gestión de Maestro de Materiales" className="h-full">
                  <div className="overflow-auto flex-1 h-[450px]">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="p-4">SKU Código</th>
                          <th className="p-4">Descripción Completa</th>
                          <th className="p-4 text-right">Cajas por Pallet</th>
                          <th className="p-4 text-right">Operación</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-slate-600 dark:text-slate-400">
                        {filteredMaterials.map(m => (
                          <tr key={m.sku} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                            <td className="p-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{m.sku}</td>
                            <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{m.descripcion}</td>
                            <td className="p-4 text-right font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">{m.cajasPorPallet}</td>
                            <td className="p-4 text-right">
                               <div className="flex justify-end gap-2">
                                 <button 
                                    onClick={() => setEditingMaterial(m)}
                                    className="text-slate-300 hover:text-blue-500 transition-colors p-1"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => setMaterials(prev => prev.filter(p => m.sku !== p.sku))}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                          </tr>
                        ))}
                        {filteredMaterials.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-slate-400 italic">No existen materiales registrados en el maestro</td>
                          </tr>
                        ) }
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* --- Manual Entry Modal --- */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsManualModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Registro de Movimiento</h2>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest italic">Bodega: {activeWarehouse}</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const sku = formData.get('sku') as string;
                  const cantidad = Number(formData.get('cantidad'));
                  const uom = formData.get('uom') as string;

                  if (!materials.find(m => m.sku === sku)) {
                    alert('SKU no válido o no existente en el maestro');
                    return;
                  }

                  const newT: Transaction = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    sku,
                    tipo: manualType,
                    uom: uom || 'Unidad',
                    cantidad,
                    warehouse: activeWarehouse,
                    estado: manualState
                  };

                  setTransactions(prev => [...prev, newT]);
                  setIsManualModalOpen(false);
                }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {(['ingreso', 'egreso'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setManualType(type)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                          manualType === type 
                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {(['Apto', 'No Apto'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setManualState(st)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                          manualState === st 
                            ? (st === 'Apto' ? "bg-white dark:bg-slate-700 text-green-600 shadow-sm" : "bg-white dark:bg-slate-700 text-red-600 shadow-sm")
                            : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {st === 'Apto' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Selección de SKU</label>
                    <div className="relative">
                      <select 
                        name="sku" 
                        required 
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none dark:text-slate-200"
                      >
                        <option value="">Buscar en el maestro...</option>
                        {materials.map(m => (
                          <option key={m.sku} value={m.sku}>[{m.sku}] {m.descripcion}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cantidad Operativa</label>
                      <input 
                        type="number" 
                        name="cantidad" 
                        required 
                        min="1"
                        placeholder="Ej: 120"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Unidad de Medida</label>
                      <input 
                        type="text" 
                        name="uom" 
                        placeholder="Botellas, Cajas..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex gap-3">
                    <Button type="submit" className="flex-1 py-3.5 rounded-xl text-lg font-bold" disabled={materials.length === 0}>
                      Procesar Registro
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setIsManualModalOpen(false)}
                      className="px-6 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                  {materials.length === 0 && (
                    <p className="text-[10px] text-red-500 font-bold uppercase text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">Debe cargar materiales en el maestro primero</p>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* --- Edit Material Modal --- */}
        {editingMaterial && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setEditingMaterial(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Editar Material</h2>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest italic">SKU: {editingMaterial.sku}</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const descripcion = formData.get('descripcion') as string;
                  const cajasPorPallet = Number(formData.get('cajasPorPallet'));

                  setMaterials(prev => prev.map(m => 
                    m.sku === editingMaterial.sku 
                      ? { ...m, descripcion, cajasPorPallet }
                      : m
                  ));
                  setEditingMaterial(null);
                }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Descripción</label>
                    <input 
                      type="text" 
                      name="descripcion" 
                      defaultValue={editingMaterial.descripcion}
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cajas por Pallet</label>
                    <input 
                      type="number" 
                      name="cajasPorPallet" 
                      defaultValue={editingMaterial.cajasPorPallet}
                      required 
                      min="1"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-slate-200"
                    />
                  </div>

                  <div className="pt-6 flex gap-3">
                    <Button type="submit" className="flex-1 py-3.5 rounded-xl text-lg font-bold">
                      Guardar Cambios
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setEditingMaterial(null)}
                      className="px-6 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* --- Add Material Modal --- */}
        {isAddMaterialModalOpen && (
          <div className="fixed inset-0 z-[102] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAddMaterialModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Nuevo Material</h2>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest italic">Maestro de Materiales</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const sku = formData.get('sku') as string;
                  const descripcion = formData.get('descripcion') as string;
                  const cajasPorPallet = Number(formData.get('cajasPorPallet'));

                  if (materials.find(m => m.sku === sku)) {
                    alert('Este SKU ya existe en el maestro');
                    return;
                  }

                  setMaterials(prev => [...prev, { sku, descripcion, cajasPorPallet }]);
                  setIsAddMaterialModalOpen(false);
                }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Código SKU</label>
                    <input 
                      type="text" 
                      name="sku" 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Descripción</label>
                    <input 
                      type="text" 
                      name="descripcion" 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cajas por Pallet</label>
                    <input 
                      type="number" 
                      name="cajasPorPallet" 
                      required 
                      min="1"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-slate-200"
                    />
                  </div>

                  <div className="pt-6 flex gap-3">
                    <Button type="submit" className="flex-1 py-3.5 rounded-xl text-lg font-bold">
                      Añadir Material
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddMaterialModalOpen(false)}
                      className="px-6 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
