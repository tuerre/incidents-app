'use client'

import { useState } from 'react'
import ChatStats from './ChatStats'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: '¡Hola! Soy tu asistente IA en Amanera. Puedo ayudarte a analizar incidencias, revisar estados y generar resúmenes en tiempo real. ¿En qué puedo apoyarte hoy?',
            timestamp: new Date(),
        },
    ])
    const [loading, setLoading] = useState(false)

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMsg])
        setLoading(true)

        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            })

            const data = await res.json()

            setMessages(prev => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: data.response,
                    timestamp: new Date(),
                },
            ])
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: '⚠️ Hubo un error al conectar con el servidor. Por favor, verifica tu conexión.',
                    timestamp: new Date(),
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
            <aside className="hidden lg:flex w-80 shrink-0 border-r flex-col bg-muted/10">
                <div className="p-6 overflow-y-auto">
                    <ChatStats onQuickQuestion={sendMessage} />
                </div>
            </aside>

            <main className="flex flex-1 flex-col min-w-0 relative">
                <div className="flex items-center justify-between px-6 py-3 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Asistente de Incidencias</span>
                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                        MODELO: GEMINI-PRO-ANALYTICS
                    </div>
                </div>

                <ChatMessages messages={messages} loading={loading} />

                <ChatInput onSend={sendMessage} loading={loading} />
            </main>
        </div>
    )
}