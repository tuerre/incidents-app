'use client'
import { useState, useRef, useEffect } from 'react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const SUGGESTED_QUESTIONS = [
    '¿Cuántas incidencias hay hoy con prioridad urgente?',
    '¿Cuáles son las incidencias abiertas esta semana?',
    '¿Qué usuario tiene más incidencias asignadas?',
]

export default function ChatBot() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Puedo consultarte información sobre las incidencias del sistema. ¿Qué necesitas saber?' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text?: string) => {
        const userMessage = text || input
        if (!userMessage.trim()) return

        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            })
            const data = await res.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error al procesar tu consulta.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border rounded-xl shadow-lg bg-white">
            {/* Header */}
            <div className="p-4 border-b bg-blue-600 rounded-t-xl">
                <h2 className="text-white font-semibold">🤖 Asistente de Incidencias</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-none">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Suggested questions */}
            {messages.length === 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button key={i} onClick={() => sendMessage(q)}
                            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100">
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Pregunta sobre las incidencias..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                />
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    Enviar
                </button>
            </div>
        </div>
    )
}