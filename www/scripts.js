// Elements
const inputs = {
    sourceFolder: document.getElementById("sourceFolder"),
    outputFolder: document.getElementById("outputFolder"),
    sourceGeneratedPNGS: document.getElementById("sourceGeneratedPNGS"),
    sourceMuseumData: document.getElementById("sourceMuseumData"),
    sourceTemplate: document.getElementById("sourceTemplate"),
    deliveryNumber: document.getElementById("deliveryNumber"),
    lastRowHeader2D: document.getElementById("lastRowHeader2D"),
    lastRowHeader3D: document.getElementById("lastRowHeader3D"),
};

// Load saved values from localStorage on page load
window.onload = function () {
    for (let key in inputs) {
        const savedValue = localStorage.getItem(key);
        if (savedValue) {
            inputs[key].value = savedValue;
        }
    }
};

// Save input values to localStorage whenever they change
Object.keys(inputs).forEach(key => {
    inputs[key].addEventListener("input", () => {
        localStorage.setItem(key, inputs[key].value);
    });
});

function copyJPG() {
    const src = document.getElementById("sourceFolder").value;
    const output = document.getElementById("outputFolder").value;

    fetch('/copy2D', {
        method: 'POST', // Use POST to send data
        headers: {
            'Content-Type': 'application/json', // Inform server that JSON is being sent
        },
        body: JSON.stringify({ src, output }), // Send message in request body
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);

            }
            document.getElementById("messages").innerHTML = "2D copiadas!"
            return response.json();
        })
        .then(data => {
            console.log(data.message); // Log server response
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function copyGLB() {
    const src = document.getElementById("sourceFolder").value;
    const output = document.getElementById("outputFolder").value;

    fetch('/copy3D', {
        method: 'POST', // Use POST to send data
        headers: {
            'Content-Type': 'application/json', // Inform server that JSON is being sent
        },
        body: JSON.stringify({ src, output }), // Send message in request body
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            document.getElementById("messages").innerHTML = "3D copiado!"
            return response.json();
        })
        .then(data => {
            console.log(data.message); // Log server response
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function copyScreenshots() {
    const output = document.getElementById("outputFolder").value;
    const generatedImagesPath = document.getElementById("sourceGeneratedPNGS").value;

    fetch('/copyImages', {
        method: 'POST', // Use POST to send data
        headers: {
            'Content-Type': 'application/json', // Inform server that JSON is being sent
        },
        body: JSON.stringify({ output, generatedImagesPath }), // Send message in request body
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            document.getElementById("messages").innerHTML = "Screenshots copiadas!"
            return response.json();
        })
        .then(data => {
            console.log(data.message); // Log server response
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function generateExcel() {
    const output = document.getElementById("outputFolder").value;
    const museumData = document.getElementById("sourceMuseumData").value;
    const excelTemplate = document.getElementById("sourceTemplate").value;
    const deliveryNumber = document.getElementById("deliveryNumber").value;
    const lastRowHeader2D = document.getElementById("lastRowHeader2D").value;
    const lastRowHeader3D = document.getElementById("lastRowHeader3D").value;

    fetch('/generateExcel', {
        method: 'POST', // Use POST to send data
        headers: {
            'Content-Type': 'application/json', // Inform server that JSON is being sent
        },
        body: JSON.stringify({ output, museumData, excelTemplate, deliveryNumber, lastRowHeader2D, lastRowHeader3D }), // Send message in request body
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return response.json();
        })
        .then(data => {
            console.log("message", data.message)
            if (data.message.length === 0)
                document.getElementById("messages").innerHTML = "Excel gerado sem erros."
            else
                document.getElementById("messages").innerHTML = "<b>Erros ao gerar excel:</b><br> <br>"+data.message.join("<br>")

        })
        .catch(error => {
            console.error('Error:', error);
        });
}



function checkDuplicates() {
    const folders = document.getElementById("sourceFolder").value;
    const excel = document.getElementById("sourceTemplate").value;
    console.log("entrei")
    fetch('/checkDuplicates', {
        method: 'POST', // Use POST to send data
        headers: {
            'Content-Type': 'application/json', // Inform server that JSON is being sent
        },
        body: JSON.stringify({ folders, excel }), // Send message in request body
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data.message)) {
                document.getElementById("removeDuplicates").style.display = "inline"
                document.getElementById("messages").innerHTML = "<b>DUPLICADOS:</b><br>" + data.message.join("<br>")
            }
            else
                document.getElementById("messages").innerHTML = data.message

        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function removeDuplicates() {
    const folders = document.getElementById("sourceFolder").value;
    const excel = document.getElementById("sourceTemplate").value;

    fetch('/removeDuplicates', {
        method: 'POST', // Use POST to send data
        headers: {
            'Content-Type': 'application/json', // Inform server that JSON is being sent
        },
        body: JSON.stringify({ folders, excel }), // Send message in request body
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("removeDuplicates").style.display = "none"
            document.getElementById("messages").innerHTML = data.message
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function removeSpaces() {
    const output = document.getElementById("outputFolder").value;

    fetch('/removeSpaces', {
        method: 'POST', // Use POST to send data
        headers: {
            'Content-Type': 'application/json', // Inform server that JSON is being sent
        },
        body: JSON.stringify({ output }), // Send message in request body
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            //document.getElementById("duplicateds").innerHTML = data.message
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function verifyFiles() {
    console.log("TESTE")
    const source = document.getElementById("sourceFolder").value;
    const cbFileName = document.getElementById("checkFileName").checked;
    const cbParentFolder = document.getElementById("checkParentFolder").checked;
    const parentLevel = document.getElementById("parentLevel").value

    if (cbFileName || cbParentFolder) {
        fetch('/verifyFiles', {
            method: 'POST', // Use POST to send data
            headers: {
                'Content-Type': 'application/json', // Inform server that JSON is being sent
            },
            body: JSON.stringify({ source, cbFileName, cbParentFolder, parentLevel }), // Send message in request body
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("dataa", data)
                if (data.message.length === 0)
                    document.getElementById("messages").innerHTML = "Sem erros.";
                else
                    document.getElementById("messages").innerHTML = data.message.join("<br>");
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    else
        document.getElementById("messages").innerHTML = "Selecionar uma das checkboxes.";
}


