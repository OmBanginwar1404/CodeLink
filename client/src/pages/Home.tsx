import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { Users, Plus, Zap, Code2, Sparkles, MessageSquare, Clock, History, ArrowRight, Sparkle, Terminal as TerminalIcon, ExternalLink, Search, Image as ImageIcon, Heart, UserPlus, UserCheck } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

interface Project {
    id: string;
    title: string;
    description: string;
    username: string;
    roomId: string;
    githubUrl?: string;
    demoUrl?: string;
    tags: string[];
    gradient: string;
    likes: number;
}

interface Developer {
    id: string;
    username: string;
    email: string;
    avatar: string;
    skills: string[];
    isFollowing: boolean;
    friendStatus: "none" | "sent" | "received" | "friends";
}

interface RecentRoom {
    id: string;
    lastAccessed: number;
}

const SEED_DEVELOPERS: Developer[] = [
    {
        id: "dev-1",
        username: "SarahReact",
        email: "sarah@react.dev",
        avatar: "SR",
        skills: ["React", "TypeScript", "TailwindCSS"],
        isFollowing: false,
        friendStatus: "none"
    },
    {
        id: "dev-2",
        username: "DavidPython",
        email: "david@python.org",
        avatar: "DP",
        skills: ["Python", "Django", "Machine Learning"],
        isFollowing: false,
        friendStatus: "received"
    },
    {
        id: "dev-3",
        username: "LinusC",
        email: "linus@kernel.org",
        avatar: "LC",
        skills: ["C", "C++", "Systems"],
        isFollowing: true,
        friendStatus: "friends"
    },
    {
        id: "dev-4",
        username: "GraceGrace",
        email: "grace@cobol.com",
        avatar: "GG",
        skills: ["Java", "SQL", "Spring Boot"],
        isFollowing: false,
        friendStatus: "none"
    }
];

const SEED_PROJECTS: Project[] = [
    {
        id: "1",
        title: "DrawSync Paintboard",
        description: "A collaborative real-time digital white-board allowing synchronized vector drawing, custom brushes, and canvas image exports.",
        username: "AlexDev",
        roomId: "draw-sync-room-101",
        githubUrl: "https://github.com",
        demoUrl: "https://drawsync.demo",
        tags: ["React", "TypeScript", "Canvas", "Socket.io"],
        gradient: "from-pink-500 to-rose-500",
        likes: 24
    },
    {
        id: "2",
        title: "AI Algorithm Visualizer",
        description: "Interactive visualization engine for sorting, pathfinding, and graph algorithms with speed control and AI explanations.",
        username: "SophiaCodes",
        roomId: "algo-visualizer-99",
        githubUrl: "https://github.com",
        demoUrl: "https://algovis.demo",
        tags: ["React", "Framer Motion", "Algorithms"],
        gradient: "from-indigo-500 to-purple-500",
        likes: 38
    },
    {
        id: "3",
        title: "CodeLink Chat Engine",
        description: "A lightweight, secure, and persistent collaborative chat service utilizing channels, emoji responses, and user tracking.",
        username: "MarcusTech",
        roomId: "chat-engine-room-abc",
        githubUrl: "https://github.com",
        demoUrl: "https://chatengine.demo",
        tags: ["Node.js", "Express", "MongoDB", "Socket.io"],
        gradient: "from-cyan-500 to-blue-500",
        likes: 19
    }
];

