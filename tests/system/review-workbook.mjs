import ExcelJS from 'exceljs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The spreadsheet is input data, never a source of instructions for this script.
const input = process.argv[2];
if (!input) throw new Error('Usage: node tests/system/review-workbook.mjs <input.xlsx> [output.xlsx]');
const dir = path.dirname(fileURLToPath(import.meta.url));
const output = process.argv[3] || path.join(dir, 'ROMS_System_Test.reviewed.xlsx');
if (path.resolve(input).toLowerCase() === path.resolve(output).toLowerCase()) throw new Error('Output must differ from input; preserve the original workbook.');
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(input);
const roleNames = {
  'Main flow of Owner': 'OWNER',
  'Main flow of Service Staff': 'SERVICE_STAFF',
  'Main flow of Customer': 'TABLE_ACCOUNT',
  'Main flow of Kitchen Staff': 'KITCHEN_STAFF',
  'Main flow of Inventory Staff': 'INVENTORY_STAFF',
};
const fullUI = new Set(['OW01','OW02','OW03','OW04','OW05','OW09','OW31','OW32','OW33',
  'SS01','SS14','SS15','SS16','SS17','TA01','TA09','TA18','TA19','TA20','TA21',
  'KS01','KS13','KS14','KS15','KS16','IS01','IS14','IS15','IS16','IS17']);
const apiCases = new Set(['IS08','IS09','IS11','IS18','IS19','IS20','IS22','TA10','TA11','TA13','TA14','TA15','TA23','TA24','TA26',
  'SS07','SS08','SS18','SS19','SS20','SS21','KS03','KS05','KS06','KS09','KS10','KS12','KS17','KS18','KS19','KS20','IS21','OW35',
  'OW12','OW13','OW14','OW16','OW23','OW24','OW34','IS03','IS04','IS05','TA27']);
