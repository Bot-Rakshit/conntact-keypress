import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { KeycapModel } from './KeycapModel';
import { Vector3 } from 'three';

export function Scene() {
  const [clickCount, setClickCount] = useState(0);
  const [textureQuality] = useState<'matte' | 'glossy' | 'carbon'>('carbon');

  const handleKeycapClick = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <div style={{ width: '100%', height: '100vh', background: 'white' }}>
      <div 
        style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          background: 'rgba(0,0,0,0.7)', 
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        Clicks: {clickCount}
      </div>
      
      <Canvas 
        camera={{ 
          position: new Vector3(1.010, -14.558, 73.300),
          fov: 45
        }}
      >
        <color attach="background" args={['white']} />
        
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <directionalLight position={[-10, -10, -10]} intensity={0.5} />
          <pointLight position={[0, 10, 0]} intensity={0.5} />
          
          <group position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <KeycapModel 
              onClick={handleKeycapClick} 
              debug={false}
              textureType={textureQuality}
            />
          </group>
          
          <ContactShadows 
            position={[0, -0.5, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            far={10} 
          />
          <Environment preset="city" />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
} 