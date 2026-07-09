import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, animate, useInView, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
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
  Star,
  Moon,
  Sun,
  ChevronUp,
  Plus,
  Minus,
  GraduationCap,
  PlayCircle,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const MagneticElement = ({ children, className }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const TextReveal = ({ text, className, isDark }) => {
  const words = text.split(" ");
  return (
    <motion.h2 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className={`flex flex-wrap gap-x-2 justify-center ${className} ${isDark ? 'text-white' : 'text-slate-900'}`}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={{
          hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: "easeOut" } }
        }}>
          {word}
        </motion.span>
      ))}
    </motion.h2>
  );
};

const Typewriter = ({ words }) => {
  const [currentWord, setCurrentWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    let timer = setTimeout(() => {
      const i = loopNum % words.length;
      const fullText = words[i];

      setCurrentWord(isDeleting ? fullText.substring(0, currentWord.length - 1) : fullText.substring(0, currentWord.length + 1));
      setTypingSpeed(isDeleting ? 50 : 150);

      if (!isDeleting && currentWord === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && currentWord === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    }, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentWord, isDeleting, loopNum, words, typingSpeed]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 inline-block min-w-[3ch]">
      {currentWord}
      <span className="animate-pulse text-indigo-400">|</span>
    </span>
  );
};

const AnimatedCounter = ({ target, suffix, isDark }) => {
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

  return <span ref={ref} className={isDark ? "text-white" : "text-slate-900"}>0{suffix}</span>;
};

const FAQItem = ({ q, a, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} py-5 overflow-hidden`}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between w-full text-left font-bold text-lg items-center gap-4 focus:outline-none">
        <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{q}</span>
        <span className={`p-1 rounded-full ${isDark ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden"
          >
            <p className={`mt-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FlipCard = ({ subject, isDark }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  return (
    <div 
      className="relative w-full h-[320px] cursor-pointer group"
      style={{ perspective: 1000 }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        <div 
          className={`absolute w-full h-full backdrop-blur-sm p-8 rounded-3xl border transition-all ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'} ${subject.border}`} 
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className={`${subject.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
            <subject.icon className={`w-8 h-8 ${subject.color}`} />
          </div>
          <h3 className={`text-xl font-bold mb-3 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{subject.title}</h3>
          <p className={`leading-relaxed text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{subject.desc}</p>
          <div className="absolute bottom-6 right-8 text-sm font-semibold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
            View Syllabus →
          </div>
        </div>

        <div 
          className={`absolute w-full h-full backdrop-blur-sm p-8 rounded-3xl border transition-all flex flex-col justify-center ${isDark ? 'bg-slate-800/90 border-slate-700 shadow-[0_0_20px_rgba(79,70,229,0.1)]' : 'bg-white border-indigo-100 shadow-xl'}`} 
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <h3 className={`text-xl font-extrabold mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{subject.title} Syllabus</h3>
          <ul className="space-y-3">
            {subject.topics.map((topic, i) => (
              <li key={i} className={`flex items-start gap-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${subject.bulletColor}`}></div>
                <span className="text-sm font-medium">{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

// MAIN PAGE COMPONENT
const HomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); 
  const [themeRipple, setThemeRipple] = useState(false); 
  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState({ loading: false, message: '', isError: false });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus({ loading: true, message: '', isError: false });
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      const data = await res.json();
      
      if (data.success) {
        setContactStatus({ loading: false, message: 'Message sent successfully!', isError: false });
        setContactData({ name: '', email: '', message: '' }); 
      } else {
        setContactStatus({ loading: false, message: data.message || 'Something went wrong.', isError: true });
      }
    } catch (error) {
      setContactStatus({ loading: false, message: 'Failed to connect to server.', isError: true });
    }
  };

  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const handleGlobalMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleGlobalMouse);
    return () => window.removeEventListener('mousemove', handleGlobalMouse);
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const yParallaxFast = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const yParallaxSlow = useTransform(scrollYProgress, [0, 1], [0, -250]);
  const rotateParallax = useTransform(scrollYProgress, [0, 1], [0, 360]);

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleThemeToggle = () => {
    setThemeRipple(true);
    setTimeout(() => {
      setIsDark(!isDark);
      setTimeout(() => setThemeRipple(false), 500); 
    }, 100); 
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const curriculumSubjects = [
    { 
      icon: Calculator, title: "Engineering Math", desc: "Deep dives into the foundational mathematics required for advanced engineering concepts.", 
      topics: ["Calculus & Differential Equations", "Linear Algebra & Matrices", "Complex Variables"], 
      color: "text-indigo-500", bg: "bg-indigo-500/10", border: isDark ? "hover:border-indigo-500/50" : "hover:border-indigo-400", bulletColor: "bg-indigo-500" 
    },
    { 
      icon: BookOpen, title: "Discrete Math", desc: "Essential logic, set theory, and statistical modeling for computer science students.", 
      topics: ["Propositional Logic", "Set Theory & Relations", "Graph Theory & Trees"], 
      color: "text-violet-500", bg: "bg-violet-500/10", border: isDark ? "hover:border-violet-500/50" : "hover:border-violet-400", bulletColor: "bg-violet-500" 
    },
    { 
      icon: Cpu, title: "Automata Theory", desc: "Master the theory of computation, finite automata, and formal languages.", 
      topics: ["Finite Automata (DFA/NFA)", "Context-Free Grammars", "Turing Machines"], 
      color: "text-cyan-500", bg: "bg-cyan-500/10", border: isDark ? "hover:border-cyan-500/50" : "hover:border-cyan-400", bulletColor: "bg-cyan-500" 
    },
    { 
      icon: Network, title: "Data Structures", desc: "Build efficient algorithms and understand core data structures for problem-solving.", 
      topics: ["Arrays & Linked Lists", "Stacks & Queues", "Sorting & Searching Algorithms"], 
      color: "text-emerald-500", bg: "bg-emerald-500/10", border: isDark ? "hover:border-emerald-500/50" : "hover:border-emerald-400", bulletColor: "bg-emerald-500" 
    },
  ];

  const testimonials = [
  {
    name: "Rahul S.",
    role: "B.Tech CSE Student",
    rating: 5,
    text: "Dr. Goyal's teaching style is unparalleled. He breaks down complex math into simple logical steps. I aced my Engineering Math exam because of him!"
  },
  {
    name: "Priya M.",
    role: "Computer Science Major",
    rating: 4,
    text: "The Discrete Math series was a lifesaver. Never thought I would actually enjoy studying Graph Theory. Highly recommended for every engineering student."
  },
  {
    name: "Ankit K.",
    role: "Software Engineer",
    rating: 5,
    text: "Even after college, I come back to these lectures to brush up on my Automata Theory. Pure gold content, absolutely free."
  },
  {
    name: "Sneha R.",
    role: "B.Tech IT",
    rating: 4,
    text: "I was struggling with Data Structures, but the way concepts are visualized and explained here made everything crystal clear. Best mentor ever!"
  },
  {
    name: "Aman D.",
    role: "B.Tech CSE Student",
    rating: 5,
    text: "The community support and the quality of these free lectures are better than any paid coaching I've attended."
  },
];

  const faqs = [
    { 
      q: "Is this platform completely free?", 
      a: "Yes! All core lectures, announcements, and study materials are 100% free. Dr. Goyal established this portal especially for students who cannot afford expensive coaching classes." 
    },
    { 
      q: "Are the classes live or pre-recorded?", 
      a: "The platform utilizes a hybrid educational approach. Core concept videos are pre-recorded for high-quality playback, while specific topics and doubt sessions are hosted live." 
    },
    { 
      q: "How do students access study notes and assignments?", 
      a: "Simply click on the 'Portal Login' button at the top of the homepage and sign in with your student credentials. Once logged in, you can access the 'Study Materials Hub' and the 'Submissions Board'." 
    },
    { 
      q: "How will I know if my homework submission is late?", 
      a: "The Submissions Board actively tracks deadlines. If you submit past the due date, the system will flag your assignment with an 'Overdue' or 'LATE SUBMISSION' warning." 
    },
    { 
      q: "How do teachers track overall class performance?", 
      a: "The 'Analytics' tab provides visual performance metrics like bar charts for average scores and pie charts for task statuses. Admins can also export these grades and charts as a CSV or PDF report." 
    },
    { 
      q: "How do admins communicate with students and parents?", 
      a: "Admins can broadcast announcements to specific audiences. In the Direct Messages tab, Admins can participate in a Global Class Chat, message individual students, or chat directly with a linked parent account." 
    },
    { 
      q: "What sections of the portal do graders have access to?", 
      a: "Grader accounts are granted access to the Create Homework, Submitted Work, Google Drive, Schedule Tests, Lesson Schedule, and Direct Messages tabs." 
    },
    { 
      q: "How do graders know which students to evaluate?", 
      a: "Admins have the ability to allocate specific students to a grader's profile. The views, such as the lesson schedule, will be automatically filtered to show reports corresponding only to the assigned students." 
    }
  ];
  const visibleFaqs = showAllFaqs ? faqs : faqs.slice(0, 4);
  return (
    <>
      <div className={`min-h-screen font-sans overflow-x-hidden selection:bg-indigo-500/30 transition-colors duration-500 ${isDark ? 'bg-[#070B14] text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
        
        <AnimatePresence>
          {themeRipple && (
            <motion.div 
              initial={{ scale: 0, opacity: 1 }} animate={{ scale: 50, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: "circOut" }}
              className={`fixed top-6 right-10 w-10 h-10 rounded-full z-[9999] pointer-events-none ${isDark ? 'bg-white' : 'bg-[#070B14]'}`}
            />
          )}
        </AnimatePresence>

        <motion.div 
          style={{ scaleX }} 
          className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 origin-left z-[100]" 
        />

        <AnimatePresence>
          {showTopBtn && (
            <motion.button 
              initial={{ opacity: 0, y: 20, scale: 0.8 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-8 right-8 p-3 rounded-full bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] z-50 hover:bg-indigo-500 hover:-translate-y-1 transition-all"
            >
              <ChevronUp className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Navbar */}
        <nav className={`fixed w-full z-50 top-0 backdrop-blur-xl border-b transition-colors duration-500 ${isDark ? 'bg-[#070B14]/90 border-slate-800/50 shadow-2xl shadow-black/50' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              
              {/* Logo */}
              <motion.a href="/" whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
                <img src="/mathcom-logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg" />
                <span className={`font-extrabold text-2xl tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  MathCom <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Mentors</span>
                </span>
              </motion.a>
              
              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-8 font-medium">
                <a href="#about" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'}`}>Mission</a>
                <a href="#mentor" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'}`}>Mentor</a>
                <a href="#subjects" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'}`}>Curriculum</a>
                <a href="#contact" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-indigo-600'}`}>Contact Us</a>
                
                <button onClick={handleThemeToggle} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <MagneticElement>
                  <Link to="/login" className="bg-indigo-600 text-white px-7 py-2.5 rounded-full font-bold hover:bg-indigo-500 transition-colors shadow-md block">Portal Login</Link>
                </MagneticElement>
              </div>

              <div className="md:hidden flex items-center gap-4">
                <button onClick={handleThemeToggle} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-amber-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`focus:outline-none ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-indigo-600'}`}>
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
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className={`md:hidden border-b absolute w-full left-0 top-20 shadow-2xl overflow-hidden ${isDark ? 'bg-[#070B14] border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
                  <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className={`font-medium p-2 block rounded ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Mission</a>
                  <a href="#mentor" onClick={() => setIsMobileMenuOpen(false)} className={`font-medium p-2 block rounded ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Mentor</a>
                  <a href="#subjects" onClick={() => setIsMobileMenuOpen(false)} className={`font-medium p-2 block rounded ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Curriculum</a>
                  <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className={`font-medium p-2 block rounded ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>Contact Us</a>
                  <Link to="/login" className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-center mt-4 w-full block shadow-md">Portal Login</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Section */}
        <div className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 flex items-center justify-center min-h-screen overflow-hidden">
          
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div animate={{ x: mousePos.x * 0.05, y: mousePos.y * 0.05 }} className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 mix-blend-screen transition-opacity duration-700 ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-300/30'}`} />
            <motion.div animate={{ x: mousePos.x * -0.05, y: mousePos.y * -0.05 }} className={`absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 mix-blend-screen transition-opacity duration-700 ${isDark ? 'bg-cyan-600/15' : 'bg-cyan-300/30'}`} />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[150px] -z-10 mix-blend-screen ${isDark ? 'bg-violet-600/10' : 'bg-violet-300/30'}`}></div>
            
            <motion.div style={{ y: yParallaxFast, rotate: rotateParallax }} className="absolute top-[20%] right-[15%] text-6xl opacity-[0.08] text-indigo-500 font-mono font-bold">∑</motion.div>
            <motion.div style={{ y: yParallaxSlow, rotate: rotateParallax }} className="absolute bottom-[20%] left-[10%] text-7xl opacity-[0.08] text-cyan-500 font-mono font-bold">∫</motion.div>
            <motion.div style={{ y: yParallaxFast, rotate: rotateParallax }} className="absolute top-[60%] right-[30%] text-5xl opacity-[0.08] text-violet-500 font-mono font-bold">π</motion.div>
          </div>

          <motion.div 
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold mb-8 backdrop-blur-sm transition-colors ${isDark ? 'bg-slate-900/80 border-slate-700/50 text-indigo-300' : 'bg-white/80 border-indigo-200 text-indigo-700 shadow-sm'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Dr. Goyal Maths Official Learning Portal
            </motion.div>

            <motion.h1 variants={fadeUp} className={`text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Engineer Your <Typewriter words={['Future.', 'Career.', 'Logic.']} /> <br/>
              With Precision.
            </motion.h1>
            
            <motion.p variants={fadeUp} className={`max-w-3xl mx-auto text-xl md:text-2xl mb-12 leading-relaxed transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Master the core concepts of Engineering Mathematics, Discrete Mathematics, and advanced B.Tech CSE subjects. High-quality education, completely free for those who need it most.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center items-center gap-5">
              <MagneticElement>
                <motion.a 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  href="#featured-video"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-indigo-500 hover:to-violet-500 transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] block w-full sm:w-auto"
                >
                  <PlayCircle className="w-5 h-5" />
                  Watch Sample Lecture
                </motion.a>
              </MagneticElement>
              
              <MagneticElement>
                <Link to="/login" className="block w-full sm:w-auto">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg border backdrop-blur-sm transition-all w-full sm:w-auto ${isDark ? 'bg-slate-900/50 border-slate-700 text-white hover:bg-slate-800' : 'bg-white/80 border-slate-300 text-slate-900 hover:bg-slate-100 shadow-sm'}`}
                  >
                    Access Student Portal <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              </MagneticElement>
            </motion.div>
          </motion.div>
        </div>

        {/* Featured Video Section */}
        <div id="featured-video" className={`py-16 relative z-10 transition-colors duration-500 ${isDark ? 'bg-[#0A0F1C]' : 'bg-indigo-50/50'}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`p-4 md:p-6 rounded-3xl border shadow-2xl transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-indigo-100'}`}>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Most Popular: Complex Analysis & Analytic Functions</h3>
                <a href="https://www.youtube.com/@MathComMentors" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-400 font-semibold text-sm flex items-center gap-1">View Channel <ArrowRight className="w-4 h-4" /></a>
              </div>
              <div className="relative w-full overflow-hidden pt-[56.25%] rounded-2xl bg-slate-900">
                <iframe 
                  className="absolute top-0 left-0 bottom-0 right-0 w-full h-full"
                  src="https://www.youtube.com/embed/jm0JLx9cT5c" 
                  title="MathCom Mentors Featured Video" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen>
                </iframe>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics / Impact Section */}
        <div className={`py-16 border-y relative z-10 transition-colors duration-500 ${isDark ? 'bg-[#0A0F1C] border-slate-800/50' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className={`grid grid-cols-2 md:grid-cols-4 gap-8 divide-x ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}
            >
              {[
                { target: 140, suffix: "K+", label: "Active Students" },
                { target: 350, suffix: "+", label: "Free Lectures" },
                { target: 5, suffix: "+", label: "Core Subjects" },
                { target: 100, suffix: "%", label: "Free Access" }
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeUp} className="text-center px-4">
                  <h3 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">
                    <AnimatedCounter target={stat.target} suffix={stat.suffix} isDark={isDark} />
                  </h3>
                  <p className={`${isDark ? 'text-indigo-400' : 'text-indigo-600'} font-medium`}>{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Meet the Mentor Section */}
        <div id="mentor" className={`py-24 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#070B14]' : 'bg-slate-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`max-w-5xl mx-auto p-8 md:p-12 rounded-3xl border shadow-xl transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="w-full">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-sm font-bold mb-4">
                  <GraduationCap className="w-4 h-4" /> Chief Mentor & Founder
                </div>
                <TextReveal text="Meet Dr. Goyal" className="text-4xl font-extrabold mb-4 !justify-start" isDark={isDark} />
                <p className={`text-lg mb-6 leading-relaxed transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  With over a decade of teaching experience in advanced mathematics and computer science, Dr. Goyal has dedicated his career to simplifying complex engineering concepts. His unique approach bridges the gap between theoretical math and practical software engineering.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Teaching Philosophy</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Logic over memorization. Building foundations that last a lifetime.</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Professional Impact</h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Mentored 100,000+ students across India to ace their university exams.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div id="features" className={`py-24 relative transition-colors duration-500 ${isDark ? 'bg-[#0A0F1C]' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <TextReveal text="The MathCom Mentors Advantage" className="text-3xl md:text-5xl font-extrabold mb-4" isDark={isDark} />
              <p className={`text-lg max-w-2xl mx-auto transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>We don't just teach formulas; we build the logical foundation required for top-tier software engineering.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Concept Clarity", desc: "Complex mathematical proofs broken down into simple, digestible logical steps.", color: "text-amber-400", bg: "bg-amber-400/10", border: isDark ? "hover:border-amber-500/50" : "hover:border-amber-400" },
                { icon: Award, title: "Exam Focused", desc: "Targeted preparation for sessionals and semester exams to ensure maximum scoring potential.", color: "text-emerald-400", bg: "bg-emerald-400/10", border: isDark ? "hover:border-emerald-500/50" : "hover:border-emerald-400" },
                { icon: Users, title: "Community Driven", desc: "Built for students who cannot afford expensive coaching, driven by community support and engagement.", color: "text-blue-400", bg: "bg-blue-400/10", border: isDark ? "hover:border-blue-500/50" : "hover:border-blue-400" }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  whileHover={{ y: -5 }}
                  className={`backdrop-blur-sm p-8 rounded-2xl border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} ${feature.border}`}
                >
                  <div className={`${feature.bg} w-14 h-14 rounded-xl flex items-center justify-center mb-6`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                  <p className={`leading-relaxed transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div id="about" className={`py-24 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#070B14]' : 'bg-indigo-50'}`}>
          <div className={`absolute inset-0 bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 ${isDark ? 'bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)]'}`}></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className={`max-w-4xl mx-auto backdrop-blur-md p-10 md:p-16 rounded-3xl border shadow-2xl relative transition-colors ${isDark ? 'bg-slate-900/80 border-slate-700/50 shadow-indigo-900/20' : 'bg-white/90 border-slate-200 shadow-indigo-200/50'}`}
            >
              <div className={`absolute -top-8 left-1/2 -translate-x-1/2 p-4 rounded-full border transition-colors ${isDark ? 'bg-[#0A0F1C] border-slate-700/50' : 'bg-indigo-50 border-indigo-200'}`}>
                <HeartHandshake className="w-10 h-10 text-indigo-500" />
              </div>
              
              <TextReveal text="Our Core Mission" className="text-3xl md:text-4xl font-extrabold mb-8 mt-4" isDark={isDark} />
              <p className={`text-xl md:text-2xl leading-relaxed italic font-light transition-colors ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                "These Online Classes are started especially for those students who can't come for classes or tuitions & for those who can't afford to go to coaching Classes. All I need is your Support & engagement with us. So I can help you more achieving best in your sessionals & semester exams."
              </p>
              <div className="mt-10 inline-flex items-center gap-4">
                <div className="h-[1px] w-12 bg-indigo-500/50"></div>
                <p className="text-indigo-500 font-bold text-lg tracking-wide uppercase">Dr. Goyal</p>
                <div className="h-[1px] w-12 bg-indigo-500/50"></div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* FEATURE 5: Interactive Learning Roadmap */}
        <div id="roadmap" className={`py-24 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0A0F1C]' : 'bg-slate-50'}`}>
           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-24">
               <TextReveal text="The Engineering Pathway" className="text-4xl md:text-5xl font-extrabold mb-4" isDark={isDark} />
               <p className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Follow the logical progression of subjects to build a rock-solid foundation.</p>
             </div>
             
             <div className="relative max-w-5xl mx-auto">
                <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-indigo-500/30 md:-translate-x-1/2 rounded-full"></div>
                
                <div className="space-y-12">
                  {curriculumSubjects.map((sub, i) => {
                    const isEven = i % 2 === 0;
                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className={`relative flex items-center justify-between flex-col md:flex-row w-full ${isEven ? 'md:flex-row-reverse' : ''}`}
                      >
                        <div className="hidden md:block w-[45%]"></div>
                        
                        <div className={`absolute left-[28px] md:left-1/2 top-8 md:top-1/2 w-5 h-5 rounded-full border-4 ${isDark ? 'border-[#0A0F1C]' : 'border-slate-50'} ${sub.bulletColor} shadow-[0_0_15px_rgba(99,102,241,0.6)] -translate-x-1/2 md:-translate-y-1/2 z-10`}></div>
                        
                        <div className={`w-full pl-16 md:pl-0 md:w-[45%] ${isEven ? 'md:text-right' : 'text-left'}`}>
                          <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-transform hover:-translate-y-1 ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-600' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'}`}>
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${sub.bg} ${sub.color} ${isEven ? 'md:ml-auto md:mr-0' : ''}`}>
                              <sub.icon className="w-6 h-6" />
                            </div>
                            <h4 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{sub.title}</h4>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{sub.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
             </div>
           </div>
        </div>

        <div id="subjects" className={`py-32 relative transition-colors duration-500 ${isDark ? 'bg-[#0A0F1C]' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <TextReveal text="Master the Curriculum" className="text-4xl md:text-5xl font-extrabold mb-6" isDark={isDark} />
              <p className={`text-xl transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Hover over any subject to view the core syllabus.</p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {curriculumSubjects.map((subject, index) => (
                <FlipCard key={index} subject={subject} isDark={isDark} />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className={`py-24 relative overflow-hidden border-t transition-colors duration-500 ${isDark ? 'bg-[#070B14] border-slate-800/50' : 'bg-indigo-50/50 border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 relative z-10">
            <TextReveal text="Student Success Stories" className="text-4xl md:text-5xl font-extrabold mb-4" isDark={isDark} />
            <p className={`text-xl transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Join thousands of students who have transformed their engineering journey.</p>
          </div>

          <div className="relative w-full flex overflow-hidden group">
            <div className={`absolute left-0 top-0 bottom-0 w-24 sm:w-40 z-10 pointer-events-none transition-colors duration-500 ${isDark ? 'bg-gradient-to-r from-[#070B14] to-transparent' : 'bg-gradient-to-r from-indigo-50/50 to-transparent'}`}></div>
            <div className={`absolute right-0 top-0 bottom-0 w-24 sm:w-40 z-10 pointer-events-none transition-colors duration-500 ${isDark ? 'bg-gradient-to-l from-[#070B14] to-transparent' : 'bg-gradient-to-l from-indigo-50/50 to-transparent'}`}></div>

            <motion.div 
              className="flex gap-6 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ ease: "linear", duration: 35, repeat: Infinity }}
            >
              {[...testimonials, ...testimonials].map((t, index) => (
                <div key={index} className={`w-[350px] sm:w-[420px] backdrop-blur-md p-8 rounded-3xl border flex flex-col justify-between flex-shrink-0 transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60' : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'}`}>
                  <div>
                    <div className="flex mb-4 gap-1">
  {[...Array(t.rating)].map((_, i) => (
    <Star
      key={i}
      className="w-5 h-5 text-amber-400 fill-amber-400"
    />
  ))}
</div>
                    <p className={`leading-relaxed mb-6 italic transition-colors ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>"{t.text}"</p>
                  </div>
                  <div className={`flex items-center gap-4 border-t pt-5 transition-colors ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className={`font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.name}</h4>
                      <p className="text-xs text-indigo-500 font-bold">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* FAQ ACCORDION SECTION */}
        <div className={`py-24 relative transition-colors duration-500 ${isDark ? 'bg-[#0A0F1C]' : 'bg-white'}`}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <TextReveal text="Frequently Asked Questions" className="text-3xl md:text-5xl font-extrabold mb-4" isDark={isDark} />
              <p className={`text-lg transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Everything you need to know about the MathCom Mentors portal.</p>
            </div>
            <div className={`rounded-3xl p-6 md:p-10 border shadow-lg transition-colors ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} `}>
              
              {/* Map only the visible FAQs with a smooth animation */}
              <AnimatePresence>
                {visibleFaqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FAQItem q={faq.q} a={faq.a} isDark={isDark} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Show More / Show Less Button */}
              {faqs.length > 4 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setShowAllFaqs(!showAllFaqs)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700 hover:text-indigo-300' 
                        : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700'
                    }`}
                  >
                    {showAllFaqs ? 'Show Less' : 'Read More'}
                    <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${showAllFaqs ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* Contact Us Section */}
        <div id="contact" className={`py-24 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0A0F1C]' : 'bg-slate-50'}`}>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <TextReveal text="Let's Connect" className="text-4xl md:text-5xl font-extrabold mb-4" isDark={isDark} />
              <p className={`text-lg transition-colors max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Have a question about the lectures or facing an issue with the portal? Drop us a message and we'll get back to you.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-2 space-y-6"
              >
                 <div className={`p-8 rounded-3xl border shadow-lg transition-transform hover:-translate-y-1 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                      <Mail className="w-7 h-7 text-indigo-500" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Us</h3>
                    <p className={`mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Send us an email directly. We usually respond within 24 hours.</p>
                    <a href="mailto:mathcommentors@gmail.com" className="inline-flex items-center gap-2 text-indigo-500 font-bold hover:text-indigo-400 transition-colors">
                      mathcommentors@gmail.com <ArrowRight className="w-4 h-4" />
                    </a>
                 </div>

                 <div className={`p-8 rounded-3xl border shadow-lg transition-transform hover:-translate-y-1 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20">
                      <Users className="w-7 h-7 text-cyan-500" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Join Community</h3>
                    <p className={`mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Connect with thousands of students on our official channel.</p>
                    <a href="https://www.youtube.com/@MathComMentors" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-cyan-500 font-bold hover:text-cyan-400 transition-colors">
                      Visit YouTube <ArrowRight className="w-4 h-4" />
                    </a>
                 </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`lg:col-span-3 p-8 md:p-10 rounded-3xl border shadow-2xl relative overflow-hidden transition-colors ${isDark ? 'bg-slate-900/80 border-slate-800 shadow-indigo-900/10' : 'bg-white border-slate-200 shadow-indigo-100'}`}
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500"></div>

                <h3 className={`text-2xl font-bold mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Send a Message</h3>

                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your Name</label>
                      <input 
                        type="text" required
                        value={contactData.name}
                        onChange={(e) => setContactData({...contactData, name: e.target.value})}
                        className={`w-full px-5 py-4 rounded-xl border-2 focus:border-indigo-500 focus:ring-0 outline-none transition-all ${isDark ? 'bg-[#0A0F1C] border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="relative">
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your Email</label>
                      <input 
                        type="email" required
                        value={contactData.email}
                        onChange={(e) => setContactData({...contactData, email: e.target.value})}
                        className={`w-full px-5 py-4 rounded-xl border-2 focus:border-indigo-500 focus:ring-0 outline-none transition-all ${isDark ? 'bg-[#0A0F1C] border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your Message</label>
                    <textarea 
                      required rows="5"
                      value={contactData.message}
                      onChange={(e) => setContactData({...contactData, message: e.target.value})}
                      className={`w-full px-5 py-4 rounded-xl border-2 focus:border-indigo-500 focus:ring-0 outline-none transition-all resize-none ${isDark ? 'bg-[#0A0F1C] border-slate-800 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                      placeholder="How can we help you today?"
                    ></textarea>
                  </div>
                  
                  <AnimatePresence>
                    {contactStatus.message && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${contactStatus.isError ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}
                      >
                        {contactStatus.isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                        {contactStatus.message}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button 
                    whileHover={{ scale: contactStatus.loading ? 1 : 1.02 }}
                    whileTap={{ scale: contactStatus.loading ? 1 : 0.98 }}
                    type="submit" 
                    disabled={contactStatus.loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-80 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/30 relative overflow-hidden"
                  >
                    {contactStatus.loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> 
                        Sending Message...
                      </>
                    ) : contactStatus.message && !contactStatus.isError ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Sent Successfully!
                      </>
                    ) : (
                      <>
                        Send Message <Send className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={`pt-20 pb-10 border-t transition-colors duration-500 ${isDark ? 'bg-[#04070D] border-slate-800/50' : 'bg-slate-900 border-slate-800'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
              
              <div className="md:col-span-5 lg:col-span-4">
                <div className="flex items-center gap-3 mb-6">
                  <img src="/mathcom-logo.png" alt="MathCom Mentors Logo" className="w-10 h-10 object-contain rounded-lg shadow-sm bg-white p-1" />
                  <span className="font-extrabold text-2xl text-white">MathCom Mentors</span>
                </div>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Empowering B.Tech CSE students with high-quality, accessible education in Mathematics and Computer Science.
                </p>
                <motion.div whileHover={{ x: 5 }} className="flex items-center gap-2 text-slate-300 w-max">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  <a href="mailto:mathcommentors@gmail.com" className="hover:text-white transition-colors font-medium">mathcommentors@gmail.com</a>
                </motion.div>
              </div>

              <div className="md:col-span-2 lg:col-span-4"></div>

              <div className="md:col-span-5 lg:col-span-4">
                <h3 className="text-white font-extrabold text-lg mb-6">Connect With Us</h3>
                <div className="flex flex-col gap-4 w-max">
                  <motion.a whileHover={{ x: 5, color: '#1877F2' }} href="https://facebook.com/MathComMentors" target="_blank" rel="noreferrer" className="text-slate-400 flex items-center gap-3 font-medium transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                    Facebook
                  </motion.a>
                  
                  <motion.a whileHover={{ x: 5, color: '#0A66C2' }} href="https://linkedin.com/in/mathcom-mentors-6b8a94188" target="_blank" rel="noreferrer" className="text-slate-400 flex items-center gap-3 font-medium transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                    LinkedIn
                  </motion.a>
                  
                  <motion.a whileHover={{ x: 5, color: '#ffffff' }} href="https://twitter.com/mathcom_mentors" target="_blank" rel="noreferrer" className="text-slate-400 flex items-center gap-3 font-medium transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 4.25H5.078z" /></svg>
                    Twitter (X)
                  </motion.a>
                  
                  <motion.a whileHover={{ x: 5, color: '#E4405F' }} href="https://instagram.com/mathcommentors" target="_blank" rel="noreferrer" className="text-slate-400 flex items-center gap-3 font-medium transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                    Instagram
                  </motion.a>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm font-medium">
                © {new Date().getFullYear()} MathCom Mentors by Dr. Goyal. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-slate-500 font-medium">
                <motion.a whileHover={{ color: '#ffffff' }} href="/login" className="transition-colors hover:text-indigo-400">Portal Login</motion.a>
                <motion.a whileHover={{ color: '#ffffff' }} href="https://www.youtube.com/@MathComMentors" target="_blank" rel="noreferrer" className="transition-colors hover:text-indigo-400">YouTube</motion.a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;