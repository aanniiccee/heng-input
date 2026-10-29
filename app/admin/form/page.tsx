'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminFormPage() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const isVerified = sessionStorage.getItem('admin_verified');
    if (!isVerified) {
      router.replace('/');
    } else {
      setVerified(true);
    }
  }, [router]);

  if (!verified) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="mx-auto max-w-xl w-full rounded-xl bg-white p-8 shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Admin Control Panel / Form
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          ยืนยันสิทธิ์ผ่าน Google Sheets สำเร็จ เข้าสู่ระบบจัดการหลังบ้านได้เรียบร้อย
        </p>
        
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('บันทึกข้อมูลสำเร็จ!'); }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อประกาศ / ข้อมูลระบบ</label>
            <input type="text" placeholder="ระบุข้อความ..." className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 transition">
            บันทึกข้อมูล
          </button>
        </form>
      </div>
    </main>
  );
}
