import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, animate, useInView } from 'framer-motion';
import { 
  Calculator, 
  ArrowRight, 
  BookOpen, 
  Cpu, 
  Network, 
  Video, 
  Mail, 
  HeartHandshake,
  Users,
  Award,
  Zap,
  Star
} from 'lucide-react';
const AnimatedCounter = ({ target, suffix }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      animate(0, target, {
        duration: 3.5, 
        ease: "easeOut",
        onUpdate: (value) => {
          if (ref.current) {
            ref.current.textContent = Math.floor(value) + suffix;
          }
        }
      });
    }
  }, [isInView, target, suffix]);

  return <span ref={ref}>0{suffix}</span>;
};

const HomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Animation configurations
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-300 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Navbar - Glassmorphic Dark */}
      <nav className="fixed w-full z-50 top-0 bg-[#070B14]/90 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl shadow-black/50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-20">
      
      {/* Logo */}
      <motion.a href="/" whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
        <img src="/mathcom-logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg" />
        <span className="font-extrabold text-2xl tracking-tight text-white">MathCom <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Mentors</span></span>
      </motion.a>
      
      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-8 font-medium">
        <a href="#about" className="text-slate-400 hover:text-white transition-colors">Mission</a>
        <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
        <a href="#subjects" className="text-slate-400 hover:text-white transition-colors">Curriculum</a>
        <Link to="/login" className="bg-indigo-600 text-white px-7 py-2.5 rounded-full font-bold hover:bg-indigo-500 transition-colors">Portal Login</Link>
      </div>

      {/* Mobile Hamburger Button */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white focus:outline-none">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
    </div>
  </div>

  {/* Mobile Dropdown Menu */}
  {isMobileMenuOpen && (
    <div className="md:hidden bg-[#070B14] border-b border-slate-800 absolute w-full left-0 top-20 shadow-2xl">
      <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
        <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-300 font-medium p-2 block hover:bg-slate-800 rounded">Mission</a>
        <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-300 font-medium p-2 block hover:bg-slate-800 rounded">Features</a>
        <a href="#subjects" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-300 font-medium p-2 block hover:bg-slate-800 rounded">Curriculum</a>
        <Link to="/login" className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-center mt-4 w-full block">Portal Login</Link>
      </div>
    </div>
  )}
</nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 flex items-center justify-center min-h-screen">
        {/* Deep Space Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-[150px] -z-10 mix-blend-screen"></div>

        <motion.div 
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/80 border border-slate-700/50 text-indigo-300 text-sm font-semibold mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Dr. Vikas Goyal's Official Learning Portal
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight text-white">
            Engineer Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">Future</span> <br/>
            With Precision.
          </motion.h1>
          
          <motion.p variants={fadeUp} className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed">
            Master the core concepts of Engineering Mathematics, Discrete Mathematics, and advanced B.Tech CSE subjects. High-quality education, completely free for those who need it most.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <motion.a 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              href="https://www.youtube.com/@MathComMentors" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-indigo-500 hover:to-violet-500 transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)]"
            >
              <Video className="w-5 h-5" />
              Start Learning Now
            </motion.a>
            
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.05, y: -2, backgroundColor: 'rgba(30, 41, 59, 1)' }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg text-white bg-slate-900/50 border border-slate-700 backdrop-blur-sm transition-all"
              >
                Access Student Portal <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* NEW: Statistics / Impact Section */}
      <div className="py-16 bg-[#0A0F1C] border-y border-slate-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800/50"
          >
            {[
              { target: 140, suffix: "K+", label: "Active Students" },
              { target: 350, suffix: "+", label: "Free Lectures" },
              { target: 5, suffix: "+", label: "Core Subjects" },
              { target: 100, suffix: "%", label: "Free Access" }
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center px-4">
                <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </h3>
                <p className="text-indigo-400 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* NEW: Why Choose Us Section */}
      <div id="features" className="py-24 relative bg-[#070B14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">The MathCom Advantage</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">We don't just teach formulas; we build the logical foundation required for top-tier software engineering.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Concept Clarity", desc: "Complex mathematical proofs broken down into simple, digestible logical steps.", color: "text-amber-400", bg: "bg-amber-400/10", border: "hover:border-amber-500/50" },
              { icon: Award, title: "Exam Focused", desc: "Targeted preparation for sessionals and semester exams to ensure maximum scoring potential.", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "hover:border-emerald-500/50" },
              { icon: Users, title: "Community Driven", desc: "Built for students who cannot afford expensive coaching, driven by community support and engagement.", color: "text-blue-400", bg: "bg-blue-400/10", border: "hover:border-blue-500/50" }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -5 }}
                className={`bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 transition-all ${feature.border}`}
              >
                <div className={`${feature.bg} w-14 h-14 rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section (Enhanced Dark) */}
      <div id="about" className="py-24 bg-[#0A0F1C] relative overflow-hidden">
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto bg-slate-900/80 backdrop-blur-md p-10 md:p-16 rounded-3xl border border-slate-700/50 shadow-2xl shadow-indigo-900/20 relative"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0A0F1C] p-4 rounded-full border border-slate-700/50">
              <HeartHandshake className="w-10 h-10 text-indigo-400" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-8 mt-4">Our Core Mission</h2>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed italic font-light">
              "These Online Classes are started especially for those students who can't come for classes or tuitions & for those who can't afford to go to coaching Classes. All I need is your Support & engagement with us. So I can help you more achieving best in your sessionals & semester exams."
            </p>
            <div className="mt-10 inline-flex items-center gap-4">
              <div className="h-[1px] w-12 bg-indigo-500/50"></div>
              <p className="text-indigo-400 font-bold text-lg tracking-wide uppercase">Dr. Vikas Goyal</p>
              <div className="h-[1px] w-12 bg-indigo-500/50"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Subjects Section (Glassmorphic Dark Cards) */}
      <div id="subjects" className="py-32 relative bg-[#070B14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Master the Curriculum</h2>
            <p className="text-xl text-slate-400">Comprehensive coverage of crucial B.Tech CSE subjects.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: Calculator, title: "Engineering Math", desc: "Deep dives into the foundational mathematics required for advanced engineering concepts.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "hover:border-indigo-500/50" },
              { icon: BookOpen, title: "Discrete Math", desc: "Essential logic, set theory, and statistical modeling for computer science students.", color: "text-violet-400", bg: "bg-violet-500/10", border: "hover:border-violet-500/50" },
              { icon: Cpu, title: "Automata Theory", desc: "Master the theory of computation, finite automata, and formal languages.", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "hover:border-cyan-500/50" },
              { icon: Network, title: "Data Structures", desc: "Build efficient algorithms and understand core data structures for problem-solving.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "hover:border-emerald-500/50" },
            ].map((subject, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -10 }}
                className={`bg-slate-900/40 backdrop-blur-sm p-8 rounded-3xl border border-slate-800 transition-all cursor-default ${subject.border}`}
              >
                <div className={`${subject.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                  <subject.icon className={`w-8 h-8 ${subject.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{subject.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{subject.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Footer - Deep Space Dark */}
      <footer className="bg-[#04070D] pt-20 pb-10 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Brand Column */}
            <div className="md:col-span-5 lg:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src="/mathcom-logo.png" 
                  alt="MathCom Mentors Logo" 
                  className="w-10 h-10 object-contain rounded-lg shadow-sm"
                />
                <span className="font-extrabold text-2xl text-white">MathCom Mentors</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                Empowering B.Tech CSE students with high-quality, accessible education in Mathematics and Computer Science.
              </p>
              <motion.div whileHover={{ x: 5 }} className="flex items-center gap-2 text-slate-300 w-max">
                <Mail className="w-5 h-5 text-indigo-400" />
                <a href="mailto:mathcommentors@gmail.com" className="hover:text-white transition-colors font-medium">
                  mathcommentors@gmail.com
                </a>
              </motion.div>
            </div>

            <div className="md:col-span-2 lg:col-span-4"></div>

            {/* Social Links with Pure SVGs */}
            <div className="md:col-span-5 lg:col-span-4">
              <h3 className="text-white font-extrabold text-lg mb-6">Connect With Us</h3>
              <div className="flex flex-col gap-4 w-max">
                <motion.a 
                  whileHover={{ x: 5, color: '#1877F2' }}
                  href="https://facebook.com/MathComMentors" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-400 flex items-center gap-3 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                  Facebook
                </motion.a>
                
                <motion.a 
                  whileHover={{ x: 5, color: '#0A66C2' }}
                  href="https://linkedin.com/in/mathcom-mentors-6b8a94188" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-400 flex items-center gap-3 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                  LinkedIn
                </motion.a>
                
                <motion.a 
                  whileHover={{ x: 5, color: '#ffffff' }}
                  href="https://twitter.com/mathcom_mentors" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-400 flex items-center gap-3 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 4.25H5.078z" /></svg>
                  Twitter (X)
                </motion.a>
                
                <motion.a 
                  whileHover={{ x: 5, color: '#E4405F' }}
                  href="https://instagram.com/mathcommentors" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-400 flex items-center gap-3 font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                  Instagram
                </motion.a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm font-medium">
              © {new Date().getFullYear()} MathCom Mentors by Dr. Vikas Goyal. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500 font-medium">
              <motion.a whileHover={{ color: '#ffffff' }} href="/login" className="transition-colors">Portal Login</motion.a>
              <motion.a whileHover={{ color: '#ffffff' }} href="https://www.youtube.com/@MathComMentors" target="_blank" rel="noreferrer" className="transition-colors">YouTube</motion.a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;