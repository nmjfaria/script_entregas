const fs = require('fs');
const path = require('path');

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

function getParentFolder(filePath, level) {
    let folderPath = filePath;
    for (let i = 0; i < level; i++) {
        folderPath = path.dirname(folderPath);
    }
    return path.basename(folderPath);
}


function checkFiles(directory, cbFileName, cbParentFolder, level = 2) {
    const errors = []
    const files = findFiles(directory, ['.jpg', '.glb']);

    //Existem ficheiros?
    if (files.length === 0)
        errors.push("Sem ficheiros - Não foram encontrados ficheiros '.jpg' ou '.glb'")


    files.forEach(filePath => {
        const fileNameWithoutExt = path.parse(filePath).name;
        const targetFolder = getParentFolder(filePath, level);

        const fileNameSplitted = fileNameWithoutExt.split("_")
        const targetMuseumSplitted = targetFolder.split("_")

        //Verificar se nome esta no formato SIGLA_nINV_2/3D_XXX.ext
        if (cbFileName && fileNameSplitted.length < 4)
            errors.push(`Nome de ficheiro inválido - ${fileNameWithoutExt} na pasta ${getParentFolder(filePath, 1)}. Deve ser SIGLA_nINV_2/3D_XXX.ext`)


        const fileMuseum = fileNameSplitted[0]
        const fileInv = fileNameSplitted[1]

        const targetMuseum = targetMuseumSplitted[0]
        const targetInv = targetMuseumSplitted[1]

        //Verifica a combinação pasta/ficheiro, se os nomes batem certo
        if (cbParentFolder) {
            if (fileMuseum !== targetMuseum || fileInv !== targetInv) {
                errors.push(`Combinação Pasta/Ficheiro inválida - Ficheiro ${fileNameWithoutExt} não combina com a pasta ${targetFolder} `)
            }
        }
        //}

    });
    console.log("errors", errors)
    return errors
}

module.exports = { checkFiles };