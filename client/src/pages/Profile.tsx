import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Navbar } from "../components/layout/Navbar";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Camera, 
    Plus, 
    Trash2, 
    Edit3, 
    Save, 
    X, 
    ArrowLeft, 
    BookOpen, 
    Briefcase, 
    Sparkles, 
    Link as LinkIcon 
} from "lucide-react";

interface ExperienceItem {
    id: string;
    company: string;
    role: string;
    duration: string;
    description: string;
}

interface EducationItem {
    id: string;
    institution: string;
    degree: string;
    duration: string;
}

interface UserProfile {
    avatarUrl: string;
    displayName: string;
    title: string;
    bio: string;
    skills: string[];
    github: string;
    linkedin: string;
    experience: ExperienceItem[];
    education: EducationItem[];
}

const DEFAULT_PROFILE: UserProfile = {
    avatarUrl: "",
    displayName: "Sarah Connor",
    title: "Lead Software Architect",
    bio: "Lead Software Architect at CodeLink. Specializing in high-performance collaborative environments, Monaco integration, and state-of-the-art developer tool interfaces.",
    skills: ["React", "TypeScript", "Node.js", "Socket.io", "MongoDB", "Framer Motion", "TailwindCSS"],
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    experience: [
        {
            id: "exp-1",
            company: "CodeLink Labs",
            role: "Senior Staff Developer",
            duration: "2024 - Present",
            description: "Pioneered interactive editor sandboxes and collaborated on highly responsive WebSockets systems for live document synchronization."
        },
        {
            id: "exp-2",
            company: "Cyber Systems",
            role: "Frontend Engineer",
            duration: "2022 - 2024",
            description: "Designed glassmorphic SaaS components and optimized bundling systems, yielding a 40% speed boost."
        }
    ],
    education: [
        {
            id: "edu-1",
            institution: "Stanford University",
            degree: "M.S. in Computer Science",
            duration: "2020 - 2022"
        },
        {
            id: "edu-2",
            institution: "MIT",
            degree: "B.S. in Computer Engineering",
            duration: "2016 - 2020"
        }
    ]
};



