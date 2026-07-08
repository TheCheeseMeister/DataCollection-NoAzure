import { supabase } from "./client";

// QA Reports
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

// QA Assignments
export async function getAssignmentData() {
    // Get matching users (unit + region) and their assigned miles. Currently defaults to unit PD and region C since there's no login.
    const { data: matchingUsers } = await supabase
        .from("tblUsers")
        .select("UserID, UserName")
        .eq("activeUser", 1)
        .eq("QAReviewer", 1)
        .eq("Unit", "PD")
        .eq("Region", "C");

    const { data: assignments } = await supabase
        .from("tblQASections")
        .select("AssignedReviewer, Miles")
        .eq("ReviewStatus", "Pending");

    const mileTotals = assignments.reduce((acc, row) => {
        acc[row.AssignedReviewer] =
            (acc[row.AssignedReviewer] || 0) + Number(row.Miles || 0);
        return acc;
    }, {});

    const reviewers = matchingUsers.map(user => ({
        ...user,
        miles: mileTotals[user.UserID] || 0,
    }));

    // Gets sections not currently assigned and creates total list.
    const { data: sections } = await supabase
        .from("tblQASections")
        .select(`
            Miles,
            SectionID,
            AssignedReviewer,
            Region,
            ReasonCode,
            tblReasonLookup!inner(
            AssignedUnit
            )
        `)
        .is("AssignedReviewer", null)
        .eq("ReviewStatus", "Pending")
        .eq("tblReasonLookup.AssignedUnit", "PD")
        .eq("Region", "C");

    const totals = {
        noDistress: 0,
        highIRI: 0,
        sdiChange: 0,
        paveType: 0,
        lowSDI: 0,
        resurfList: 0,
        highRut: 0,
        presList: 0,
        transCracking: 0,
        IRIChange: 0,
    };

    sections.forEach(({ ReasonCode, Miles }) => {
        const miles = Number(Miles) || 0;

        switch (ReasonCode) {
            case 1: totals.noDistress += miles; break;
            case 2: totals.highIRI += miles; break;
            case 3: totals.sdiChange += miles; break;
            case 4: totals.paveType += miles; break;
            case 5: totals.lowSDI += miles; break;
            case 6: totals.resurfList += miles; break;
            case 7: totals.highRut += miles; break;
            case 8: totals.presList += miles; break;
            case 9: totals.sdiChange += miles; break;
            case 10: totals.lowSDI += miles; break;
            case 11: totals.transCracking += miles; break;
            case 12: totals.IRIChange += miles; break;
        }
    });

    return {
        reviewers,
        totals
    };
}

export async function assignMiles(selectedReviewers, sectionsToAssign) {
    // Get the actual sections that need assignment
    const { data: sections, error } = await supabase
        .from("tblQASections")
        .select(`
        *,
        tblReasonLookup!inner(*)
    `)
        .is("AssignedReviewer", null)
        .eq("tblReasonLookup.AssignedUnit", "PD")
        .eq("Region", "C")
        .order("Miles", { ascending: false });

    if (error) throw error;

    if (!sections.length) {
        throw new Error("No sections to assign");
    }

    // Copy reviewers so we can track mileage
    const reviewers = selectedReviewers.map(r => ({
        ...r,
        AssignedMiles: r.AssignedMiles ?? 0
    }));

    const updates = [];

    // Assign each section to reviewer with lowest mileage
    for (const section of sections) {
        const reviewer = reviewers.reduce((lowest, current) =>
            current.AssignedMiles < lowest.AssignedMiles
                ? current
                : lowest
        );

        // Add this section's miles to reviewer total
        reviewer.AssignedMiles += section.Miles;

        updates.push({
            SectionID: section.SectionID,
            AssignedReviewer: reviewer.UserID,
            DateAssigned: new Date().toISOString(),
            ReviewStatus: "Pending"
        });
    }

    // Update each section
    for (const update of updates) {
        const { error: updateError } = await supabase
            .from("tblQASections")
            .update({
                AssignedReviewer: update.AssignedReviewer,
                DateAssigned: update.DateAssigned,
                ReviewStatus: update.ReviewStatus
            })
            .eq("SectionID", update.SectionID);

        if (updateError) throw updateError;
    }

    return updates;
}

export async function removeMileage(selectedReviewers) {
    for (const reviewer of selectedReviewers) {
        const { error } = await supabase
            .from("tblQASections")
            .update({
                AssignedReviewer: null,
                DueDate: null,
                DateAssigned: null
            })
            .eq("AssignedReviewer", reviewer.UserID)
            .eq("ReviewStatus", "Pending");

        if (error) throw error;
    }
}

// QA Review queries
export async function getAssignedReviews(reviewStatus) {
    const { data: reviews, error: reviewError } = await supabase
        .from("tblQASections")
        .select(`
            SectionID,
            Rte,
            Dir,
            MPStart,
            MPEnd,
            DueDate,
            ReviewStatus,
            AssignedReviewer,
            ReviewStatus,
            ElevatedComments,
            ElevatedByUser,
            SetNum,
            DataYear,
            ReasonCode,
            Region
        `)
        .eq("AssignedReviewer", "HelinaB")
        .eq("ReviewStatus", reviewStatus)
        .order("DueDate")
        .order("Rte")
        .order("Dir")
        .order("MPStart");

    if (reviewError) throw reviewError;

    return reviews;
}

export async function getReason(reasonCode) {
    const { data: reason, error: reasonError } = await supabase
        .from("tblReasonLookup")
        .select("*")
        .eq("ReasonCode", reasonCode)
        .single();

    if (reasonError) throw reasonError;

    return reason;
}

