'use client'
import { useState, useRef, KeyboardEvent } from 'react'
import { SendHorizonal, HatGlasses, Mic } from 'lucide-react'

interface Props {
    onSend: (text: string) => void
    loading: boolean
}

export default function ChatInput({ onSend, loading }: Props) {
    const [value, setValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = () => {
        if (!value.trim() || loading) return
        onSend(value.trim())
        setValue('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleInput = () => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
            <div className="relative flex items-end gap-2 bg-muted/50 border border-border rounded-[28px] px-2 py-1.5 focus-within:bg-background focus-within:ring-1 focus-within:ring-ring transition-all shadow-sm">

                <button className="p-3 text-muted-foreground hover:text-foreground transition-colors">
                    <HatGlasses className="h-5 w-5" />
                </button>

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Introduce una consulta aquí"
                    disabled={loading}
                    className="flex-1 max-h-[200px] resize-none bg-transparent border-none px-2 py-3 text-base focus:outline-none focus:ring-0 disabled:opacity-50 leading-tight"
                />

                <div className="flex items-center pr-1 pb-1">
                    {value.trim() ? (
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="p-3 bg-transparent text-white/80 rounded-full hover:opacity-90 transition-all"
                        >
                            <SendHorizonal className="h-5 w-5" />
                        </button>
                    ) : (
                        <button className="p-3 text-muted-foreground hover:text-foreground transition-colors">
                            <SendHorizonal className="h-5 w-5 opacity-30 cursor-not-allowed" />
                        </button>
                    )}
                </div>
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground text-center">
                El asistente de IA puede mostrar información imprecisa, incluyendo datos de la base de datos
            </p>
        </div>
    )
}