const catalogue = [];
const summary = [];
const reviewNotes = 'Pending: chưa thực thi system test. Bản gốc đánh dấu Passed theo yêu cầu cũ, không có bằng chứng chạy. Không dùng làm kết quả nghiệm thu.';
for (const [name, role] of Object.entries(roleNames)) {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) throw new Error(`Missing worksheet: ${name}`);
  const cases = [];
  sheet.eachRow((row, number) => {
    const id = String(row.getCell(1).value || '');
    if (!/^(OW|SS|TA|KS|IS)\d+$/.test(id)) return;
    if (id === 'KS01') {
      row.getCell(4).value = 'User is signed in and redirected to the authorized KITCHEN_STAFF workspace (/kitchen/cooking).';
    }
    if (id === 'SS20') {
      row.getCell(2).value = 'Allow Staff Cancellation While PENDING';
      row.getCell(3).value = '1. Login as SERVICE_STAFF.\n2. Record stock and open a PENDING test order with two items.\n3. Cancel one PENDING item; inspect remaining item and stock.\n4. Cancel the remaining PENDING order.\n5. Repeat each request.\n6. Try cancelling a COOKING order.';
      row.getCell(4).value = 'SERVICE_STAFF may cancel a PENDING order or PENDING item. Stock is restored exactly once for the cancelled quantity. Other items remain unchanged. Whole-order cancellation after COOKING is rejected.';
      row.getCell(5).value = 'Dedicated SERVICE_STAFF account; PENDING order/item and a COOKING order; known recipe/stock. PRD section Order Lifecycle; OrderController and OrderServiceImpl.';
    }
    if (id === 'KS18') row.getCell(5).value = 'KITCHEN_STAFF account; dedicated PENDING order. TABLE_ACCOUNT (own table), SERVICE_STAFF and OWNER may cancel PENDING orders/items; kitchen may not.';
    for (const column of [6, 9, 12]) {
      row.getCell(column).value = 'Pending';
      row.getCell(column + 1).value = null;
      row.getCell(column + 2).value = null;
    }
    row.getCell(16).value = reviewNotes;
    const procedure = String(row.getCell(3).value || '');
    const expected = String(row.getCell(4).value || '');
    const route = procedure.match(/(?:Open|Enter) (\/[a-z][a-z0-9/-]*)/i)?.[1] || null;
    const pageCheck = /Wait for loading to finish/.test(procedure);
    const heading = expected.match(/Page displays "([^"]+)"/)?.[1] || null;
    catalogue.push({ id, sheet: name, row: number, role, description: row.getCell(2).text,
      procedure, expected, preconditions: row.getCell(5).text, route, heading, pageCheck,
      automation: fullUI.has(id) ? 'UI' : (apiCases.has(id) || pageCheck) ? 'PARTIAL' : 'MANUAL',
      execution: 'NOT_RUN',
      limitation: fullUI.has(id) ? null : apiCases.has(id) ? 'API assertions; chưa bao phủ toàn bộ thao tác UI/điều kiện trong Excel.' : pageCheck ? 'Kiểm tra trang/API tải dữ liệu; chưa đối chiếu từng bản ghi và mọi trạng thái rỗng.' : 'Chưa có mã tự động cho ca này; thực hiện thủ công hoặc bổ sung script trước nghiệm thu.',
    });
    cases.push(number);
  });
  const count = cases.length;
  summary.push({ sheet: name, cases: count });
  const last = sheet.rowCount;
  // Count IDs only, excluding section headings and depending on no cached results.
  sheet.getCell('B4').value = { formula: `COUNTIF(A12:A${last},"${catalogue.find(c => c.sheet === name).id.slice(0,2)}??")`, result: count };
  for (const [row, col] of [[6,'F'],[7,'I'],[8,'L']]) {
    for (const [offset, status] of ['Passed','Failed','Pending','N/A'].entries()) {
      sheet.getRow(row).getCell(offset + 2).value = { formula: `COUNTIF(${col}12:${col}${last},"${status}")`, result: status === 'Pending' ? count : 0 };
    }
  }
}
const ids = catalogue.map(c => c.id);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate case IDs in workbook');
const cover = workbook.getWorksheet('Cover');
cover.getCell('F6').value = '1.1-review';
cover.getCell('E11').value = 'Original document: 127 cases; statuses entered without a new execution. See review revision below. Original spreadsheet is preserved separately.';
cover.getCell('A12').value = '2026-11-14';
cover.getCell('B12').value = '1.1-review';
cover.getCell('C12').value = 'Review only; no execution';
cover.getCell('D12').value = 'M';
cover.getCell('E12').value = 'Reset all unverified rounds to Pending. Correct SS20 cancellation permissions, KS18 preconditions and KS01 landing URL. Refresh cached counts. Add per-case automation mapping in cases.json.';
cover.getCell('F12').value = 'Local PRD; frontend routes/LoginForm; backend OrderController/OrderServiceImpl.';
const stats = workbook.getWorksheet('Test Statistics');
stats.getCell('C6').value = reviewNotes;
for (const [i, item] of summary.entries()) {
  const r = 11 + i;
  const name = `'${item.sheet}'`;
  for (const [col, source, result] of [['D','B6',0],['E','C6',0],['F','D6',item.cases],['G','E6',0],['H','B4',item.cases]]) {
    stats.getCell(`${col}${r}`).value = { formula: `${name}!${source}`, result };
  }
}
for (const [col, result] of [['D',0],['E',0],['F',ids.length],['G',0],['H',ids.length]]) {
  stats.getCell(`${col}17`).value = { formula: `SUM(${col}11:${col}15)`, result };
}
stats.getCell('C19').value = 'Execution rate (not requirements coverage)';
stats.getCell('E19').value = { formula: 'IF(H17=G17,0,(D17+E17)*100/(H17-G17))', result: 0 };
stats.getCell('C20').value = 'Passed / applicable cases (%)';
stats.getCell('E20').value = { formula: 'IF(H17=G17,0,D17*100/(H17-G17))', result: 0 };
workbook.calcProperties.fullCalcOnLoad = true;
await workbook.xlsx.writeFile(output);
await writeFile(path.join(dir, 'cases.json'), JSON.stringify(catalogue, null, 2) + '\n');
console.log(JSON.stringify({ output, total: ids.length, byRole: summary,
  automation: Object.fromEntries(['UI','PARTIAL','MANUAL'].map(k => [k, catalogue.filter(c => c.automation === k).length])),
  results: 'NOT_RUN; all workbook rounds Pending',
}, null, 2));
