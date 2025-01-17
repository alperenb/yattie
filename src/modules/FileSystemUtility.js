const { app, remote, dialog, shell, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");
const extract = require("extract-zip");
const dayjs = require("dayjs");
const uuidv4 = require("uuid");

const configDir = (app || remote.app).getPath("userData");

const databaseUtility = require("./DatabaseUtility");
const captureUtility = require("./CaptureUtility");
const { STATUSES } = require("./constants");

module.exports.exportItems = async (ids) => {
  const fileName =
    "yattie-export-" +
    dayjs().format("YYYY-MM-DD_HH-mm-ss-ms") +
    ".zip";

  const { filePath } = await dialog.showSaveDialog({
    title: "Save Items",
    defaultPath: fileName,
    filters: [{ name: "Zip archives only", extensions: ["zip"] }],
    properties: ["createDirectory", "showOverwriteConfirmation"],
  });

  if (!filePath) {
    return Promise.resolve({ status: "canceled" });
  }

  return new Promise((resolve) => {
    try {
      const zip = new AdmZip();

      ids.map((id) => {
        const item = databaseUtility.getItemById(id);

        if (item.filePath) {
          const sanitizedPath =
            item.filePath.substring(item.filePath.length - 1) !== "?" ? 
              item.filePath :
              item.filePath.substring(0, item.filePath.length - 1);
          zip.addLocalFile(sanitizedPath, item.fileType);
        }
      });

      zip.writeZip(filePath, (error) => {
        if (error) {
          throw error;
        }

        resolve({
          status: STATUSES.SUCCESS,
          message: "Project exported successfully",
          filePath,
        });
      });
    } catch (error) {
      resolve({ status: STATUSES.ERROR, message: error.message });
    }
  });
};

module.exports.createNewSession = async (state) => {
  state.id = uuidv4();
  const dataFolder = path.join(configDir, "sessions", state.id);
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
  }
  databaseUtility.createNewSession(state);
};

module.exports.saveSession = async (data) => {
  const notesFileName =
    "yattie-session-" +
    dayjs().format("YYYY-MM-DD_HH-mm-ss-ms") +
    "-notes.txt";
  const notes = databaseUtility.getNotes();
  let notesFilePath = "";
  if (notes.text !== "") {
    notesFilePath = captureUtility.saveNote({
      fileName: notesFileName,
      comment: notes,
    });
  }

  const fileName = "TestSession.test";
  const { filePath } = await dialog.showSaveDialog({
    title: "Save Session",
    defaultPath: fileName,
    filters: [{ name: "Test File", extensions: ["test"] }],
    properties: ["createDirectory", "showOverwriteConfirmation"],
  });

  if (!filePath) {
    return Promise.resolve({
      status: STATUSES.ERROR,
      message: "No path selected",
    });
  }

  return new Promise(function (resolve) {
    const items = databaseUtility.getItems();
    data.notes = notes;
    data.sessions = items;
    const metaPath = path.join(configDir, "metadata.txt");
    const jsonStr = JSON.stringify(data);
    const encodedStr = Buffer.from(jsonStr).toString("hex");

    fs.writeFile(metaPath, encodedStr, function (error) {
      if (error) {
        return resolve({
          status: STATUSES.ERROR,
          message: error,
        });
      }
      try {
        const zip = new AdmZip();
        zip.addLocalFile(metaPath);
        fs.unlinkSync(metaPath);
        items.map((item) => {
          if (item.filePath) {
            const sanitizedPath =
              item.filePath.substring(item.filePath.length - 1) !== "?" ? 
                item.filePath :
                item.filePath.substring(0, item.filePath.length - 1);
            zip.addLocalFile(sanitizedPath);
          }
        });

        if (notesFilePath) {
          zip.addLocalFile(notesFilePath);
        }

        zip.writeZip(filePath, (error) => {
          if (error) {
            return resolve({
              status: STATUSES.ERROR,
              message: error,
            });
          }

          return resolve({
            status: STATUSES.SUCCESS,
            message: "Session exported successfully",
          });
        });
      } catch (error) {
        return resolve({ status: STATUSES.ERROR, message: error.message });
      }
    });
  });
};

module.exports.openSession = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Test File", extensions: ["test"] }],
  });

  if (canceled) {
    return Promise.resolve({
      status: STATUSES.ERROR,
      message: "no file selected",
    });
  }

  const filePath = filePaths[0];
  const target = path.join(configDir, "sessions", "temp");
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  try {
    await extract(filePath, { dir: target });
    const metaPath = path.join(target, "metadata.txt");
    const encoded = fs.readFileSync(metaPath, "utf8");
    const state = JSON.parse(Buffer.from(encoded, "hex").toString());

    const id = state.id || uuidv4();
    const dataFolder = path.join(configDir, "sessions", id);
    if (fs.existsSync(dataFolder)) {
      fs.rmdirSync(dataFolder);
    }
    fs.renameSync(target, dataFolder);

    const sessionDataPath = path.join(dataFolder, "sessionData.json");
    databaseUtility.updateMetadata({ sessionDataPath });

    // TODO - Should we restore state here or in Main and Default?

    databaseUtility.updateItems(state.sessions);
    delete state.sessions;

    return Promise.resolve({
      status: STATUSES.SUCCESS,
      message: "Session extracted successfully",
      state: state,
    });
  } catch (err) {
    return Promise.resolve({
      status: STATUSES.ERROR,
      message: "Session extract failed",
    });
  }
};

