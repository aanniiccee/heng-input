import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invite_code, line_user_id, admin_name } = body;

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error: GOOGLE_SCRIPT_URL is missing' },
        { status: 500 }
      );
    }

    // ใช้ redirect: 'follow' เพื่อให้ fetch ตามลิงก์ Redirect ของ Google Apps Script ไปจนถึงหน้าปลายทาง
    const response = await fetch(scriptUrl, {
      method: 'POST',
      redirect: 'follow', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invite_code,
        line_user_id,
        admin_name,
      }),
    });

    const responseText = await response.text();
    
    // เช็คใน Terminal (Vercel logs หรือ console ของคอม) ว่า Google Apps Script ส่งอะไรกลับมา
    console.log("GAS Raw Response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // ถ้า Apps Script เผลอพ่นหน้า HTML กลับมา ให้ส่ง Error กลับไปบอก
      return NextResponse.json(
        { success: false, message: 'Invalid JSON response from Google Script', raw: responseText },
        { status: 500 }
      );
    }

    // ส่งค่ากลับไปให้หน้าบ้าน โดยการันตี property ให้ครบถ้วน
    return NextResponse.json({
      success: data.success,
      is_admin: data.success ? true : (data.is_admin || false),
      message: data.message
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { success: false, message: error.toString() },
      { status: 500 }
    );
  }
}
