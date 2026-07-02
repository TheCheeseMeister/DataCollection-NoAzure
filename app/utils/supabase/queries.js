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