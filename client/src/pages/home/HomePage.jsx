import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  ArrowRight, 
  BookOpen, 
  Cpu, 
  Network, 
  Video, 
  Mail, 
  HeartHandshake
} from 'lucide-react';

const HomePage = () => {
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
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">
                MathCom <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Mentors</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 font-medium">
              <a href="#about" className="text-slate-400 hover:text-white transition-colors">About Series</a>
              <a href="#subjects" className="text-slate-400 hover:text-white transition-colors">Subjects</a>
              <a 
                href="https://www.youtube.com/@MathComMentors" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-colors"
              >
                <Video className="w-5 h-5" />
                <span>Watch Lectures</span>
              </a>
            </div>

            <div>
              <Link to="/login">
                <button className="bg-white hover:bg-slate-100 text-slate-900 px-7 py-2.5 rounded-full font-bold transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  Portal Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-48 sm:pb-32 flex items-center justify-center min-h-screen">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen"></div>

        <motion.div 
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-indigo-300 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Welcome to Dr. Vikas Goyal's Online Video Series
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
            Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">Engineering</span> <br/>
            From Anywhere.
          </motion.h1>
          
          <motion.p variants={fadeUp} className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed">
            Learn all basic concepts from A to Z of Engineering Mathematics, Discrete Mathematics, and core B.Tech CSE Subjects. Completely free for those who need it most.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <a 
              href="https://www.youtube.com/@MathComMentors" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1"
            >
              <Video className="w-5 h-5" />
              Start Learning Now
            </a>
            
            <Link to="/login" className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg text-white border border-slate-700 bg-slate-800/30 hover:bg-slate-800 transition-all hover:-translate-y-1">
              Student Portal <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Mission Section */}
      <div id="about" className="py-24 bg-[#0F172A] border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-10 md:p-16 rounded-3xl border border-slate-700/50"
          >
            <HeartHandshake className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-xl text-slate-300 leading-relaxed italic">
              "These Online Classes are started especially for those students who can't come for classes or tuitions & for those who can't afford to go to coaching Classes. All I need is your Support & engagement with us. So I can help you more achieving best in your sessionals & semester exams."
            </p>
            <p className="mt-8 text-indigo-400 font-semibold text-lg">— Dr. Vikas Goyal</p>
          </motion.div>
        </div>
      </div>

      {/* Subjects Section */}
      <div id="subjects" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Master the Curriculum</h2>
            <p className="text-xl text-slate-400">Comprehensive coverage of crucial B.Tech CSE subjects.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Card 1 */}
            <div className="group bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50 hover:border-indigo-500/50 transition-all hover:bg-slate-800/50 hover:-translate-y-2">
              <div className="bg-indigo-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calculator className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Engineering Math</h3>
              <p className="text-slate-400 leading-relaxed">Deep dives into the foundational mathematics required for advanced engineering concepts.</p>
            </div>

            {/* Card 2 */}
            <div className="group bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50 hover:border-violet-500/50 transition-all hover:bg-slate-800/50 hover:-translate-y-2">
              <div className="bg-violet-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Discrete Math & SMCS</h3>
              <p className="text-slate-400 leading-relaxed">Essential logic, set theory, and statistical modeling for computer science students.</p>
            </div>

            {/* Card 3 */}
            <div className="group bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50 hover:border-cyan-500/50 transition-all hover:bg-slate-800/50 hover:-translate-y-2">
              <div className="bg-cyan-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Automata Theory</h3>
              <p className="text-slate-400 leading-relaxed">Master the theory of computation, finite automata, and formal languages.</p>
            </div>

            {/* Card 4 */}
            <div className="group bg-slate-800/30 p-8 rounded-3xl border border-slate-700/50 hover:border-emerald-500/50 transition-all hover:bg-slate-800/50 hover:-translate-y-2">
              <div className="bg-emerald-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Network className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Data Structures</h3>
              <p className="text-slate-400 leading-relaxed">Build efficient algorithms and understand core data structures for problem-solving.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Beautiful Footer */}
      <footer className="bg-[#050810] pt-20 pb-10 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Brand Column */}
            <div className="md:col-span-5 lg:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white">MathCom Mentors</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                Empowering B.Tech CSE students with high-quality, accessible education in Mathematics and Computer Science.
              </p>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-5 h-5 text-indigo-400" />
                <a href="mailto:mathcommentors@gmail.com" className="hover:text-white transition-colors">
                  mathcommentors@gmail.com
                </a>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-4"></div> {/* Spacer */}

            {/* Quick Links */}
            <div className="md:col-span-5 lg:col-span-4">
              <h3 className="text-white font-bold text-lg mb-6">Connect With Us</h3>
              <div className="flex flex-col gap-4">
                <a 
                  href="https://facebook.com/MathComMentors" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-400 hover:text-[#1877F2] transition-colors flex items-center gap-3"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-700"></span> Facebook
                </a>
                <a 
                  href="https://linkedin.com/in/mathcom-mentors-6b8a94188" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-400 hover:text-[#0A66C2] transition-colors flex items-center gap-3"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-700"></span> LinkedIn
                </a>
                <a 
                  href="https://twitter.com/mathcom_mentors" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-3"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-700"></span> Twitter (X)
                </a>
                <a 
                  href="https://instagram.com/mathcommentors" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-slate-400 hover:text-[#E4405F] transition-colors flex items-center gap-3"
                >
                  <span className="w-2 h-2 rounded-full bg-slate-700"></span> Instagram
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} MathCom Mentors by Dr. Vikas Goyal. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link to="/login" className="hover:text-white transition-colors">Portal Login</Link>
              <a href="https://www.youtube.com/@MathComMentors" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">YouTube</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;