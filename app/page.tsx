'use client';

import { useEffect, useState, Suspense } from 'react';
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

  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [unauthorized, setUnauthorized] = useState(false); // สถานะเมื่อไม่มีสิทธิ์เข้าถึง

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setInviteCode(codeFromUrl.toUpperCase());
    }

    const initLiff = async () => {
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
        setProfile({
          userId: userProfile.userId,
          displayName: userProfile.displayName,
          pictureUrl: userProfile.pictureUrl,
        });

        // เช็คสิทธิ์กับ Google Sheets ทันทีที่เข้าหน้าเว็บ
        await verifyUserStatus(userProfile.userId, userProfile.displayName, codeFromUrl || '');

      } catch (err) {
        console.error('LIFF Init Error:', err);
        setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE LIFF');
        setLoading(false);
      }
    };

    initLiff();
  }, [searchParams]);

  // ฟังก์ชันเช็คสิทธิ์อัตโนมัติ
  const verifyUserStatus = async (lineUserId: string, displayName: string, code: string) => {
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: code.trim(),
          line_user_id: lineUserId,
          admin_name: displayName,
        }),
      });

      const result = await res.json();

      if (result.success) {
        // เป็น Admin แล้ว (อาจเคยผูกไว้ หรือกดผ่าน Code ครั้งแรกสำเร็จ)
        sessionStorage.setItem('admin_verified', 'true');
        sessionStorage.setItem('line_user_id', lineUserId);
        router.push('/admin/form');
      } else {
        // ไม่ได้เป็น Admin และ Code ใช้ไม่ได้/ถูกลบไปแล้ว
        if (!code) {
          setUnauthorized(true);
        } else {
          setErrorMessage(result.message || 'Invite Code นี้ถูกใช้งานแล้ว หรือไม่มีอยู่ในระบบ');
        }
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setLoading(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !profile) return;

    setSubmitting(true);
    setErrorMessage('');

    await verifyUserStatus(profile.userId, profile.displayName, inviteCode);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">กำลังตรวจสอบสิทธิ์ Admin...</p>
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
            บัญชี LINE ของคุณยังไม่ได้รับสิทธิ์ Admin หรือ Invite Code ที่ใช้ถูกใช้งานและยกเลิกไปแล้ว
          </p>
          <button
            onClick={() => liff.closeWindow()}
            className="w-full rounded-lg bg-gray-800 py-2.5 font-semibold text-white hover:bg-gray-900 transition"
          >
            ปิดหน้านี้
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
        {profile && (
          <div className="mb-6 text-center">
            {profile.pictureUrl && (
              <img
                src={profile.pictureUrl}
                alt="Profile"
                className="mx-auto h-20 w-20 rounded-full border-2 border-green-500 shadow-sm object-cover"
              />
            )}
            <h2 className="mt-3 text-lg font-semibold text-gray-800">
              สวัสดีคุณ {profile.displayName}
            </h2>
            <p className="text-xs text-gray-400 font-mono">LINE ID: {profile.userId}</p>
          </div>
        )}

        <h1 className="mb-2 text-center text-xl font-bold text-gray-900">
          Redeem Admin Invite Code
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          กรอกรหัสเชิญเพื่อยืนยันสิทธิ์ผู้ดูแลระบบ
        </p>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600 border border-red-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="กรอกรหัส 8 หลัก"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg font-mono tracking-widest text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 uppercase"
              maxLength={12}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !inviteCode.trim()}
            className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white shadow-md transition hover:bg-green-700 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'กำลังตรวจสอบ...' : 'ยืนยันรับสิทธิ์ Admin'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function RedeemPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RedeemContent />
    </Suspense>
  );
}