export async function getReasonQuery(query, route, dir, MPFrom, MPTo, SectionID, reviewCompleted) {
    const { data, error } = await supabase.rpc(query, {
        p_rte: route,
        p_dir: dir,
        p_mpfrom: MPFrom,
        p_mpto: MPTo
    });

    if (error) throw error;

    if (reviewCompleted) return data;

    const { data: completed, error: completedError } = await supabase
        .from("tblQATenthMile")
        .select("Rte, Dir, MPFrom, MPTo")
        .eq("SectionID", SectionID)
        .not("ReviewCompletedDate", "is", null);

    if (completedError) throw completedError;

    return data.filter((milepost) => {
        return !completed.some((review) =>
            review.Rte === milepost.Rte &&
            review.Dir === milepost.Dir &&
            review.MPFrom === milepost.MPFrom &&
            review.MPTo === milepost.MPTo
        );
    });
}

export async function getReviewComments(reviewAction, reasonCode) {
    const { data, error } = await supabase
        .from("tblReviewComments")
        .select("ReviewComments")
        .eq("ReviewAction", reviewAction)
        .eq("ReasonCode", reasonCode)

    if (error) throw error;

    return data;
}

export async function getSDI(route, dir, MPFrom) {
    const { data, error } = await supabase
        .from("tblRoadData")
        .select("SDI")
        .eq("Rte", route)
        .eq("Dir", dir)
        .eq("MPFrom", MPFrom)
        .single();

    if (error) throw error;

    return data.SDI;
}

export async function insertTenthMileReview(params) {
    const { data, error } = await supabase
        .from("tblQATenthMile")
        .insert(params)
        .select("ID")
        .single();

    if (error) throw error;

    return data.ID;
}

export async function insertDistressCheck(params) {
    const { data, error } = await supabase
        .from("tblDistressCheck")
        .insert(params);

    if (error) throw error;

    return data;
}

export async function updateQASection(SectionID, reviewStartTime) {
    const timeToComplete = Math.floor(
        (new Date() - new Date(reviewStartTime)) / 60000
    );

    const { error } = await supabase
        .from("tblQASections")
        .update({
            ReviewCompletedDate: new Date().toISOString(),
            TimeToComplete: timeToComplete,
            ReviewStatus: "Completed"
        })
        .eq("SectionID", SectionID);

    if (error) {
        console.error(error);
        throw error;
    }
}

export async function queryUserTracking(UserID, SectionID, Username) {
    let { data: tracking, error } = await supabase
        .from("tblUserTracking")
        .select("MilesReviewed")
        .eq("UserID", UserID)
        .maybeSingle();

    if (error) throw error;

    if (!tracking) {
        const { data, error } = await supabase
            .from("tblUserTracking")
            .insert({
                UserID: UserID,
                MilesReviewed: 0
            })
            .select("MilesReviewed")
            .single();

        if (error) throw error;

        tracking = data;
    }

    const prevMiles = tracking.MilesReviewed ?? 0;

    const { data: section, error: sectionError } = await supabase
        .from("tblQASections")
        .select("Miles")
        .eq("SectionID", SectionID)
        .single();

    if (sectionError) throw sectionError;

    const curMiles = prevMiles + section.Miles;

    const { error: updateError } = await supabase
        .from("tblUserTracking")
        .update({
            MilesReviewed: curMiles,
            DateUpdated: new Date().toISOString()
        })
        .eq("UserID", UserID);

    if (updateError) throw updateError;

    const amtTenMiles =
        Math.floor(curMiles / 10) -
        Math.floor(prevMiles / 10);

    for (let i = 0; i < amtTenMiles; i++) {
        const year = new Date().getFullYear();

        // Get latest assignment ID
        const { data: latest } = await supabase
            .from("tblAssignments")
            .select("AssignmentID")
            .like("AssignmentID", `${year}%`)
            .order("AssignmentID", { ascending: false })
            .limit(1)
            .maybeSingle();

        let taskSeq = 1;

        if (latest?.AssignmentID) {
            taskSeq =
                parseInt(latest.AssignmentID.split("_")[1]) + 1;
        }

        const assignmentID =
            `${year}_${String(taskSeq).padStart(3, "0")}`;

        await supabase
            .from("tblAssignments")
            .insert({
                AssignmentID: assignmentID,
                LoggedBy: UserID,
                DateLogged: new Date().toISOString(),
                AssignmentType: "QA Review Completed (10 miles)",
                AssignedBy: UserID,
                AssignedTo: Username, // for now, will replace with username when gotten
                DateAssigned: new Date().toISOString(),
                DueDate: new Date().toISOString(),
                Status: "Completed",
                CompletionDate: new Date().toISOString(),
                ProjectDescription: "Completed review of 10 miles of highway network"
            });
    }
}

export async function updateTenthMileReview(updates, matching) {
    const { data, error } = await supabase
        .from("tblQATenthMile")
        .update(updates)
        .match(matching)
        .select("ID")
        .single();

    if (error) throw error;

    return data.ID;
}

export async function queryReasonCodePM(ReasonName) {
    const { data, error } = await supabase
        .from("tblReasonLookup")
        .select("ReasonCode")
        .eq("ReasonName", ReasonName)
        .eq("AssignedUnit", "PM")
        .single();

    if (error) throw error;

    return data.ReasonCode;
}

export async function insertElevatedSection(params) {
    const { data, error } = await supabase
        .from("tblQASections")
        .insert(params)
        .select();

    if (error) throw error;

    return data;
}