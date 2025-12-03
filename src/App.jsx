import React, { useState, useEffect, useMemo, memo } from 'react';
import { 
  Beer, 
  GlassWater, 
  Calculator, 
  Settings, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  History, 
  AlertTriangle,
  Download,
  Upload,
  RefreshCcw,
  X,
  ChevronLeft,
  Wine,
  Camera,
  AlertCircle,
  Tag,
  Check,
  DollarSign,
  Filter,
  Layers,
  Quote,
  FilePlus,
  Globe,
  Star,      
  FolderPlus, 
  BookOpen,   
  MoreHorizontal,
  LayoutGrid,
  ListPlus,
  ArrowLeft
} from 'lucide-react';

// ==========================================
// 1. Constants & Helper Functions
// ==========================================

const BASE_SPIRITS = ['Gin 琴酒', 'Whisky 威士忌', 'Rum 蘭姆酒', 'Tequila 龍舌蘭', 'Vodka 伏特加', 'Brandy 白蘭地', 'Liqueur 利口酒'];

// --- Custom Line Art Icons for Categories ---
const CategoryIcon = ({ category, className }) => {
  const name = category.split(' ')[0].toLowerCase();
  
  // SVG Properties
  const props = {
    className,
    width: "100%", 
    height: "100%", 
    viewBox: "0 0 24 24", 
    fill: "none", 
    stroke: "currentColor", 
    strokeWidth: "1.5", 
    strokeLinecap: "round", 
    strokeLinejoin: "round"
  };

  // 1. Whisky (Rock Glass)
  if (name.includes('whisky') || name.includes('bourbon') || name.includes('scotch')) {
    return (
      <svg {...props}>
        <path d="M5 4h14v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4z" />
        <path d="M5 10h14" />
        <path d="M9 14h6" opacity="0.5"/>
      </svg>
    );
  }

  // 2. Gin / Vodka / Martini (Martini Glass)
  if (name.includes('gin') || name.includes('vodka') || name.includes('martini') || name.includes('classic')) {
    return (
      <svg {...props}>
        <path d="M8 22h8" />
        <path d="M12 22v-11" />
        <path d="M2 3l10 10 10-10" />
        <path d="M5 6h14" opacity="0.5"/>
      </svg>
    );
  }

  // 3. Rum / Highball (Highball Glass)
  if (name.includes('rum') || name.includes('long') || name.includes('fizz')) {
    return (
      <svg {...props}>
        <path d="M7 3h10v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3z" />
        <path d="M7 9h10" />
        <path d="M7 15h10" />
        <line x1="10" y1="3" x2="10" y2="22" strokeDasharray="2 2" opacity="0.3"/>
      </svg>
    );
  }

  // 4. Brandy (Snifter)
  if (name.includes('brandy') || name.includes('cognac')) {
    return (
      <svg {...props}>
        <path d="M7 21h10" />
        <path d="M12 21v-3" />
        <path d="M6 10h12" />
        <path d="M19 10a7 7 0 0 0-14 0c0 4.5 3.5 8 7 8s7-3.5 7-8z" />
        <path d="M12 10v4" opacity="0.5"/>
      </svg>
    );
  }

  // 5. Tequila / Shot (Shot Glass)
  if (name.includes('tequila') || name.includes('shot') || name.includes('mezcal')) {
    return (
      <svg {...props}>
        <path d="M18 3l-2 18H8L6 3h12z" />
        <path d="M7 9h10" opacity="0.5"/>
      </svg>
    );
  }

  // 6. Liqueur / Wine (Wine Glass / Bottle)
  if (name.includes('liqueur') || name.includes('wine')) {
    return (
      <svg {...props}>
         <path d="M9 21h6" />
         <path d="M12 21v-6" />
         <path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-1.5-4.5l-3.5 2-3.5-2C7.5 6 7 8 7 10a5 5 0 0 0 5 5z"/>
      </svg>
    );
  }

  // 7. Soft / Other (Tumbler/Lemon)
  if (name.includes('soft') || name.includes('juice')) {
     return (
       <svg {...props}>
         <circle cx="12" cy="12" r="9" />
         <path d="M12 3v18" opacity="0.3"/>
         <path d="M3 12h18" opacity="0.3"/>
         <path d="M18.36 5.64l-12.72 12.72" opacity="0.3"/>
         <path d="M5.64 5.64l12.72 12.72" opacity="0.3"/>
       </svg>
     );
  }
  
  // Default: Generic Cocktail Shaker
  return (
    <svg {...props}>
      <path d="M6 9h12v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z" />
      <path d="M6 5h12v4H6z" />
      <path d="M9 2h6v3H9z" />
    </svg>
  );
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const safeString = (str) => (str || '').toString();
const safeNumber = (num) => {
  const n = parseFloat(num);
  return isNaN(n) ? 0 : n;
};

// --- Optimized Calculation Logic ---
const calculateRecipeStats = (recipe, allIngredients) => {
  if (!recipe || !recipe.ingredients) return { cost: 0, costRate: 0, abv: 0, volume: 0, price: 0, finalAbv: 0 };
  
  let totalCost = 0;
  let totalAlcoholVol = 0;
  let totalVolume = 0;

  recipe.ingredients.forEach(item => {
    const ing = allIngredients.find(i => i.id === item.id);
    const amount = safeNumber(item.amount);
    if (ing) {
      const pricePerMl = safeNumber(ing.price) / safeNumber(ing.volume);
      totalCost += pricePerMl * amount;
      totalAlcoholVol += amount * (safeNumber(ing.abv) / 100);
      totalVolume += amount;
    }
  });

  // Garnish cost estimation (fixed $5 for simplicity if not tracked)
  if (recipe.garnish) totalCost += 5;

  // Dilution estimation (Simplified: Stir +15%, Shake +25%)
  let dilution = 0;
  if (recipe.technique === 'Stir') dilution = totalVolume * 0.15;
  if (recipe.technique === 'Shake') dilution = totalVolume * 0.25;
  if (recipe.technique === 'Build') dilution = totalVolume * 0.05; // Ice melt
  
  const finalVolume = totalVolume + dilution;
  const finalAbv = finalVolume > 0 ? (totalAlcoholVol / finalVolume) * 100 : 0;
  // If no price set, suggest 30% cost rate price
  const price = recipe.price && recipe.price > 0 ? recipe.price : Math.ceil((totalCost / 0.3) / 10) * 10; 
  const costRate = price > 0 ? (totalCost / price) * 100 : 0;

  return {
    cost: Math.round(totalCost),
    costRate,
    finalAbv,
    volume: Math.round(finalVolume),
    price
  };
};

// ==========================================
// 2. Memoized List Items (Performance Fix)
// ==========================================

// --- Ingredient Row Component ---
const IngredientRow = memo(({ ing, onClick, onDelete }) => (
  <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors group w-full">
    <div 
      className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden" 
      onClick={() => onClick(ing)}
    >
       <div className={`w-2 h-10 rounded-full shrink-0 ${['alcohol'].includes(ing.type) ? 'bg-purple-500/50' : ['soft'].includes(ing.type) ? 'bg-blue-500/50' : 'bg-slate-500/50'}`}></div>
       <div className="min-w-0">
         <div className="text-slate-200 font-medium truncate">{safeString(ing.nameZh)}</div>
         <div className="text-slate-500 text-xs truncate flex items-center gap-1">
           <span className="truncate">{safeString(ing.nameEn)}</span>
           {ing.type === 'alcohol' && ing.subType && (
             <span className="shrink-0 text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">{safeString(ing.subType).split(' ')[0]}</span>
           )}
         </div>
       </div>
    </div>
    
    <div className="flex items-center gap-3 shrink-0">
       <div className="text-right cursor-pointer" onClick={() => onClick(ing)}>
          <div className="text-slate-300 text-sm font-mono">${ing.price}</div>
          <div className="text-slate-600 text-[10px]">{ing.volume}{safeString(ing.unit) || 'ml'}</div>
       </div>
       <button 
         onClick={(e) => {
           e.stopPropagation();
           onDelete(ing.id);
         }}
         className="p-3 -mr-2 text-slate-600 hover:text-rose-500 hover:bg-rose-900/20 rounded-full transition-colors active:scale-95"
       >
         <Trash2 size={20} />
       </button>
    </div>
  </div>
), (prev, next) => prev.ing === next.ing); // Only re-render if ing data changes

// --- Recipe Card Component ---
const RecipeCard = memo(({ recipe, ingredients, onClick }) => {
  // Memoize stats calculation so it doesn't run on every parent render
  const stats = useMemo(() => calculateRecipeStats(recipe, ingredients), [recipe, ingredients]);
  const displayBase = safeString(recipe.baseSpirit).split(' ')[0] || '其他';

  return (
    <div onClick={() => onClick(recipe)} className="group bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-800 hover:border-slate-700 transition-all active:scale-[0.98] flex flex-row h-36 w-full cursor-pointer">
      <div className="w-32 h-full relative shrink-0 bg-slate-900">
         {recipe.image ? (
           <img src={recipe.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={safeString(recipe.nameZh)} loading="lazy" />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-slate-700">
             <Wine size={32} opacity={0.3} />
           </div>
         )}
      </div>
      
      <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden">
         <div>
           <div className="flex justify-between items-start">
             <h3 className="text-lg font-bold text-white leading-tight font-serif tracking-wide truncate pr-2">{safeString(recipe.nameZh)}</h3>
             
             <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="text-amber-400 font-bold text-lg font-mono leading-none">${stats.price}</div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const q = encodeURIComponent(`${recipe.nameZh} ${recipe.nameEn} 雞尾酒 調酒`);
                    window.open(`https://www.google.com/search?q=${q}`, '_blank');
                  }}
                  className="text-slate-500 hover:text-blue-400 transition-colors p-1 -mr-1"
                  title="搜尋 Google"
                >
                  <Globe size={14} />
                </button>
             </div>
           </div>
           <p className="text-slate-400 text-xs font-medium tracking-wider uppercase truncate opacity-80 mb-1">{safeString(recipe.nameEn)}</p>
           
           {recipe.flavorDescription && (
             <div className="text-[10px] text-slate-500 line-clamp-1 italic mb-1.5 opacity-80">
               "{safeString(recipe.flavorDescription)}"
             </div>
           )}

           <div className="flex gap-1 flex-wrap">
             {recipe.baseSpirit && <span className="text-[10px] text-blue-200 bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-800/50">{displayBase}</span>}
             {recipe.tags?.slice(0,2).map(tag => (
               <span key={safeString(tag)} className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">{safeString(tag).split(' ')[0]}</span>
             ))}
           </div>
         </div>

         <div className="flex items-center gap-3 text-xs font-mono text-slate-500 pt-1 border-t border-slate-700/50 mt-1">
           <span className={stats.costRate > 30 ? 'text-rose-400' : 'text-emerald-400'}>CR {stats.costRate.toFixed(0)}%</span>
           <span>|</span>
           <span>{stats.finalAbv.toFixed(1)}% ABV</span>
         </div>
      </div>
    </div>
  );
}, (prev, next) => prev.recipe === next.recipe && prev.ingredients === next.ingredients);

