import { supabase } from "@/src/lib/supabase";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
        redirect("/");
    }

    // Verify admin role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .single();

    if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-2">Bienvenido al panel de administración.</p>
            </div>
        </div>
    );
}
