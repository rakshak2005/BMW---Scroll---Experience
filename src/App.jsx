import React, { useEffect, useRef, useState } from 'react';

const FOLDER3_START = 67;
const FOLDER3_END = 300;
const FOLDER3_COUNT = FOLDER3_END - FOLDER3_START + 1; // 234
const FOLDER4_COUNT = 300;
const FOLDER5_COUNT = 300;

// Total frames includes the static 1stimage.png prepended
const SEQUENCE_COUNT = FOLDER3_COUNT + FOLDER4_COUNT + FOLDER5_COUNT; // 834
const FRAME_COUNT = 1 + SEQUENCE_COUNT; // 835 frames total (Index 0 is 1stimage.png)

export default function App() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0); // 0: HERO, 1: GRILLE, 2: REAR, 3: SWEEP, 4: BRIDGE, 5: TEST DRIVE
  
  // Interactive specs count-up states for next-gen HUDs
  const [power, setPower] = useState(0);
  const [torque, setTorque] = useState(0);
  const [zeroHundred, setZeroHundred] = useState(0.0);
  const [topSpeed, setTopSpeed] = useState(0);

  // States for Bridge driving telemetry count-up
  const [bridgePower, setBridgePower] = useState(0);
  const [bridgeTorque, setBridgeTorque] = useState(0);
  const [bridgeZeroHundred, setBridgeZeroHundred] = useState(0.0);
  const [bridgeTopSpeed, setBridgeTopSpeed] = useState(0);

  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const scrollContainerRef = useRef(null);

  // Layout overlay refs for scroll fade animations
  const heroSectionRef = useRef(null);
  const headerRef = useRef(null);
  const floatCardRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  
  // Elements for Section 2 (Frame 101 grille stop)
  const sec2TitleRef = useRef(null);
  const sec2GlowRef = useRef(null);

  // Elements for Section 3 (Frame 186 rear stop)
  const sec3TitleRef = useRef(null);
  const sec3GlowRef = useRef(null);

  // Next-gen overlay refs for Section 4 (Frame 325 sweep stop)
  const sec4TitleRef = useRef(null);
  const scrollLineProgressRef = useRef(null);

  // Next-gen Driving Experience overlay refs for Section 5 (Frame 602 bridge stop)
  const sec5TitleRef = useRef(null);
  const bridgeScrollProgressRef = useRef(null);

  // Next-gen Test Drive booking refs for Section 6 (Frame 712 mountain stop)
  const sec6TitleRef = useRef(null);
  const sysStatRef = useRef(null);
  const debugHudRef = useRef(null);
  const sec7AttributionRef = useRef(null);

  // Debug HUD elements (60fps DOM updates)
  const frameTelemetryRef = useRef(null);
  const srcTelemetryRef = useRef(null);

  // Custom cursor elements
  const cursorDotRef = useRef(null);
  const cursorFollowerRef = useRef(null);
  const appContainerRef = useRef(null);

  // Interpolation variables for butter-smooth scroll inertia
  const stateRef = useRef({
    targetFrame: 0,
    currentFrame: 0,
  });

  // Mouse position factors for parallax/tilt paint reflection
  const mouseFactorRef = useRef({ x: 0, y: 0 });

  // State to turn off screen shake / tilt if mouse is shaken
  const [isShakeEffectDisabled, setIsShakeEffectDisabled] = useState(false);
  const shakeDetectionRef = useRef({
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    directionChanges: 0,
    lastDirectionX: 0,
    lastDirectionY: 0,
    shakeResetTimeout: null
  });

  // Draw a specific image to the canvas
  const drawSingleImage = (img) => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    // Force a high-dpi multiplier of 3 for razor-sharp 4K rendering
    const dpr = Math.max(3, window.devicePixelRatio || 1);
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const isFirstFrame = img.src && img.src.includes('1stimage.png');
    const scaleMultiplier = isFirstFrame ? 1.05 : 1.0;
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * scaleMultiplier;
    const x = (canvas.width / 2) - (img.width / 2) * scale;
    
    // Shift the car downwards only on the first frame, bounded to prevent black bars
    const baseY = (canvas.height / 2) - (img.height / 2) * scale;
    const maxShiftY = Math.max(0, ((img.height * scale) - canvas.height) / 2);
    const targetShift = isFirstFrame ? 38 * dpr : 0;
    const shiftY = Math.min(targetShift, maxShiftY);
    const y = baseY + shiftY;

    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  };

  // Preload first image immediately so the canvas is not black during load
  useEffect(() => {
    const firstImg = new Image();
    firstImg.src = '/1stimage.png';
    firstImg.onload = () => {
      if (!isLoaded) {
        drawSingleImage(firstImg);
      }
    };
  }, [isLoaded]);


  // Preload all images progressively to prevent network choke and speed up initial page load
  useEffect(() => {
    // 1. Pre-create all Image objects and store in ref
    const loadedImages = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      loadedImages.push(img);
    }
    imagesRef.current = loadedImages;

    // Helper to get image source path
    const getSrcForIndex = (i) => {
      if (i === 0) return '/1stimage.png';
      const seqIndex = i;
      if (seqIndex <= FOLDER3_COUNT) {
        const frameNum = FOLDER3_START + seqIndex - 1;
        const resolvedFrameNum = frameNum === 252 ? 251 : frameNum;
        const frameNumStr = String(resolvedFrameNum).padStart(3, '0');
        return `/folder3/ezgif-frame-${frameNumStr}.jpg`;
      } else if (seqIndex <= FOLDER3_COUNT + FOLDER4_COUNT) {
        const frameNum = String(seqIndex - FOLDER3_COUNT).padStart(3, '0');
        return `/folder4/ezgif-frame-${frameNum}.jpg`;
      } else {
        const frameNum = String(seqIndex - FOLDER3_COUNT - FOLDER4_COUNT).padStart(3, '0');
        return `/folder5/ezgif-frame-${frameNum}.jpg`;
      }
    };

    // Define essential frames to load before making site interactive (Hero + Stops + coarse frames)
    const keyFrames = [0, 101, 186, 325, 450, 602, 712, FRAME_COUNT - 1];
    const essentialSet = new Set(keyFrames);
    for (let i = 0; i < FRAME_COUNT; i += 12) {
      essentialSet.add(i);
    }
    const essentialArray = Array.from(essentialSet);

    let essentialLoadedCount = 0;
    const totalEssential = essentialArray.length;

    // First, load the essential frames to make the site interactive quickly
    essentialArray.forEach((index) => {
      const img = loadedImages[index];
      img.src = getSrcForIndex(index);
      
      const onEssentialLoad = () => {
        essentialLoadedCount++;
        const progress = Math.round((essentialLoadedCount / totalEssential) * 100);
        setLoadingProgress(progress);

        if (essentialLoadedCount === totalEssential) {
          setIsLoaded(true);
          // Essential loaded! Now trigger background load for all other frames
          loadNonEssential();
        }
      };

      img.onload = onEssentialLoad;
      img.onerror = onEssentialLoad; // Keep loading even if a frame fails
    });

    // Load non-essential frames in the background in small batches to not choke network
    const loadNonEssential = () => {
      const nonEssentialArray = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (!essentialSet.has(i)) {
          nonEssentialArray.push(i);
        }
      }

      // Load in batches of 15 frames to prevent network congestion
      const batchSize = 15;
      let batchIndex = 0;

      const loadNextBatch = () => {
        if (batchIndex >= nonEssentialArray.length) return;

        const limit = Math.min(batchIndex + batchSize, nonEssentialArray.length);
        for (let j = batchIndex; j < limit; j++) {
          const index = nonEssentialArray[j];
          const img = loadedImages[index];
          img.src = getSrcForIndex(index);
        }

        batchIndex += batchSize;
        // Schedule next batch slightly later
        setTimeout(loadNextBatch, 120);
      };

      // Delay starting non-essential loads by 300ms to allow canvas initial draw to finish smoothly
      setTimeout(loadNextBatch, 300);
    };
  }, []);

  // Frame 325 count up telemetry
  useEffect(() => {
    if (!isLoaded || activeSlide !== 3) {
      setPower(0);
      setTorque(0);
      setZeroHundred(0.0);
      setTopSpeed(0);
      return;
    }

    // Power (0 to 620)
    let pVal = 0;
    const pTimer = setInterval(() => {
      pVal += 20;
      if (pVal >= 620) {
        setPower(620);
        clearInterval(pTimer);
      } else {
        setPower(pVal);
      }
    }, 25);

    // Torque (0 to 750)
    let tVal = 0;
    const tTimer = setInterval(() => {
      tVal += 25;
      if (tVal >= 750) {
        setTorque(750);
        clearInterval(tTimer);
      } else {
        setTorque(tVal);
      }
    }, 25);

    // 0-100 (0.0 to 3.2)
    let zVal = 0.0;
    const zTimer = setInterval(() => {
      zVal += 0.1;
      if (zVal >= 3.2) {
        setZeroHundred(3.2);
        clearInterval(zTimer);
      } else {
        setZeroHundred(parseFloat(zVal.toFixed(1)));
      }
    }, 30);

    // Top Speed (0 to 290)
    let sVal = 0;
    const sTimer = setInterval(() => {
      sVal += 10;
      if (sVal >= 290) {
        setTopSpeed(290);
        clearInterval(sTimer);
      } else {
        setTopSpeed(sVal);
      }
    }, 25);

    return () => {
      clearInterval(pTimer);
      clearInterval(tTimer);
      clearInterval(zTimer);
      clearInterval(sTimer);
    };
  }, [isLoaded, activeSlide]);

  // Frame 602 count up telemetry
  useEffect(() => {
    if (!isLoaded || activeSlide !== 4) {
      setBridgePower(0);
      setBridgeTorque(0);
      setBridgeZeroHundred(0.0);
      setBridgeTopSpeed(0);
      return;
    }

    // Power (0 to 620)
    let pVal = 0;
    const pTimer = setInterval(() => {
      pVal += 20;
      if (pVal >= 620) {
        setBridgePower(620);
        clearInterval(pTimer);
      } else {
        setBridgePower(pVal);
      }
    }, 25);

    // Torque (0 to 750)
    let tVal = 0;
    const tTimer = setInterval(() => {
      tVal += 25;
      if (tVal >= 750) {
        setBridgeTorque(750);
        clearInterval(tTimer);
      } else {
        setBridgeTorque(tVal);
      }
    }, 25);

    // 0-100 (0.0 to 3.2)
    let zVal = 0.0;
    const zTimer = setInterval(() => {
      zVal += 0.1;
      if (zVal >= 3.2) {
        setBridgeZeroHundred(3.2);
        clearInterval(zTimer);
      } else {
        setBridgeZeroHundred(parseFloat(zVal.toFixed(1)));
      }
    }, 30);

    // Top Speed (0 to 290)
    let sVal = 0;
    const sTimer = setInterval(() => {
      sVal += 10;
      if (sVal >= 290) {
        setBridgeTopSpeed(290);
        clearInterval(sTimer);
      } else {
        setBridgeTopSpeed(sVal);
      }
    }, 25);

    return () => {
      clearInterval(pTimer);
      clearInterval(tTimer);
      clearInterval(zTimer);
      clearInterval(sTimer);
    };
  }, [isLoaded, activeSlide]);

  // Mouse tilt tracking & cursor movement disabled to prevent screen shake/tilt
  useEffect(() => {
    const onMouseMove = (e) => {
      mouseFactorRef.current.x = 0;
      mouseFactorRef.current.y = 0;
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  // Hover helper toggles
  const handleMouseEnter = () => {
    if (appContainerRef.current) {
      appContainerRef.current.classList.add('cursor-hover');
    }
  };

  const handleMouseLeave = () => {
    if (appContainerRef.current) {
      appContainerRef.current.classList.remove('cursor-hover');
    }
  };

  // Switch scroll position based on bottom-pill clicks
  const handleSectionChange = (slideId) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const totalHeight = container.clientHeight - window.innerHeight;
    
    let scrollFraction = 0;
    if (slideId === 0) scrollFraction = 0.0;
    else if (slideId === 1) scrollFraction = 0.14; // Center of Grille stop (10% - 17%)
    else if (slideId === 2) scrollFraction = 0.29; // Center of Rear stop (23% - 30%)
    else if (slideId === 3) scrollFraction = 0.50; // Sweep section stop 1 (40% - 48%)
    
    const targetScrollY = scrollFraction * totalHeight;
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  };

  // Update target frame based on scroll with SEXTUPLE plateau stops:
  // 1. Frame 101 stop (progress 10% - 17% of scroll depth)
  // 2. Frame 186 stop / ezgif-frame-251.jpg (progress 23% - 30% of scroll depth)
  // 3. Frame 325 stop / ezgif-frame-091.jpg (progress 40% - 48% of scroll depth)
  // 4. Frame 450 stop / ezgif-frame-216.jpg wheel (progress 56% - 64% of scroll depth)
  // 5. Frame 602 stop / ezgif-frame-088.jpg bridge (progress 72% - 80% of scroll depth)
  // 6. Frame 712 stop / ezgif-frame-178.jpg test drive (progress 86% - 94% of scroll depth)
  useEffect(() => {
    if (!isLoaded) return;

    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      
      const totalScrollableHeight = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      
      let scrollFraction = scrolled / totalScrollableHeight;
      scrollFraction = Math.max(0, Math.min(1, scrollFraction));
      
      // Fill bottom center scroll discover line gradually on Section 4
      if (scrollLineProgressRef.current) {
        scrollLineProgressRef.current.style.width = `${scrollFraction * 100}%`;
      }
      // Fill bottom center scroll timeline bar gradually on Section 5
      if (bridgeScrollProgressRef.current) {
        bridgeScrollProgressRef.current.style.width = `${scrollFraction * 100}%`;
      }

      // Update activeSlide state based on scroll fraction
      if (scrollFraction < 0.10) {
        setActiveSlide(0); // HERO
      } else if (scrollFraction >= 0.10 && scrollFraction < 0.22) {
        setActiveSlide(1); // GRILLE stop view
      } else if (scrollFraction >= 0.22 && scrollFraction < 0.38) {
        setActiveSlide(2); // REAR stop view
      } else if (scrollFraction >= 0.38 && scrollFraction < 0.64) {
        setActiveSlide(3); // SWEEP stop view
      } else if (scrollFraction >= 0.64 && scrollFraction < 0.82) {
        setActiveSlide(4); // BRIDGE stop view
      } else {
        setActiveSlide(5); // TEST DRIVE stop view
      }
      
      let targetFrame = 0;
      if (scrollFraction < 0.10) {
        targetFrame = (scrollFraction / 0.10) * 101;
      } else if (scrollFraction >= 0.10 && scrollFraction < 0.17) {
        targetFrame = 101;
      } else if (scrollFraction >= 0.17 && scrollFraction < 0.23) {
        const progressInSegment = (scrollFraction - 0.17) / 0.06;
        targetFrame = 101 + progressInSegment * (186 - 101);
      } else if (scrollFraction >= 0.23 && scrollFraction < 0.30) {
        targetFrame = 186;
      } else if (scrollFraction >= 0.30 && scrollFraction < 0.40) {
        const progressInSegment = (scrollFraction - 0.30) / 0.10;
        targetFrame = 186 + progressInSegment * (325 - 186);
      } else if (scrollFraction >= 0.40 && scrollFraction < 0.48) {
        targetFrame = 325; // Latch Sweep stop 1
      } else if (scrollFraction >= 0.48 && scrollFraction < 0.56) {
        const progressInSegment = (scrollFraction - 0.48) / 0.08;
        targetFrame = 325 + progressInSegment * (450 - 325);
      } else if (scrollFraction >= 0.56 && scrollFraction < 0.64) {
        targetFrame = 450; // Latch Wheel close-up stop
      } else if (scrollFraction >= 0.64 && scrollFraction < 0.72) {
        const progressInSegment = (scrollFraction - 0.64) / 0.08;
        targetFrame = 450 + progressInSegment * (602 - 450);
      } else if (scrollFraction >= 0.72 && scrollFraction < 0.80) {
        targetFrame = 602; // Latch Bridge driving scene stop
      } else if (scrollFraction >= 0.80 && scrollFraction < 0.86) {
        const progressInSegment = (scrollFraction - 0.80) / 0.06;
        targetFrame = 602 + progressInSegment * (712 - 602);
      } else if (scrollFraction >= 0.86 && scrollFraction < 0.94) {
        targetFrame = 712; // Latch Test Drive mountain sunset stop
      } else {
        const progressInSegment = (scrollFraction - 0.94) / 0.06;
        targetFrame = 712 + progressInSegment * (FRAME_COUNT - 1 - 712);
      }

      stateRef.current.targetFrame = targetFrame;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isLoaded]);

  // Helper to find the nearest loaded image to prevent empty frames during background load
  const getNearestLoadedImage = (index) => {
    const images = imagesRef.current;
    if (!images || images.length === 0) return null;
    
    // Check target frame
    if (images[index] && images[index].complete && images[index].naturalWidth) {
      return images[index];
    }
    
    // Bidirectional search
    let left = index - 1;
    let right = index + 1;
    
    while (left >= 0 || right < images.length) {
      if (left >= 0 && images[left] && images[left].complete && images[left].naturalWidth) {
        return images[left];
      }
      if (right < images.length && images[right] && images[right].complete && images[right].naturalWidth) {
        return images[right];
      }
      left--;
      right++;
    }
    
    return null;
  };

  // Animation / Render loop
  useEffect(() => {
    if (!isLoaded) return;

    let animationFrameId;

    const update = () => {
      const state = stateRef.current;
      const diff = state.targetFrame - state.currentFrame;
      
      if (Math.abs(diff) < 0.05) {
        state.currentFrame = state.targetFrame;
      } else {
        state.currentFrame += diff * 0.085; // Butter-smooth ease-out
      }

      const frameToDraw = Math.round(state.currentFrame);
      const img = getNearestLoadedImage(frameToDraw);
      if (img) {
        drawSingleImage(img);
      }

      const progress = state.currentFrame / (FRAME_COUNT - 1);

      // Update Debug telemetry values at 60fps
      if (frameTelemetryRef.current) {
        frameTelemetryRef.current.textContent = String(frameToDraw).padStart(3, '0');
      }
      if (srcTelemetryRef.current) {
        let src = '1stimage.png';
        if (frameToDraw > 0) {
          const seqIndex = frameToDraw;
          if (seqIndex <= FOLDER3_COUNT) {
            const frameNum = FOLDER3_START + seqIndex - 1;
            const resolvedFrameNum = frameNum === 252 ? 251 : frameNum;
            const frameNumStr = String(resolvedFrameNum).padStart(3, '0');
            src = `folder3/ezgif-frame-${frameNumStr}.jpg`;
          } else if (seqIndex <= FOLDER3_COUNT + FOLDER4_COUNT) {
            const frameNum = String(seqIndex - FOLDER3_COUNT).padStart(3, '0');
            src = `folder4/ezgif-frame-${frameNum}.jpg`;
          } else {
            const frameNum = String(seqIndex - FOLDER3_COUNT - FOLDER4_COUNT).padStart(3, '0');
            src = `folder5/ezgif-frame-${frameNum}.jpg`;
          }
        }
        srcTelemetryRef.current.textContent = src;
      }

      // Parallax tilt on canvas element
      const canvas = canvasRef.current;
      if (canvas) {
        const translateX = mouseFactorRef.current.x * 12;
        const translateY = mouseFactorRef.current.y * 8;
        canvas.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
      }

      // 1. Hero Text Left Overlay (Fade out: 0.00 -> 0.06)
      if (heroSectionRef.current) {
        const opacity = Math.max(0, Math.min(1, (0.06 - progress) / 0.05));
        const transformX = progress * -80;
        heroSectionRef.current.style.opacity = opacity;
        heroSectionRef.current.style.transform = `translateY(-50%) translateX(${transformX}px)`;
        heroSectionRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
      }

      // 2. Floating Spec Card Bottom Right (Fade out: 0.00 -> 0.05)
      if (floatCardRef.current) {
        const opacity = Math.max(0, Math.min(1, (0.05 - progress) / 0.04));
        const transformX = progress * 60;
        floatCardRef.current.style.opacity = opacity;
        floatCardRef.current.style.transform = `translateX(${transformX}px)`;
        floatCardRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
      }

      // 3. Scroll Indicator Bottom Center (Fade out: 0.00 -> 0.04)
      if (scrollIndicatorRef.current) {
        const opacity = Math.max(0, Math.min(1, (0.04 - progress) / 0.03));
        const transformY = progress * 40;
        scrollIndicatorRef.current.style.opacity = opacity;
        scrollIndicatorRef.current.style.transform = `translate(-50%, ${transformY}px)`;
      }

      // 4. Header Bar (Fade out: 0.00 -> 0.06)
      if (headerRef.current) {
        const opacity = Math.max(0, Math.min(1, (0.06 - progress) / 0.05));
        headerRef.current.style.opacity = opacity;
        headerRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
      }

      // 5. Section 2 Grille Title & Glow Overlay (Fade in: frame 90 -> 101, Fade out: frame 101 -> 118)
      if (sec2TitleRef.current && sec2GlowRef.current) {
        let opacity = 0;
        if (frameToDraw >= 90 && frameToDraw <= 101) {
          opacity = (frameToDraw - 90) / 11;
        } else if (frameToDraw > 101 && frameToDraw <= 118) {
          opacity = (118 - frameToDraw) / 17;
        }
        
        opacity = Math.max(0, Math.min(1, opacity));
        sec2TitleRef.current.style.opacity = opacity;
        sec2GlowRef.current.style.opacity = opacity * 0.16; // Glow opacity cap at 16%

        sec2TitleRef.current.style.transform = `translate(-50%, ${(101 - Math.min(frameToDraw, 101)) * -3}px)`;
      }

      // 6. Section 3 Rear Profile UI Overlay (Fade in: frame 172 -> 186, Fade out: frame 186 -> 202)
      if (sec3TitleRef.current && sec3GlowRef.current) {
        let opacity = 0;
        if (frameToDraw >= 172 && frameToDraw <= 186) {
          opacity = (frameToDraw - 172) / 14;
        } else if (frameToDraw > 186 && frameToDraw <= 202) {
          opacity = (202 - frameToDraw) / 16;
        }

        opacity = Math.max(0, Math.min(1, opacity));
        sec3TitleRef.current.style.opacity = opacity;
        sec3GlowRef.current.style.opacity = opacity * 0.16; // Glow opacity cap at 16%

        const slideX = (186 - Math.min(frameToDraw, 186)) * 4;
        sec3TitleRef.current.style.transform = `translateY(-50%) translateX(${slideX}px)`;
        sec3TitleRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
      }

      // 7. Section 4 next-gen telemetry overlay (Fade in: frame 310 -> 325, Fade out: frame 325 -> 345)
      if (sec4TitleRef.current) {
        let opacity = 0;
        if (frameToDraw >= 310 && frameToDraw <= 325) {
          opacity = (frameToDraw - 310) / 15;
        } else if (frameToDraw > 325 && frameToDraw <= 345) {
          opacity = (345 - frameToDraw) / 20;
        }

        opacity = Math.max(0, Math.min(1, opacity));
        sec4TitleRef.current.style.opacity = opacity;
        sec4TitleRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';

        // HUD parallax translation based on mouse interaction
        const tiltX = mouseFactorRef.current.x * 20;
        const tiltY = mouseFactorRef.current.y * 15;
        sec4TitleRef.current.style.transform = `translate3d(${tiltX}px, ${tiltY}px, 0)`;
      }

      // 8. Section 5 next-gen bridge driving overlay (Fade in: frame 585 -> 602, Fade out: frame 602 -> 625)
      if (sec5TitleRef.current) {
        let opacity = 0;
        if (frameToDraw >= 585 && frameToDraw <= 602) {
          opacity = (frameToDraw - 585) / 17;
        } else if (frameToDraw > 602 && frameToDraw <= 625) {
          opacity = (625 - frameToDraw) / 23;
        }

        opacity = Math.max(0, Math.min(1, opacity));
        sec5TitleRef.current.style.opacity = opacity;
        sec5TitleRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';

        // Parallax translation
        const tiltX = mouseFactorRef.current.x * 22;
        const tiltY = mouseFactorRef.current.y * 18;
        sec5TitleRef.current.style.transform = `translate3d(${tiltX}px, ${tiltY}px, 0)`;
      }

      // 9. Hide general SYS_STAT badge during next-gen overlays (Frames 325, 602, and 712 stops)
      let sysStatOpacity = 1;
      if (frameToDraw >= 300 && frameToDraw <= 355) {
        if (frameToDraw < 325) {
          sysStatOpacity = (325 - frameToDraw) / 25;
        } else {
          sysStatOpacity = (frameToDraw - 325) / 30;
        }
      } else if (frameToDraw >= 575 && frameToDraw <= 635) {
        if (frameToDraw < 602) {
          sysStatOpacity = (602 - frameToDraw) / 27;
        } else {
          sysStatOpacity = (frameToDraw - 602) / 33;
        }
      } else if (frameToDraw >= 685 && frameToDraw <= 735) {
        if (frameToDraw < 712) {
          sysStatOpacity = (712 - frameToDraw) / 27;
        } else {
          sysStatOpacity = (frameToDraw - 712) / 23;
        }
      }
      sysStatOpacity = Math.max(0, Math.min(1, sysStatOpacity));
      if (sysStatRef.current) {
        sysStatRef.current.style.opacity = sysStatOpacity;
        sysStatRef.current.style.pointerEvents = sysStatOpacity > 0.1 ? 'auto' : 'none';
      }

      // 10. Section 6 Test Drive Booking overlay (Fade in: frame 690 -> 712, Fade out: 712 -> 735)
      if (sec6TitleRef.current) {
        let opacity = 0;
        if (frameToDraw >= 690 && frameToDraw <= 712) {
          opacity = (frameToDraw - 690) / 22;
        } else if (frameToDraw > 712 && frameToDraw <= 735) {
          opacity = (735 - frameToDraw) / 23;
        }

        opacity = Math.max(0, Math.min(1, opacity));
        sec6TitleRef.current.style.opacity = opacity;
        sec6TitleRef.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';

        // Parallax translations
        const tiltX = mouseFactorRef.current.x * 18;
        const tiltY = mouseFactorRef.current.y * 15;
        sec6TitleRef.current.style.transform = `translate3d(${tiltX}px, ${tiltY}px, 0)`;
      }

      // 11. Section 7 Attribution (Fade in: frame 800 -> 834)
      if (sec7AttributionRef.current) {
        let opacity = 0;
        if (frameToDraw >= 800) {
          opacity = (frameToDraw - 800) / 34;
        }
        opacity = Math.max(0, Math.min(1, opacity));
        sec7AttributionRef.current.style.opacity = opacity;
      }

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLoaded]);

  return (
    <div 
      ref={appContainerRef}
      style={{ backgroundColor: '#05070A', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      {/* Custom premium cursor */}
      <div ref={cursorDotRef} className="cursor-dot" />
      <div ref={cursorFollowerRef} className="cursor-follower" />

      {/* Cinematic Vignette */}
      <div className="cinematic-vignette" />
      <div className="ambient-blue-glow" />

      {/* Interactive fog layer that slowly drifts */}
      <div className="cinematic-fog" style={{ animation: 'fogDrift 40s linear infinite' }} />

      {/* Interactive Puddle Ripple */}
      <div className="puddle-container">
        <div className="puddle-ripple" />
        <div className="puddle-ripple" style={{ animationDelay: '4s' }} />
      </div>

      {/* SECTION 2 STICKY AMBIENT BLUE GLOW (Behind Grille Logo) */}
      <div
        ref={sec2GlowRef}
        style={{
          position: 'fixed',
          top: '40%',
          left: '57%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, #0057FF 0%, transparent 70%)',
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'blur(50px)',
          opacity: 0,
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* SECTION 3 STICKY AMBIENT BLUE GLOW (Behind Rear Profile Card) */}
      <div
        ref={sec3GlowRef}
        style={{
          position: 'fixed',
          top: '50%',
          right: '5%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0, 87, 255, 0.2) 0%, transparent 70%)',
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'blur(60px)',
          opacity: 0,
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* Loading Overlay */}
      {!isLoaded && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#05070A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: '300',
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: '#ffffff',
            opacity: 0.8,
            marginBottom: '2rem',
            fontFamily: 'system-ui, sans-serif'
          }}>
            Loading Experience
          </div>
          
          <div style={{
            width: '280px',
            height: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div className="loader-sweep" />
          </div>
          
          <div style={{
            fontSize: '0.55rem',
            fontFamily: 'monospace',
            color: '#ffffff',
            opacity: 0.25,
            marginTop: '1.2rem',
            letterSpacing: '0.25em'
          }}>
            CALIBRATING ASSETS / {loadingProgress}%
          </div>
        </div>
      )}



      {/* HEADER NAVIGATION (Only on Hero, fades on scroll) */}
      {isLoaded && (
        <header 
          ref={headerRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: 'var(--header-padding-y) var(--hud-side-margin)',
            zIndex: 100,
            pointerEvents: 'auto',
            boxSizing: 'border-box',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
          }}
        >
          {/* Right-aligned Navigation and Menu grouped together for readability */}
          <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'center' }}>
            <nav style={{ 
              display: 'flex', 
              gap: '2.5rem', 
              alignItems: 'center'
            }}>
              {[
                { name: 'Models', href: 'https://www.bmw.in/en/all-models.html', target: '_blank' },
                { name: 'Configurator', href: 'https://www.bmw.in/en/digital-services/bmw-digital-key.html', target: '_blank' }
              ].map((item) => (
                <a 
                  key={item.name} 
                  href={item.href}
                  target={item.target || undefined}
                  rel={item.target ? 'noopener noreferrer' : undefined}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    letterSpacing: '0.2em',
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    textDecoration: 'none',
                    transition: 'color 0.4s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--accent-blue)';
                    handleMouseEnter();
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'rgba(255, 255, 255, 0.9)';
                    handleMouseLeave();
                  }}
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Menu Trigger */}
            <div 
              className="animated-hamburg-trigger"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span />
              <span />
              <span />
            </div>
          </div>
        </header>
      )}



      {/* BOTTOM-CENTER HIGH-TECH LINE & DOT SCROLL TIMELINE */}
      {isLoaded && (
        <div style={{
          position: 'fixed',
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem',
          width: '90%',
          maxWidth: '360px',
          pointerEvents: 'auto'
        }}>
          {/* Main Track Line Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          >
            {/* The Rail Background Line */}
            <div style={{
              width: '100%',
              height: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '2px',
              position: 'relative'
            }}>
              {/* Section Division Dot Indicators */}
              {[
                { label: 'HERO', pct: 0, frame: 0 },
                { label: 'GRILLE', pct: 14, frame: 101 },
                { label: 'REAR', pct: 29, frame: 186 },
                { label: 'SWEEP', pct: 50, frame: 325 },
                { label: 'BRIDGE', pct: 76, frame: 602 },
                { label: 'SUNSET', pct: 90, frame: 712 }
              ].map((section) => {
                const isActive = activeSlide === (
                  section.label === 'HERO' ? 0 :
                  section.label === 'GRILLE' ? 1 :
                  section.label === 'REAR' ? 2 :
                  section.label === 'SWEEP' ? 3 :
                  section.label === 'BRIDGE' ? 4 : 5
                );
                return (
                  <div
                    key={section.label}
                    onClick={() => {
                      if (!scrollContainerRef.current) return;
                      const container = scrollContainerRef.current;
                      const totalHeight = container.clientHeight - window.innerHeight;
                      const targetScrollFraction = section.frame / (FRAME_COUNT - 1);
                      window.scrollTo({
                        top: targetScrollFraction * totalHeight,
                        behavior: 'smooth'
                      });
                    }}
                    style={{
                      position: 'absolute',
                      left: `${section.pct}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: isActive ? '12px' : '6px',
                      height: isActive ? '12px' : '6px',
                      borderRadius: '50%',
                      backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                      border: '1px solid rgba(0,0,0,0.5)',
                      boxShadow: isActive ? '0 0 10px #ffffff, 0 0 15px var(--accent-blue)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: isActive ? 5 : 2
                    }}
                  >
                    {/* Floating Monospace Text Label above the tick dot */}
                    <span style={{
                      position: 'absolute',
                      top: '-18px',
                      fontSize: '0.45rem',
                      fontFamily: 'var(--font-mono)',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.3)',
                      fontWeight: isActive ? 'bold' : 'normal',
                      letterSpacing: '0.1em',
                      transition: 'color 0.3s ease',
                      whiteSpace: 'nowrap'
                    }}>
                      {section.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION OVERLAY (Only on starting screen, fades out instantly on scroll) */}
      {isLoaded && (
        <div 
          ref={heroSectionRef}
          style={{
            position: 'fixed',
            top: '48%',
            left: 'var(--hud-side-margin)',
            transform: 'translateY(-50%)',
            width: 'calc(100% - 2 * var(--hud-side-margin))',
            maxWidth: '450px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.8rem',
            zIndex: 10,
            pointerEvents: 'none',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontWeight: '900',
              fontSize: '4.8rem',
              letterSpacing: '-4px',
              margin: 0,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: '0.9',
              textShadow: '0 4px 24px rgba(0, 0, 0, 0.85), 0 2px 4px rgba(0, 0, 0, 0.9)'
            }}>
              THE<br />
              ULTIMATE
            </h1>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: '900',
              fontSize: '4.2rem',
              letterSpacing: '-3px',
              margin: 0,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: '0.95',
              textShadow: '0 4px 24px rgba(0, 0, 0, 0.85), 0 2px 4px rgba(0, 0, 0, 0.9)'
            }}>
              DRIVING<br />
              MACHINE
            </h2>
          </div>
 
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.6',
            margin: 0,
            fontWeight: '400',
            maxWidth: '340px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.95)'
          }}>
            Experience engineering in motion. Performance crafted with precision and raw emotion.
          </p>

          <div style={{ display: 'flex', gap: '1.2rem', pointerEvents: 'auto' }}>
            <a 
              href="https://www.bmw.in/en/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-luxury-primary"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{ 
                padding: '0.8rem 2rem', 
                fontSize: '0.7rem',
                textDecoration: 'none',
                display: 'inline-block',
                textAlign: 'center'
              }}
            >
              Explore
            </a>
            <a 
              href="https://youtu.be/Qf2fnG5UmdQ"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-luxury-glass"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              style={{ 
                padding: '0.8rem 2rem', 
                fontSize: '0.7rem',
                textDecoration: 'none',
                display: 'inline-block',
                textAlign: 'center'
              }}
            >
              Watch Film
            </a>
          </div>
        </div>
      )}

      {/* FLOATING GLASS CARD (Only on starting screen, fades out instantly on scroll) */}
      {isLoaded && (
        <div 
          ref={floatCardRef}
          className="luxury-glass-panel"
          style={{
            position: 'fixed',
            bottom: 'var(--header-padding-y)',
            right: 'var(--hud-side-margin)',
            width: 'calc(100% - 2 * var(--hud-side-margin))',
            maxWidth: '310px',
            padding: '1.8rem 2rem',
            zIndex: 10,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            boxSizing: 'border-box'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div>
            <div className="luxury-spec-label" style={{ marginBottom: '0.3rem' }}>
              CURRENT CONFIG
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '300', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              BMW M440i Coupe
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.9rem' }}>
            <div>
              <div className="luxury-spec-label">POWER</div>
              <div className="luxury-spec-value">382 <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HP</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="luxury-spec-label">0-100 KM/H</div>
              <div className="luxury-spec-value">4.5 <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sec</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.9rem' }}>
            <div>
              <div className="luxury-spec-label">EST. STARTING</div>
              <div className="luxury-spec-value" style={{ fontWeight: '400' }}>₹72,90,000</div>
            </div>
            <a 
              href="https://www.bmw.in/en/index.html" 
              target="_blank"
              rel="noopener noreferrer"
              className="luxury-spec-explore-btn"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span>Explore</span>
              <span className="arrow">→</span>
            </a>
          </div>
        </div>
      )}

      {/* PREMIUM SCROLL INDICATOR (Only on starting screen, fades out instantly on scroll) */}
      {isLoaded && (
        <div 
          ref={scrollIndicatorRef}
          style={{
            position: 'fixed',
            bottom: '6rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '0.55rem', letterSpacing: '0.4em', color: 'rgba(255, 255, 255, 0.8)', textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
            SCROLL TO EXPERIENCE
          </span>
          <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255, 255, 255, 0.1)', position: 'relative', overflow: 'hidden' }}>
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom, transparent, var(--accent-blue), transparent)',
                animation: 'indicatorSlide 2s cubic-bezier(0.16, 1, 0.3, 1) infinite'
              }}
            />
          </div>
        </div>
      )}

      {/* SECTION 2: GRILLE STICKY SPEC HUD WIDGET (Pill container with telemetry lines and glassmorphism) */}
      {isLoaded && (
        <div
          ref={sec2TitleRef}
          className="luxury-pill-panel"
          style={{
            position: 'fixed',
            top: '7.5%',
            left: '50%',
            transform: 'translate3d(-50%, 0, 0)',
            zIndex: 85,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '1.2rem 3rem',
            opacity: 0,
            pointerEvents: 'none',
            fontFamily: "'Inter', sans-serif",
            width: '90%',
            maxWidth: '420px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.8rem', width: '100%', justifyContent: 'space-around' }}>
            {/* Tech bracket left (Contrast optimized) */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-secondary)', letterSpacing: '0.15em', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              M4_F82
            </span>
            
            {/* Main Title */}
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: '300',
              fontSize: '1.8rem',
              letterSpacing: '0.25em',
              color: 'var(--text-primary)',
              margin: 0,
              textTransform: 'uppercase',
              textShadow: '0 2px 10px rgba(0,0,0,0.6)'
            }}>
              M4 COUPE
            </h2>

            {/* Tech bracket right with Pulsing dot */}
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.55rem', 
              color: 'var(--accent-blue)', 
              letterSpacing: '0.15em', 
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)'
            }}>
              <span 
                className="pulsing-dot-blue"
                style={{
                  width: '5px',
                  height: '5px',
                  backgroundColor: 'var(--accent-blue)',
                  borderRadius: '50%',
                  display: 'inline-block',
                  boxShadow: '0 0 8px var(--accent-blue)'
                }} 
              />
            </span>
          </div>

          {/* Glowing divider */}
          <div style={{
            width: '180px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--accent-blue), transparent)',
            opacity: 0.8
          }} />

          {/* Subtitle */}
          <div style={{
            fontSize: '0.55rem',
            letterSpacing: '0.5em',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            fontWeight: '400',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}>
            2026 EDITION // TWINPOWER TURBO
          </div>
        </div>
      )}

      {/* SECTION 3: DiagnosticsPanel Card (Anchored right, vertical center-ish, 360px wide, smaller paddings) */}
      {isLoaded && (
        <div
          ref={sec3TitleRef}
          className="luxury-glass-panel"
          style={{
            position: 'fixed',
            top: '50%',
            right: 'var(--hud-side-margin)',
            transform: 'translate3d(0, -50%, 0)',
            width: 'calc(100% - 2 * var(--hud-side-margin))',
            maxWidth: '340px',
            padding: '1.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.4rem',
            zIndex: 85,
            opacity: 0,
            pointerEvents: 'none',
            boxSizing: 'border-box',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {/* Small circular status dot anchored to the bottom-left corner of the card */}
          <div style={{
            position: 'absolute',
            bottom: '15px',
            left: '-5px',
            width: '10px',
            height: '10px',
            backgroundColor: 'var(--accent-blue)',
            borderRadius: '50%',
            boxShadow: '0 0 8px var(--accent-blue)',
            zIndex: 10
          }} />

          {/* Tech Header */}
          <div>
            <div style={{ fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--accent-blue)', fontWeight: '900', marginBottom: '0.3rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              SYSTEM DIAGNOSTICS // SEC_03
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '300', fontSize: '1.5rem', letterSpacing: '0.15em', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase' }}>
              REAR PROFILE
            </h3>
          </div>

          {/* Technical stat rows (stagger fade-in sequentially via inline transition delay) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {[
              { label: 'AERODYNAMICS', val: '0.25 Cd', status: 'OPTIMIZED' },
              { label: 'LIGHTING', val: 'BMW LASER', status: 'HIGH-VIS' },
              { label: 'EXHAUST SYSTEM', val: 'ACTIVE M-VALVE', status: 'DYNAMIC' },
              { label: 'DIFFERENTIAL', val: 'M ACTIVE DIFF', status: 'ENGAGED' }
            ].map((item, idx) => {
              const isRearActive = activeSlide === 2;
              return (
                <div 
                  key={item.label} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.2rem', 
                    borderTop: '1px solid rgba(255,255,255,0.06)', 
                    paddingTop: '0.6rem',
                    opacity: isRearActive ? 1 : 0,
                    transform: isRearActive ? 'translateY(0)' : 'translateY(8px)',
                    transition: `opacity 0.4s ease ${idx * 80}ms, transform 0.4s ease ${idx * 80}ms`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.45rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '0.42rem', letterSpacing: '0.15em', color: 'var(--accent-blue)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                      // {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontFamily: 'var(--font-display)', fontWeight: '200', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                    {item.val}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footnote divider and footnotes */}
          <div style={{ 
            borderTop: '1px solid rgba(255,255,255,0.06)', 
            paddingTop: '0.6rem',
            fontSize: '0.48rem', 
            fontFamily: 'var(--font-mono)', 
            color: 'var(--text-muted)', 
            letterSpacing: '0.12em', 
            lineHeight: '1.4' 
          }}>
            REAR SPOILER ANGLE: AUTO-BALANCED<br />
            ACTIVE DIFF LOCKING RATIO: VARIABLE 0-100%
          </div>
        </div>
      )}

      {/* SECTION 4: NEXT-GEN AUTOMOTIVE HERO EXPLORER OVERLAYS (Only reveals at Sweep stop around frame 325) */}
      {isLoaded && (
        <div 
          ref={sec4TitleRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 88,
            pointerEvents: 'none',
            opacity: 0,
            fontFamily: "'Inter', sans-serif",
            transition: 'opacity 0.4s ease'
          }}
        >
          {/* TOP LEFT: LIVE TELEMETRY BADGE */}
          <div 
            className="sec4-badge-left luxury-glass-panel"
            style={{
              position: 'absolute',
              top: '3rem',
              left: 'var(--hud-side-margin)',
              padding: '1.2rem 1.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              minWidth: '160px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="pulsing-dot-blue" style={{ width: '6px', height: '6px', backgroundColor: '#006CFF', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #006CFF' }} />
              <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: '#006CFF', fontWeight: 'bold' }}>
                LIVE TELEMETRY
              </span>
            </div>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: '#B7BCC8', letterSpacing: '0.15em' }}>
              <div>MODE: SPORT+</div>
              <div>DRIVE: M xDRIVE</div>
              <div>GPS: LOCKED</div>
            </div>
          </div>

          {/* TOP CENTER: CINEMATIC WORD FADE-IN */}
          <div style={{
            position: 'absolute',
            top: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            width: '90%',
            maxWidth: '650px',
            // Soft radial backdrop vignette to darken busy backgrounds and isolate the title text
            background: 'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 70%)',
            padding: '1.8rem 2.8rem',
            borderRadius: '40px'
          }}>
            {/* Huge M4 Blurred Backdrop */}
            <div style={{ position: 'absolute', top: '0.2rem', fontSize: '6rem', fontWeight: '900', color: '#ffffff', opacity: 0.05, filter: 'blur(5px)', letterSpacing: '0.05em', zIndex: -1, userSelect: 'none' }}>
              M4
            </div>
            <h1 style={{ fontFamily: '"Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif', fontWeight: '700', fontSize: '3rem', letterSpacing: '0.2em', color: '#ffffff', margin: 0, textTransform: 'uppercase', lineHeight: '1.1', textShadow: '0 4px 20px rgba(0, 0, 0, 0.95), 0 2px 4px rgba(0, 0, 0, 0.95)' }}>
              BMW M4
            </h1>
            <h2 style={{ fontFamily: '"Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif', fontWeight: '700', fontSize: '1.3rem', letterSpacing: '0.25em', color: '#ffffff', margin: '0.3rem 0 0.6rem 0', textTransform: 'uppercase', textShadow: '0 4px 16px rgba(0, 0, 0, 0.95)' }}>
              COMPETITION
            </h2>
            <div style={{ fontSize: '0.78rem', fontFamily: '"Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif', letterSpacing: '0.15em', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold', textTransform: 'uppercase', textShadow: '0 2px 10px rgba(0, 0, 0, 1)' }}>
              The Ultimate Driving Machine
            </div>
          </div>

          {/* TOP RIGHT: NUMERICAL TELEMETRY BOARD */}
          <div 
            className="sec4-telemetry-right luxury-glass-panel"
            style={{
              position: 'absolute',
              top: '3rem',
              right: 'var(--hud-side-margin)',
              padding: '1.4rem 1.8rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              minWidth: '220px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.45rem', color: '#B7BCC8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>POWER</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '300', color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                {power} <span style={{ fontSize: '0.65rem', color: '#B7BCC8' }}>HP</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.45rem', color: '#B7BCC8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>TORQUE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '300', color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                {torque} <span style={{ fontSize: '0.65rem', color: '#B7BCC8' }}>Nm</span>
              </div>
            </div>
            <div className="telemetry-divider-line" style={{ gridColumn: 'span 2', height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <div>
              <div style={{ fontSize: '0.45rem', color: '#B7BCC8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>0–100</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '300', color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                {zeroHundred} <span style={{ fontSize: '0.65rem', color: '#B7BCC8' }}>s</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.45rem', color: '#B7BCC8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>TOP SPEED</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '300', color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                {topSpeed} <span style={{ fontSize: '0.65rem', color: '#B7BCC8' }}>km/h</span>
              </div>
            </div>
          </div>

          {/* BOTTOM LEFT: ONBOARD DIAGNOSTICS */}
          <div 
            className="sec4-diagnostics-left luxury-glass-panel"
            style={{
              position: 'absolute',
              bottom: '3rem',
              left: 'var(--hud-side-margin)',
              padding: '1.4rem 1.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              minWidth: '200px'
            }}
          >
            <div style={{ fontSize: '#006CFF', fontFamily: 'var(--font-mono)', color: '#006CFF', letterSpacing: '0.15em', fontWeight: 'bold' }}>
              // VEHICLE DIAGNOSTICS
            </div>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: '0.2rem' }} />
            {[
              { label: 'DRIVING MODE', val: 'SPORT+' },
              { label: 'SURFACE', val: 'Dry Asphalt' },
              { label: 'SUSPENSION', val: 'Adaptive M' },
              { label: 'GRIP', val: '98%' },
              { label: 'ENGINE', val: 'Ready', highlight: true }
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                <span style={{ color: '#B7BCC8' }}>{item.label}</span>
                <span style={{ color: item.highlight ? '#006CFF' : '#ffffff', fontWeight: 'bold' }}>{item.val}</span>
              </div>
            ))}
          </div>

          {/* BOTTOM CENTER: FILLING SCROLL BAR */}
          <div style={{
            position: 'absolute',
            bottom: '3.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
            minWidth: '180px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.5rem', letterSpacing: '0.3em', color: '#B7BCC8', fontFamily: 'var(--font-mono)' }}>
              <span>SCROLL</span>
              <span>↓</span>
              <span>DISCOVER</span>
            </div>
            <div style={{ width: '120px', height: '2px', backgroundColor: 'rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
              <div 
                ref={scrollLineProgressRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '0%',
                  backgroundColor: '#006CFF',
                  transition: 'width 0.1s ease'
                }}
              />
            </div>
          </div>

          {/* BOTTOM RIGHT: FLOATING CONFIGURE BUTTON KEYS */}
          <div 
            className="sec4-configure-right"
            style={{
              position: 'absolute',
              bottom: '3.5rem',
              right: 'var(--hud-side-margin)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              pointerEvents: 'auto'
            }}
          >
            {[
              { label: 'Configure', icon: '↓' },
              { label: 'Watch Film', icon: '↓' },
              { label: 'Explore Specs', icon: '→' }
            ].map((btn) => (
              <button
                key={btn.label}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = '#006CFF';
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 87, 255, 0.4), 0 10px 30px rgba(0,0,0,0.3)';
                  handleMouseEnter();
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(0, 87, 255, 0.25)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 87, 255, 0.08), 0 10px 30px rgba(0,0,0,0.2)';
                  handleMouseLeave();
                }}
                style={{
                  background: 'rgba(255,255,255,0.075)',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                  border: '1px solid rgba(0, 87, 255, 0.25)',
                  borderRadius: '12px',
                  padding: '0.8rem 1.6rem',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  boxShadow: '0 0 15px rgba(0, 87, 255, 0.08), 0 10px 30px rgba(0,0,0,0.2)',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  minWidth: '160px'
                }}
              >
                <span>{btn.label}</span>
                <span style={{ color: '#006CFF', fontWeight: 'bold' }}>{btn.icon}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: WORLD-CLASS CINEMATIC DRIVING EXPERIENCE (Only reveals at bridge stop frame 602) */}
      {isLoaded && (
        <div
          ref={sec5TitleRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 88,
            pointerEvents: 'none',
            opacity: 0,
            fontFamily: "'Inter', sans-serif",
            transition: 'opacity 0.4s ease'
          }}
        >
          {/* TOP CENTER: CINEMATIC HEADING */}
          <div style={{
            position: 'absolute',
            top: '3.2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            width: '90%',
            maxWidth: '650px',
            // Soft radial shadow mask to darken complex bridge details and make text stand out sharply
            background: 'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 70%)',
            padding: '2rem 3rem',
            borderRadius: '50px'
          }}>
            {/* Huge Motion Backdrop */}
            <div style={{ position: 'absolute', top: '0.5rem', fontSize: '6rem', fontWeight: '900', color: '#ffffff', opacity: 0.04, filter: 'blur(4px)', letterSpacing: '0.08em', zIndex: -1, userSelect: 'none' }}>
              MOTION
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: '2.4rem', letterSpacing: '0.25em', color: '#ffffff', margin: 0, textTransform: 'uppercase', lineHeight: '1.2', textShadow: '0 4px 20px rgba(0, 0, 0, 0.95), 0 2px 4px rgba(0, 0, 0, 0.95)' }}>
              ENGINEERED<br />FOR EVERY ROAD
            </h1>
            <div style={{ 
              fontSize: '0.85rem', 
              fontFamily: 'var(--font-display)', 
              letterSpacing: '0.15em', 
              color: '#ffffff', 
              textTransform: 'uppercase', 
              marginTop: '0.9rem', 
              maxWidth: '520px', 
              lineHeight: '1.6', 
              fontWeight: '500', 
              textShadow: '0 2px 14px rgba(0, 0, 0, 1), 0 4px 30px rgba(0, 0, 0, 1), 0 1px 2px rgba(0, 0, 0, 1)' 
            }}>
              Precision engineered to deliver unmatched performance in every condition.
            </div>
          </div>

          {/* TOP LEFT: ACTIVE CHASSIS TELEMETRY */}
          <div 
            className="luxury-glass-panel"
            style={{
              position: 'absolute',
              top: '3.5rem',
              left: 'var(--hud-side-margin)',
              padding: '1.4rem 1.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
              minWidth: '200px',
              boxSizing: 'border-box',
              pointerEvents: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="pulsing-dot-blue" style={{ width: '6px', height: '6px', backgroundColor: '#006CFF', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #006CFF' }} />
              <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: '#006CFF', fontWeight: 'bold' }}>
                ACTIVE HANDLING // SEC_05
              </span>
            </div>
            
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
            
            {/* Dynamic Suspension stroke indicator bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { wheel: 'FL DAMPING', value: 68 },
                { wheel: 'FR DAMPING', value: 55 },
                { wheel: 'RL DAMPING', value: 42 },
                { wheel: 'RR DAMPING', value: 38 }
              ].map((w) => (
                <div key={w.wheel} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.45rem', fontFamily: 'var(--font-mono)', color: '#B7BCC8' }}>
                    <span>{w.wheel}</span>
                    <span style={{ color: '#ffffff' }}>{w.value}%</span>
                  </div>
                  <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${w.value}%`, height: '100%', backgroundColor: '#006CFF', boxShadow: '0 0 8px #006CFF', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP RIGHT: TELEMETRY PILLS */}
          <div 
            className="sec5-telemetry-right"
            style={{
              position: 'absolute',
              top: '3.5rem',
              right: 'var(--hud-side-margin)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}
          >
            {[
              { label: 'POWER', val: `${bridgePower} HP` },
              { label: 'TORQUE', val: `${bridgeTorque} Nm` },
              { label: '0-100', val: `${bridgeZeroHundred} s` },
              { label: 'TOP SPEED', val: `${bridgeTopSpeed} km/h` }
            ].map((pill) => (
              <div 
                key={pill.label}
                className="luxury-pill-panel"
                style={{
                  padding: '0.7rem 1.6rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '3rem',
                  minWidth: '220px',
                  boxSizing: 'border-box'
                }}
              >
                <span style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', color: '#B7BCC8', letterSpacing: '0.15em', fontWeight: 'bold' }}>{pill.label}</span>
                <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)', color: '#ffffff', fontWeight: '300', letterSpacing: '0.04em', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{pill.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: PREMIUM BOOK YOUR TEST DRIVE (Only reveals at sunset mountain stop frame 712) */}
      {isLoaded && (
        <div
          ref={sec6TitleRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 88,
            pointerEvents: 'none',
            opacity: 0,
            fontFamily: "'Inter', sans-serif",
            transition: 'opacity 0.4s ease'
          }}
        >
          {/* CENTER: Big cinematic floating text — no background card */}
          <div style={{
            position: 'absolute',
            top: '28%',
            left: '50%',
            transform: 'translate3d(-50%, -50%, 0)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.2rem',
            pointerEvents: 'none'
          }}>
            {/* Mono tag */}
            <span style={{ 
              fontSize: '0.6rem', 
              fontFamily: 'var(--font-mono)', 
              letterSpacing: '0.3em', 
              color: '#006CFF', 
              fontWeight: 'bold',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.9)'
            }}>
              // EXPERIENCE THE M4
            </span>

            {/* Hero heading — massive, text-shadow only for readability */}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '900',
              fontSize: '4.5rem',
              letterSpacing: '-2px',
              margin: 0,
              color: '#ffffff',
              lineHeight: '0.95',
              textShadow: '0 4px 30px rgba(0, 0, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.9)'
            }}>
              BOOK YOUR
            </h1>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: '900',
              fontSize: '4.5rem',
              letterSpacing: '-2px',
              margin: '-0.6rem 0 0 0',
              background: 'linear-gradient(135deg, #006CFF, #00B4FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: '0.95',
              filter: 'drop-shadow(0 4px 20px rgba(0, 108, 255, 0.4))'
            }}>
              TEST DRIVE
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.95)',
              lineHeight: '1.6',
              margin: 0,
              maxWidth: '440px',
              fontWeight: '400',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.95)'
            }}>
              Feel the raw power of 620 HP TwinPower Turbo inline-six and M xDrive on the open road.
            </p>



            {/* CTA pill button */}
            <a
              href="https://www.bmw-kunexclusive-bengaluru.in/test-drive"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 108, 255, 0.6), 0 15px 40px rgba(0, 0, 0, 0.4)';
                handleMouseEnter();
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 108, 255, 0.35), 0 10px 30px rgba(0, 0, 0, 0.3)';
                handleMouseLeave();
              }}
              style={{
                marginTop: '0.6rem',
                padding: '0.65rem 1.8rem',
                background: 'linear-gradient(135deg, #006CFF, #0050CC)',
                border: 'none',
                borderRadius: '100px',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 25px rgba(0, 108, 255, 0.35), 0 10px 30px rgba(0, 0, 0, 0.3)',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}
            >
              <span>RESERVE YOUR DRIVE</span>
              <span style={{ fontSize: '0.8rem' }}>→</span>
            </a>
          </div>


        </div>
      )}

      {/* SECTION 7: END ATTRIBUTION — Center kept clear for BMW logo in image */}
      {isLoaded && (
        <div
          ref={sec7AttributionRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 88,
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.6s ease'
          }}
        >
          {/* Pulsing center background glow behind BMW logo */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '520px',
            height: '520px',
            background: 'radial-gradient(circle, rgba(0, 108, 255, 0.18) 0%, rgba(0, 87, 255, 0.06) 50%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(30px)',
            animation: 'logoPulseGlow 5s ease-in-out infinite alternate'
          }} />

          {/* ═══ CORNER BRACKETS & HUD PANEL WIDGETS — cinematic wow framing ═══ */}
          {/* Top-left */}
          <div style={{
            position: 'absolute', top: '2.5rem', left: '2.5rem',
            paddingLeft: '1rem', paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            borderLeft: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', flexDirection: 'column', gap: '0.2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="telemetry-dot-blink" style={{ width: '4px', height: '4px', backgroundColor: '#006CFF', borderRadius: '50%', boxShadow: '0 0 6px #006CFF' }} />
              <span style={{ fontSize: '0.45rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: '#006CFF', fontWeight: 'bold' }}>
                SYS_STATUS // SEC_07
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.04em' }}>
              M4 COMPETITION
            </span>
            <span style={{ fontSize: '0.45rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
              LOC_ID // MUNICH_DE
            </span>
          </div>

          {/* Top-right */}
          <div style={{
            position: 'absolute', top: '2.5rem', right: '2.5rem',
            paddingRight: '1rem', paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            borderRight: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem'
          }}>
            <span style={{ fontSize: '0.45rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)' }}>
              CORE_REFRESH
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', color: '#ffffff', fontWeight: 'bold' }}>
                120.0
              </span>
              <span style={{ fontSize: '0.45rem', fontFamily: 'var(--font-mono)', color: '#006CFF' }}>
                HZ
              </span>
            </div>
            <span style={{ fontSize: '0.45rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
              DIAGNOSTIC // ACTIVE
            </span>
          </div>

          {/* Bottom-left */}
          <div style={{
            position: 'absolute', bottom: '2.5rem', left: '2.5rem',
            width: '35px', height: '35px',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            borderLeft: '1px solid rgba(255,255,255,0.12)'
          }} />

          {/* Bottom-right */}
          <div style={{
            position: 'absolute', bottom: '2.5rem', right: '2.5rem',
            paddingRight: '1rem', paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            borderRight: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem'
          }}>
            <span style={{ fontSize: '0.45rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)' }}>
              BUILD_REVISION
            </span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', color: '#ffffff', fontWeight: 'bold' }}>
              v2.0.6
            </span>
            <span style={{ fontSize: '0.45rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
              SESSION // OK
            </span>
          </div>

          {/* ═══ LEFT EDGE — vertical accent line + text ═══ */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '2.5rem',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.6rem',
            opacity: 0.5
          }}>
            <div style={{
              width: '1px', height: '60px',
              background: 'linear-gradient(to bottom, transparent, rgba(0, 108, 255, 0.5), transparent)'
            }} />
            <span style={{
              fontSize: '0.4rem', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)',
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              writingMode: 'vertical-lr', transform: 'rotate(180deg)'
            }}>
              BMW M POWER
            </span>
          </div>

          {/* ═══ RIGHT EDGE — vertical accent line + text ═══ */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '2.5rem',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.6rem',
            opacity: 0.5
          }}>
            <div style={{
              width: '1px', height: '60px',
              background: 'linear-gradient(to bottom, transparent, rgba(0, 108, 255, 0.5), transparent)'
            }} />
            <span style={{
              fontSize: '0.4rem', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)',
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              writingMode: 'vertical-lr'
            }}>
              EST. 1916 — MÜNCHEN
            </span>
          </div>

          {/* ═══ TOP CREDITS — pinned to top ═══ */}
          <div style={{
            position: 'absolute',
            top: '2.2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.6rem',
            pointerEvents: 'none',
            width: '90%',
            maxWidth: '580px'
          }}>
            {/* Name block */}
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <span style={{
                fontSize: '0.58rem',
                fontFamily: '"Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif',
                letterSpacing: '0.45em',
                color: '#ffffff',
                fontWeight: '700',
                textShadow: '0 2px 12px rgba(0, 0, 0, 1), 0 1px 3px rgba(0, 0, 0, 1)'
              }}>
                DESIGNED & ENGINEERED BY
              </span>
              <span style={{
                fontSize: '2.8rem',
                fontFamily: '"Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif',
                fontWeight: '700',
                letterSpacing: '0.3em',
                color: '#ffffff',
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.75), 0 2px 4px rgba(0, 0, 0, 0.95)',
                lineHeight: 1.1,
                margin: '0.3rem 0'
              }}>
                RAKSHAK
              </span>
            </div>

            {/* Separator line with white dot */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              width: '100%',
              maxWidth: '320px',
              margin: '0.2rem 0'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2))' }} />
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.7)'
              }} />
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.2), transparent)' }} />
            </div>

            {/* Social pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              pointerEvents: 'auto',
              marginTop: '0.4rem'
            }}>
              <a
                href="mailto:rakshakpatel2005@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #007cff, #005ce6)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 108, 255, 0.4)';
                  handleMouseEnter();
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #006CFF, #0050CC)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 108, 255, 0.25)';
                  handleMouseLeave();
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  background: 'linear-gradient(135deg, #006CFF, #0050CC)',
                  border: 'none',
                  borderRadius: '100px', padding: '0.6rem 1.4rem',
                  textDecoration: 'none', cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 6px 20px rgba(0, 108, 255, 0.25)'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>✉</span>
                <span style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: '#ffffff', fontWeight: 'bold' }}>
                  rakshakpatel2005@gmail.com
                </span>
              </a>

              <span style={{
                width: '4px', height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                transform: 'rotate(45deg)'
              }} />

              <a
                href="https://github.com/rakshak2005"
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = '#f0f0f0';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 255, 255, 0.25)';
                  handleMouseEnter();
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.15)';
                  handleMouseLeave();
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '100px', padding: '0.6rem 1.4rem',
                  textDecoration: 'none', cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 6px 20px rgba(255, 255, 255, 0.15)'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#000000' }}>⌘</span>
                <span style={{ fontSize: '0.52rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: '#000000', fontWeight: 'bold' }}>
                  github.com/rakshak2005
                </span>
              </a>
            </div>
          </div>

          {/* Copyright micro-text — positioned at the absolute bottom of the screen below the timeline */}
          <span style={{
            position: 'absolute',
            bottom: '1.2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.4rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.3)',
            textShadow: '0 2px 6px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}>
            © 2026 BMW M4 COMPETITION — CONCEPT EXPERIENCE
          </span>
        </div>
      )}

      {/* CANVAS IMAGE STREAMING VIEWPORT */}
      <div 
        ref={scrollContainerRef} 
        style={{ height: '1400vh', position: 'relative' }}
      >
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#05070A',
          zIndex: 1
        }}>
          <canvas 
            ref={canvasRef} 
            style={{ 
              display: 'block', 
              width: '100%', 
              height: '100%',
              objectFit: 'cover'
            }} 
          />
        </div>
      </div>

      {/* Floating animation keyframe */}
      <style>{`
        @keyframes floatingAnimation {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
