import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, Code2, Film, ExternalLink, 
  Play, X, Sparkles, Terminal, Maximize2, Calendar, Layers 
} from 'lucide-react';
import { projects, CATEGORY_CONFIG } from './projectsData';

const CATEGORY_ICONS = {
  'Все': Sparkles,
  'Игры': Gamepad2,
  'Приложения': Code2,
  'Моушн': Film,
};

const GithubIcon = ({ size = 14 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const getGithubRepoUrl = (url) => {
  if (!url) return null;
  const match = url.match(/https?:\/\/([^.]+)\.github\.io\/([^/]+)/i);
  if (match) {
    return `https://github.com/${match[1]}/${match[2]}`;
  }
  return null;
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState('Все');
  const [activeModal, setActiveModal] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(false);

  const mountRef = useRef(null);
  const playerContainerRef = useRef(null);
  const sceneStateRef = useRef({
    targetCam: new THREE.Vector3(...CATEGORY_CONFIG['Все'].camPos),
    targetColor: new THREE.Color(CATEGORY_CONFIG['Все'].color),
    targetSecColor: new THREE.Color(CATEGORY_CONFIG['Все'].secondaryColor),
    targetScale: 1.0,
    rotSpeed: 1.0,
    mouseX: 0,
    mouseY: 0,
    boost: 1.0
  });

  const currentTheme = CATEGORY_CONFIG[activeCategory] || CATEGORY_CONFIG['Все'];
  const filteredProjects = activeCategory === 'Все' 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const cfg = CATEGORY_CONFIG[activeCategory] || CATEGORY_CONFIG['Все'];
    sceneStateRef.current.targetCam.set(...cfg.camPos);
    sceneStateRef.current.targetColor.set(cfg.color);
    sceneStateRef.current.targetSecColor.set(cfg.secondaryColor);
    sceneStateRef.current.targetScale = cfg.coreScale;
    sceneStateRef.current.rotSpeed = cfg.rotSpeed;
    sceneStateRef.current.boost = 4.5;
    document.documentElement.style.setProperty('--accent', cfg.color);
  }, [activeCategory]);

  useEffect(() => {
    sceneStateRef.current.boost = hoveredCard ? 2.5 : 1.0;
  }, [hoveredCard]);

  const handleFullScreen = () => {
    if (playerContainerRef.current && playerContainerRef.current.requestFullscreen) {
      playerContainerRef.current.requestFullscreen();
    }
  };

  const handleCardThumbnailClick = (project) => {
    if (project.embed?.type === 'external') {
      window.open(project.embed.url, '_blank', 'noopener,noreferrer');
    } else {
      setActiveModal(project);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.06);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const innerGeo = new THREE.OctahedronGeometry(1.15, 2);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a12,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.9,
      flatShading: true
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    const wireGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wireMesh);

    const ring1Geo = new THREE.TorusGeometry(2.3, 0.015, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.8, 0.01, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x7000ff, transparent: true, opacity: 0.4 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    coreGroup.add(ring2);

    const particlesCount = 1400;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 28;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.035,
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const particleMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f0ff, 4, 20);
    pointLight1.position.set(4, 4, 4);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7000ff, 4, 20);
    pointLight2.position.set(-4, -4, 2);
    scene.add(pointLight2);

    const handleMouseMove = (e) => {
      sceneStateRef.current.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      sceneStateRef.current.mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let reqId;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const st = sceneStateRef.current;

      st.boost = THREE.MathUtils.lerp(st.boost, 1.0, 0.05);
      const speed = st.rotSpeed * st.boost;

      innerMesh.rotation.y += delta * 0.5 * speed;
      innerMesh.rotation.x += delta * 0.3 * speed;
      wireMesh.rotation.y -= delta * 0.3 * speed;
      wireMesh.rotation.z += delta * 0.2 * speed;

      ring1.rotation.z += delta * 0.6 * speed;
      ring1.rotation.x = Math.PI / 3 + Math.sin(elapsedTime * 0.7) * 0.3;
      ring2.rotation.x -= delta * 0.4 * speed;
      ring2.rotation.y = Math.PI / 4 + Math.cos(elapsedTime * 0.5) * 0.3;

      particleMesh.rotation.y = elapsedTime * 0.03;

      const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.04;
      const targetS = st.targetScale * pulse;
      coreGroup.scale.lerp(new THREE.Vector3(targetS, targetS, targetS), 0.06);

      innerMat.emissive.lerp(st.targetColor, 0.05);
      wireMat.color.lerp(st.targetColor, 0.05);
      ring1Mat.color.lerp(st.targetColor, 0.05);
      ring2Mat.color.lerp(st.targetSecColor, 0.05);
      particlesMat.color.lerp(st.targetColor, 0.05);
      pointLight1.color.lerp(st.targetColor, 0.05);
      pointLight2.color.lerp(st.targetSecColor, 0.05);

      const desiredCamX = st.targetCam.x + st.mouseX * 0.65;
      const desiredCamY = st.targetCam.y + st.mouseY * 0.65;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, desiredCamX, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredCamY, 0.04);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, st.targetCam.z, 0.04);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />

      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 40px',
        pointerEvents: 'none'
      }}>
        
        {/* ВЕРХНЯЯ ПАНЕЛЬ */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: currentTheme.color,
              boxShadow: `0 0 15px ${currentTheme.color}`,
              transform: 'rotate(45deg)',
              transition: 'all 0.4s ease'
            }} />
            <div>
              <div className="font-display" style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px' }}>
                MAXF134 // ПОРТФОЛИО
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px' }}>
                ВСЕГО РАБОТ В БАЗЕ: {projects.length} | THREE.JS ЯДРО
              </div>
            </div>
          </div>

          <nav style={{ 
            display: 'flex', 
            gap: '8px', 
            background: 'rgba(10, 12, 18, 0.75)',
            backdropFilter: 'blur(12px)',
            padding: '6px',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            flexWrap: 'wrap'
          }}>
            {Object.values(CATEGORY_CONFIG).map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] || Layers;
              const isActive = activeCategory === cat.id;
              const count = cat.id === 'Все' 
                ? projects.length 
                : projects.filter(p => p.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    color: isActive ? '#050508' : 'rgba(255,255,255,0.75)',
                    padding: '10px 16px',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'color 0.3s ease'
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: cat.color,
                        boxShadow: `0 0 25px ${cat.color}`,
                        borderRadius: '2px',
                        zIndex: 0
                      }}
                    />
                  )}
                  <Icon size={15} style={{ position: 'relative', zIndex: 1 }} />
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {cat.id.toUpperCase()} ({count})
                  </span>
                </button>
              );
            })}
          </nav>
        </header>

        {/* ОСНОВНАЯ СЕТКА */}
        <main style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(280px, 380px) 1fr',
          gap: '40px',
          alignItems: 'center',
          height: 'calc(100vh - 170px)',
          marginTop: '10px'
        }}>
          
          {/* ЛЕВАЯ КОЛОНКА */}
          <div style={{ pointerEvents: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: -30, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.97 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '11px', 
                  color: currentTheme.color,
                  border: `1px solid ${currentTheme.color}`,
                  padding: '4px 10px',
                  marginBottom: '16px',
                  letterSpacing: '2px'
                }}>
                  <Terminal size={12} />
                  СЕКТОР // {currentTheme.sectorName}
                </div>

                <h1 className="font-display" style={{ 
                  fontSize: 'clamp(16px, 2vw, 32px)', 
                  fontWeight: 900, 
                  lineHeight: 1.25,
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  wordBreak: 'keep-all',
                  overflowWrap: 'break-word',
                  textShadow: `0 0 35px ${currentTheme.color}44`
                }}>
                  {currentTheme.label}
                </h1>

                <p style={{ 
                  fontSize: '13px', 
                  lineHeight: 1.6, 
                  color: 'rgba(255,255,255,0.65)',
                  marginBottom: '24px'
                }}>
                  {currentTheme.subtitle}
                </p>

                <div style={{ 
                  fontSize: '11px', 
                  color: 'rgba(255,255,255,0.45)',
                  borderLeft: `2px solid ${currentTheme.color}`,
                  paddingLeft: '12px',
                  lineHeight: 1.7
                }}>
                  <div>КАТЕГОРИЯ: <strong style={{ color: '#fff' }}>{activeCategory.toUpperCase()}</strong></div>
                  <div>ОТОБРАЖЕНО ПРОЕКТОВ: <strong style={{ color: currentTheme.color }}>{filteredProjects.length}</strong></div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ПРАВАЯ КОЛОНКА: СЕТКА ПРОЕКТОВ С ПЛАВНЫМ ПЕРЕХОДОМ (LAYOUT) */}
          <div style={{ 
            pointerEvents: 'auto', 
            maxHeight: '100%', 
            overflowY: 'auto',
            paddingRight: '12px',
            paddingTop: '10px',
            paddingBottom: '10px'
          }}>
            <motion.div 
              layout
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '20px' 
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project) => {
                  const repoUrl = getGithubRepoUrl(project.embed?.url);

                  return (
                    <motion.div
                      layout
                      key={project.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      onMouseEnter={() => setHoveredCard(true)}
                      onMouseLeave={() => setHoveredCard(false)}
                      className="cyber-card"
                      style={{ 
                        padding: '18px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        minHeight: '310px',
                        '--accent-glow': `${currentTheme.color}33`
                      }}
                    >
                      <div style={{ position: 'relative', zIndex: 5 }}>
                        {project.thumbnail && (
                          <div 
                            onClick={() => handleCardThumbnailClick(project)}
                            style={{ 
                              width: '100%', 
                              height: '140px', 
                              marginBottom: '14px', 
                              overflow: 'hidden',
                              border: '1px solid rgba(255,255,255,0.12)',
                              position: 'relative',
                              cursor: 'pointer',
                              background: '#08090f'
                            }}
                          >
                            <img 
                              src={project.thumbnail} 
                              alt={project.title}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onError={(e) => { e.currentTarget.style.opacity = '0.15'; }}
                            />
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(5, 5, 8, 0.85)',
                              border: `1px solid ${currentTheme.color}66`,
                              color: '#fff',
                              fontSize: '10px',
                              padding: '3px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              letterSpacing: '1px'
                            }}>
                              <Calendar size={10} color={currentTheme.color} />
                              {project.year}
                            </div>
                          </div>
                        )}

                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginBottom: '10px'
                        }}>
                          {project.tags?.map((tag) => (
                            <span 
                              key={tag}
                              style={{ 
                                fontSize: '10px', 
                                letterSpacing: '1px', 
                                color: currentTheme.color,
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '3px 7px'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <h3 className="font-display" style={{ 
                          fontSize: '17px', 
                          marginBottom: '8px',
                          letterSpacing: '0.5px'
                        }}>
                          {project.title}
                        </h3>

                        <p style={{ 
                          fontSize: '12px', 
                          lineHeight: 1.5, 
                          color: 'rgba(255,255,255,0.65)',
                          marginBottom: '18px'
                        }}>
                          {project.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', position: 'relative', zIndex: 5 }}>
                        {project.embed?.type === 'iframe' && (
                          <button
                            type="button"
                            onClick={() => setActiveModal(project)}
                            style={{
                              flex: 1,
                              background: currentTheme.color,
                              color: '#050508',
                              border: 'none',
                              padding: '10px 14px',
                              fontFamily: 'inherit',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              letterSpacing: '1px'
                            }}
                          >
                            <Play size={14} fill="#050508" />
                            ИГРАТЬ В БРАУЗЕРЕ
                          </button>
                        )}

                        {project.embed?.type === 'video' && (
                          <button
                            type="button"
                            onClick={() => setActiveModal(project)}
                            style={{
                              flex: 1,
                              background: currentTheme.color,
                              color: '#050508',
                              border: 'none',
                              padding: '10px 14px',
                              fontFamily: 'inherit',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              letterSpacing: '1px'
                            }}
                          >
                            <Maximize2 size={14} />
                            СМОТРЕТЬ ВИДЕО
                          </button>
                        )}

                        {project.embed?.type === 'external' && (
                          <>
                            <a
                              href={project.embed.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                flex: 1,
                                background: currentTheme.color,
                                color: '#050508',
                                textDecoration: 'none',
                                padding: '10px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                letterSpacing: '0.5px'
                              }}
                            >
                              <ExternalLink size={14} />
                              ОТКРЫТЬ ПРОЕКТ
                            </a>

                            {repoUrl && (
                              <a
                                href={repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Открыть репозиторий на GitHub"
                                style={{
                                  background: 'rgba(255,255,255,0.08)',
                                  color: '#fff',
                                  textDecoration: 'none',
                                  border: `1px solid ${currentTheme.color}`,
                                  padding: '10px 12px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <GithubIcon size={14} />
                                GITHUB
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        </main>

        <footer style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '11px', 
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '1.5px',
          pointerEvents: 'auto'
        }}>
          <div>КАМЕРА // Z: {currentTheme.camPos[2].toFixed(1)} | СЕКТОР: {activeCategory.toUpperCase()}</div>
          <div>ИНТЕРАКТИВНОЕ ПОРТФОЛИО // REACT + THREE.JS</div>
        </footer>
      </div>

      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(4, 5, 10, 0.92)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 40px'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '14px',
              borderBottom: `1px solid ${currentTheme.color}44`,
              paddingBottom: '14px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: currentTheme.color, letterSpacing: '2px' }}>
                  {activeModal.category.toUpperCase()} // {activeModal.tags?.join(' • ')} // {activeModal.year}
                </span>
                <h2 className="font-display" style={{ fontSize: '22px', marginTop: '4px' }}>
                  {activeModal.title}
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleFullScreen}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: `1px solid ${currentTheme.color}`,
                    color: '#fff',
                    padding: '10px 16px',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Maximize2 size={15} />
                  НА ВЕСЬ ЭКРАН
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: 'rgba(255, 0, 85, 0.15)',
                    border: '1px solid #ff0055',
                    color: '#fff',
                    padding: '10px 18px',
                    fontFamily: 'inherit',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <X size={16} />
                  ЗАКРЫТЬ [ESC]
                </button>
              </div>
            </div>

            <motion.div
              ref={playerContainerRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.08 }}
              style={{
                flex: 1,
                border: `1px solid ${currentTheme.color}`,
                boxShadow: `0 0 50px ${currentTheme.color}22`,
                backgroundColor: '#050608',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {activeModal.embed?.type === 'iframe' ? (
                <iframe
                  src={activeModal.embed.url}
                  title={activeModal.title}
                  onLoad={(e) => e.currentTarget.focus()}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; fullscreen; gamepad"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeModal.embed?.url}
                  controls
                  autoPlay
                  loop
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}