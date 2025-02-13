/**
 * 
 * Crawler for JPG and OBJ files 
 * 
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { dir } = require('console');



// Define the source folders
let dataSourcePath = null
let crossDataExcelPath = null
let outputExcelPath = null
let deliveryNumber = null
let lastRowHeader2D = null
let lastRowHeader3D = null

let outputWorkbook = null;
let outputWorksheet = null;

let outputLinesArray = [];

const idColumnIndex = 4

//output excel first row
const outputExcelFirstEmptyRow = 13


function getMuseumFullname(acronym) {
  if (acronym === "MNAz")
    return "47 - Museu Nacional do Azulejo (MMP, E.P.E.)"
  else if (acronym === "MNT")
    return "49 - Museu Nacional do Traje (MMP, E.P.E.)"
  else return ""
}

// Helper function to load an Excel sheet by index
async function loadExcelSheet(filePath, sheetIndex) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook.worksheets[sheetIndex];
}

// Helper function to extract headers
function extractHeaders(sheet, headerRowIndex) {
  return sheet.getRow(headerRowIndex).values; // Skip the first empty cell
}

// Helper function to find a row by column value
function findRow(sheet, columnIndex, value) {
  for (let i = 1; i <= sheet.rowCount; i++) {
    const cellValue = sheet.getRow(i).getCell(columnIndex).value;
    if (cellValue == value) return sheet.getRow(i);
  }
  return null;
}

// Helper function to list files matching a pattern in a directory
function findFilesInDir(dir, pattern) {
  return fs.readdirSync(dir).filter(file => file.match(pattern));
}

// Load the output Excel file
async function loadOutput() {
  outputWorkbook = new ExcelJS.Workbook();
  await outputWorkbook.xlsx.readFile(outputExcelPath);
  outputWorksheet = outputWorkbook.getWorksheet(1);
}

// Process the main directory and collect data
async function processMainFolder(mainFolderPath) {
  let errors = []

  //Load da crossdata 2D e 3D
  const crossDataSheet2D = await loadExcelSheet(crossDataExcelPath, 0);
  const headers2D = extractHeaders(crossDataSheet2D, lastRowHeader2D); // Adjust header row index if needed
  const objectIdIndex2D = headers2D.indexOf("N.º Inv.")

  const crossDataSheet3D = await loadExcelSheet(crossDataExcelPath, 1);
  const headers3D = extractHeaders(crossDataSheet3D, lastRowHeader3D); // Adjust header row index if needed
  const objectIdIndex3D = headers3D.indexOf("N.º Inv.")

  const mediaFolders = fs.readdirSync(mainFolderPath);

  for (const mediaFolder of mediaFolders) {
    const mediaFolderPath = path.join(mainFolderPath, mediaFolder);

    if (!fs.existsSync(mediaFolderPath)) {
      errors.push(`Pasta não encontrada: ${mediaFolderPath}`);
      continue;
    }

    try {
      if (fs.lstatSync(mediaFolderPath).isDirectory()) {
        let crossDataSheet, headers, objectIdIndex;
        let objectId = null

        if (mediaFolder === "2D") {
          crossDataSheet = crossDataSheet2D;
          headers = headers2D;
          objectIdIndex = objectIdIndex2D;

          const contentFolders = fs.readdirSync(mediaFolderPath);

          for (const contentFolder of contentFolders) {
            const contentFolderPath = path.join(mediaFolderPath, contentFolder);

            try {
              const [museumId, objectIdTemp] = contentFolder.split('_');


              //Caso em que os nInv sao com separador / ou & ou .
              if (objectIdTemp.includes('&')) {
                const objectIdTempSplit = objectIdTemp.split('&')
                if (objectIdTempSplit.length === 2)
                  objectId = parseInt(objectIdTempSplit[0], 10) + "/" + objectIdTempSplit[1]
                else if (objectIdTempSplit.length === 3)
                  objectId = parseInt(objectIdTempSplit[0], 10) + "/" + objectIdTempSplit[1] + "/" + objectIdTempSplit[2]

              }
              else if (/^[0-9]+$/.test(objectIdTemp)) //se for numero, passar para inteiro (porque pode ser 00321, passar para 321)
                objetId = parseInt(objectIdTemp, 10)
              else
                objectId = objectIdTemp

              if (contentFolder.split('_').length !== 3) {
                errors.push(`Detetada pasta 2D inválida: ${contentFolder}. Deve ser SIGLA_nINV_2D.`);
                continue;
              }

              if (fs.lstatSync(contentFolderPath).isDirectory()) {
                const targetFolderPath = contentFolderPath; //path.join(contentFolderPath, "JPEG");

                if (fs.existsSync(targetFolderPath) && fs.lstatSync(targetFolderPath).isDirectory()) {
                  const files = fs.readdirSync(targetFolderPath); // Read JPEG directory
                  const jpgFiles = files.filter(file => path.extname(file).toLowerCase() === '.jpg');

                  const row = findRow(crossDataSheet, objectIdIndex, objectId);
                  if (!row) {
                    errors.push(`Nº Inv. 2D <b>${objectId} (original: ${objectIdTemp}) </b> não encontrado no excel dos dados do museu. Verificar n. inv nas pastas e cruzar com excel.`);
                    continue;
                  }

                  const dataFoto = row.getCell(headers.indexOf("Data da Fotografia")).value;
                  const fotografo = row.getCell(headers.indexOf("Fotógrafo")).value;

                  const observ = row.getCell(headers.indexOf("Notas/Observações Equipa HEDGE") + 2).value;


                  jpgFiles.forEach(file => outputLinesArray.push([
                    getMuseumFullname(museumId),
                    null,
                    null,
                    observ !== null ? observ : objectId,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "2D",
                    dataFoto,
                    `Universidade Nova de Lisboa (${fotografo})`,
                    file,
                    null,
                    "Envio " + deliveryNumber
                  ]));
                } else {
                  errors.push(`Invalid JPEG folder: ${targetFolderPath}. Is it missing, or wrong name?`);
                }
              }
            } catch (innerError) {
              errors.push(`Erro ao processar pasta 2D: ${contentFolder}: ${innerError.message}`, { stack: innerError.stack });
            }
          }
        } else if (mediaFolder === "3D") {
          crossDataSheet = crossDataSheet3D;
          headers = headers3D;
          objectIdIndex = objectIdIndex3D;

          const contentFolders = fs.readdirSync(mediaFolderPath);

          for (const contentFolder of contentFolders) {
            const contentFolderPath = path.join(mediaFolderPath, contentFolder);

            try {
              const [museumId, objectIdTemp] = contentFolder.split('_');

              //Caso em que os nInv sao com separador / ou & ou .
              if (objectIdTemp.includes('&')) {
                const objectIdTempSplit = objectIdTemp.split('&')
                if (objectIdTempSplit.length === 2)
                  objectId = parseInt(objectIdTempSplit[0], 10) + "/" + objectIdTempSplit[1]
                else if (objectIdTempSplit.length === 3)
                  objectId = parseInt(objectIdTempSplit[0], 10) + "/" + objectIdTempSplit[1] + "/" + objectIdTempSplit[2]

              }
              else if (objectIdTemp.startsWith('0')) {
                console.log("entrei", /^[0-9]+$/.test(objectIdTemp))
                objetId = objectIdTemp.replace(/^0+/, '')
              } //se for numero, passar para inteiro (porque pode ser 00321, passar para 321)
              else
                objectId = objectIdTemp

              console.log("objectId", objectIdTemp, objectId)
              if (fs.lstatSync(contentFolderPath).isDirectory()) {
                const subfolders = fs.readdirSync(contentFolderPath)
                  .filter(name => fs.lstatSync(path.join(contentFolderPath, name)).isDirectory());

                let targetFolder = subfolders.find(name => name.toLowerCase().endsWith('lod') || name.toLowerCase().endsWith('lods'));
                if (!targetFolder) targetFolder = contentFolder;

                if (targetFolder) {
                  const targetFolderPath = contentFolderPath;

                  if (fs.lstatSync(targetFolderPath).isDirectory()) {
                    const files = fs.readdirSync(targetFolderPath);
                    const lod1Files = files.filter(file => file.toLowerCase().endsWith('.glb'));;
                    const row = findRow(crossDataSheet, objectIdIndex, objectId);

                    if (!row) {
                      errors.push(`Nº Inv. 3D <b>${objectId} (original: ${objectIdTemp}) </b>não encontrado no excel dos dados do museu. Verificar n. inv nas pastas e cruzar com excel.`);
                      continue;
                    }

                    const dataFoto = row.getCell(headers.indexOf("Data de Aquisição 3D")).value;
                    const fotografo = row.getCell(headers.indexOf("Responsável")).value;

                    const observ = row.getCell(headers.indexOf("Notas/Observações Equipa HEDGE") + 2).value;
                    lod1Files.forEach(file => outputLinesArray.push([
                      getMuseumFullname(museumId),
                      null,
                      null,
                      observ !== null ? observ : objectId,
                      null,
                      null,
                      null,
                      null,
                      null,
                      "3D",
                      dataFoto,
                      `Universidade Nova de Lisboa`,
                      file,
                      null,
                      "Envio " + deliveryNumber
                    ]));
                  }
                } else {
                  errors.push(`No valid LOD folder found in: ${contentFolderPath}`);
                }
              }
            } catch (innerError) {
              errors.push(`Error processing 3D folder ${contentFolder}: ${innerError.message}`, { stack: innerError.stack });
            }
          }
        } else {
          errors.push(`Pasta inválida detetada: ${mediaFolderPath}. Deve ser '2D' ou '3D'.`);
        }
      }
    } catch (error) {
      errors.push(`Error processing media folder ${mediaFolder}: ${error.message}`, { stack: error.stack });
    }
  }
  console.log("ERRORS", errors)
  return errors
}

// Save the output data to the Excel file
async function saveOutput() {
  const startRow = checkFirstEmptyRow(outputWorksheet, outputExcelFirstEmptyRow)
  const startCol = 1;

  outputLinesArray.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = outputWorksheet.getRow(startRow + rowIndex).getCell(startCol + colIndex);
      cell.alignment = { horizontal: 'left' }
      cell.font = {
        name: 'Barlow',
        size: 8,
        underline: false
      }
      cell.value = value;
    });
  });

  await outputWorkbook.xlsx.writeFile(outputExcelPath);
  console.log('Excel file updated successfully.');
}

async function generateExcel(folders, museumData, output, deliveryNr, lastRowHdr2D, lastRowHdr3D) {
  console.log("VALORES", folders, museumData, output)

  dataSourcePath = folders
  crossDataExcelPath = museumData
  outputExcelPath = output
  deliveryNumber = deliveryNr
  lastRowHeader2D = lastRowHdr2D
  lastRowHeader3D = lastRowHdr3D

  await loadOutput();
  let result = await processMainFolder(dataSourcePath);
  await saveOutput();

  console.log("result", result)
  outputLinesArray = []
  return result;

}

function checkFirstEmptyRow(worksheet, startRow) {
  let rowNumber = startRow //+ 1; // Start searching after the specified row
  while (rowNumber <= worksheet.rowCount) {
    const row = worksheet.getRow(rowNumber);
    if (!row || row.values.every(cell => cell === null || cell === undefined || cell === '')) {
      return rowNumber
    }
    rowNumber++;
  }
  return rowNumber;
}

async function findMatchingFolders(dirPath, ids) {
  const matches = [];

  const entries = fs.readdirSync(dirPath)
  console.log(entries)

  for (const entry of entries) {
    const imageFolders = fs.readdirSync(path.join(dirPath, entry))

    //Comparar IDs
    const existingIds = ids.filter(id => imageFolders.includes(id))

    matches.push(...existingIds)

  }

  return matches;
}

let duplicatedPaths = []
async function checkDuplicatesExcel(folders, excel) {
  outputExcelPath = excel;
  await loadOutput();

  const firstEmptyRow = checkFirstEmptyRow(outputWorksheet, outputExcelFirstEmptyRow);

  if (firstEmptyRow === outputExcelFirstEmptyRow)
    return "O Excel está vazio.";

  // Step 1: Store IDs in a Set for faster lookups
  const idSet = new Set();
  for (let i = outputExcelFirstEmptyRow; i < firstEmptyRow; i++) {
    const ninv = outputWorksheet.getRow(i).getCell(4).value + "";
    const type = outputWorksheet.getRow(i).getCell(10).value;
    idSet.add(`${ninv}_${type}`);  // Combine as a unique key
  }

  console.log("Unique ID Pairs:", idSet);

  // Step 2: Check files
  const allFiles = findFiles(folders, ['.jpg', '.glb']);
  console.log("All Files:", allFiles);

  const duplicatedFiles = allFiles.filter(filePath => {
    const fileName = path.parse(filePath).name.split("_");
    const fileInv = parseInt(fileName[1], 10); // Inventory number
    const fileType = fileName[2];              // 2D or 3D

    return idSet.has(`${fileInv}_${fileType}`);
  });

  console.log("Duplicated Files:", duplicatedFiles);

  duplicatedPaths = duplicatedFiles
  return duplicatedFiles; // Return the result if needed
}



async function getAllFiles(folder) {
  if (!folder || typeof folder !== "string") {
    throw new Error("Invalid directory path");
  }

  const normalizedPath = path.resolve(folder);

  let files = [];
  const items = await fs.readdirSync(normalizedPath, { withFileTypes: true });

  for (const item of items) {
    const res = path.join(normalizedPath, item.name);
    if (item.isDirectory()) {
      files = files.concat(await getAllFiles(res));
    } else {
      files.push(res);
    }
  }
  return files;
}


async function removeDuplicatesExcel(folders, excel) {
  if (duplicatedPaths.length === 0)
    duplicatedPaths = await checkDuplicatesExcel(folders, excel); // Await for async function

  for (const filePath of duplicatedPaths) {
    fs.unlink(filePath, (err) => { // Asynchronous file deletion
      if (err) {
        console.error(`Error deleting ${filePath}:`, err);
      } else {
        console.log(`Deleted: ${filePath}`);
      }
    });
  }

  return "Duplicados apagados com sucesso.";
  duplicatedPaths = []
}


function findFiles(directory, extensions, results = []) {
  const items = fs.readdirSync(directory, { withFileTypes: true });

  items.forEach(item => {
    const fullPath = path.join(directory, item.name);
    if (item.isDirectory()) {
      findFiles(fullPath, extensions, results);
    } else if (extensions.includes(path.extname(item.name).toLowerCase())) {
      results.push(fullPath);
    }
  });

  return results;
}




module.exports = { generateExcel, checkDuplicatesExcel, removeDuplicatesExcel };
