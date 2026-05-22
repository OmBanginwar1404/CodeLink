import { useState } from "react";
import { Users, UserPlus, Copy, Check, Mic, MicOff, PhoneOff, PhoneCall, History, Clock, RotateCcw, Plus } from "lucide-react";
import toast from "react-hot-toast";

interface Client {
  socketId: string;
  username: string;
}

interface VersionItem {
  _id: string;
  roomId: string;
  code: string;
  language: string;
  username: string;
  timestamp: string;
}

interface SidebarProps {
  clients: Client[];
  currentUsername: string;
  roomId: string;
  onInviteSimulatedMember: (username: string) => void;
  // Voice Calling State
  inCall: boolean;
  isMuted: boolean;
  onJoinCall: () => void;
  onLeaveCall: () => void;
  onToggleMute: () => void;
  activeCallUsers: string[];
  // Version History State
  versions: VersionItem[];
  onSaveVersion: () => void;
  onRestoreVersion: (code: string, language: string) => void;
  isSavingVersion: boolean;
}

const SUGGESTED_DEVELOPERS = [
  { name: "AlexDev", skill: "Go Expert" },
  { name: "ElenaPy", skill: "Python Guru" },
  { name: "JordanReact", skill: "React Architect" }
];

export const Sidebar = ({
  clients,
  currentUsername,
  roomId,
  onInviteSimulatedMember,
  inCall,
  isMuted,
  onJoinCall,
  onLeaveCall,
  onToggleMute,
  activeCallUsers,
  versions,
  onSaveVersion,
  onRestoreVersion,
  isSavingVersion
}: SidebarProps) => {
  const [activeTab, setActiveTab] = useState<"team" | "history">("team");
  const [copied, setCopied] = useState(false);
  const [inviteName, setInviteName] = useState("");

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success("Room ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    
    const name = inviteName.trim();
    if (clients.some(c => c.username.toLowerCase() === name.toLowerCase())) {
      toast.error(`${name} is already in the room!`);
      return;
    }

    toast.success(`Invite sent successfully to @${name}!`);
    onInviteSimulatedMember(name);
    setInviteName("");
  };

  const handleQuickInvite = (name: string) => {
    if (clients.some(c => c.username === name)) {
      toast.error(`${name} is already in the room!`);
      return;
    }
    toast.success(`Invite sent successfully to @${name}!`);
    onInviteSimulatedMember(name);
  };

  return (
    <div className="w-60 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full transition-colors relative z-25">
      
      {/* Sidebar Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800/80 p-2 gap-1 bg-zinc-50 dark:bg-zinc-900/40">
        <button
          onClick={() => setActiveTab("team")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "team"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
              : "text-zinc-550 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Team
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "history"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
              : "text-zinc-550 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          History
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {activeTab === "team" ? (
          <div className="space-y-6">
            {/* Active Team Section */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Users className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 animate-pulse" />
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active Team ({clients.length})</h3>
              </div>
              
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {/* Current user */}
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 shadow-sm relative overflow-hidden group transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/55 flex items-center justify-center text-[10px] font-bold text-indigo-550 dark:text-indigo-400">
                    {currentUsername.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{currentUsername}</span>
                    <span className="text-[9px] text-indigo-550 dark:text-indigo-400 font-bold">Creator (You)</span>
                  </div>
                  <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                
                {/* Other users */}
                {clients.filter(c => c.username !== currentUsername).map((client) => (
                  <div key={client.socketId} className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-all cursor-default group relative">
                    <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-650 dark:text-zinc-400 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700 transition-colors">
                      {client.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{client.username}</span>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-200 dark:bg-zinc-900" />

            {/* ADD MEMBER / INVITE SECTION */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 px-1">
                <UserPlus className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Add Members</h3>
              </div>

              {/* Room Invite ID copy box */}
              <div className="space-y-1 px-1">
                <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Invite Code</label>
                <div className="flex gap-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-1 items-center transition-colors">
                  <span className="flex-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-mono truncate px-2">{roomId}</span>
                  <button 
                    type="button"
                    onClick={handleCopyLink}
                    className="p-1.5 bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors border border-zinc-300 dark:border-zinc-800 cursor-pointer"
                    title="Copy Room ID"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Username Invite input form */}
              <form onSubmit={handleInviteSubmit} className="space-y-1 px-1">
                <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Invite Collaborator</label>
                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    placeholder="Enter username..." 
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 focus:border-zinc-300 dark:focus:border-zinc-800 text-xs py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200 min-w-0 transition-colors" 
                  />
                  <button 
                    type="submit"
                    className="px-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                    title="Send invitation"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Suggested developer quick invites */}
              <div className="space-y-1 px-1">
                <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Quick Invite Network</label>
                <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-0.5">
                  {SUGGESTED_DEVELOPERS.map((dev) => {
                    const isInRoom = clients.some(c => c.username === dev.name);
                    return (
                      <div key={dev.name} className="flex justify-between items-center p-1.5 bg-zinc-100 dark:bg-zinc-900/20 border border-zinc-205 dark:border-zinc-900/60 rounded-xl transition-colors">
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate">@{dev.name}</span>
                          <span className="text-[8px] text-zinc-500">{dev.skill}</span>
                        </div>
                        <button
                          type="button"
                          disabled={isInRoom}
                          onClick={() => handleQuickInvite(dev.name)}
                          className={`text-[9px] px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            isInRoom 
                              ? 'bg-zinc-200 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border border-transparent' 
                              : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 dark:hover:text-indigo-300 border border-indigo-500/20'
                          }`}
                        >
                          {isInRoom ? 'Joined' : 'Invite'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Version History Tab */
          <div className="space-y-4 h-full flex flex-col min-h-0">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-zinc-555 dark:text-zinc-400" />
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Snapshots ({versions.length})</h3>
              </div>
              <button
                onClick={onSaveVersion}
                disabled={isSavingVersion}
                className="flex items-center gap-1 text-[10px] font-bold bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 text-white px-2 py-1 rounded-lg transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Save
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {versions.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 dark:text-zinc-650">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-800" />
                  <p className="text-xs font-medium">No snapshots saved yet.</p>
                  <p className="text-[10px] mt-0.5">Click 'Save' to record a version.</p>
                </div>
              ) : (
                versions.map((ver) => (
                  <div
                    key={ver._id}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 transition-all group relative overflow-hidden text-left"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase font-mono tracking-wider">
                        {ver.language}
                      </span>
                      <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-medium">
                        {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-450 truncate">
                      Saved by: <span className="font-semibold text-zinc-700 dark:text-zinc-300">@{ver.username}</span>
                    </p>
                    <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-zinc-150 dark:border-zinc-800/50">
                      <span className="text-[8px] text-zinc-400">
                        {new Date(ver.timestamp).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => onRestoreVersion(ver.code, ver.language)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 dark:hover:text-indigo-300 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Restore
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Voice Call Module */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 transition-colors">
        {!inCall ? (
          <button
            onClick={onJoinCall}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold py-2.5 px-3 flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Join Voice Channel
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  Voice Call Active
                </span>
              </div>
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
                ({activeCallUsers.length} in call)
              </span>
            </div>

            {/* Speaking list */}
            <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-0.5">
              {activeCallUsers.map((user) => (
                <div key={user} className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-200/40 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-600 dark:text-indigo-400">
                      {user.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                      {user === currentUsername ? `${user} (You)` : user}
                    </span>
                  </div>
                  {/* Waveform visualizer simulation for premium touch */}
                  <div className="flex items-center gap-0.5 h-2">
                    <div className="w-0.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-0.5 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    <div className="w-0.5 h-1 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Voice call controls */}
            <div className="flex gap-2">
              <button
                onClick={onToggleMute}
                className={`flex-1 py-1.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isMuted
                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                    : "bg-zinc-200/55 dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {isMuted ? "Muted" : "Mute"}
              </button>
              <button
                onClick={onLeaveCall}
                className="py-1.5 px-3 bg-red-500 hover:bg-red-650 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all shadow-md shadow-red-500/10 cursor-pointer"
                title="Disconnect call"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                Leave
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
