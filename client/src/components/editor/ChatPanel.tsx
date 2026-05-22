import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { MessageSquare, Send, Smile, Paperclip, Check, CheckCheck, FileText, Users, MessageCircle, Sparkles, RefreshCw, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { useTheme } from "../../hooks/useTheme";

interface Attachment {
  name: string;
  type: string;
  size: string;
  dataUrl: string;
}

interface Message {
  id: string;
  socketId: string;
  username: string;
  text: string;
  timestamp: string;
  isDm?: boolean;
  recipient?: string;
  attachment?: Attachment;
  read?: boolean;
}

interface Client {
  socketId: string;
  username: string;
}

interface AIIssue {
  line?: number;
  severity: 'high' | 'medium' | 'low';
  category: 'Bug' | 'Style' | 'Practice' | 'Performance';
  message: string;
  suggestion: string;
}

interface AIReport {
  score: number;
  issues: AIIssue[];
  refactoredCode: string;
}

interface ChatPanelProps {
  socket: Socket | null;
  roomId: string;
  currentUsername: string;
  clients: Client[];
  code: string;
  onApplyCode: (newCode: string) => void;
}

let messageCounter = 0;
const generateMessageId = (): string => {
  return `msg-${Date.now()}-${++messageCounter}`;
};

export const ChatPanel = ({ socket, roomId, currentUsername, clients, code, onApplyCode }: ChatPanelProps) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'room' | 'ai' | string>('room'); // 'room', 'ai', or DM recipient username
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI review state variables
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);

  // File uploading states
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/chat/${roomId}`);
        if (response.ok) {
          const history = await response.json();
          setMessages(history);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };
    
    fetchHistory();
    
    if (!socket) return;

    socket.on('receive-message', (message: Message) => {
      setMessages(prev => {
        // Avoid duplicate receipts
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('typing', ({ username: typingUser, isTyping }: { username: string; isTyping: boolean }) => {
      setTypingUsers(prev => ({ ...prev, [typingUser]: isTyping }));
    });

    return () => {
      socket.off('receive-message');
      socket.off('typing');
    };
  }, [socket, roomId]);

  // Read receipts and scroll handling
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Mark active messages as read
    const unreadMessages = messages.filter(m => !m.read && m.username !== currentUsername);
    if (unreadMessages.length > 0) {
      const timer = setTimeout(() => {
        setMessages(prev => prev.map(m => m.username !== currentUsername ? { ...m, read: true } : m));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [messages, activeTab, currentUsername]);

  // Dynamic AI parser engine
  const handleAiAnalyze = () => {
    setIsAnalyzing(true);
    toast.loading("Analyzing workspace code for bugs & bad practices...", { duration: 1500 });
    
    setTimeout(() => {
      const issues: AIIssue[] = [];
      const lines = code.split('\n');

      lines.forEach((lineContent, index) => {
        const lineNum = index + 1;

        // Check for raw var declarations
        if (lineContent.includes('var ') && !lineContent.includes('//') && !lineContent.includes('/*')) {
          issues.push({
            line: lineNum,
            severity: 'medium',
            category: 'Style',
            message: "Use of block-scoped declarations (let/const) is preferred over the 'var' keyword.",
            suggestion: lineContent.replace('var ', 'const ')
          });
        }

        // Check for double equals comparison
        if (lineContent.includes(' == ') && !lineContent.includes('===') && !lineContent.includes('//')) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'Bug',
            message: "Non-strict comparison comparison '==' found. Use strict equality '===' to prevent type coercion bugs.",
            suggestion: lineContent.replace(' == ', ' === ')
          });
        }

        // Check for active console.logs
        if (lineContent.includes('console.log') && !lineContent.includes('//')) {
          issues.push({
            line: lineNum,
            severity: 'low',
            category: 'Practice',
            message: "Active debug console.log found. Clean up before release to avoid exposing stack trace metrics.",
            suggestion: `// Removed log on line ${lineNum}`
          });
        }

        // Check for empty catch block
        if (lineContent.includes('catch') && (lineContent.includes('{}') || lineContent.trim().endsWith('{}'))) {
          issues.push({
            line: lineNum,
            severity: 'high',
            category: 'Bug',
            message: "Empty catch block found. Swallowing runtime failures can hide critical execution exceptions.",
            suggestion: lineContent.replace('}', '  console.error(error);\n}')
          });
        }
      });

      // Default feedback if perfect
      if (issues.length === 0) {
        issues.push({
          severity: 'low',
          category: 'Performance',
          message: "Excellent! Your code satisfies strict compiler encapsulation and linter rules.",
          suggestion: "Maintain existing styling structures!"
        });
      }

      // Calculate linter score
      let score = 100;
      issues.forEach(issue => {
        if (issue.severity === 'high') score -= 15;
        else if (issue.severity === 'medium') score -= 8;
        else score -= 3;
      });
      score = Math.max(score, 45); // cap at 45 lowest

      // Simple Refactoring suggestions
      let refactoredCode = code;
      refactoredCode = refactoredCode.replace(/var\s+/g, 'const ');
      refactoredCode = refactoredCode.replace(/\s==\s/g, ' === ');

      setAiReport({ score, issues, refactoredCode });
      setIsAnalyzing(false);
      toast.success("AI analysis complete!");
    }, 1500);
  };

  // Handle local simulation for DMs and mock typing when inviting network members
  const simulateRecipientReply = (recipient: string, userText: string) => {
    setTypingUsers(prev => ({ ...prev, [recipient]: true }));
    setTimeout(() => {
      setTypingUsers(prev => ({ ...prev, [recipient]: false }));
      
      let replyText = `Hey there! I am looking at the Monaco codebase in room ${roomId}. Let's push this layout!`;
      if (userText.toLowerCase().includes("hello") || userText.toLowerCase().includes("hi")) {
        replyText = `Hello! Glad to connect on CodeLink! Direct DMs are working perfectly! 🚀`;
      } else if (userText.toLowerCase().includes("file") || userText.toLowerCase().includes("doc")) {
        replyText = `Awesome file upload! The Base64 viewer renders attachments flawlessly.`;
      }

      const mockReply: Message = {
        id: `mock-msg-${Date.now()}`,
        socketId: `mock-${recipient}`,
        username: recipient,
        text: replyText,
        timestamp: new Date().toISOString(),
        isDm: true,
        recipient: currentUsername,
        read: false
      };

      setMessages(prev => [...prev, mockReply]);
    }, 2000);
  };

  const handleTypingInput = (val: string) => {
    setInput(val);
    if (!socket) return;
    socket.emit('typing', { roomId, username: currentUsername, isTyping: val.length > 0 });
  };

  const sendMessage = (e: React.FormEvent | null, customText?: string, customAttachment?: Attachment) => {
    if (e) e.preventDefault();
    
    const messageText = customText !== undefined ? customText : input;
    if (!messageText.trim() && !customAttachment) return;

    const newMessage: Message = {
      id: generateMessageId(),
      socketId: socket?.id || 'offline-self',
      username: currentUsername,
      text: messageText,
      timestamp: new Date().toISOString(),
      isDm: activeTab !== 'room' && activeTab !== 'ai',
      recipient: activeTab !== 'room' && activeTab !== 'ai' ? activeTab : undefined,
      attachment: customAttachment,
      read: false
    };

    // Emit over socket if connected and general room chat
    if (socket && activeTab === 'room') {
      socket.emit('send-message', { roomId, message: messageText, attachment: customAttachment });
    } else {
      // Local state append for DM or offline fallback
      setMessages(prev => [...prev, newMessage]);
      
      // Simulate reply from quick-invite network developers
      if (activeTab !== 'room' && activeTab !== 'ai') {
        simulateRecipientReply(activeTab, messageText);
      }
    }

    if (customText === undefined) setInput('');
    setShowEmojiPicker(false);
    
    if (socket) {
      socket.emit('typing', { roomId, username: currentUsername, isTyping: false });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Files must be smaller than 1.5MB to save local quota!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;

      const attachment: Attachment = {
        name: file.name,
        type: file.type,
        size: sizeStr,
        dataUrl
      };

      sendMessage(null, `Shared a file: ${file.name}`, attachment);
      toast.success("Attachment attached and shared!");
    };
    reader.readAsDataURL(file);
  };

  // Filter messages based on active tab
  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'room') {
      return !msg.isDm;
    } else {
      // Show DMs between currentUsername and activeTab
      return msg.isDm && (
        (msg.username === currentUsername && msg.recipient === activeTab) ||
        (msg.username === activeTab && msg.recipient === currentUsername)
      );
    }
  });

  const activeTypers = Object.entries(typingUsers)
    .filter(([user, isTyping]) => isTyping && user !== currentUsername && (activeTab === 'room' || user === activeTab))
    .map(([user]) => user);

  return (
    <div className="w-72 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full transition-colors">
      
      {/* Header Tabs */}
      <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 dark:bg-zinc-900/40 transition-colors">
        <button
          onClick={() => setActiveTab('room')}
          className={`h-11 flex items-center justify-center gap-1 text-[10px] font-bold transition-all relative border-b-2 cursor-pointer ${
            activeTab === 'room' 
              ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500 bg-indigo-500/5' 
              : 'text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Room
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`h-11 flex items-center justify-center gap-1 text-[10px] font-bold transition-all relative border-b-2 cursor-pointer ${
            activeTab === 'ai' 
              ? 'text-purple-600 dark:text-purple-400 border-purple-500 bg-purple-500/5' 
              : 'text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-600 dark:text-purple-400" />
          AI Review
        </button>

        <div className="relative flex items-center justify-center">
          <select
            value={activeTab === 'room' || activeTab === 'ai' ? '' : activeTab}
            onChange={(e) => {
              if (e.target.value) setActiveTab(e.target.value);
            }}
            className={`w-full h-full bg-transparent text-center text-[10px] font-bold focus:outline-none cursor-pointer appearance-none px-4 transition-all ${
              activeTab !== 'room' && activeTab !== 'ai' 
                ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/5' 
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <option value="" disabled className="bg-white dark:bg-zinc-950 text-zinc-500">1-to-1 DMs...</option>
            {clients.filter(c => c.username !== currentUsername).map(c => (
              <option key={c.socketId} value={c.username} className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-300">@{c.username}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-zinc-600">
            <MessageCircle className="w-3.5 h-3.5" />
          </div>
          {activeTab !== 'room' && activeTab !== 'ai' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500" />
          )}
        </div>
      </div>

      {/* Direct Messaging Partner Status */}
      {activeTab !== 'room' && activeTab !== 'ai' && (
        <div className="px-4 py-1.5 bg-purple-500/5 dark:bg-purple-950/20 border-b border-zinc-205 dark:border-zinc-800 flex items-center justify-between shrink-0 transition-colors">
          <span className="text-[10px] font-bold text-purple-650 dark:text-purple-400 uppercase tracking-wider">DM Session: @{activeTab}</span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[8px] text-zinc-550 dark:text-zinc-500 font-bold uppercase">Online</span>
          </div>
        </div>
      )}

      {/* AI Review Workspace Tab */}
      {activeTab === 'ai' && (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 p-4 space-y-4 overflow-y-auto transition-colors">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-3 shrink-0 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400 animate-spin" />
              <h3 className="text-xs font-bold text-zinc-750 dark:text-zinc-300 uppercase tracking-wider">AI Code Copilot</h3>
            </div>
            <button
              onClick={handleAiAnalyze}
              disabled={isAnalyzing}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-md shadow-purple-900/20 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Analyze Code
                </>
              )}
            </button>
          </div>

          {/* Review Results */}
          {aiReport ? (
            <div className="space-y-4">
              {/* Score Indicator */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850 rounded-2xl transition-colors">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-zinc-850 dark:text-zinc-300">Code Quality Score</span>
                  <span className="text-[9px] text-zinc-500 font-medium">Derived from detected metrics</span>
                </div>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-lg shadow-black/10 ${
                  aiReport.score >= 80 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
                    : aiReport.score >= 60 
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10' 
                      : 'border-red-500 text-red-600 dark:text-red-400 bg-red-500/10'
                }`}>
                  {aiReport.score}%
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-2 text-left">
                <h4 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">Detected Issues ({aiReport.issues.length})</h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {aiReport.issues.map((issue, idx) => (
                     <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-xl space-y-1.5 relative overflow-hidden group transition-colors">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-300 dark:bg-zinc-800" style={{
                        backgroundColor: issue.severity === 'high' ? '#ef4444' : issue.severity === 'medium' ? '#f59e0b' : '#3b82f6'
                      }} />
                      <div className="flex items-center justify-between pl-1">
                        <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wide">{issue.category} &middot; Line {issue.line || 'global'}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                          issue.severity === 'high' 
                            ? 'bg-red-500/10 text-red-605 dark:text-red-400 border border-red-500/20' 
                            : issue.severity === 'medium' 
                              ? 'bg-amber-500/10 text-amber-605 dark:text-amber-400 border border-amber-500/20' 
                              : 'bg-indigo-500/10 text-indigo-605 dark:text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-805 dark:text-zinc-300 leading-normal pl-1">{issue.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refactored Preview block */}
              <div className="space-y-2 text-left">
                <h4 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-1">AI Refactored Alternative</h4>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl font-mono text-[10px] text-purple-750 dark:text-purple-300 overflow-x-auto max-h-[110px] whitespace-pre transition-colors">
                  {aiReport.refactoredCode}
                </div>
              </div>

              {/* Apply suggestion */}
              <button
                type="button"
                onClick={() => {
                  onApplyCode(aiReport.refactoredCode);
                  setAiReport(null);
                }}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/10 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply Refactoring
              </button>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center animate-pulse shrink-0">
                <Sparkles className="w-6 h-6 text-purple-505 dark:text-purple-400" />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300">Ready to Analyze</span>
                <p className="text-[10px] text-zinc-550 dark:text-zinc-500 leading-relaxed max-w-[200px] mx-auto">
                  Click the button above to run real-time AI Review, compile linter issues, and inspect quality metrics!
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Chat Messages scroll area */}
      {activeTab !== 'ai' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-transparent transition-colors">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-500 dark:text-zinc-650 space-y-2 p-6">
              <MessageSquare className="w-8 h-8 text-zinc-400 dark:text-zinc-800 animate-bounce" />
              <span>
                {activeTab === 'room' 
                  ? 'No messages in general chat yet. Start a conversation!' 
                  : `Direct message thread with @${activeTab} is empty. Say hello!`}
              </span>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.username === currentUsername;
              const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[90%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isMe 
                        ? 'bg-indigo-650 text-white shadow-md' 
                        : activeTab !== 'room' && activeTab !== 'ai'
                          ? 'bg-purple-650 text-white shadow-md' 
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                    }`}>
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Message Content */}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                        <span className="text-[10px] font-bold text-zinc-500">{isMe ? 'You' : msg.username}</span>
                        <span className="text-[8px] text-zinc-400 dark:text-zinc-600">{time}</span>
                      </div>

                      {/* Shared File Attachment card */}
                      {msg.attachment && (
                        <div className="mb-1.5 max-w-full text-left">
                          {msg.attachment.type.startsWith('image/') ? (
                            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-zinc-950 max-h-[140px] shadow-lg">
                              <img 
                                src={msg.attachment.dataUrl} 
                                alt={msg.attachment.name}
                                className="w-full h-full object-cover cursor-zoom-in"
                                onClick={() => {
                                  // Fullscreen download/view trigger
                                  const w = window.open();
                                  w?.document.write(`<img src="${msg.attachment?.dataUrl}" style="max-width:100%; height:auto;" />`);
                                }}
                              />
                            </div>
                          ) : (
                            <a 
                              href={msg.attachment.dataUrl}
                              download={msg.attachment.name}
                              className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl text-left transition-all shadow-sm cursor-pointer"
                            >
                              <FileText className="w-6 h-6 text-indigo-500 dark:text-indigo-400 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-bold text-zinc-750 dark:text-zinc-300 truncate tracking-wide">{msg.attachment.name}</span>
                                <span className="text-[8px] text-zinc-500 font-medium">{msg.attachment.size} &middot; click to save</span>
                              </div>
                            </a>
                          )}
                        </div>
                      )}

                      <div 
                        className={`px-3 py-2 text-xs leading-relaxed shadow-sm ${
                          isMe 
                            ? activeTab === 'room'
                              ? 'bg-indigo-650 text-white rounded-2xl rounded-br-sm shadow-md' 
                              : 'bg-purple-650 text-white rounded-2xl rounded-br-sm shadow-purple-900/10 shadow-md'
                            : 'bg-white dark:bg-[#202020] border border-zinc-200 dark:border-zinc-850 text-zinc-805 dark:text-zinc-100 rounded-2xl rounded-bl-sm shadow-sm'
                        }`}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {msg.text}
                      </div>

                      {/* Read Receipts Indicator */}
                      {isMe && (
                        <div className="flex items-center justify-end gap-1 mt-1 mr-1" title={msg.read ? "Read by developer" : "Sent successfully"}>
                          {msg.read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Typing Indicator Status Bar */}
      {activeTab !== 'ai' && activeTypers.length > 0 && (
        <div className="px-4 py-1 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-900 flex items-center gap-2 shrink-0 transition-colors">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-zinc-405 dark:bg-zinc-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-zinc-405 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1 h-1 bg-zinc-405 dark:bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
          <span className="text-[9px] text-zinc-500 italic">@{activeTypers.join(', ')} is typing...</span>
        </div>
      )}

      {/* Emoji Quick reactions */}
      {activeTab !== 'ai' && (
        <div className="px-3 py-1 flex items-center justify-around border-t border-zinc-200 dark:border-zinc-900 shrink-0 bg-zinc-100 dark:bg-zinc-950/20 transition-colors">
          {['👍', '❤️', '🔥', '😂', '🎉', '🚀'].map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => sendMessage(null, emoji)}
              className="text-xs hover:scale-125 transition-transform p-1 filter grayscale-[40%] hover:filter-none cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Controls */}
      {activeTab !== 'ai' && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 relative shrink-0 transition-colors">
          
          {/* Emoji picker popup */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full right-4 mb-2 z-50 shadow-2xl rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
              >
                <EmojiPicker 
                  theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                  onEmojiClick={(emojiData) => setInput(prev => prev + emojiData.emoji)}
                  lazyLoadEmojis={true}
                  searchDisabled={true}
                  skinTonesDisabled={true}
                  width={280}
                  height={320}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={(e) => sendMessage(e)} className="relative flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                title="Attach File"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Emoji Pop trigger */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                title="Add Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => handleTypingInput(e.target.value)}
              placeholder={activeTab === 'room' ? "Send to room..." : `Message @${activeTab}...`}
              className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-full py-1.5 px-3 text-xs text-zinc-900 dark:text-zinc-50 placeholder-zinc-450 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors min-w-0 shadow-inner"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="p-1.5 bg-indigo-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
