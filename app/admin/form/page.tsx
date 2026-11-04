"use client";

export const dynamic = "force-dynamic";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

interface Transaction {
  transaction_id: string;
  product: string;
  customer_name: string;
  phone_number?: string;
  channel?: string;
  note?: string;
}

function PaidInFullFormContent() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const admJobFromUrl = searchParams.get("adm_job")?.trim() || "";

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [admJobId, setAdmJobId] = useState("");
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

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const adminName = sessionStorage.getItem("admin_name");
    const adminLineId = sessionStorage.getItem("admin_line_id");

    if (!adminName || !adminLineId) {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("goto", window.location.pathname);
      window.location.href =
        "https://hheng-system.vercel.app/liff-router?" +
        currentParams.toString();
      return;
    }

    loadData();
  }, [token]);

  useEffect(() => {
    if (admJobFromUrl) {
      setAdmJobId(admJobFromUrl);
    }
  }, [admJobFromUrl]);

  useEffect(() => {
    if (admJobId && allTransactions.length > 0) {
      const found = allTransactions.find((x) => x.transaction_id === admJobId);
      if (found) {
        setProduct(found.product || "");
        setCustomerName(found.customer_name || "");
      }
    }
  }, [admJobId, allTransactions]);

  const loadData = async () => {
    try {
      setLoading(true);
      const adminLineId = sessionStorage.getItem("admin_line_id") || "";
      const apiUrl = `/api/pawn-transactions?token=${token}&admin_line_id=${adminLineId}`;
      const r = await fetch(apiUrl);
      if (r.ok) {
        const data = await r.json();
        setAllTransactions(data);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!admJobId) {
      alert("กรุณาระบุ ADM Job ID");
      return;
    }

    setIsSubmitting(true);
    const adminLineId = sessionStorage.getItem("admin_line_id") || "Unknown";
    const adminName = sessionStorage.getItem("admin_name") || "Unknown";

    const formData = new FormData();
    formData.append("adm_job_id", admJobId);
    formData.append("product", product);
    formData.append("customer_name", customerName);
    formData.append("company_phone", companyPhone);
    formData.append("selling_price", sellingPrice);
    formData.append("channel", channel);
    formData.append("delivery_method", deliveryMethod);
    formData.append("pickup_date", deliveryMethod === "หน้าร้าน" ? pickupDate : "");
    formData.append("shipping_address", deliveryMethod === "จัดส่ง" ? shippingAddress : "");
    formData.append("transfer_date", transferDate);
    formData.append("note", note);
    formData.append("created_by_line_id", adminLineId);
    formData.append("created_by_name", adminName);
    if (transferSlip) {
      formData.append("transfer_slip", transferSlip);
    }

    try {
      const response = await fetch(
        `/api/paid-in-full/${encodeURIComponent(admJobId)}?token=${token}&admin_line_id=${adminLineId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        alert("บันทึกข้อมูลสำเร็จ!");
        await loadData();
      } else {
        const err = await response.json();
        alert("เกิดข้อผิดพลาด: " + (err.detail || "ไม่สามารถบันทึกได้"));
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
        {/* Header จ่ายครบ */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Header จ่ายครบ</h2>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกข้อมูลการชำระเงินครบถ้วนและรายละเอียดการส่งมอบสินค้า
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <span className="font-semibold">แบบฟอร์มข้อมูลการจ่ายครบ</span>
            </div>
            <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
              {admJobId ? `Job: ${admJobId}` : "รอระบุ Job ID"}
            </span>
          </div>

          <div className="p-6">
            {!admJobFromUrl && !admJobId && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <span className="font-semibold block mb-0.5">
                    ยังไม่ได้เลือก ADM Job ID
                  </span>
                  กรุณาระบุรหัส `adm_job` ผ่าน URL Parameter หรือป้อนรหัสในช่อง ADM Job ID ด้านล่าง
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* ADM Job ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  ADM Job ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  required
                  placeholder="ระบุ ADM Job ID"
                  value={admJobId}
                  onChange={(e) => setAdmJobId(e.target.value)}
                />
              </div>

              {/* Product Code & Customer Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    รหัสสินค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none transition"
                    required
                    readOnly
                    placeholder="ดึงจาก Job ID..."
                    value={product}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    ชื่อลูกค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none transition"
                    required
                    readOnly
                    placeholder="ดึงจาก Job ID..."
                    value={customerName}
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
                    สลิปโอนเงิน (ถ้ามี)
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
                    isSubmitting || !admJobId
                      ? "bg-slate-300 text-slate-500 shadow-none cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                  disabled={isSubmitting || !admJobId}
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
