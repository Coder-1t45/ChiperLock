// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const path = require('path')
const data = require('./data')

app.disableHardwareAcceleration();

let mainWindow;
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 450,
    width:1360,
    height:720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false//,
      //preload: path.join(__dirname, 'preload.js')
    },
    frame:false
  })

  //use later:
    //mainWindow.fullScreen: bool
    //mainWindow.minimize: func(): void
  //mainWindow.webContents.openDevTools();
  mainWindow.menuBarVisible = false;

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname,'src','index.html'))

  // Open the DevTools.
  mainWindow.on("closed", () =>{
    mainWindow = null;
  })
  
}

//initializations!:
data.loadSettings();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//handeling functions: project related
  //programs handeling
  
ipcMain.on("program/close",()=>{
  app.quit();
})
ipcMain.on("program/screen",()=>
  !mainWindow.isMaximized() ? mainWindow.maximize() : mainWindow.unmaximize()
);
ipcMain.on("program/minimize",()=>{
  mainWindow.minimize();
})

//developer handeling:
ipcMain.on("developer/tools", ()=>{
  mainWindow.webContents.openDevTools();
})

//data handeling
const sendResponse = (id, args)=> {
  mainWindow.webContents.send('response', {id:id, args:args})
} // 0 -> load, 1 -> save, 2 -> saveus, 3 -> changekeys
ipcMain.on('data/load', async (event, args)=>{
  var [_password] = args;
  var location = '';
  await dialog.showOpenDialog({
    defaultPath: app.getPath("documents"),
    title: 'Select the File to be uploaded', 
    buttonLabel: 'Upload', 
    filters: [ 
        { 
            name: 'ChiperLock Databases', 
            extensions: ['cld'] 
        }, ], 
    properties:['openFile']}).then( function (response){
    if (!response.canceled){
      location = response.filePaths[0];
    }
  });
 
  
  if (location.length > 0) {
    var c_loaded = await data.loadDatabase(location);
    if (c_loaded.password == _password) {
      sendResponse(0,[c_loaded, location]);
    }
    else {
      sendResponse(0, [null, ""]);
    }
  }
  else {
    sendResponse(0, [null, ""]);
  }
})

ipcMain.on('data/new',async (event, args)=>{
  var [_name, _location, _description, _password] = args;
  sendResponse(4, await data.createDatabase(_name, _location, _description, _password));
})

ipcMain.on('data/save', async (event, args)=>{
  var [location, _data] = args;
  var _result = await data.saveDatabase(location, _data);
  sendResponse(1, _result);
})

ipcMain.on('data/saveas',async (event, args)=>{
  var _data = args[0];
  var location = '';
  await dialog.showSaveDialog({
        title: 'Select the File to be saved', 
        defaultPath: app.getPath("documents"),
        buttonLabel: 'Save', 
        filters: [ 
          {
            name: 'ChiperLock Databases', 
            extensions: ['cld'] 
          }, ] }).then( function (response){
        if (!response.canceled){
          location = response.filePath;
        }
  });
  if (location.length > 0) {
    sendResponse(2,[await data.saveDatabase(location, _data), location]);
  }
  else {
    sendResponse(2, [null, ""]);
  }
})

ipcMain.on('data/changekeys', async (event, args) => {
  var _data = args[0]
  sendResponse(3, [true, await data.newKeys(_data)])
})
ipcMain.on('data/merge', async (event, args) => {
  var [c_database, _password] = args;
  var location = '';
  await dialog.showOpenDialog({
    defaultPath: app.getPath("documents"),
    title: 'Select the File to be uploaded', 
    buttonLabel: 'Upload', 
    filters: [ 
        { 
            name: 'ChiperLock Databases', 
            extensions: ['cld'] 
        }, ], 
    properties:['openFile']}).then( function (response){
    if (!response.canceled){
      location = response.filePaths[0];
    }
  });
 
  
  if (location.length > 0) {
    var c_loaded = await data.loadDatabase(location);
    if (c_loaded.password == _password) {
      sendResponse(5,[true, await data.mergeDatabases(c_database, c_loaded)]);
    }
    else {
      sendResponse(5, [false, null]);
    }
  }
  else {
    sendResponse(5, [false, null]);
  }
})


//EXCEL
ipcMain.on('excel/export',async (event, args)=>{
  //objects-to-csv
  //csvtojson - import
  var _data = args[0];
  var location = '';
  await dialog.showSaveDialog({
        title: 'Select the File to be saved', 
        defaultPath: app.getPath("documents"),
        buttonLabel: 'Save', 
        filters: [ 
          {
            name: 'Excel Sheets', 
            extensions: ['csv'] 
          }, ] }).then( function (response){
        if (!response.canceled){
          location = response.filePath;
        }
  });
  if (location.length > 0) {
    sendResponse(7,[await data.convertToExcel(_data, location)]);
  }
  else {
    sendResponse(7, [false]);
  }
})

ipcMain.on('excel/import',async (event, args)=>{
  //objects-to-csv
  //csvtojson - import
  var _data = args[0];
  var location = [];
  await dialog.showOpenDialog({
    defaultPath: app.getPath("documents"),
    title: 'Select the File to be uploaded', 
    buttonLabel: 'Upload', 
    filters: [ 
        { 
            name: 'Excel Sheets', 
            extensions: ['csv'] 
        }, ], 
    properties:['openFile']}).then( function (response){
    if (!response.canceled){
      location = response.filePaths;
    }
  });
 
  if (location.length > 0){
    var b = false
    location.forEach(async (l,id) => {
      if (l.length > 0) {
        var r = await data.importFromExcel(l, _data);
        if (r[0]){
          b = true;
          _data = r[1]
        }
        if (id == location.length-1){
          sendResponse(6, [b, _data]);
        }
      }
    })
    
  }
  else {
    sendResponse(6, [false, null]);
  }
})