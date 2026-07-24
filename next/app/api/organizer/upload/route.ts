import { NextResponse } from "next/server";
import { hasOrganizerAccess } from "@/lib/organizer-access";
import { supabaseAdmin } from "@/lib/supabase-admin";

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  if (!(await hasOrganizerAccess())) {
    return NextResponse.json({ error: { message: "Organizer access required." } }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: { message: "Image file is required." } }, { status: 400 });
    }

    const fileName = safeFileName(file.name || "submission.jpg") || "submission.jpg";
    const objectPath = `image-submissions/${Date.now()}-${crypto.randomUUID()}-${fileName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const upload = await supabaseAdmin.storage.from("bucket").upload(objectPath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (upload.error) {
      return NextResponse.json({ error: { message: upload.error.message } }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from("bucket").getPublicUrl(objectPath);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: { message: "Image upload failed." } }, { status: 500 });
  }
}
