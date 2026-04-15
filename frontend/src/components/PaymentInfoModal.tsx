import { useState } from 'react';
import { Copy, Check, Banknote, ShieldCheck, Eye, EyeOff, MessageCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useAuth } from '../context/AuthContext';

interface PaymentInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PaymentInfoModal({ isOpen, onClose }: PaymentInfoModalProps) {
    const { user } = useAuth();
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [showBankInfo, setShowBankInfo] = useState(false);

    const beneficiary = import.meta.env.VITE_PAYMENT_BENEFICIARY || '';
    const clabe = import.meta.env.VITE_PAYMENT_CLABE || '';
    const bank = import.meta.env.VITE_PAYMENT_BANK || '';
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '';
    const whatsappGroup = import.meta.env.VITE_WHATSAPP_GROUP || '';

    // Build pre-filled WhatsApp message with user info
    const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
    const whatsappMessage = encodeURIComponent(
        `*ProQuiniela - Comprobante de Pago*\n\n` +
        `Nombre: *${userName}*\n` +
        `Email: ${user?.email || 'N/A'}\n\n` +
        `Adjunto mi comprobante de pago`
    );
    // whatsapp://send lets the user pick WHO to send to (group or person)
    const whatsappShareLink = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

    // Reset state when modal closes
    const handleClose = () => {
        setRevealed(false);
        setCopied(null);
        onClose();
    };

    const maskValue = (value: string) => {
        if (value.length <= 4) return '••••';
        return '•'.repeat(value.length - 4) + value.slice(-4);
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        }
    };

    const PaymentField = ({ label, value, fieldKey }: { label: string; value: string; fieldKey: string }) => (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 md:p-4 group hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
                {revealed && value && (
                    <button
                        onClick={() => copyToClipboard(value, fieldKey)}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md transition-all"
                        style={{
                            color: copied === fieldKey ? '#22c55e' : '#71717a',
                            background: copied === fieldKey ? 'rgba(34,197,94,0.1)' : 'transparent',
                        }}
                    >
                        {copied === fieldKey ? (
                            <>
                                <Check className="w-3 h-3" />
                                Copiado
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                Copiar
                            </>
                        )}
                    </button>
                )}
            </div>
            <p className={`text-sm md:text-base font-mono font-bold tracking-wide transition-all duration-300 ${
                revealed ? 'text-white' : 'text-zinc-600 select-none blur-[2px]'
            }`}>
                {revealed ? value : maskValue(value)}
            </p>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Pago y Contacto">
            <div className="space-y-4 pb-2">

                {/* ─── SECTION 1: WhatsApp — Send payment proof ─── */}
                {(whatsappNumber || true) && (
                    <div className="space-y-2.5">
                        <h3 className="text-[10px] font-bold text-[#25D366] uppercase tracking-widest flex items-center gap-1.5">
                            <MessageCircle className="w-3 h-3" />
                            Enviar comprobante
                        </h3>
                        <a
                            href={whatsappShareLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 p-3.5 md:p-4 bg-[#25D366]/10 border border-[#25D366]/25 rounded-xl hover:bg-[#25D366]/15 transition-all active:scale-[0.98] group"
                        >
                            <div className="p-2.5 bg-[#25D366] rounded-xl shrink-0 shadow-lg shadow-[#25D366]/20">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white group-hover:text-[#25D366] transition-colors">Enviar comprobante</p>
                                <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">
                                    Elige el grupo o contacto — tu nombre: <span className="text-zinc-300 font-medium">{userName}</span>
                                </p>
                            </div>
                            <div className="text-zinc-600 group-hover:text-[#25D366] transition-colors shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </div>
                        </a>
                        <p className="text-[10px] text-zinc-600 leading-relaxed px-1">
                            Se abrirá WhatsApp con un mensaje listo. Elige el grupo de la quiniela, adjunta tu captura y envía.
                        </p>
                    </div>
                )}

                {/* ─── SECTION 2: WhatsApp Group ─── */}
                {whatsappGroup && (
                    <div className="space-y-2.5">
                        <h3 className="text-[10px] font-bold text-[#25D366] uppercase tracking-widest flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            Grupo de la Quiniela
                        </h3>
                        <a
                            href={whatsappGroup}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-[#25D366]/30 hover:bg-zinc-900/80 transition-all active:scale-[0.98] group"
                        >
                            <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-[#25D366]/15 transition-colors shrink-0">
                                <Users className="w-4 h-4 text-zinc-400 group-hover:text-[#25D366] transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Unirse al grupo</p>
                                <p className="text-[10px] text-zinc-600">Resultados, noticias y más</p>
                            </div>
                            <div className="text-zinc-700 group-hover:text-[#25D366] transition-colors shrink-0">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </div>
                        </a>
                    </div>
                )}

                {/* ─── Divider ─── */}
                {(whatsappNumber || whatsappGroup) && (beneficiary || clabe) && (
                    <div className="flex items-center gap-3 pt-1">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Datos bancarios</span>
                        <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>
                )}

                {/* ─── SECTION 3: Bank Info (collapsible + revealable) ─── */}
                {(beneficiary || clabe) && (
                    <div className="space-y-3">
                        {/* Toggle to show/hide bank section */}
                        <button
                            onClick={() => setShowBankInfo(!showBankInfo)}
                            className="w-full flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition-all"
                        >
                            <div className="flex items-center gap-2.5">
                                <Banknote className="w-4 h-4 text-zinc-500" />
                                <span className="text-xs font-bold text-zinc-400">Cuenta para transferencia</span>
                            </div>
                            {showBankInfo ? (
                                <ChevronUp className="w-4 h-4 text-zinc-600" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-zinc-600" />
                            )}
                        </button>

                        {showBankInfo && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Security Notice */}
                                <div className="bg-[#22c55e]/5 border border-[#22c55e]/15 rounded-xl p-3 flex gap-2.5">
                                    <ShieldCheck className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                                        Información protegida. Toca <strong className="text-zinc-300">revelar</strong> para ver los datos completos.
                                    </p>
                                </div>

                                {/* Reveal Button */}
                                {!revealed && (
                                    <button
                                        onClick={() => setRevealed(true)}
                                        className="w-full flex items-center justify-center gap-2.5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                                    >
                                        <div className="p-1.5 bg-[#22c55e]/10 rounded-lg group-hover:bg-[#22c55e]/20 transition-colors">
                                            <Eye className="w-4 h-4 text-[#22c55e]" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-white">Mostrar datos de pago</p>
                                        </div>
                                    </button>
                                )}

                                {/* Payment Details */}
                                <div className={`space-y-2.5 transition-all duration-500 ${revealed ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                    {beneficiary && (
                                        <PaymentField label="Beneficiario" value={beneficiary} fieldKey="beneficiary" />
                                    )}
                                    {bank && (
                                        <PaymentField label="Banco" value={bank} fieldKey="bank" />
                                    )}
                                    {clabe && (
                                        <PaymentField label="CLABE Interbancaria" value={clabe} fieldKey="clabe" />
                                    )}
                                </div>

                                {/* Hide button when revealed */}
                                {revealed && (
                                    <button
                                        onClick={() => setRevealed(false)}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        <EyeOff className="w-3 h-3" />
                                        <span className="font-bold uppercase tracking-wider">Ocultar datos</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer note */}
                <div className="pt-2 border-t border-zinc-800/50">
                    <p className="text-[10px] text-zinc-600 leading-relaxed text-center">
                        Deposita antes del primer partido y envía tu comprobante para ser marcado como pagado.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
