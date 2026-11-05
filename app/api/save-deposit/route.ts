// src/app/api/save-deposit/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

// สร้าง Supabase Client สำหรับฝั่ง Server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function formatPrivateKey(key?: string): string {
  if (!key) return "";
  let formatted = key.trim();
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1);
  }
  return formatted.replace(/\\n/g, "\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      product,
      customerName,
      phoneNumber, // phoneNumber
      sellingPrice,
      depositAmount,
      remainingDueDate, // dueDate
      channel,
      deliveryMethod,
      pickupDate,
      shippingAddress,
      transferDate,
      slipFileName,
      slipBase64,
      note,
      adminName,
    } = body;

    let slipPublicUrl = "-";

    // --- 1. อัปโหลดรูปสลิปขึ้น Supabase Storage (ถ้ามีแนบไฟล์มา) ---
    if (slipBase64) {
      const matches = slipBase64.match(/^data:(.+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : "image/jpeg";
      const base64Data = matches ? matches[2] : slipBase64;
      const buffer = Buffer.from(base64Data, "base64");

      const fileExt = slipFileName ? slipFileName.split(".").pop() : "jpg";
      const fileName = `deposit_slip_${product}_${Date.now()}.${fileExt}`;
      const filePath = `slips/${fileName}`;

      // อัปโหลดไฟล์เข้า Bucket "payment-slips"
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-slips")
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw new Error("Supabase Upload Error: " + uploadError.message);
      }

      // ดึง Public URL ของรูปภาพ
      const { data: publicUrlData } = supabase.storage
        .from("payment-slips")
        .getPublicUrl(filePath);

      slipPublicUrl = publicUrlData.publicUrl || "-";
    }

    // --- 2. บันทึกข้อมูลทั้งหมดลง Google Sheets ---
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json(
        { error: "Google Credentials configured improperly" },
        { status: 500 }
      );
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const createdAt = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    // เรียงคอลัมน์ทั้ง 15 คอลัมน์ (A:O) ตามโครงสร้าง:
    // createdAt | product | customerName | companyPhone (phoneNumber) | sellingPrice | depositAmount | remainingDueDate (dueDate) | channel | deliveryMethod | pickupDate | shippingAddress | slipPublicUrl (slipFileName) | transferDate | note | adminName
    const newRow = [
      createdAt,
      product,
      customerName,
      phoneNumber,
      sellingPrice,
      depositAmount,
      remainingDueDate,
      channel,
      deliveryMethod,
      pickupDate,
      shippingAddress,
      slipPublicUrl,
      transferDate,
      note,
      adminName,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "deposit_input!A:O", // ขยาย range เป็น A:O สำหรับ 15 คอลัมน์
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    return NextResponse.json({ success: true, slipUrl: slipPublicUrl });
  } catch (error: any) {
    console.error("Error saving deposit data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