// --- Simple Components ---
const Badge = ({ children, color = 'slate', className='' }) => {
  const colors = {
    slate: 'bg-slate-700 text-slate-300',
    amber: 'bg-amber-900/50 text-amber-500 border border-amber-500/20',
    blue: 'bg-blue-900/30 text-blue-400',
    rose: 'bg-rose-900/30 text-rose-400'
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors[color]} ${className}`}>{children}</span>;
};

const ChipSelector = ({ title, options, selected, onSelect }) => {
  const toggle = (opt) => {
    if (selected.includes(opt)) onSelect(selected.filter(s => s !== opt));
    else onSelect([...selected, opt]);
  };
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs transition-all border ${selected.includes(opt) ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-900/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
          >
            {opt.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. Screen Components
// ==========================================

const SingleItemScreen = ({ ingredients, searchTerm, activeBlock }) => {
  // UseMemo to prevent filtering on every render unless deps change
  const filtered = useMemo(() => {
    return ingredients.filter(i => {
      // 1. Basic Type Filter
      const isRelevant = ['alcohol', 'soft', 'other'].includes(i.type);
      if (!isRelevant) return false;

      // 2. Search Filter (Overrides Block Filter)
      if (searchTerm) {
        return safeString(i.nameZh).includes(searchTerm) || safeString(i.nameEn).toLowerCase().includes(searchTerm.toLowerCase());
      }

      // 3. Block Filter (e.g., "Gin", "Soft")
      if (activeBlock) {
        // If block matches a SubType (e.g. Gin)
        if (i.type === 'alcohol' && i.subType && activeBlock.includes(safeString(i.subType).split(' ')[0])) return true;
        // If block matches a Type (e.g. Soft) - simplistic check
        if (activeBlock.includes('Soft') && i.type === 'soft') return true;
        if (activeBlock.includes('Other') && i.type === 'other') return true;
        // Specific Base Spirit Check
        const blockKey = activeBlock.split(' ')[0]; // "Gin" from "Gin 琴酒"
        const subKey = safeString(i.subType).split(' ')[0];
        if (blockKey === subKey) return true;

        return false;
      }

      return true;
    });
  }, [ingredients, searchTerm, activeBlock]);

  return (
    <div className="space-y-3">
      {filtered.map(ing => {
        const pricePerMl = safeNumber(ing.price) / safeNumber(ing.volume);
        const shotCost = pricePerMl * 30; // 30ml standard shot
        const shotPrice = Math.ceil((shotCost / 0.3) / 10) * 10;
        
        return (
          <div key={ing.id} className="p-4 bg-slate-800 rounded-xl border border-slate-800 flex justify-between items-center">
             <div>
               <div className="text-slate-200 font-medium">{ing.nameZh}</div>
               <div className="text-slate-500 text-xs">{ing.nameEn}</div>
             </div>
             <div className="text-right">
                <div className="text-amber-400 font-mono font-bold">${shotPrice}</div>
                <div className="text-slate-600 text-[10px]">Pure Shot (30ml)</div>
             </div>
          </div>
        );
      })}
      {filtered.length === 0 && <div className="text-center text-slate-500 py-10">無相符材料</div>}
    </div>
  );
};

// --- Featured Section Screen ---
const FeaturedSectionScreen = ({ sections, setSections, recipes, setViewingItem, ingredients, showConfirm }) => {
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSubgroupTitle, setNewSubgroupTitle] = useState('');
  
  // Recipe Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [pickingForSubgroupId, setPickingForSubgroupId] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const activeSection = sections.find(s => s.id === activeSectionId);

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      setSections([...sections, { id: generateId(), title: newSectionTitle.trim(), subgroups: [] }]);
      setNewSectionTitle('');
      setIsAdding(false);
    }
  };

  const handleDeleteSection = (id) => {
    showConfirm('刪除專區', '確定刪除此專區？所有的分類將會消失。', () => {
       setSections(sections.filter(s => s.id !== id));
       if (activeSectionId === id) setActiveSectionId(null);
    });
  };

  const handleAddSubgroup = (sectionId) => {
    if (newSubgroupTitle.trim()) {
      const updatedSections = sections.map(s => {
        if (s.id === sectionId) {
          return { ...s, subgroups: [...s.subgroups, { id: generateId(), title: newSubgroupTitle.trim(), recipeIds: [] }] };
        }
        return s;
      });
      setSections(updatedSections);
      setNewSubgroupTitle('');
      setIsAdding(false);
    }
  };

  const handleDeleteSubgroup = (sectionId, subgroupId) => {
    showConfirm('刪除分類', '確定刪除此分類？', () => {
      const updatedSections = sections.map(s => {
        if (s.id === sectionId) {
          return { ...s, subgroups: s.subgroups.filter(sg => sg.id !== subgroupId) };
        }
        return s;
      });
      setSections(updatedSections);
    });
  };

  const handleAddRecipeToSubgroup = (recipeId) => {
    const updatedSections = sections.map(s => {
      if (s.id === activeSectionId) {
         const updatedSubgroups = s.subgroups.map(sg => {
           if (sg.id === pickingForSubgroupId && !sg.recipeIds.includes(recipeId)) {
             return { ...sg, recipeIds: [...sg.recipeIds, recipeId] };
           }
           return sg;
         });
         return { ...s, subgroups: updatedSubgroups };
      }
      return s;
    });
    setSections(updatedSections);
    setShowPicker(false);
  };

  const handleRemoveRecipeFromSubgroup = (subgroupId, recipeId) => {
    const updatedSections = sections.map(s => {
      if (s.id === activeSectionId) {
         const updatedSubgroups = s.subgroups.map(sg => {
           if (sg.id === subgroupId) {
             return { ...sg, recipeIds: sg.recipeIds.filter(id => id !== recipeId) };
           }
           return sg;
         });
         return { ...s, subgroups: updatedSubgroups };
      }
      return s;
    });
    setSections(updatedSections);
  };

  // 1. Root Level: List of Sections
  if (!activeSectionId) {
    return (
      <div className="h-full flex flex-col animate-fade-in w-full bg-slate-950">
         <div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md px-4 pt-safe pb-3">
             <div className="flex justify-between items-center mt-3">
                <h2 className="text-2xl font-serif text-slate-100">精選專區</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setIsAdding(!isAdding); setIsEditing(false); }} 
                    className={`p-2 rounded-full border transition-all ${isAdding ? 'bg-amber-600 border-amber-500 text-white' : 'text-slate-400 border-slate-700 bg-slate-800'}`}
                  >
                     <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => { setIsEditing(!isEditing); setIsAdding(false); }} 
                    className={`p-2 rounded-full border transition-all ${isEditing ? 'bg-slate-700 border-slate-500 text-white' : 'text-slate-400 border-slate-700 bg-slate-800'}`}
                  >
                     <Edit3 size={20} />
                  </button>
                </div>
             </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 custom-scrollbar">
            {isAdding && (
                <div className="bg-slate-800 p-3 rounded-xl flex gap-2 border border-slate-700 animate-slide-up">
                   <input 
                     value={newSectionTitle} 
                     onChange={e => setNewSectionTitle(e.target.value)}
                     placeholder="新專區名稱 (如: 影視專區)"
                     className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none"
                     autoFocus
                   />
                   <button onClick={handleAddSection} className="bg-amber-600 text-white px-3 py-2 rounded font-bold text-sm">確認</button>
                </div>
             )}

            <div className="space-y-4">
              {sections.map(section => (
                <div key={section.id} className="relative group">
                  <div 
                    onClick={() => setActiveSectionId(section.id)} 
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-amber-500/50 transition-all relative overflow-hidden shadow-lg h-32 flex flex-col justify-center active:scale-[0.98]"
                  >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BookOpen size={80} />
                      </div>
                      <h2 className="text-2xl font-serif text-white font-bold mb-1 relative z-10">{section.title}</h2>
                      <p className="text-slate-500 text-sm relative z-10">{section.subgroups?.length || 0} 個子分類</p>
                  </div>
                  
                  {isEditing && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white p-2 rounded-full shadow-lg z-30 animate-scale-in hover:bg-rose-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {sections.length === 0 && !isAdding && (
               <div className="text-center py-20 text-slate-500">
                  <FolderPlus size={48} className="mx-auto mb-4 opacity-30" />
                  <p>尚無專區</p>
                  <p className="text-xs mt-2">點擊右上方「+」按鈕新增</p>
               </div>
            )}
         </div>
      </div>
    );
  }

  // 2. Detail Level: Section Content
  return (
    <div className="h-full flex flex-col animate-slide-up w-full bg-slate-950">
       <div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md px-4 pt-safe pb-3">
           <div className="flex items-center gap-3 mt-3">
              <button 
                onClick={() => setActiveSectionId(null)} 
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-700 active:bg-slate-700"
              >
                 <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-serif text-white font-bold flex-1 truncate">{activeSection.title}</h2>
              <div className="flex gap-2">
                 <button 
                   onClick={() => { setIsAdding(!isAdding); setIsEditing(false); }} 
                   className={`p-2 rounded-full border transition-all ${isAdding ? 'bg-amber-600 border-amber-500 text-white' : 'text-slate-500 border-slate-700 bg-slate-800'}`}
                 >
                    <Plus size={18} />
                 </button>
                 <button 
                   onClick={() => { setIsEditing(!isEditing); setIsAdding(false); }} 
                   className={`p-2 rounded-full border transition-all ${isEditing ? 'bg-slate-700 border-slate-500 text-white' : 'text-slate-500 border-slate-700 bg-slate-800'}`}
                 >
                    <Edit3 size={18} />
                 </button>
              </div>
           </div>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 custom-scrollbar">
           {isAdding && (
              <div className="bg-slate-800 p-3 rounded-xl flex gap-2 border border-slate-700 animate-slide-up">
                 <input 
                   value={newSubgroupTitle} 
                   onChange={e => setNewSubgroupTitle(e.target.value)}
                   placeholder="新子分類名稱 (如: 慾望城市)"
                   className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none"
                   autoFocus
                 />
                 <button onClick={() => handleAddSubgroup(activeSection.id)} className="bg-amber-600 text-white px-3 py-2 rounded font-bold text-sm">確認</button>
              </div>
           )}

           <div className="space-y-8">
              {activeSection.subgroups.map(subgroup => (
                 <div key={subgroup.id} className="space-y-3 relative">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                       <h3 className="text-lg font-bold text-amber-500">{subgroup.title}</h3>
                       <div className="flex gap-2">
                          {isEditing && (
                             <button onClick={() => handleDeleteSubgroup(activeSection.id, subgroup.id)} className="text-rose-500 p-1"><Trash2 size={16}/></button>
                          )}
                          <button 
                             onClick={() => { setPickingForSubgroupId(subgroup.id); setShowPicker(true); }}
                             className="text-slate-400 hover:text-white flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded-full border border-slate-700"
                          >
                             <Plus size={12}/> 新增酒譜
                          </button>
                       </div>
                    </div>

                    <div className="grid gap-3">
                       {subgroup.recipeIds.length > 0 ? (
                          subgroup.recipeIds.map(rid => {
                             const recipe = recipes.find(r => r.id === rid);
                             if (!recipe) return null;
                             return (
                                <div key={rid} className="relative group">
                                   <RecipeCard recipe={recipe} ingredients={ingredients} onClick={setViewingItem} />
                                   {isEditing && (
                                      <button 
                                         onClick={(e) => { e.stopPropagation(); handleRemoveRecipeFromSubgroup(subgroup.id, rid); }}
                                         className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                         <X size={14}/>
                                      </button>
                                   )}
                                </div>
                             );
                          })
                       ) : (
                          <div className="text-sm text-slate-600 italic py-2">點擊上方按鈕加入酒譜...</div>
                       )}
                    </div>
                 </div>
              ))}
              
              {activeSection.subgroups.length === 0 && !isAdding && (
                 <div className="text-center text-slate-500 py-10">
                    <FolderPlus size={32} className="mx-auto mb-2 opacity-30" />
                    <p>此專區還沒有分類</p>
                    <p className="text-xs mt-1">點擊上方「+」新增分類</p>
                 </div>
              )}
           </div>
       </div>

       {showPicker && (
         <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col pt-10 animate-fade-in">
            <div className="bg-slate-900 flex-1 rounded-t-3xl border-t border-slate-700 flex flex-col overflow-hidden">
               <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">選擇酒譜</h3>
                  <button onClick={() => setShowPicker(false)} className="p-2 bg-slate-800 rounded-full"><X size={20}/></button>
               </div>
               <div className="p-4 bg-slate-900 border-b border-slate-800">
                  <div className="relative">
                     <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4"/>
                     <input 
                       value={pickerSearch} 
                       onChange={e => setPickerSearch(e.target.value)}
                       placeholder="搜尋名稱..."
                       className="w-full bg-slate-800 text-white pl-9 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                     />
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {recipes.filter(r => safeString(r.nameZh).includes(pickerSearch) || safeString(r.nameEn).toLowerCase().includes(pickerSearch.toLowerCase())).map(r => (
                     <button 
                        key={r.id}
                        onClick={() => handleAddRecipeToSubgroup(r.id)}
                        className="w-full text-left p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-500 flex justify-between items-center group"
                     >
                        <div>
                           <div className="text-white font-medium">{r.nameZh}</div>
                           <div className="text-xs text-slate-500">{r.nameEn}</div>
                        </div>
                        <Plus className="text-amber-500 opacity-0 group-hover:opacity-100" size={16}/>
                     </button>
                  ))}
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

const CategoryGrid = ({ categories, onSelect, onAdd, onDelete, isEditing, toggleEditing }) => {
  const getGradient = (index) => {
    const gradients = [
      'from-blue-600 to-indigo-700',
      'from-amber-600 to-orange-700',
      'from-emerald-600 to-teal-700',
      'from-rose-600 to-pink-700',
      'from-purple-600 to-violet-700',
      'from-cyan-600 to-blue-700',
      'from-slate-600 to-gray-700',
      'from-fuchsia-600 to-purple-700',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="p-4 animate-fade-in">
       <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">快速分類</h3>
          <button 
            onClick={toggleEditing} 
            className={`text-xs px-2 py-1 rounded border transition-colors ${isEditing ? 'bg-slate-700 text-white border-slate-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
          >
            {isEditing ? '完成' : '編輯'}
          </button>
       </div>
       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <div 
              key={cat} 
              onClick={() => !isEditing && onSelect(cat)}
              className={`relative h-28 rounded-2xl bg-gradient-to-br ${getGradient(idx)} shadow-lg overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all border border-white/10 group`}
            >
               {/* Background Decorative Icon */}
               <div className="absolute -right-2 -bottom-4 w-24 h-24 text-white opacity-20 transform rotate-[-15deg] group-hover:scale-110 group-hover:opacity-30 transition-all duration-500 pointer-events-none">
                 <CategoryIcon category={cat} />
               </div>

               <div className="absolute inset-0 p-4 flex flex-col justify-center items-center z-10">
                  <span className="text-white font-bold text-xl text-center drop-shadow-md tracking-wide">{cat.split(' ')[0]}</span>
                  <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider mt-1 border-t border-white/20 pt-1 px-2">{cat.split(' ')[1] || 'Category'}</span>
               </div>
               
               {isEditing && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); onDelete(cat); }}
                   className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 animate-scale-in z-20"
                 >
                   <X size={14} strokeWidth={3} />
                 </button>
               )}
            </div>
          ))}
          
          <button 
            onClick={onAdd}
            className="h-28 rounded-2xl bg-slate-800/50 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all gap-2 group"
          >
             <div className="p-3 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
               <Plus size={24} />
             </div>
             <span className="text-xs font-bold">新增分類</span>
          </button>
       </div>
    </div>
  );
};

