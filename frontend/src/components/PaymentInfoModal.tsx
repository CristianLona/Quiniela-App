import { useState } from 'react';
import { Copy, Check, Banknote, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Modal } from './ui/Modal';

interface PaymentInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PaymentInfoModal({ isOpen, onClose }: PaymentInfoModalProps) {
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const beneficiary = import.meta.env.VITE_PAYMENT_BENEFICIARY || '';
    const clabe = import.meta.env.VITE_PAYMENT_CLABE || '';
    const bank = import.meta.env.VITE_PAYMENT_BANK || '';
    

    // Reset reveal state when modal closes
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
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 group hover:border-zinc-700 transition-colors">
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
            <p className={`text-base font-mono font-bold tracking-wide transition-all duration-300 ${
                revealed ? 'text-white' : 'text-zinc-600 select-none blur-[2px]'
            }`}>
                {revealed ? value : maskValue(value)}
            </p>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Información de Pago">
            <div className="space-y-5 pb-2">

                {/* Security Notice */}
                <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-xl p-4 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#22c55e] shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Esta información solo es visible para usuarios autenticados. 
                        <strong className="text-zinc-300"> Deposita antes del inicio de la jornada</strong> y envía tu comprobante al administrador.
                    </p>
                </div>

                {/* Reveal Button */}
                {!revealed && (
                    <button
                        onClick={() => setRevealed(true)}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
                    >
                        <div className="p-2 bg-[#22c55e]/10 rounded-lg group-hover:bg-[#22c55e]/20 transition-colors">
                            <Eye className="w-5 h-5 text-[#22c55e]" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Mostrar datos de pago</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Toca para revelar</p>
                        </div>
                    </button>
                )}

                {/* Payment Details */}
                <div className={`space-y-3 transition-all duration-500 ${revealed ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    
                    {/* Beneficiary */}
                    {beneficiary && (
                        <PaymentField label="Beneficiario" value={beneficiary} fieldKey="beneficiary" />
                    )}

                    {/* Bank */}
                    {bank && (
                        <PaymentField label="Banco" value={bank} fieldKey="bank" />
                    )}
                    
                    {/* CLABE */}
                    {clabe && (
                        <PaymentField label="CLABE Interbancaria" value={clabe} fieldKey="clabe" />
                    )}
                </div>

                {/* Hide button when revealed */}
                {revealed && (
                    <button
                        onClick={() => setRevealed(false)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="font-bold uppercase tracking-wider">Ocultar datos</span>
                    </button>
                )}

                {/* Footer note */}
                <div className="pt-2 border-t border-zinc-800/50">
                    <div className="flex items-start gap-2">
                        <Banknote className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-zinc-600 leading-relaxed">
                            Una vez realizado el depósito, envía tu comprobante de pago al administrador 
                            para que tu quiniela sea marcada como pagada.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
