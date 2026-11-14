import fs from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'

const root = path.resolve(import.meta.dirname, '../..')
const backend = path.join(root, 'roms-backend')
const output = path.resolve(process.argv[3] ?? path.join(root, 'unit-test-delivery-full'))
const template = path.resolve(process.argv[2] ?? path.join(output, 'tools/report-template.xlsx'))
await fs.mkdir(output, { recursive: true })
const date = '14/11/2026'
const decode = s => s.replace(/&#x([\da-f]+);|&#(\d+);|&(quot|apos|lt|gt|amp);/gi, (_, hex, dec, named) =>
  hex ? String.fromCodePoint(parseInt(hex,16)) : dec ? String.fromCodePoint(+dec) : ({quot:'"',apos:"'",lt:'<',gt:'>',amp:'&'}[named]))
const attrs = text => Object.fromEntries([...text.matchAll(/([\w.-]+)="([^"]*)"/g)].map(m => [m[1],decode(m[2])]))
async function files(dir, suffix) {
  const entries = await fs.readdir(dir, {withFileTypes:true})
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(path.join(dir,e.name),suffix) : e.name.endsWith(suffix) ? [path.join(dir,e.name)] : []))).flat().sort()
}
// Balanced Java/JS braces, ignoring strings and comments, preserve complete test bodies.
function endBrace(text, start) {
  let depth=0, quote='', comment=''
  for(let i=start;i<text.length;i++) {
    const c=text[i], next=text[i+1]
    if(comment==='line') { if(c==='\n') comment=''; continue }
    if(comment==='block') { if(c==='*'&&next==='/') { comment='';i++ } continue }
    if(quote) { if(c==='\\') i++; else if(c===quote) quote=''; continue }
    if(c==='/'&&next==='/') {comment='line';i++;continue}
    if(c==='/'&&next==='*') {comment='block';i++;continue}
    if(c==='"'||c==="'"||c==='`') {quote=c;continue}
    if(c==='{') depth++
    if(c==='}'&&--depth===0) return i
  }
  throw Error('Unbalanced test source')
}
const trim = s => s.trim().replace(/^ {4}/gm,'')
function methods(src) {
  const found=[]
  let previousEnd=0
  const re=/\bvoid\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+[^{}]+)?\{/g
  for(const m of src.matchAll(re)) {
    if(m.index<previousEnd) continue
    const start=m.index+m[0].length-1, end=endBrace(src,start)
    const prefix=src.slice(Math.max(previousEnd,m.index-1200),m.index)
    const title=prefix.match(/@DisplayName\("((?:\\.|[^"\\])*)"\)/)?.[1]
    found.push({name:m[1],offset:m.index,body:trim(src.slice(start+1,end)),isTest:/@Test\b/.test(prefix),setup:/@BeforeEach\b/.test(prefix),title,
      line:src.slice(0,m.index).split('\n').length})
    previousEnd=end+1
  }
  return found
}
const runResults=[]
for(const file of await files(path.join(backend,'target/roms-unit-reports'),'.xml')) {
  const xml=await fs.readFile(file,'utf8')
  for(const m of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const a=attrs(m[1]), body=m[2]||''
    runResults.push({...a, suite:attrs(xml.match(/<testsuite\b([^>]*)>/)?.[1]||'').name, status:/<(failure|error)\b/.test(body)?'Failed':/<skipped\b/.test(body)?'Pending':'Passed',
      detail:decode(body.match(/<(?:failure|error|skipped)[^>]*message="([^"]*)"/)?.[1]||'')})
  }
}
const sourceFiles=await files(path.join(backend,'src/test/java'),'.java')
const cases=[], inventory=[], matched=new Set()
const moduleFor = s => {
  if(/Auth|RefreshToken|Otp|Email/.test(s)) return 'Auth'
  if(/TokenHash|Jwt|SecurityUtils/.test(s)) return 'Security'
  if(/WebSocket|Stomp|OrderEvent/.test(s)) return 'Realtime'
  if(/Bill/.test(s)) return 'Bill'
  if(/Kitchen/.test(s)) return 'Kitchen'
  if(/Order/.test(s)) return 'Order'
  if(/ServiceSession/.test(s)) return 'Service Session'
  if(/Table/.test(s)) return 'Table'
  if(/Ingredient/.test(s)) return 'Ingredient'
  if(/InventoryCheck/.test(s)) return 'Inventory Check'
  if(/StockMovement/.test(s)) return 'Stock Movement'
  if(/Purchase/.test(s)) return 'Purchase'
  if(/Recipe/.test(s)) return 'Recipe'
  if(/Category/.test(s)&&!/Tax/.test(s)) return 'Category'
  if(/Menu|Catalog/.test(s)) return 'Menu'
  if(/Promotion/.test(s)) return 'Promotion'
  if(/Tax/.test(s)) return 'Tax'
  if(/Expense/.test(s)) return 'Expense'
  if(/Dashboard|Csv/.test(s)) return 'Dashboard and CSV'
  if(/RestaurantSetting/.test(s)) return 'Restaurant Setting'
  if(/Printer/.test(s)) return 'Printer'
  if(/User/.test(s)) return 'User'
  if(/Ai|Gemini/.test(s)) return 'AI'
  if(/Cloudinary/.test(s)) return 'Cloudinary'
  return 'Common and Config'
}
const human = name => name.replace(/_/g,' ').replace(/([a-z\d])([A-Z])/g,'$1 $2')
function typeFor(name,body) {
  if(/boundary|rounding|half.?up|zero|emptyString|500 rows|oversized|large.?amount/i.test(name)) return 'Boundary'
  if(/assertThatThrownBy|assertThrows|assert\.rejects|status\(\)\.is(?:Bad|Not|Forbidden|Unauthorized|Conflict)|\.isInstanceOf\(\w*Exception/.test(body)
      || /reject|unknown|inactive|wrong|invalid|expired|revoked|forbidden|missing|denied|not.?found/i.test(name)) return 'Abnormal'
  return 'Normal'
}
for(const file of sourceFiles) {
  const src=await fs.readFile(file,'utf8'), className=path.basename(file,'.java')
  const pkg=src.match(/package\s+([\w.]+)/)?.[1], fullName=pkg+'.'+className
  const parsed=methods(src), tests=parsed.filter(m=>m.isTest)
  const classes=[...src.matchAll(/\bclass\s+(\w+)[^{;]*\{/g)].map(m=>({name:m[1],start:m.index,end:endBrace(src,m.index+m[0].length-1),display:[...src.slice(Math.max(0,m.index-180),m.index).matchAll(/@DisplayName\("([^"]+)"\)/g)].at(-1)?.[1]}))
  const mocks=[...src.matchAll(/@(?:Mock|Spy|InjectMocks)\b\s*(?:private\s+)?([\w<>?, ]+)\s+(\w+)\s*[;=]/g)].map(m=>m[2]+': '+m[1])
  const setup=parsed.filter(m=>m.setup).map(m=>m.name+'():\n'+m.body).join('\n\n')
  const rel=path.relative(root,file).replaceAll('\\','/')
  const excluded=/@SpringBootTest/.test(src)||/CloudinaryLiveSmokeTest|PrinterServiceImplTest/.test(className)
  const reason=/PrinterServiceImplTest/.test(className)?'Phụ thuộc máy in Windows; test hiện có có thể gửi lệnh in thật.':
    /CloudinaryLiveSmokeTest/.test(className)?'Live smoke test cần bật riêng và thông tin Cloudinary.':
    /@SpringBootTest/.test(src)?'Integration test khởi động Spring Boot và cần hạ tầng ứng dụng/database; không chạy trong profile unit-tests.':''
  const level=excluded?'Integration / môi trường':/controller|@ContextConfiguration|@WebMvcTest/.test(file+' '+src)?'Component (mock HTTP/security)':'Unit (isolated)'
  inventory.push({className,source:rel,count:tests.length,level,reason,setup,mocks:mocks.join('\n')})
  for(const method of tests) {
    const scope=classes.filter(c=>method.offset>c.start&&method.offset<c.end).at(-1)
    const matches=runResults.map((r,i)=>({r,i})).filter(({r}) => (r.classname===fullName||r.classname?.startsWith(fullName+'$')||r.suite===fullName&&(!scope||scope.name===className||[scope.display,scope.name].includes(r.classname))) && r.name.replace(/\(.*$/,'')===method.name)
    if(matches.length>1) throw Error('Ambiguous method: '+fullName+'#'+method.name)
    if(!excluded && matches.length!==1) throw Error('Missing execution result: '+fullName+'#'+method.name)
    if(matches.length) matched.add(matches[0].i)
    const run=matches[0]?.r
    const firstCheck=method.body.search(/\b(?:assertThat\w*|assertThrows|assertEquals|assertTrue|assertFalse|assertNotNull|assertNull|assertDoesNotThrow|verify\w*)\s*\(|\.andExpect\(/)
    const input=firstCheck>=0?method.body.slice(0,firstCheck).trim():method.body
    const expected=firstCheck>=0?method.body.slice(firstCheck).trim():'Xem assertion trong method nguồn và kết quả JUnit.'
    const name=method.title?method.title.replace(/\\"/g,'"'):human(method.name)
    cases.push({module:moduleFor(className),title:name,method:method.name,reference:fullName+(scope&&scope.name!==className?'$'+scope.name:'')+'#'+method.name,
      source:rel,line:method.line,level,precondition:reason || `Dependencies được mock/cấu hình trong ${className}.\n${mocks.join('; ')}\nFixture chung: xem sheet Code Inventory và @BeforeEach trong file nguồn.`,
      input:input||'Tham số nằm trực tiếp trong assertion/lời gọi bên cột Expected Results.',
      expected,body:method.body,type:typeFor(name+' '+method.name,method.body),status:excluded?'Pending':run.status,
      reason,time:run?.time||'',actual:excluded?'Chưa chạy: '+reason:run.status==='Passed'?'JUnit: tất cả assertion trong test đã đạt.':run.detail})
  }
}
if(matched.size!==runResults.length) throw Error(`Unmapped JUnit results: ${runResults.length-matched.size}`)
const frontendBuffer=await fs.readFile(path.join(root,'frontend-unit-results.xml'))
const frontendXml=frontendBuffer.toString(frontendBuffer[0]===255&&frontendBuffer[1]===254?'utf16le':'utf8')
for(const m of frontendXml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
  const a=attrs(m[1]), src=await fs.readFile(a.file,'utf8')
  const offset=src.indexOf("test('"+a.name+"'")
  if(offset<0) throw Error('Frontend source not found: '+a.name)
  const start=src.indexOf('{',offset),end=endBrace(src,start),body=trim(src.slice(start+1,end))
  const first=body.search(/\bassert\./)
  const source=path.relative(root,a.file).replaceAll('\\','/')
  const feModules = { 'ingredientImport.test.mjs':'FE Ingredient Import', 'purchaseImport.test.mjs':'FE Purchase Import',
    'authSchemas.test.mjs':'FE Auth', 'tableSchema.test.mjs':'FE Table', 'promotionSchema.test.mjs':'FE Promotion',
    'purchaseSchema.test.mjs':'FE Purchase', 'expenseSchema.test.mjs':'FE Expense',
    'authApi.test.mjs':'FE Auth', 'orderingApi.test.mjs':'FE Ordering', 'cartStore.test.mjs':'FE Ordering',
    'kitchenApi.test.mjs':'FE Kitchen', 'billingApi.test.mjs':'FE Billing', 'receiptPrinter.test.mjs':'FE Billing',
    'menu.test.mjs':'FE Menu', 'menuImport.test.mjs':'FE Menu', 'tableApi.test.mjs':'FE Table',
    'realtimeStores.test.mjs':'FE Realtime', 'aiChat.test.mjs':'FE AI', 'dashboardApi.test.mjs':'FE Dashboard',
    'reportApi.test.mjs':'FE Reports', 'settingsApi.test.mjs':'FE Settings', 'users.test.mjs':'FE Users',
    'recipeApi.test.mjs':'FE Recipes', 'inventoryApi.test.mjs':'FE Inventory', 'expenseApi.test.mjs':'FE Expense',
    'promotionApi.test.mjs':'FE Promotion', 'purchaseApi.test.mjs':'FE Purchase' }
  const isImport=source.includes('Import.test.mjs')
  cases.push({module:feModules[path.basename(source)] ?? 'FE '+path.basename(source,'.test.mjs'),title:a.name,
    method:a.name,reference:source+' :: '+a.name,source,line:src.slice(0,offset).split('\n').length,level:'Unit (Node.js)',
    precondition:isImport?'Node.js + ExcelJS; tạo workbook trong bộ nhớ. Xem helper excel() trong file nguồn. HTTP nếu có được mock.':
      /Schema/.test(source)?'Node.js + Zod có sẵn. Gọi schema thật của frontend; không gọi backend/database.':
      'Node.js 24; gọi API/store/utility/schema thật. Helper register.mjs chỉ nạp TS, thay Vite DEV=false và thay HTTP client bằng httpMock.mjs; DOM/sessionStorage nếu cần được giả lập, không gọi mạng hay in thật. Xem beforeEach/afterEach và helper trong source.',
    input:first>=0?body.slice(0,first).trim():body,expected:first>=0?body.slice(first).trim():body,body,
    type:typeFor(a.name,body),status:/<(failure|error)\b/.test(m[2]||'')?'Failed':'Passed',time:a.time,
    actual:'Node.js test runner: đối chiếu frontend-unit-results.xml.'})
}
for(const source of [...new Set(cases.filter(c=>c.module.startsWith('FE ')).map(c=>c.source))]) {
  const src=await fs.readFile(path.join(root,source),'utf8')
  inventory.push({className:path.basename(source),source,count:cases.filter(c=>c.source===source).length,level:'Unit (Node.js)',reason:'',mocks:'Không gọi backend/database.',setup:src.slice(0,src.indexOf("test('")).trim()})
}
cases.sort((a,b)=>a.module.localeCompare(b.module)||a.source.localeCompare(b.source)||a.line-b.line)
cases.forEach((c,i)=>c.id='UTC'+String(i+1).padStart(4,'0'))
const count=(list,key,val)=>list.filter(c=>c[key]===val).length
const summary={total:cases.length,passed:count(cases,'status','Passed'),failed:count(cases,'status','Failed'),pending:count(cases,'status','Pending'),
  backendExecuted:runResults.length,frontendExecuted:cases.filter(c=>c.module.startsWith('FE ')).length,
  newBackendTests:cases.filter(c=>/AuthServiceUnitTest|RefreshTokenServiceUnitTest|CsvExportUtilTest|TokenHashUtilTest|UserServiceUnitTest|EmailServiceUnitTest|PrinterServiceUnitTest|SecurityUtilsTest|MenuContextInvalidatorTest|CatalogAccessTest/.test(c.source)).length,
  newFrontendTests:cases.filter(c=>c.module.startsWith('FE ')&&!/ingredientImport.test.mjs|purchaseImport.test.mjs/.test(c.source)).length}
summary.newTests=summary.newBackendTests+summary.newFrontendTests
if(summary.frontendExecuted===0) throw Error('No frontend execution results found')
await fs.writeFile(path.join(output,'test-cases.json'),JSON.stringify({date,summary,cases,inventory},null,2),'utf8')

const workbook=new ExcelJS.Workbook()
await workbook.xlsx.readFile(template)
workbook.creator='ROMS';workbook.created=new Date('2026-11-14T00:00:00+07:00');workbook.calcProperties.fullCalcOnLoad=true
const cover=workbook.getWorksheet('Cover'), index=workbook.getWorksheet('Test Cases'), stats=workbook.getWorksheet('Test Statistics')
for (const [sheet,keep] of [[cover,16],[index,8],[stats,11]]) {
  if(sheet.rowCount>keep) sheet.spliceRows(keep+1,sheet.rowCount-keep)
}
workbook.removeWorksheet('ModuleName1')
const set=(sheet,ref,value)=>{sheet.getCell(ref).value=value}
const project='Restaurant Operations Management System (ROMS)'
set(cover,'B4',project);set(cover,'B5','ROMS');set(cover,'F4','ROMS — bộ kiểm thử tự động');set(cover,'F5',date);set(cover,'F6','3.0')
set(cover,'B6','ROMS_Unit_Test_Full_Project_v3.0');set(cover,'A11',date);set(cover,'B11','3.0');set(cover,'C11','Toàn bộ 16 phân hệ FE và nghiệp vụ backend');set(cover,'D11','M')
set(cover,'E11',`${summary.total} test cases: ${summary.passed} Passed, ${summary.failed} Failed, ${summary.pending} Pending. Bổ sung ${summary.newTests} unit tests. Chỉ ghi nhận một vòng chạy thực tế.`)
set(cover,'F11','Source ROMS; PRD; TECH_ARCHITECTURE; code test; JUnit XML; Node.js XML. Mẫu bố cục: unit-test-mau.xlsx và Report-5.1_Unit Test.xlsx. Nội dung dự án mẫu được thay bằng ROMS.')
cover.getRow(11).height=105
set(index,'D3',project);set(index,'D4','ROMS');set(index,'D5','Java 21; Maven; Spring Boot theo pom.xml; JUnit + Mockito + AssertJ. Backend: mvn -Punit-tests test. Frontend: node --test tests/*.test.mjs. Profile loại các integration test và test máy in. Kết quả được lấy từ lần chạy hiện tại, không dùng XML cũ.')
index.getRow(5).height=100
for(let r=9;r<=index.rowCount;r++) for(let c=2;c<=6;c++) index.getCell(r,c).value=null
set(stats,'B4',project);set(stats,'B5','ROMS');set(stats,'F4','ROMS — kiểm thử tự động');set(stats,'F5','Chưa xác nhận');set(stats,'B6','ROMS_Unit_Test_Full_Project_v3.0');set(stats,'F6',date)
set(stats,'B7',`Round 1: ${summary.backendExecuted} backend + ${summary.frontendExecuted} frontend đã chạy; ${summary.passed} Passed, ${summary.failed} Failed. ${summary.pending} ca integration/máy in chưa chạy. Round 2/3: N/A. Tỷ lệ bên dưới đo số ca đã thực thi trong danh mục, KHÔNG phải line/branch coverage. Phân loại N/A/B được gợi ý từ tên/assertion và cần rà soát nghiệp vụ.`)
stats.getRow(7).height=100
for(let r=12;r<=stats.rowCount;r++) for(let c=1;c<=9;c++) stats.getCell(r,c).value=null
const border={top:{style:'thin',color:{argb:'FFCBD5E1'}},bottom:{style:'thin',color:{argb:'FFCBD5E1'}},left:{style:'thin',color:{argb:'FFCBD5E1'}},right:{style:'thin',color:{argb:'FFCBD5E1'}}}
function tableHeader(row) {row.height=32;row.eachCell(c=>{c.font={name:'Calibri',size:11,bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1E3A5F'}};c.alignment={vertical:'middle',wrapText:true};c.border=border})}
const limit=s=>String(s??'').slice(0,32000)
function dataRow(sheet,values,height=95) {const row=sheet.addRow(values.map(v=>typeof v==='string'?limit(v):v));row.height=height;row.eachCell(c=>{c.font={name:'Calibri',size:10};c.alignment={vertical:'top',wrapText:true};c.border=border});return row}
const modules=[...new Set(cases.map(c=>c.module))]
for(const [i,module] of modules.entries()) {
  const list=cases.filter(c=>c.module===module),sheet=workbook.addWorksheet(module)
  sheet.columns=[{width:15},{width:47},{width:62},{width:72},{width:14},{width:13},{width:14},{width:24},{width:13},{width:14},{width:20},{width:13},{width:14},{width:20},{width:15},{width:58},{width:28},{width:66},{width:52},{width:14}]
  sheet.getCell('A2').value='Code Module';sheet.getCell('B2').value=module
  sheet.getCell('A3').value='Number of TCs';sheet.getCell('B3').value={formula:`COUNTA(A13:A${12+list.length})`,result:list.length}
  sheet.getRow(4).values=['Testing Round','Passed','Failed','Pending']
  for(const [row,col] of [[5,'F'],[6,'I'],[7,'L']]) {
    sheet.getCell(`A${row}`).value='Round '+(row-4)
    for(const [c,status] of [['B','Passed'],['C','Failed'],['D','Pending']])
      sheet.getCell(`${c}${row}`).value={formula:`COUNTIF(${col}13:${col}${12+list.length},"${status}")`,result:row===5?count(list,'status',status):0}
  }
  sheet.getRow(8).values=['Testing Type','Normal','Abnormal','Boundary']
  sheet.getCell('A9').value='Count'
  for(const [col,type] of [['B','Normal'],['C','Abnormal'],['D','Boundary']]) sheet.getCell(col+'9').value={formula:`COUNTIF(E13:E${12+list.length},"${type}")`,result:count(list,'type',type)}
  sheet.mergeCells('A10:T10');sheet.getCell('A10').value='Một vòng chạy thực tế. Round 2/3 = N/A. Input/Expected trích từ fixture và assertion trong code; xem nguồn và Code Inventory để có @BeforeEach đầy đủ.';sheet.getRow(10).height=32
  sheet.getCell('A10').alignment={wrapText:true,vertical:'middle'}
  sheet.getRow(11).values=['Test Case ID','Pre-conditions','Input parameters / setup & action','Expected Results / assertions','Type','Round 1','Test date','Tester','Round 2','Test date','Tester','Round 3','Test date','Tester','Defect IDs','Description / Note','Test level','Source / Test method','Actual result','Time (seconds)']
  tableHeader(sheet.getRow(11))
  sheet.getRow(12).height=8
  for(const c of list) {
    const row=dataRow(sheet,[c.id,c.precondition,c.input,c.expected,c.type,c.status,c.status==='Pending'?'':date,c.status==='Pending'?'':'Tự động (JUnit/Node)','N/A','','','N/A','','',c.status==='Failed'?'DEF-'+c.id:'',c.title+'\n'+(c.reason||'Không ghi nhận vòng retest chưa thực hiện.'),c.level,`${c.source}:${c.line}\n${c.reference}`,c.actual,c.time?+c.time:null],Math.min(300,Math.max(100,c.expected.split('\n').length*12)))
    row.getCell(6).fill={type:'pattern',pattern:'solid',fgColor:{argb:c.status==='Passed'?'FFDCFCE7':c.status==='Failed'?'FFFEE2E2':'FFFEF3C7'}}
    row.getCell(6).dataValidation={type:'list',allowBlank:false,formulae:['"Passed,Failed,Pending"']}
  }
  sheet.views=[{state:'frozen',xSplit:1,ySplit:12}];sheet.autoFilter={from:'A11',to:`T${sheet.rowCount}`}
  sheet.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'11:12'}
  const ir=index.getRow(9+i);ir.values=[null,i+1,module,module,`${list.length} ca: ${count(list,'status','Passed')} Passed, ${count(list,'status','Failed')} Failed, ${count(list,'status','Pending')} Pending. ${[...new Set(list.map(c=>c.source.split('/').at(-1)))].join(', ')}`,'Fixture/mocks xem Code Inventory; ca cần hạ tầng được ghi Pending.'];ir.height=62
  ir.getCell(4).value={text:module,hyperlink:`#'${module}'!A1`}
  const sr=stats.getRow(12+i);sr.values=[i+1,module,...['Passed','Failed','Pending'].map((status,j)=>({formula:`'${module}'!${['B','C','D'][j]}5`,result:count(list,'status',status)})),...['Normal','Abnormal','Boundary'].map((type,j)=>({formula:`'${module}'!${['B','C','D'][j]}9`,result:count(list,'type',type)})),{formula:`'${module}'!B3`,result:list.length}];sr.height=24
}
const totalRow=13+modules.length
stats.getCell(`B${totalRow}`).value='Tổng cộng'
for(let c=3;c<=9;c++) stats.getCell(totalRow,c).value={formula:`SUM(${String.fromCharCode(64+c)}12:${String.fromCharCode(64+c)}${11+modules.length})`,result:[summary.passed,summary.failed,summary.pending,...['Normal','Abnormal','Boundary'].map(t=>count(cases,'type',t)),summary.total][c-3]}
for(const [j,label,num] of [[0,'Tỷ lệ ca đã thực thi (không phải code coverage)',summary.passed+summary.failed],[1,'Tỷ lệ Passed trên tổng ca',summary.passed],[2,'Normal case',count(cases,'type','Normal')],[3,'Abnormal case',count(cases,'type','Abnormal')],[4,'Boundary case',count(cases,'type','Boundary')]]) {
  const r=totalRow+2+j;stats.getCell(`B${r}`).value=label;stats.getCell(`D${r}`).value={formula:`${num}/I${totalRow}`,result:num/summary.total};stats.getCell(`D${r}`).numFmt='0.00%'
}
for(const s of [index,stats]) s.eachRow(r=>r.eachCell(c=>{c.alignment={wrapText:true,vertical:'top'};c.font={name:'Calibri',size:11}}))
index.views=[{state:'frozen',ySplit:8}];stats.views=[{state:'frozen',ySplit:11}]
const code=workbook.addWorksheet('Code Inventory');code.columns=[{width:36},{width:68},{width:12},{width:34},{width:65},{width:65},{width:100}]
tableHeader(code.addRow(['Test class / file','Source','Cases','Level','Reason pending / scope','Mocks','Shared fixture / @BeforeEach / imports (source excerpt)']))
inventory.forEach(c=>dataRow(code,[c.className,c.source,c.count,c.level,c.reason||(c.level==='Unit (Node.js)'?'Đã chạy bằng Node.js test runner':'Đã chạy trong profile unit-tests'),c.mocks,c.setup||'Không có @BeforeEach'],120));code.views=[{state:'frozen',ySplit:1}];code.autoFilter=`A1:G${code.rowCount}`
const notes=workbook.addWorksheet('Read Me');notes.columns=[{width:30},{width:135}]
tableHeader(notes.addRow(['Mục','Nội dung']))
for(const item of [
  ['Kết quả',JSON.stringify(summary)],
  ['Phạm vi','Toàn bộ 16 phân hệ ROMS: Auth, Users, Tables, Ordering, Kitchen, Billing, Menu, Inventory, Recipes, Purchasing, Promotions, Expenses, Dashboard, Reports, Settings và AI. Có test logic/store/schema/API contract FE và service/backend. Xem Project Scope và Backend Service Scope. Không khẳng định 100% nhánh hay giao diện React.'],
  ['Môi trường','Windows; Java 21; Maven; Spring Boot theo pom.xml; Node.js; ExcelJS có sẵn trong frontend. Không thêm dependency ứng dụng.'],
  ['Backend','cd roms-backend; mvn -Punit-tests test (hoặc .\\run-unit-tests.ps1). XML: target/roms-unit-reports.'],
  ['Frontend','cd ROMS_FE; npm test (hoặc npm run test:unit). Code test: ROMS_FE/tests/*.test.mjs. Helpers: tests/helpers/*.mjs. Không có HTTP/máy in thật. API test kiểm tra request/response và truyền lỗi; không thay thế kiểm thử backend nghiệp vụ.'],
  ['Bằng chứng','execution-results.json lưu status/tên/thời gian thực chạy; test-cases.json lưu ánh xạ tới source. Không lấy kết quả từ thư mục surefire-reports cũ.'],
  ['Pending','Ca dùng @SpringBootTest, PostgreSQL live, Cloudinary live hoặc máy in cần môi trường riêng. Chưa chạy, không đánh dấu Passed.'],
  ['Phân loại','Normal / Abnormal / Boundary được gợi ý từ tên test và assertion, chưa được reviewer nghiệp vụ xác nhận. Một test method có thể có nhiều assertion; danh mục đếm method/testcase, không đếm assertion.'],
  ['Input / Expected','Trích nguyên fixture/action và assertion từ code để có thể tái lập. Fixture chung nằm ở Code Inventory và file nguồn; test có helper cần đọc helper trong source.'],
  ['Round 2 / 3','N/A: chưa thực hiện retest riêng. Không sao chép các vòng kiểm thử, defect, tác giả hay kết quả của dự án trong file mẫu.'],
  ['Coverage','Tỷ lệ số ca thực thi và Passed được tính từ danh mục. Chưa đo line/branch coverage, không suy ra 100% chất lượng hay độ bao phủ mã nguồn.'],
  ['Reviewer / Tester','Reviewer: chưa xác nhận. Tester: công cụ tự động JUnit/Node.js; không gán tên thành viên dự án.']
]) dataRow(notes,item,65)
const featureScope = [
  ['auth','Xác thực, phiên, OTP, mật khẩu','authApi|authSchemas','AuthService|RefreshTokenService|OtpRedisService|EmailService|JwtToken|TokenHash|SecurityUtils','Đăng nhập, refresh, logout, OTP đúng/sai/hết hạn, phiên tablet/staff.'],
  ['users','Quản lý tài khoản và hồ sơ','users.test','UserService|UserController','CRUD nhân viên/tablet, gán bàn, chuẩn hóa email, tự khóa, đổi mật khẩu, thu hồi phiên.'],
  ['tables','Bàn và phiên phục vụ','tableApi|tableSchema|realtimeStores','TableService|ServiceSessionService','CRUD bàn, trạng thái, mở/đóng/chuyển bàn, lịch sử, gọi nhân viên.'],
  ['ordering','Gọi món và giỏ hàng','orderingApi|cartStore','OrderService|OrderController','Thêm/gộp/xóa món, ghi chú/tổng giỏ, tạo/hủy đơn, hủy một phần, trả hàng bán thẳng.'],
  ['kitchen','Bếp KDS và ra món','kitchenApi|realtimeStores','KitchenService|KitchenController','Nhận đơn, nấu/ready tất cả, chuyển trạng thái món, hàng đợi READY, chống trùng STOMP.'],
  ['billing','Tạm tính, hóa đơn và thanh toán','billingApi|receiptPrinter','BillService|BillController|PrinterService','Preview, VAT/giảm giá, thanh toán nhiều phương thức, chống thanh toán trùng, in bằng mock.'],
  ['menu','Menu, danh mục, ảnh, import/export','menu.test|menuImport','MenuItem|MenuExcel|CategoryService|CatalogWrite|CatalogDeletion|MenuAvailability','CRUD, quyền đọc/ghi, trạng thái bán, ảnh/multipart, giá, VAT, danh mục, Excel và xác nhận trùng.'],
  ['inventory','Nguyên liệu, kiểm kho, biến động','inventoryApi|ingredientImport','IngredientService|IngredientExcel|InventoryCheck|StockMovement','CRUD/import nguyên liệu, kiểm kê, chênh lệch, lịch sử kho, dữ liệu biên.'],
  ['recipes','Định lượng và chi phí công thức','recipeApi','RecipeItemService','Đọc/thay công thức, thêm/sửa/xóa nguyên liệu, định lượng thập phân, nguyên liệu ngừng dùng.'],
  ['purchasing','Phiếu nhập và điều chỉnh','purchaseApi|purchaseSchema|purchaseImport','PurchaseService','Lọc thời gian, tạo/xem nhập hàng, sửa quantity/price, bù trừ tồn, Excel đầu vào.'],
  ['promotions','Khuyến mãi','promotionApi|promotionSchema','PromotionService|PromotionController','CRUD, trạng thái, mã trùng, phần trăm/số tiền, thời hạn, giới hạn lượt dùng.'],
  ['expenses','Chi phí và hủy khoản chi','expenseApi|expenseSchema','ExpenseService|ExpenseController','Tạo/sửa/hủy, lý do hủy, bộ lọc trạng thái/thời gian, số tiền biên.'],
  ['dashboard','Dashboard và món bán chạy','dashboardApi','DashboardService|DashboardController','Tổng quan, khoảng thời gian, top món, xu hướng, dữ liệu thiếu/lỗi quyền.'],
  ['reports','Báo cáo tài chính và CSV','reportApi','DashboardService|CsvExportUtil','Doanh thu/chi phí/lợi nhuận âm, bộ lọc, xuất CSV/blob, UTF-8 BOM, làm tròn.'],
  ['settings','Cài đặt nhà hàng, VAT, máy in','settingsApi','RestaurantSetting|TaxCategory|PrinterService','Chuẩn hóa snake/camel, giữ false, VAT, thuế suất, khổ giấy, không in thiết bị thật.'],
  ['ai','AI trợ lý và realtime dùng chung','aiChat|realtimeStores','AiAssistant|Gemini|MenuContext|Stomp|WebSocket|OrderEventPublisher','Dị ứng/ngân sách/số người, cách ly chat theo bàn/phiên, cache sau commit, provider lỗi, phân quyền STOMP.'],
]
const scopeSheet=workbook.addWorksheet('Project Scope');scopeSheet.columns=[{width:18},{width:40},{width:65},{width:70},{width:12},{width:12},{width:12},{width:90}]
tableHeader(scopeSheet.addRow(['Phân hệ FE','Phạm vi','Code test FE thực thi','Code test Backend','FE Passed','BE Passed','BE Pending','Luồng kiểm thử / giới hạn']))
for(const [feature,label,fePattern,bePattern,description] of featureScope) {
  const fe=cases.filter(c=>c.module.startsWith('FE ')&&new RegExp(fePattern).test(c.source))
  const be=cases.filter(c=>!c.module.startsWith('FE ')&&new RegExp(bePattern).test(c.source))
  if(fe.length===0||count(fe,'status','Passed')!==fe.length||count(be,'status','Passed')===0) throw Error('Missing full-project coverage for '+feature)
  dataRow(scopeSheet,[feature,label,[...new Set(fe.map(c=>c.source))].join('\n'),[...new Set(be.map(c=>c.source))].join('\n'),count(fe,'status','Passed'),count(be,'status','Passed'),count(be,'status','Pending'),description+' Các số này là ca test được ánh xạ; một ca dùng chung có thể xuất hiện ở nhiều phân hệ. Không cộng bảng này làm tổng hay hiểu là line/branch coverage.'],110)
}
scopeSheet.views=[{state:'frozen',ySplit:1}];scopeSheet.autoFilter=`A1:H${scopeSheet.rowCount}`
const serviceScope=workbook.addWorksheet('Backend Service Scope');serviceScope.columns=[{width:42},{width:70},{width:90},{width:22},{width:85}]
tableHeader(serviceScope.addRow(['Service/helper thực tế','Source ứng dụng','Code test trực tiếp','Ca Passed trong lớp test','Ghi chú phạm vi']))
const testSources=await Promise.all(sourceFiles.map(async file=>({source:path.relative(root,file).replaceAll('\\','/'),text:await fs.readFile(file,'utf8')})))
for(const mainFile of await files(path.join(backend,'src/main/java/com/roms/service/impl'),'.java')) {
  const name=path.basename(mainFile,'.java')
  const references=testSources.filter(t=>new RegExp('new\\s+'+name+'\\s*\\(|@InjectMocks[\\s\\S]{0,160}\\b'+name+'\\b|\\b'+name+'(?:::|\\.)').test(t.text))
  const mapped=cases.filter(c=>references.some(t=>t.source===c.source))
  const passed=count(mapped,'status','Passed')
  dataRow(serviceScope,[name,path.relative(root,mainFile).replaceAll('\\','/'),references.map(t=>t.source).join('\n')||'Kiểm thử qua service gọi helper',passed,
    passed?'Đã có test gọi implementation/helper thật với dependencies mock. Số ca là toàn lớp test tham chiếu; không phải coverage từng method/nhánh.':'Chưa có test trực tiếp đã chạy; xem kiểm thử gián tiếp và source.'],95)
  if(passed===0) throw Error('Missing direct backend service/helper tests: '+name)
}
serviceScope.views=[{state:'frozen',ySplit:1}];serviceScope.autoFilter=`A1:E${serviceScope.rowCount}`
summary.featureModules=featureScope.length
summary.backendServiceFiles=serviceScope.rowCount-1
await fs.writeFile(path.join(output,'test-cases.json'),JSON.stringify({date,summary,cases,inventory},null,2),'utf8')
await workbook.xlsx.writeFile(path.join(output,'Report-5.1_Unit Test_ROMS_Full_Project.xlsx'))
await fs.writeFile(path.join(output,'execution-results.json'),JSON.stringify({date,summary,backend:runResults.map(({name,classname,time,status,detail})=>({name,classname,time,status,detail})),frontend:cases.filter(c=>c.module.startsWith('FE ')).map(c=>({name:c.title,time:c.time,status:c.status}))},null,2),'utf8')
console.log(JSON.stringify(summary));console.log('Saved XLSX report with '+workbook.worksheets.length+' sheets.')
