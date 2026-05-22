import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Navbar } from "../components/layout/Navbar";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.token, data.user);
                toast.success("Account created successfully!");
                navigate("/");
            } else {
                toast.error(data.message || "Failed to register");
            }
        } catch {
            toast.error("Network error. Is the server running?");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden text-zinc-900 dark:text-zinc-50 transition-colors">
            <Navbar />
            
            {/* Background Ambient Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none transition-colors" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 dark:bg-purple-600/10 blur-[120px] pointer-events-none transition-colors" />

            <div className="flex-1 flex flex-col items-center justify-center p-4 z-10">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-white">Create Account</h1>
                        <p className="text-zinc-550 dark:text-zinc-400 text-sm">Sign up to start collaborating in real-time</p>
                    </div>

                    <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl transition-colors">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                icon={User}
                                placeholder="johndoe"
                            />

                            <Input
                                label="Email Address"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={Mail}
                                placeholder="you@example.com"
                            />

                            <Input
                                label="Password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={Lock}
                                placeholder="••••••••"
                            />

                            <div className="pt-2">
                                <Button 
                                    type="submit" 
                                    fullWidth 
                                    isLoading={isLoading}
                                >
                                    {!isLoading && <UserPlus className="w-4 h-4 mr-2" />}
                                    Create Account
                                </Button>
                            </div>
                        </form>

                        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800/50 text-center">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Already have an account?{" "}
                                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;