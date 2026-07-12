import { supabase } from "./client";

// Tenth Mile Queries

export async function getDirections() {
    const { data, error } = await supabase
        .from("tblDirections")
        .select("*");
    
    if (error) throw error;

    return data;
}