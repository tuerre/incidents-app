// app/api/chatbot/route.ts
import { supabaseAdmin } from '@/lib/supabase-admin'
import OpenAI from 'openai'
import { DB_SCHEMA } from '@/lib/db-schema'
import { NextRequest, NextResponse } from 'next/server'

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
})

const MODEL = 'openrouter/free'

// Limpia el SQL que devuelve la IA (quita backticks, comentarios, texto extra)
function cleanSQL(raw: string): string {
    let sql = raw.trim()

    // Quitar bloques ```sql ... ``` o ``` ... ```
    sql = sql.replace(/```(?:sql)?\s*/gi, '').replace(/```/g, '')

    // Quitar líneas que son comentarios SQL -- o #
    sql = sql.split('\n')
        .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('#'))
        .join('\n')

    // Quitar texto antes del SELECT (el modelo a veces escribe "Aquí está la consulta: SELECT...")
    const selectIndex = sql.toUpperCase().indexOf('SELECT')
    if (selectIndex > 0) {
        sql = sql.substring(selectIndex)
    }

    // Quitar punto y coma al final (puede romper el RPC)
    sql = sql.trim().replace(/;+$/, '')

    return sql.trim()
}

function isSafeQuery(sql: string): boolean {
    const upperSQL = sql.toUpperCase()
    if (!upperSQL.trim().startsWith('SELECT')) return false
    const dangerous = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE']
    return !dangerous.some(word => upperSQL.includes(word))
}

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json()

        if (!message?.trim()) {
            return NextResponse.json({ response: 'Por favor escribe una pregunta.' }, { status: 200 })
        }

        const supabase = supabaseAdmin

        // --- PASO 1: Generar SQL desde la pregunta ---
        const sqlResult = await client.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `${DB_SCHEMA}\n\nResponde ÚNICAMENTE con la consulta SQL SELECT pura, sin explicaciones, sin bloques de código, sin backticks, sin punto y coma al final. Si la pregunta no requiere datos de la BD (saludos, preguntas generales), responde exactamente: NO_SQL`,
                },
                {
                    role: 'user',
                    content: message,
                },
            ],
        })

        const rawSQL = sqlResult.choices[0].message.content?.trim() ?? 'NO_SQL'
        const generatedSQL = cleanSQL(rawSQL)

        // Log para debug (puedes quitarlo en producción)
        console.log('SQL generado (raw):', rawSQL)
        console.log('SQL limpio:', generatedSQL)

        let queryData = null
        let queryError = null

        // --- PASO 2: Ejecutar SQL si es necesario y seguro ---
        if (generatedSQL !== 'NO_SQL' && isSafeQuery(generatedSQL)) {
            const { data, error } = await supabase.rpc('execute_query', {
                query_text: generatedSQL,
            })
            queryData = data
            queryError = error

            console.log('queryData:', JSON.stringify(queryData))
            console.log('queryError:', JSON.stringify(queryError))
            console.log('SQL ejecutado:', generatedSQL)

            if (queryError) {
                console.error('Supabase RPC error:', queryError)
                console.error('SQL que causó el error:', generatedSQL)
            }
        }

        // --- PASO 3: Generar respuesta natural con los datos ---
        const responseResult = await client.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `Eres un asistente inteligente para un sistema de gestión de incidencias. 
Responde siempre en español, de forma clara y concisa.
Si recibes datos, interprétalos y responde naturalmente.
Si hay números importantes, resáltalos en la respuesta.
Si no hay datos o la consulta no devolvió resultados, indícalo claramente.
No menciones SQL ni detalles técnicos en tu respuesta.`,
                },
                {
                    role: 'user',
                    content: `El usuario preguntó: "${message}"
${queryData ? `\nDatos de la base de datos: ${JSON.stringify(queryData)}` : ''}
${queryError ? `\nHubo un error al consultar la base de datos: ${queryError.message}` : ''}
${generatedSQL === 'NO_SQL' ? '\n(Esta pregunta no requería consultar la base de datos)' : ''}`,
                },
            ],
        })

        const finalResponse = responseResult.choices[0].message.content ?? 'No pude generar una respuesta.'

        return NextResponse.json({ response: finalResponse }, { status: 200 })

    } catch (error: any) {
        console.error('Chatbot API error:', error)

        if (error?.status === 429) {
            return NextResponse.json({
                response: '⚠️ El servicio de IA está temporalmente limitado. Intenta de nuevo en unos segundos.',
            }, { status: 200 })
        }

        if (error?.status === 401) {
            return NextResponse.json({
                response: '❌ Error de configuración del servicio de IA. Contacta al administrador.',
            }, { status: 200 })
        }

        return NextResponse.json({
            response: '❌ Hubo un error al procesar tu consulta. Intenta de nuevo.',
        }, { status: 200 })
    }
}