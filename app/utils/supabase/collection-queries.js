import { supabase } from "./client";

// Status Input Queries

export async function getStatusInputTables() {
    const [users, collectionLog] = await Promise.all([
        supabase.from("tblUsers").select("UserName").order("UserName", { ascending: true }),
        supabase.from("tblCollectionLog").select("*")
    ]);

    return {
        users: users.data,
        collectionLog: collectionLog.data
    };
}

export async function insertNewStatus(payload) {
    const rows = {
        "SDIFileName": payload.SDIFileName,
        "SetNum": payload.setsReceived,
        "DateReceived": payload.dateReceived,
        "DateCollected": payload.dateCollected,
        "MilesCollected": payload.totalMiles,
        "AssignedTo": payload.assignedTo,
        "FLImageCheck": payload.imageCheck,
        "RawFilesProcessedStart": payload.rawStart,
        "RawFilesProcessedEnd": payload.rawEnd,
        "BEOffsetFixed": payload.offsetFixed,
        "AutocrackStart": payload.autocrackStart,
        "AutocrackEnd": payload.autocrackEnd,
        "AutoclassStart": payload.autoclassStart,
        "AutoclassEnd": payload.autoclassEnd,
        "TenthMileReport": payload.tenthMileReport,
        "PathviewVersion": payload.pathviewVersion,
        "DataBackedup": payload.dateBackedUp,
        "DrivesFormatted": payload.drivesFormatted,
        "MissingSets": payload.missingSets,
        "Comments": payload.comments,
        "CollectionYear": payload.collectionYear,
        "CollectionIssues": payload.collectionIssues,
        "RetestRequired": payload.retestRequired === true ? 1 : 0,
        "RetestSets": payload.retestSets,
        "TruckNum": payload.truckNum,
        "Weather": payload.weather,
        "AirTemperature": payload.airTemp,
        "PavementTemperature": payload.pavementTemp
    }

    const { data, error } = await supabase
      .from("tblCollectionLog")
      .insert([rows])
      .select();
    
    if (error) {
        console.error("Insert error: ", error);
        throw error;
    } else {
        return { success: true, message: "Record inserted successfully" };
    }
}

export async function updateExistingStatus(payload) {
    const rows = {
        "SDIFileName": payload.SDIFileName,
        "SetNum": payload.setsReceived,
        "DateReceived": payload.dateReceived,
        "DateCollected": payload.dateCollected,
        "MilesCollected": payload.totalMiles,
        "AssignedTo": payload.assignedTo,
        "FLImageCheck": payload.imageCheck,
        "RawFilesProcessedStart": payload.rawStart,
        "RawFilesProcessedEnd": payload.rawEnd,
        "BEOffsetFixed": payload.offsetFixed,
        "AutocrackStart": payload.autocrackStart,
        "AutocrackEnd": payload.autocrackEnd,
        "AutoclassStart": payload.autoclassStart,
        "AutoclassEnd": payload.autoclassEnd,
        "TenthMileReport": payload.tenthMileReport,
        "PathviewVersion": payload.pathviewVersion,
        "DataBackedup": payload.dateBackedUp,
        "DrivesFormatted": payload.drivesFormatted,
        "MissingSets": payload.missingSets,
        "Comments": payload.comments,
        "CollectionYear": payload.collectionYear,
        "CollectionIssues": payload.collectionIssues,
        "RetestRequired": payload.retestRequired === true ? 1 : 0,
        "RetestSets": payload.retestSets,
        "TruckNum": payload.truckNum,
        "Weather": payload.weather,
        "AirTemperature": payload.airTemp,
        "PavementTemperature": payload.pavementTemp
    }

    const { data, error } = await supabase
      .from("tblCollectionLog")
      .update([rows])
      .eq("SetNum", payload.setsReceived)
      .eq("DateReceived", payload.dateReceived)
      .select();
    
    if (error) {
        console.error("Insert error: ", error);
        throw error;
    } else {
        return { success: true, message: "Record inserted successfully" };
    }
}

// Collection Status Queries

export async function getCollectionStatus() {
    const [collectionStatus, collectionLog] = await Promise.all([
        supabase.from("tblRoadSections").select("*"),
        supabase.from("tblCollectionLog").select("*").eq("CollectionYear", 2025)
    ]);

    return {
        collectionStatus: collectionStatus.data,
        collectionLog: collectionLog.data,
    }
}

export async function getReruns() {
    const [reruns] = await Promise.all([
        supabase.from("tblReruns").select("*"),
    ]);

    return {
        reruns: reruns.data
    }
}

export async function updateReruns(rows) {
  const inserts = rows.filter(row => !row.ID);
  const updates = rows.filter(row => row.ID);

  const cleanInserts = inserts.map(({ ID, ...rest }) => rest);

  const insertPromise = cleanInserts.length
    ? supabase.from("tblReruns").insert(cleanInserts)
    : Promise.resolve();

  const updatePromise = updates.length
    ? Promise.all(
        updates.map(row =>
          supabase
            .from("tblReruns")
            .update(row)
            .eq("ID", row.ID)
        )
      )
    : Promise.resolve();

  const [insertResult, updateResult] = await Promise.all([
    insertPromise,
    updatePromise,
  ]);

  return { success: true, message: "Changes saved successfully" };
}

export async function updateDeleted(deletedIds) {
    const { data, error } = await supabase
        .from("tblReruns")
        .delete()
        .in("ID", deletedIds);
    
    if (error) {
        console.error("Insert error: ", error);
        throw error;
    } else {
        return { success: true };
    }
}