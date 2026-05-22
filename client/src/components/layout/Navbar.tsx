import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, User as UserIcon, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsDropdownOpen(false);
        logout();
        navigate("/login");
        toast.success("Logged out successfully");
    };

    return (
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
                {/* Glowing Outer Logo Container */}
                <div className="relative shrink-0">
                    {/* Backglow blur effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur-[8px] opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Actual Logo Icon Box */}
                    <div className="relative w-9 h-9 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl flex items-center justify-center shadow-lg dark:shadow-2xl transition-transform duration-300 group-hover:scale-105 group-hover:border-indigo-500/30 overflow-hidden">
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
                        
                        {/* Premium Interlocking Code brackets & Link SVG */}
                        <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors duration-300 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {/* Left stylized loop (a bracket '<') */}
                            <path d="M8 17L3 12L8 7" />
                            {/* Right stylized loop (a bracket '>') */}
                            <path d="M16 7L21 12L16 17" />
                            {/* Pulsing Interlocking Node */}
                            <path d="M10 12a3 3 0 0 1 4 0" strokeDasharray="1.5 1.5" />
                            <circle cx="12" cy="12" r="1.5" fill="currentColor" className="animate-pulse" />
                        </svg>
                    </div>
                </div>

                {/* Premium Text Logo with Gradient Clip */}
                <span className="font-black tracking-tight text-zinc-900 dark:text-white text-base sm:text-lg flex items-center">
                    Code
                    <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent ml-0.5 font-black group-hover:opacity-90 transition-opacity">
                        Link
                    </span>
                </span>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Beautiful Sun/Moon Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 shadow-sm relative overflow-hidden group"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <motion.div
                        initial={false}
                        animate={{ 
                            rotate: theme === 'dark' ? 0 : 90, 
                            scale: theme === 'dark' ? 1 : 0,
                            opacity: theme === 'dark' ? 1 : 0 
                        }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="absolute"
                    >
                        <Moon className="w-4 h-4 text-indigo-400" />
                    </motion.div>
                    <motion.div
                        initial={false}
                        animate={{ 
                            rotate: theme === 'light' ? 0 : -90, 
                            scale: theme === 'light' ? 1 : 0,
                            opacity: theme === 'light' ? 1 : 0
                        }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="absolute"
                    >
                        <Sun className="w-4 h-4 text-amber-500" />
                    </motion.div>
                </button>

                {user ? (
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-full transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-900/20">
                                {user.username?.charAt(0).toUpperCase()}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                                >
                                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 text-left">
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user.username}</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <button 
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors text-left"
                                            onClick={() => { setIsDropdownOpen(false); navigate("/"); }}
                                        >
                                            <LayoutDashboard className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                            Dashboard
                                        </button>
                                        <button 
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white transition-colors text-left"
                                            onClick={() => { setIsDropdownOpen(false); navigate("/profile"); }}
                                        >
                                            <UserIcon className="w-4 h-4 text-purple-550 dark:text-purple-400" />
                                            My Profile
                                        </button>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex gap-3 items-center">
                        <button onClick={() => navigate("/login")} className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                            Sign In
                        </button>
                        <button onClick={() => navigate("/register")} className="text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-4 py-1.5 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 shadow-md shadow-zinc-950/20 dark:shadow-none cursor-pointer">
                            Get Started
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

