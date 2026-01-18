
import React, { useState, useEffect, useMemo } from 'react';
import { CARGO_DATA, CONTAINER_DIMS as DEFAULT_CONTAINER_DIMS } from './constants';
import { packCargo } from './services/packer';
import { Container, CargoItem, Dimensions } from './types';
import { Container3D } from './components/Container3D';
import { Sidebar } from './components/Sidebar';

const App: React.FC = () => {
  // Config State
  const [containerDims, setContainerDims] = useState<Dimensions>(DEFAULT_CONTAINER_DIMS);
  const [boxSpacing, setBoxSpacing] = useState(0);
  const [allowStacking, setAllowStacking] = useState(true);
  const [cargoData, setCargoData] = useState<CargoItem[]>(CARGO_DATA);
  const [minContainers, setMinContainers] = useState(1);
  const [maxContainers, setMaxContainers] = useState(5);
  
  // Optimization State (Seed)
  const [optimizationSeed, setOptimizationSeed] = useState(0);

  // App State
  const [containers, setContainers] = useState<Container[]>([]);
  const [activeContainerIndex, setActiveContainerIndex] = useState(0);
  const [isPacking, setIsPacking] = useState(true);

  // Trigger packing whenever config, data, or optimization seed changes
  useEffect(() => {
    setIsPacking(true);
    
    // Small delay to allow UI to show loading state if calculation is heavy
    const timer = setTimeout(() => {
        const packedResults = packCargo(cargoData, {
            containerDims,
            spacing: boxSpacing,
            allowStacking,
            seed: optimizationSeed,
            maxContainers // Pass the limit to the packer
        });
        setContainers(packedResults);
        setActiveContainerIndex(0); // Reset to first container
        setIsPacking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [cargoData, containerDims, boxSpacing, allowStacking, optimizationSeed, maxContainers]);

  const handleOptimize = () => {
      // Increment seed to trigger a different packing strategy/heuristic
      setOptimizationSeed(prev => prev + 1);
  };

  const totalPacked = containers.reduce((sum, c) => sum + c.items.length, 0);
  const unpackedCount = cargoData.length - totalPacked;
  
  // Safe access to current container
  const currentContainer = containers[activeContainerIndex] || containers[0];

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden">
      {/* 3D Viewport */}
      <div className="flex-1 h-1/2 md:h-full relative order-2 md:order-1 p-4 bg-gray-200">
         
         {/* Render 3D View */}
         {currentContainer && (
            <Container3D container={currentContainer} />
         )}

         {/* Loading Overlay */}
         {isPacking && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-200/60 backdrop-blur-[2px] rounded-lg border border-gray-300 m-4">
                <div className="text-center bg-white p-5 rounded-xl shadow-xl">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600 font-medium text-sm">正在优化布局 (Optimizing)...</p>
                    <p className="text-xs text-gray-400 mt-1">尝试策略 #{optimizationSeed + 1}</p>
                </div>
             </div>
         )}

         {/* Empty State */}
         {!isPacking && containers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-200">
                <div className="text-center p-6 bg-white/50 rounded-xl">
                    <p className="text-3xl mb-2">📦</p>
                    <p className="text-xl font-bold text-gray-400 mb-2">No Boxes Packed</p>
                    <p className="text-sm max-w-xs mx-auto">Check your container dimensions or cargo list to ensure items can fit.</p>
                </div>
            </div>
         )}
         
         <div className="absolute top-8 left-8 bg-black/70 text-white p-3 rounded backdrop-blur-sm pointer-events-none z-10">
            <h2 className="font-bold text-lg">3D View</h2>
            <p className="text-xs text-gray-300 max-w-xs mt-1">
                Left Click: Rotate • Right Click: Pan • Scroll: Zoom
            </p>
         </div>
      </div>

      {/* Sidebar Controls */}
      <div className="h-1/2 md:h-full order-1 md:order-2 z-10 relative shadow-2xl">
        <Sidebar 
            containers={containers} 
            activeContainerIndex={activeContainerIndex}
            setActiveContainerIndex={setActiveContainerIndex}
            unpackedCount={unpackedCount}
            
            // Config Props
            containerDims={containerDims}
            setContainerDims={setContainerDims}
            boxSpacing={boxSpacing}
            setBoxSpacing={setBoxSpacing}
            allowStacking={allowStacking}
            setAllowStacking={setAllowStacking}
            minContainers={minContainers}
            setMinContainers={setMinContainers}
            maxContainers={maxContainers}
            setMaxContainers={setMaxContainers}
            onImportCargo={setCargoData}
            cargoItems={cargoData}
            
            // Optimization
            onOptimize={handleOptimize}
            optimizationRound={optimizationSeed}
        />
      </div>
    </div>
  );
};

export default App;
