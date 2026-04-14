import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Trophy, Loader2, ArrowRight, UserPlus, User, Lock as LockIcon } from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Capturar posibles errores del redirect al regresar a la app
    useEffect(() => {
        getRedirectResult(auth).catch((error) => {
            console.error("Redirect Error:", error);
            toast.error('Ocurrió un error al volver de Google');
        });
    }, []);

    // If already logged in, redirect to home
    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            // Se usa Redirect en lugar de Popup para saltar bloqueadores
            await signInWithRedirect(auth, googleProvider);
        } catch (error: any) {
            console.error(error);
            toast.error('Error al redirigir a Google');
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isLogin && !name) return toast.error('Ingresa tu nombre completo');
        if (!email || !password) return toast.error('Ingresa correo y contraseña');

        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success('Sesión iniciada correctamente');
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
                toast.success('Cuenta creada exitosamente');
            }
            navigate('/');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Este correo ya está registrado. Intenta iniciar sesión.');
            } else if (error.code === 'auth/weak-password') {
                toast.error('La contraseña debe tener al menos 6 caracteres.');
            } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                toast.error('Correo o contraseña incorrectos');
            } else {
                toast.error(isLogin ? 'Error al iniciar sesión' : 'Error al crear la cuenta');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] font-sans relative flex items-center justify-center p-4 overflow-hidden">
            
            {/* Background Texture - Dot Pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            {/* Gradient Orbs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#22c55e]/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-zinc-800/30 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
            </div>

            {/* Main Login Card */}
            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                {/* Logo / Brand Header */}
                <div className="flex flex-col items-center justify-center mb-8 gap-2">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#22c55e] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                        <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5 relative z-10">
                            <Trophy className="w-10 h-10 text-[#22c55e]" />
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Pro<span className="text-[#22c55e]">Quiniela</span>
                        </h1>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">
                            {isLogin ? 'Acceso Oficial' : 'Registro de Jugador'}
                        </p>
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 font-sans rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-[#22c55e]/5">
                    
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="group relative w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black py-4 px-4 rounded-xl font-black uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-xl"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {isLogin ? 'Accede con Google' : 'Regístrate con Google'}
                        <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </button>

                    <div className="flex items-center my-8">
                        <div className="flex-1 border-t border-zinc-800"></div>
                        <span className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">O con correo</span>
                        <div className="flex-1 border-t border-zinc-800"></div>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-5">
                        
                        {/* Nombre Input (Only for Sign Up) */}
                        {!isLogin && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Nombre Completo</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 group-focus-within:text-[#22c55e] transition-colors" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-[#09090b] border border-zinc-800 text-white font-bold rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all placeholder:text-zinc-600 placeholder:font-medium [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#09090b] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 group-focus-within:text-[#22c55e] transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-[#09090b] border border-zinc-800 text-white font-bold rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all placeholder:text-zinc-600 placeholder:font-medium [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#09090b] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                                    placeholder="tu@correo.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Contraseña</label>
                            <div className="relative group">
                                <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 group-focus-within:text-[#22c55e] transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-[#09090b] border border-zinc-800 text-white font-bold rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] transition-all placeholder:text-zinc-600 placeholder:font-medium tracking-widest [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#09090b] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !email || !password || (!isLogin && !name)}
                            className="group w-full bg-zinc-800 hover:bg-[#22c55e] text-zinc-300 hover:text-black py-4 rounded-xl font-black uppercase transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isLogin ? (
                                <>
                                    <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Entrar
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Crear Cuenta
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Button */}
                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setEmail(''); // Clear on toggle mapping cleaner UX
                                setPassword('');
                            }}
                            className="text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-wider"
                        >
                            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia Sesión'}
                        </button>
                    </div>
                </div>

                <div className="text-center mt-6 text-zinc-600 text-xs font-medium">
                    Plataforma Oficial de Pronósticos Deportivos
                </div>
            </div>
        </div>
    );
};

export default Login;
