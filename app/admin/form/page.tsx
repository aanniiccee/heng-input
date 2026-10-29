"use client";

export const dynamic = "force-dynamic";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  RefreshCw, 
  Save,
  Loader2,
  SquarePen,
  CheckCircle2
} from "lucide-react";

interface PawnDetail {
  interest_per_month: number;
  payment_date?: string;
  next_due_date?: string;
  input_status?: string;
  total_paid_amount: number;
}

interface Transaction {
  transaction_id: string;
  product: string;
  customer_name: string;
  phone_number?: string;
  channel: string;
  current_status: string;
  closed: string;
  note?: string;
  chat_link?: string;
  updated_by_name?: string;
  created_by_name?: string;
  transaction_pawn?: PawnDetail[] | PawnDetail;
}

function PawnFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";
  const txIdFromUrl = searchParams.get("tx_id")?.trim() || "";

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editTxId, setEditTxId] = useState("");
  const [isPawnUnlocked, setIsPawnUnlocked] = useState(false);
  const [originalPaymentDate, setOriginalPaymentDate] = useState("");

  const [product, setProduct] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [chatLink, setChatLink] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [channel, setChannel] = useState("LINE");
  const [interestPerMonth, setInterestPerMonth] = useState("");
  const [currentDueDate, setCurrentDueDate] = useState("");
  const [currentOverdueBalance, setCurrentOverdueBalance] = useState(0);
  const [paymentDate, setPaymentDate] = useState("");
  const [totalPaidAmount, setTotalPaidAmount] = useState("");
  const [closed, setClosed] = useState("NO");
  const [nextDueDateEdit, setNextDueDateEdit] = useState("");
  const [inputStatus, setInputStatus] = useState("");
  const [note, setNote] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const adminName = sessionStorage.getItem("admin_name");
    const adminLineId = sessionStorage.getItem("admin_line_id");

    if (!adminName || !adminLineId) {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("goto", window.location.pathname);
      window.location.href = "https://hheng-system.vercel.app/liff-router?" + currentParams.toString();
      return;
    }

    loadData();
  }, [token]);

  useEffect(() => {
    if (txIdFromUrl && allTransactions.length > 0) {
      const found = allTransactions.find(x => x.transaction_id === txIdFromUrl);
      if (found) {
        triggerEditMode(found);
      }
    }
  }, [txIdFromUrl, allTransactions]);

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

  const calculateOverdueAndDuration = (tx: Transaction) => {
    const pawnList = tx.transaction_pawn;
    const pData = Array.isArray(pawnList) ? pawnList[0] : pawnList;
    let overdueAmount = 0;

    if (tx.current_status !== "ชำระแล้ว" && pData && pData.next_due_date) {
      const dueDate = new Date(pData.next_due_date);
      const todayObj = new Date(todayStr);

      dueDate.setHours(0,0,0,0);
      todayObj.setHours(0,0,0,0);

      if (dueDate < todayObj) {
        let monthsDiff = (todayObj.getFullYear() - dueDate.getFullYear()) * 12 + (todayObj.getMonth() - dueDate.getMonth());
        let checkDate = new Date(dueDate);
        checkDate.setMonth(checkDate.getMonth() + monthsDiff);
        
        if (checkDate > todayObj) { 
          monthsDiff--; 
          checkDate = new Date(dueDate); 
          checkDate.setMonth(checkDate.getMonth() + monthsDiff); 
        }

        const timeDiff = todayObj.getTime() - checkDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const chargeableMonths = daysDiff > 0 ? monthsDiff + 1 : Math.max(1, monthsDiff);
        overdueAmount = chargeableMonths * (pData.interest_per_month || 0);
      }
    }
    return { overdueAmount };
  };

  const triggerEditMode = (tx: Transaction) => {
    const pawnList = tx.transaction_pawn;
    const pData: PawnDetail = Array.isArray(pawnList) ? pawnList[0] : (pawnList || { interest_per_month: 0, total_paid_amount: 0 });
    const { overdueAmount } = calculateOverdueAndDuration(tx);

    setEditTxId(tx.transaction_id);
    setIsPawnUnlocked(false);

    setProduct(tx.product || "");
    setCustomerName(tx.customer_name || "");
    setChatLink(tx.chat_link || "");
    setPhoneNumber(tx.phone_number || "");
    setChannel(tx.channel || "LINE");
    setInterestPerMonth(String(pData.interest_per_month || 0));
    
    setCurrentDueDate(pData.next_due_date || "");
    setCurrentOverdueBalance(overdueAmount);
    
    const initialPayDate = pData.payment_date && pData.payment_date !== "-" ? pData.payment_date : todayStr;
    setPaymentDate(initialPayDate);
    setOriginalPaymentDate(initialPayDate);
    
    setTotalPaidAmount(String(pData.total_paid_amount || 0));
    setClosed(tx.closed || "NO");
    setNextDueDateEdit("");
    
    setInputStatus(pData.input_status || "");
    setNote(tx.note || "");
  };

  const handlePawnUnlockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsPawnUnlocked(isChecked);

    if (isChecked) {
      setTotalPaidAmount("0");
      setNextDueDateEdit("");
      setClosed("NO");
    } else {
      setTotalPaidAmount("0");
      setPaymentDate(originalPaymentDate);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editTxId) {
      alert("ไม่พบรหัส Transaction สำหรับอัปเดต");
      return;
    }

    setIsSubmitting(true);
    const adminLineId = sessionStorage.getItem("admin_line_id") || "Unknown";
    const adminName = sessionStorage.getItem("admin_name") || "Unknown";

    let targetDueDate = "";
    let paymentDateValue = null;
    let paidAmountValue = 0;
    let closedValue = "NO";

    if (isPawnUnlocked) {
      targetDueDate = currentDueDate;
    } else {
      targetDueDate = nextDueDateEdit;
      paymentDateValue = paymentDate ? paymentDate : null;
      paidAmountValue = parseFloat(totalPaidAmount || "0");
      closedValue = closed;
    }

    const payload = {
      product,
      customer_name: customerName,
      phone_number: phoneNumber,
      channel,
      interest_per_month: parseFloat(interestPerMonth || "0"),
      payment_date: paymentDateValue,
      next_due_date: targetDueDate,
      input_status: inputStatus,
      closed: closedValue,
      total_paid_amount: paidAmountValue,
      note,
      is_edit_pawn_master: isPawnUnlocked,
      created_by_line_id: adminLineId,
      created_by_name: adminName,
      chat_link: chatLink
    };

    try {
      const response = await fetch(`/api/pawn-transactions/${encodeURIComponent(editTxId)}?token=${token}&admin_line_id=${adminLineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("อัปเดตข้อมูลสำเร็จ!");
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

  const getHomeUrl = () => {
    const adminLineId = sessionStorage.getItem("admin_line_id") || "";
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    if (adminLineId) params.set("admin_line_id", adminLineId);
    return params.toString() ? `/?${params.toString()}` : "/";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">จัดการข้อมูลการต่อดอก</h2>
            <p className="text-xs text-slate-500">ระบบหลังบ้านผู้ดูแลระบบ (Admin Form)</p>
          </div>
          <div className="flex gap-2">
            <Link href={getHomeUrl()} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 transition">
              <ArrowLeft size={16} /> หน้าหลัก
            </Link>
            <button type="button" onClick={loadData} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 transition" disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SquarePen size={20} className="text-emerald-400" />
              <span className="font-semibold">บันทึกข้อมูลรายการ</span>
            </div>
            <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
              {editTxId ? `ID: ${editTxId}` : "ยังไม่ได้เลือกรายการ"}
            </span>
          </div>

          <div className="p-6">
            {!editTxId && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <span className="font-semibold block mb-0.5">ยังไม่ได้เลือก Transaction ID</span>
                  กรุณาระบุรหัส `tx_id` ผ่าน URL Parameter หรือเลือกข้อมูลจากตารางหลักเพื่อเริ่มต้นแก้ไข
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Customer & Product Section */}
              <div className="flex justify-between items-center pt-2 pb-1 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ข้อมูลพื้นฐานลูกค้า</span>
                <label className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full cursor-pointer hover:bg-blue-100 transition">
                  <input type="checkbox" checked={isPawnUnlocked} onChange={handlePawnUnlockChange} className="rounded text-blue-600 focus:ring-blue-500" />
                  ปลดล็อกแก้ไขข้อมูลหลัก
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">รหัสสินค้า</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 transition"
                    required
                    disabled={!isPawnUnlocked}
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">ชื่อลูกค้า</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 transition"
                    required
                    disabled={!isPawnUnlocked}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 transition"
                    placeholder="0xxxxxxxxx"
                    disabled={!isPawnUnlocked}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">ช่องทางติดต่อ</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 transition"
                    disabled={!isPawnUnlocked}
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                  >
                    <option value="LINE">LINE</option>
                    <option value="FB">FB</option>
                    <option value="IG">IG</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ลิงก์แชทลูกค้า</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 transition"
                  placeholder="https://line.me/..."
                  disabled={!isPawnUnlocked}
                  value={chatLink}
                  onChange={(e) => setChatLink(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ดอกเบี้ยต่อเดือน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 transition font-mono"
                  required
                  disabled={!isPawnUnlocked}
                  value={interestPerMonth}
                  onChange={(e) => setInterestPerMonth(e.target.value)}
                />
              </div>

              {/* Payment & Installment Section */}
              <div className="pt-4 pb-1 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">รอบชำระและการต่อดอก</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">วันครบกำหนดชำระ (เดิม)</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 transition"
                    disabled={!isPawnUnlocked}
                    value={currentDueDate}
                    onChange={(e) => setCurrentDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">ยอดค้างชำระปัจจุบัน</label>
                  <input
                    type="text"
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-bold font-mono ${currentOverdueBalance > 0 ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}
                    readOnly
                    value={currentOverdueBalance.toLocaleString() + " บาท"}
                  />
                </div>
              </div>

              {isPawnUnlocked && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  ⚠️ หมายเหตุ: ขณะเปิดโหมดแก้ไขข้อมูลหลัก จะไม่สามารถบันทึกยอดชำระเงินในรอบนี้พร้อมกันได้
                </div>
              )}

              {/* Payment Box */}
              <div className={`p-4 rounded-2xl border transition ${isPawnUnlocked ? "opacity-40 bg-slate-100 border-slate-200" : "bg-slate-50/70 border-slate-200 space-y-4"}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">วันที่ชำระเงิน</label>
                    <input
                      type="date"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60"
                      disabled={isPawnUnlocked}
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">ยอดเงินที่ชำระ (บาท)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60 font-mono"
                      placeholder="0.00"
                      disabled={isPawnUnlocked}
                      value={totalPaidAmount}
                      onChange={(e) => setTotalPaidAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">สถานะการปิดยอดตั๋ว</label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60"
                    disabled={isPawnUnlocked}
                    value={closed}
                    onChange={(e) => setClosed(e.target.value)}
                  >
                    <option value="NO">NO - ต่อดอกเบี้ย (สร้างรอบถัดไปอัตโนมัติ)</option>
                    <option value="YES">YES - ชำระปิดยอดตั๋วสมบูรณ์</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-600 mb-1.5">วันครบกำหนดชำระรอบถัดไป</label>
                <input
                  type="date"
                  className="w-full bg-white border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                  required={!isPawnUnlocked && closed !== "YES"}
                  disabled={isPawnUnlocked || closed === "YES"}
                  value={closed === "YES" ? "" : nextDueDateEdit}
                  onChange={(e) => setNextDueDateEdit(e.target.value)}
                />
              </div>

              {/* Remarks */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">สถานะเพิ่มเติมจากแอดมิน</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder="เช่น โอนแล้ว, รอสลิป, ฯลฯ"
                  value={inputStatus}
                  onChange={(e) => setInputStatus(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">หมายเหตุเพิ่มเติม</label>
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
                  className={`w-full py-3 px-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer ${isSubmitting || !editTxId ? "bg-slate-300 text-slate-500 shadow-none cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  disabled={isSubmitting || !editTxId}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> กำลังบันทึกข้อมูล...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> บันทึกและอัปเดตข้อมูลการต่อดอก
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

export default function PawnUpdateFormPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">กำลังโหลดฟอร์ม...</div>}>
      <PawnFormContent />
    </Suspense>
  );
}
