/**
 * Clean & Lightweight Payslip PDF / Print Generator
 * Formats a corporate salary payslip with earnings, deductions, and net wage.
 * Opens native browser Print / Save-as-PDF dialog.
 */

export function downloadPayslipPDF(slip, user = {}) {
  if (!slip) return;

  const empName = slip.employeeName || user.name || "Employee";
  const empId = slip.employeeCode || slip.employeeId || user.employeeId || `EMP-${slip.id || 1}`;
  const dept = slip.department || user.department || "General";
  const period = slip.period || "Current Pay Period";
  const slipNumber = slip.payslipNumber || slip.number || `SLIP-${slip.id || 1}`;
  const disbursedDate = slip.paymentDate
    ? new Date(slip.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);

  const basic = parseFloat(slip.basicSalary || slip.basicWage || 0);
  const gross = parseFloat(slip.grossEarnings || slip.grossSalary || 0);
  const deductions = parseFloat(slip.totalDeductions || 0);
  const net = parseFloat(slip.netPay || slip.netSalary || (gross - deductions));
  const workedDays = slip.workedDays || 22;

  // Extract lines or create fallback standard breakdown
  let earningsLines = [];
  let deductionLines = [];

  if (Array.isArray(slip.lines) && slip.lines.length > 0) {
    earningsLines = slip.lines.filter(
      (l) => l.category === "basic" || l.category === "allowance" || l.category === "gross" || parseFloat(l.amount || 0) > 0
    );
    deductionLines = slip.lines.filter(
      (l) => l.category === "deduction" || l.category === "tax" || parseFloat(l.amount || 0) < 0
    );
  } else {
    earningsLines = [
      { name: "Basic Salary", amount: basic },
      { name: "House Rent Allowance (HRA)", amount: Math.round(basic * 0.2) },
      { name: "Standard Transport Allowance", amount: 2000 },
      { name: "Special Allowance", amount: Math.max(0, gross - (basic + Math.round(basic * 0.2) + 2000)) },
    ];
    deductionLines = [
      { name: "Provident Fund (PF)", amount: Math.round(basic * 0.12) },
      { name: "Professional Tax (PT)", amount: 200 },
      { name: "Tax Deducted at Source (TDS)", amount: Math.max(0, deductions - (Math.round(basic * 0.12) + 200)) },
    ];
  }

  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    alert("Please allow popups for this site to generate and download your payslip PDF.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${empName} - ${period}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; padding: 30px; color: #1e293b; font-size: 13px; }
    .payslip-container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #7743DB; margin-bottom: 24px; }
    .company-title { font-size: 22px; font-weight: 800; color: #7743DB; }
    .company-subtitle { font-size: 11px; color: #64748b; margin-top: 3px; }
    .payslip-badge { background: #e0e7ff; color: #4338ca; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 3px; }
    .meta-val { font-size: 13px; font-weight: 700; color: #0f172a; }

    .breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .breakdown-table { width: 100%; border-collapse: collapse; }
    .breakdown-table th { text-align: left; padding: 8px 10px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
    .breakdown-table td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .breakdown-table td.amount { text-align: right; font-family: monospace; font-size: 12px; font-weight: 600; }
    .breakdown-table tr.total-row td { font-weight: 800; background: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: none; font-size: 13px; }
    
    .net-banner { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
    .net-title { font-size: 14px; font-weight: 700; color: #065f46; }
    .net-sub { font-size: 11px; color: #047857; margin-top: 2px; }
    .net-amount { font-size: 26px; font-weight: 800; color: #059669; font-family: monospace; }
    
    .footer { margin-top: 36px; padding-top: 18px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8; }

    @media print {
      body { background: transparent; padding: 0; }
      .payslip-container { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <div class="header">
      <div>
        <div class="company-title">PeoplePay360</div>
        <div class="company-subtitle">Enterprise Human Resources & Payroll Management • Salary Statement</div>
      </div>
      <div style="text-align: right;">
        <span class="payslip-badge">${slip.status || "Paid & Disbursed"}</span>
        <div style="font-size: 11px; color: #64748b; margin-top: 6px; font-family: monospace;">Ref: ${slipNumber}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Employee Name</span>
        <span class="meta-val">${empName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Employee ID</span>
        <span class="meta-val">${empId}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Department</span>
        <span class="meta-val">${dept}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Pay Period</span>
        <span class="meta-val">${period}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Worked Days</span>
        <span class="meta-val">${workedDays} Days</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Disbursed Date</span>
        <span class="meta-val">${disbursedDate}</span>
      </div>
    </div>

    <div class="breakdown-grid">
      <!-- Earnings Section -->
      <div>
        <table class="breakdown-table">
          <thead>
            <tr>
              <th>Earnings (Gross)</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${earningsLines
              .map(
                (l) => `
              <tr>
                <td>${l.name || l.code}</td>
                <td class="amount">${formatINR(l.amount)}</td>
              </tr>
            `
              )
              .join("")}
            <tr class="total-row">
              <td>Total Gross Earnings</td>
              <td class="amount" style="color: #0f172a;">${formatINR(gross)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Deductions Section -->
      <div>
        <table class="breakdown-table">
          <thead>
            <tr>
              <th>Deductions</th>
              <th style="text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${deductionLines
              .map(
                (l) => `
              <tr>
                <td>${l.name || l.code}</td>
                <td class="amount" style="color: #e11d48;">-${formatINR(Math.abs(l.amount))}</td>
              </tr>
            `
              )
              .join("")}
            <tr class="total-row">
              <td>Total Deductions</td>
              <td class="amount" style="color: #e11d48;">-${formatINR(deductions)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="net-banner">
      <div>
        <div class="net-title">NET TAKE-HOME DISBURSEMENT</div>
        <div class="net-sub">Direct Bank Deposit • Completed</div>
      </div>
      <div class="net-amount">${formatINR(net)}</div>
    </div>

    <div class="footer">
      <span>Generated automatically by PeoplePay360 Payroll Engine</span>
      <span>Confidential • For Employee Record Only</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
