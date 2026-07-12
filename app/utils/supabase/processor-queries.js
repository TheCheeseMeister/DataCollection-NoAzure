import { supabase } from "./client";

// Tenth Mile Queries

export async function getDirections() {
    const { data, error } = await supabase
        .from("tblDirections")
        .select("*");

    if (error) throw error;

    return data;
}

export async function getGPSData() {
    const { data, error } = await supabase
        .from("tblGPS")
        .select("*");

    if (error) throw error;

    return data;
}

export async function getAllGPSData(routes) {
    const pageSize = 1000;
    let allData = [];
    let from = 0;

    while (true) {
        const { data, error } = await supabase
            .from("tblGPS")
            .select("*")
            .in("Rte", routes)
            .range(from, from + pageSize - 1);

        if (error) throw error;

        allData.push(...data);

        if (data.length < pageSize) {
            break;
        }

        from += pageSize;
    }

    return allData;
}

export async function getSectionData() {
    const { data, error } = await supabase
        .from("tblRoadSections")
        .select("*");

    if (error) throw error;

    return data;
}