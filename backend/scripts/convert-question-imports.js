const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const sourceDir = "C:/Users/harsh/Downloads";
const outputDir = path.resolve(__dirname, "../../output/question-imports");
const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  for (let index = 1; index <= 5; index += 1) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(
      path.join(sourceDir, `competency_assessment_set_${index}.xlsx`),
    );

    const lines = [];
    workbook.worksheets[0].eachRow({ includeEmpty: false }, (row) => {
      lines.push(row.values.slice(1).map(quote).join(","));
    });

    const outputPath = path.join(
      outputDir,
      `competency_assessment_set_${index}.csv`,
    );
    fs.writeFileSync(outputPath, `${lines.join("\r\n")}\r\n`, "utf8");
    console.log(`${outputPath}: ${lines.length - 1} questions`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
