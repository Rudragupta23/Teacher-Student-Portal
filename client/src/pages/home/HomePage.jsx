import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, animate, useInView, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { Calculator, ArrowRight, BookOpen, Cpu, Network, Mail, HeartHandshake, Users, Star, StarHalf, ChevronUp, Plus, Minus, GraduationCap, PlayCircle, Send, Loader2, CheckCircle, AlertCircle, Download, Smartphone } from 'lucide-react';

/*
  WARM PARCHMENT PALETTE
  Replaces the old white / cool-grey surfaces. Search-and-replace any hex below
  if you want to shift the whole page warmer or cooler.

  Surfaces
    #FDF7EC  raised surface   - cards, nav bar, modals, footer
    #F6EDDF  page base        - body + main section backgrounds
    #F1E6D5  band             - alternating sections (stats, roadmap, contact)
    #EDE0CC  deep fill        - icon chips, hover states, flip-card back
    #E6D6BE  deepest fill     - video placeholder

  Lines
    #E8DAC4  hairline border
    #D8C5A6  stronger border / divider rules
    #E3D3B8  hero grid lines

  Ink (text)
    #241A12  strongest        #3B2E22  headings
    #574636  body strong      #6B5A48  body
    #7A6753  muted / labels   #E0D0B6  inactive stars

  Accent stays orange-600 (#EA580C) - it sits well on cream.
  Dark button: #4A3927 with #5E4A33 hover.
*/

const TextReveal = ({ text, className }) => {
  const words = text.split(" ");
  return (
    <motion.h2 
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }}
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      className={`flex flex-wrap justify-center gap-x-2 text-[#3B2E22] ${className}`}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
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
    <span className="text-orange-600 inline-block min-w-[3ch]">
      {currentWord}
      <span className="animate-pulse text-orange-400">|</span>
    </span>
  );
};

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

  return <span ref={ref} className="text-[#3B2E22]">0{suffix}</span>;
};

