
import React, { useMemo, useState, useRef } from 'react';
import { Container, CargoItem, Dimensions } from '../types';
import { generateEngineeringReport } from '../services/reportGenerator';

interface SidebarProps {
  containers: Container[];
  activeContainerIndex: number;
  setActiveContainerIndex: (index: number) => void;
  unpackedCount: number;
  // Config Props
  containerDims: Dimensions;
  setContainerDims: (d: Dimensions) => void;
  boxSpacing: number;
  setBoxSpacing: (n: number) => void;
  allowStacking: boolean;
  setAllowStacking: (b: boolean) => void;
  minContainers: number;
  setMinContainers: (n: number) => void;
  maxContainers: number;
  setMaxContainers: (n: number) => void;
  onImportCargo: (items: CargoItem[]) => void;
  cargoItems: CargoItem[]; 
  // Optimization
  onOptimize: () => void;
  optimizationRound: number;
}

declare const XLSX: any;

export const Sidebar: React.FC<SidebarProps> = ({ 
  containers, 
  activeContainerIndex, 
  setActiveContainerIndex,
  unpackedCount,
  containerDims,
  setContainerDims,
  boxSpacing,
  setBoxSpacing,
  allowStacking,
  setAllowStacking,
  minContainers,
  setMinContainers,
  maxContainers,
  setMaxContainers,
  onImportCargo,
  cargoItems,
  onOptimize,
  optimizationRound
}) => {
  const [activeTab, setActiveTab] = useState<'manifest' | 'config'>('manifest');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentContainer = containers[activeContainerIndex];
  
  const stats = useMemo(() => {
    if (!currentContainer) return { weight: 0, volumePct: 0, count: 0, items: [] };
    
    const totalWeight = currentContainer.items.reduce((acc, item) => acc + item.weight, 0);
    const usedVolume = currentContainer.items.reduce((acc, item) => 
      acc + (item.dimensions.length * item.dimensions.width * item.dimensions.height), 0);
    
    const totalVolume = Math.max(1, containerDims.length * containerDims.width * containerDims.height);
    const sortedItems = [...currentContainer.items].sort((a, b) => a.id - b.id);

    return {
      weight: totalWeight,
      volumePct: (usedVolume / totalVolume) * 100,
      count: currentContainer.items.length,
      items: sortedItems
    };
  }, [currentContainer, containerDims]);

  const handleExport = () => {
    if (!cargoItems || cargoItems.length === 0) return;
    const data = cargoItems.map(item => ({
        ID: item.id,
        Length: item.dimensions.length,
        Width: item.dimensions.width,
        Height: item.dimensions.height,
        Weight: item.weight
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cargo");
    XLSX.writeFile(wb, "cargo_box_list.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);
        const newCargo: CargoItem[] = data.map((row: any, index: number) => ({
            id: row.ID || row.id || index + 1,
            dimensions: {
                length: Number(row.Length || row.length || 0),
                width: Number(row.Width || row.width || 0),
                height: Number(row.Height || row.height || 0),
            },
            weight: Number(row.Weight || row.weight || 0),
            color: `hsl(${((row.ID || index) * 137.508) % 360}, 65%, 55%)`
        })).filter((item: CargoItem) => 
            item.dimensions.length > 0 && item.dimensions.width > 0 && item.dimensions.height > 0
        );
        if (newCargo.length > 0) {
            onImportCargo(newCargo);
        }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  const getSafetyColor = (score: number) => {
      if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
      if (score >= 6) return 'text-amber-600 bg-amber-50 border-amber-200';
      return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-xl z-20 font-sans">
      <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <h1 className="text-2xl font-bold tracking-tight">Cargo3D</h1>
        <div className="flex justify-between items-end">
            <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider">Load Optimizer</p>
            <div className="flex bg-slate-700/50 rounded-lg p-0.5">
                <button onClick={() => setActiveTab('manifest')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'manifest' ? 'bg-blue-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>视图</button>
                <button onClick={() => setActiveTab('config')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'config' ? 'bg-blue-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>配置</button>
            </div>
        </div>
      </div>

      {activeTab === 'config' ? (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-6">
            {/* Section: Container Dims */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                    <span className="w-1 h-4 bg-blue-500 rounded mr-2"></span>
                    集装箱尺寸 (Container Dims)
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    <input type="number" value={containerDims.length} onChange={(e) => setContainerDims({...containerDims, length: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md" placeholder="Length (mm)" />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="number" value={containerDims.width} onChange={(e) => setContainerDims({...containerDims, width: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md" placeholder="Width" />
                        <input type="number" value={containerDims.height} onChange={(e) => setContainerDims({...containerDims, height: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md" placeholder="Height" />
                    </div>
                </div>
            </div>

            {/* NEW Section: Container Limits */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                    <span className="w-1 h-4 bg-indigo-500 rounded mr-2"></span>
                    箱数限制 (Container Limits)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Min Containers</label>
                        <input 
                            type="number" 
                            min="1"
                            value={minContainers} 
                            onChange={(e) => setMinContainers(Math.max(1, Number(e.target.value)))}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Max Containers</label>
                        <input 
                            type="number" 
                            min="1"
                            value={maxContainers} 
                            onChange={(e) => setMaxContainers(Math.max(1, Number(e.target.value)))}
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                        />
                    </div>
                </div>
                <p className="text-[9px] text-gray-400 mt-2 leading-relaxed italic">
                    算法将尝试在限制范围内配载。如果超过最大值，多出的货物将无法装载。
                </p>
            </div>

            {/* Section: Constraints */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                    <span className="w-1 h-4 bg-amber-500 rounded mr-2"></span>
                    装载规则 (Constraints)
                </h3>
                <label className="text-xs text-gray-500 font-semibold uppercase flex justify-between">Buffer: {boxSpacing} mm</label>
                <input type="range" min="0" max="200" step="10" value={boxSpacing} onChange={(e) => setBoxSpacing(Number(e.target.value))} className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                    <span className="text-sm font-medium text-gray-700">允许堆叠</span>
                    <button onClick={() => setAllowStacking(!allowStacking)} className={`w-11 h-6 flex items-center rounded-full transition-colors ${allowStacking ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${allowStacking ? 'translate-x-6' : 'translate-x-1'}`}></div>
                    </button>
                </div>
            </div>

            {/* Section: Data I/O */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-dashed border-slate-300 mb-2">导入 Excel</button>
                <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls,.csv" className="hidden" />
                <button onClick={handleExport} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg shadow-md">下载数据列表</button>
            </div>
        </div>
      ) : (
        <>
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <button onClick={onOptimize} className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    重新计算布局
                </button>

                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {containers.map((c, idx) => (
                    <button key={c.id} onClick={() => setActiveContainerIndex(idx)} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all shadow-sm ${activeContainerIndex === idx ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>Container {idx + 1}</button>
                ))}
                </div>

                {/* Status Warning for Min/Max limits */}
                {containers.length < minContainers && (
                    <div className="mb-4 bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-200 text-[10px] flex items-start gap-2 animate-pulse">
                        <span className="text-lg">⚠️</span>
                        <div>
                            <p className="font-bold">箱数不足警告 (Min Count Alert)</p>
                            <p>当前使用了 {containers.length} 个集装箱，少于设定的最小箱数 ({minContainers})。建议增加间距或减少堆叠以均衡负载。</p>
                        </div>
                    </div>
                )}

                {currentContainer?.safetyMetrics && (
                    <div className={`mb-4 px-4 py-3 rounded-lg border flex flex-col shadow-sm ${getSafetyColor(currentContainer.safetyMetrics.score)}`}>
                         <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm uppercase tracking-wider">安全系数</span>
                            <span className="text-xl font-bold">{currentContainer.safetyMetrics.score.toFixed(1)}</span>
                         </div>
                         <p className="text-[10px] opacity-70 italic leading-tight">{currentContainer.safetyMetrics.description}</p>
                    </div>
                )}

                {unpackedCount > 0 && (
                <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 text-xs flex items-center font-bold">
                    <span className="mr-2">❌</span> {unpackedCount} 个木箱无法装入 (超出箱数限制)
                </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">利用率</p>
                        <p className="text-xl font-black text-slate-800">{stats.volumePct.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">总重</p>
                        <p className="text-xl font-black text-slate-800">{stats.weight.toFixed(0)}kg</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <h3 className="text-xs text-gray-400 uppercase font-bold mb-3">装箱明细 ({stats.items.length} 件)</h3>
                <div className="space-y-2">
                {stats.items.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center">
                        <div className="w-1.5 h-8 rounded-full mr-3 opacity-80" style={{ backgroundColor: item.color }}></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800">Box #{item.id}</p>
                            <p className="text-[10px] text-gray-400">{item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height} | {item.weight}kg</p>
                        </div>
                        {item.rotation && <span className="text-[9px] bg-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded font-bold">旋转</span>}
                    </div>
                ))}
                </div>
            </div>
        </>
      )}
    </div>
  );
};
