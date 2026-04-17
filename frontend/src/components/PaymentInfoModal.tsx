import { MessageCircle, Users } from 'lucide-react';
import { Modal } from './ui/Modal';
import { useAuth } from '../context/AuthContext';

interface PaymentInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PaymentInfoModal({ isOpen, onClose }: PaymentInfoModalProps) {
    const { user } = useAuth();

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
        onClose();
    };

    

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