const FAQItem = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#E8DAC4] py-5 overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between w-full text-left font-bold text-lg items-center gap-4 focus:outline-none">
        <span className="text-[#3B2E22]">{q}</span>
        <span className={`p-1 rounded-full bg-orange-50 text-orange-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
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
            <p className="mt-4 leading-relaxed text-[#6B5A48]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FlipCard = ({ subject }) => {
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
          className={`absolute w-full h-full bg-[#FDF7EC] p-8 rounded-3xl border border-[#E8DAC4] shadow-sm transition-all hover:shadow-md ${subject.border}`} 
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className={`${subject.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
            <subject.icon className={`w-8 h-8 ${subject.color}`} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-[#3B2E22]">{subject.title}</h3>
          <p className="leading-relaxed text-sm text-[#6B5A48]">{subject.desc}</p>
          <div className="absolute bottom-6 right-8 text-sm font-semibold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
            View Syllabus →
          </div>
        </div>

        <div 
          className="absolute w-full h-full bg-[#EDE0CC] p-8 rounded-3xl border border-[#E8DAC4] shadow-md transition-all flex flex-col justify-center" 
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <h3 className="text-xl font-extrabold mb-5 text-[#3B2E22]">{subject.title} Syllabus</h3>
          <ul className="space-y-3">
            {subject.topics.map((topic, i) => (
              <li key={i} className="flex items-start gap-3 text-[#6B5A48]">
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

const HomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [activeSection, setActiveSection] = useState(''); 
  const [contactData, setContactData] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState({ loading: false, message: '', isError: false });

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setIsAppInstalled(true);
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowInstallModal(true);
    }
  };

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

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  // Using a warm palette: Amber, Orange, Rose, Red
  const curriculumSubjects = [
    { 
      icon: Calculator, title: "Engineering Math", desc: "Deep dives into the foundational mathematics required for advanced engineering concepts.", 
      topics: ["Calculus & Differential Equations", "Linear Algebra & Matrices", "Complex Variables"], 
      color: "text-orange-600", bg: "bg-orange-100/50", border: "hover:border-orange-300", bulletColor: "bg-orange-500" 
    },
    { 
      icon: BookOpen, title: "Discrete Math", desc: "Essential logic, set theory, and statistical modeling for computer science students.", 
      topics: ["Propositional Logic", "Set Theory & Relations", "Graph Theory & Trees"], 
      color: "text-amber-600", bg: "bg-amber-100/50", border: "hover:border-amber-300", bulletColor: "bg-amber-500" 
    },
    { 
      icon: Cpu, title: "Automata Theory", desc: "Master the theory of computation, finite automata, and formal languages.", 
      topics: ["Finite Automata (DFA/NFA)", "Context-Free Grammars", "Turing Machines"], 
      color: "text-rose-600", bg: "bg-rose-100/50", border: "hover:border-rose-300", bulletColor: "bg-rose-500" 
    },
    { 
      icon: Network, title: "Data Structures", desc: "Build efficient algorithms and understand core data structures for problem-solving.", 
      topics: ["Arrays & Linked Lists", "Stacks & Queues", "Sorting & Searching Algorithms"], 
      color: "text-red-600", bg: "bg-red-100/50", border: "hover:border-red-300", bulletColor: "bg-red-500" 
    },
  ];

  const testimonials = [
    { name: "Rahul S.", role: "B.Tech CSE Student", rating: 5, text: "Dr. Goyal's teaching style is unparalleled. He breaks down complex math into simple logical steps. I aced my Engineering Math exam because of him!" },
    { name: "Priya M.", role: "Computer Science Major", rating: 4.5, text: "The Discrete Math series was a lifesaver. Never thought I would actually enjoy studying Graph Theory. Highly recommended for every engineering student." },
    { name: "Ankit K.", role: "Software Engineer", rating: 5, text: "Even after college, I come back to these lectures to brush up on my Automata Theory. Pure gold content, absolutely free." },
    { name: "Sneha R.", role: "B.Tech IT", rating: 4.5, text: "I was struggling with Data Structures, but the way concepts are visualized and explained here made everything crystal clear. Best mentor ever!" },
    { name: "Aman D.", role: "B.Tech CSE Student", rating: 5, text: "The community support and the quality of these free lectures are better than any paid coaching I've attended." },
  ];

  const faqs = [
    { q: "Is this platform completely free?", a: "Yes! All core lectures, announcements, and study materials are 100% free. Dr. Goyal established this portal especially for students who cannot afford expensive coaching classes." },
    { q: "Are the classes live or pre-recorded?", a: "The platform utilizes a hybrid educational approach. Core concept videos are pre-recorded for high-quality playback, while specific topics and doubt sessions are hosted live." },
    { q: "How do students access study notes and assignments?", a: "Simply click on the 'Portal Login' button at the top of the homepage and sign in with your student credentials. Once logged in, you can access the 'Study Materials Hub' and the 'Submissions Board'." },
    { q: "How will I know if my homework submission is late?", a: "The Submissions Board actively tracks deadlines. If you submit past the due date, the system will flag your assignment with an 'Overdue' or 'LATE SUBMISSION' warning." },
    { q: "How do teachers track overall class performance?", a: "The 'Analytics' tab provides visual performance metrics like bar charts for average scores and pie charts for task statuses. Admins can also export these grades and charts as a CSV or PDF report." },
    { q: "How do admins communicate with students and parents?", a: "Admins can broadcast announcements to specific audiences. In the Direct Messages tab, Admins can participate in a Global Class Chat, message individual students, or chat directly with a linked parent account." },
    { q: "What sections of the portal do graders have access to?", a: "Grader accounts are granted access to the Create Homework, Submitted Work, Google Drive, Schedule Tests, Lesson Schedule, and Direct Messages tabs." },
    { q: "How do graders know which students to evaluate?", a: "Admins have the ability to allocate specific students to a grader's profile. The views, such as the lesson schedule, will be automatically filtered to show reports corresponding only to the assigned students." }
  ];
  
  const visibleFaqs = showAllFaqs ? faqs : faqs.slice(0, 4);

  return (
    <>
      {/* Keeps the warm tone behind the page during overscroll / rubber-banding
          instead of flashing the browser's default white. */}
      <style>{`
        html, body, #root {
          background-color: #F6EDDF;
        }
        ::selection {
          background-color: #FBD9A5;
          color: #241A12;
        }
      `}</style>

      <div className="min-h-screen font-sans bg-[#F6EDDF] text-[#574636] selection:bg-orange-200 overflow-x-hidden">
        
        <motion.div 
          style={{ scaleX }} 
          className="fixed top-0 left-0 right-0 h-1.5 bg-orange-600 origin-left z-[100]" 
        />

        <AnimatePresence>
          {showTopBtn && (
            <motion.button 
              initial={{ opacity: 0, y: 20, scale: 0.8 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-8 right-8 p-3 rounded-full bg-orange-600 text-white shadow-lg z-50 hover:bg-orange-700 hover:-translate-y-1 transition-all"
            >
              <ChevronUp className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="fixed top-0 inset-x-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
          <motion.nav 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 20 }}
            className="w-full max-w-6xl rounded-full bg-[#FDF7EC]/90 backdrop-blur-md border border-[#E8DAC4] shadow-sm pointer-events-auto"
          >
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                
                <button onClick={() => window.location.reload()} className="flex items-center gap-3 outline-none group cursor-pointer">
                  <img src="/mathcom-logo.png" alt="Logo" className="w-10 h-10 object-contain rounded-full shadow-sm border border-[#E8DAC4] group-hover:scale-105 transition-transform" />
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#3B2E22]">
                    MathCom <span className="text-orange-600">Mentors</span>
                  </span>
                </button>
                
                <div className="hidden md:flex items-center gap-8 font-medium">
                  <a href="#about" onClick={() => setActiveSection('about')} className={`relative group py-2 text-sm sm:text-base font-bold ${activeSection === 'about' ? 'text-orange-600' : 'text-[#6B5A48] hover:text-orange-600'}`}>
                    Mission
                    <span className={`absolute bottom-0 left-0 h-[3px] bg-orange-600 transition-all duration-300 rounded-t-md ${activeSection === 'about' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </a>
                  <a href="#subjects" onClick={() => setActiveSection('subjects')} className={`relative group py-2 text-sm sm:text-base font-bold ${activeSection === 'subjects' ? 'text-orange-600' : 'text-[#6B5A48] hover:text-orange-600'}`}>
                    Curriculum
                    <span className={`absolute bottom-0 left-0 h-[3px] bg-orange-600 transition-all duration-300 rounded-t-md ${activeSection === 'subjects' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </a>
                  <a href="#contact" onClick={() => setActiveSection('contact')} className={`relative group py-2 text-sm sm:text-base font-bold ${activeSection === 'contact' ? 'text-orange-600' : 'text-[#6B5A48] hover:text-orange-600'}`}>
                    Contact Us
                    <span className={`absolute bottom-0 left-0 h-[3px] bg-orange-600 transition-all duration-300 rounded-t-md ${activeSection === 'contact' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </a>
                  
                  <div className="flex items-center gap-3 ml-2 pl-6 border-l border-[#E8DAC4]">
                    <Link to="/login" className="bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-orange-700 transition-colors shadow-sm">
                      Portal Login
                    </Link>
                  </div>
                </div>

                <div className="md:hidden flex items-center gap-3">
                  <Link to="/login" className="bg-orange-600 text-white px-5 py-2 rounded-full font-bold text-xs shadow-sm hover:bg-orange-700">
                    Login
                  </Link>
                  <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="focus:outline-none text-[#6B5A48] hover:text-orange-600 p-1">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, y: -10 }} 
                  animate={{ height: 'auto', opacity: 1, y: 0 }} 
                  exit={{ height: 0, opacity: 0, y: -10 }} 
                  className="md:hidden absolute w-full left-0 top-[110%] shadow-lg overflow-hidden border border-[#E8DAC4] rounded-3xl bg-[#FDF7EC]"
                >
                  <div className="px-4 py-4 space-y-2 flex flex-col">
                    <a href="#about" onClick={() => { setIsMobileMenuOpen(false); setActiveSection('about'); }} className={`font-bold text-base p-3 block rounded-xl ${activeSection === 'about' ? 'bg-orange-50 text-orange-600' : 'text-[#6B5A48] hover:bg-[#EDE0CC]'}`}>Mission</a>
                    <a href="#subjects" onClick={() => { setIsMobileMenuOpen(false); setActiveSection('subjects'); }} className={`font-bold text-base p-3 block rounded-xl ${activeSection === 'subjects' ? 'bg-orange-50 text-orange-600' : 'text-[#6B5A48] hover:bg-[#EDE0CC]'}`}>Curriculum</a>
                    <a href="#contact" onClick={() => { setIsMobileMenuOpen(false); setActiveSection('contact'); }} className={`font-bold text-base p-3 block rounded-xl ${activeSection === 'contact' ? 'bg-orange-50 text-orange-600' : 'text-[#6B5A48] hover:bg-[#EDE0CC]'}`}>Contact Us</a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.nav>
        </div>

        <div className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 lg:min-h-screen flex items-center overflow-hidden bg-[#F6EDDF]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#E3D3B8_1px,transparent_1px),linear-gradient(to_bottom,#E3D3B8_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-60"></div>

          {/* Soft sunlight wash from the top-right, so the hero reads as lit
              parchment rather than a flat block of colour. */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,#FFF6E6_0%,transparent_60%)]"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mt-10 lg:mt-0">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="text-left">
                <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-6 leading-[1.1] text-[#3B2E22]">
                  Engineer Your <br/>
                  <Typewriter words={['Logic.', 'Future.', 'Career.']} />
                  <br/>With Precision.
                </motion.h1>
                
                <motion.p variants={fadeUp} className="text-lg sm:text-xl mb-10 leading-relaxed font-medium max-w-xl text-[#6B5A48]">
                  Master the core concepts of Engineering Mathematics, Discrete Mathematics, and advanced B.Tech CSE subjects. High-quality education, <strong className="font-black text-[#241A12] border-b-2 border-orange-500">completely free</strong> for those who need it most.
                </motion.p>
                
                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                  {!isAppInstalled && (
                    <button 
                      onClick={handleInstallClick}
                      className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-lg transition-colors w-full sm:w-auto shadow-sm bg-[#4A3927] text-[#FDF7EC] hover:bg-[#5E4A33]"
                    >
                      <Download className="w-5 h-5" /> Install App
                    </button>
                  )}

                  <Link to="/login" className="block w-full sm:w-auto">
                    <button className="flex items-center justify-center px-8 py-4 rounded-2xl font-black text-lg transition-colors w-full border-2 border-[#D8C5A6] hover:border-orange-600 hover:bg-orange-50 bg-[#FDF7EC] text-[#3B2E22] shadow-sm">
                      Portal Login
                    </button>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.2, type: 'spring' }}
                className="hidden lg:block relative h-full min-h-[500px]"
              >
                <motion.div 
                  animate={{ y: [-10, 10, -10] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-[10%] right-[5%] w-[280px] p-6 rounded-3xl bg-[#FDF7EC] border border-[#E8DAC4] shadow-xl z-20"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100/50 flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-[#3B2E22]">Engineering</h3>
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Advanced Calculus</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-[#EDE0CC] rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 w-[85%] rounded-full"></div>
                    </div>
                    <div className="h-2 w-full bg-[#EDE0CC] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[60%] rounded-full"></div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [10, -10, 10] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-[15%] left-[5%] w-[250px] p-6 rounded-3xl bg-[#FDF7EC] border border-[#E8DAC4] shadow-xl z-30"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-100/50 flex items-center justify-center mb-4">
                    <Cpu className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="font-black text-xl mb-1 text-[#3B2E22]">Automata</h3>
                  <p className="text-sm font-bold text-rose-600">DFA, NFA & Turing</p>
                </motion.div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border-2 border-dashed border-[#D8C5A6] animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full border border-[#E8DAC4]"></div>
              </motion.div>
            </div>
          </div>
        </div>

        <div id="featured-video" className="py-16 relative z-10 bg-[#FDF7EC] border-t border-[#E8DAC4]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-4 md:p-6 rounded-3xl bg-[#F6EDDF] border border-[#E8DAC4] shadow-md">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xl font-bold text-[#3B2E22]">Most Popular: Complex Analysis & Analytic Functions</h3>
                <a href="https://www.youtube.com/@MathComMentors" target="_blank" rel="noreferrer" className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center gap-1">View Channel <ArrowRight className="w-4 h-4" /></a>
              </div>
              <div className="relative w-full overflow-hidden pt-[56.25%] rounded-2xl bg-[#E6D6BE] border border-[#E8DAC4]">
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

        <div className="py-16 border-y relative z-10 bg-[#F1E6D5] border-[#E8DAC4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-[#E8DAC4]"
            >
              {[
                { target: 140, suffix: "K+", label: "Active Students" },
                { target: 350, suffix: "+", label: "Free Lectures" },
                { target: 5, suffix: "+", label: "Core Subjects" },
                { target: 100, suffix: "%", label: "Free Access" }
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeUp} className="text-center px-4">
                  <h3 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight text-[#3B2E22]">
                    <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                  </h3>
                  <p className="text-orange-600 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="py-24 relative overflow-hidden bg-[#FDF7EC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col gap-24">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="max-w-5xl mx-auto w-full p-8 md:p-12 rounded-3xl bg-[#F6EDDF] border border-[#E8DAC4] shadow-sm"
            >
              <div className="w-full">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100/50 text-orange-700 text-sm font-bold mb-4">
                  <GraduationCap className="w-4 h-4" /> Chief Mentor & Founder
                </div>
                <TextReveal text="Meet Dr. Goyal" className="text-4xl font-extrabold mb-4 !justify-start" />
                <p className="text-lg mb-6 leading-relaxed text-[#6B5A48]">
                  With over a decade of teaching experience in advanced mathematics and computer science, Dr. Goyal has dedicated his career to simplifying complex engineering concepts. His unique approach bridges the gap between theoretical math and practical software engineering.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-2">
                  <div className="p-4 rounded-xl bg-[#FDF7EC] border border-[#E8DAC4] shadow-sm">
                    <h4 className="font-bold mb-1 text-[#3B2E22]">Teaching Philosophy</h4>
                    <p className="text-sm text-[#6B5A48]">Logic over memorization. Building foundations that last a lifetime.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FDF7EC] border border-[#E8DAC4] shadow-sm">
                    <h4 className="font-bold mb-1 text-[#3B2E22]">Professional Impact</h4>
                    <p className="text-sm text-[#6B5A48]">Mentored 100,000+ students across India to ace their university exams.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              id="about" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
              className="scroll-mt-28 max-w-5xl mx-auto w-full text-center p-8 md:p-12 rounded-3xl bg-[#F6EDDF] border border-[#E8DAC4] shadow-sm relative"
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 p-4 rounded-full bg-orange-50 border border-orange-200 shadow-sm">
                <HeartHandshake className="w-8 h-8 text-orange-600" />
              </div>

              <TextReveal text="Our Core Mission" className="text-3xl md:text-4xl font-extrabold mb-8 mt-4" />
              <p className="text-xl md:text-2xl leading-relaxed italic font-light text-[#574636]">
                "These Online Classes are started especially for those students who can't come for classes or tuitions & for those who can't afford to go to coaching Classes. All I need is your Support & engagement with us. So I can help you more achieving best in your sessionals & semester exams."
              </p>
              <div className="mt-10 inline-flex items-center gap-4">
                <div className="h-[1px] w-12 bg-[#D8C5A6]"></div>
                <p className="text-orange-600 font-bold text-lg tracking-wide uppercase">Dr. Goyal</p>
                <div className="h-[1px] w-12 bg-[#D8C5A6]"></div>
              </div>
            </motion.div>

          </div>
        </div>

        <div id="roadmap" className="py-24 relative overflow-hidden bg-[#F1E6D5] border-t border-[#E8DAC4]">
           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-24">
               <TextReveal text="The Engineering Pathway" className="text-4xl md:text-5xl font-extrabold mb-4" />
               <p className="text-xl text-[#6B5A48]">Follow the logical progression of subjects to build a rock-solid foundation.</p>
             </div>
             
             <div className="relative max-w-5xl mx-auto">
                <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-[#E6D6BE] md:-translate-x-1/2 rounded-full"></div>
                
                <div className="space-y-12">
                  {curriculumSubjects.map((sub, i) => {
                    const isEven = i % 2 === 0;
                    return (
                      <motion.div 
                        key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
                        className={`relative flex items-center justify-between flex-col md:flex-row w-full ${isEven ? 'md:flex-row-reverse' : ''}`}
                      >
                        <div className="hidden md:block w-[45%]"></div>
                        
                        <div className={`absolute left-[28px] md:left-1/2 top-8 md:top-1/2 w-5 h-5 rounded-full border-4 border-[#FDF7EC] ${sub.bulletColor} shadow-sm -translate-x-1/2 md:-translate-y-1/2 z-10`}></div>
                        
                        <div className={`w-full pl-16 md:pl-0 md:w-[45%] ${isEven ? 'md:text-right' : 'text-left'}`}>
                          <div className="p-6 rounded-2xl bg-[#FDF7EC] border border-[#E8DAC4] shadow-sm transition-transform hover:-translate-y-1 hover:border-[#D8C5A6]">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${sub.bg} ${sub.color} ${isEven ? 'md:ml-auto md:mr-0' : ''}`}>
                              <sub.icon className="w-6 h-6" />
                            </div>
                            <h4 className="text-2xl font-bold mb-2 text-[#3B2E22]">{sub.title}</h4>
                            <p className="text-sm text-[#6B5A48]">{sub.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
             </div>
           </div>
        </div>

        <div id="subjects" className="py-32 relative bg-[#FDF7EC] border-t border-[#E8DAC4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <TextReveal text="Master the Curriculum" className="text-4xl md:text-5xl font-extrabold mb-6" />
              <p className="text-xl text-[#6B5A48]">Hover over any subject to view the core syllabus.</p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {curriculumSubjects.map((subject, index) => (
                <FlipCard key={index} subject={subject} />
              ))}
            </motion.div>
          </div>
        </div>

        <div className="py-24 relative overflow-hidden bg-[#F6EDDF] border-y border-[#E8DAC4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 relative z-10">
            <TextReveal text="Student Success Stories" className="text-4xl md:text-5xl font-extrabold mb-4" />
            <p className="text-xl text-[#6B5A48]">Join thousands of students who have transformed their engineering journey.</p>
          </div>

          <div className="relative w-full flex overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 z-10 pointer-events-none bg-gradient-to-r from-[#F6EDDF] to-transparent"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 z-10 pointer-events-none bg-gradient-to-l from-[#F6EDDF] to-transparent"></div>

            <motion.div 
              className="flex gap-6 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ ease: "linear", duration: 35, repeat: Infinity }}
            >
              {[...testimonials, ...testimonials].map((t, index) => (
                <div key={index} className="w-[350px] sm:w-[420px] bg-[#FDF7EC] p-8 rounded-3xl border border-[#E8DAC4] shadow-sm flex flex-col justify-between flex-shrink-0">
                  <div>
                    <div className="flex mb-4 gap-1">
                      {[...Array(5)].map((_, i) => {
                        if (t.rating >= i + 1) return <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />;
                        else if (t.rating >= i + 0.5) return <StarHalf key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />;
                        else return <Star key={i} className="w-5 h-5 text-[#E0D0B6]" />;
                      })}
                    </div>
                    <p className="leading-relaxed mb-6 italic text-[#6B5A48]">"{t.text}"</p>
                  </div>
                  <div className="flex items-center gap-4 border-t border-[#E8DAC4] pt-5">
                    <div className="w-12 h-12 rounded-full bg-orange-100/50 flex items-center justify-center text-orange-700 font-extrabold text-lg">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#3B2E22]">{t.name}</h4>
                      <p className="text-xs text-orange-600 font-bold">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="py-24 relative bg-[#FDF7EC]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <TextReveal text="Frequently Asked Questions" className="text-3xl md:text-5xl font-extrabold mb-4" />
              <p className="text-lg text-[#6B5A48]">Everything you need to know about the MathCom Mentors portal.</p>
            </div>
            <div className="rounded-3xl p-6 md:p-10 bg-[#F6EDDF] border border-[#E8DAC4] shadow-sm">
              <AnimatePresence>
                {visibleFaqs.map((faq, index) => (
                  <motion.div
                    key={index} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                  >
                    <FAQItem q={faq.q} a={faq.a} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {faqs.length > 4 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setShowAllFaqs(!showAllFaqs)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all border bg-[#FDF7EC] border-[#E8DAC4] text-orange-600 hover:bg-[#EDE0CC] shadow-sm"
                  >
                    {showAllFaqs ? 'Show Less' : 'Read More'}
                    <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${showAllFaqs ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div id="contact" className="py-24 relative overflow-hidden bg-[#F1E6D5] border-t border-[#E8DAC4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <TextReveal text="Let's Connect" className="text-4xl md:text-5xl font-extrabold mb-4" />
              <p className="text-lg text-[#6B5A48] max-w-2xl mx-auto">
                Have a question about the lectures or facing an issue with the portal? Drop us a message and we'll get back to you.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              <motion.div 
                initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="lg:col-span-2 space-y-6"
              >
                 <div className="p-8 rounded-3xl bg-[#FDF7EC] border border-[#E8DAC4] shadow-sm transition-transform hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-6">
                      <Mail className="w-7 h-7 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-[#3B2E22]">Email Us</h3>
                    <p className="mb-6 text-sm text-[#6B5A48]">Send us an email directly. We usually respond within 24 hours.</p>
                    <a href="mailto:mathcommentors@gmail.com" className="inline-flex items-center gap-2 text-orange-600 font-bold hover:text-orange-700 transition-colors">
                      mathcommentors@gmail.com <ArrowRight className="w-4 h-4" />
                    </a>
                 </div>

                 <div className="p-8 rounded-3xl bg-[#FDF7EC] border border-[#E8DAC4] shadow-sm transition-transform hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                      <Users className="w-7 h-7 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-[#3B2E22]">Join Community</h3>
                    <p className="mb-6 text-sm text-[#6B5A48]">Connect with thousands of students on our official channel.</p>
                    <a href="https://www.youtube.com/@MathComMentors" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-amber-600 font-bold hover:text-amber-700 transition-colors">
                      Visit YouTube <ArrowRight className="w-4 h-4" />
                    </a>
                 </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="lg:col-span-3 p-8 md:p-10 rounded-3xl bg-[#FDF7EC] border border-[#E8DAC4] shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-600"></div>

                <h3 className="text-2xl font-bold mb-8 text-[#3B2E22]">Send a Message</h3>

                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#7A6753]">Your Name</label>
                      <input 
                        type="text" required value={contactData.name} onChange={(e) => setContactData({...contactData, name: e.target.value})}
                        className="w-full px-5 py-4 rounded-xl border border-[#D8C5A6] focus:border-orange-600 focus:ring-1 focus:ring-orange-600 outline-none transition-all bg-[#F6EDDF] text-[#3B2E22]"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#7A6753]">Your Email</label>
                      <input 
                        type="email" required value={contactData.email} onChange={(e) => setContactData({...contactData, email: e.target.value})}
                        className="w-full px-5 py-4 rounded-xl border border-[#D8C5A6] focus:border-orange-600 focus:ring-1 focus:ring-orange-600 outline-none transition-all bg-[#F6EDDF] text-[#3B2E22]"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#7A6753]">Your Message</label>
                    <textarea 
                      required rows="5" value={contactData.message} onChange={(e) => setContactData({...contactData, message: e.target.value})}
                      className="w-full px-5 py-4 rounded-xl border border-[#D8C5A6] focus:border-orange-600 focus:ring-1 focus:ring-orange-600 outline-none transition-all resize-none bg-[#F6EDDF] text-[#3B2E22]"
                      placeholder="How can we help you today?"
                    ></textarea>
                  </div>
                  
                  <AnimatePresence>
                    {contactStatus.message && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
                        className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${contactStatus.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}
                      >
                        {contactStatus.isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                        {contactStatus.message}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button 
                    whileHover={{ scale: contactStatus.loading ? 1 : 1.02 }} whileTap={{ scale: contactStatus.loading ? 1 : 0.98 }}
                    type="submit" disabled={contactStatus.loading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-80 flex items-center justify-center gap-3 shadow-sm relative overflow-hidden"
                  >
                    {contactStatus.loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Sending Message...</>
                    ) : contactStatus.message && !contactStatus.isError ? (
                      <><CheckCircle className="w-5 h-5" /> Sent Successfully!</>
                    ) : (
                      <>Send Message <Send className="w-5 h-5" /></>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>

        <footer className="pt-16 pb-8 border-t bg-[#FDF7EC] border-[#E8DAC4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8 mb-16">
              
              <div className="md:col-span-12 lg:col-span-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-[#FDF7EC] rounded-lg flex items-center justify-center p-1 border border-[#E8DAC4]">
                    <img src="/mathcom-logo.png" alt="MathCom Mentors Logo" className="w-full h-full object-contain rounded-md" />
                  </div>
                  <span className="font-black text-xl tracking-tight text-[#3B2E22]">MathCom Mentors</span>
                </div>
                <p className="mb-6 font-medium leading-relaxed max-w-sm text-sm text-[#7A6753]">
                  Empowering B.Tech CSE students with high-quality, accessible education in Mathematics and Computer Science.
                </p>
                <a href="mailto:mathcommentors@gmail.com" className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-[#F6EDDF] border-[#E8DAC4] text-orange-600 hover:bg-[#EDE0CC] shadow-sm font-bold text-sm transition-all">
                  <Mail className="w-4 h-4" /> mathcommentors@gmail.com
                </a>
              </div>

              <div className="hidden lg:block lg:col-span-1"></div>

              <div className="md:col-span-6 lg:col-span-3">
                <h3 className="font-black text-sm mb-5 uppercase tracking-widest text-[#3B2E22]">Connect</h3>
                <div className="flex flex-col gap-3">
                  <motion.a whileHover={{ x: 5 }} href="https://facebook.com/MathComMentors" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-[#6B5A48] hover:text-orange-600 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#EDE0CC] text-[#7A6753]">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.891h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                    </div>
                    Facebook
                  </motion.a>

                  <motion.a whileHover={{ x: 5 }} href="https://linkedin.com/in/mathcom-mentors-6b8a94188" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-[#6B5A48] hover:text-orange-600 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#EDE0CC] text-[#7A6753]">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                    </div>
                    LinkedIn
                  </motion.a>
                  
                  <motion.a whileHover={{ x: 5 }} href="https://twitter.com/mathcom_mentors" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-[#6B5A48] hover:text-orange-600 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#EDE0CC] text-[#7A6753]">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 4.25H5.078z" /></svg>
                    </div>
                    Twitter (X)
                  </motion.a>

                  <motion.a whileHover={{ x: 5 }} href="https://instagram.com/mathcommentors" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-[#6B5A48] hover:text-orange-600 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#EDE0CC] text-[#7A6753]">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                    </div>
                    Instagram
                  </motion.a>
                  
                  <motion.a whileHover={{ x: 5 }} href="https://www.youtube.com/@MathComMentors" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-medium text-[#6B5A48] hover:text-orange-600 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#EDE0CC] text-[#7A6753]">
                      <PlayCircle className="w-3.5 h-3.5" />
                    </div>
                    YouTube
                  </motion.a>
                </div>
              </div>

              <div className="md:col-span-6 lg:col-span-3">
                <h3 className="font-black text-sm mb-5 uppercase tracking-widest text-[#3B2E22]">Developer</h3>
                <p className="text-xs font-medium mb-3 text-[#7A6753]">Designed & Built by</p>
                <motion.a 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  href="https://github.com/Rudragupta23" target="_blank" rel="noreferrer" 
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-[#FDF7EC] border-[#E8DAC4] hover:border-[#D8C5A6] text-[#3B2E22] text-sm transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  <span className="font-bold">Rudragupta23</span>
                </motion.a>
              </div>

            </div>

            <div className="pt-6 border-t border-[#E8DAC4] flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs font-semibold text-[#7A6753]">
                © {new Date().getFullYear()} MathCom Mentors by Dr. Goyal. All rights reserved.
              </p>
              <div className="flex gap-6 text-xs font-black uppercase tracking-widest">
                <Link to="/login" className="text-[#7A6753] hover:text-orange-600 transition-colors">Portal Login</Link>
              </div>
            </div>
          </div>
        </footer>

        <AnimatePresence>
          {showInstallModal && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#241A12]/55 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-md w-full p-8 rounded-3xl bg-[#FDF7EC] border border-[#E8DAC4] text-[#3B2E22] shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowInstallModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#EDE0CC] flex items-center justify-center font-bold text-[#7A6753] hover:text-[#3B2E22] transition-colors"
                >
                  ✕
                </button>

                <div className="w-16 h-16 bg-orange-100/50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                  <Smartphone className="w-8 h-8" />
                </div>

                <h3 className="text-2xl font-black mb-2">How to Install MathCom App</h3>
                <p className="text-sm mb-6 text-[#6B5A48]">
                  Follow these quick instructions based on your device:
                </p>

                <div className="space-y-4 text-left">
                  <div className="p-4 rounded-2xl bg-[#F6EDDF] border border-[#E8DAC4]">
                    <h4 className="font-bold text-orange-600 text-sm mb-1">iPhone / iPad (Safari)</h4>
                    <p className="text-xs text-[#6B5A48]">
                      Tap the <b>Share button</b> (square with an arrow) at the bottom of Safari, then scroll down and tap <b>"Add to Home Screen"</b>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F6EDDF] border border-[#E8DAC4]">
                    <h4 className="font-bold text-amber-600 text-sm mb-1">Android (Chrome)</h4>
                    <p className="text-xs text-[#6B5A48]">
                      Tap the 3 dots in the top-right corner of Chrome and select <b>"Install app"</b> or <b>"Add to Home screen"</b>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F6EDDF] border border-[#E8DAC4]">
                    <h4 className="font-bold text-rose-600 text-sm mb-1">Desktop (Chrome / Edge)</h4>
                    <p className="text-xs text-[#6B5A48]">
                      Click the small <b>Install icon</b> located on the right side of your browser URL address bar.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowInstallModal(false)}
                  className="w-full mt-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-colors shadow-sm"
                >
                  Got It!
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

export default HomePage;