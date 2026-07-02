import { supabase } from "@/lib/supabase"

export async function GET() {
    /*const { data, error } = await supabase
        .from("tblCertificateVerificationResult")
        .select("*")
    
    return Response.json(data)*/
    return Response.json({ message: "hello works" });
}