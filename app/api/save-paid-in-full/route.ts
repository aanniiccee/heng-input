import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      product,
      customerName,
      companyPhone,
      sellingPrice,
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

    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // ID โฟลเดอร์ใน Drive ที่สร้างเตรียมไว้

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json(
        { error: "Google Credentials configured improperly" },
        { status: 500 }
      );
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    let slipDriveUrl = "-";

    // 1. อัปโหลดรูปสลิปขึ้น Google Drive (ถ้ามีการแนบสลิปมา)
    if (slipBase64) {
      const drive = google.drive({ version: "v3", auth });

      const matches = slipBase64.match(/^data:(.+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : "image/jpeg";
      const base64Data = matches ? matches[2] : slipBase64;
      const buffer = Buffer.from(base64Data, "base64");

      const fileMetadata: any = {
        name: `Slip_${product}_${Date.now()}_${slipFileName || "image.jpg"}`,
      };

      if (driveFolderId) {
        fileMetadata.parents = [driveFolderId];
      }

      const media = {
        mimeType: mimeType,
        body: Readable.from(buffer),
      };

      const driveFile = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id, webViewLink",
      });

      // ปรับสิทธิ์ให้ทุกคนที่มีลิงก์สามารถเปิดดูสลิปภาพนี้ได้
      if (driveFile.data.id) {
        await drive.permissions.create({
          fileId: driveFile.data.id,
          requestBody: {
            role: "reader",
            type: "anyone",
          },
        });
      }

      slipDriveUrl = driveFile.data.webViewLink || "-";
    }

    // 2. บันทึกข้อมูลทั้งหมดลง Google Sheets แท็บ full_paid_input
    const sheets = google.sheets({ version: "v4", auth });

    const createdAt = new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
    });

    const newRow = [
      createdAt,
      product,
      customerName,
      companyPhone,
      sellingPrice,
      channel,
      deliveryMethod,
      pickupDate,
      shippingAddress,
      slipDriveUrl, // ใส่ URL ลิงก์สลิปจาก Google Drive ตรงนี้
      transferDate,
      note,
      adminName,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "full_paid_input!A:M", // บันทึกเข้าแท็บ full_paid_input
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow],
      },
    });

    return NextResponse.json({ success: true, slipUrl: slipDriveUrl });
  } catch (error: any) {
    console.error("Error saving data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
