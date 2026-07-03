import { supabase } from "./client";

export async function getLookups() {
  const [results] = await Promise.all([
    supabase
      .from("tblCertificateVerificationResult")
      .select("*")
  ]);

  return {
    results: results.data
  };
}

// Equipment QA Queries
export async function getEquipmentTables() {
  const [verification, equipmentType, equipmentName, certType, users, certNames, QACerts,
        status, priority, issueCategories, issueEquipmentName, collectionTask, issueList] = await Promise.all([
          supabase.from("tblCertificateVerificationResult").select('"Verification Result"'),
          supabase.from("UniqueEquipmentTypes").select("*"),
          supabase.from("tblEquipmentInventory").select('"Equipment Name"').neq('"Equipment Name"', "Others").order('"Equipment Name"', { ascending: true }),
          supabase.from("UniqueCertNames").select("*"),
          supabase.from("tblUsers").select("UserName").order("UserName", { ascending: true }),
          supabase.from("tblCertificationsNames").select("*"),
          fetchAllCertifications(), //supabase.from("tblCertifications").select("*").range(0, 1999),
          supabase.from("tblDataCollectionIssuesStatus").select("Status"),
          supabase.from("tblDataCollectionIssuesPriorityLevel").select("Priority"),
          supabase.from("tblDataCollectionIssuesCategories").select("*"),
          supabase.from("tblEquipmentInventory").select('"Equipment Name"').eq("Discontinued", 0),
          supabase.from("tblDataCollectionTask").select('"Collection Task Type"').eq("Discontinued", 0),
          supabase.from("tblDataCollectionIssuesList").select("*")
        ]);

  return {
    verification: verification.data,
    equipmentType: equipmentType.data,
    equipmentName: equipmentName.data,
    certType: certType.data,
    users: users.data,
    certNames: certNames.data,
    QACerts: QACerts,
    status: status.data,
    priority: priority.data,
    issueCategories: issueCategories.data,
    issueEquipmentName: issueEquipmentName.data,
    collectionTask: collectionTask.data,
    issueList: issueList.data
  };
}

export async function insertNewEquipment(payload) {
  for (const cert of payload["certifications"]) {
    const QAID = await generateQAID();

    const rows = {
      "QAID": QAID,
      "Created By": "Eli",
      "Created On": new Date(),
      "Certification Type": payload["certificationType"],
      "Equipment Name": payload["equipmentName"],
      "Equipment Type": payload["equipmentType"],
      "Verification Result": payload["verificationResult"],
      "Date Certification": payload["dateCert"],
      "Comments": payload["comments"],
      "Certification Name": cert,
      "Archive": 0
    }

    const { data, error } = await supabase
      .from("tblCertifications")
      .insert([rows])
      .select();
    
    if (error) {
      console.error("Insert error: ", error);
      throw error;
    }
  }

  return { success: true, message: "Records inserted successfully" };
}

export async function updateExistingEquipment(payload) {
  const { data, error } = await supabase
    .from("tblCertifications")
    .update({
      "Verification Result": payload.verificationResult,
      "Comments": payload.comments,
      "Date Certification": payload.dateCert
    })
    .eq("QAID", payload.Existing_QAID)
    .select();
  
  if (error) {
    console.error("Update error: ", error);
    throw error;
  } else {
    return { success: true, message: "Record updated sucessfully" };
  }
}

/**
 * Paginates the querying of Certifications to bypass 1000 row limit in supabase.
 * 
 * @returns Full list of Certifications
 */
async function fetchAllCertifications() {
  let all = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("tblCertifications")
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all = [...all, ...data];

    if (data.length < pageSize) break;

    from += pageSize;
  }

  return all;
}

/**
 * Generates the next QA ID based on the max ID for the current year in tblCertifications.
 * 
 * @returns Next QA ID
 */
async function generateQAID() {
  const year = new Date().getFullYear();

  const { data, error } = await supabase
    .from("tblCertifications")
    .select("*")
    .gte('"Created On"', `${year}-01-01`)
    .lt('"Created On"', `${year + 1}-01-01`);

  const nextNum = (data?.length + 1)

  return `${year}_${nextNum}`;
}

// Data Issue Queries
export async function insertNewIssue(payload) {
  const IssueID = await generateIssueID();

  const rows = {
    "IssuesID": IssueID,
    "AssignedTo": payload["assigned"],
    "Comments": payload["comments"],
    "Priority": payload["priority"],
    "Category": payload["category"],
    "Data Collection Task": payload["collectionTask"],
    "Status": payload["status"],
    "ReportedDate": new Date(),
    "ClosedDate": payload["closedDate"],
    "Equipment Name": payload["equipmentName"],
    "ReportedBy": "Eli",
    "Follow Up": payload["followUp"]
  }

  const { data, error } = await supabase
    .from("tblDataCollectionIssuesList")
    .insert([rows])
    .select();
  
  if (error) {
    console.error("Insert error: ", error);
    throw error;
  } else {
    return { success: true, message: "Record inserted successfully" };
  }
}

export async function updateExistingIssue(payload) {
  const { data, error } = await supabase
    .from("tblDataCollectionIssuesList")
    .update({
      "AssignedTo": payload["assignedTo"],
      "Comments": payload["comments"],
      "Status": payload["status"],
      "ClosedDate": payload["closedDate"],
      "Follow Up": payload["followUp"]
    })
    .eq("IssuesID", payload["IssueID"])
    .select();
  
  if (error) {
    console.error("Update error: ", error);
    throw error;
  } else {
    return { success: true, message: "Record updated sucessfully" };
  }
}

/**
 * Generates the next Issue ID based on the max ID for the current year in tblDataCollectionIssuesList.
 * 
 * @returns Next Issue ID
 */
async function generateIssueID() {
  const year = new Date().getFullYear();

  const { data, error } = await supabase
    .from("tblDataCollectionIssuesList")
    .select("*")
    .gte('"ReportedDate"', `${year}-01-01`)
    .lt('"ReportedDate"', `${year + 1}-01-01`);
  
  const nextNum = (data?.length + 1)

  return `${year}_${nextNum}`;
}