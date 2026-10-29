'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import liff from '@line/liff';

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

function RedeemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const liffInitialized = useRef(false);

  // ฟังก์ชันดึง Invite Code จาก URL หรือ liff.state
  const extractInviteCode = (): string => {
    let code = searchParams.get('code');
    if (!code) {
      const liffState = searchParams.get('liff.state');
      if (liffState) {
        const decodedState = decodeURIComponent(liffState);
        const match = decodedState.match(/code=([^&]+)/);
        if (match && match[1]) {
          code = match[1];
        }
      }
    }
    return code ? code.trim().toUpperCase() : '';
  };

  useEffect(() => {
    if (liffInitialized.current) return;
    liffInitialized.current = true;

    const code = extractInviteCode();

    const initLiffAndVerify = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          setErrorMessage('ไม่พบค่า NEXT_PUBLIC_LIFF_ID');
          setLoading(false);
          return;
        }

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const userProfile = await liff.getProfile();

        // ส่งข้อมูลไปตรวจเช็คและ Auto-Redeem ทันทีหลัง LIFF Login สำเร็จ
        const res = await fetch('/api/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invite_code: code,
            line_user_id: userProfile.userId,
            admin_name: userProfile.displayName,
          }),
        });

        const result = await res.json();

        if (result.success && result.is_admin) {
          // ผ่านสิทธิ์แล้ว -> บันทึก Session แล้ว Redirect ไปหน้า Form ทันทีโดยไม่ต้องกรอกอะไร
          sessionStorage.setItem('admin_verified', 'true');
          sessionStorage.setItem('line_user_id', userProfile.userId);
          router.replace('/admin/form');
        } else {
          // ไม่มีสิทธิ์ / Code ไม่ถูกต้อง / ถูกใช้ไปแล้ว
          setUnauthorized(true);
          setLoading(false);
        }

      } catch (err) {
        console.error('LIFF/Verify Error:', err);
        setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ');
        setLoading(false);
      }
    };

    initLiffAndVerify();
  }, [searchParams, router]);

  // หน้าจอ Loading ระหว่างเช็คสิทธิ์และทำ Auto-Redeem
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <h2 className="mt-4 text-lg font-semibold text-gray-800">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</h2>
          <p className="mt-1 text-sm text-gray-500">กรุณารอMสักครู่ ระบบกำลังยืนยันตัวตนผ่าน LINE</p>
          {errorMessage && <p className="mt-2 text-sm text-red-500">{errorMessage}</p>}
        </div>
      </div>
    );
  }

  // หน้าจอแสดงผลกรณี "ไม่มีสิทธิ์เข้าถึง"
  if (unauthorized) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center border border-gray-100">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึงระบบ</h1>
          <p className="text-sm text-gray-600 mb-6">
            ลิงก์เชิญนี้ถูกใช้งานไปแล้ว หมดอายุ หรือบัญชี LINE ของคุณไม่ได้รับสิทธิ์ Admin
          </p>
          <button
            onClick={() => liff.closeWindow()}
            className="w-full rounded-lg bg-gray-800 py-2.5 font-semibold text-white hover:bg-gray-900 transition cursor-pointer"
          >
            ปิดหน้านี้
          </button>
        </div>
      </main>
    );
  }

  return null;
}

export default function RedeemPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RedeemContent />
    </Suspense>
  );
}
