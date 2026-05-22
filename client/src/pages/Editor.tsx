import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import EditorComponent from "@monaco-editor/react";
import { io, Socket } from "socket.io-client";
import { Terminal, Play, Sparkles, Copy, LogOut, Code2, X, Menu, MessageSquare, ChevronDown, Download, Loader2, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/editor/Sidebar";
import { ChatPanel } from "../components/editor/ChatPanel";
import { Button } from "../components/ui/Button";
import { useTheme } from "../hooks/useTheme";

const LANGUAGES = {
    javascript: { name: "JavaScript", version: "18.15.0" },
    python: { name: "Python", version: "3.10.0" },
    java: { name: "Java", version: "15.0.2" },
    cpp: { name: "C++", version: "10.2.0" },
    go: { name: "Go", version: "1.16.2" },
    rust: { name: "Rust", version: "1.68.2" }
} as const;

type SupportedLanguage = keyof typeof LANGUAGES;

const CODE_SNIPPETS: Record<SupportedLanguage, string> = {
    javascript: "// Welcome to CodeSync!\n\nfunction helloWorld() {\n  console.log('Hello, CodeSync!');\n}\n\nhelloWorld();\n",
    python: "# Welcome to CodeSync!\n\ndef hello_world():\n    print('Hello, CodeSync!')\n\nhello_world()\n",
    java: "// Welcome to CodeSync!\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, CodeSync!\");\n    }\n}\n",
    cpp: "// Welcome to CodeSync!\n\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello, CodeSync!\" << std::endl;\n    return 0;\n}\n",
    go: "// Welcome to CodeSync!\n\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n\tfmt.Println(\"Hello, CodeSync!\")\n}\n",
    rust: "// Welcome to CodeSync!\n\nfn main() {\n    println!(\"Hello, CodeSync!\");\n}\n"
};

const FILE_EXTENSIONS: Record<SupportedLanguage, string> = {
    javascript: "js",
    python: "py",
    java: "java",
    cpp: "cpp",
    go: "go",
    rust: "rs"
};

interface Client {
    socketId: string;
    username: string;
}

interface RecentRoom {
    id: string;
    lastAccessed: number;
}

interface MonacoEditorInstance {
    getValue(): string;
    setValue(value: string): void;
    getPosition(): { lineNumber: number; column: number } | null;
    setPosition(position: { lineNumber: number; column: number }): void;
    getSelection(): {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
    } | null;
    setSelection(selection: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
    }): void;
}

