'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // <-- เพิ่ม useSearchParams
import liff from '@line/liff';
import { Suspense } from 'react';

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

// แยก Component หลักออกมารองรับ Suspense (กฎของ Next.js App Router เมื่อใช้ useSearchParams)
function RedeemContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // <-- เรียกใช้งาน SearchParams
  
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // ดึงค่า code จาก URL ทันทีที่โหลดหน้าเว็บ (เช่น ?code=ABC123XY)
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
      } catch (err) {
        console.error('LIFF Init Error:', err);
        setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE LIFF');
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, [searchParams]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !profile) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_code: inviteCode.trim(),
          line_user_id: profile.userId,
          admin_name: profile.displayName,
        }),
      });

      const result = await res.json();

      if (result.success) {
        sessionStorage.setItem('admin_verified', 'true');
        sessionStorage.setItem('line_user_id', profile.userId);
        router.push('/admin/form');
      } else {
        setErrorMessage(result.message || 'รหัส Invite Code ไม่ถูกต้อง');
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">กำลังโหลดระบบ LINE LIFF...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
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

// ห่อด้วย Suspense ตามข้อกำหนดของ Next.js App Router
export default function RedeemPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RedeemContent />
    </Suspense>
  );
}
