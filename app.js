const express = require('express');
const path = require('path');
const { handleCopy2D, handleCopy3D, handleCopyImages, handleGenerateExcel, handleCheckDuplicates, handleRemoveSpaces, removeDuplicates, handleVerifyFiles } = require('./requestHandlers.js'); // Import the function


const app = express();
const PORT = 3000;


// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "www" directory
app.use(express.static(path.join(__dirname, 'www')));


// Copiar JPGs
app.post('/copy2D', (req, res) => {
  const data = req.body;
  const responseMessage = handleCopy2D(data);
  res.json({ message: responseMessage });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Copiar GLBs
app.post('/copy3D', (req, res) => {
  const data = req.body;

  const responseMessage = handleCopy3D(data);
  res.json({ message: responseMessage });
});

app.post('/copyImages', (req, res) => {
  const data = req.body;

  const responseMessage = handleCopyImages(data);
  res.json({ message: responseMessage });
});

app.post('/generateExcel', async (req, res) => {
  const data = req.body;

  const responseMessage = await handleGenerateExcel(data); // Call the auxiliary function
  console.log("respose", responseMessage)
  res.json({ message: responseMessage }); // Send the response
});

app.post('/checkDuplicates', async (req, res) => {
  const data = req.body; // Extract message from the request body

  const responseMessage = await handleCheckDuplicates(data); // Call the auxiliary function
  res.json({ message: responseMessage }); // Send the response
});

app.post('/removeDuplicates', async (req, res) => {
  console.log("__dirname", __dirname)
  const data = req.body; // Extract message from the request body

  const responseMessage = await removeDuplicates(data); // Call the auxiliary function
  res.json({ message: responseMessage }); // Send the response
});

app.post('/removeSpaces', async (req, res) => {
  const data = req.body; // Extract message from the request body

  const responseMessage = await handleRemoveSpaces(data); // Call the auxiliary function
  res.json({ message: responseMessage }); // Send the response
});

app.post('/verifyFiles', async (req, res) => {
  const data = req.body; // Extract message from the request body

  const responseMessage = await handleVerifyFiles(data); // Call the auxiliary function
  res.json({ message: responseMessage }); // Send the response
});





