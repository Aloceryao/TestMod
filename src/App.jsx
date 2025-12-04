import React, { useState, useEffect, useMemo, memo, useRef, useCallback } from 'react';
import { 
  Beer, GlassWater, Calculator, Settings, Plus, Search, Edit3, Trash2, 
  Save, History, AlertTriangle, Download, Upload, RefreshCcw, X, ChevronLeft, 
  Wine, Camera, AlertCircle, Tag, Check, DollarSign, Filter, Layers, Quote, 
  FilePlus, Globe, Star, FolderPlus, BookOpen, MoreHorizontal, LayoutGrid, 
  ListPlus, ArrowLeft, Image as ImageIcon, Database, Info, Percent
} from 'lucide-react';

// ==========================================
// 0. IndexedDB Image Storage
// ==========================================

const DB_NAME = 'BarManagerDB';
const STORE_NAME = 'images';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const ImageDB = {
  save: async (id, dataUrl) => {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(dataUrl, id);
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error("DB Save Error:", e);
      throw e;
    }
  },
  get: async (id) => {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("DB Get Error:", e);
      return null;
    }
  },
  delete: async (id) => {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error("DB Delete Error:", e);
    }
  }
};

const useImageLoader = (imageId) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!imageId) {
      setSrc(null);
      return;
    }
    if (imageId.startsWith('data:') || imageId.startsWith('http')) {
      setSrc(imageId);
      return;
    }

    let isMounted = true;
    ImageDB.get(imageId).then(data => {
      if (isMounted && data) setSrc(data);
    }).catch(err => console.error("Failed to load image:", err));

    return () => { isMounted = false; };
  }, [imageId]);

  return src;
};

const AsyncImage = memo(({ imageId, alt, className, fallback }) => {
  const src = useImageLoader(imageId);
  
  if (!src) {
    return fallback || (
      <div className={`bg-slate-800 flex items-center justify-center text-slate-700 ${className}`}>
        <Wine size={32} opacity={0.3}/>
      </div>
    );
  }
  
  return <img src={src} alt={alt} className={className} loading="lazy" />;
});

// ==========================================
// 0.5 Error Boundary
// ==========================================

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center z-[80]">
          <div className="w-20 h-20 bg-rose-900/30 rounded-full flex items-center justify-center mb-6"><AlertTriangle size={40} className="text-rose-500" /></div>
          <h1 className="text-2xl font-bold mb-2">應用程式發生錯誤</h1>
          <button onClick={() => window.location.reload()} className="w-full max-w-xs py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold text-white shadow-lg">重新整理頁面</button>
        </div>
      );
    }
    return this.props.children; 
  }
}

// ==========================================
// 1. Constants & Helper Functions
// ==========================================

const DEFAULT_BASE_SPIRITS = ['Gin 琴酒', 'Whisky 威士忌', 'Rum 蘭姆酒', 'Tequila 龍舌蘭', 'Vodka 伏特加', 'Brandy 白蘭地', 'Liqueur 利口酒'];

