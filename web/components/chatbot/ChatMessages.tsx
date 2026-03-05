'use client'
import { useEffect, useRef } from 'react'
import { Message } from './ChatbotPage' // Asegúrate que la ruta sea correcta
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
    messages: Message[]
    loading: boolean
}

export default function ChatMessages({ messages, loading }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >

                        {msg.role === 'assistant' && (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border shadow-sm overflow-hidden">
                                <img
                                    src="/images/gatito.jpg"
                                    alt="Amanera AI"
                                />
                            </div>
                        )}
                        <div className={`flex flex-col gap-2 group ${msg.role === 'user' ? 'max-w-[85%] items-end' : 'flex-1'}`}>
                            <div
                                className={`text-[15px] md:text-[16px] leading-[1.6] ${msg.role === 'user'
                                    ? 'bg-muted/80 px-5 py-3 rounded-[24px] text-foreground'
                                    : 'text-foreground/90'
                                    }`}
                            >
                                {msg.content}
                            </div>

                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity px-1">
                                {format(msg.timestamp, 'HH:mm', { locale: es })}
                            </span>
                        </div>

                        {/* Avatar Usuario - Opcional, Gemini a veces no lo muestra */}
                        {msg.role === 'user' && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[12px] font-bold text-orange-700">
                                JD
                            </div>
                        )}
                    </div>
                ))}

                {/* Indicador de carga tipo "Pulse" */}
                {loading && (
                    <div className="flex gap-4 md:gap-6 justify-start animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-3 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} className="h-4" />
            </div>
        </div>
    )
}