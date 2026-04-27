import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("priority_keywords")
      .select("id, keyword, priority")
      .order("keyword")

    if (error) {
      console.error("[api/priority-keywords] Error consultando Supabase:", error)
      return NextResponse.json(
        { error: "No se pudieron cargar las palabras clave" },
        { status: 500 },
      )
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (error) {
    console.error("[api/priority-keywords] Error inesperado:", error)
    return NextResponse.json(
      { error: "Error inesperado al cargar palabras clave" },
      { status: 500 },
    )
  }
}
