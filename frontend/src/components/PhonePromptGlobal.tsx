import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Modal } from './ui/Modal';
import { toast } from 'sonner';
import { Phone, Loader2 } from 'lucide-react';

export function PhonePromptGlobal() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) {
            setIsOpen(false);
            setLoading(false);
            return;
        }

        api.users.getMe().then(res => {
            if (res.success && (!res.user || !res.user.phoneNumber)) {
                setIsOpen(true);
            }
        }).catch(err => {
            console.error("Failed to check phone number", err);
        }).finally(() => {
            setLoading(false);
        });
    }, [user]);

    const handleSave = async () => {
        if (!phone || phone.length < 10) {
            toast.error("Ingresa un número válido de 10 dígitos");
            return;
        }
        setSaving(true);
        try {
            await api.users.savePhoneNumber(phone);
            toast.success("Número guardado exitosamente");
            setIsOpen(false);
        } catch (e) {
            toast.error("Error al guardar el número");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={() => {}} title="Información de Contacto" hideCloseButton={true}>
            <div className="space-y-4">
                <div className="flex justify-center mb-4 text-[#22c55e]">
                    <Phone className="w-12 h-12" />
                </div>
                <p className="text-zinc-300 text-sm text-center">
                    Para identificarte mejor y agregarte a los grupos de WhatsApp, por favor ingresa tu número de teléfono.
                </p>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Número de WhatsApp</label>
                    <input 
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10 dígitos"
                        maxLength={10}
                        className="w-full bg-[#09090b] text-white p-3 rounded-xl border border-zinc-800 focus:border-[#22c55e] outline-none font-bold tracking-widest text-center"
                    />
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving || phone.length < 10}
                    className="w-full bg-[#22c55e] text-black font-black py-4 rounded-xl hover:bg-[#1faa50] transition-colors flex justify-center items-center gap-2 mt-4"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Número'}
                </button>
            </div>
        </Modal>
    );
}
