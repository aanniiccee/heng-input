// src/app/page.tsx
"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle2, PiggyBank, CreditCard } from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [adminLineId, setAdminLineId] = useState("");

  useEffect(() => {
    setToken(searchParams.get("token") || "");
    setAdminLineId(sessionStorage.getItem("admin_line_id") || "");
  }, [searchParams]);

  // Helper ฟังก์ชันต่อสายพารามิเตอร์แบบฉลาด
  const getQueryString = () => {
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (adminLineId) params.set("admin_line_id", adminLineId);
    const str = params.toString();
    return str ? `?${str}` : "";
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-[140px] px-4 font-sans">
      <div className="w-full max-w-xs mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 text-center mb-6">Shop System</h2>

        <div className="flex flex-col gap-3">
          {/* 1. ฟอร์มจ่ายครบ */}
          <Link
            href={`/admin/full-paid${getQueryString()}`}
            className="flex items-center gap-3 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-[0.98]"
          >
            <CheckCircle2 size={20} className="shrink-0" />
            <span className="text-sm">ฟอร์มจ่ายครบ</span>
          </Link>

          {/* 2. ฟอร์มรับมัดจำ */}
          <Link
            href={`/admin/deposit${getQueryString()}`}
            className="flex items-center gap-3 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 active:scale-[0.98]"
          >
            <PiggyBank size={20} className="shrink-0" />
            <span className="text-sm">ฟอร์มรับมัดจำ</span>
          </Link>

          {/* 3. ฟอร์มผ่อน / ออม */}
          <Link
            href={`/admin/installment${getQueryString()}`}
            className="flex items-center gap-3 w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 transition-all duration-200 active:scale-[0.98]"
          >
            <CreditCard size={20} className="shrink-0" />
            <span className="text-sm">ฟอร์มผ่อน / ออม</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 text-sm">
          กำลังโหลด...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