const ICON_TYPES = {
  whisky: { label: '威士忌杯', component: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 4h14v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4z" /><path d="M5 10h14" /></svg> },
  martini: { label: '馬丁尼杯', component: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 22h8" /><path d="M12 22v-11" /><path d="M2 3l10 10 10-10" /></svg> },
  highball: { label: '高球杯', component: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 3h10v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3z" /></svg> },
  snifter: { label: '白蘭地杯', component: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 21h10" /><path d="M12 21v-3" /><path d="M6 10h12" /><path d="M19 10a7 7 0 0 0-14 0c0 4.5 3.5 8 7 8s7-3.5 7-8z" /></svg> },
  shot: { label: '一口杯', component: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 3l-2 18H8L6 3h12z" /></svg> },
  wine: { label: '酒杯', component: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21h6" /><path d="M12 21v-6" /><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-1.5-4.5l-3.5 2-3.5-2C7.5 6 7 8 7 10a5 5 0 0 0 5 5z"/></svg> },
  shaker: { label: '雪克杯', component: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9h12v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z" /><path d="M6 5h12v4H6z" /><path d="M9 2h6v3H9z" /></svg> },
  soft: { label: '軟飲', component: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /></svg> }
};

const CategoryIcon = ({ iconType, className }) => {
  const IconComponent = ICON_TYPES[iconType]?.component || ICON_TYPES['shaker'].component;
  return <IconComponent className={className} />;
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const safeString = (str) => (str || '').toString();
const safeNumber = (num) => { const n = parseFloat(num); return isNaN(n) ? 0 : n; };

const calculateRecipeStats = (recipe, allIngredients) => {
  if (!recipe) return { cost: 0, costRate: 0, abv: 0, volume: 0, price: 0, finalAbv: 0 };

  if (recipe.type === 'single' || recipe.isIngredient) {
     const capacity = safeNumber(recipe.bottleCapacity) || safeNumber(recipe.volume) || 700;
     const cost = safeNumber(recipe.bottleCost) || safeNumber(recipe.price) || 0;
     const price = safeNumber(recipe.priceGlass) || safeNumber(recipe.priceShot) || 0; 
     const costRate = price > 0 ? ((cost / capacity * 50) / price) * 100 : 0; 
     return { cost, costRate, finalAbv: safeNumber(recipe.abv) || 40, volume: capacity, price };
  }
  
  let totalCost = 0, totalAlcoholVol = 0, totalVolume = 0;
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach(item => {
      const ing = (allIngredients || []).find(i => i.id === item.id);
      const amount = safeNumber(item.amount);
      if (ing) {
        const pricePerMl = safeNumber(ing.price) / safeNumber(ing.volume);
        totalCost += pricePerMl * amount;
        totalAlcoholVol += amount * (safeNumber(ing.abv) / 100);
        totalVolume += amount;
      }
    });
  }
  if (recipe.garnish) totalCost += 5;
  let dilution = 0;
  if (recipe.technique === 'Stir') dilution = totalVolume * 0.15;
  else if (recipe.technique === 'Shake') dilution = totalVolume * 0.25;
  else if (recipe.technique === 'Build') dilution = totalVolume * 0.05;
  
  const finalVolume = totalVolume + dilution;
  const finalAbv = finalVolume > 0 ? (totalAlcoholVol / finalVolume) * 100 : 0;
  const price = recipe.price && recipe.price > 0 ? recipe.price : Math.ceil((totalCost / 0.3) / 10) * 10; 
  const costRate = price > 0 ? (totalCost / price) * 100 : 0;

  return { cost: Math.round(totalCost), costRate, finalAbv, volume: Math.round(finalVolume), price };
};

// ==========================================
// 2. Components
// ==========================================

const PricingTable = ({ recipe }) => {
  if (recipe.type !== 'single' && !recipe.isIngredient) return null;

  const capacity = safeNumber(recipe.bottleCapacity) || safeNumber(recipe.volume) || 700;
  const cost = safeNumber(recipe.bottleCost) || safeNumber(recipe.price) || 0;
  const costPerMl = capacity > 0 ? cost / capacity : 0;
  const userTargetRate = safeNumber(recipe.targetCostRate) || 25;
  const targetCostRateDecimal = userTargetRate / 100;

  const formatCurrency = (val) => Math.round(val || 0).toLocaleString();
  const formatCost = (val) => (val || 0).toFixed(1);

  const getMargin = (price, itemCost) => {
    const numPrice = safeNumber(price);
    if (!numPrice || numPrice === 0) return '-';
    const margin = ((numPrice - itemCost) / numPrice) * 100;
    return `${Math.round(margin)}%`;
  };

  const getMarginColor = (price, itemCost) => {
     const numPrice = safeNumber(price);
     if (!numPrice || numPrice === 0) return 'text-slate-500';
     const margin = ((numPrice - itemCost) / numPrice) * 100;
     return margin < 70 ? 'text-rose-400' : 'text-emerald-400';
  }

  const rows = [
    { label: 'Shot (30ml)', cost: costPerMl * 30, suggest: (costPerMl * 30) / targetCostRateDecimal, price: recipe.priceShot, isMain: false },
    { label: '單杯 (50ml)', cost: costPerMl * 50, suggest: (costPerMl * 50) / targetCostRateDecimal, price: recipe.priceGlass, isMain: true },
    { label: '整瓶', cost: cost, suggest: cost / targetCostRateDecimal, price: recipe.priceBottle, isMain: false },
  ];

  return (
    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 mb-6 mt-4">
      <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs uppercase tracking-wider">
            <DollarSign size={14} />
            <span>成本與售價分析</span>
         </div>
         <div className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            Target CR: {userTargetRate}%
         </div>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="grid grid-cols-5 gap-2 text-[10px] text-slate-500 border-b border-slate-800 pb-2 mb-1 text-center font-bold uppercase"><div className="text-left pl-2">規格</div><div>成本</div><div>建議售價</div><div className="text-amber-500">自訂售價</div><div>毛利</div></div>
        {rows.map((row, idx) => (
          <div key={idx} className={`grid grid-cols-5 gap-2 items-center text-center py-2 rounded-lg ${row.isMain ? 'bg-slate-800/50 border border-slate-700/30' : ''}`}>
            <div className="text-left font-medium text-slate-200 pl-2 text-xs">{row.label}</div>
            <div className="text-slate-400 text-xs">${formatCost(row.cost)}</div>
            <div className="text-slate-500 text-xs">${formatCurrency(row.suggest)}</div>
            <div className={`font-bold font-mono text-sm ${safeNumber(row.price) > 0 ? 'text-amber-400' : 'text-slate-700'}`}>{safeNumber(row.price) > 0 ? `$${formatCurrency(row.price)}` : '-'}</div>
            <div className={`text-xs font-bold ${getMarginColor(row.price, row.cost)}`}>{getMargin(row.price, row.cost)}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500"><span>每毫升成本: ${formatCost(costPerMl)}</span><span>進貨成本: ${formatCurrency(cost)}</span></div>
    </div>
  );
};

// 新增：材料選擇器 Modal
const IngredientPickerModal = ({ isOpen, onClose, onSelect, ingredients, categories }) => {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  if (!isOpen) return null;

  const filtered = ingredients.filter(i => {
    const matchSearch = safeString(i.nameZh).toLowerCase().includes(search.toLowerCase()) || safeString(i.nameEn).toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === 'all' || i.type === activeCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex flex-col animate-fade-in sm:p-10">
       <div className="bg-slate-950 w-full max-w-lg mx-auto h-full sm:h-auto sm:max-h-[80vh] sm:rounded-2xl flex flex-col border border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 shrink-0">
             <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><ChevronLeft/></button>
             <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4"/>
                <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-slate-200 outline-none focus:border-amber-500" placeholder="搜尋材料..." />
             </div>
          </div>
          <div className="flex gap-2 p-2 px-4 overflow-x-auto border-b border-slate-800 shrink-0 no-scrollbar">
             <button onClick={()=>setActiveCat('all')} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${activeCat==='all'?'bg-amber-600 text-white border-amber-600':'text-slate-400 border-slate-700 bg-slate-900'}`}>全部</button>
             {categories.map(c => (
                <button key={c.id} onClick={()=>setActiveCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${activeCat===c.id?'bg-amber-600 text-white border-amber-600':'text-slate-400 border-slate-700 bg-slate-900'}`}>{c.label.split(' ')[0]}</button>
             ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-950">
             {filtered.map(ing => (
                <button key={ing.id} onClick={() => { onSelect(ing.id); onClose(); }} className="w-full text-left p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-amber-500/50 transition-all flex justify-between items-center group active:bg-slate-800">
                   <div>
                      <div className="text-slate-200 font-medium">{ing.nameZh}</div>
                      <div className="text-slate-500 text-xs">{ing.nameEn}</div>
                   </div>
                   <div className="flex items-center gap-2">
                      {ing.type === 'alcohol' && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{ing.subType || '基酒'}</span>}
                      <Plus size={16} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                   </div>
                </button>
             ))}
             {filtered.length === 0 && <div className="text-center text-slate-500 py-10">沒有找到相關材料</div>}
          </div>
       </div>
    </div>
  );
};

const IngredientRow = memo(({ ing, onClick, onDelete }) => (
  <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors group w-full">
    <div className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden" onClick={() => onClick(ing)}>
       <div className={`w-2 h-10 rounded-full shrink-0 ${['alcohol'].includes(ing.type) ? 'bg-purple-500/50' : ['soft'].includes(ing.type) ? 'bg-blue-500/50' : 'bg-slate-500/50'}`}></div>
       <div className="min-w-0">
         <div className="text-slate-200 font-medium truncate flex items-center gap-2">
            {safeString(ing.nameZh)}
            {ing.addToSingle && <span className="text-[8px] bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-800">單品</span>}
         </div>
         <div className="text-slate-500 text-xs truncate flex items-center gap-1"><span className="truncate">{safeString(ing.nameEn)}</span>{ing.type === 'alcohol' && ing.subType && (<span className="shrink-0 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">{safeString(ing.subType).split(' ')[0]}</span>)}</div>
       </div>
    </div>
    <div className="flex items-center gap-3 shrink-0">
       <div className="text-right cursor-pointer" onClick={() => onClick(ing)}>
          <div className="text-slate-300 text-sm font-mono">${ing.price}</div>
          <div className="text-slate-600 text-[10px]">{ing.volume}{safeString(ing.unit) || 'ml'}</div>
       </div>
       <button onClick={(e) => { e.stopPropagation(); onDelete(ing.id); }} className="p-3 -mr-2 text-slate-600 hover:text-rose-500 hover:bg-rose-900/20 rounded-full transition-colors active:scale-95"><Trash2 size={20} /></button>
    </div>
  </div>
));

const RecipeCard = memo(({ recipe, ingredients, onClick }) => {
  const stats = useMemo(() => calculateRecipeStats(recipe, ingredients), [recipe, ingredients]);
  const displayBase = safeString(recipe.baseSpirit).split(' ')[0] || '其他';
  const isSingle = recipe.type === 'single' || recipe.isIngredient;

  return (
    <div onClick={() => onClick(recipe)} className="group bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-800 hover:border-slate-700 transition-all active:scale-[0.98] flex flex-row h-36 w-full cursor-pointer">
      <div className="w-32 h-full relative shrink-0 bg-slate-900">
         <AsyncImage imageId={recipe.image} alt={safeString(recipe.nameZh)} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
         <div>
           <div className="flex justify-between items-start">
             <h3 className="text-lg font-bold text-white leading-tight font-serif tracking-wide truncate pr-2">{safeString(recipe.nameZh)}</h3>
             <div className="flex flex-col items-end gap-1 shrink-0"><div className="text-amber-400 font-bold text-lg font-mono leading-none">${isSingle ? (recipe.priceGlass || recipe.priceShot || '-') : stats.price}</div></div>
           </div>
           <p className="text-slate-400 text-xs font-medium tracking-wider uppercase truncate opacity-80 mb-1">{safeString(recipe.nameEn)}</p>
           {recipe.flavorDescription && (<div className="text-[10px] text-slate-500 line-clamp-1 italic mb-1.5 opacity-80">"{safeString(recipe.flavorDescription)}"</div>)}
           <div className="flex gap-1 flex-wrap">
             {isSingle ? (<span className="text-[10px] text-purple-200 bg-purple-900/40 px-1.5 py-0.5 rounded border border-purple-800/50">單品</span>) : (recipe.baseSpirit && <span className="text-[10px] text-blue-200 bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-800/50">{displayBase}</span>)}
             {recipe.tags?.slice(0,2).map(tag => (<span key={safeString(tag)} className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">{safeString(tag).split(' ')[0]}</span>))}
           </div>
         </div>
         <div className="flex items-center gap-3 text-xs font-mono text-slate-500 pt-1 border-t border-slate-700/50 mt-1">
           {isSingle ? (<><span className="text-slate-400">Pure Drink</span><span>|</span><span>{safeNumber(recipe.bottleCapacity) || safeNumber(recipe.volume)}ml</span></>) : (<><span className={stats.costRate > 30 ? 'text-rose-400' : 'text-emerald-400'}>CR {stats.costRate.toFixed(0)}%</span><span>|</span><span>{stats.finalAbv.toFixed(1)}% ABV</span></>)}
         </div>
      </div>
    </div>
  );
});

const Badge = ({ children, color = 'slate', className='' }) => {
  const colors = { slate: 'bg-slate-700 text-slate-300', amber: 'bg-amber-900/50 text-amber-500 border border-amber-500/20', blue: 'bg-blue-900/30 text-blue-400', rose: 'bg-rose-900/30 text-rose-400', purple: 'bg-purple-900/30 text-purple-400' };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors[color]} ${className}`}>{children}</span>;
};

const ChipSelector = ({ title, options, selected, onSelect }) => {
  const toggle = (opt) => { if (selected.includes(opt)) onSelect(selected.filter(s => s !== opt)); else onSelect([...selected, opt]); };
  return (
    <div className="space-y-2"><div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</div><div className="flex flex-wrap gap-2">{options.map(opt => (<button key={opt} onClick={() => toggle(opt)} className={`px-3 py-1.5 rounded-full text-xs transition-all border ${selected.includes(opt) ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-900/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}>{opt.split(' ')[0]}</button>))}</div></div>
  );
};

// ==========================================
// 3. Screen Components
// ==========================================

const CategoryEditModal = ({ isOpen, onClose, onSave }) => {
  const [nameZh, setNameZh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [iconType, setIconType] = useState('whisky');
  const [gradient, setGradient] = useState('from-slate-600 to-gray-700');
  if (!isOpen) return null;
  const handleSubmit = () => { if(!nameZh) return; onSave({ id: generateId(), nameZh, nameEn, iconType, gradient }); setNameZh(''); setNameEn(''); onClose(); };
  const gradients = [ { id: 'blue', val: 'from-blue-600 to-indigo-700' }, { id: 'amber', val: 'from-amber-600 to-orange-700' }, { id: 'emerald', val: 'from-emerald-600 to-teal-700' }, { id: 'rose', val: 'from-rose-600 to-pink-700' }, { id: 'purple', val: 'from-purple-600 to-violet-700' }, { id: 'cyan', val: 'from-cyan-600 to-blue-700' }, { id: 'slate', val: 'from-slate-600 to-gray-700' } ];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
       <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-scale-in">
          <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">新增分類色塊</h3><button onClick={onClose}><X className="text-slate-400"/></button></div>
          <div className="space-y-4">
             <div><label className="text-xs font-bold text-slate-500 uppercase">中文名稱</label><input value={nameZh} onChange={e=>setNameZh(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" placeholder="例如: 威士忌" /></div>
             <div><label className="text-xs font-bold text-slate-500 uppercase">英文/副標題</label><input value={nameEn} onChange={e=>setNameEn(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" placeholder="例如: Whisky" /></div>
             <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">選擇圖示</label><div className="grid grid-cols-4 gap-2">{Object.entries(ICON_TYPES).map(([key, val]) => (<button key={key} onClick={()=>setIconType(key)} className={`p-2 rounded-lg border flex items-center justify-center ${iconType === key ? 'bg-slate-700 border-amber-500 text-amber-500' : 'border-slate-700 text-slate-500'}`}>{val.component({ width: 20, height: 20 })}</button>))}</div></div>
             <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">選擇顏色</label><div className="flex flex-wrap gap-2">{gradients.map(g => (<button key={g.id} onClick={()=>setGradient(g.val)} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g.val} ring-2 ring-offset-2 ring-offset-slate-900 ${gradient === g.val ? 'ring-white' : 'ring-transparent'}`} />))}</div></div>
          </div>
          <button onClick={handleSubmit} className="w-full bg-amber-600 text-white font-bold py-3 rounded-xl mt-6">建立分類</button>
       </div>
    </div>
  );
};

const CategoryGrid = ({ categories, onSelect, onAdd, onDelete, isEditing, toggleEditing }) => {
  return (
    <div className="p-4 animate-fade-in">
       <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">快速分類</h3><button onClick={toggleEditing} className={`text-xs px-2 py-1 rounded border transition-colors ${isEditing ? 'bg-slate-700 text-white border-slate-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>{isEditing ? '完成' : '編輯'}</button></div>
       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <div key={cat.id || idx} onClick={() => !isEditing && onSelect(cat)} className={`relative h-28 rounded-2xl bg-gradient-to-br ${cat.gradient || 'from-slate-700 to-slate-800'} shadow-lg overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all border border-white/10 group`}>
               <div className="absolute -right-2 -bottom-4 w-24 h-24 text-white opacity-20 transform rotate-[-15deg] group-hover:scale-110 group-hover:opacity-30 transition-all duration-500 pointer-events-none"><CategoryIcon iconType={cat.iconType} /></div>
               <div className="absolute inset-0 p-4 flex flex-col justify-center items-center z-10"><span className="text-white font-bold text-xl text-center drop-shadow-md tracking-wide">{cat.nameZh}</span><span className="text-[10px] text-white/70 font-medium uppercase tracking-wider mt-1 border-t border-white/20 pt-1 px-2">{cat.nameEn}</span></div>
               {isEditing && <button onClick={(e) => { e.stopPropagation(); onDelete(cat.id); }} className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 animate-scale-in z-20"><X size={14} strokeWidth={3} /></button>}
            </div>
          ))}
          <button onClick={onAdd} className="h-28 rounded-2xl bg-slate-800/50 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all gap-2 group"><div className="p-3 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors"><Plus size={24} /></div><span className="text-xs font-bold">新增分類</span></button>
       </div>
    </div>
  );
};

const RecipeListScreen = ({ recipes, ingredients, searchTerm, setSearchTerm, recipeCategoryFilter, setRecipeCategoryFilter, startEdit, setViewingItem, availableTags, availableBases }) => {
  const [filterBases, setFilterBases] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeBlock, setActiveBlock] = useState(() => { try { const saved = localStorage.getItem('bar_active_grid_v1'); return saved ? JSON.parse(saved) : null; } catch { return null; } });
  const [isGridEditing, setIsGridEditing] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [gridCategories, setGridCategories] = useState(() => { try { const saved = localStorage.getItem('bar_grid_cats_v3'); if (saved) return JSON.parse(saved); } catch (e) {} return [ { id: 'gin', nameZh: 'Gin', nameEn: '琴酒', iconType: 'martini', gradient: 'from-blue-600 to-indigo-700' }, { id: 'whisky', nameZh: 'Whisky', nameEn: '威士忌', iconType: 'whisky', gradient: 'from-amber-600 to-orange-700' }, { id: 'rum', nameZh: 'Rum', nameEn: '蘭姆酒', iconType: 'highball', gradient: 'from-rose-600 to-pink-700' }, { id: 'tequila', nameZh: 'Tequila', nameEn: '龍舌蘭', iconType: 'shot', gradient: 'from-emerald-600 to-teal-700' }, { id: 'vodka', nameZh: 'Vodka', nameEn: '伏特加', iconType: 'martini', gradient: 'from-cyan-600 to-blue-700' }, { id: 'brandy', nameZh: 'Brandy', nameEn: '白蘭地', iconType: 'snifter', gradient: 'from-purple-600 to-violet-700' }, ]; });

  useEffect(() => { localStorage.setItem('bar_grid_cats_v3', JSON.stringify(gridCategories)); }, [gridCategories]);
  useEffect(() => { if (activeBlock) localStorage.setItem('bar_active_grid_v1', JSON.stringify(activeBlock)); else localStorage.removeItem('bar_active_grid_v1'); }, [activeBlock]);
  useEffect(() => { if (searchTerm) setActiveBlock(null); }, [searchTerm]);

  const showGrid = !searchTerm && !activeBlock && recipeCategoryFilter !== 'single' && recipeCategoryFilter !== 'all';
  
  const handleBlockSelect = (cat) => { setActiveBlock(cat); const baseMatch = availableBases.find(b => b.includes(cat.nameZh) || b.includes(cat.nameEn)); if (baseMatch) setFilterBases([baseMatch]); else if (availableTags.includes(cat.nameZh)) setFilterTags([cat.nameZh]); };
  const handleAddCategory = (newCat) => setGridCategories([...gridCategories, newCat]);
  const handleDeleteCategory = (id) => { if (confirm(`確定移除此方塊嗎？`)) setGridCategories(gridCategories.filter(c => c.id !== id)); };
  const clearBlockFilter = () => { setActiveBlock(null); setFilterBases([]); setFilterTags([]); };

  const filtered = useMemo(() => {
    const safeIngs = Array.isArray(ingredients) ? ingredients : [];
    const safeRecipes = Array.isArray(recipes) ? recipes : [];

    const singleIngredients = safeIngs
        .filter(i => i.addToSingle)
        .map(i => ({
            ...i,
            category: 'single', 
            type: 'single',
            baseSpirit: i.subType || '',
            priceShot: i.priceShot || '',
            priceGlass: i.priceGlass || '',
            priceBottle: i.priceBottle || '',
            targetCostRate: i.targetCostRate || 25,
            isIngredient: true
        }));

    let sourceList = safeRecipes;
    if (recipeCategoryFilter === 'single' || recipeCategoryFilter === 'all') {
        sourceList = [...safeRecipes, ...singleIngredients];
    }

    return sourceList.filter(r => {
      const matchCat = recipeCategoryFilter === 'all' || r.type === recipeCategoryFilter;
      const matchSearch = safeString(r.nameZh).includes(searchTerm) || safeString(r.nameEn).toLowerCase().includes(searchTerm.toLowerCase());
      const matchBase = filterBases.length === 0 || filterBases.includes(r.baseSpirit);
      const matchTags = filterTags.length === 0 || filterTags.every(t => r.tags?.includes(t));
      let matchGrid = true;
      if (activeBlock) {
         const baseMatch = availableBases.find(b => b.includes(activeBlock.nameZh) || b.includes(activeBlock.nameEn));
         if (baseMatch) matchGrid = r.baseSpirit === baseMatch;
         else matchGrid = r.tags?.includes(activeBlock.nameZh);
      }
      return matchCat && matchSearch && matchBase && matchTags && matchGrid;
    });
  }, [recipes, ingredients, recipeCategoryFilter, searchTerm, filterBases, filterTags, activeBlock, availableBases]);

  return (
    <div className="h-full flex flex-col animate-fade-in w-full bg-slate-950">
      <div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md pt-safe">
        <div className="px-4 py-3 flex gap-2 w-full">
           <div className="flex-1 relative"><Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4"/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜尋酒單..." className="w-full bg-slate-900 text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500/50 text-sm"/></div>
           {!showGrid && recipeCategoryFilter !== 'single' && (<button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-xl border transition-colors ${showFilters || filterBases.length > 0 || filterTags.length > 0 ? 'bg-slate-800 border-amber-500/50 text-amber-500' : 'border-slate-800 text-slate-400'}`}><Filter size={20} /></button>)}
           <button onClick={() => startEdit('recipe')} className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-all"><Plus size={20} /></button>
        </div>
        <div className="flex px-4 border-b border-slate-800/50 w-full overflow-x-auto no-scrollbar">
           {[{id: 'all', label: '全部 All'}, {id: 'classic', label: '經典 Classic'}, {id: 'signature', label: '特調 Signature'}, {id: 'single', label: '單品/純飲 Single'}].map(cat => (<button key={cat.id} onClick={() => setRecipeCategoryFilter(cat.id)} className={`flex-1 pb-3 px-4 text-sm font-medium border-b-2 transition-colors select-none whitespace-nowrap flex items-center justify-center gap-1 ${recipeCategoryFilter === cat.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}>{cat.label}</button>))}
        </div>
        {showFilters && !showGrid && recipeCategoryFilter !== 'single' && (<div className="p-4 bg-slate-900 border-b border-slate-800 animate-slide-up w-full"><div className="mb-4"><ChipSelector title="基酒篩選 (Base)" options={availableBases} selected={filterBases} onSelect={setFilterBases} /></div><div><ChipSelector title="風味篩選 (Flavor)" options={availableTags} selected={filterTags} onSelect={setFilterTags} /></div><div className="mt-4 flex justify-between items-center text-xs text-slate-500"><span>找到 {filtered.length} 款酒譜</span><button onClick={() => {setFilterBases([]); setFilterTags([]);}} className="text-rose-400 hover:text-rose-300">清除篩選</button></div></div>)}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {showGrid ? (<CategoryGrid categories={gridCategories} onSelect={handleBlockSelect} onAdd={() => setShowCatModal(true)} onDelete={handleDeleteCategory} isEditing={isGridEditing} toggleEditing={() => setIsGridEditing(!isGridEditing)} />) : (<div className="p-4 space-y-4 pb-24">{activeBlock && (<div className="flex items-center gap-3 mb-4 animate-fade-in"><button onClick={clearBlockFilter} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-200"><ArrowLeft size={20}/></button><div><div className="text-xs text-slate-500">正在檢視</div><div className="text-xl font-bold text-amber-500">{activeBlock.nameZh}</div></div></div>)}{filtered.length > 0 ? filtered.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} ingredients={ingredients} onClick={setViewingItem} />) : <div className="text-center py-10 text-slate-500 flex flex-col items-center"><Filter size={48} className="mb-4 opacity-20"/><p>沒有找到符合條件的酒譜</p>{activeBlock && <button onClick={clearBlockFilter} className="mt-4 text-amber-500 underline">返回分類</button>}</div>}<div className="h-10"></div></div>)}
      </div>
      <CategoryEditModal isOpen={showCatModal} onClose={() => setShowCatModal(false)} onSave={handleAddCategory} />
    </div>
  );
};

// ... FeaturedSectionScreen, InventoryScreen, QuickCalcScreen ...
const FeaturedSectionScreen = ({ sections, setSections, recipes, setViewingItem, ingredients, showConfirm }) => { const [activeSectionId, setActiveSectionId] = useState(() => { try { return localStorage.getItem('bar_active_section_v1'); } catch { return null; } }); const [isAdding, setIsAdding] = useState(false); const [isEditing, setIsEditing] = useState(false); const [newSectionTitle, setNewSectionTitle] = useState(''); const [newSubgroupTitle, setNewSubgroupTitle] = useState(''); const [showPicker, setShowPicker] = useState(false); const [pickingForSubgroupId, setPickingForSubgroupId] = useState(null); const [pickerSearch, setPickerSearch] = useState(''); useEffect(() => { if (activeSectionId) localStorage.setItem('bar_active_section_v1', activeSectionId); else localStorage.removeItem('bar_active_section_v1'); }, [activeSectionId]); const activeSection = sections.find(s => s.id === activeSectionId); useEffect(() => { if (activeSectionId && !activeSection) setActiveSectionId(null); }, [sections, activeSectionId, activeSection]); const handleAddSection = () => { if (newSectionTitle.trim()) { setSections([...sections, { id: generateId(), title: newSectionTitle.trim(), subgroups: [] }]); setNewSectionTitle(''); setIsAdding(false); } }; const handleDeleteSection = (id) => { showConfirm('刪除專區', '確定刪除此專區？', () => { setSections(sections.filter(s => s.id !== id)); if (activeSectionId === id) setActiveSectionId(null); }); }; const handleAddSubgroup = (sectionId) => { if (newSubgroupTitle.trim()) { const updatedSections = sections.map(s => { if (s.id === sectionId) { return { ...s, subgroups: [...s.subgroups, { id: generateId(), title: newSubgroupTitle.trim(), recipeIds: [] }] }; } return s; }); setSections(updatedSections); setNewSubgroupTitle(''); setIsAdding(false); } }; const handleDeleteSubgroup = (sectionId, subgroupId) => { showConfirm('刪除分類', '確定刪除此分類？', () => { const updatedSections = sections.map(s => { if (s.id === sectionId) { return { ...s, subgroups: s.subgroups.filter(sg => sg.id !== subgroupId) }; } return s; }); setSections(updatedSections); }); }; const handleAddRecipeToSubgroup = (recipeId) => { const updatedSections = sections.map(s => { if (s.id === activeSectionId) { const updatedSubgroups = s.subgroups.map(sg => { if (sg.id === pickingForSubgroupId && !sg.recipeIds.includes(recipeId)) { return { ...sg, recipeIds: [...sg.recipeIds, recipeId] }; } return sg; }); return { ...s, subgroups: updatedSubgroups }; } return s; }); setSections(updatedSections); setShowPicker(false); }; const handleRemoveRecipeFromSubgroup = (subgroupId, recipeId) => { const updatedSections = sections.map(s => { if (s.id === activeSectionId) { const updatedSubgroups = s.subgroups.map(sg => { if (sg.id === subgroupId) { return { ...sg, recipeIds: sg.recipeIds.filter(id => id !== recipeId) }; } return sg; }); return { ...s, subgroups: updatedSubgroups }; } return s; }); setSections(updatedSections); }; if (!activeSectionId) { return (<div className="h-full flex flex-col animate-fade-in w-full bg-slate-950"><div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md px-4 pt-safe pb-3"><div className="flex justify-between items-center mt-3"><h2 className="text-2xl font-serif text-slate-100">精選專區</h2><div className="flex gap-3"><button onClick={() => { setIsAdding(!isAdding); setIsEditing(false); }} className={`p-2 rounded-full border transition-all ${isAdding ? 'bg-amber-600 border-amber-500 text-white' : 'text-slate-400 border-slate-700 bg-slate-800'}`}><Plus size={20} /></button><button onClick={() => { setIsEditing(!isEditing); setIsAdding(false); }} className={`p-2 rounded-full border transition-all ${isEditing ? 'bg-slate-700 border-slate-500 text-white' : 'text-slate-400 border-slate-700 bg-slate-800'}`}><Edit3 size={20} /></button></div></div></div><div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 custom-scrollbar">{isAdding && (<div className="bg-slate-800 p-3 rounded-xl flex gap-2 border border-slate-700 animate-slide-up"><input value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} placeholder="新專區名稱" className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none" autoFocus /><button onClick={handleAddSection} className="bg-amber-600 text-white px-3 py-2 rounded font-bold text-sm">確認</button></div>)}<div className="space-y-4">{sections.map(section => (<div key={section.id} className="relative group"><div onClick={() => setActiveSectionId(section.id)} className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-amber-500/50 transition-all relative overflow-hidden shadow-lg h-32 flex flex-col justify-center active:scale-[0.98]"><div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><BookOpen size={80} /></div><h2 className="text-2xl font-serif text-white font-bold mb-1 relative z-10">{section.title}</h2><p className="text-slate-500 text-sm relative z-10">{section.subgroups?.length || 0} 個子分類</p></div>{isEditing && <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} className="absolute -top-2 -right-2 bg-rose-600 text-white p-2 rounded-full shadow-lg z-30 animate-scale-in hover:bg-rose-500"><Trash2 size={16} /></button>}</div>))}</div>{sections.length === 0 && !isAdding && <div className="text-center py-20 text-slate-500"><FolderPlus size={48} className="mx-auto mb-4 opacity-30" /><p>尚無專區</p></div>}</div></div>); } return (<div className="h-full flex flex-col animate-slide-up w-full bg-slate-950"><div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md px-4 pt-safe pb-3"><div className="flex items-center gap-3 mt-3"><button onClick={() => setActiveSectionId(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-700 active:bg-slate-700"><ChevronLeft size={20} /></button><h2 className="text-xl font-serif text-white font-bold flex-1 truncate">{activeSection.title}</h2><div className="flex gap-2"><button onClick={() => { setIsAdding(!isAdding); setIsEditing(false); }} className={`p-2 rounded-full border transition-all ${isAdding ? 'bg-amber-600 border-amber-500 text-white' : 'text-slate-500 border-slate-700 bg-slate-800'}`}><Plus size={18} /></button><button onClick={() => { setIsEditing(!isEditing); setIsAdding(false); }} className={`p-2 rounded-full border transition-all ${isEditing ? 'bg-slate-700 border-slate-500 text-white' : 'text-slate-500 border-slate-700 bg-slate-800'}`}><Edit3 size={18} /></button></div></div></div><div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 custom-scrollbar">{isAdding && (<div className="bg-slate-800 p-3 rounded-xl flex gap-2 border border-slate-700 animate-slide-up"><input value={newSubgroupTitle} onChange={e => setNewSubgroupTitle(e.target.value)} placeholder="新子分類名稱" className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none" autoFocus /><button onClick={() => handleAddSubgroup(activeSection.id)} className="bg-amber-600 text-white px-3 py-2 rounded font-bold text-sm">確認</button></div>)}<div className="space-y-8">{activeSection.subgroups.map(subgroup => (<div key={subgroup.id} className="space-y-3 relative"><div className="flex justify-between items-center border-b border-slate-800 pb-2"><h3 className="text-lg font-bold text-amber-500">{subgroup.title}</h3><div className="flex gap-2">{isEditing && <button onClick={() => handleDeleteSubgroup(activeSection.id, subgroup.id)} className="text-rose-500 p-1"><Trash2 size={16}/></button>}<button onClick={() => { setPickingForSubgroupId(subgroup.id); setShowPicker(true); }} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded-full border border-slate-700"><Plus size={12}/> 新增酒譜</button></div></div><div className="grid gap-3">{subgroup.recipeIds.length > 0 ? (subgroup.recipeIds.map(rid => { const recipe = recipes.find(r => r.id === rid); if (!recipe) return null; return (<div key={rid} className="relative group"><RecipeCard recipe={recipe} ingredients={ingredients} onClick={setViewingItem} />{isEditing && <button onClick={(e) => { e.stopPropagation(); handleRemoveRecipeFromSubgroup(subgroup.id, rid); }} className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>}</div>); })) : <div className="text-sm text-slate-600 italic py-2">點擊上方按鈕加入酒譜...</div>}</div></div>))}</div>{showPicker && (<div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col pt-10 animate-fade-in"><div className="bg-slate-900 flex-1 rounded-t-3xl border-t border-slate-700 flex flex-col overflow-hidden"><div className="p-4 border-b border-slate-800 flex justify-between items-center"><h3 className="text-lg font-bold text-white">選擇酒譜</h3><button onClick={() => setShowPicker(false)} className="p-2 bg-slate-800 rounded-full"><X size={20}/></button></div><div className="p-4 bg-slate-900 border-b border-slate-800"><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4"/><input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="搜尋名稱..." className="w-full bg-slate-800 text-white pl-9 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" /></div></div><div className="flex-1 overflow-y-auto p-4 space-y-2">{recipes.filter(r => safeString(r.nameZh).includes(pickerSearch) || safeString(r.nameEn).toLowerCase().includes(pickerSearch.toLowerCase())).map(r => (<button key={r.id} onClick={() => handleAddRecipeToSubgroup(r.id)} className="w-full text-left p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-500 flex justify-between items-center group"><div><div className="text-white font-medium">{r.nameZh}</div><div className="text-xs text-slate-500">{r.nameEn}</div></div><Plus className="text-amber-500 opacity-0 group-hover:opacity-100" size={16}/></button>))}</div></div></div>)}</div></div>); };
const InventoryScreen = ({ ingredients, startEdit, requestDelete, ingCategories, setIngCategories, showConfirm, onBatchAdd, availableBases }) => { const [categoryFilter, setCategoryFilter] = useState('all'); const [isAddingCat, setIsAddingCat] = useState(false); const [newCatName, setNewCatName] = useState(''); const [subCategoryFilter, setSubCategoryFilter] = useState('all'); const [showBatchModal, setShowBatchModal] = useState(false); const [batchText, setBatchText] = useState(''); const [batchCategory, setBatchCategory] = useState('other'); useEffect(() => { setSubCategoryFilter('all'); }, [categoryFilter]); const handleAddCategory = () => { if (newCatName.trim()) { const newId = generateId(); setIngCategories([...ingCategories, { id: newId, label: newCatName.trim() }]); setNewCatName(''); setIsAddingCat(false); setCategoryFilter(newId); } }; const deleteCategory = (id) => { if (['alcohol', 'soft', 'other'].includes(id)) return; showConfirm('刪除分類', '確定刪除此分類？', () => { setIngCategories(ingCategories.filter(c => c.id !== id)); if (categoryFilter === id) setCategoryFilter('all'); }); }; const handleBatchSubmit = () => { const lines = batchText.split('\n').filter(line => line.trim() !== ''); if (lines.length === 0) return; const newItems = lines.map(name => ({ id: generateId(), nameZh: name.trim(), nameEn: '', type: batchCategory, price: 0, volume: 700, unit: 'ml', abv: 0, subType: '' })); onBatchAdd(newItems); setBatchText(''); setShowBatchModal(false); }; const filteredIngredients = useMemo(() => { return ingredients.filter(i => { if (categoryFilter !== 'all' && i.type !== categoryFilter) return false; if (categoryFilter === 'alcohol' && subCategoryFilter !== 'all') { return i.subType === subCategoryFilter; } return true; }); }, [ingredients, categoryFilter, subCategoryFilter]); return (<div className="h-full flex flex-col animate-fade-in w-full bg-slate-950"><div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md px-4 pt-safe pb-0"><div className="flex justify-between items-center mb-4 mt-4"><h2 className="text-2xl font-serif text-slate-100">材料庫</h2><div className="flex gap-2"><button onClick={() => setShowBatchModal(true)} className="flex items-center gap-2 bg-slate-800 text-slate-400 px-3 py-2 rounded-full border border-slate-700 text-sm hover:bg-slate-700 hover:text-white transition-colors" title="批次新增"><FilePlus size={16} /> <span className="hidden sm:inline">批次</span></button><button onClick={() => startEdit('ingredient')} className="flex items-center gap-2 bg-slate-800 text-slate-200 px-4 py-2 rounded-full border border-slate-700 text-sm hover:bg-slate-700 hover:border-amber-500/50 transition-colors"><Plus size={16} /> 新增</button></div></div><div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full"><button onClick={() => setCategoryFilter('all')} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all select-none ${categoryFilter === 'all' ? 'bg-amber-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>全部</button>{ingCategories.map(cat => (<div key={cat.id} className="relative group"><button onClick={() => setCategoryFilter(cat.id)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all pr-4 select-none ${categoryFilter === cat.id ? 'bg-slate-700 text-white border border-amber-500/50 shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{cat.label}</button>{!['alcohol', 'soft', 'other'].includes(cat.id) && (<button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px]"><X size={8} strokeWidth={4}/></button>)}</div>))}{isAddingCat ? (<div className="flex items-center bg-slate-800 rounded-full px-2 py-1 border border-slate-600 animate-fade-in"><input autoFocus className="bg-transparent text-xs text-white w-16 outline-none" placeholder="分類名稱" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} onBlur={() => { if(!newCatName) setIsAddingCat(false); }} /><button onClick={handleAddCategory} className="text-amber-500 ml-1"><Check size={14}/></button></div>) : (<button onClick={() => setIsAddingCat(true)} className="p-1.5 bg-slate-800 rounded-full text-slate-500 hover:text-white hover:bg-slate-700"><Plus size={14}/></button>)}</div>{categoryFilter === 'alcohol' && (<div className="flex items-center gap-2 overflow-x-auto pb-2 mt-2 no-scrollbar w-full animate-slide-up"><span className="text-[10px] text-slate-500 font-bold shrink-0 uppercase tracking-wider pl-1">細項:</span><button onClick={()=>setSubCategoryFilter('all')} className={`whitespace-nowrap px-2 py-1 rounded text-[10px] font-medium transition-colors border ${subCategoryFilter === 'all' ? 'bg-slate-700 border-slate-600 text-white' : 'border-transparent text-slate-500'}`}>全部</button>{availableBases.map(spirit => (<button key={spirit} onClick={()=>setSubCategoryFilter(spirit)} className={`whitespace-nowrap px-2 py-1 rounded text-[10px] font-medium transition-colors border ${subCategoryFilter === spirit ? 'bg-slate-700 border-slate-600 text-white' : 'border-transparent text-slate-500'}`}>{safeString(spirit).split(' ')[0]}</button>))}</div>)}</div><div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24 custom-scrollbar">{filteredIngredients.map(ing => <IngredientRow key={ing.id} ing={ing} onClick={() => startEdit('ingredient', ing)} onDelete={(id) => requestDelete(id, 'ingredient')} />)}{filteredIngredients.length === 0 && <div className="text-center py-10 text-slate-500 flex flex-col items-center"><Layers size={40} className="mb-2 opacity-20"/><span>此分類無材料</span></div>}</div>{showBatchModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"><div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-scale-in flex flex-col max-h-[80vh]"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-white flex items-center gap-2"><FilePlus size={20}/> 批次新增材料</h3><button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white"><X size={24}/></button></div><p className="text-xs text-slate-400 mb-2">請輸入材料名稱，一行一個。新增後預設價格為 $0，可稍後再編輯。</p><textarea value={batchText} onChange={e => setBatchText(e.target.value)} placeholder={`例如:\n金巴利\n甜香艾酒\n蘇打水`} className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-3 text-slate-200 focus:border-amber-500 outline-none resize-none mb-4 h-48" autoFocus /><div className="mb-4"><label className="text-xs text-slate-500 font-bold uppercase block mb-1">預設分類</label><div className="flex gap-2">{ingCategories.slice(0, 3).map(cat => (<button key={cat.id} onClick={() => setBatchCategory(cat.id)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${batchCategory === cat.id ? 'bg-slate-700 border-amber-500 text-white' : 'border-slate-700 text-slate-500'}`}>{cat.label}</button>))}</div></div><button onClick={handleBatchSubmit} disabled={!batchText.trim()} className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-900/20">確認新增 {batchText.split('\n').filter(l => l.trim()).length > 0 ? `(${batchText.split('\n').filter(l => l.trim()).length} 筆)` : ''}</button></div></div>)}</div>); };
const QuickCalcScreen = ({ ingredients }) => { const [mode, setMode] = useState('single'); const [price, setPrice] = useState(''); const [volume, setVolume] = useState(700); const [targetCostRate, setTargetCostRate] = useState(25); const [draftIngs, setDraftIngs] = useState([]); const [technique, setTechnique] = useState('Stir'); const addDraftIng = (ingId) => { if(!ingId) return; setDraftIngs([...draftIngs, { id: ingId, amount: 30 }]); }; const updateDraftAmount = (idx, val) => { const newIngs = [...draftIngs]; newIngs[idx].amount = val; setDraftIngs(newIngs); }; const removeDraftIng = (idx) => { setDraftIngs(draftIngs.filter((_, i) => i !== idx)); }; const draftStats = useMemo(() => calculateRecipeStats({ ingredients: draftIngs, technique }, ingredients), [draftIngs, technique, ingredients]); return (<div className="h-full flex flex-col animate-fade-in text-slate-200 w-full bg-slate-950"><div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 p-4 pt-safe"><h2 className="text-xl font-serif mb-4 mt-4">成本計算工具</h2><div className="flex bg-slate-800 p-1 rounded-xl"><button onClick={() => setMode('single')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all select-none ${mode === 'single' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>純飲速算 (列表)</button><button onClick={() => setMode('draft')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all select-none ${mode === 'draft' ? 'bg-amber-600 text-white shadow' : 'text-slate-500'}`}>雞尾酒草稿 (Draft)</button></div></div><div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24 custom-scrollbar">{mode === 'single' ? (<div className="space-y-6 animate-fade-in"><div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">單瓶成本 ($)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="800" className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 outline-none focus:border-amber-500 text-white font-mono text-lg" /></div><div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">容量 (ml)</label><input type="number" value={volume} onChange={e => setVolume(e.target.value)} className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 outline-none focus:border-amber-500 text-white font-mono text-lg" /></div></div><div className="space-y-2 pt-2 border-t border-slate-800"><div className="flex justify-between items-center"><label className="text-xs font-bold text-slate-500 uppercase">目標成本率 (Cost Rate)</label><div className="flex items-center gap-2"><button onClick={() => setTargetCostRate(Math.max(10, targetCostRate - 5))} className="w-6 h-6 rounded bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700 hover:text-white">-</button><span className="text-amber-500 font-bold font-mono w-8 text-center">{targetCostRate}%</span><button onClick={() => setTargetCostRate(Math.min(100, targetCostRate + 5))} className="w-6 h-6 rounded bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700 hover:text-white">+</button></div></div><input type="range" min="10" max="80" step="1" value={targetCostRate} onChange={e => setTargetCostRate(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" /></div></div><div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-lg shadow-black/20"><table className="w-full text-sm"><thead><tr className="bg-slate-900 border-b border-slate-700"><th className="p-4 text-left font-bold text-slate-400">規格</th><th className="p-4 text-right font-bold text-slate-400">成本</th><th className="p-4 text-right font-bold text-amber-500">建議售價</th></tr></thead><tbody className="divide-y divide-slate-700/50">{[{ label: '1 ml', vol: 1 }, { label: '30 ml (Shot)', vol: 30 }, { label: '50 ml (Single)', vol: 50 }, { label: '60 ml (Double)', vol: 60 }, { label: '整瓶 (Bottle)', vol: safeNumber(volume) || 700 }].map((row, idx) => { const p = safeNumber(price); const v = safeNumber(volume) || 1; const cost = (p / v) * row.vol; const rate = safeNumber(targetCostRate) / 100 || 0.25; const sellPrice = p > 0 ? Math.ceil((cost / rate) / 10) * 10 : 0; return (<tr key={idx} className="hover:bg-slate-700/30 transition-colors"><td className="p-4 text-slate-200 font-medium">{row.label}{idx === 4 && <span className="block text-[10px] text-slate-500 font-normal">Based on {targetCostRate}% CR</span>}</td><td className="p-4 text-right text-slate-400 font-mono">${cost.toFixed(1)}</td><td className="p-4 text-right"><div className="text-amber-400 font-bold font-mono text-lg">${sellPrice}</div></td></tr>); })}</tbody></table></div></div>) : (<div className="space-y-4 animate-fade-in"><div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">調製法</label><div className="flex gap-2">{['Shake', 'Stir', 'Build'].map(t => (<button key={t} onClick={()=>setTechnique(t)} className={`flex-1 py-2 rounded-lg text-sm border ${technique===t ? 'bg-slate-700 border-amber-500 text-white' : 'border-slate-700 text-slate-500'}`}>{t}</button>))}</div></div><div className="space-y-3">{draftIngs.map((item, idx) => { const ing = ingredients.find(i => i.id === item.id); return (<div key={idx} className="flex gap-2 items-center animate-slide-up"><div className="flex-1 p-3 bg-slate-800 rounded-xl border border-slate-700 text-sm">{ing?.nameZh}</div><input type="number" value={item.amount} onChange={e => updateDraftAmount(idx, Number(e.target.value))} className="w-20 p-3 bg-slate-800 rounded-xl border border-slate-700 text-center font-mono outline-none focus:border-amber-500"/><button onClick={() => removeDraftIng(idx)} className="p-3 text-rose-500 bg-slate-800 rounded-xl border border-slate-700 hover:bg-rose-900/20"><Trash2 size={18}/></button></div>); })}<select className="w-full p-3 bg-slate-800/50 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-400 transition-colors text-center appearance-none cursor-pointer" onChange={e => { addDraftIng(e.target.value); e.target.value = ''; }}><option value="">+ 加入材料</option>{ingredients.map(i => <option key={i.id} value={i.id}>{i.nameZh}</option>)}</select></div><div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 mt-6 shadow-xl"><div className="grid grid-cols-2 gap-6 mb-4"><div><div className="text-xs text-slate-500 mb-1">總成本</div><div className="text-2xl font-mono text-rose-400 font-bold">${draftStats.cost}</div></div><div className="text-right"><div className="text-xs text-slate-500 mb-1">總容量 (含融水)</div><div className="text-2xl font-mono text-blue-400 font-bold">{draftStats.volume}ml</div></div></div><div className="pt-4 border-t border-slate-700 flex justify-between items-center"><span className="text-slate-400 text-sm">預估酒精濃度</span><span className="text-xl font-bold text-amber-500">{draftStats.finalAbv.toFixed(1)}%</span></div></div></div>)}</div></div>); };

// ==========================================
// 4. Overlays (Editor & Viewer)
// ==========================================

const EditorSheet = ({ mode, item, setItem, onSave, onClose, ingredients, availableTechniques, setAvailableTechniques, availableTags, setAvailableTags, availableGlasses, setAvailableGlasses, availableBases, setAvailableBases, requestDelete, ingCategories, showAlert }) => {
  const fileInputRef = useRef(null);
  const [addingItem, setAddingItem] = useState(null); 
  const [newItemValue, setNewItemValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 新增：材料選擇器 Modal 狀態
  const [showIngPicker, setShowIngPicker] = useState(false);
  const [pickerTargetIndex, setPickerTargetIndex] = useState(null);

  if (!mode || !item) return null;

  const handleAddItem = () => { if (!newItemValue.trim()) return; const val = newItemValue.trim(); if (addingItem === 'technique') setAvailableTechniques([...availableTechniques, val]); if (addingItem === 'glass') setAvailableGlasses([...availableGlasses, val]); if (addingItem === 'tag') setAvailableTags([...availableTags, val]); if (addingItem === 'base') setAvailableBases([...availableBases, val]); setAddingItem(null); setNewItemValue(''); };
  const handleImageUpload = (e) => { const file = e.target.files[0]; if (!file) return; if (file.size > 10 * 1024 * 1024) { if(showAlert) showAlert('錯誤', '圖片太大，請選擇小於 10MB 的照片'); else alert('圖片太大'); return; } const reader = new FileReader(); reader.onload = (event) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); let width = img.width; let height = img.height; const MAX_WIDTH = 300; const MAX_HEIGHT = 300; if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } } canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height); const dataUrl = canvas.toDataURL('image/jpeg', 0.5); setItem({ ...item, image: dataUrl }); }; img.src = event.target.result; }; reader.readAsDataURL(file); };
  const handleRecipeIngChange = (idx, field, value) => { const newIngs = [...item.ingredients]; newIngs[idx][field] = value; setItem({ ...item, ingredients: newIngs }); };
  const addRecipeIng = () => { setItem({ ...item, ingredients: [...item.ingredients, { id: '', amount: 0 }] }); };
  const removeRecipeIng = (idx) => { const newIngs = item.ingredients.filter((_, i) => i !== idx); setItem({ ...item, ingredients: newIngs }); };
  const toggleTag = (tag) => { const tags = item.tags || []; if (tags.includes(tag)) setItem({ ...item, tags: tags.filter(t => t !== tag) }); else setItem({ ...item, tags: [...tags, tag] }); };
  const handleSaveWrapper = async () => { setIsSaving(true); try { await onSave(); } finally { setIsSaving(false); } };
  const stats = mode === 'recipe' ? calculateRecipeStats(item, ingredients) : null;
  const isSingle = item.type === 'single';

  // --- Auto-Calculation Logic ---
  const autoCalcPricesForIngredient = (currentItem) => {
    if (!currentItem.addToSingle) return currentItem;
    const price = safeNumber(currentItem.price);
    const vol = safeNumber(currentItem.volume);
    const rate = safeNumber(currentItem.targetCostRate) || 25;
    if (price <= 0 || vol <= 0 || rate <= 0) return currentItem;
    const costPerMl = price / vol;
    const rateDecimal = rate / 100;
    return {
      ...currentItem,
      priceShot: Math.ceil(((costPerMl * 30) / rateDecimal) / 5) * 5,
      priceGlass: Math.ceil(((costPerMl * 50) / rateDecimal) / 5) * 5,
      priceBottle: Math.ceil(((price / rateDecimal) / 10) * 10)
    };
  };

  const autoCalcPricesForSingleRecipe = (currentItem) => {
    if (currentItem.type !== 'single') return currentItem;
    const price = safeNumber(currentItem.bottleCost);
    const vol = safeNumber(currentItem.bottleCapacity);
    const rate = safeNumber(currentItem.targetCostRate) || 25;
    if (price <= 0 || vol <= 0 || rate <= 0) return currentItem;
    const costPerMl = price / vol;
    const rateDecimal = rate / 100;
    return {
      ...currentItem,
      priceShot: Math.ceil(((costPerMl * 30) / rateDecimal) / 5) * 5,
      priceGlass: Math.ceil(((costPerMl * 50) / rateDecimal) / 5) * 5,
      priceBottle: Math.ceil(((price / rateDecimal) / 10) * 10)
    };
  };

  const handlePickerSelect = (id) => {
    if (pickerTargetIndex !== null) {
        handleRecipeIngChange(pickerTargetIndex, 'id', id);
    }
    setPickerTargetIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full md:w-[600px] bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-up border-l border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 z-10 pt-safe"><button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"><X size={24}/></button><h2 className="text-lg font-bold text-white font-serif">{mode === 'recipe' ? '編輯酒譜' : '編輯材料'}</h2><button onClick={handleSaveWrapper} disabled={isSaving} className="p-2 text-amber-500 hover:text-amber-400 bg-amber-900/20 rounded-full hover:bg-amber-900/40 transition disabled:opacity-50">{isSaving ? <RefreshCcw className="animate-spin" size={24} /> : <Check size={24}/>}</button></div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-safe-offset custom-scrollbar">
           <div className="space-y-2"><input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" /><div onClick={() => fileInputRef.current?.click()} className="w-full h-48 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer transition-colors hover:border-slate-500 active:scale-[0.99]">{item.image ? (<>{item.image.startsWith('data:') ? (<img src={item.image} className="w-full h-full object-cover" alt="Preview" />) : (<AsyncImage imageId={item.image} className="w-full h-full object-cover" />)}<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-white text-sm font-bold flex items-center gap-2"><Camera size={18}/> 更換照片</span></div></>) : (<div className="text-slate-500 flex flex-col items-center"><div className="p-4 bg-slate-700/50 rounded-full mb-2"><Camera size={32} /></div><span className="text-xs font-bold">點擊拍照或上傳</span></div>)}</div></div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">中文名稱</label><input value={item.nameZh} onChange={e => setItem({...item, nameZh: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" placeholder="例如: 內格羅尼" /></div>
              <div className="space-y-1 col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">英文名稱</label><input value={item.nameEn} onChange={e => setItem({...item, nameEn: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" placeholder="e.g. Negroni" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">分類</label><select value={item.type} onChange={e => setItem({...item, type: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none">{mode === 'recipe' ? (<><option value="classic">經典 Classic</option><option value="signature">特調 Signature</option><option value="single">單品/純飲 Single</option></>) : (ingCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>))}</select></div>
              {mode === 'ingredient' && item.type === 'alcohol' && (<div className="space-y-1"><div className="flex justify-between"><label className="text-xs font-bold text-slate-500 uppercase">基酒細項</label><button onClick={() => { setAddingItem('base'); setNewItemValue(''); }} className="text-[10px] text-amber-500">新增</button></div>{addingItem === 'base' ? (<div className="flex gap-2 h-[46px] items-center"><input autoFocus value={newItemValue} onChange={e=>setNewItemValue(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white" placeholder="輸入新基酒..."/><button onClick={handleAddItem} className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold shrink-0">V</button><button onClick={()=>setAddingItem(null)} className="text-slate-400 p-1"><X size={14}/></button></div>) : (<select value={item.subType} onChange={e => setItem({...item, subType: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none"><option value="">-- 無 --</option>{availableBases.map(s => <option key={s} value={s}>{s}</option>)}</select>)}</div>)}
              {mode === 'recipe' && !isSingle && (<div className="space-y-1"><div className="flex justify-between"><label className="text-xs font-bold text-slate-500 uppercase">基酒</label><button onClick={() => { setAddingItem('base'); setNewItemValue(''); }} className="text-[10px] text-amber-500">新增</button></div>{addingItem === 'base' ? (<div className="flex gap-2 h-[46px] items-center"><input autoFocus value={newItemValue} onChange={e=>setNewItemValue(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white" placeholder="輸入新基酒..."/><button onClick={handleAddItem} className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold shrink-0">V</button><button onClick={()=>setAddingItem(null)} className="text-slate-400 p-1"><X size={14}/></button></div>) : (<select value={item.baseSpirit} onChange={e => setItem({...item, baseSpirit: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none"><option value="">其他</option>{availableBases.map(b => <option key={b} value={b}>{b}</option>)}</select>)}</div>)}
           </div>
           
           {/* 材料庫編輯模式 */}
           {mode === 'ingredient' && (
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    {/* 加入 autoCalcPricesForIngredient 觸發 */}
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">價格 ($)</label><input type="number" value={item.price} onChange={e => setItem(autoCalcPricesForIngredient({...item, price: Number(e.target.value)}))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono" /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">容量 (ml)</label><input type="number" value={item.volume} onChange={e => setItem(autoCalcPricesForIngredient({...item, volume: Number(e.target.value)}))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono" /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">酒精度 (%)</label><input type="number" value={item.abv} onChange={e => setItem({...item, abv: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono" /></div>
                 </div>
                 
                 {/* 加入單品設定 */}
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                       <label className="text-sm font-bold text-slate-200 flex items-center gap-2"><Beer size={16} className="text-amber-500"/> 顯示於單品酒單</label>
                       <button onClick={() => {
                          const newState = !item.addToSingle;
                          if (newState) {
                             setItem(autoCalcPricesForIngredient({...item, addToSingle: newState, targetCostRate: item.targetCostRate || 25}));
                          } else {
                             setItem({...item, addToSingle: newState});
                          }
                       }} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${item.addToSingle ? 'bg-amber-600 justify-end' : 'bg-slate-700 justify-start'}`}>
                          <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                       </button>
                    </div>
                    {item.addToSingle && (
                       <div className="space-y-4 animate-slide-up">
                          <div className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-700">
                             <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Percent size={12}/> 目標成本率</label>
                             <div className="flex items-center gap-2">
                                <input type="number" value={item.targetCostRate || 25} onChange={e => setItem(autoCalcPricesForIngredient({...item, targetCostRate: Number(e.target.value)}))} className="w-12 text-center bg-transparent text-amber-500 font-mono font-bold outline-none border-b border-slate-700 focus:border-amber-500"/>
                                <span className="text-xs text-slate-500">%</span>
                             </div>
                          </div>
                          
                          <div className="space-y-3">
                             <div className="flex items-center gap-3"><label className="text-xs text-slate-400 w-24">Shot (30ml)</label><input type="number" value={item.priceShot || ''} onChange={e => setItem({...item, priceShot: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-amber-500" placeholder="自訂售價" /></div>
                             <div className="flex items-center gap-3"><label className="text-xs text-slate-400 w-24">單杯 (50ml)</label><input type="number" value={item.priceGlass || ''} onChange={e => setItem({...item, priceGlass: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-amber-500" placeholder="自訂售價" /></div>
                             <div className="flex items-center gap-3"><label className="text-xs text-slate-400 w-24">整瓶 Bottle</label><input type="number" value={item.priceBottle || ''} onChange={e => setItem({...item, priceBottle: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-amber-500" placeholder="自訂售價" /></div>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           )}
           
           {/* 酒譜編輯模式 */}
           {mode === 'recipe' && (
              <div className="space-y-6">
                 {/* 單品酒譜編輯 (Recipe Single) */}
                 {isSingle ? (
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                    <h3 className="text-amber-500 font-bold text-sm flex items-center gap-2"><DollarSign size={16}/> 單品成本設定</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">進貨價格 ($)</label><input type="number" value={item.bottleCost} onChange={e => setItem(autoCalcPricesForSingleRecipe({...item, bottleCost: e.target.value}))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono" placeholder="2000" /></div>
                       <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">瓶身容量 (ml)</label><input type="number" value={item.bottleCapacity} onChange={e => setItem(autoCalcPricesForSingleRecipe({...item, bottleCapacity: e.target.value}))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono" placeholder="700" /></div>
                    </div>
                    <div className="pt-2 border-t border-slate-800"></div>
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-amber-500 font-bold text-sm flex items-center gap-2"><Calculator size={16}/> 自訂售價</h3>
                       <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                          <span className="text-[10px] text-slate-400">Target CR:</span>
                          <input type="number" value={item.targetCostRate || 25} onChange={e => setItem(autoCalcPricesForSingleRecipe({...item, targetCostRate: Number(e.target.value)}))} className="w-8 bg-transparent text-xs text-amber-500 font-bold text-center outline-none"/>
                          <span className="text-[10px] text-slate-500">%</span>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3"><label className="text-xs text-slate-400 w-24">Shot (30ml)</label><input type="number" value={item.priceShot} onChange={e => setItem({...item, priceShot: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-amber-500" placeholder="自動計算..." /></div>
                       <div className="flex items-center gap-3"><label className="text-xs text-slate-400 w-24">單杯 (50ml)</label><input type="number" value={item.priceGlass} onChange={e => setItem({...item, priceGlass: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-amber-500" placeholder="自動計算..." /></div>
                       <div className="flex items-center gap-3"><label className="text-xs text-slate-400 w-24">整瓶 Bottle</label><input type="number" value={item.priceBottle} onChange={e => setItem({...item, priceBottle: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-amber-500" placeholder="自動計算..." /></div>
                    </div>
                 </div>
                 ) : (
                 <div className="space-y-2">
                    <div className="flex justify-between items-center"><label className="text-xs font-bold text-slate-500 uppercase">酒譜材料</label><button onClick={addRecipeIng} className="text-amber-500 text-xs font-bold flex items-center gap-1 hover:text-amber-400"><Plus size={14}/> 新增材料</button></div>
                    <div className="space-y-2">
                       {item.ingredients && item.ingredients.map((ingItem, idx) => (
                          <div key={idx} className="flex gap-2 items-center animate-slide-up">
                             {/* 替換原本的 Select 為 Button 觸發 Modal */}
                             <button 
                                onClick={() => { setPickerTargetIndex(idx); setShowIngPicker(true); }}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white text-left truncate hover:border-amber-500 transition-colors"
                             >
                                {ingredients.find(i => i.id === ingItem.id)?.nameZh || <span className="text-slate-500">選擇材料...</span>}
                             </button>
                             <input type="number" value={ingItem.amount} onChange={e => handleRecipeIngChange(idx, 'amount', Number(e.target.value))} className="w-20 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-center text-white outline-none focus:border-amber-500 font-mono" placeholder="ml"/>
                             <button onClick={() => removeRecipeIng(idx)} className="p-3 text-slate-600 hover:text-rose-500"><Trash2 size={18}/></button>
                          </div>
                       ))}
                    </div>
                 </div>
                 )}
                 {!isSingle && (<div className="bg-slate-800 rounded-xl p-4 border border-slate-700 grid grid-cols-2 gap-4"><div><div className="text-xs text-slate-500">總成本</div><div className="text-xl font-mono text-rose-400 font-bold">${stats.cost}</div></div><div><div className="text-xs text-slate-500">成本率</div><div className={`text-xl font-mono font-bold ${stats.costRate > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>{stats.costRate.toFixed(0)}%</div></div><div><div className="text-xs text-slate-500">預估 ABV</div><div className="text-xl font-mono text-blue-400 font-bold">{stats.finalAbv.toFixed(1)}%</div></div><div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase block">售價</label><input type="number" value={item.price || ''} onChange={e => setItem({...item, price: Number(e.target.value)})} placeholder={`建議: $${Math.ceil((stats.cost / 0.3) / 10) * 10}`} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-sm text-amber-500 font-bold text-right outline-none focus:border-amber-500"/></div></div>)}
                 {!isSingle && (<div className="grid grid-cols-2 gap-4"><div className="space-y-1"><div className="flex justify-between"><label className="text-xs font-bold text-slate-500 uppercase">調製法</label><button onClick={() => { setAddingItem('technique'); setNewItemValue(''); }} className="text-[10px] text-amber-500">新增</button></div>{addingItem === 'technique' ? (<div className="flex gap-2 h-[46px] items-center"><input autoFocus value={newItemValue} onChange={e=>setNewItemValue(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white" placeholder="輸入調法..."/><button onClick={handleAddItem} className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold shrink-0">V</button><button onClick={()=>setAddingItem(null)} className="text-slate-400 p-1"><X size={14}/></button></div>) : (<select value={item.technique} onChange={e => setItem({...item, technique: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none">{availableTechniques.map(t => <option key={t} value={t}>{t}</option>)}</select>)}</div><div className="space-y-1"><div className="flex justify-between"><label className="text-xs font-bold text-slate-500 uppercase">杯具</label><button onClick={() => { setAddingItem('glass'); setNewItemValue(''); }} className="text-[10px] text-amber-500">新增</button></div>{addingItem === 'glass' ? (<div className="flex gap-2 h-[46px] items-center"><input autoFocus value={newItemValue} onChange={e=>setNewItemValue(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white" placeholder="輸入杯具..."/><button onClick={handleAddItem} className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold shrink-0">V</button><button onClick={()=>setAddingItem(null)} className="text-slate-400 p-1"><X size={14}/></button></div>) : (<select value={item.glass} onChange={e => setItem({...item, glass: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none">{availableGlasses.map(g => <option key={g} value={g}>{g}</option>)}</select>)}</div><div className="space-y-1 col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">裝飾 (Garnish)</label><input value={item.garnish} onChange={e => setItem({...item, garnish: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="e.g. Orange Peel" /></div></div>)}
                 <div className="space-y-2"><div className="flex justify-between items-center"><label className="text-xs font-bold text-slate-500 uppercase">風味標籤</label><button onClick={() => { setAddingItem('tag'); setNewItemValue(''); }} className="text-xs text-amber-500">新增</button></div>{addingItem === 'tag' && (<div className="flex gap-2 items-center mb-2 animate-slide-up"><input autoFocus value={newItemValue} onChange={e=>setNewItemValue(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white" placeholder="輸入新標籤..."/><button onClick={handleAddItem} className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold">新增</button><button onClick={()=>setAddingItem(null)} className="text-slate-400 p-1"><X size={14}/></button></div>)}<div className="flex flex-wrap gap-2">{availableTags.map(tag => (<button key={tag} onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-full text-xs transition-all border ${item.tags?.includes(tag) ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{tag}</button>))}</div></div>
                 <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">步驟 / 備註</label><textarea value={item.steps} onChange={e => setItem({...item, steps: e.target.value})} className="w-full h-24 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 resize-none" placeholder="輸入製作步驟..." /></div>
                 <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">風味描述</label><textarea value={item.flavorDescription} onChange={e => setItem({...item, flavorDescription: e.target.value})} className="w-full h-16 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 resize-none" placeholder="簡短描述風味..." /></div>
              </div>
           )}
           <div className="pt-6 border-t border-slate-800"><button onClick={() => { if (requestDelete) requestDelete(item.id, mode); onClose(); }} className="w-full py-3 rounded-xl border border-rose-900/50 text-rose-500 hover:bg-rose-900/20 font-bold transition-colors flex items-center justify-center gap-2"><Trash2 size={18}/> 刪除此項目</button></div>
        </div>
      </div>

      {/* Ingredient Picker Modal */}
      <IngredientPickerModal 
         isOpen={showIngPicker} 
         onClose={() => setShowIngPicker(false)} 
         onSelect={handlePickerSelect}
         ingredients={ingredients}
         categories={ingCategories}
      />
    </div>
  );
};

// ... (其余部分保持不变) ...
// (ViewerOverlay, MainAppContent, App)
const ViewerOverlay = ({ item, onClose, ingredients, startEdit, requestDelete }) => {
  if (!item) return null;
  const stats = calculateRecipeStats(item, ingredients);
  const isSingle = item.type === 'single' || item.isIngredient;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
       <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
       <div className="relative w-full md:w-[600px] bg-slate-950 h-full shadow-2xl flex flex-col animate-slide-up overflow-hidden">
          
          {/* Hero Image */}
          <div className="relative h-72 shrink-0">
             <AsyncImage 
               imageId={item.image}
               alt={item.nameZh}
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
             
             {/* FIX: Corrected positioning classes for the back button */}
             <button 
               onClick={onClose} 
               className="absolute top-4 left-4 mt-safe p-2 bg-black/30 backdrop-blur rounded-full text-white hover:bg-white/20 transition z-50 shadow-lg"
             >
                <ChevronLeft size={24}/>
             </button>
             
             <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className="flex gap-2 mb-2">
                   {item.baseSpirit && <Badge color="blue">{item.baseSpirit}</Badge>}
                   <Badge color="amber">{item.technique}</Badge>
                </div>
                <h1 className="text-3xl font-serif font-bold text-white mb-1">{item.nameZh}</h1>
                <p className="text-slate-300 font-medium text-lg opacity-90">{item.nameEn}</p>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-950">
             {/* Stats Row */}
             {!isSingle && (
             <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                <div className="text-center">
                   <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">酒精濃度</div>
                   <div className="text-xl font-bold text-amber-500">{stats.finalAbv.toFixed(1)}%</div>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="text-center">
                   <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">成本率</div>
                   <div className={`text-xl font-bold ${stats.costRate > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>{stats.costRate.toFixed(0)}%</div>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="text-center">
                   <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">售價</div>
                   <div className="text-xl font-bold text-slate-200 font-mono">${item.price || stats.price}</div>
                </div>
             </div>
             )}

             {/* Ingredients */}
             {!isSingle && (
             <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Layers size={16}/> 材料</h3>
                <div className="space-y-3">
                   {item.ingredients.map((ingItem, idx) => {
                      const ing = ingredients.find(i => i.id === ingItem.id);
                      return (
                         <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800/50">
                            <span className="text-slate-200 font-medium">{ing?.nameZh || '未知材料'}</span>
                            <span className="text-amber-500 font-mono font-bold">{ingItem.amount}ml</span>
                         </div>
                      );
                   })}
                   {item.garnish && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                         <span className="text-slate-400 italic">Garnish: {item.garnish}</span>
                      </div>
                   )}
                </div>
             </div>
             )}

             {/* Single Cost Table (New) */}
             {isSingle && <PricingTable recipe={item} />}

             {/* Steps */}
             <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><ListPlus size={16}/> 步驟</h3>
                <div className="text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                   {item.steps || '無步驟描述'}
                </div>
             </div>

             {/* Flavor & Tags */}
             <div className="space-y-4">
                {item.flavorDescription && (
                  <div className="bg-gradient-to-br from-amber-900/10 to-transparent p-4 rounded-xl border border-amber-500/10 relative">
                     <Quote className="absolute top-2 left-2 text-amber-500/20" size={24}/>
                     <p className="text-amber-200/80 italic text-center relative z-10 text-sm">"{item.flavorDescription}"</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                   {item.tags?.map(tag => (
                      <span key={tag} className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">#{tag}</span>
                   ))}
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-950 pb-safe z-20 flex gap-3">
             <button 
               onClick={() => startEdit('recipe', item)} 
               className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95"
             >
               編輯酒譜
             </button>
          </div>
       </div>
    </div>
  );
};

// --- 6. Main App Container ---

function MainAppContent() {
  const [activeTab, setActiveTab] = useState(() => {
    try { 
      const t = localStorage.getItem('bar_active_tab_v3');
      const valid = ['recipes', 'featured', 'ingredients', 'quick', 'tools'];
      return valid.includes(t) ? t : 'recipes';
    } catch (e) { return 'recipes'; }
  });
  
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [sections, setSections] = useState([]);

  // Editor State
  const [editorMode, setEditorMode] = useState(null); // 'ingredient' | 'recipe'
  const [editingItem, setEditingItem] = useState(null);
  
  // Viewer State
  const [viewingItem, setViewingItem] = useState(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState('all');
  
  // Global Lists - Dynamic
  const [availableTags, setAvailableTags] = useState(['酸甜 Sour/Sweet', '草本 Herbal', '果香 Fruity', '煙燻 Smoky', '辛辣 Spicy', '苦味 Bitter']);
  const [availableTechniques, setAvailableTechniques] = useState(['Shake', 'Stir', 'Build', 'Roll', 'Blend']);
  const [availableGlasses, setAvailableGlasses] = useState(['Martini', 'Coupe', 'Rock', 'Highball', 'Collins', 'Shot']);
  const [availableBases, setAvailableBases] = useState(DEFAULT_BASE_SPIRITS);
  
  const [ingCategories, setIngCategories] = useState([
    { id: 'alcohol', label: '基酒 Alcohol' },
    { id: 'soft', label: '軟性飲料 Soft' },
    { id: 'other', label: '其他 Other' }
  ]);

  // Dialog System
  const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  // Load Data
  useEffect(() => {
    const load = (key, setter) => {
       try {
         const data = localStorage.getItem(key);
         if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) setter(parsed);
            else console.warn(`Data for ${key} is not an array, using default.`);
         } 
       } catch (e) {
         console.error(`Error loading ${key}:`, e);
       }
    };
    load('bar_ingredients_v3', setIngredients);
    load('bar_recipes_v3', setRecipes);
    load('bar_sections_v3', setSections);
    load('bar_tags_v3', setAvailableTags);
    load('bar_ing_cats_v3', setIngCategories);
    load('bar_techniques_v3', setAvailableTechniques);
    load('bar_glasses_v3', setAvailableGlasses);
    load('bar_bases_v1', setAvailableBases); 
  }, []);

  // Safe Persist Function (returns boolean success)
  const persistData = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Storage failed:", e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        return false;
      }
      return false; 
    }
  };
  
  // Only auto-save non-critical lists via useEffect. Critical data is saved in handlers.
  useEffect(() => { persistData('bar_sections_v3', sections); }, [sections]);
  useEffect(() => { persistData('bar_tags_v3', availableTags); }, [availableTags]);
  useEffect(() => { persistData('bar_ing_cats_v3', ingCategories); }, [ingCategories]);
  useEffect(() => { persistData('bar_techniques_v3', availableTechniques); }, [availableTechniques]);
  useEffect(() => { persistData('bar_glasses_v3', availableGlasses); }, [availableGlasses]);
  useEffect(() => { persistData('bar_bases_v1', availableBases); }, [availableBases]);
  useEffect(() => { persistData('bar_active_tab_v3', activeTab); }, [activeTab]);

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });
  const showConfirm = (title, message, onConfirm) => setDialog({ isOpen: true, type: 'confirm', title, message, onConfirm });
  const showAlert = (title, message) => setDialog({ isOpen: true, type: 'alert', title, message, onConfirm: null });

  const handleBatchAddIngredients = (newItems) => {
    const newList = [...ingredients, ...newItems];
    if (persistData('bar_ingredients_v3', newList)) {
      setIngredients(newList);
      showAlert('新增成功', `已成功新增 ${newItems.length} 項材料。`);
    } else {
      showAlert('儲存失敗', '空間不足，無法新增材料。');
    }
  };

  const requestDelete = async (id, type) => {
    const title = type === 'recipe' ? '刪除酒譜' : '刪除材料';
    
    // Check if ingredient is in use before deleting
    if (type === 'ingredient') {
      const inUseRecipes = recipes.filter(r => r.ingredients && r.ingredients.some(ing => ing.id === id));
      if (inUseRecipes.length > 0) {
         showAlert('無法刪除', `此材料正在被以下酒譜使用：\n${inUseRecipes.map(r => r.nameZh).join(', ')}\n\n請先將其從酒譜中移除。`);
         return;
      }
    }

    showConfirm(title, '確定要刪除嗎？此動作無法復原。', async () => {
       if (type === 'recipe') {
         // Cleanup Image
         const recipeToDelete = recipes.find(r => r.id === id);
         if (recipeToDelete && recipeToDelete.image && !recipeToDelete.image.startsWith('data:')) {
           await ImageDB.delete(recipeToDelete.image);
         }

         const newList = recipes.filter(r => r.id !== id);
         setRecipes(newList);
         persistData('bar_recipes_v3', newList);
         if (viewingItem?.id === id) setViewingItem(null);
       } else {
         const newList = ingredients.filter(i => i.id !== id);
         setIngredients(newList);
         persistData('bar_ingredients_v3', newList);
       }
    });
  };

  const handleImport = (e, mode) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (mode === 'overwrite') {
           setIngredients(data.ingredients || []);
           setRecipes(data.recipes || []);
           setSections(data.sections || []);
           persistData('bar_ingredients_v3', data.ingredients || []);
           persistData('bar_recipes_v3', data.recipes || []);
           persistData('bar_sections_v3', data.sections || []);
           showAlert('還原成功', '資料已完全覆蓋。');
        } else {
           const newIngs = (data.ingredients || []).filter(ni => !ingredients.some(ei => ei.id === ni.id));
           const newRecs = (data.recipes || []).filter(nr => !recipes.some(er => er.id === nr.id));
           const mergedIngs = [...ingredients, ...newIngs];
           const mergedRecs = [...recipes, ...newRecs];
           
           if (persistData('bar_ingredients_v3', mergedIngs) && persistData('bar_recipes_v3', mergedRecs)) {
              setIngredients(mergedIngs);
              setRecipes(mergedRecs);
              showAlert('合併成功', `已加入 ${newIngs.length} 項材料與 ${newRecs.length} 款酒譜。`);
           } else {
              showAlert('錯誤', '空間不足，無法合併資料。');
           }
        }
      } catch (err) {
        showAlert('錯誤', '檔案格式不正確');
      }
    };
    reader.readAsText(file);
  };

  const startEdit = (mode, item = null) => {
    setEditorMode(mode);
    if (item) {
      setEditingItem({ ...item });
    } else {
      if (mode === 'recipe') {
        setEditingItem({
           id: generateId(),
           nameZh: '', nameEn: '', type: 'classic', baseSpirit: '',
           price: 0, technique: 'Stir', glass: 'Coupe',
           ingredients: [], steps: '', tags: [], image: '', flavorDescription: '',
           bottleCost: '', bottleCapacity: 700, priceShot: '', priceGlass: '', priceBottle: '', targetCostRate: 25 
        });
      } else {
        setEditingItem({
           id: generateId(),
           nameZh: '', nameEn: '', type: 'other', subType: '',
           price: 0, volume: 700, unit: 'ml', abv: 0, addToSingle: false, targetCostRate: 25
        });
      }
    }
  };

  const saveItem = async () => {
    if (!editingItem.nameZh) return showAlert('錯誤', '請輸入名稱');
    
    let itemToSave = { ...editingItem };
    
    if (itemToSave.image && itemToSave.image.startsWith('data:')) {
       try {
         // Using the item ID as the image key makes sense for 1-to-1 relationships
         await ImageDB.save(itemToSave.id, itemToSave.image);
         // Only store the ID in localStorage to save space
         itemToSave.image = itemToSave.id;
       } catch (e) {
         console.error("Image Save Failed", e);
         showAlert('儲存失敗', '圖片資料庫錯誤，請重試');
         return;
       }
    }

    let newList;
    let key;
    
    if (editorMode === 'ingredient') {
       key = 'bar_ingredients_v3';
       const exists = ingredients.find(i => i.id === itemToSave.id);
       newList = exists ? ingredients.map(i => i.id === itemToSave.id ? itemToSave : i) : [...ingredients, itemToSave];
    } else {
       key = 'bar_recipes_v3';
       const exists = recipes.find(r => r.id === itemToSave.id);
       newList = exists ? recipes.map(r => r.id === itemToSave.id ? itemToSave : r) : [...recipes, itemToSave];
    }

    if (persistData(key, newList)) {
       if (editorMode === 'ingredient') setIngredients(newList);
       else {
         setRecipes(newList);
         // Update viewing item if we were editing it
         if (viewingItem && viewingItem.id === itemToSave.id) {
            setViewingItem(itemToSave);
         }
       }
       setEditorMode(null);
       setEditingItem(null);
    } else {
       showAlert('儲存失敗', '儲存空間已滿！請刪除一些舊的資料。');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 w-full flex flex-col overflow-hidden">
      <style>{`
        :root { font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif; line-height: 1.5; font-weight: 400; }
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #020617; display: block !important; place-items: unset !important; min-width: 0 !important; }
        #root { max-width: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; text-align: left !important; display: block !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .safe-top { padding-top: env(safe-area-inset-top); }
        .pt-safe { padding-top: env(safe-area-inset-top); }
        .mt-safe { margin-top: env(safe-area-inset-top); }
        .pt-safe-offset { padding-top: calc(12px + env(safe-area-inset-top)); }
        /* Tap Highlight Removal */
        * { -webkit-tap-highlight-color: transparent !important; }
        *:focus { outline: none !important; box-shadow: none !important; }
        input:focus, select:focus, textarea:focus { border-color: #f59e0b !important; box-shadow: 0 0 0 1px #f59e0b !important; outline: none !important; }
      `}</style>
      
      <main className="flex-1 relative overflow-hidden w-full">
        {activeTab === 'recipes' && (
          <RecipeListScreen 
            recipes={recipes} 
            ingredients={ingredients} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            recipeCategoryFilter={recipeCategoryFilter} 
            setRecipeCategoryFilter={setRecipeCategoryFilter} 
            startEdit={startEdit} 
            setViewingItem={setViewingItem} 
            availableTags={availableTags} 
            availableBases={availableBases}
          />
        )}
        
        {/* 獨立的專區頁面 */}
        {activeTab === 'featured' && (
           <FeaturedSectionScreen 
             sections={sections} 
             setSections={setSections} 
             recipes={recipes} 
             setViewingItem={setViewingItem} 
             ingredients={ingredients}
             showConfirm={showConfirm}
           />
        )}

        {activeTab === 'ingredients' && (
          <InventoryScreen 
            ingredients={ingredients} 
            startEdit={startEdit} 
            requestDelete={requestDelete} 
            ingCategories={ingCategories} 
            setIngCategories={setIngCategories} 
            showConfirm={showConfirm} 
            onBatchAdd={handleBatchAddIngredients} 
            availableBases={availableBases}
          />
        )}
        {activeTab === 'quick' && <QuickCalcScreen ingredients={ingredients} />}
        {activeTab === 'tools' && (
           <div className="h-full flex flex-col overflow-y-auto p-6 text-center space-y-6 pt-20 w-full custom-scrollbar pb-24">
             <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto flex items-center justify-center border border-slate-700 shadow-lg shadow-amber-900/10"><Wine size={32} className="text-amber-500"/></div>
             <h2 className="text-xl font-serif text-slate-200">Bar Manager v9.7 (Fix & Picker)</h2>
             
             <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 w-full">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                   <span>文字儲存空間使用量 (大約)</span>
                   <span>{(JSON.stringify(localStorage).length / 1024 / 1024).toFixed(2)} MB / 5.0 MB</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-amber-600 rounded-full transition-all duration-500" 
                     style={{ width: `${Math.min(100, (JSON.stringify(localStorage).length / (5 * 1024 * 1024)) * 100)}%` }}
                   />
                </div>
                <p className="text-[10px] text-emerald-500 mt-2 text-left flex items-center gap-1">
                   <Database size={12}/> 圖片資料庫 (IndexedDB) 已修復並啟用。
                </p>
             </div>

             <div className="space-y-3">
               <button onClick={() => { const data = JSON.stringify({ingredients, recipes, sections}); const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bar_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); }} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:bg-slate-700 transition"><Download className="text-blue-400"/><div className="text-left"><div className="text-slate-200 font-bold">匯出數據</div><div className="text-xs text-slate-500">備份到手機</div></div></button>
               
               <label className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:bg-slate-700 transition cursor-pointer">
                 <div className="p-2 bg-emerald-900/30 text-emerald-400 rounded-lg"><FilePlus size={24}/></div>
                 <div className="text-left flex-1"><div className="text-emerald-400 font-bold">智慧合併 (Merge)</div><div className="text-xs text-slate-500">保留現有資料，加入新資料</div></div>
                 <input type="file" className="hidden" accept=".json" onChange={(e) => handleImport(e, 'merge')}/>
               </label>

               <label className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:bg-slate-700 transition cursor-pointer">
                 <div className="p-2 bg-amber-900/30 text-amber-400 rounded-lg"><Upload size={24}/></div>
                 <div className="text-left flex-1"><div className="text-amber-400 font-bold">覆蓋還原 (Overwrite)</div><div className="text-xs text-slate-500">清空現有資料，完全還原</div></div>
                 <input type="file" className="hidden" accept=".json" onChange={(e) => handleImport(e, 'overwrite')}/>
               </label>

               <button onClick={() => { showConfirm('重置系統', '警告：此操作將刪除所有資料且無法還原。確定要繼續嗎？', () => { localStorage.clear(); location.reload(); }); }} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4 hover:bg-rose-900/20 transition group"><RefreshCcw className="text-rose-500 group-hover:rotate-180 transition-transform duration-500"/><div className="text-left"><div className="text-rose-500 font-bold">重置系統</div><div className="text-xs text-rose-500/50">刪除所有資料</div></div></button>
             </div>
           </div>
        )}
      </main>

      {dialog.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-4">
               {dialog.type === 'alert' ? <div className="w-12 h-12 rounded-full bg-rose-900/30 flex items-center justify-center text-rose-500"><AlertCircle size={32}/></div> : <div className="w-12 h-12 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-500"><AlertTriangle size={32}/></div>}
               <h3 className="text-xl font-bold text-white">{dialog.title}</h3>
               <p className="text-slate-300 text-sm whitespace-pre-wrap">{dialog.message}</p>
               <div className="flex gap-3 w-full pt-2">
                 {dialog.type === 'confirm' && <button onClick={closeDialog} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm">取消</button>}
                 <button onClick={() => { if(dialog.onConfirm) dialog.onConfirm(); closeDialog(); }} className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${dialog.type === 'confirm' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-700 hover:bg-slate-600'}`}>{dialog.type === 'confirm' ? '確認刪除' : '我知道了'}</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <nav className="shrink-0 bg-slate-950/90 backdrop-blur border-t border-slate-800 pb-safe z-30 w-full">
        <div className="w-full flex justify-around items-center h-16 w-full px-1">
          {[
            { id: 'recipes', icon: Beer, label: '酒單' },
            { id: 'featured', icon: Star, label: '專區' }, 
            { id: 'ingredients', icon: GlassWater, label: '材料庫' },
            { id: 'quick', icon: Calculator, label: '速算' },
            { id: 'tools', icon: Settings, label: '設定' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 ${activeTab === tab.id ? 'text-amber-500 -translate-y-1' : 'text-slate-600 hover:text-slate-400'}`}>
              <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'fill-amber-500/10' : ''} />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <EditorSheet 
        mode={editorMode} 
        item={editingItem} 
        setItem={setEditingItem} 
        onSave={saveItem} 
        onClose={() => setEditorMode(null)} 
        ingredients={ingredients} 
        availableTechniques={availableTechniques} 
        setAvailableTechniques={setAvailableTechniques} 
        availableTags={availableTags} 
        setAvailableTags={setAvailableTags} 
        availableGlasses={availableGlasses} 
        setAvailableGlasses={setAvailableGlasses} 
        availableBases={availableBases}
        setAvailableBases={setAvailableBases}
        requestDelete={requestDelete} 
        ingCategories={ingCategories} 
        setIngCategories={setIngCategories} 
        showAlert={showAlert} 
      />
      <ViewerOverlay item={viewingItem} onClose={() => setViewingItem(null)} ingredients={ingredients} startEdit={startEdit} requestDelete={requestDelete} />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <MainAppContent />
  </ErrorBoundary>
);

export default App;