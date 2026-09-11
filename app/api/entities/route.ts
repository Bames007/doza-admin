import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { unauthorized } from "@/app/lib/apiHelpers";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return unauthorized();

  const [centersSnap, medicsSnap, usersSnap] = await Promise.all([
    get(ref(db, "doza_centers")),
    get(ref(db, "doza_medics")),
    get(ref(db, "doza/users")),
  ]);

  const entities: {
    id: string;
    name: string;
    type: "center" | "medic" | "user";
  }[] = [];

  // ─── Centers ───────────────────────────────────────────────
  if (centersSnap.exists()) {
    centersSnap.forEach((child) => {
      const val = child.val();
      entities.push({
        id: child.key,
        name: val.name || val.centerName || "Unnamed Center",
        type: "center",
      });
    });
  }

  // ─── Medics ────────────────────────────────────────────────
  if (medicsSnap.exists()) {
    medicsSnap.forEach((child) => {
      const val = child.val();
      let name = "Unnamed Medic";

      // Try to get firstName + lastName from personalInfo
      const firstName = val?.personalInfo?.firstName || "";
      const lastName = val?.personalInfo?.lastName || "";
      if (firstName || lastName) {
        name = `${firstName} ${lastName}`.trim();
      } else {
        // fallback: use other fields
        name =
          val?.fullName ||
          val?.name ||
          val?.personalInfo?.email ||
          val?.email ||
          "Unnamed Medic";
      }

      entities.push({
        id: child.key,
        name: name,
        type: "medic",
      });
    });
  }

  // ─── Users ─────────────────────────────────────────────────
  if (usersSnap.exists()) {
    usersSnap.forEach((child) => {
      const val = child.val();
      // Users have personalProfile.fname + lname
      let name = "";
      if (val?.personalProfile?.fname || val?.personalProfile?.lname) {
        name =
          `${val.personalProfile.fname || ""} ${val.personalProfile.lname || ""}`.trim();
      } else {
        name =
          val?.fullName ||
          val?.name ||
          val?.displayName ||
          val?.email ||
          "Unnamed User";
      }
      entities.push({
        id: child.key,
        name: name,
        type: "user",
      });
    });
  }

  return NextResponse.json({ success: true, data: entities });
}
