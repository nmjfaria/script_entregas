const fs = require('fs-extra');
const path = require('path');
const { generateExcel, checkDuplicatesExcel, removeDuplicatesExcel } = require('./excel-output.js'); // Import the function
const { checkFiles } = require('./verifyFiles.js')

const getFilesRecursively = (dir, ext) => {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath, ext));
    } else if (path.extname(fullPath) === ext) {
      files.push(fullPath);
    }
  });
  return files;
};

const copyFiles = (source, dest, ext) => {
  console.log(`Copying ${ext} files to folder ${dest}`);
  const sufix = ext === '.jpg' ? "2D" : "3D"
  const sourcePath = path.join(source);

  if (fs.existsSync(sourcePath)) {
    let files = getFilesRecursively(sourcePath, ext);

    if (ext === '.glb') //filtrar os LOD0
      files = files.filter(file => !file.endsWith("_LOD0.glb"))

    files.forEach(file => {
      const fileName = path.basename(file);
      let prefixName = fileName.includes("_" + sufix) ? //Obter xxx_yyy_2D ou  xxx_yyy_3D
        fileName.split("_" + sufix)[0] + "_" + sufix
        : fileName.split(".")[0] + "_" + sufix

      const targetDir = path.join(dest, sufix, prefixName)
      let targetPath = path.join(targetDir, fileName); // Construct full target path
      targetPath = targetPath.replaceAll("_LOD1", "");

      const dir = path.dirname(targetPath); // Get the directory of the file
      const ext = path.extname(targetPath); // Get the file extension
      const baseName = path.basename(targetPath, ext); // Get the filename without extension
      const newFileName = (baseName + ext); // Add text before the extension
      targetPath = path.join(dir, newFileName);

      //fs.ensureDirSync(targetDir); // Ensure the directory exists
      fs.copySync(file, targetPath); // Copy file to the target path
    });
    console.log(`Copied ${files.length} ${ext} files to ${dest}`);
  }
  else
    console.warn(`Warning: The folder "${folderPath}" does not exist.`)
};

const copyGLBFiles = (src) => {
  console.log('Copying .glb files...');
  const tmpDir = path.join(src, "tmp")
  fs.ensureDirSync(tmpDir); // Ensure temp directory exists
  const gblFiles = getFilesRecursively(src, '.glb');
  gblFiles.forEach(file => {
    const fileName = path.basename(file);
    fs.copySync(file, path.join(tmpDir, fileName));
  });
  console.log(`Copied ${gblFiles.length} .glb files to ${tmpDir}`);
};

function handleCopy2D(data) {
  copyFiles(data.src, data.output, ".jpg")
}

function handleCopy3D(data) {
  //copyGLBFiles(data.src)
  copyFiles(data.src, data.output, ".glb")
  copyGLBFiles(data.output)
}



function handleCopyImages(data) {
  console.log('Moving screenshots to their corresponding folders...');
  console.log(data.generatedImagesPath)
  const images = getFilesRecursively(data.generatedImagesPath, '.png');

  images.forEach(image => {
    const fileName = path.basename(image, '.png');
    const match = fileName.match(/^(.*?_3D)/);
    const baseName = match ? match[1] : null; // Match everything up to and including "_3D"
    const targetDir = path.join(data.output, "3D", baseName)

    fs.ensureDirSync(targetDir);

    const targetPath = path.join(targetDir, path.basename(image));

    fs.copySync(image, targetPath);

    console.log(`Copied ${image} to ${targetPath}`);

  });

  console.log('All screenshots moved successfully!');
}



function handleGenerateExcel(data) {
  return generateExcel(data.output, data.museumData, data.excelTemplate, data.deliveryNumber, data.lastRowHeader2D, data.lastRowHeader3D)
}


function getFilesAndFoldersRecursively(dir) {
  let results = [dir]; // Include the directory itself
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesAndFoldersRecursively(fullPath)); // Recursively add subfolders/files
    } else {
      results.push(fullPath); // Add file
    }
  });

  return results;
}

function handleRemoveSpaces(data) {
  let items = getFilesAndFoldersRecursively(data.output);

  // Sort by path depth (deepest first) to rename files before their parent folders
  items.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);

  items.forEach(item => {
    const itemName = path.basename(item);
    const sanitizedItemName = itemName.replace(/\s+/g, '_'); // Replace spaces with underscores

    if (itemName !== sanitizedItemName) {
      const sanitizedItemPath = path.join(path.dirname(item), sanitizedItemName);
      fs.renameSync(item, sanitizedItemPath);
      console.log(`Renamed: ${item} to ${sanitizedItemPath}`);
    }
  });
}

async function handleCheckDuplicates(data) {
  return await checkDuplicatesExcel(data.folders, data.excel)
}

async function removeDuplicates(data) {
  return await removeDuplicatesExcel(data.folders, data.excel)
}

function handleVerifyFiles(data) {
  return checkFiles(data.source, data.cbFileName, data.cbParentFolder, data.parentLevel)  
}

module.exports = { handleCopy2D, handleCopy3D, handleCopyImages, handleGenerateExcel, handleCheckDuplicates, handleRemoveSpaces, removeDuplicates, handleVerifyFiles };



