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
    <div style={{ marginTop: "100px", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center", padding: "10px" }}>Shop System</h2>

      <div
        className="nav-container"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "240px",
          margin: "0 auto",
        }}
      >
        {/* 1. ฟอร์มจ่ายครบ */}
        <Link href={`/admin/full-paid-form${getQueryString()}`} className="nav-button">
          <CheckCircle2 size={20} />
          <span>ฟอร์มจ่ายครบ</span>
        </Link>

        {/* 2. ฟอร์มรับมัดจำ */}
        <Link href={`/admin/deposit${getQueryString()}`} className="nav-button">
          <PiggyBank size={20} />
          <span>ฟอร์มรับมัดจำ</span>
        </Link>

        {/* 3. ฟอร์มผ่อน / ออม */}
        <Link href={`/admin/installment${getQueryString()}`} className="nav-button">
          <CreditCard size={20} />
          <span>ฟอร์มผ่อน / ออม</span>
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
