"use client";

export const dynamic = "force-dynamic";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  RefreshCw, 
  Save,
  Loader2,
  SquarePen
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

export default function PawnUpdateFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";
  const txIdFromUrl = searchParams.get("tx_id")?.trim() || "";

  // --- States สำคัญสำหรับข้อมูล ---
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- States สำหรับควบคุมฟอร์มแก้ไข ---
  const [editTxId, setEditTxId] = useState("");
  const [isPawnUnlocked, setIsPawnUnlocked] = useState(false);
  const [originalPaymentDate, setOriginalPaymentDate] = useState("");

  // --- States สำหรับผูกข้อมูล Input ในฟอร์ม (Form Bindings) ---
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

  // ==========================================
  // 1. ตรวจสอบ Admin Session & โหลดข้อมูล
  // ==========================================
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

  // หากมี tx_id พ่วงมาใน URL ให้โหลดข้อมูลเข้าฟอร์มแก้ไขทันที
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

  // ==========================================
  // 2. คำนวณยอดค้างชำระ
  // ==========================================
  const calculateOverdueAndDuration = (tx: Transaction) => {
    const pawnList = tx.transaction_pawn;
    const pData = Array.isArray(pawnList) ? pawnList[0] : pawnList;

    let statusText = "ยังไม่ถึงกำหนด";
    let overdueAmount = 0;

    if (tx.current_status === "ชำระแล้ว") {
      statusText = "ชำระแล้ว";
    } else if (pData && pData.next_due_date) {
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

  // ==========================================
  // 3. ระบบบันทึกและอัปเดตข้อมูล
  // ==========================================
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
      paymentDateValue = null;
      paidAmountValue = 0;
      closedValue = "NO";
      targetDueDate = currentDueDate;
    } else {
      targetDueDate = nextDueDateEdit;
      paymentDateValue = paymentDate ? paymentDate : null;
      paidAmountValue = parseFloat(totalPaidAmount || "0");
      closedValue = closed;
    }

    const payload = {
      product: product,
      customer_name: customerName,
      phone_number: phoneNumber,
      channel: channel,
      interest_per_month: parseFloat(interestPerMonth || "0"),
      payment_date: paymentDateValue,
      next_due_date: targetDueDate,
      input_status: inputStatus,
      closed: closedValue,
      total_paid_amount: paidAmountValue,
      note: note,
      is_edit_pawn_master: isPawnUnlocked,
      created_by_line_id: adminLineId,
      created_by_name: adminName,
      chat_link: chatLink
    };

    const url = `/api/pawn-transactions/${encodeURIComponent(editTxId)}`;

    try {
      const response = await fetch(`${url}?token=${token}&admin_line_id=${adminLineId}`, {
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
    <div className="p-4 max-w-xl mx-auto">
      {/* ส่วนหัวระบบ */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">อัปเดตข้อมูลการต่อดอก</h2>
        <div className="flex gap-2">
          <Link href={getHomeUrl()} className="btn btn-default flex items-center gap-1">
            <ArrowLeft size={18} /> กลับหน้าหลัก
          </Link>
          <button type="button" onClick={loadData} className="btn btn-default flex items-center gap-1" disabled={loading}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> รีเฟรช
          </button>
        </div>
      </div>

      {/* ฟอร์มแก้ไขข้อมูลเดี่ยวๆ */}
      <div className="form-card bg-white p-6 rounded-lg shadow border">
        <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <SquarePen size={22} />
          <span>บันทึกรายการ {editTxId ? `(ID: ${editTxId})` : ""}</span>
        </h3>
        
        {!editTxId && (
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded text-sm">
            ⚠️ ยังไม่ได้เลือกรายการ กรุณาระบุรหัส `tx_id` ผ่าน URL Parameter หรือเลือกข้อมูลจากระบบหลังบ้าน
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-gray-700">รายละเอียดการต่อดอก</span>
            <label className="flex items-center gap-1 text-sm cursor-pointer text-blue-600 font-medium">
              <input type="checkbox" checked={isPawnUnlocked} onChange={handlePawnUnlockChange} />
              แก้ไขข้อมูล
            </label>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">รหัสสินค้า</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              required
              placeholder="กรอกรายละเอียดสินค้า"
              disabled={!isPawnUnlocked}
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">ชื่อลูกค้า</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              required
              placeholder="ชื่อ-นามสกุล"
              disabled={!isPawnUnlocked}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">ลิงก์แชทลูกค้า</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="วางลิงก์แชท เช่น https://line.me/..."
              disabled={!isPawnUnlocked}
              value={chatLink}
              onChange={(e) => setChatLink(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="0xxxxxxxxx"
              disabled={!isPawnUnlocked}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">ช่องทางติดต่อ</label>
            <select
              className="w-full border p-2 rounded"
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

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">ดอกเบี้ยต่อเดือน (บาท)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border p-2 rounded"
              required
              placeholder="0.00"
              disabled={!isPawnUnlocked}
              value={interestPerMonth}
              onChange={(e) => setInterestPerMonth(e.target.value)}
            />
          </div>

          <hr className="my-4 border-dashed" />

          <div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-600 mb-1">วันครบกำหนดชำระ (รอบปัจจุบัน)</label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                disabled={!isPawnUnlocked}
                value={currentDueDate}
                onChange={(e) => setCurrentDueDate(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">ยอดค้างชำระ (รอบปัจจุบัน)</label>
              <input
                type="text"
                className={`w-full border p-2 rounded font-bold ${currentOverdueBalance > 0 ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}
                readOnly
                value={currentOverdueBalance.toLocaleString() + " บ."}
              />
            </div>

            {isPawnUnlocked && (
              <div className="mb-3 p-3 bg-amber-50 text-amber-800 rounded text-sm">
                <span>⚠️ หมายเหตุ: กรณีแก้ไขข้อมูลรายการต่อดอกเดิม จะไม่สามารถอัปเดตข้อมูลการรับชำระพร้อมกันได้</span>
              </div>
            )}

            <div className={`p-3 rounded border mb-3 ${isPawnUnlocked ? "opacity-50 bg-gray-100" : "bg-gray-50"}`}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">วันที่ชำระ</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded"
                  disabled={isPawnUnlocked}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">ยอดเงินที่ชำระ (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border p-2 rounded"
                  placeholder="0.00"
                  disabled={isPawnUnlocked}
                  value={totalPaidAmount}
                  onChange={(e) => setTotalPaidAmount(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">ปิดยอดตั๋วใบนี้เลยหรือไม่?</label>
                <select
                  className="w-full border p-2 rounded"
                  disabled={isPawnUnlocked}
                  value={closed}
                  onChange={(e) => setClosed(e.target.value)}
                >
                  <option value="NO">NO (จ่ายเพื่อต่อดอก สร้างรายการต่อดอกครั้งถัดไป)</option>
                  <option value="YES">YES (จ่ายเพื่อปิดยอด)</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-blue-600 mb-1">วันครบกำหนดชำระครั้งถัดไป</label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                required={!isPawnUnlocked && closed !== "YES"}
                disabled={isPawnUnlocked || closed === "YES"}
                value={closed === "YES" ? "" : nextDueDateEdit}
                onChange={(e) => setNextDueDateEdit(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">สถานะจากแอดมิน</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="ระบุสถานะ..."
              value={inputStatus}
              onChange={(e) => setInputStatus(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
            <textarea
              className="w-full border p-2 rounded"
              rows={2}
              placeholder="ระบุหมายเหตุ..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>

          <button 
            type="submit" 
            className={`w-full py-2.5 px-4 rounded text-white font-medium flex items-center justify-center gap-2 ${isSubmitting || !editTxId ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
            disabled={isSubmitting || !editTxId}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> กำลังบันทึกข้อมูล...
              </>
            ) : (
              <>
                <Save size={18} /> บันทึกข้อมูล
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
