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

export async function getEquipmentTables() {
  const [verification, equipmentType, equipmentName, certType, users, certNames, QACerts,
        status, priority, issueCategories, issueEquipmentName, collectionTask, issueList] = await Promise.all([
          supabase.from("tblCertificateVerificationResult").select('"Verification Result"'),
          supabase.from("UniqueEquipmentTypes").select("*"),
          supabase.from("tblEquipmentInventory").select('"Equipment Name"').neq('"Equipment Name"', "Others").order('"Equipment Name"', { ascending: true }),
          supabase.from("UniqueCertNames").select("*"),
          supabase.from("tblUsers").select("UserName").order("UserName", { ascending: true }),
          supabase.from("tblCertificationsNames").select("*"),
          supabase.from("tblCertifications").select("*"),
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
    QACerts: QACerts.data,
    status: status.data,
    priority: priority.data,
    issueCategories: issueCategories.data,
    issueEquipmentName: issueEquipmentName.data,
    collectionTask: collectionTask.data,
    issueList: issueList.data
  };
}