const Home = () => {
    const [roomId, setRoomId] = useState("");
    const [activeTab, setActiveTab] = useState<"join" | "recent" | "network">("join");
    const [recentRooms] = useState<RecentRoom[]>(() => {
        try {
            const stored = localStorage.getItem("recent_workspaces");
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    
    // Developer Network States
    const [developers, setDevelopers] = useState<Developer[]>(() => {
        try {
            const storedDevs = localStorage.getItem("codelink_developer_network");
            if (storedDevs) return JSON.parse(storedDevs);
            localStorage.setItem("codelink_developer_network", JSON.stringify(SEED_DEVELOPERS));
            return SEED_DEVELOPERS;
        } catch {
            return SEED_DEVELOPERS;
        }
    });
    const [devSearchQuery, setDevSearchQuery] = useState("");
    const [demoMode, setDemoMode] = useState<"sync" | "chat" | "ai" | "compiler">("sync");
    
    // Project Showcase States
    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const storedProjs = localStorage.getItem("codelink_showcase_projects");
            if (storedProjs) return JSON.parse(storedProjs);
            localStorage.setItem("codelink_showcase_projects", JSON.stringify(SEED_PROJECTS));
            return SEED_PROJECTS;
        } catch {
            return SEED_PROJECTS;
        }
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState("All");
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    
    // Modal Form States
    const [newProjTitle, setNewProjTitle] = useState("");
    const [newProjDesc, setNewProjDesc] = useState("");
    const [newProjRoom, setNewProjRoom] = useState("");
    const [newProjGithub, setNewProjGithub] = useState("");
    const [newProjDemo, setNewProjDemo] = useState("");
    const [newProjTags, setNewProjTags] = useState("");
    const [newProjGradient, setNewProjGradient] = useState("from-indigo-500 to-purple-500");
    
    // Typing Simulation state
    const [typedText, setTypedText] = useState("");
    
    // Chat Simulation state
    const [chatList, setChatList] = useState<Array<{ user: string; text: string }>>([]);
    
    // AI Assist Simulation state
    const [aiStep, setAiStep] = useState<"initial" | "scanning" | "optimized">("initial");
    
    // Compiler Simulation state
    const [compilerProgress, setCompilerProgress] = useState(0);
    const [compilerDone, setCompilerDone] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuth();

    // Mouse Spotlight Position
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 30, stiffness: 150, mass: 0.5 };
    const glowX = useSpring(mouseX, springConfig);
    const glowY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX - 250); // Offset by half of orb width
            mouseY.set(e.clientY - 250);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);



    const toggleFollow = (id: string) => {
        const updated = developers.map((d) => {
            if (d.id === id) {
                const nextState = !d.isFollowing;
                toast.success(nextState ? `Following ${d.username}` : `Unfollowed ${d.username}`);
                return { ...d, isFollowing: nextState };
            }
            return d;
        });
        setDevelopers(updated);
        localStorage.setItem("codelink_developer_network", JSON.stringify(updated));
    };

    const sendFriendRequest = (id: string) => {
        const updated = developers.map((d) => {
            if (d.id === id) {
                toast.success(`Friend request sent to ${d.username}`);
                return { ...d, friendStatus: "sent" as const };
            }
            return d;
        });
        setDevelopers(updated);
        localStorage.setItem("codelink_developer_network", JSON.stringify(updated));
    };

    const acceptFriendRequest = (id: string) => {
        const updated = developers.map((d) => {
            if (d.id === id) {
                toast.success(`You are now friends with ${d.username}!`);
                return { ...d, friendStatus: "friends" as const };
            }
            return d;
        });
        setDevelopers(updated);
        localStorage.setItem("codelink_developer_network", JSON.stringify(updated));
    };

    const declineFriendRequest = (id: string) => {
        const updated = developers.map((d) => {
            if (d.id === id) {
                toast.error(`Declined friend request from ${d.username}`);
                return { ...d, friendStatus: "none" as const };
            }
            return d;
        });
        setDevelopers(updated);
        localStorage.setItem("codelink_developer_network", JSON.stringify(updated));
    };

    const handlePublishProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjTitle.trim() || !newProjDesc.trim() || !newProjRoom.trim()) {
            toast.error("Title, Description, and Room ID are required!");
            return;
        }

        const tagsArray = newProjTags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0);

        const newProject: Project = {
            id: Date.now().toString(),
            title: newProjTitle.trim(),
            description: newProjDesc.trim(),
            username: user?.username || "Guest",
            roomId: newProjRoom.trim(),
            githubUrl: newProjGithub.trim() || undefined,
            demoUrl: newProjDemo.trim() || undefined,
            tags: tagsArray.length > 0 ? tagsArray : ["React"],
            gradient: newProjGradient,
            likes: 0
        };

        const updated = [newProject, ...projects];
        setProjects(updated);
        localStorage.setItem("codelink_showcase_projects", JSON.stringify(updated));
        
        // Reset form
        setNewProjTitle("");
        setNewProjDesc("");
        setNewProjRoom("");
        setNewProjGithub("");
        setNewProjDemo("");
        setNewProjTags("");
        setIsPublishModalOpen(false);
        toast.success("Project published successfully to showcase!");
    };

    const handleLikeProject = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = projects.map((p) => {
            if (p.id === id) {
                return { ...p, likes: p.likes + 1 };
            }
            return p;
        });
        setProjects(updated);
        localStorage.setItem("codelink_showcase_projects", JSON.stringify(updated));
        toast.success("Loved this project!");
    };

    const filteredProjects = projects.filter((p) => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag === "All" || p.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase());
        return matchesSearch && matchesTag;
    });

    const uniqueTags = ["All", ...Array.from(new Set(projects.flatMap(p => p.tags)))];

    // 1. Sync typing effect
    useEffect(() => {
        if (demoMode === "sync") {
            const timer = setTimeout(() => {
                setTypedText("");
            }, 0);
            let idx = 0;
            const textToType = "const doubleItems = items.map(i => i * 2);";
            const interval = setInterval(() => {
                if (idx < textToType.length) {
                    setTypedText((prev) => prev + textToType.charAt(idx));
                    idx++;
                } else {
                    clearInterval(interval);
                }
            }, 50);
            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [demoMode]);

    // 2. Chat popups effect
    useEffect(() => {
        if (demoMode === "chat") {
            const timer = setTimeout(() => {
                setChatList([]);
            }, 0);
            const msgs = [
                { user: "Alice", text: "Hey! Can we check line 5?" },
                { user: "Bob", text: "Sure! Let's refactor that map loop." },
                { user: "Alice", text: "Awesome, much cleaner now!" }
            ];
            let count = 0;
            const interval = setInterval(() => {
                if (count < msgs.length) {
                    setChatList((prev) => [...prev, msgs[count]]);
                    count++;
                } else {
                    clearInterval(interval);
                }
            }, 1000);
            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [demoMode]);

    // 3. AI rewrite sequence
    useEffect(() => {
        if (demoMode === "ai") {
            const timer = setTimeout(() => {
                setAiStep("initial");
            }, 0);
            const t1 = setTimeout(() => setAiStep("scanning"), 1000);
            const t2 = setTimeout(() => setAiStep("optimized"), 2500);
            return () => {
                clearTimeout(timer);
                clearTimeout(t1);
                clearTimeout(t2);
            };
        }
    }, [demoMode]);

    // 4. Compiler sequence
    useEffect(() => {
        if (demoMode === "compiler") {
            const timer = setTimeout(() => {
                setCompilerProgress(0);
                setCompilerDone(false);
            }, 0);
            const interval = setInterval(() => {
                setCompilerProgress((p) => {
                    if (p >= 100) {
                        clearInterval(interval);
                        setCompilerDone(true);
                        return 100;
                    }
                    return p + 10;
                });
            }, 80);
            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [demoMode]);

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId.trim()) {
            toast.error("Room ID is required");
            return;
        }
        
        navigate("/editor", {
            state: {
                roomId,
                username: user?.username
            }
        });
    };

    const createNewRoom = () => {
        const newRoomId = crypto.randomUUID();
        setRoomId(newRoomId);
        toast.success("Created a new room!");
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans selection:bg-indigo-500/30 transition-colors duration-300">
            <Navbar />

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Animated Ambient Gradients */}
                <motion.div 
                    animate={{ x: [0, 50, -50, 0], y: [0, -50, 50, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" 
                />
                <motion.div 
                    animate={{ x: [0, -50, 50, 0], y: [0, 50, -50, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[120px] pointer-events-none" 
                />
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] pointer-events-none" 
                />

                {/* Mouse Tracking Spotlight */}
                <motion.div 
                    style={{ x: glowX, y: glowY }}
                    className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/5 blur-[100px] pointer-events-none z-0 hidden md:block"
                />

                <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center z-10">
                    {/* Left: Copy & Value Prop */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-8 text-center lg:text-left pt-12 lg:pt-0"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Now with real-time AI assistance</span>
                        </motion.div>
                        
                        <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                            Code seamlessly <br />
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                without boundaries.
                            </span>
                        </h1>
                        
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto lg:mx-0">
                            CodeLink is a blazing fast, real-time collaborative code editor built for modern development teams. Write, execute, and discuss code together instantly.
                        </p>

                        {/* Interactive Feature Selectors */}
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                            {(
                                [
                                    { id: "sync", label: "Sync", icon: Zap, color: "text-yellow-500 dark:text-yellow-400" },
                                    { id: "chat", label: "Chat", icon: MessageSquare, color: "text-emerald-500 dark:text-emerald-400" },
                                    { id: "ai", label: "AI Assist", icon: Sparkles, color: "text-indigo-500 dark:text-indigo-400" },
                                    { id: "compiler", label: "Compiler", icon: TerminalIcon, color: "text-sky-500 dark:text-sky-400" }
                                ] as Array<{ id: "sync" | "chat" | "ai" | "compiler"; label: string; icon: typeof Zap; color: string }>
                            ).map((f) => {
                                const Icon = f.icon;
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => setDemoMode(f.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${demoMode === f.id ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-950 dark:border-white shadow-lg' : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:text-zinc-905 dark:hover:text-white'}`}
                                    >
                                        <Icon className={`w-3.5 h-3.5 ${demoMode === f.id ? 'text-indigo-500' : f.color}`} />
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Interactive Live Mockup Editor Box */}
                        <div className="w-full max-w-xl bg-white/60 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl relative">
                            {/* Window Header */}
                            <div className="h-9 bg-zinc-100/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 ml-2 font-mono">sandbox.js</span>
                                </div>
                                <div className="text-[10px] text-zinc-505 dark:text-zinc-450 font-medium">Vite Server Active</div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex h-56 font-mono text-[11px] relative overflow-hidden">
                                
                                {/* Lines & Editor Body */}
                                <div className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-300 leading-relaxed overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        {demoMode === "sync" && (
                                            <motion.div
                                                key="sync"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                <span className="text-zinc-400 dark:text-zinc-600">1</span> <span className="text-pink-600 dark:text-pink-400 font-bold">const</span> items = [1, 2, 3, 4];<br />
                                                <span className="text-zinc-400 dark:text-zinc-600">2</span> <span className="text-pink-600 dark:text-pink-400 font-bold">const</span> multiply = () =&gt; &#123;<br />
                                                <span className="text-zinc-400 dark:text-zinc-600">3</span>   <span className="text-zinc-600 dark:text-zinc-400">{typedText}</span>
                                                <span className="w-1.5 h-3 bg-indigo-500 animate-pulse inline-block ml-0.5" />
                                                <span className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1 py-0.5 rounded text-[8px] absolute ml-2 -mt-1 font-semibold border border-indigo-500/30 animate-pulse">Alice</span><br />
                                                <span className="text-zinc-400 dark:text-zinc-600">4</span> &#125;;
                                            </motion.div>
                                        )}

                                        {demoMode === "chat" && (
                                            <motion.div
                                                key="chat"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex h-full"
                                            >
                                                {/* Code Panel */}
                                                <div className="flex-1">
                                                    <span className="text-zinc-400 dark:text-zinc-650">1</span> <span className="text-pink-600 dark:text-pink-400 font-bold">function</span> cleanUp() &#123;<br />
                                                    <span className="text-zinc-400 dark:text-zinc-650">2</span>   <span className="text-zinc-550 dark:text-zinc-500">// Check variables</span><br />
                                                    <span className="text-zinc-400 dark:text-zinc-650">3</span>   <span className="text-pink-600 dark:text-pink-400 font-bold">return</span> true;<br />
                                                    <span className="text-zinc-400 dark:text-zinc-650">4</span> &#125;
                                                </div>
                                                
                                                {/* Chat Drawer */}
                                                <div className="w-44 border-l border-zinc-200 dark:border-white/5 bg-zinc-100/50 dark:bg-zinc-900/30 p-2 flex flex-col gap-1.5 justify-end">
                                                    {chatList.map((c, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-1.5 rounded-lg text-[9px]"
                                                        >
                                                            <span className="font-semibold text-indigo-650 dark:text-indigo-400">{c.user}: </span>
                                                            <span className="text-zinc-700 dark:text-zinc-300">{c.text}</span>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {demoMode === "ai" && (
                                            <motion.div
                                                key="ai"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                {aiStep === "initial" && (
                                                    <div>
                                                        <span className="text-zinc-400 dark:text-zinc-650">1</span> <span className="text-pink-655 dark:text-pink-400 font-bold">function</span> double(arr) &#123;<br />
                                                        <span className="text-zinc-400 dark:text-zinc-650">2</span>   <span className="text-pink-655 dark:text-pink-400 font-bold">let</span> res = [];<br />
                                                        <span className="text-zinc-400 dark:text-zinc-650">3</span>   <span className="text-pink-655 dark:text-pink-400 font-bold">for</span>(<span className="text-pink-655 dark:text-pink-400 font-bold">let</span> i=0; i&lt;arr.length; i++) &#123;<br />
                                                        <span className="text-zinc-400 dark:text-zinc-650">4</span>     res.push(arr[i] * 2);<br />
                                                        <span className="text-zinc-400 dark:text-zinc-650">5</span>   &#125;<br />
                                                        <span className="text-zinc-400 dark:text-zinc-650">6</span>   <span className="text-pink-655 dark:text-pink-400 font-bold">return</span> res;<br />
                                                        <span className="text-zinc-400 dark:text-zinc-650">7</span> &#125;
                                                    </div>
                                                )}
                                                {aiStep === "scanning" && (
                                                    <div className="relative">
                                                        <span className="text-zinc-400 dark:text-zinc-650">1</span> <span className="text-pink-655 dark:text-pink-400 font-bold">function</span> double(arr) &#123;<br />
                                                        <div className="bg-indigo-500/10 dark:bg-indigo-500/10 border-y border-indigo-500/20 py-0.5">
                                                            <span className="text-zinc-400 dark:text-zinc-650">2</span>   <span className="text-pink-655 dark:text-pink-400 font-bold">let</span> res = [];<br />
                                                            <span className="text-zinc-400 dark:text-zinc-650">3</span>   <span className="text-pink-655 dark:text-pink-400 font-bold">for</span>(<span className="text-pink-655 dark:text-pink-400 font-bold">let</span> i=0; i&lt;arr.length; i++) &#123;<br />
                                                            <span className="text-zinc-400 dark:text-zinc-650">4</span>     res.push(arr[i] * 2);<br />
                                                            <span className="text-zinc-400 dark:text-zinc-650">5</span>   &#125;<br />
                                                        </div>
                                                        <span className="text-zinc-400 dark:text-zinc-650">6</span>   <span className="text-pink-655 dark:text-pink-400 font-bold">return</span> res;<br />
                                                        <span className="text-zinc-400 dark:text-zinc-650">7</span> &#125;
                                                        <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[0.5px] flex items-center justify-center">
                                                            <span className="bg-indigo-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full animate-bounce flex items-center gap-1">
                                                                <Sparkle className="w-2.5 h-2.5 animate-spin" /> AI Analyzing...
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {aiStep === "optimized" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-indigo-650 dark:text-indigo-305"
                                                    >
                                                        <span className="text-zinc-400 dark:text-zinc-600">1</span> <span className="text-zinc-550 dark:text-zinc-500">// AI Suggestion: Applied!</span><br />
                                                        <span className="text-zinc-400 dark:text-zinc-600">2</span> <span className="text-pink-655 dark:text-pink-400 font-bold">const</span> double = (arr) =&gt; arr.map(i =&gt; i * 2);
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )}

                                        {demoMode === "compiler" && (
                                            <motion.div
                                                key="compiler"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col h-full justify-between"
                                            >
                                                <div>
                                                    <span className="text-zinc-400 dark:text-zinc-600">1</span> console.log(<span className="text-emerald-600 dark:text-emerald-400 font-bold">"Starting production build..."</span>);<br />
                                                    <span className="text-zinc-400 dark:text-zinc-600">2</span> console.log(<span className="text-emerald-600 dark:text-emerald-400 font-bold">"Compiled successfully!"</span>);
                                                </div>

                                                <div className="border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950 p-2.5 font-mono text-[9px] text-zinc-500 dark:text-zinc-400 min-h-[80px]">
                                                    {!compilerDone ? (
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <span>Executing environment...</span>
                                                                <span>{compilerProgress}%</span>
                                                            </div>
                                                            <div className="w-full bg-zinc-200 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                                                                <div className="bg-indigo-500 h-full transition-all duration-75" style={{ width: `${compilerProgress}%` }} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-emerald-650 dark:text-emerald-400 space-y-1">
                                                            <div>$ node main.js</div>
                                                            <div>[SYSTEM] Starting production build...</div>
                                                            <div>[SYSTEM] Compiled successfully!</div>
                                                            <div className="text-zinc-450 dark:text-zinc-500">Process completed with status 0.</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Dashboard/Action Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
                        <motion.div 
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="relative bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {user ? (
                                <div className="flex flex-col h-full">
                                    {/* Tabs */}
                                    <div className="flex border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 relative">
                                        <button 
                                            onClick={() => setActiveTab("join")}
                                            className={`flex-1 py-4 text-xs font-semibold transition-colors relative z-10 ${activeTab === 'join' ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 hover:text-zinc-805 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Code2 className="w-3.5 h-3.5" />
                                                Join / Create
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab("recent")}
                                            className={`flex-1 py-4 text-xs font-semibold transition-colors relative z-10 ${activeTab === 'recent' ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 hover:text-zinc-805 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                <History className="w-3.5 h-3.5" />
                                                Recent
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab("network")}
                                            className={`flex-1 py-4 text-xs font-semibold transition-colors relative z-10 ${activeTab === 'network' ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 hover:text-zinc-805 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" />
                                                Network
                                            </div>
                                        </button>
                                        
                                        {/* Shared sliding active indicator */}
                                        <motion.div 
                                            layoutId="activeTabIndicator"
                                            className="absolute bottom-0 h-[2px] bg-indigo-500"
                                            style={{ 
                                                left: activeTab === "join" ? "0%" : activeTab === "recent" ? "33.3%" : "66.6%",
                                                width: "33.3%"
                                            }}
                                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        />
                                    </div>

                                    <div className="p-8">
                                        <AnimatePresence mode="wait">
                                            {activeTab === "join" ? (
                                                <motion.div 
                                                    key="join"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="space-y-6"
                                                >
                                                    <div className="text-center mb-6">
                                                        <h2 className="text-2xl font-semibold">Join Workspace</h2>
                                                        <p className="text-sm text-zinc-550 dark:text-zinc-400 mt-1">Enter a room ID to start coding</p>
                                                    </div>

                                                    <form onSubmit={joinRoom} className="space-y-4">
                                                        <Input
                                                            type="text"
                                                            value={roomId}
                                                            onChange={(e) => setRoomId(e.target.value)}
                                                            placeholder="Room ID (e.g. 550e8400...)"
                                                            className="font-mono text-center"
                                                        />
                                                        <Button type="submit" fullWidth>
                                                            <Users className="w-4 h-4 mr-2" />
                                                            Join Room
                                                        </Button>
                                                    </form>

                                                    <div className="relative py-2">
                                                        <div className="absolute inset-0 flex items-center">
                                                            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                                                        </div>
                                                        <div className="relative flex justify-center text-xs">
                                                            <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">Or start fresh</span>
                                                        </div>
                                                    </div>

                                                    <Button 
                                                        variant="secondary" 
                                                        fullWidth 
                                                        onClick={createNewRoom}
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Create New Room
                                                    </Button>
                                                </motion.div>
                                            ) : activeTab === "recent" ? (
                                                <motion.div 
                                                    key="recent"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="space-y-4 min-h-[300px]"
                                                >
                                                    {recentRooms.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                                            <Clock className="w-12 h-12 text-zinc-400 dark:text-zinc-700 mb-4" />
                                                            <p className="text-zinc-550 dark:text-zinc-400">No recent workspaces</p>
                                                            <p className="text-sm text-zinc-450 dark:text-zinc-600 mt-1">Rooms you join will appear here</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {recentRooms.map((room) => (
                                                                <button
                                                                    key={room.id}
                                                                    onClick={() => navigate("/editor", { state: { roomId: room.id, username: user?.username } })}
                                                                    className="w-full text-left p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all group flex items-center justify-between cursor-pointer"
                                                                >
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Code2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                                                            <span className="font-mono text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                                                                                {room.id}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-zinc-500">
                                                                            Last accessed: {new Date(room.lastAccessed).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <ArrowRight className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="network"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="space-y-5 min-h-[300px]"
                                                >
                                                    {/* Skill Search bar */}
                                                    <div className="relative">
                                                        <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                        <input
                                                            type="text"
                                                            value={devSearchQuery}
                                                            onChange={(e) => setDevSearchQuery(e.target.value)}
                                                            placeholder="Search devs by skill (e.g. React)..."
                                                            className="w-full bg-white/80 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 text-xs py-2.5 pl-9 pr-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                                        />
                                                    </div>

                                                    {/* Pending Requests */}
                                                    {developers.some((d) => d.friendStatus === "received") && (
                                                        <div className="space-y-2">
                                                            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Friend Requests</div>
                                                            {developers.filter((d) => d.friendStatus === "received").map((d) => (
                                                                <div key={d.id} className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-center justify-between gap-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-500 dark:text-indigo-300">
                                                                            {d.avatar}
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">@{d.username}</div>
                                                                            <div className="text-[9px] text-zinc-500 truncate max-w-[120px]">{d.skills.join(", ")}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-1.5">
                                                                        <button 
                                                                            onClick={() => acceptFriendRequest(d.id)}
                                                                            className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => declineFriendRequest(d.id)}
                                                                            className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg text-[9px] font-bold transition-colors cursor-pointer"
                                                                        >
                                                                            Decline
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Suggested Developers List */}
                                                    <div className="space-y-2">
                                                        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Suggested Developers</div>
                                                        <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                                                            {developers
                                                                .filter((d) => {
                                                                    if (devSearchQuery.trim() === "") return true;
                                                                    return d.skills.some(s => s.toLowerCase().includes(devSearchQuery.toLowerCase())) ||
                                                                           d.username.toLowerCase().includes(devSearchQuery.toLowerCase());
                                                                })
                                                                .map((d) => (
                                                                    <div key={d.id} className="p-3 bg-white/40 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/50 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-800 transition-colors">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center font-bold text-xs text-zinc-500 dark:text-zinc-400">
                                                                                {d.avatar}
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">@{d.username}</div>
                                                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                                                    {d.skills.slice(0, 2).map((s) => (
                                                                                        <span key={s} className="text-[8px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 px-1 rounded">
                                                                                            {s}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            {/* Friend Button */}
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (d.friendStatus === "none") sendFriendRequest(d.id);
                                                                                }}
                                                                                disabled={d.friendStatus !== "none"}
                                                                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${d.friendStatus === "friends" ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : d.friendStatus === "sent" ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                                                                                title={d.friendStatus === "friends" ? "Friends" : d.friendStatus === "sent" ? "Request Sent" : "Add Friend"}
                                                                            >
                                                                                {d.friendStatus === "friends" ? (
                                                                                    <UserCheck className="w-3.5 h-3.5" />
                                                                                ) : (
                                                                                    <UserPlus className="w-3.5 h-3.5" />
                                                                                )}
                                                                            </button>

                                                                            {/* Follow Button */}
                                                                            <button
                                                                                onClick={() => toggleFollow(d.id)}
                                                                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${d.isFollowing ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                                                                            >
                                                                                {d.isFollowing ? "Following" : "Follow"}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-6 py-8">
                                    <div className="w-16 h-16 mx-auto bg-zinc-105 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-700 shadow-inner">
                                        <Users className="w-8 h-8 text-indigo-505 dark:text-indigo-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">Start Collaborating</h2>
                                    <p className="text-sm text-zinc-550 dark:text-zinc-400 px-4 leading-relaxed">
                                        Sign in to create workspaces, invite your team, and write code together in real-time.
                                    </p>
                                    <div className="pt-4">
                                        <Button fullWidth onClick={() => navigate("/login")}>
                                            Sign In to Continue
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Community Showcase Hub */}
                <div className="w-full max-w-5xl mt-32 z-10 px-4 sm:px-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="space-y-3 text-left">
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Explore Creations</span>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Developer Showcase</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">
                                Explore collaborative projects designed, written, and compiled inside CodeLink. Join rooms to build on top of their work!
                            </p>
                        </div>
                        
                        <Button 
                            onClick={() => {
                                if (!user) {
                                    toast.error("Please sign in to share your creation!");
                                    navigate("/login");
                                    return;
                                }
                                setIsPublishModalOpen(true);
                            }}
                            className="shrink-0 self-start md:self-end"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Share Your Work
                        </Button>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/75 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-2xl p-4 mb-8 backdrop-blur-xl shadow-md">
                        {/* Search */}
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="w-4 h-4 text-zinc-405 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-905 dark:text-zinc-300 text-xs py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
                            />
                        </div>

                        {/* Tag Badges */}
                        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
                            {uniqueTags.slice(0, 6).map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors shrink-0 cursor-pointer ${selectedTag === tag ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-305' : 'bg-white dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Showcase Grid */}
                    <motion.div 
                        layout
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredProjects.length === 0 ? (
                            <div className="col-span-full py-16 text-center bg-zinc-100 dark:bg-zinc-900/20 border border-zinc-200 dark:border-white/5 rounded-3xl">
                                <ImageIcon className="w-12 h-12 text-zinc-400 dark:text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-600 dark:text-zinc-400 font-medium">No creations match your filter</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-650 mt-1">Be the first to publish a project using this tech!</p>
                            </div>
                        ) : (
                            filteredProjects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    layout
                                    whileHover={{ y: -6 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 flex flex-col h-full group"
                                >
                                    {/* Cover Visual */}
                                    <div className={`h-40 bg-gradient-to-tr ${project.gradient} p-6 flex flex-col justify-between relative overflow-hidden shrink-0`}>
                                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none" />
                                        <div className="flex justify-between items-start z-10">
                                            <span className="text-[10px] bg-zinc-950/60 backdrop-blur-md text-zinc-300 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                                                @{project.username}
                                            </span>
                                            
                                            <button 
                                                onClick={(e) => handleLikeProject(project.id, e)}
                                                className="w-7 h-7 rounded-full bg-zinc-950/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-rose-400 hover:scale-115 transition-transform cursor-pointer"
                                                title="Love Project"
                                            >
                                                <Heart className="w-3.5 h-3.5 fill-rose-400" />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-end z-10">
                                            <span className="text-white text-xs font-bold drop-shadow-md">
                                                {project.likes} Hearts
                                            </span>
                                            
                                            <div className="flex gap-1.5">
                                                {project.githubUrl && (
                                                    <a 
                                                        href={project.githubUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-7 h-7 rounded-lg bg-zinc-950/60 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                                                        title="GitHub Repo"
                                                    >
                                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                        </svg>
                                                    </a>
                                                )}
                                                {project.demoUrl && (
                                                    <a 
                                                        href={project.demoUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-7 h-7 rounded-lg bg-zinc-950/60 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                                                        title="Live Demo"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                                        <div className="space-y-3 text-left">
                                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                                                {project.title}
                                            </h3>
                                            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed line-clamp-3">
                                                {project.description}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Tech Stack Tags */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {project.tags.map((tag) => (
                                                    <span 
                                                        key={tag}
                                                        className="text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50 px-2 py-0.5 rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Action Button */}
                                            <Button 
                                                fullWidth 
                                                variant="secondary"
                                                onClick={() => navigate("/editor", { state: { roomId: project.roomId, username: user?.username || `Guest_${Math.floor(Math.random() * 1000)}` } })}
                                                className="text-xs h-9"
                                            >
                                                <Users className="w-3.5 h-3.5 mr-2" />
                                                Join Collaborative Room
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </div>

                {/* Publish Project Modal */}
                <AnimatePresence>
                    {isPublishModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            {/* Overlay */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsPublishModalOpen(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            {/* Modal Box */}
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] z-10"
                            >
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Share Your Creation</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-550 mt-1">Publish your CodeLink workspace to the global feed</p>
                                </div>

                                <form onSubmit={handlePublishProject} className="space-y-4 text-left">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Project Title</label>
                                        <Input
                                            type="text"
                                            value={newProjTitle}
                                            onChange={(e) => setNewProjTitle(e.target.value)}
                                            placeholder="e.g. Collaborative Drawing Canvas"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Description</label>
                                        <textarea
                                            value={newProjDesc}
                                            onChange={(e) => setNewProjDesc(e.target.value)}
                                            placeholder="Briefly describe what your app does and how the team co-built it..."
                                            required
                                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300 text-xs p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-20 resize-none transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Showcase Room ID</label>
                                            <Input
                                                type="text"
                                                value={newProjRoom}
                                                onChange={(e) => setNewProjRoom(e.target.value)}
                                                placeholder="e.g. test-room"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Tech Tags (comma sep.)</label>
                                            <Input
                                                type="text"
                                                value={newProjTags}
                                                onChange={(e) => setNewProjTags(e.target.value)}
                                                placeholder="React, MongoDB, Node"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">GitHub Repo Link</label>
                                            <Input
                                                type="url"
                                                value={newProjGithub}
                                                onChange={(e) => setNewProjGithub(e.target.value)}
                                                placeholder="https://github.com/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Live Demo Link</label>
                                            <Input
                                                type="url"
                                                value={newProjDemo}
                                                onChange={(e) => setNewProjDemo(e.target.value)}
                                                placeholder="https://my-app.vercel.app"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Choose Cover Theme</label>
                                        <div className="flex gap-2.5">
                                            {[
                                                { id: "from-indigo-500 to-purple-500", name: "Indigo" },
                                                { id: "from-pink-500 to-rose-500", name: "Rose" },
                                                { id: "from-cyan-500 to-blue-500", name: "Blue" },
                                                { id: "from-emerald-500 to-teal-500", name: "Teal" }
                                            ].map((theme) => (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => setNewProjGradient(theme.id)}
                                                    className={`flex-1 h-9 rounded-xl bg-gradient-to-tr ${theme.id} border-2 text-[10px] font-bold text-white flex items-center justify-center shadow-lg transition-transform cursor-pointer ${newProjGradient === theme.id ? 'border-white scale-105' : 'border-transparent opacity-80'}`}
                                                >
                                                    {theme.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            fullWidth 
                                            onClick={() => setIsPublishModalOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" fullWidth>
                                            Publish Project
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Home;