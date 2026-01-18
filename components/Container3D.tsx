
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Html, PerspectiveCamera } from '@react-three/drei';
import { Container } from '../types';
import { BoxMesh } from './BoxMesh';

// 定义组件 Props 接口
interface Container3DProps {
  container: Container;
}

const TruckCab = ({ width }: { width: number }) => {
  return (
    <group position={[-2.8, -0.1, width/2]}>
       {/* 底盘 */}
       <mesh position={[1.2, 0.3, 0]} castShadow>
         <boxGeometry args={[3.2, 0.4, 2.3]} />
         <meshStandardMaterial color="#111827" roughness={0.9} />
       </mesh>

       {/* 轮子 */}
       {[ [0.6, 1.2], [0.6, -1.2], [2.0, 1.2], [2.0, -1.2] ].map((pos, i) => (
         <mesh key={i} position={[pos[0], 0.3, pos[1]]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.5, 24]} />
            <meshStandardMaterial color="#000000" />
         </mesh>
       ))}

       {/* 车头主体 */}
       <mesh position={[0, 1.6, 0]} castShadow>
         <boxGeometry args={[2.0, 2.6, 2.4]} />
         <meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.5} />
       </mesh>
       
       {/* 车窗 */}
       <mesh position={[-1.01, 2.0, 0]}>
         <boxGeometry args={[0.02, 1.2, 2.2]} />
         <meshStandardMaterial color="#1f2937" roughness={0.1} metalness={1.0} transparent opacity={0.8} />
       </mesh>

       {/* 方向提示标签 */}
       <group position={[-1.5, 3.8, 0]}>
          <Html center>
             <div className="flex flex-col items-center pointer-events-none">
                <div className="bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-2xl border-2 border-white flex items-center gap-2 whitespace-nowrap">
                    <span className="animate-pulse">⬅</span> 行驶方向 (Driving Dir)
                </div>
                <div className="w-1 h-4 bg-gradient-to-b from-white to-transparent"></div>
             </div>
          </Html>
       </group>
    </group>
  );
};

export const Container3D: React.FC<Container3DProps> = ({ container }) => {
  const scale = 0.001;
  const cL = container.length * scale;
  const cH = container.height * scale;
  const cW = container.width * scale;

  return (
    <div className="h-full w-full bg-[#1a1c1e] rounded-xl overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] relative border border-white/5">
      <Canvas 
        shadows 
        dpr={[1, 2]}
      >
        <PerspectiveCamera makeDefault position={[12, 10, 12]} fov={40} />
        <color attach="background" args={['#0f1115']} />
        
        {/* 光照系统 */}
        <ambientLight intensity={1.0} />
        <pointLight position={[cL/2, cH + 2, cW/2]} intensity={20} color="#ffffff" castShadow />
        <directionalLight 
            position={[20, 30, 10]} 
            intensity={2.5} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
        />
        
        <Suspense fallback={null}>
            <Environment preset="warehouse" />
        </Suspense>

        <OrbitControls 
            makeDefault 
            target={[cL / 2, cH / 4, cW / 2]} 
            maxDistance={30}
            minDistance={3}
            enableDamping
        />

        {/* 货物渲染 */}
        <group>
          {container.items.map((item, idx) => (
            <BoxMesh key={`${item.id}-${idx}`} item={item} />
          ))}
        </group>

        {/* 车头模型 */}
        <TruckCab width={cW} />

        {/* 集装箱轮廓与地板 */}
        <group position={[cL / 2, cH / 2, cW / 2]}>
          <mesh>
            <boxGeometry args={[cL, cH, cW]} />
            <meshBasicMaterial color="#4ade80" wireframe transparent opacity={0.15} />
          </mesh>
          
          {/* 容器实心地板 */}
          <mesh position={[0, -cH/2 + 0.005, 0]} receiveShadow>
             <boxGeometry args={[cL, 0.01, cW]} />
             <meshStandardMaterial color="#2d3748" roughness={0.8} />
          </mesh>

          {/* 前壁 (靠车头侧) */}
          <mesh position={[-cL/2, 0, 0]} rotation={[0, Math.PI/2, 0]}>
             <planeGeometry args={[cW, cH]} />
             <meshStandardMaterial color="#4a5568" transparent opacity={0.1} side={2} />
          </mesh>
        </group>

        {/* 地面网格 */}
        <Grid 
            position={[0, -0.05, 0]} 
            args={[50, 50]} 
            cellSize={1} 
            cellThickness={1} 
            cellColor="#2d3748" 
            sectionSize={5} 
            sectionThickness={1.5} 
            sectionColor="#4a5568" 
            fadeDistance={40} 
        />

        <ContactShadows 
            position={[cL/2, -0.04, cW/2]} 
            opacity={0.4} 
            scale={25} 
            blur={2} 
            far={10} 
        />
      </Canvas>
      
      {/* 底部视角说明 */}
      <div className="absolute bottom-6 left-6 pointer-events-none flex flex-col gap-2">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <div className="w-3 h-3 bg-red-600 rounded-sm shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
              <span className="text-white/70 text-[11px] font-bold uppercase tracking-wider">前端车头 (Truck Front)</span>
          </div>
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <div className="w-3 h-3 bg-green-500/50 rounded-sm border border-green-400"></div>
              <span className="text-white/70 text-[11px] font-bold uppercase tracking-wider">集装箱范围 (Container Limit)</span>
          </div>
      </div>
    </div>
  );
};
