"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DebugPage() {
  const storeUser = useMutation(api.users.store);

  return (
    <div style={{ padding: 40 }}>
      <h1>DEBUG</h1>

      <button
        onClick={async () => {
          try {
            const res = await storeUser();
            console.log("SUCCESS:", res);
            alert("SUCCESS — check Convex logs");
          } catch (e) {
            console.error("ERROR:", e);
            alert("ERROR — check console + Convex logs");
          }
        }}
        style={{
          padding: 20,
          fontSize: 18,
          background: "black",
          color: "white",
        }}
      >
        CALL users:store MANUALLY
      </button>
    </div>
  );
}
