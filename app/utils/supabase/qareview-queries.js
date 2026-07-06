import { supabase } from "./client";

export async function getReportsData() {
    // Review Actions
    let actionsAll = [];
    let actionsFrom = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
        .from("qryReviewAction")
        .select("*")
        .range(actionsFrom, actionsFrom + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        actionsAll = [...actionsAll, ...data];

        if (data.length < pageSize) break;

        actionsFrom += pageSize;
    }

    // Assigned Reviews
    const { data: assignedReviews, reviewError } = await supabase
        .from("qryAssignedReviews")
        .select("*");

    if (reviewError) throw reviewError;

    // Distress Reviews
    let distressAll = [];
    let distressFrom = 0;

    while (true) {
        const { data, error } = await supabase
        .from("qryDistressReviews")
        .select("*")
        .neq("Pattern", "UNKNOWN")
        .range(distressFrom, distressFrom + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        distressAll = [...distressAll, ...data];

        if (data.length < pageSize) break;

        distressFrom += pageSize;
    }

    // Miles Reviewed
    const { data: milesReviewed, milesError } = await supabase
        .from("qryMilesReviewed")
        .select("*");

    if (milesError) throw milesError;

    return {
        reviewActions: actionsAll,
        assignedReviews,
        distressReviews: distressAll,
        milesReviewed
    };
}

export async function getUserMilesBreakdown(DataYear) {
    const { data, error } = await supabase
        .rpc('get_user_miles', { p_year: DataYear });
    
    if (error) throw error;

    return data;
}

export async function getDetailedReport(DataYear) {
    const { data, error } = await supabase
        .rpc('get_qa_review_report', { p_year: DataYear });
    
    if (error) throw error;

    return data;
}