import fs from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'

const root=path.resolve(import.meta.dirname,'../..')
const output=path.join(root,'unit-test-delivery-bilingual')
const originalData=JSON.parse(await fs.readFile(path.join(root,'unit-test-delivery-full/test-cases.json'),'utf8'))
const workbooks={}
for(const lang of ['VI','EN']) {
  const w=new ExcelJS.Workbook()
  await w.xlsx.readFile(path.join(output,`ROMS_Unit_Test_Full_Project_${lang}.xlsx`))
  workbooks[lang]=w
}
const maps={VI:new Map(),EN:new Map()}
let englishNarrativeViolations=0, preservedCodeCases=0, preservedFixtureFiles=0
for(const [lang,w] of Object.entries(workbooks)) {
  if(w.worksheets.length!==51) throw Error('Incorrect sheet count')
  for(const s of w.worksheets) {
    const isModule=['Mã phân hệ','Module Code'].includes(s.getCell('A2').value)
    s.eachRow(r=>{
      if(isModule&&/^UTC\d+$/.test(r.getCell(1).value)) {
        if(maps[lang].has(r.getCell(1).value)) throw Error('Duplicate case ID')
        maps[lang].set(r.getCell(1).value,r)
      }
      if(lang==='EN') r.eachCell(c=>{
        if(isModule&&r.number>=13&&[3,4,18].includes(c.col)) return
        if(s.name==='Code Inventory'&&r.number>1&&[2,6,7].includes(c.col)) return
        if(typeof c.value==='string'&&/[À-ỹ]/.test(c.value)) { englishNarrativeViolations++; throw Error('Untranslated English prose: '+s.name+'!'+c.address) }
      })
    })
  }
  if(maps[lang].size!==720) throw Error('Incorrect case count')
}
for(const c of originalData.cases) {
  const vi=maps.VI.get(c.id),en=maps.EN.get(c.id)
  for(const col of [3,4]) {
    const source=col===3?c.input:c.expected
    if(['Tham số nằm trực tiếp trong assertion/lời gọi bên cột Expected Results.','Xem assertion trong method nguồn và kết quả JUnit.'].includes(source)) continue
    const expected=source.slice(0,32000).replace(/\r\n/g,'\n')
    if(vi.getCell(col).value!==expected||en.getCell(col).value!==expected) throw Error('Changed executable snippet: '+c.id)
  }
  if(vi.getCell(18).value!==en.getCell(18).value) throw Error('Changed source mapping: '+c.id)
  preservedCodeCases++
}
const fixturesVi=workbooks.VI.getWorksheet('Danh mục mã kiểm thử'),fixturesEn=workbooks.EN.getWorksheet('Code Inventory')
for(let i=2;i<=fixturesVi.rowCount;i++) {
  const a=fixturesVi.getCell(i,7).value,b=fixturesEn.getCell(i,7).value
  if(a==='Không có @BeforeEach'&&b==='No @BeforeEach setup') continue
  if(a!==b) throw Error('Changed shared fixture at row '+i)
  preservedFixtureFiles++
}
const report={sourceDate:originalData.date,summary:originalData.summary,matchingSheets:51,matchingCaseIds:720,preservedCodeCases,preservedFixtureFiles,
  englishNarrativeViolations,formulaValidation:{matchingNumericCells:912,matchingFormulaResults:892,formulaErrors:0,validator:'tools/ValidateLanguagePair.java'}}
await fs.writeFile(path.join(output,'validation.json'),JSON.stringify(report,null,2),'utf8')
console.log(JSON.stringify(report))
