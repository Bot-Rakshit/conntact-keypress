import { useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  Group, 
  Color, 
  MeshStandardMaterial, 
  Mesh, 
  Object3D, 
  TextureLoader,
  RepeatWrapping,
  MathUtils,
  Audio,
  AudioListener,
  AudioLoader,
  DoubleSide,
  MeshBasicMaterial
} from 'three';
import keycapModel from '../assets/Dazzling Bombul-Jarv.glb';
import keyboardSound from '../assets/mech-keyboard-02-102918.mp3';

/**
 * Conntact keypress
 * 
 * Interactive 3D keycap model with realistic pressing animation and sound effects.
 * Features include:
 * - Mechanical key press animation along the z-axis
 * - Authentic mechanical keyboard sound
 * - Customizable textures (matte, glossy, carbon)
 * - Dynamic shadow effect
 */

// Type definition for GLTF result
interface GLTFResult {
  nodes: Record<string, Mesh | Object3D>;
  materials: Record<string, MeshStandardMaterial>;
}

interface KeycapModelProps {
  onClick: () => void;
  debug?: boolean;
  textureType?: 'matte' | 'glossy' | 'carbon';
}

export function KeycapModel({ onClick, textureType = 'carbon' }: KeycapModelProps) {
  const group = useRef<Group>(null);
  const shadowRef = useRef<Mesh>(null);
  const { nodes, materials } = useGLTF(keycapModel) as unknown as GLTFResult;
  const [isPressed, setIsPressed] = useState(false);
  const { camera } = useThree();
  const sound = useRef<Audio>(null);
  
  // Setup audio listener and sound
  useEffect(() => {
    // Create an audio listener
    const listener = new AudioListener();
    camera.add(listener);
    
    // Create a global audio source
    const audio = new Audio(listener);
    
    // Load a sound and set it as the Audio object's buffer
    const audioLoader = new AudioLoader();
    audioLoader.load(
      keyboardSound, 
      (buffer) => {
        audio.setBuffer(buffer);
        audio.setVolume(0.7); // Slightly louder for better feedback
      },
      // onProgress callback
      (xhr) => {
        console.log(`Loading keyboard sound: ${Math.round(xhr.loaded / xhr.total * 100)}%`);
      },
      // onError callback - create simple keyboard sound
      (error) => {
        console.error('Error loading keyboard sound:', error);
        createFallbackSound(audio, listener);
      }
    );
    
    // Function to create a fallback keyboard sound
    function createFallbackSound(audio: Audio, listener: AudioListener) {
      // Create an AudioContext
      const audioContext = listener.context;
      
      // Create a buffer for a short click sound
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, sampleRate * 0.1, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      // Generate a simple "click" waveform
      for (let i = 0; i < buffer.length; i++) {
        // Attack
        if (i < buffer.length * 0.1) {
          channelData[i] = Math.random() * 0.5;
        } 
        // Decay
        else {
          channelData[i] = Math.random() * 0.5 * (1 - (i / buffer.length));
        }
      }
      
      audio.setBuffer(buffer);
      audio.setVolume(0.3);
    }
    
    sound.current = audio;
    
    // Clean up
    return () => {
      camera.remove(listener);
    };
  }, [camera]);
  
  // Position camera to match the screenshot
  useEffect(() => {
    // Set camera rotation to match the screenshot (in degrees)
    camera.rotation.x = MathUtils.degToRad(11.233);
    camera.rotation.y = MathUtils.degToRad(0.774);
    camera.rotation.z = MathUtils.degToRad(-0.154);
    
    // Make camera look at the keycap
    camera.lookAt(0, 0, 0);
    
    // Position the key initially to allow proper travel distance when pressed
    if (group.current) {
      group.current.position.z = 0;
      group.current.position.y = 0.2; // Slightly raised position for better visualization
      
      // Ensure scale starts at 1 for all axes
      group.current.scale.set(1, 1, 1);
    }
  }, [camera]);
  
  // Handle clicking on the keycap
  const handleClick = () => {
    // Don't allow multiple clicks while animating
    if (isPressed) return;
    
    setIsPressed(true);
    onClick();
    
    // Play the click sound with a slight delay for realism
    if (sound.current) {
      // Reset and play with a small delay for a more realistic feel
      if (sound.current.isPlaying) {
        sound.current.stop();
      }
      // Adding a small delay between pressing and hearing the sound (mechanical keys have a small travel time)
      setTimeout(() => {
        if (sound.current) {
          sound.current.play();
        }
      }, 10);
    }
    
    // Slightly longer press duration for a smoother, less bouncy animation
    setTimeout(() => setIsPressed(false), 200);
  };

  // Animation for pressing the keycap
  useFrame(() => {
    if (group.current) {
      if (isPressed) {
        // Create a deeper, more natural keypress motion
        // Compress the keycap by scaling down on Z axis (depth)
        // This simulates the keycap pressing down into its housing
        group.current.scale.z = Math.max(group.current.scale.z - 0.04, 0.65);
        
        // Move slightly along z-axis to enhance the pressing effect
        group.current.position.z = Math.max(group.current.position.z - 0.02, -0.15);
        
        // Add a slight downward tilt for more realism
        group.current.rotation.x = Math.min(group.current.rotation.x + 0.005, 0.03);
        
        // Animate shadow - make it smaller and more intense when key is pressed
        if (shadowRef.current) {
          // Make shadow smaller and move it slightly to enhance 3D effect
          shadowRef.current.scale.set(0.9, 0.9, 1);
          shadowRef.current.position.z = -0.03; // Move shadow away from keycap
          const material = shadowRef.current.material as MeshBasicMaterial;
          material.opacity = 0.6;
        }
      } else {
        // Return the keycap to its original position with a realistic spring-back
        const targetZ = 0;
        const currentZ = group.current.position.z;
        const targetRotX = 0;
        const currentRotX = group.current.rotation.x;
        const targetScaleZ = 1;
        const currentScaleZ = group.current.scale.z;
        
        // Speed values for a more mechanical feel (reduced for less bounce)
        const positionSpeed = 0.12; // Slower for smoother return
        const rotationSpeed = 0.15;
        const scaleSpeed = 0.1;
        
        // Scale: Return to original Z scale (decompression)
        group.current.scale.z += (targetScaleZ - currentScaleZ) * scaleSpeed;
        
        // Position: Return to original z position
        group.current.position.z += (targetZ - currentZ) * positionSpeed;
        
        // Rotation: Return to original state
        group.current.rotation.x += (targetRotX - currentRotX) * rotationSpeed;
        
        // Animate shadow back to normal
        if (shadowRef.current) {
          shadowRef.current.scale.x += (1 - shadowRef.current.scale.x) * 0.1;
          shadowRef.current.scale.y += (1 - shadowRef.current.scale.y) * 0.1;
          shadowRef.current.position.z += (0 - shadowRef.current.position.z) * 0.1; // Return to original z position
          const material = shadowRef.current.material as MeshBasicMaterial;
          material.opacity += (0.4 - material.opacity) * 0.1;
        }
      }
    }
  });

  // Set materials and textures based on textureType
  useEffect(() => {
    if (!materials) return;

    // Create texture for keycap
    const textureLoader = new TextureLoader();
    
    // Different texture options based on selected type
    let bumpMapUrl = '';
    const keycapColor = 0x0a0a0a; // Default dark black
    let roughness = 0.8;
    let metalness = 0.1;
    let bumpScale = 0.002;
    
    // Configure texture settings based on selected type
    switch (textureType) {
      case 'glossy':
        roughness = 0.1;
        metalness = 0.5;
        bumpScale = 0.001;
        bumpMapUrl = 'https://images.unsplash.com/photo-1615400014497-55726234cccb?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400';
        break;
      case 'carbon':
        roughness = 0.4;
        metalness = 0.3;
        bumpScale = 0.008;
        bumpMapUrl = 'https://images.unsplash.com/photo-1598168413264-09c2f0b9a93c?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400';
        break;
      case 'matte':
      default:
        roughness = 0.8;
        metalness = 0.1;
        bumpScale = 0.002;
        bumpMapUrl = 'https://images.unsplash.com/photo-1541183663064-7a32e7035c94?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400';
        break;
    }
    
    // Load texture
    textureLoader.load(bumpMapUrl, (bumpMap) => {
      // Adjust texture properties
      bumpMap.wrapS = RepeatWrapping;
      bumpMap.wrapT = RepeatWrapping;
      
      // Adjust texture repeat based on type
      if (textureType === 'carbon') {
        bumpMap.repeat.set(6, 6);
      } else {
        bumpMap.repeat.set(3, 3);
      }
      
      // Iterate through materials and customize them
      Object.entries(materials).forEach(([key, material]) => {
        if (material instanceof MeshStandardMaterial) {
          // Check if material name contains 'letter' or 'text' or 'C' for the letter C
          const isLetterMaterial = 
            key.toLowerCase().includes('letter') || 
            key.toLowerCase().includes('text') || 
            key.toLowerCase().includes('c');
          
          if (isLetterMaterial) {
            // White color for the letter C
            material.color = new Color(0xffffff);
            material.roughness = 0.1;
            material.metalness = 0.2;
            
            // Remove any texture from the letter
            material.bumpMap = null;
          } else {
            // Apply selected texture to keycap body
            material.color = new Color(keycapColor);
            material.roughness = roughness;
            material.metalness = metalness;
            material.bumpMap = bumpMap;
            material.bumpScale = bumpScale;
          }
        }
      });
    });
  }, [materials, textureType]);

  // Make sure we have a valid model
  if (!nodes) {
    console.error("Failed to load keycap model");
    return null;
  }

  return (
    <group ref={group} dispose={null} onClick={handleClick}>
      {/* Add shadow plane below the keycap */}
      <mesh 
        ref={shadowRef}
        position={[0, -0.2, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial 
          color="#000" 
          transparent 
          opacity={0.4} 
          side={DoubleSide}
        />
      </mesh>

      {/* Render the loaded model */}
      {Object.entries(nodes).map(([key, node]) => {
        if ('isMesh' in node && node.isMesh) {
          return (
            <mesh 
              key={key}
              name={key}
              geometry={(node as Mesh).geometry}
              material={(node as Mesh).material || (materials[key] as MeshStandardMaterial)}
              position={node.position}
              rotation={node.rotation}
              scale={node.scale}
              castShadow
              receiveShadow
              onClick={(e) => {
                // Prevent event propagation to parent
                e.stopPropagation();
                // Call the parent click handler
                handleClick();
              }}
            />
          );
        }
        return null;
      })}
    </group>
  );
}

useGLTF.preload(keycapModel); 