module.exports.exportSession = async (params) => {
  debugger;
  const timestamp = dayjs().format("YYYY-MM-DD_HH-mm-ss-ms");
  const id = databaseUtility.getSessionID();
  const notesFileName = "yattie-session-" + timestamp + "-notes.txt";
  const notes = databaseUtility.getNotes();
  let notesFilePath = "";
  if (notes.text !== "") {
    notesFilePath = captureUtility.saveNote({
      fileName: notesFileName,
      comment: notes,
    });
  }

  // show save dialog
  const fileName = "yattie-session-" + timestamp + ".zip";
  const { filePath } = await dialog.showSaveDialog({
    title: "Save Items",
    defaultPath: fileName,
    filters: [{ name: "Zip archives only", extensions: ["zip"] }],
    properties: ["createDirectory", "showOverwriteConfirmation"],
  });

  if (!filePath) {
    return Promise.resolve({ status: "canceled" });
  }

  const pdfWin = new BrowserWindow({
    show: false,
    // eslint-disable-next-line no-undef
    icon: path.join(__static, "./logo.png"),
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      webSecurity: false,
      enableRemoteModule: true,
      preload: path.join(app.getAppPath(), "preload.js"),
    },
  });

  const url =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8080/#/print"
      : `file://${__dirname}/index.html#print`;

  pdfWin.loadURL(url);

  pdfWin.webContents.on("did-finish-load", () => {
    pdfWin.webContents.send("ACTIVE_PDF", params);
    pdfWin.webContents
      .printToPDF({})
      .then((data) => {
        const pdfName = "yattie-session-" + timestamp + "-report.pdf";
        const pdfPath = path.join(
          configDir,
          "sessions",
          id,
          pdfName
        );

        fs.writeFile(pdfPath, data, (error) => {
          if (error) {
            return Promise.resolve({
              status: STATUSES.ERROR,
              message: error,
            });
          }
          try {
            const zip = new AdmZip();

            const items = databaseUtility.getItems();

            items.map((item) => {
              if (item.filePath) {
                const sanitizedPath =
                  item.filePath.substring(item.filePath.length - 1) !== "?" ?
                    item.filePath :
                    item.filePath.substring(0, item.filePath.length - 1);
                zip.addLocalFile(sanitizedPath, item.fileType);
              }
            });

            if (notesFilePath) {
              zip.addLocalFile(notesFilePath, "text");
            }

            zip.addLocalFile(pdfPath);

            zip.writeZip(filePath, (error) => {
              if (error) {
                return Promise.resolve({
                  status: STATUSES.ERROR,
                  message: error,
                });
              }

              return Promise.resolve({
                status: STATUSES.SUCCESS,
                message: "Session Exported Successfully",
                filePath,
              });
            });
          } catch (error) {
            return Promise.resolve({
              status: STATUSES.ERROR,
              message: error,
            });
          }
        });
      })
      .catch((error) => {
        return Promise.resolve({
          status: STATUSES.ERROR,
          message: error,
        });
      });
  });
};

module.exports.openConfigFile = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Config File", extensions: ["json"] }],
  });

  if (canceled) {
    return Promise.resolve({
      status: STATUSES.ERROR,
      message: "no file selected",
    });
  }

  const filePath = filePaths[0];
  try {
    fs.readFile(filePath, "utf8", (err) => {
      if (err) {
        console.log("File read failed:", err);
        return;
      }
    });

    const metadata = databaseUtility.getMetadata();
    metadata.configPath = filePath;
    databaseUtility.updateMetadata(metadata);
    return Promise.resolve({
      status: STATUSES.SUCCESS,
      message: "Config file imported successfully",
    });
  } catch (err) {
    return Promise.resolve({
      status: STATUSES.ERROR,
      message: "Config file imported failed",
    });
  }
};

module.exports.openCredentialsFile = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Credentials File", extensions: ["json"] }],
  });

  if (canceled) {
    return Promise.resolve({
      status: STATUSES.ERROR,
      message: "no file selected",
    });
  }

  const filePath = filePaths[0];
  try {
    fs.readFile(filePath, "utf8", (err) => {
      if (err) {
        console.log("File read failed:", err);
        return;
      }
    });

    const metadata = databaseUtility.getMetadata();
    metadata.credentialsPath = filePath;
    databaseUtility.updateMetadata(metadata);
    return Promise.resolve({
      status: STATUSES.SUCCESS,
      message: "Credentials file imported successfully",
    });
  } catch (err) {
    return Promise.resolve({
      status: STATUSES.ERROR,
      message: "Credentials file imported failed",
    });
  }
};

module.exports.dragItem = (event, data) => {
  // eslint-disable-next-line no-undef
  const iconPath = path.join(__static, "./drag-drop.png");
  event.sender.startDrag({
    file: data.filePath,
    icon: iconPath,
  });
};

module.exports.openExternalLink = async (url = "") => {
  if (url === "") return;
  return shell.openExternal(url);
};
