import { getLookups } from "../utils/supabase/queries";

import React, {useEffect, useState} from 'react';

export default function collection() {
    const [lookups, setLookups] = useState([]);

    useEffect(() => {
    async function load() {
        const lookups = await getLookups();
        console.log(lookups);
        setLookups(lookups);
    }

    load();
    }, []);

    return(
        <div>
      <h1>Lookups</h1>

      {lookups ? (
        <pre>{JSON.stringify(lookups, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
    );
}