const Editor = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    
    const roomId = location.state?.roomId;
    const username = location.state?.username;

    const [code, setCode] = useState<string>(CODE_SNIPPETS["javascript"]);
    const [language, setLanguage] = useState<SupportedLanguage>("javascript");
    const [clients, setClients] = useState<Client[]>(() => {
        return username ? [{ socketId: "self", username }] : [];
    });
    const [output, setOutput] = useState<string>("");
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
    
    // Mobile responsive states
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
    
    const [socket, setSocket] = useState<Socket | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const isTyping = useRef<boolean>(false);
    const editorRef = useRef<MonacoEditorInstance | null>(null);

    // WebRTC Voice Calling States
    const [inCall, setInCall] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [activeCallUsers, setActiveCallUsers] = useState<string[]>([]);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});

    // Version History States
    const [versions, setVersions] = useState<any[]>([]);
    const [isSavingVersion, setIsSavingVersion] = useState<boolean>(false);

    useEffect(() => {
        if (!roomId || !username) {
            toast.error("Invalid room access");
            navigate("/");
            return;
        }

        const newSocket = io("http://localhost:5000");
        socketRef.current = newSocket;
        const socketTimer = setTimeout(() => {
            setSocket(newSocket);
        }, 0);

        // Save to recent workspaces
        try {
            const recentRoomsStr = localStorage.getItem("recent_workspaces");
            let recentRooms = recentRoomsStr ? JSON.parse(recentRoomsStr) : [];
            // Remove if already exists
            recentRooms = recentRooms.filter((r: RecentRoom) => r.id !== roomId);
            // Add to front
            recentRooms.unshift({ id: roomId, lastAccessed: Date.now() });
            // Keep only last 5
            if (recentRooms.length > 5) recentRooms.pop();
            localStorage.setItem("recent_workspaces", JSON.stringify(recentRooms));
        } catch {
            console.error("Failed to save recent workspace");
        }

        socketRef.current.on("connect", () => {
            socketRef.current?.emit("join-room", { roomId, username });
        });

        socketRef.current.on("user-joined", ({ socketId, username: joinedUser, clients: updatedClients }) => {
            if (joinedUser !== username) {
                toast.success(`${joinedUser} joined`);
            }
            setClients(updatedClients || [{ socketId, username: joinedUser }]);
        });

        socketRef.current.on("user-left", ({ username: leftUser, clients: updatedClients }) => {
            toast.error(`${leftUser} left`);
            setClients(updatedClients || []);
        });

        socketRef.current.on("code-change", ({ code: newCode }) => {
            isTyping.current = true;
            if (editorRef.current) {
                const currentVal = editorRef.current.getValue();
                if (currentVal !== newCode) {
                    const position = editorRef.current.getPosition();
                    const selection = editorRef.current.getSelection();
                    
                    editorRef.current.setValue(newCode);
                    
                    if (position) {
                        editorRef.current.setPosition(position);
                    }
                    if (selection) {
                        editorRef.current.setSelection(selection);
                    }
                }
            }
            setCode(newCode);
            setTimeout(() => { isTyping.current = false; }, 50);
        });

        socketRef.current.on("language-change", ({ language: newLanguage }) => {
            setLanguage(newLanguage);
        });

        // ── WebRTC signaling relays ──────────────────────────────────────────
        socketRef.current.on("user-joined-call", async ({ socketId, username: joinedUser }) => {
            toast.success(`${joinedUser} joined the call`);
            setActiveCallUsers(prev => {
                if (prev.includes(joinedUser)) return prev;
                return [...prev, joinedUser];
            });

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });

            peerConnectionsRef.current[socketId] = pc;

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, localStreamRef.current!);
                });
            }

            pc.onicecandidate = (event) => {
                if (event.candidate && socketRef.current) {
                    socketRef.current.emit("webrtc-signal", {
                        targetSocketId: socketId,
                        signalData: { type: "candidate", candidate: event.candidate }
                    });
                }
            };

            pc.ontrack = (event) => {
                const remoteAudio = document.createElement("audio");
                remoteAudio.srcObject = event.streams[0];
                remoteAudio.autoplay = true;
                remoteAudio.style.display = "none";
                document.body.appendChild(remoteAudio);
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (socketRef.current) {
                socketRef.current.emit("webrtc-signal", {
                    targetSocketId: socketId,
                    signalData: { type: "offer", sdp: offer.sdp }
                });
            }
        });

        socketRef.current.on("user-left-call", ({ socketId, username: leftUser }) => {
            toast.error(`${leftUser} left the call`);
            setActiveCallUsers(prev => prev.filter(u => u !== leftUser));
            if (peerConnectionsRef.current[socketId]) {
                peerConnectionsRef.current[socketId].close();
                delete peerConnectionsRef.current[socketId];
            }
        });

        socketRef.current.on("webrtc-signal", async ({ senderSocketId, signalData }) => {
            let pc = peerConnectionsRef.current[senderSocketId];

            if (!pc) {
                pc = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
                });
                peerConnectionsRef.current[senderSocketId] = pc;

                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(track => {
                        pc.addTrack(track, localStreamRef.current!);
                    });
                }

                pc.onicecandidate = (event) => {
                    if (event.candidate && socketRef.current) {
                        socketRef.current.emit("webrtc-signal", {
                            targetSocketId: senderSocketId,
                            signalData: { type: "candidate", candidate: event.candidate }
                        });
                    }
                };

                pc.ontrack = (event) => {
                    const remoteAudio = document.createElement("audio");
                    remoteAudio.srcObject = event.streams[0];
                    remoteAudio.autoplay = true;
                    remoteAudio.style.display = "none";
                    document.body.appendChild(remoteAudio);
                };
            }

            if (signalData.type === "offer") {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: signalData.sdp }));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                if (socketRef.current) {
                    socketRef.current.emit("webrtc-signal", {
                        targetSocketId: senderSocketId,
                        signalData: { type: "answer", sdp: answer.sdp }
                    });
                }
            } else if (signalData.type === "answer") {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: signalData.sdp }));
            } else if (signalData.type === "candidate") {
                await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            }
        });

        return () => {
            clearTimeout(socketTimer);
            socketRef.current?.disconnect();

            // WebRTC Cleanup
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        };
    }, [roomId, username, navigate]);

    if (!roomId || !username) {
        return <Navigate to="/" />;
    }

    const handleInviteSimulatedMember = (name: string) => {
        setTimeout(() => {
            const mockClient = { socketId: `mock-${Date.now()}`, username: name };
            setClients(prev => {
                if (prev.some(x => x.username === name)) return prev;
                return [...prev, mockClient];
            });
            toast.success(`@${name} joined the room!`);
        }, 3000);
    };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value as SupportedLanguage;
        setLanguage(newLang);
        
        const newCode = CODE_SNIPPETS[newLang];
        setCode(newCode);

        if (socketRef.current) {
            socketRef.current.emit("language-change", { roomId, language: newLang });
            socketRef.current.emit("code-change", { roomId, code: newCode });
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value === undefined) return;
        
        setCode(value);
        
        if (!isTyping.current && socketRef.current) {
            socketRef.current.emit("code-change", { roomId, code: value });
        }
    };

    const runCode = async () => {
        setIsRunning(true);
        setIsTerminalOpen(true);
        // Clear previous output so the loading state looks clean
        setOutput("");
        
        try {
            const response = await fetch("http://localhost:5000/api/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: language,
                    code: code
                })
            });
            
            const result = await response.json();
            
            if (result.run) {
                setOutput(result.run.output || "Execution finished with no output.");
            } else {
                setOutput(result.message || "Execution failed.");
            }
        } catch {
            setOutput("Failed to connect to execution engine.\nPlease try again later.");
        } finally {
            setIsRunning(false);
        }
    };

    const exportCode = () => {
        const blob = new Blob([code], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `main.${FILE_EXTENSIONS[language]}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Code downloaded successfully!");
    };

    const aiAssist = async () => {
        setIsAiLoading(true);
        const toastId = toast.loading("AI is analyzing...");
        
        try {
            const response = await fetch("http://localhost:5000/api/ai/assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code })
            });
            
            const data = await response.json();
            
            if (response.ok && data.suggestion) {
                const newCode = data.suggestion;
                setCode(newCode);
                
                if (socketRef.current) {
                    socketRef.current.emit("code-change", { roomId, code: newCode });
                }
                
                toast.success("AI suggestion applied!", { id: toastId });
            } else {
                toast.error(data.message || "Failed to get AI suggestion", { id: toastId });
            }
        } catch {
            toast.error("Network error. Is the backend running?", { id: toastId });
        } finally {
            setIsAiLoading(false);
        }
    };

    // ── WebRTC calling logic ──────────────────────────────────────────────────
    const handleJoinCall = async () => {
        try {
            // Get local audio stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {
                // Return fallback silent stream if environment lacks mic or rejects permission
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const dest = ctx.createMediaStreamDestination();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                gain.gain.value = 0;
                osc.connect(gain);
                gain.connect(dest);
                osc.start();
                return dest.stream;
            });

            localStreamRef.current = stream;
            setInCall(true);
            setActiveCallUsers(prev => [...prev, username]);
            toast.success("Joined voice channel!");

            if (socketRef.current) {
                socketRef.current.emit("join-call", { roomId });
            }
        } catch (err) {
            console.error("Failed to access microphone:", err);
            toast.error("Microphone access denied or not available");
        }
    };

    const handleLeaveCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        peerConnectionsRef.current = {};

        setInCall(false);
        setActiveCallUsers([]);
        toast.error("Disconnected from voice channel");

        if (socketRef.current) {
            socketRef.current.emit("leave-call", { roomId });
        }
    };

    const handleToggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(prev => !prev);
            toast.success(!isMuted ? "Microphone muted" : "Microphone unmuted");
        }
    };

    // ── Version history snapshots logic ───────────────────────────────────────
    const fetchVersions = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/versions/${roomId}`);
            const data = await response.json();
            if (response.ok && data.versions) {
                setVersions(data.versions);
            }
        } catch (err) {
            console.error("Failed to fetch versions:", err);
        }
    };

    const handleSaveVersion = async () => {
        setIsSavingVersion(true);
        const toastId = toast.loading("Saving code snapshot...");
        try {
            const response = await fetch("http://localhost:5000/api/versions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    code,
                    language,
                    username
                })
            });
            const data = await response.json();
            if (response.ok && data.version) {
                toast.success("Snapshot saved!", { id: toastId });
                setVersions(prev => [data.version, ...prev]);
            } else {
                toast.error(data.message || "Failed to save snapshot", { id: toastId });
            }
        } catch {
            toast.error("Failed to connect to snapshot engine", { id: toastId });
        } finally {
            setIsSavingVersion(false);
        }
    };

    const handleRestoreVersion = (restoredCode: string, restoredLanguage: string) => {
        setCode(restoredCode);
        setLanguage(restoredLanguage as any);

        if (socketRef.current) {
            socketRef.current.emit("language-change", { roomId, language: restoredLanguage });
            socketRef.current.emit("code-change", { roomId, code: restoredCode });
        }
        toast.success("Code restored to snapshot successfully!");
    };

    useEffect(() => {
        if (roomId) {
            fetchVersions();
        }
    }, [roomId]);

    return (
        <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans relative overflow-hidden transition-colors">
            {/* Header */}
            <header className="h-14 border-b border-zinc-205 dark:border-zinc-800 flex items-center justify-between px-2 sm:px-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md relative z-30 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Mobile Menu Toggles */}
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-1.5 md:hidden text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="hidden sm:flex w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Terminal className="w-4 h-4 text-white" />
                    </div>
                    
                    <div className="hidden sm:block h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />
                    
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md transition-colors">
                        <span className="hidden sm:inline text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Room</span>
                        <span className="text-xs font-medium font-mono text-zinc-650 dark:text-zinc-300 max-w-[100px] sm:max-w-none truncate">{roomId}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-3">
                    {/* Active Users Avatars */}
                    <div className="hidden lg:flex items-center mr-2">
                        {clients.slice(0, 4).map((client, i) => (
                            <div 
                                key={client.socketId}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                                style={{ 
                                    backgroundColor: `hsl(${(client.username.charCodeAt(0) * 30) % 360}, 70%, 50%)`,
                                    marginLeft: i > 0 ? '-10px' : '0',
                                    zIndex: 10 - i
                                }}
                                title={client.username}
                            >
                                {client.username.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {clients.length > 4 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300 -ml-2.5 z-0">
                                +{clients.length - 4}
                            </div>
                        )}
                    </div>

                    <div className="relative group hidden sm:block">
                        <select 
                            value={language}
                            onChange={handleLanguageChange}
                            className="appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium py-1.5 pl-3 pr-8 rounded-md hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors cursor-pointer"
                        >
                            {Object.entries(LANGUAGES).map(([key, { name }]) => (
                                <option key={key} value={key}>{name}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-550 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
                    </div>

                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={exportCode}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 sm:px-3 hidden md:flex"
                        title="Download Code"
                    >
                        <Download className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden xl:inline">Download</span>
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={aiAssist}
                        isLoading={isAiLoading}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 px-2 sm:px-4"
                    >
                        {!isAiLoading && <Sparkles className="w-4 h-4 sm:mr-1.5" />}
                        <span className="hidden sm:inline">AI Assist</span>
                    </Button>
                    <Button 
                        size="sm"
                        onClick={runCode}
                        isLoading={isRunning}
                        className="px-2 sm:px-4"
                    >
                        {!isRunning && <Play className="w-4 h-4 sm:mr-1.5" />}
                        <span className="hidden sm:inline">Run</span>
                    </Button>
                    
                    {/* Mobile Chat Toggle */}
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="p-1.5 md:hidden text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors relative cursor-pointer"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>

                    {/* Premium Sun/Moon Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 shadow-sm relative overflow-hidden group cursor-pointer"
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
                            <Moon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
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
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                        </motion.div>
                    </button>

                    <div className="hidden sm:block h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 sm:mx-2" />
                    
                    <button 
                        onClick={() => {
                            toast.success("Room ID copied");
                            navigator.clipboard.writeText(roomId);
                        }}
                        className="hidden sm:block p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                        title="Copy Room ID"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => navigate("/")}
                        className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-400/10 rounded-md transition-colors cursor-pointer"
                        title="Leave Room"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* Desktop Sidebar */}
                <div className="hidden md:block">
                    <Sidebar 
                        clients={clients} 
                        currentUsername={username} 
                        roomId={roomId}
                        onInviteSimulatedMember={handleInviteSimulatedMember}
                        inCall={inCall}
                        isMuted={isMuted}
                        onJoinCall={handleJoinCall}
                        onLeaveCall={handleLeaveCall}
                        onToggleMute={handleToggleMute}
                        activeCallUsers={activeCallUsers}
                        versions={versions}
                        onSaveVersion={handleSaveVersion}
                        onRestoreVersion={handleRestoreVersion}
                        isSavingVersion={isSavingVersion}
                    />
                </div>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsSidebarOpen(false)}
                                className="absolute inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="absolute left-0 top-0 bottom-0 z-50 md:hidden"
                            >
                                <Sidebar 
                                    clients={clients} 
                                    currentUsername={username} 
                                    roomId={roomId}
                                    onInviteSimulatedMember={handleInviteSimulatedMember}
                                    inCall={inCall}
                                    isMuted={isMuted}
                                    onJoinCall={handleJoinCall}
                                    onLeaveCall={handleLeaveCall}
                                    onToggleMute={handleToggleMute}
                                    activeCallUsers={activeCallUsers}
                                    versions={versions}
                                    onSaveVersion={handleSaveVersion}
                                    onRestoreVersion={handleRestoreVersion}
                                    isSavingVersion={isSavingVersion}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Center: Editor & Terminal */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] relative">
                    <div className="h-10 bg-[#181818] flex items-end px-2 border-b border-[#2d2d2d] justify-between">
                        <div className="px-4 py-2 bg-[#1e1e1e] text-xs font-medium text-[#cccccc] flex items-center gap-2 border-t border-l border-r border-[#2d2d2d] rounded-t-sm">
                            <Code2 className="w-3.5 h-3.5 text-[#569cd6]" />
                            main.{language === "python" ? "py" : language === "javascript" ? "js" : language === "java" ? "java" : language === "cpp" ? "cpp" : language === "rust" ? "rs" : "go"}
                        </div>
                        
                        {/* Mobile Language Selector */}
                        <div className="sm:hidden relative mb-1.5 mr-1">
                            <select 
                                value={language}
                                onChange={handleLanguageChange}
                                className="appearance-none bg-[#1e1e1e] border border-[#2d2d2d] text-[#cccccc] text-[10px] py-1 pl-2 pr-6 rounded-sm focus:outline-none"
                            >
                                {Object.entries(LANGUAGES).map(([key, { name }]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-[#cccccc] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div className="flex-1 relative min-h-0">
                        <EditorComponent
                            height="100%"
                            language={language}
                            theme={theme === "dark" ? "vs-dark" : "light"}
                            value={code}
                            onChange={handleEditorChange}
                            onMount={(editor) => {
                                editorRef.current = editor;
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: "'Inter', 'JetBrains Mono', 'Fira Code', monospace",
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                smoothScrolling: true,
                                cursorBlinking: "smooth",
                                renderLineHighlight: "all",
                                fontLigatures: true,
                                wordWrap: "on",
                            }}
                        />
                    </div>
                    
                    {/* Terminal Pane */}
                    <AnimatePresence>
                        {isTerminalOpen && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 256, opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="border-t border-zinc-800 bg-[#181818] flex flex-col overflow-hidden"
                            >
                                <div className="h-9 border-b border-[#2d2d2d] flex items-center justify-between px-4 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Output</span>
                                    </div>
                                    <button 
                                        onClick={() => setIsTerminalOpen(false)}
                                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 p-4 overflow-auto font-mono text-[13px] text-zinc-300 whitespace-pre-wrap bg-[#1e1e1e] relative">
                                    <AnimatePresence>
                                        {isRunning && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-[#1e1e1e]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
                                            >
                                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
                                                <span className="text-xs text-indigo-400 font-medium animate-pulse tracking-wide">Executing code on secure backend...</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {output || <span className="text-zinc-600">No output</span>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop Chat */}
                <div className="hidden md:block">
                    <ChatPanel 
                        socket={socket} 
                        roomId={roomId} 
                        currentUsername={username} 
                        clients={clients} 
                        code={code}
                        onApplyCode={(newCode) => {
                            setCode(newCode);
                            if (socketRef.current) {
                                socketRef.current.emit("code-change", { roomId, code: newCode });
                            }
                        }}
                    />
                </div>

                {/* Mobile Chat Overlay */}
                <AnimatePresence>
                    {isChatOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsChatOpen(false)}
                                className="absolute inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                            />
                            <motion.div 
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="absolute right-0 top-0 bottom-0 z-50 md:hidden"
                            >
                                <ChatPanel 
                        socket={socket} 
                        roomId={roomId} 
                        currentUsername={username} 
                        clients={clients} 
                        code={code}
                        onApplyCode={(newCode) => {
                            setCode(newCode);
                            if (socketRef.current) {
                                socketRef.current.emit("code-change", { roomId, code: newCode });
                            }
                        }}
                    />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Editor;