import { supabase } from "@/lib/supabase";

const BUCKET = "school-assets";

export async function uploadFile(
  file: File,
  folder: string
): Promise<{ path: string; publicUrl: string } | null> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return { path: fileName, publicUrl: urlData.publicUrl };
}

export async function deleteFile(storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

export async function verifyClassroomPin(pin: string): Promise<boolean> {
  const { data } = await supabase.rpc("verify_classroom_pin", { pin });
  return data === true;
}
