import { NextResponse } from "next/server";
import { google } from "googleapis";

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
      note,
      adminName,
    } = body;

    // อ่าน Credentials ของ Service Account จาก Environment Variables
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      return NextResponse.json(
        { error: "Google Service Account credentials configured improperly" },
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

    // เรียงลำดับข้อมูลตาม Column ใน Sheet
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
      slipFileName || "-",
      transferDate,
      note,
      adminName,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:M", // เปลี่ยนชื่อ Sheet ตามของคุณ เช่น 'จ่ายครบ!A:M'
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Google Sheets append error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
