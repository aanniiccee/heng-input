// src/app/admin/full-paid-form/page.tsx
"use client";

export const dynamic = "force-dynamic";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Save, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

function PaidInFullFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [product, setProduct] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [channel, setChannel] = useState("หน้าร้าน");
  const [deliveryMethod, setDeliveryMethod] = useState("หน้าร้าน");
  const [pickupDate, setPickupDate] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [transferSlip, setTransferSlip] = useState<File | null>(null);
  const [transferDate, setTransferDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const adminName = sessionStorage.getItem("admin_name");
    const adminLineId = sessionStorage.getItem("admin_line_id");

    if (adminName && adminLineId) {
      return;
    }

    const urlToken = searchParams.get("token");
    if (urlToken) {
      return;
    }

    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("goto", window.location.pathname);
    window.location.href =
      "https://heng-input.vercel.app/?" + currentParams.toString();
  }, [searchParams]);

  // ฟังก์ชันพาเปลี่ยนหน้ากลับเมนูหลักแบบด่วนทันที
  const handleBackToHome = () => {
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    
    const adminLineId = sessionStorage.getItem("admin_line_id");
    if (adminLineId) params.set("admin_line_id", adminLineId);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    window.location.href = `/${queryString}`;
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const adminLineId = sessionStorage.getItem("admin_line_id") || "Unknown";
    const adminName = sessionStorage.getItem("admin_name") || "Unknown";

    try {
      let slipBase64 = "";
      let slipFileName = "";
      if (transferSlip) {
        slipFileName = transferSlip.name;
        slipBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(transferSlip);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
      }

      const payload = {
        product,
        customerName,
        companyPhone,
        sellingPrice,
        channel,
        deliveryMethod,
        pickupDate: deliveryMethod === "หน้าร้าน" ? pickupDate : "",
        shippingAddress: deliveryMethod === "จัดส่ง" ? shippingAddress : "",
        transferDate,
        slipFileName,
        slipBase64,
        note,
        adminName,
        adminLineId,
      };

      const response = await fetch("/api/save-paid-in-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("บันทึกข้อมูลและอัปโหลดสลิปเรียบร้อยแล้ว!");
        // Reset Form
        setProduct("");
        setCustomerName("");
        setCompanyPhone("");
        setSellingPrice("");
        setPickupDate("");
        setShippingAddress("");
        setTransferSlip(null);
        setTransferDate("");
        setNote("");
      } else {
        const err = await response.json();
        alert("เกิดข้อผิดพลาด: " + (err.error || "ไม่สามารถบันทึกข้อมูลได้"));
      }
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเน็ตเวิร์ก");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* หัวข้อหลัก + ปุ่มย้อนกลับ อยู่ในกรอบความกว้างของฟอร์มพอดี */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ฟอร์มจ่ายครบ</h2>
            <p className="text-xs text-slate-500 mt-1">
              บันทึกข้อมูลการชำระเงินครบถ้วนและรายละเอียดการส่งมอบ
            </p>
          </div>

          <button
            type="button"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition cursor-pointer shrink-0"
          >
            <ArrowLeft size={15} />
            <span>กลับเมนูหลัก</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span className="font-semibold text-sm">แบบฟอร์มข้อมูลการจ่ายครบ</span>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Product Code & Customer Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    รหัสสินค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    required
                    placeholder="ระบุรหัสสินค้า"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ชื่อลูกค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    required
                    placeholder="ระบุชื่อลูกค้า"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              {/* Company Phone & Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    เบอร์โทรศัพท์สาขา (บริษัท) ของบิลขาย
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="เลขบัญชีโอนเข้า / เบอร์สาขา"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ราคาขาย (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    required
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Channel & Delivery Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ช่องทางขาย
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="หน้าร้าน">หน้าร้าน</option>
                    <option value="FB Live">FB Live</option>
                    <option value="LINE">LINE</option>
                    <option value="MSG">MSG</option>
                    <option value="Website">Website</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ส่งมอบ
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                  >
                    <option value="หน้าร้าน">หน้าร้าน</option>
                    <option value="จัดส่ง">จัดส่ง</option>
                  </select>
                </div>
              </div>

              {/* Conditional Delivery Section */}
              {deliveryMethod === "หน้าร้าน" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    วันที่นัดรับที่ร้าน (ถ้ามี)
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ที่อยู่จัดส่ง
                  </label>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    rows={2}
                    placeholder="กรอกรายละเอียดที่อยู่จัดส่ง..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                  ></textarea>
                </div>
              )}

              {/* Transfer Slip & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    สลิปโอนเงิน (ถ่ายรูป/แนบไฟล์)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition border border-slate-200 rounded-xl p-1 bg-slate-50"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setTransferSlip(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    วันที่โอน
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  หมายเหตุ
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  rows={2}
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer ${
                    isSubmitting
                      ? "bg-slate-300 text-slate-500 shadow-none cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> กำลังบันทึกข้อมูล...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> บันทึกข้อมูลจ่ายครบ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaidInFullFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
          กำลังโหลดฟอร์ม...
        </div>
      }
    >
      <PaidInFullFormContent />
    </Suspense>
  );
}
