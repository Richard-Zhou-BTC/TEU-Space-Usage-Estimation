
import React, { useState, useMemo } from 'react';
import { PlacedItem } from '../types';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface BoxMeshProps {
  item: PlacedItem;
}

export const BoxMesh: React.FC<BoxMeshProps> = ({ item }) => {
  const [hovered, setHovered] = useState(false);

  // 缩放比例 mm -> m
  const scale = 0.001;
  const gap = 0.01; // 1cm 的视觉间隔
  
  const realL = (item.rotation ? item.dimensions.width : item.dimensions.length) * scale;
  const realW = (item.rotation ? item.dimensions.length : item.dimensions.width) * scale;
  const realH = item.dimensions.height * scale;
  
  // 渲染尺寸（略微缩小以产生间隔感）
  const l = Math.max(0.05, realL - gap);
  const w = Math.max(0.05, realW - gap);
  const h = Math.max(0.05, realH - gap);

  // 坐标中心点计算
  const x = (item.position.x * scale) + (realL / 2);
  const y = (item.position.y * scale) + (realH / 2);
  const z = (item.position.z * scale) + (realW / 2);

  // 确定颜色，增加兜底
  const boxColor = item.color || '#fbbf24';

  // Memoize geometry to prevent recreate on every render
  const boxGeom = useMemo(() => new THREE.BoxGeometry(l, h, w), [l, h, w]);
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(boxGeom), [boxGeom]);

  return (
    <group position={[x, y, z]}>
      {/* 木箱实体 */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[l, h, w]} />
        <meshStandardMaterial 
            color={hovered ? '#ffffff' : boxColor} 
            roughness={0.6}
            metalness={0.2}
            emissive={hovered ? '#ffffff' : '#000000'}
            emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>
      
      {/* 边框线条 */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color="#000000" transparent opacity={0.4} />
      </lineSegments>

      {/* 悬浮信息提示 - 优化了最小宽度和间距 */}
      {hovered && (
        <Html 
          distanceFactor={10} 
          center 
          pointerEvents="none"
        >
          <div className="bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl min-w-[180px] whitespace-nowrap transform -translate-y-full mb-16 backdrop-blur-lg border border-white/20 ring-8 ring-black/20">
            <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1.5">
                <p className="font-black text-amber-400 text-sm">木箱 #{item.id}</p>
                <span className="text-[10px] text-slate-500 font-mono">ID:{item.id.toString().padStart(2, '0')}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-slate-300 font-mono text-[11px]">
                <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase">Length</span>
                    <span className="text-white font-bold">{item.dimensions.length}mm</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase">Width</span>
                    <span className="text-white font-bold">{item.dimensions.width}mm</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase">Height</span>
                    <span className="text-white font-bold">{item.dimensions.height}mm</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 uppercase">Weight</span>
                    <span className="text-amber-300 font-bold">{item.weight}kg</span>
                </div>
            </div>

            {item.rotation && (
              <div className="mt-3 flex items-center gap-2 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-500/30">
                <span className="text-cyan-400 animate-pulse">↻</span>
                <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                  已旋转 90° 装载
                </span>
              </div>
            )}
          </div>
        </Html>
      )}
      
      {/* 始终显示的编号 - 增加可见度并优化 Html 渲染 */}
      {!hovered && (l > 0.1) && (
           <Html 
              position={[0, h/2 + 0.05, 0]} 
              center 
              distanceFactor={10}
              pointerEvents="none"
           >
                <div 
                    className="text-[10px] font-black text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-[2px] select-none border border-white/20"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,1)' }}
                >
                    {item.id}
                </div>
           </Html>
      )}
    </group>
  );
};
