import { app, Menu } from "electron";
import i18n from "./i18n";
import open from "open";

const createMenu = (win) => {
  const template = [
    {
      label: i18n.t("menu.file"),
      id: "menu_file",
      submenu: [
        {
          label: i18n.t("menu.new_session"),
          accelerator: "Ctrl+Shift+C",
          click: () => win.webContents.send("NEW_SESSION", true),
        },
        // {
        //   label: i18n.t("menu.new_session_test"),
        //   accelerator: "Ctrl+Shift+T",
        //   click: () => win.webContents.send("NEW_SESSION_TEST", true),
        // },
        // {
        //   label: i18n.t("menu.new_session_charter"),
        //   accelerator: "Ctrl+Shift+B",
        //   click: () => win.webContents.send("NEW_SESSION_CHARTER", true),
        // },
        {
          label: i18n.t("menu.open_session"),
          accelerator: "Ctrl+Shift+O",
          click: () => win.webContents.send("OPEN_SESSION", true),
        },
        { type: "separator" },
        {
          label: i18n.t("menu.save_session"),
          accelerator: "Alt+Ctrl+S",
          enabled: false,
          id: "menu_save_session",
          click: () => win.webContents.send("SAVE_SESSION", true),
        },
        // {
        //   label: i18n.t("menu.save_as_charter"),
        //   accelerator: "Ctrl+Shift+X",
        //   enabled: false,
        //   id: "menu_save_as_charter",
        //   click: () => win.webContents.send("SAVE_AS_CHARTER", true),
        // },
        {
          label: i18n.t("menu.reset_session"),
          enabled: false,
          id: "menu_reset_session",
          click: () => win.webContents.send("RESET_SESSION", true),
        },
        { type: "separator" },
        {
          label: i18n.tc("menu.app_setting", 1),
          click: () => win.webContents.send("APP_SETTING", true),
        },
        { type: "separator" },
        {
          label: i18n.tc("menu.take_survey", 1),
          click() {
            open("https://yatt.ai/yattie-survey/", (err) => {
              console.log(err);
            });
          },
        },
        { type: "separator" },
        {
          label: i18n.t("menu.exit"),
          accelerator: "Alt+F4",
          click: () => app.quit(),
        },
      ],
    },
    //{
    //  label: i18n.t("menu.edit"),
    //  submenu: [
    //    { label: i18n.t("menu.undo"), accelerator: "Ctrl+Z" },
    //    { label: i18n.t("menu.redo"), accelerator: "Ctrl+Shift+Z" },
    //    { type: "separator" },
    //    { label: i18n.t("menu.cut"), accelerator: "Ctrl+X" },
    //    { label: i18n.t("menu.copy"), accelerator: "Ctrl+C" },
    //    { label: i18n.t("menu.paste"), accelerator: "Ctrl+V" },
    //    { label: i18n.t("menu.select_all"), accelerator: "Ctrl+A" },
    //  ],
    //},
    {
      label: "Help",
      submenu: [
        {
          label: i18n.t("menu.online_doc"),
          click() {
            open("https://docs.yattie.ai/", (err) => {
              console.log(err);
            });
          },
        },
        {
          label: i18n.t("menu.get_support"),
          click() {
            open("https://github.com/dacoaster/yattie/issues/", (err) => {
              console.log(err);
            });
          },
        },
        //{
        //  label: i18n.t("menu.check_update"),
        //  click() {
        //    open('', (err) => {
        //      console.log(err);
        //    });
        //  }
        //},
        {
          label: i18n.t("menu.about"),
          click: () =>
            win.webContents.send(
              "ABOUT_DIALOG",
              process.env.npm_package_version
            ),
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

export default createMenu;
