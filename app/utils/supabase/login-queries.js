import { supabase } from "./client";

// Login Queries

export async function getUser(username) {
    const { data, error } = await supabase
        .from("tblUsers")
        .select("*")
        .eq("UserID", username)
        .eq("activeUser", true)
        .maybeSingle();
    
    if (error) throw error;

    return data;
}

export async function getAllUsers() {
    const { data, error } = await supabase
        .from("tblUsers")
        .select("*")
        .eq("activeUser", true);
    
    if (error) throw error;

    return data;
}

export async function updateUserPassword(username, newCode) {
    const { data, error } = await supabase
        .from("tblUsers")
        .update({
            Password: newCode,
            PassExpired: false
        })
        .eq("UserID", username);
    
    if (error) throw error;
}