export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [isEditMode, setIsEditMode] = useState(false);
    const [profile, setProfile] = useState<UserProfile>(() => {
        try {
            const stored = localStorage.getItem("codelink_user_profile");
            if (stored) return JSON.parse(stored);
            localStorage.setItem("codelink_user_profile", JSON.stringify(DEFAULT_PROFILE));
            return DEFAULT_PROFILE;
        } catch {
            return DEFAULT_PROFILE;
        }
    });
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    
    // Skill tag input state
    const [newSkillText, setNewSkillText] = useState("");
    
    // Add item forms
    const [newExpCompany, setNewExpCompany] = useState("");
    const [newExpRole, setNewExpRole] = useState("");
    const [newExpDuration, setNewExpDuration] = useState("");
    const [newExpDesc, setNewExpDesc] = useState("");
    
    const [newEduSchool, setNewEduSchool] = useState("");
    const [newEduDegree, setNewEduDegree] = useState("");
    const [newEduDuration, setNewEduDuration] = useState("");

    // Save profile handler
    const saveProfile = () => {
        try {
            localStorage.setItem("codelink_user_profile", JSON.stringify(profile));
            setIsEditMode(false);
            toast.success("Profile saved successfully!");
        } catch {
            toast.error("Failed to save profile.");
        }
    };

    // Skills handler
    const addSkill = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkillText.trim()) return;
        if (profile.skills.includes(newSkillText.trim())) {
            toast.error("Skill already exists!");
            return;
        }
        const updatedSkills = [...profile.skills, newSkillText.trim()];
        setProfile({ ...profile, skills: updatedSkills });
        setNewSkillText("");
    };

    const removeSkill = (skillToRemove: string) => {
        const updatedSkills = profile.skills.filter(s => s !== skillToRemove);
        setProfile({ ...profile, skills: updatedSkills });
    };

    // Experience handlers
    const addExperience = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExpCompany.trim() || !newExpRole.trim() || !newExpDuration.trim()) {
            toast.error("Company, Role, and Duration are required!");
            return;
        }
        const newItem: ExperienceItem = {
            id: `exp-${Date.now()}`,
            company: newExpCompany.trim(),
            role: newExpRole.trim(),
            duration: newExpDuration.trim(),
            description: newExpDesc.trim()
        };
        setProfile({ ...profile, experience: [newItem, ...profile.experience] });
        setNewExpCompany("");
        setNewExpRole("");
        setNewExpDuration("");
        setNewExpDesc("");
        toast.success("Added professional experience role!");
    };

    const deleteExperience = (id: string) => {
        const updated = profile.experience.filter(item => item.id !== id);
        setProfile({ ...profile, experience: updated });
        toast.success("Removed role.");
    };

    // Education handlers
    const addEducation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEduSchool.trim() || !newEduDegree.trim() || !newEduDuration.trim()) {
            toast.error("Institution, Degree, and Duration are required!");
            return;
        }
        const newItem: EducationItem = {
            id: `edu-${Date.now()}`,
            institution: newEduSchool.trim(),
            degree: newEduDegree.trim(),
            duration: newEduDuration.trim()
        };
        setProfile({ ...profile, education: [newItem, ...profile.education] });
        setNewEduSchool("");
        setNewEduDegree("");
        setNewEduDuration("");
        toast.success("Added education log!");
    };

    const deleteEducation = (id: string) => {
        const updated = profile.education.filter(item => item.id !== id);
        setProfile({ ...profile, education: updated });
        toast.success("Removed education log.");
    };

    // Handle local image file uploading via FileReader Base64
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (cap at 1.5MB to avoid exceeding localStorage quota)
        if (file.size > 1.5 * 1024 * 1024) {
            toast.error("Image size must be under 1.5MB to save securely!");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setProfile({ ...profile, avatarUrl: event.target.result as string });
                setIsAvatarModalOpen(false);
                toast.success("Avatar uploaded successfully!");
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans pb-20">
            <Navbar />
            
            <div className="max-w-6xl mx-auto px-6 py-8 relative">
                {/* Visual Accent Glows */}
                <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-1/2 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Back to dashboard button */}
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <button 
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-semibold bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Dashboard
                    </button>

                    <div className="flex gap-3">
                        {isEditMode ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditMode(false);
                                        // Reload saved values
                                        const stored = localStorage.getItem("codelink_user_profile");
                                        if (stored) setProfile(JSON.parse(stored));
                                    }}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-zinc-800 bg-zinc-900 text-zinc-400 rounded-xl hover:text-white transition-all"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Cancel
                                </button>
                                <button
                                    onClick={saveProfile}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl hover:border-zinc-700 hover:text-white transition-all"
                            >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* Two Column Layout Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    
                    {/* LEFT COLUMN: Avatar & Social Sidebar */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl text-center space-y-6">
                            
                            {/* Avatar selector visual */}
                            <div className="relative w-32 h-32 mx-auto group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-[6px] opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl flex items-center justify-center">
                                    {profile.avatarUrl ? (
                                        <img 
                                            src={profile.avatarUrl} 
                                            alt="Avatar"
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-14 h-14">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {isEditMode && (
                                    <button
                                        onClick={() => setIsAvatarModalOpen(true)}
                                        className="absolute bottom-0 right-0 p-2 bg-indigo-500 text-white rounded-full border-2 border-zinc-900 hover:bg-indigo-600 transition-colors shadow-lg"
                                        title="Change Profile Photo"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Name & Title */}
                            {isEditMode ? (
                                <div className="space-y-3 pt-3 border-t border-zinc-800/40">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold mb-1 block text-left">Display Name</label>
                                        <input 
                                            type="text" 
                                            value={profile.displayName || ""}
                                            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                            placeholder="Your name"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 font-bold mb-1 block text-left">Professional Title</label>
                                        <input 
                                            type="text" 
                                            value={profile.title || ""}
                                            onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                                            placeholder="e.g. Senior Staff Dev"
                                            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-white">{profile.displayName || `@${user?.username}`}</h1>
                                    <p className="text-xs text-indigo-400 mt-1 font-semibold">{profile.title || "Full Stack Developer"}</p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">{user?.email}</p>
                                </div>
                            )}

                            {/* Social Profiles Section */}
                            <div className="border-t border-zinc-800/60 pt-5 space-y-4 text-left">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Social Networks</h3>
                                
                                {isEditMode ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold mb-1 block">GitHub Link</label>
                                            <input 
                                                type="text" 
                                                value={profile.github}
                                                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                                                placeholder="https://github.com/..."
                                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 font-bold mb-1 block">LinkedIn Link</label>
                                            <input 
                                                type="text" 
                                                value={profile.linkedin}
                                                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                                                placeholder="https://linkedin.com/in/..."
                                                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <a 
                                            href={profile.github} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center gap-2 p-3 bg-zinc-950 border border-zinc-800/40 rounded-xl hover:border-zinc-700 transition-colors text-xs text-zinc-300 hover:text-white"
                                        >
                                            {/* Github custom SVG */}
                                            <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                            </svg>
                                            <span>GitHub Profile</span>
                                        </a>
                                        <a 
                                            href={profile.linkedin} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center gap-2 p-3 bg-zinc-950 border border-zinc-800/40 rounded-xl hover:border-zinc-700 transition-colors text-xs text-zinc-300 hover:text-white"
                                        >
                                            {/* LinkedIn custom SVG */}
                                            <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                            </svg>
                                            <span>LinkedIn Network</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Dynamic Portfolio Elements */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* Bio/About me segment */}
                        <div className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl space-y-4 text-left">
                            <h2 className="text-sm font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                About Me
                            </h2>
                            {isEditMode ? (
                                <textarea
                                    value={profile.bio}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    className="w-full min-h-[100px] bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors leading-relaxed"
                                    placeholder="Write a brief professional description about yourself..."
                                />
                            ) : (
                                <p className="text-zinc-300 text-xs leading-relaxed font-normal">
                                    {profile.bio || "No professional bio written yet. Click 'Edit Profile' to add yours!"}
                                </p>
                            )}
                        </div>

                        {/* Skills and tech stack */}
                        <div className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl space-y-4 text-left">
                            <h2 className="text-sm font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                                <LinkIcon className="w-4 h-4 text-purple-400" />
                                Technical Stack & Skills
                            </h2>

                            {isEditMode && (
                                <form onSubmit={addSkill} className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={newSkillText}
                                        onChange={(e) => setNewSkillText(e.target.value)}
                                        placeholder="Add skill (e.g. Next.js)..."
                                        className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                    <button 
                                        type="submit"
                                        className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </form>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {profile.skills.length === 0 ? (
                                    <span className="text-xs text-zinc-500">No skills added yet.</span>
                                ) : (
                                    profile.skills.map((skill) => (
                                        <span 
                                            key={skill}
                                            className="text-xs bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all group"
                                        >
                                            {skill}
                                            {isEditMode && (
                                                <button 
                                                    type="button"
                                                    onClick={() => removeSkill(skill)}
                                                    className="text-zinc-500 group-hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Experience Timeline */}
                        <div className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl space-y-5 text-left">
                            <div className="flex justify-between items-center">
                                <h2 className="text-sm font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Briefcase className="w-4 h-4 text-indigo-400" />
                                    Professional Experience
                                </h2>
                            </div>

                            {/* Live Experience Creator Box */}
                            {isEditMode && (
                                <form onSubmit={addExperience} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Add New Role</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input 
                                            type="text" 
                                            placeholder="Company (e.g. Google)"
                                            value={newExpCompany}
                                            onChange={(e) => setNewExpCompany(e.target.value)}
                                            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Role (e.g. UI Developer)"
                                            value={newExpRole}
                                            onChange={(e) => setNewExpRole(e.target.value)}
                                            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Duration (e.g. 2024 - Present)"
                                        value={newExpDuration}
                                        onChange={(e) => setNewExpDuration(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none"
                                    />
                                    <textarea 
                                        placeholder="Brief Description of responsibilities..."
                                        value={newExpDesc}
                                        onChange={(e) => setNewExpDesc(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs p-3 rounded-lg focus:outline-none min-h-[60px]"
                                    />
                                    <button 
                                        type="submit"
                                        className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Experience
                                    </button>
                                </form>
                            )}

                            {/* Render Experience list */}
                            <div className="space-y-4">
                                {profile.experience.length === 0 ? (
                                    <div className="text-xs text-zinc-500 py-2">No experience logged. Click Edit Profile to append.</div>
                                ) : (
                                    profile.experience.map((item) => (
                                        <div key={item.id} className="relative pl-6 border-l-2 border-zinc-800/80 group">
                                            {/* Timeline Node Bullet */}
                                            <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-zinc-950 shadow shadow-indigo-500/50" />
                                            
                                            {isEditMode ? (
                                                <div className="space-y-3 p-4 bg-zinc-950/60 border border-zinc-800/50 rounded-2xl mb-4 text-left">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Modify Position Details</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => deleteExperience(item.id)}
                                                            className="text-red-400 hover:text-red-300 text-[10px] font-bold flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Remove
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[9px] text-zinc-500 font-bold mb-1 block">Company</label>
                                                            <input 
                                                                type="text" 
                                                                value={item.company}
                                                                onChange={(e) => {
                                                                    const updated = profile.experience.map(x => x.id === item.id ? { ...x, company: e.target.value } : x);
                                                                    setProfile({ ...profile, experience: updated });
                                                                }}
                                                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-zinc-500 font-bold mb-1 block">Role</label>
                                                            <input 
                                                                type="text" 
                                                                value={item.role}
                                                                onChange={(e) => {
                                                                    const updated = profile.experience.map(x => x.id === item.id ? { ...x, role: e.target.value } : x);
                                                                    setProfile({ ...profile, experience: updated });
                                                                }}
                                                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[9px] text-zinc-500 font-bold mb-1 block">Duration</label>
                                                            <input 
                                                                type="text" 
                                                                value={item.duration}
                                                                onChange={(e) => {
                                                                    const updated = profile.experience.map(x => x.id === item.id ? { ...x, duration: e.target.value } : x);
                                                                    setProfile({ ...profile, experience: updated });
                                                                }}
                                                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-1.5 px-3 rounded-lg focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] text-zinc-500 font-bold mb-1 block">Responsibilities & Accomplishments</label>
                                                        <textarea 
                                                            value={item.description}
                                                            onChange={(e) => {
                                                                const updated = profile.experience.map(x => x.id === item.id ? { ...x, description: e.target.value } : x);
                                                                setProfile({ ...profile, experience: updated });
                                                            }}
                                                            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs p-2 rounded-lg focus:outline-none min-h-[50px] leading-relaxed"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-start gap-3">
                                                    <div>
                                                        <h3 className="text-xs font-bold text-zinc-200">{item.role}</h3>
                                                        <p className="text-[10px] text-zinc-400 mt-0.5">{item.company} &middot; <span className="text-[9px] text-zinc-500">{item.duration}</span></p>
                                                        {item.description && (
                                                            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{item.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Education Timeline */}
                        <div className="p-6 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl space-y-5 text-left">
                            <div className="flex justify-between items-center">
                                <h2 className="text-sm font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                                    <BookOpen className="w-4 h-4 text-purple-400" />
                                    Education
                                </h2>
                            </div>

                            {/* Live Education Creator Box */}
                            {isEditMode && (
                                <form onSubmit={addEducation} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Add New Education Log</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input 
                                            type="text" 
                                            placeholder="Institution (e.g. Stanford)"
                                            value={newEduSchool}
                                            onChange={(e) => setNewEduSchool(e.target.value)}
                                            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Degree (e.g. B.S. CS)"
                                            value={newEduDegree}
                                            onChange={(e) => setNewEduDegree(e.target.value)}
                                            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Duration (e.g. 2016 - 2020)"
                                        value={newEduDuration}
                                        onChange={(e) => setNewEduDuration(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-2 px-3 rounded-lg focus:outline-none"
                                    />
                                    <button 
                                        type="submit"
                                        className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Education
                                    </button>
                                </form>
                            )}

                            {/* Render Education List */}
                            <div className="space-y-4">
                                {profile.education.length === 0 ? (
                                    <div className="text-xs text-zinc-500 py-2">No education logged. Click Edit Profile to append.</div>
                                ) : (
                                    profile.education.map((item) => (
                                        <div key={item.id} className="relative pl-6 border-l-2 border-zinc-800/80 group">
                                            {/* Timeline Node Bullet */}
                                            <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-purple-500 border border-zinc-950 shadow shadow-purple-500/50" />
                                            
                                            {isEditMode ? (
                                                <div className="space-y-3 p-4 bg-zinc-950/60 border border-zinc-800/50 rounded-2xl mb-4 text-left">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Modify Education Details</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => deleteEducation(item.id)}
                                                            className="text-red-400 hover:text-red-300 text-[10px] font-bold flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Remove
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[9px] text-zinc-500 font-bold mb-1 block">Institution</label>
                                                            <input 
                                                                type="text" 
                                                                value={item.institution}
                                                                onChange={(e) => {
                                                                    const updated = profile.education.map(x => x.id === item.id ? { ...x, institution: e.target.value } : x);
                                                                    setProfile({ ...profile, education: updated });
                                                                }}
                                                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-zinc-500 font-bold mb-1 block">Degree / Certificate</label>
                                                            <input 
                                                                type="text" 
                                                                value={item.degree}
                                                                onChange={(e) => {
                                                                    const updated = profile.education.map(x => x.id === item.id ? { ...x, degree: e.target.value } : x);
                                                                    setProfile({ ...profile, education: updated });
                                                                }}
                                                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] text-zinc-500 font-bold mb-1 block">Duration</label>
                                                        <input 
                                                            type="text" 
                                                            value={item.duration}
                                                            onChange={(e) => {
                                                                const updated = profile.education.map(x => x.id === item.id ? { ...x, duration: e.target.value } : x);
                                                                setProfile({ ...profile, education: updated });
                                                            }}
                                                            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs py-1.5 px-3 rounded-lg focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-start gap-3">
                                                    <div>
                                                        <h3 className="text-xs font-bold text-zinc-200">{item.degree}</h3>
                                                        <p className="text-[10px] text-zinc-400 mt-0.5">{item.institution} &middot; <span className="text-[9px] text-zinc-500">{item.duration}</span></p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                </div>

            </div>

            {/* AVATAR UPLOAD MODAL */}
            <AnimatePresence>
                {isAvatarModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAvatarModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />

                        {/* Modal Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-2xl z-10 space-y-6"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-base font-bold text-white">Upload Profile Photo</h3>
                                <button 
                                    onClick={() => setIsAvatarModalOpen(false)}
                                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Upload Area */}
                            <div className="space-y-4">
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-2xl p-8 cursor-pointer hover:bg-indigo-500/5 transition-all text-center group">
                                    <Camera className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400 mb-3 transition-colors animate-pulse" />
                                    <span className="text-xs font-bold text-zinc-300">Choose Profile Image File</span>
                                    <span className="text-[10px] text-zinc-500 mt-1">PNG, JPG or WEBP (Max 1.5MB)</span>
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>

                                {profile.avatarUrl && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfile({ ...profile, avatarUrl: "" });
                                            setIsAvatarModalOpen(false);
                                            toast.success("Reset to default generic avatar!");
                                        }}
                                        className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Remove Photo / Reset to Default
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
