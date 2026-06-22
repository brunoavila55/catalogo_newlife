import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Home as HomeIcon, Building2, Cable, Server } from 'lucide-react';
import { api } from '../services/api';

gsap.registerPlugin(ScrollTrigger);


// ─── Partículas Interconectadas (Canvas) ───
const ParticleBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: {x: number, y: number, vx: number, vy: number, radius: number}[] = [];
    let animationFrameId: number;
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      if (!containerRef.current) return;
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 0.5
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const onMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    resize();

    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      const currentlyVisible = entries[0].isIntersecting;
      if (currentlyVisible && !isVisible) {
        isVisible = true;
        draw(); // resume
      } else {
        isVisible = currentlyVisible;
      }
    }, { threshold: 0 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const draw = () => {
      if (!isVisible) return; // Pause animation loop

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const connectionDistance = 150;
      const mouseDistance = 200;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const dxMouse = mouse.x - p.x;
        const dyMouse = mouse.y - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distMouse < mouseDistance) {
           const force = (mouseDistance - distMouse) / mouseDistance;
           p.x -= (dxMouse / distMouse) * force * 1.5;
           p.y -= (dyMouse / distMouse) * force * 1.5;
           
           ctx.beginPath();
           ctx.strokeStyle = `rgba(37, 99, 235, ${force * 0.4})`;
           ctx.lineWidth = 1;
           ctx.moveTo(p.x, p.y);
           ctx.lineTo(mouse.x, mouse.y);
           ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.6)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            const opacity = 1 - (dist / connectionDistance);
            ctx.strokeStyle = `rgba(37, 99, 235, ${opacity * 0.25})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

// ─── Logo com Rastro (CSS Mask) ───
const HeroLogo = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const points = useRef<{x: number, y: number, life: number}[]>([]);

  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      
      points.current.forEach(p => {
        p.life -= 0.025; 
      });
      points.current = points.current.filter(p => p.life > 0);

      if (!imageRef.current) return;

      if (points.current.length === 0) {
        imageRef.current.style.maskImage = 'none';
        imageRef.current.style.WebkitMaskImage = 'none';
        imageRef.current.style.opacity = '0';
        return;
      }

      imageRef.current.style.opacity = '1';

      const gradients = points.current.map(p => {
        const radius = 80 * Math.max(0, p.life);
        return `radial-gradient(circle ${radius}px at ${p.x}px ${p.y}px, black 0%, black 99%, transparent 100%)`;
      });
      
      const maskStr = gradients.join(', ');
      
      imageRef.current.style.maskImage = maskStr;
      imageRef.current.style.WebkitMaskImage = maskStr;
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const lastPoint = points.current.length > 0 ? points.current[points.current.length - 1] : null;
    if (lastPoint) {
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.floor(dist / 15);
      
      for (let i = 1; i <= steps; i++) {
        points.current.push({
          x: lastPoint.x + (dx * i) / steps,
          y: lastPoint.y + (dy * i) / steps,
          life: 1.0
        });
      }
    }
    
    points.current.push({ x, y, life: 1.0 });
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 cursor-default z-0"
      onMouseMove={handleMouseMove}
    >
      <img 
        src="/logo-front.svg" 
        alt="Logo NLF Front" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none p-12 md:p-32"
      />
      <img 
        ref={imageRef}
        src="/logo-back.svg" 
        alt="Logo NLF Back" 
        className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(37,99,235,0.8)] pointer-events-none p-12 md:p-32"
        style={{ opacity: 0, transition: 'opacity 0.1s' }}
      />
    </div>
  );
};


// ─── Product Card Premium ───
import { getProductMainImage, getProductSecondImage } from '../utils/image';

const ProductCard = ({ product, index }: { product: any, index: number }) => {
  const mainImg = getProductMainImage(product);
  const secondImg = getProductSecondImage(product);
  const hasImage = Boolean(mainImg);
  const hasSecondImage = Boolean(secondImg);

  return (
    <Link 
      to={`/produto/${product.slug}`}
      className="group relative rounded-2xl overflow-hidden bg-surface border border-slate-800/60 hover:border-brand/50 transition-all duration-500 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image area */}
      <div className="aspect-[4/3] bg-surface-dark relative overflow-hidden">
        {hasImage ? (
          <>
            <img 
              src={mainImg} 
              alt={product.name} 
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain p-4 transition-all duration-700 group-hover:scale-105"
            />
            {hasSecondImage && (
              <img 
                src={secondImg} 
                alt={`${product.name} verso`} 
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-contain p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Zap size={32} className="text-slate-700" />
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          {product.status === 'Em estoque' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 backdrop-blur-sm border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Disponível
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 backdrop-blur-sm border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              Em falta
            </span>
          )}
        </div>

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* Content */}
      <div className="p-5">
        <span className="text-[11px] text-brand font-bold uppercase tracking-[0.15em] block mb-1.5">{product.category}</span>
        <h3 className="text-lg text-white font-condensed group-hover:text-brand transition-colors duration-300">{product.name}</h3>
        {product.brand && (
          <p className="text-slate-500 text-sm mt-1">{product.brand}</p>
        )}
        
        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {product.tags.slice(0, 3).map((t: string) => (
              <span key={t} className="px-2 py-0.5 bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-400 rounded-md border border-slate-700/50">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </Link>
  );
};


// ─── Home Page ───
export default function Home() {
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const categories = [
    { name: 'Residencial', icon: HomeIcon, desc: 'Equipamentos para casa e pequenos negócios' },
    { name: 'Empresarial', icon: Building2, desc: 'Soluções robustas para médias e grandes empresas' },
    { name: 'FTTH', icon: Cable, desc: 'Infraestrutura de fibra óptica de ponta a ponta' },
    { name: 'Datacenter', icon: Server, desc: 'Alta performance para servidores e provedores' }
  ];

  useEffect(() => {

    let ctx = gsap.matchMedia();

    ctx.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(heroContentRef.current, {
        scale: 0.85,
        opacity: 0.3,
        borderRadius: "48px",
        ease: "none",
        scrollTrigger: {
          trigger: heroContainerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="font-sans flex flex-col min-h-screen">
      {/* Hero scroll spacer */}
      <div ref={heroContainerRef} className="relative h-screen z-0">
        <section 
          ref={heroContentRef} 
          className="fixed top-0 left-0 w-full h-screen flex items-center justify-center overflow-hidden bg-surface-dark origin-center"
        >
          <ParticleBackground />
          <HeroLogo />
          
          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 animate-bounce z-10">
            <span className="text-xs uppercase tracking-widest font-semibold">Scroll</span>
            <div className="w-5 h-8 rounded-full border-2 border-slate-600 flex items-start justify-center p-1">
              <div className="w-1 h-2 rounded-full bg-slate-500 animate-pulse"></div>
            </div>
          </div>
        </section>
      </div>


      {/* Catalog Section — slides over the hero */}
      <section className="relative z-10 bg-surface-dark rounded-t-[3rem] border-t border-slate-800/60 flex-grow flex flex-col min-h-[80vh] shadow-[0_-30px_60px_rgba(0,0,0,0.7)]">
        
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-24 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="container mx-auto px-6 py-20">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 gap-4">
            <div>
              <span className="text-brand text-xs font-bold uppercase tracking-[0.2em] block mb-3">Nosso portfólio</span>
              <h2 className="text-4xl md:text-5xl text-white font-condensed">Principais Segmentos</h2>
            </div>
            <Link 
              to="/catalogo" 
              className="group flex items-center gap-2 text-brand hover:text-brand-light font-bold uppercase tracking-wider text-sm transition-colors"
            >
              Ver catálogo completo 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                to={`/catalogo?categoria=${cat.name}`}
                className="group relative rounded-2xl overflow-hidden bg-surface border border-slate-800/60 hover:border-brand/50 transition-all duration-500 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1 p-8 flex flex-col items-center text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-brand mb-6 group-hover:scale-110 group-hover:bg-brand/10 transition-all duration-500">
                  <cat.icon size={32} />
                </div>
                <h3 className="text-xl text-white font-condensed group-hover:text-brand transition-colors duration-300 mb-3">{cat.name}</h3>
                <p className="text-slate-400 text-sm">{cat.desc}</p>
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
            ))}
          </div>

          {/* CTA Monte seu Projeto */}
          <div className="mt-20 border border-slate-800/60 bg-surface rounded-3xl p-10 md:p-14 text-center relative overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-3xl pointer-events-none scale-0 group-hover:scale-100 transition-transform duration-1000 ease-out"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h3 className="text-4xl md:text-5xl text-white font-condensed mb-10">Monte seu Projeto</h3>
              
              <Link
                to="/projetos"
                className="inline-flex items-center justify-center gap-3 bg-brand text-white font-bold uppercase tracking-widest px-8 py-5 rounded-2xl hover:bg-brand-dark transition-all duration-300 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:-translate-y-1 w-full sm:w-auto text-sm md:text-base"
              >
                Projetos
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