const RecipeListScreen = ({ 
  recipes, 
  ingredients, 
  searchTerm, 
  setSearchTerm, 
  recipeCategoryFilter, 
  setRecipeCategoryFilter, 
  startEdit, 
  setViewingItem,
  availableTags,
  availableBases = BASE_SPIRITS,
}) => {
  const [filterBases, setFilterBases] = useState([]);
  const [filterTags, setFilterTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Grid View State
  const [activeBlock, setActiveBlock] = useState(null);
  const [isGridEditing, setIsGridEditing] = useState(false);
  
  // Load custom grid categories or default to BASE_SPIRITS
  const [gridCategories, setGridCategories] = useState(() => {
    const saved = localStorage.getItem('bar_grid_cats_v1');
    return saved ? JSON.parse(saved) : BASE_SPIRITS;
  });

  useEffect(() => {
    localStorage.setItem('bar_grid_cats_v1', JSON.stringify(gridCategories));
  }, [gridCategories]);

  // Reset to Grid when tab changes (unless searching)
  useEffect(() => {
    if (!searchTerm) {
      setActiveBlock(null);
      setFilterBases([]);
      setFilterTags([]);
    }
  }, [recipeCategoryFilter]);

  // Auto-switch to list if searching
  const isSearching = searchTerm.length > 0;
  const showGrid = !isSearching && !activeBlock;

  const handleBlockSelect = (cat) => {
    setActiveBlock(cat);
    // Auto-apply filter based on block content
    if (availableBases.includes(cat)) {
      setFilterBases([cat]);
    } else {
      // If it's not a base spirit (e.g. a Tag or custom), try to filter by tags?
      // For now, let's treat grid items as Base Spirits primarily, or Tags.
      // If the category is found in tags, filter by tag
      if (availableTags.includes(cat)) {
         setFilterTags([cat]);
      } else {
         // Fallback: Just use it as a Base Spirit filter (custom ones might be added to base list logic elsewhere)
         setFilterBases([cat]); 
      }
    }
  };

  const handleAddCategory = () => {
    const input = prompt("請輸入新分類名稱 (例如: Sour 酸甜, 或 Vodka):");
    if (input && !gridCategories.includes(input)) {
      setGridCategories([...gridCategories, input]);
    }
  };

  const handleDeleteCategory = (cat) => {
    if (confirm(`確定移除「${cat}」方塊嗎？`)) {
      setGridCategories(gridCategories.filter(c => c !== cat));
    }
  };

  const clearBlockFilter = () => {
    setActiveBlock(null);
    setFilterBases([]);
    setFilterTags([]);
  };

  // Memoized Filter Logic
  const filtered = useMemo(() => {
    return recipes.filter(r => {
      const matchCat = recipeCategoryFilter === 'all' || r.type === recipeCategoryFilter;
      const matchSearch = safeString(r.nameZh).includes(searchTerm) || safeString(r.nameEn).toLowerCase().includes(searchTerm.toLowerCase());
      const matchBase = filterBases.length === 0 || filterBases.includes(r.baseSpirit);
      const matchTags = filterTags.length === 0 || filterTags.every(t => r.tags?.includes(t));
      // Special logic for Single tab grid filtering happens in SingleItemScreen, 
      // but for Recipe tabs, we filter recipes here.
      
      return matchCat && matchSearch && matchBase && matchTags;
    });
  }, [recipes, recipeCategoryFilter, searchTerm, filterBases, filterTags]);

  return (
    <div className="h-full flex flex-col animate-fade-in w-full bg-slate-950">
      <div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md pt-safe">
        <div className="px-4 py-3 flex gap-2 w-full">
           <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4"/>
              <input 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜尋酒單..."
                className="w-full bg-slate-900 text-slate-200 pl-9 pr-4 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500/50 text-sm"
              />
           </div>
           
           {/* Only show advanced filters button if not in Grid View (List View) */}
           {!showGrid && recipeCategoryFilter !== 'single' && (
             <button 
               onClick={() => setShowFilters(!showFilters)} 
               className={`p-2 rounded-xl border transition-colors ${showFilters || filterBases.length > 0 || filterTags.length > 0 ? 'bg-slate-800 border-amber-500/50 text-amber-500' : 'border-slate-800 text-slate-400'}`}
             >
               <Filter size={20} />
             </button>
           )}
           
           {recipeCategoryFilter !== 'single' && (
             <button onClick={() => startEdit('recipe')} className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-xl shadow-lg active:scale-95 transition-all">
               <Plus size={20} />
             </button>
           )}
        </div>

        <div className="flex px-4 border-b border-slate-800/50 w-full overflow-x-auto no-scrollbar">
           {[
             {id: 'all', label: '全部 All'},
             {id: 'classic', label: '經典 Classic'},
             {id: 'signature', label: '特調 Signature'},
             {id: 'single', label: '單品/純飲 Single'},
           ].map(cat => (
             <button 
               key={cat.id}
               onClick={() => setRecipeCategoryFilter(cat.id)}
               className={`flex-1 pb-3 px-4 text-sm font-medium border-b-2 transition-colors select-none whitespace-nowrap flex items-center justify-center gap-1 ${recipeCategoryFilter === cat.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}
             >
               {cat.label}
             </button>
           ))}
        </div>

        {/* Filter Panel (Only in List View) */}
        {showFilters && !showGrid && recipeCategoryFilter !== 'single' && (
          <div className="p-4 bg-slate-900 border-b border-slate-800 animate-slide-up w-full">
            {/* ... ChipSelectors ... */}
             <div className="mb-4">
              <ChipSelector 
                title="基酒篩選 (Base)" 
                options={availableBases} 
                selected={filterBases} 
                onSelect={setFilterBases} 
              />
            </div>
            <div>
              <ChipSelector 
                title="風味篩選 (Flavor)" 
                options={availableTags} 
                selected={filterTags} 
                onSelect={setFilterTags} 
              />
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
               <span>找到 {filtered.length} 款酒譜</span>
               <button onClick={() => {setFilterBases([]); setFilterTags([]);}} className="text-rose-400 hover:text-rose-300">清除篩選</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {showGrid ? (
            /* --- GRID VIEW --- */
            <CategoryGrid 
              categories={gridCategories} 
              onSelect={handleBlockSelect} 
              onAdd={handleAddCategory}
              onDelete={handleDeleteCategory}
              isEditing={isGridEditing}
              toggleEditing={() => setIsGridEditing(!isGridEditing)}
            />
         ) : (
            /* --- LIST VIEW --- */
            <div className="p-4 space-y-4 pb-24">
               {/* Back Button Context Header */}
               {activeBlock && (
                 <div className="flex items-center gap-3 mb-4 animate-fade-in">
                    <button onClick={clearBlockFilter} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-200">
                      <ArrowLeft size={20}/>
                    </button>
                    <div>
                       <div className="text-xs text-slate-500">正在檢視</div>
                       <div className="text-xl font-bold text-amber-500">{activeBlock.split(' ')[0]}</div>
                    </div>
                 </div>
               )}

               {recipeCategoryFilter === 'single' ? (
                 <SingleItemScreen 
                   ingredients={ingredients} 
                   searchTerm={searchTerm} 
                   activeBlock={activeBlock} // Pass grid filter
                 />
               ) : (
                 filtered.length > 0 ? (
                   filtered.map(recipe => (
                     <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        ingredients={ingredients} 
                        onClick={setViewingItem} 
                     />
                   ))
                 ) : (
                   <div className="text-center py-10 text-slate-500 flex flex-col items-center">
                     <Filter size={48} className="mb-4 opacity-20"/>
                     <p>沒有找到符合條件的酒譜</p>
                     {activeBlock && <button onClick={clearBlockFilter} className="mt-4 text-amber-500 underline">返回分類</button>}
                   </div>
                 )
               )}
               <div className="h-10"></div>
            </div>
         )}
      </div>
    </div>
  );
};

const InventoryScreen = ({ ingredients, startEdit, requestDelete, ingCategories, setIngCategories, showConfirm, onBatchAdd }) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  
  // Batch Add States
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchCategory, setBatchCategory] = useState('other');

  useEffect(() => {
    setSubCategoryFilter('all');
  }, [categoryFilter]);

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      const newId = generateId();
      setIngCategories([...ingCategories, { id: newId, label: newCatName.trim() }]);
      setNewCatName('');
      setIsAddingCat(false);
      setCategoryFilter(newId);
    }
  };

  const deleteCategory = (id) => {
    if (['alcohol', 'soft', 'other'].includes(id)) return;
    showConfirm('刪除分類', '確定刪除此分類？(分類下的材料不會被刪除，但會從此分類移除)', () => {
      setIngCategories(ingCategories.filter(c => c.id !== id));
      if (categoryFilter === id) setCategoryFilter('all');
    });
  };
  
  const handleBatchSubmit = () => {
    const lines = batchText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;
    
    const newItems = lines.map(name => ({
      id: generateId(),
      nameZh: name.trim(),
      nameEn: '',
      type: batchCategory,
      price: 0,
      volume: 700,
      unit: 'ml',
      abv: 0,
      subType: ''
    }));
    
    onBatchAdd(newItems);
    setBatchText('');
    setShowBatchModal(false);
  };

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(i => {
      if (categoryFilter !== 'all' && i.type !== categoryFilter) return false;
      if (categoryFilter === 'alcohol' && subCategoryFilter !== 'all') {
        return i.subType === subCategoryFilter;
      }
      return true;
    });
  }, [ingredients, categoryFilter, subCategoryFilter]);

  return (
    <div className="h-full flex flex-col animate-fade-in w-full bg-slate-950">
      <div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 shadow-md px-4 pt-safe pb-0">
        <div className="flex justify-between items-center mb-4 mt-4">
          <h2 className="text-2xl font-serif text-slate-100">材料庫</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBatchModal(true)} 
              className="flex items-center gap-2 bg-slate-800 text-slate-400 px-3 py-2 rounded-full border border-slate-700 text-sm hover:bg-slate-700 hover:text-white transition-colors"
              title="批次新增"
            >
              <FilePlus size={16} /> <span className="hidden sm:inline">批次</span>
            </button>
            <button onClick={() => startEdit('ingredient')} className="flex items-center gap-2 bg-slate-800 text-slate-200 px-4 py-2 rounded-full border border-slate-700 text-sm hover:bg-slate-700 hover:border-amber-500/50 transition-colors">
              <Plus size={16} /> 新增
            </button>
          </div>
        </div>
        
        {/* Dynamic Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all select-none ${
              categoryFilter === 'all' 
                ? 'bg-amber-600 text-white shadow' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            全部
          </button>
          
          {ingCategories.map(cat => (
            <div key={cat.id} className="relative group">
              <button
                onClick={() => setCategoryFilter(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all pr-4 select-none ${
                  categoryFilter === cat.id 
                    ? 'bg-slate-700 text-white border border-amber-500/50 shadow' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
              {!['alcohol', 'soft', 'other'].includes(cat.id) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                  className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px]"
                >
                  <X size={8} strokeWidth={4}/>
                </button>
              )}
            </div>
          ))}

          {isAddingCat ? (
            <div className="flex items-center bg-slate-800 rounded-full px-2 py-1 border border-slate-600 animate-fade-in">
              <input 
                autoFocus
                className="bg-transparent text-xs text-white w-16 outline-none"
                placeholder="分類名稱"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                onBlur={() => { if(!newCatName) setIsAddingCat(false); }}
              />
              <button onClick={handleAddCategory} className="text-amber-500 ml-1"><Check size={14}/></button>
            </div>
          ) : (
            <button onClick={() => setIsAddingCat(true)} className="p-1.5 bg-slate-800 rounded-full text-slate-500 hover:text-white hover:bg-slate-700">
              <Plus size={14}/>
            </button>
          )}
        </div>

        {categoryFilter === 'alcohol' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mt-2 no-scrollbar w-full animate-slide-up">
             <span className="text-[10px] text-slate-500 font-bold shrink-0 uppercase tracking-wider pl-1">細項:</span>
             <button 
               onClick={()=>setSubCategoryFilter('all')} 
               className={`whitespace-nowrap px-2 py-1 rounded text-[10px] font-medium transition-colors border ${subCategoryFilter === 'all' ? 'bg-slate-700 border-slate-600 text-white' : 'border-transparent text-slate-500'}`}
             >
               全部
             </button>
             {BASE_SPIRITS.map(spirit => (
                 <button 
                   key={spirit}
                   onClick={()=>setSubCategoryFilter(spirit)} 
                   className={`whitespace-nowrap px-2 py-1 rounded text-[10px] font-medium transition-colors border ${subCategoryFilter === spirit ? 'bg-slate-700 border-slate-600 text-white' : 'border-transparent text-slate-500'}`}
                 >
                   {safeString(spirit).split(' ')[0]}
                 </button>
             ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24 custom-scrollbar">
        {filteredIngredients.map(ing => (
          <IngredientRow 
             key={ing.id} 
             ing={ing} 
             onClick={() => startEdit('ingredient', ing)} 
             onDelete={(id) => requestDelete(id, 'ingredient')} 
          />
        ))}
        {filteredIngredients.length === 0 && (
          <div className="text-center py-10 text-slate-500 flex flex-col items-center">
            <Layers size={40} className="mb-2 opacity-20"/>
            <span>此分類無材料</span>
          </div>
        )}
      </div>

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-scale-in flex flex-col max-h-[80vh]">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-white flex items-center gap-2"><FilePlus size={20}/> 批次新增材料</h3>
               <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
             </div>
             
             <p className="text-xs text-slate-400 mb-2">請輸入材料名稱，一行一個。新增後預設價格為 $0，可稍後再編輯。</p>
             
             <textarea 
               value={batchText}
               onChange={e => setBatchText(e.target.value)}
               placeholder={`例如:\n金巴利\n甜香艾酒\n蘇打水`}
               className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-3 text-slate-200 focus:border-amber-500 outline-none resize-none mb-4 h-48"
               autoFocus
             />
             
             <div className="mb-4">
                <label className="text-xs text-slate-500 font-bold uppercase block mb-1">預設分類</label>
                <div className="flex gap-2">
                   {ingCategories.slice(0, 3).map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setBatchCategory(cat.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${batchCategory === cat.id ? 'bg-slate-700 border-amber-500 text-white' : 'border-slate-700 text-slate-500'}`}
                      >
                        {cat.label}
                      </button>
                   ))}
                </div>
             </div>
             
             <button 
               onClick={handleBatchSubmit} 
               disabled={!batchText.trim()}
               className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-900/20"
             >
               確認新增 {batchText.split('\n').filter(l => l.trim()).length > 0 ? `(${batchText.split('\n').filter(l => l.trim()).length} 筆)` : ''}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickCalcScreen = ({ ingredients }) => {
  const [mode, setMode] = useState('single');
  
  // Single Calc State (Manual Input)
  const [price, setPrice] = useState('');
  const [volume, setVolume] = useState(700);
  const [targetCostRate, setTargetCostRate] = useState(25); // Default 25%
  
  // Draft Mode State
  const [draftIngs, setDraftIngs] = useState([]);
  const [technique, setTechnique] = useState('Stir');

  // Draft helper functions
  const addDraftIng = (ingId) => {
    if(!ingId) return;
    setDraftIngs([...draftIngs, { id: ingId, amount: 30 }]);
  };

  const updateDraftAmount = (idx, val) => {
    const newIngs = [...draftIngs];
    newIngs[idx].amount = val;
    setDraftIngs(newIngs);
  };

  const removeDraftIng = (idx) => {
    setDraftIngs(draftIngs.filter((_, i) => i !== idx));
  };
  
  const draftStats = useMemo(() => calculateRecipeStats({ ingredients: draftIngs, technique }, ingredients), [draftIngs, technique, ingredients]);

  return (
    <div className="h-full flex flex-col animate-fade-in text-slate-200 w-full bg-slate-950">
      <div className="shrink-0 bg-slate-950/95 backdrop-blur z-20 border-b border-slate-800 p-4 pt-safe">
        <h2 className="text-xl font-serif mb-4 mt-4">成本計算工具</h2>
        <div className="flex bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setMode('single')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all select-none ${mode === 'single' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}
          >
            純飲速算 (列表)
          </button>
          <button 
            onClick={() => setMode('draft')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all select-none ${mode === 'draft' ? 'bg-amber-600 text-white shadow' : 'text-slate-500'}`}
          >
            雞尾酒草稿 (Draft)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24 custom-scrollbar">
        {mode === 'single' ? (
          <div className="space-y-6 animate-fade-in">
             {/* Input Section */}
             <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase">單瓶成本 ($)</label>
                     <input 
                       type="number" 
                       value={price}
                       onChange={e => setPrice(e.target.value)}
                       placeholder="800"
                       className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 outline-none focus:border-amber-500 text-white font-mono text-lg"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase">容量 (ml)</label>
                     <input 
                       type="number" 
                       value={volume}
                       onChange={e => setVolume(e.target.value)}
                       className="w-full p-3 bg-slate-800 rounded-xl border border-slate-700 outline-none focus:border-amber-500 text-white font-mono text-lg"
                     />
                  </div>
               </div>
               
               <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-slate-500 uppercase">目標成本率 (Cost Rate)</label>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setTargetCostRate(Math.max(10, targetCostRate - 5))} className="w-6 h-6 rounded bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700 hover:text-white">-</button>
                        <span className="text-amber-500 font-bold font-mono w-8 text-center">{targetCostRate}%</span>
                        <button onClick={() => setTargetCostRate(Math.min(100, targetCostRate + 5))} className="w-6 h-6 rounded bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700 hover:text-white">+</button>
                     </div>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="80" 
                    step="1"
                    value={targetCostRate} 
                    onChange={e => setTargetCostRate(Number(e.target.value))} 
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                  />
               </div>
             </div>

             {/* Results Table */}
             <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-lg shadow-black/20">
                <table className="w-full text-sm">
                   <thead>
                      <tr className="bg-slate-900 border-b border-slate-700">
                         <th className="p-4 text-left font-bold text-slate-400">規格</th>
                         <th className="p-4 text-right font-bold text-slate-400">成本</th>
                         <th className="p-4 text-right font-bold text-amber-500">建議售價</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700/50">
                      {[
                        { label: '1 ml', vol: 1 },
                        { label: '30 ml (Shot)', vol: 30 },
                        { label: '50 ml (Single)', vol: 50 },
                        { label: '60 ml (Double)', vol: 60 },
                        { label: '整瓶 (Bottle)', vol: safeNumber(volume) || 700 }
                      ].map((row, idx) => {
                         const p = safeNumber(price);
                         const v = safeNumber(volume) || 1;
                         const cost = (p / v) * row.vol;
                         const rate = safeNumber(targetCostRate) / 100 || 0.25;
                         // 售價計算：成本除以成本率，並無條件進位至十位數
                         const sellPrice = p > 0 ? Math.ceil((cost / rate) / 10) * 10 : 0;
                         
                         return (
                            <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                               <td className="p-4 text-slate-200 font-medium">
                                  {row.label}
                                  {idx === 4 && <span className="block text-[10px] text-slate-500 font-normal">Based on {targetCostRate}% CR</span>}
                               </td>
                               <td className="p-4 text-right text-slate-400 font-mono">${cost.toFixed(1)}</td>
                               <td className="p-4 text-right">
                                  <div className="text-amber-400 font-bold font-mono text-lg">${sellPrice}</div>
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">調製法</label>
                <div className="flex gap-2">
                  {['Shake', 'Stir', 'Build'].map(t => (
                    <button key={t} onClick={()=>setTechnique(t)} className={`flex-1 py-2 rounded-lg text-sm border ${technique===t ? 'bg-slate-700 border-amber-500 text-white' : 'border-slate-700 text-slate-500'}`}>{t}</button>
                  ))}
                </div>
             </div>

             <div className="space-y-3">
                {draftIngs.map((item, idx) => {
                   const ing = ingredients.find(i => i.id === item.id);
                   return (
                     <div key={idx} className="flex gap-2 items-center animate-slide-up">
                        <div className="flex-1 p-3 bg-slate-800 rounded-xl border border-slate-700 text-sm">{ing?.nameZh}</div>
                        <input 
                          type="number"
                          value={item.amount}
                          onChange={e => updateDraftAmount(idx, Number(e.target.value))}
                          className="w-20 p-3 bg-slate-800 rounded-xl border border-slate-700 text-center font-mono outline-none focus:border-amber-500"
                        />
                        <button onClick={() => removeDraftIng(idx)} className="p-3 text-rose-500 bg-slate-800 rounded-xl border border-slate-700 hover:bg-rose-900/20"><Trash2 size={18}/></button>
                     </div>
                   );
                })}
                
                <select 
                   className="w-full p-3 bg-slate-800/50 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-400 transition-colors text-center appearance-none cursor-pointer"
                   onChange={e => { addDraftIng(e.target.value); e.target.value = ''; }}
                >
                   <option value="">+ 加入材料</option>
                   {ingredients.map(i => <option key={i.id} value={i.id}>{i.nameZh}</option>)}
                </select>
             </div>

             <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 mt-6 shadow-xl">
                 <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                       <div className="text-xs text-slate-500 mb-1">總成本</div>
                       <div className="text-2xl font-mono text-rose-400 font-bold">${draftStats.cost}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-xs text-slate-500 mb-1">總容量 (含融水)</div>
                       <div className="text-2xl font-mono text-blue-400 font-bold">{draftStats.volume}ml</div>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-slate-400 text-sm">預估酒精濃度</span>
                    <span className="text-xl font-bold text-amber-500">{draftStats.finalAbv.toFixed(1)}%</span>
                 </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. Overlays (Editor & Viewer)
// ==========================================

const EditorSheet = ({ 
  mode, 
  item, 
  setItem, 
  onSave, 
  onClose, 
  ingredients, 
  availableTechniques, 
  setAvailableTechniques,
  availableTags,
  setAvailableTags,
  availableGlasses,
  setAvailableGlasses,
  requestDelete,
  ingCategories,
  setIngCategories,
  showAlert 
}) => {
  if (!mode) return null;

  const handleRecipeIngChange = (idx, field, value) => {
    const newIngs = [...item.ingredients];
    newIngs[idx][field] = value;
    setItem({ ...item, ingredients: newIngs });
  };

  const addRecipeIng = () => {
    setItem({ ...item, ingredients: [...item.ingredients, { id: '', amount: 0 }] });
  };

  const removeRecipeIng = (idx) => {
    const newIngs = item.ingredients.filter((_, i) => i !== idx);
    setItem({ ...item, ingredients: newIngs });
  };

  const toggleTag = (tag) => {
    const tags = item.tags || [];
    if (tags.includes(tag)) setItem({ ...item, tags: tags.filter(t => t !== tag) });
    else setItem({ ...item, tags: [...tags, tag] });
  };

  const stats = mode === 'recipe' ? calculateRecipeStats(item, ingredients) : null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full md:w-[600px] bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-up border-l border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 z-10 pt-safe">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"><X size={24}/></button>
          <h2 className="text-lg font-bold text-white font-serif">{mode === 'recipe' ? '編輯酒譜' : '編輯材料'}</h2>
          <button onClick={onSave} className="p-2 text-amber-500 hover:text-amber-400 bg-amber-900/20 rounded-full hover:bg-amber-900/40 transition"><Check size={24}/></button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-safe-offset custom-scrollbar">
           
           {/* Image Section */}
           <div className="w-full h-48 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer transition-colors hover:border-slate-500">
              {item.image ? (
                <>
                  <img src={item.image} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-bold">點擊更換圖片</span>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 flex flex-col items-center">
                  <Camera size={32} className="mb-2"/>
                  <span className="text-xs">上傳圖片 (URL)</span>
                </div>
              )}
              <input 
                type="text" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                   const val = prompt("請輸入圖片網址 (URL):", item.image);
                   if(val !== null) setItem({...item, image: val});
                }}
              />
           </div>

           {/* Basic Info */}
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">中文名稱</label>
                 <input value={item.nameZh} onChange={e => setItem({...item, nameZh: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" placeholder="例如: 內格羅尼" />
              </div>
              <div className="space-y-1 col-span-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">英文名稱</label>
                 <input value={item.nameEn} onChange={e => setItem({...item, nameEn: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none" placeholder="e.g. Negroni" />
              </div>
              
              {/* Type Selection */}
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">分類</label>
                 <select 
                   value={item.type} 
                   onChange={e => setItem({...item, type: e.target.value})} 
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none"
                 >
                    {mode === 'recipe' ? (
                       <>
                         <option value="classic">經典 Classic</option>
                         <option value="signature">特調 Signature</option>
                       </>
                    ) : (
                       ingCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                    )}
                 </select>
              </div>

              {/* Sub-Type for Alcohol */}
              {mode === 'ingredient' && item.type === 'alcohol' && (
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">基酒細項</label>
                   <select 
                     value={item.subType} 
                     onChange={e => setItem({...item, subType: e.target.value})} 
                     className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none"
                   >
                      <option value="">-- 無 --</option>
                      {BASE_SPIRITS.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
              )}

              {/* Base Spirit for Recipe */}
              {mode === 'recipe' && (
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">基酒</label>
                    <select 
                       value={item.baseSpirit} 
                       onChange={e => setItem({...item, baseSpirit: e.target.value})} 
                       className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none"
                    >
                       <option value="">其他</option>
                       {BASE_SPIRITS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                 </div>
              )}
           </div>

           {/* Ingredient Specific Fields */}
           {mode === 'ingredient' && (
              <div className="grid grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">價格 ($)</label>
                    <input type="number" value={item.price} onChange={e => setItem({...item, price: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">容量 (ml)</label>
                    <input type="number" value={item.volume} onChange={e => setItem({...item, volume: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">酒精度 (%)</label>
                    <input type="number" value={item.abv} onChange={e => setItem({...item, abv: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-amber-500 outline-none font-mono" />
                 </div>
              </div>
           )}

           {/* Recipe Specific Fields */}
           {mode === 'recipe' && (
              <div className="space-y-6">
                 {/* Ingredients List */}
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <label className="text-xs font-bold text-slate-500 uppercase">酒譜材料</label>
                       <button onClick={addRecipeIng} className="text-amber-500 text-xs font-bold flex items-center gap-1 hover:text-amber-400"><Plus size={14}/> 新增材料</button>
                    </div>
                    
                    <div className="space-y-2">
                       {item.ingredients.map((ingItem, idx) => (
                          <div key={idx} className="flex gap-2 items-center animate-slide-up">
                             <select 
                               value={ingItem.id} 
                               onChange={e => handleRecipeIngChange(idx, 'id', e.target.value)}
                               className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500 appearance-none"
                             >
                                <option value="">選擇材料...</option>
                                {ingredients.map(i => <option key={i.id} value={i.id}>{i.nameZh}</option>)}
                             </select>
                             <input 
                               type="number" 
                               value={ingItem.amount} 
                               onChange={e => handleRecipeIngChange(idx, 'amount', Number(e.target.value))}
                               className="w-20 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-center text-white outline-none focus:border-amber-500 font-mono" 
                               placeholder="ml"
                             />
                             <button onClick={() => removeRecipeIng(idx)} className="p-3 text-slate-600 hover:text-rose-500"><Trash2 size={18}/></button>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Stats Preview */}
                 <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 grid grid-cols-2 gap-4">
                    <div>
                       <div className="text-xs text-slate-500">總成本</div>
                       <div className="text-xl font-mono text-rose-400 font-bold">${stats.cost}</div>
                    </div>
                    <div>
                       <div className="text-xs text-slate-500">成本率</div>
                       <div className={`text-xl font-mono font-bold ${stats.costRate > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>{stats.costRate.toFixed(0)}%</div>
                    </div>
                    <div>
                       <div className="text-xs text-slate-500">預估 ABV</div>
                       <div className="text-xl font-mono text-blue-400 font-bold">{stats.finalAbv.toFixed(1)}%</div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500 uppercase block">售價</label>
                       <input 
                         type="number" 
                         value={item.price || ''} 
                         onChange={e => setItem({...item, price: Number(e.target.value)})}
                         placeholder={`建議: $${Math.ceil((stats.cost / 0.3) / 10) * 10}`}
                         className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-sm text-amber-500 font-bold text-right outline-none focus:border-amber-500"
                       />
                    </div>
                 </div>
                 
                 {/* Technique & Garnish */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <div className="flex justify-between">
                         <label className="text-xs font-bold text-slate-500 uppercase">調製法</label>
                         <button onClick={() => {
                           const t = prompt('新增調製法:');
                           if(t) setAvailableTechniques([...availableTechniques, t]);
                         }} className="text-[10px] text-amber-500">新增</button>
                       </div>
                       <select 
                         value={item.technique} 
                         onChange={e => setItem({...item, technique: e.target.value})}
                         className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none"
                       >
                         {availableTechniques.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1">
                       <div className="flex justify-between">
                         <label className="text-xs font-bold text-slate-500 uppercase">杯具</label>
                         <button onClick={() => {
                           const g = prompt('新增杯具:');
                           if(g) setAvailableGlasses([...availableGlasses, g]);
                         }} className="text-[10px] text-amber-500">新增</button>
                       </div>
                       <select 
                         value={item.glass} 
                         onChange={e => setItem({...item, glass: e.target.value})}
                         className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 appearance-none"
                       >
                         {availableGlasses.map(g => <option key={g} value={g}>{g}</option>)}
                       </select>
                    </div>
                    <div className="space-y-1 col-span-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">裝飾 (Garnish)</label>
                       <input value={item.garnish} onChange={e => setItem({...item, garnish: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500" placeholder="e.g. Orange Peel" />
                    </div>
                 </div>

                 {/* Flavor Tags */}
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <label className="text-xs font-bold text-slate-500 uppercase">風味標籤</label>
                       <button onClick={() => {
                          const t = prompt('新增標籤:');
                          if(t) setAvailableTags([...availableTags, t]);
                       }} className="text-xs text-amber-500">新增</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {availableTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all border ${item.tags?.includes(tag) ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                          >
                             {tag}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Steps & Desc */}
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">步驟 / 備註</label>
                    <textarea 
                      value={item.steps} 
                      onChange={e => setItem({...item, steps: e.target.value})} 
                      className="w-full h-24 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 resize-none"
                      placeholder="輸入製作步驟..."
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">風味描述</label>
                    <textarea 
                      value={item.flavorDescription} 
                      onChange={e => setItem({...item, flavorDescription: e.target.value})} 
                      className="w-full h-16 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-amber-500 resize-none"
                      placeholder="簡短描述風味..."
                    />
                 </div>
              </div>
           )}

           {/* Delete Button */}
           <div className="pt-6 border-t border-slate-800">
              <button 
                onClick={() => {
                   // FIX: Use requestDelete prop instead of trying to find requestDelete from context
                   if (requestDelete) requestDelete(item.id, mode);
                   onClose();
                }} 
                className="w-full py-3 rounded-xl border border-rose-900/50 text-rose-500 hover:bg-rose-900/20 font-bold transition-colors flex items-center justify-center gap-2"
              >
                 <Trash2 size={18}/> 刪除此項目
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- 5. Viewer Overlay ---

const ViewerOverlay = ({ item, onClose, ingredients, startEdit, requestDelete }) => {
  if (!item) return null;
  const stats = calculateRecipeStats(item, ingredients);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
       <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
       <div className="relative w-full md:w-[600px] bg-slate-950 h-full shadow-2xl flex flex-col animate-slide-up overflow-hidden">
          
          {/* Hero Image */}
          <div className="relative h-72 shrink-0">
             {item.image ? (
                <img src={item.image} className="w-full h-full object-cover" alt={item.nameZh} />
             ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                   <Wine size={64} className="text-slate-700"/>
                </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
             
             <button onClick={onClose} className="absolute top-safe left-4 p-2 bg-black/30 backdrop-blur rounded-full text-white hover:bg-white/20 transition pt-safe">
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

             {/* Ingredients */}
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
             {/* FIX: The delete button logic here was problematic. 
                 It's safer to open the editor to delete, or use a confirm dialog.
                 For now, we keep the edit button as the primary action.
             */}
          </div>
       </div>
    </div>
  );
};

// --- 6. Main App Container ---

function MainAppContent() {
  // 修正：從 localStorage 讀取 activeTab 以防止重新整理後重置（解決「被登出」感）
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('bar_active_tab_v3') || 'recipes');
  
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
  
  // Global Lists
  const [availableTags, setAvailableTags] = useState(['酸甜 Sour/Sweet', '草本 Herbal', '果香 Fruity', '煙燻 Smoky', '辛辣 Spicy', '苦味 Bitter']);
  const [availableTechniques, setAvailableTechniques] = useState(['Shake', 'Stir', 'Build', 'Roll', 'Blend']);
  const [availableGlasses, setAvailableGlasses] = useState(['Martini', 'Coupe', 'Rock', 'Highball', 'Collins', 'Shot']);
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
       const data = localStorage.getItem(key);
       if (data) setter(JSON.parse(data));
    };
    load('bar_ingredients_v3', setIngredients);
    load('bar_recipes_v3', setRecipes);
    load('bar_sections_v3', setSections);
    load('bar_tags_v3', setAvailableTags);
    load('bar_ing_cats_v3', setIngCategories);
  }, []);

  // Save Data
  useEffect(() => localStorage.setItem('bar_ingredients_v3', JSON.stringify(ingredients)), [ingredients]);
  useEffect(() => localStorage.setItem('bar_recipes_v3', JSON.stringify(recipes)), [recipes]);
  useEffect(() => localStorage.setItem('bar_sections_v3', JSON.stringify(sections)), [sections]);
  useEffect(() => localStorage.setItem('bar_tags_v3', JSON.stringify(availableTags)), [availableTags]);
  useEffect(() => localStorage.setItem('bar_ing_cats_v3', JSON.stringify(ingCategories)), [ingCategories]);
  useEffect(() => localStorage.setItem('bar_active_tab_v3', activeTab), [activeTab]);

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });
  const showConfirm = (title, message, onConfirm) => setDialog({ isOpen: true, type: 'confirm', title, message, onConfirm });
  const showAlert = (title, message) => setDialog({ isOpen: true, type: 'alert', title, message, onConfirm: null });

  const handleBatchAddIngredients = (newItems) => {
    setIngredients(prev => [...prev, ...newItems]);
    showAlert('新增成功', `已成功新增 ${newItems.length} 項材料。\n(預設為 $0/700ml，請記得更新詳細資訊)`);
  };

  const requestDelete = (id, type) => {
    const title = type === 'recipe' ? '刪除酒譜' : '刪除材料';
    showConfirm(title, '確定要刪除嗎？此動作無法復原。', () => {
       if (type === 'recipe') {
         setRecipes(recipes.filter(r => r.id !== id));
         if (viewingItem?.id === id) setViewingItem(null);
       } else {
         setIngredients(ingredients.filter(i => i.id !== id));
       }
       // Note: Dialog auto-closes in the UI rendering part due to logic change in previous prompt
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
           showAlert('還原成功', '資料已完全覆蓋。');
        } else {
           // Merge Logic
           const newIngs = (data.ingredients || []).filter(ni => !ingredients.some(ei => ei.id === ni.id));
           const newRecs = (data.recipes || []).filter(nr => !recipes.some(er => er.id === nr.id));
           setIngredients([...ingredients, ...newIngs]);
           setRecipes([...recipes, ...newRecs]);
           showAlert('合併成功', `已加入 ${newIngs.length} 項材料與 ${newRecs.length} 款酒譜。`);
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
           ingredients: [], steps: '', tags: [], image: '', flavorDescription: ''
        });
      } else {
        setEditingItem({
           id: generateId(),
           nameZh: '', nameEn: '', type: 'other', subType: '',
           price: 0, volume: 700, unit: 'ml', abv: 0
        });
      }
    }
  };

  const saveItem = () => {
    if (!editingItem.nameZh) return showAlert('錯誤', '請輸入名稱');
    
    if (editorMode === 'ingredient') {
       setIngredients(prev => {
         const exists = prev.find(i => i.id === editingItem.id);
         return exists ? prev.map(i => i.id === editingItem.id ? editingItem : i) : [...prev, editingItem];
       });
    } else {
       setRecipes(prev => {
         const exists = prev.find(r => r.id === editingItem.id);
         return exists ? prev.map(r => r.id === editingItem.id ? editingItem : r) : [...prev, editingItem];
       });
       if (viewingItem && viewingItem.id === editingItem.id) setViewingItem(editingItem);
    }
    setEditorMode(null);
    setEditingItem(null);
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
            availableBases={BASE_SPIRITS}
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
          />
        )}
        {activeTab === 'quick' && <QuickCalcScreen ingredients={ingredients} />}
        {activeTab === 'tools' && (
           <div className="h-full flex flex-col overflow-y-auto p-6 text-center space-y-6 pt-20 w-full custom-scrollbar pb-24">
             <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto flex items-center justify-center border border-slate-700 shadow-lg shadow-amber-900/10"><Wine size={32} className="text-amber-500"/></div>
             <h2 className="text-xl font-serif text-slate-200">Bar Manager v8.0</h2>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
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

      <EditorSheet mode={editorMode} item={editingItem} setItem={setEditingItem} onSave={saveItem} onClose={() => setEditorMode(null)} ingredients={ingredients} availableTechniques={availableTechniques} setAvailableTechniques={setAvailableTechniques} availableTags={availableTags} setAvailableTags={setAvailableTags} availableGlasses={availableGlasses} setAvailableGlasses={setAvailableGlasses} requestDelete={requestDelete} ingCategories={ingCategories} setIngCategories={setIngCategories} showAlert={showAlert} />
      <ViewerOverlay item={viewingItem} onClose={() => setViewingItem(null)} ingredients={ingredients} startEdit={startEdit} requestDelete={requestDelete} />
    </div>
  );
}

const App = MainAppContent;
export default App;