if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue, shared) {
  "use strict";
  const ON_LOAD = "onLoad";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom) {
    return shared.isString(component) ? easycom : component;
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  var isVue2 = false;
  function set(target, key, val) {
    if (Array.isArray(target)) {
      target.length = Math.max(target.length, key);
      target.splice(key, 1, val);
      return val;
    }
    target[key] = val;
    return val;
  }
  function del(target, key) {
    if (Array.isArray(target)) {
      target.splice(key, 1);
      return;
    }
    delete target[key];
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  let supported;
  let perf;
  function isPerformanceSupported() {
    var _a;
    if (supported !== void 0) {
      return supported;
    }
    if (typeof window !== "undefined" && window.performance) {
      supported = true;
      perf = window.performance;
    } else if (typeof global !== "undefined" && ((_a = global.perf_hooks) === null || _a === void 0 ? void 0 : _a.performance)) {
      supported = true;
      perf = global.perf_hooks.performance;
    } else {
      supported = false;
    }
    return supported;
  }
  function now() {
    return isPerformanceSupported() ? perf.now() : Date.now();
  }
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = Object.assign({}, defaultSettings);
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        },
        now() {
          return now();
        }
      };
      if (hook) {
        hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
          if (pluginId === this.plugin.id) {
            this.fallbacks.setSettings(value);
          }
        });
      }
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const descriptor = pluginDescriptor;
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && descriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(descriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor: descriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
    * pinia v2.0.33
    * (c) 2023 Eduardo San Martin Morote
    * @license MIT
    */
  let activePinia;
  const setActivePinia = (pinia) => activePinia = pinia;
  const piniaSymbol = Symbol("pinia");
  function isPlainObject$1(o) {
    return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
  }
  var MutationType;
  (function(MutationType2) {
    MutationType2["direct"] = "direct";
    MutationType2["patchObject"] = "patch object";
    MutationType2["patchFunction"] = "patch function";
  })(MutationType || (MutationType = {}));
  const IS_CLIENT = typeof window !== "undefined";
  const USE_DEVTOOLS = IS_CLIENT;
  const _global = /* @__PURE__ */ (() => typeof window === "object" && window.window === window ? window : typeof self === "object" && self.self === self ? self : typeof global === "object" && global.global === global ? global : typeof globalThis === "object" ? globalThis : { HTMLElement: null })();
  function bom(blob, { autoBom = false } = {}) {
    if (autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
      return new Blob([String.fromCharCode(65279), blob], { type: blob.type });
    }
    return blob;
  }
  function download(url2, name, opts) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url2);
    xhr.responseType = "blob";
    xhr.onload = function() {
      saveAs(xhr.response, name, opts);
    };
    xhr.onerror = function() {
      console.error("could not download file");
    };
    xhr.send();
  }
  function corsEnabled(url2) {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", url2, false);
    try {
      xhr.send();
    } catch (e) {
    }
    return xhr.status >= 200 && xhr.status <= 299;
  }
  function click(node) {
    try {
      node.dispatchEvent(new MouseEvent("click"));
    } catch (e) {
      const evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
      node.dispatchEvent(evt);
    }
  }
  const _navigator = typeof navigator === "object" ? navigator : { userAgent: "" };
  const isMacOSWebView = /* @__PURE__ */ (() => /Macintosh/.test(_navigator.userAgent) && /AppleWebKit/.test(_navigator.userAgent) && !/Safari/.test(_navigator.userAgent))();
  const saveAs = !IS_CLIENT ? () => {
  } : (
    // Use download attribute first if possible (#193 Lumia mobile) unless this is a macOS WebView or mini program
    typeof HTMLAnchorElement !== "undefined" && "download" in HTMLAnchorElement.prototype && !isMacOSWebView ? downloadSaveAs : (
      // Use msSaveOrOpenBlob as a second approach
      "msSaveOrOpenBlob" in _navigator ? msSaveAs : (
        // Fallback to using FileReader and a popup
        fileSaverSaveAs
      )
    )
  );
  function downloadSaveAs(blob, name = "download", opts) {
    const a = document.createElement("a");
    a.download = name;
    a.rel = "noopener";
    if (typeof blob === "string") {
      a.href = blob;
      if (a.origin !== location.origin) {
        if (corsEnabled(a.href)) {
          download(blob, name, opts);
        } else {
          a.target = "_blank";
          click(a);
        }
      } else {
        click(a);
      }
    } else {
      a.href = URL.createObjectURL(blob);
      setTimeout(function() {
        URL.revokeObjectURL(a.href);
      }, 4e4);
      setTimeout(function() {
        click(a);
      }, 0);
    }
  }
  function msSaveAs(blob, name = "download", opts) {
    if (typeof blob === "string") {
      if (corsEnabled(blob)) {
        download(blob, name, opts);
      } else {
        const a = document.createElement("a");
        a.href = blob;
        a.target = "_blank";
        setTimeout(function() {
          click(a);
        });
      }
    } else {
      navigator.msSaveOrOpenBlob(bom(blob, opts), name);
    }
  }
  function fileSaverSaveAs(blob, name, opts, popup) {
    popup = popup || open("", "_blank");
    if (popup) {
      popup.document.title = popup.document.body.innerText = "downloading...";
    }
    if (typeof blob === "string")
      return download(blob, name, opts);
    const force = blob.type === "application/octet-stream";
    const isSafari = /constructor/i.test(String(_global.HTMLElement)) || "safari" in _global;
    const isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);
    if ((isChromeIOS || force && isSafari || isMacOSWebView) && typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onloadend = function() {
        let url2 = reader.result;
        if (typeof url2 !== "string") {
          popup = null;
          throw new Error("Wrong reader.result type");
        }
        url2 = isChromeIOS ? url2 : url2.replace(/^data:[^;]*;/, "data:attachment/file;");
        if (popup) {
          popup.location.href = url2;
        } else {
          location.assign(url2);
        }
        popup = null;
      };
      reader.readAsDataURL(blob);
    } else {
      const url2 = URL.createObjectURL(blob);
      if (popup)
        popup.location.assign(url2);
      else
        location.href = url2;
      popup = null;
      setTimeout(function() {
        URL.revokeObjectURL(url2);
      }, 4e4);
    }
  }
  function toastMessage(message, type) {
    const piniaMessage = "🍍 " + message;
    if (typeof __VUE_DEVTOOLS_TOAST__ === "function") {
      __VUE_DEVTOOLS_TOAST__(piniaMessage, type);
    } else if (type === "error") {
      console.error(piniaMessage);
    } else if (type === "warn") {
      console.warn(piniaMessage);
    } else {
      console.log(piniaMessage);
    }
  }
  function isPinia(o) {
    return "_a" in o && "install" in o;
  }
  function checkClipboardAccess() {
    if (!("clipboard" in navigator)) {
      toastMessage(`Your browser doesn't support the Clipboard API`, "error");
      return true;
    }
  }
  function checkNotFocusedError(error2) {
    if (error2 instanceof Error && error2.message.toLowerCase().includes("document is not focused")) {
      toastMessage('You need to activate the "Emulate a focused page" setting in the "Rendering" panel of devtools.', "warn");
      return true;
    }
    return false;
  }
  async function actionGlobalCopyState(pinia) {
    if (checkClipboardAccess())
      return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(pinia.state.value));
      toastMessage("Global state copied to clipboard.");
    } catch (error2) {
      if (checkNotFocusedError(error2))
        return;
      toastMessage(`Failed to serialize the state. Check the console for more details.`, "error");
      console.error(error2);
    }
  }
  async function actionGlobalPasteState(pinia) {
    if (checkClipboardAccess())
      return;
    try {
      pinia.state.value = JSON.parse(await navigator.clipboard.readText());
      toastMessage("Global state pasted from clipboard.");
    } catch (error2) {
      if (checkNotFocusedError(error2))
        return;
      toastMessage(`Failed to deserialize the state from clipboard. Check the console for more details.`, "error");
      console.error(error2);
    }
  }
  async function actionGlobalSaveState(pinia) {
    try {
      saveAs(new Blob([JSON.stringify(pinia.state.value)], {
        type: "text/plain;charset=utf-8"
      }), "pinia-state.json");
    } catch (error2) {
      toastMessage(`Failed to export the state as JSON. Check the console for more details.`, "error");
      console.error(error2);
    }
  }
  let fileInput;
  function getFileOpener() {
    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
    }
    function openFile() {
      return new Promise((resolve, reject) => {
        fileInput.onchange = async () => {
          const files = fileInput.files;
          if (!files)
            return resolve(null);
          const file = files.item(0);
          if (!file)
            return resolve(null);
          return resolve({ text: await file.text(), file });
        };
        fileInput.oncancel = () => resolve(null);
        fileInput.onerror = reject;
        fileInput.click();
      });
    }
    return openFile;
  }
  async function actionGlobalOpenStateFile(pinia) {
    try {
      const open2 = await getFileOpener();
      const result = await open2();
      if (!result)
        return;
      const { text, file } = result;
      pinia.state.value = JSON.parse(text);
      toastMessage(`Global state imported from "${file.name}".`);
    } catch (error2) {
      toastMessage(`Failed to export the state as JSON. Check the console for more details.`, "error");
      console.error(error2);
    }
  }
  function formatDisplay(display) {
    return {
      _custom: {
        display
      }
    };
  }
  const PINIA_ROOT_LABEL = "🍍 Pinia (root)";
  const PINIA_ROOT_ID = "_root";
  function formatStoreForInspectorTree(store) {
    return isPinia(store) ? {
      id: PINIA_ROOT_ID,
      label: PINIA_ROOT_LABEL
    } : {
      id: store.$id,
      label: store.$id
    };
  }
  function formatStoreForInspectorState(store) {
    if (isPinia(store)) {
      const storeNames = Array.from(store._s.keys());
      const storeMap = store._s;
      const state2 = {
        state: storeNames.map((storeId) => ({
          editable: true,
          key: storeId,
          value: store.state.value[storeId]
        })),
        getters: storeNames.filter((id) => storeMap.get(id)._getters).map((id) => {
          const store2 = storeMap.get(id);
          return {
            editable: false,
            key: id,
            value: store2._getters.reduce((getters, key) => {
              getters[key] = store2[key];
              return getters;
            }, {})
          };
        })
      };
      return state2;
    }
    const state = {
      state: Object.keys(store.$state).map((key) => ({
        editable: true,
        key,
        value: store.$state[key]
      }))
    };
    if (store._getters && store._getters.length) {
      state.getters = store._getters.map((getterName) => ({
        editable: false,
        key: getterName,
        value: store[getterName]
      }));
    }
    if (store._customProperties.size) {
      state.customProperties = Array.from(store._customProperties).map((key) => ({
        editable: true,
        key,
        value: store[key]
      }));
    }
    return state;
  }
  function formatEventData(events) {
    if (!events)
      return {};
    if (Array.isArray(events)) {
      return events.reduce((data, event) => {
        data.keys.push(event.key);
        data.operations.push(event.type);
        data.oldValue[event.key] = event.oldValue;
        data.newValue[event.key] = event.newValue;
        return data;
      }, {
        oldValue: {},
        keys: [],
        operations: [],
        newValue: {}
      });
    } else {
      return {
        operation: formatDisplay(events.type),
        key: formatDisplay(events.key),
        oldValue: events.oldValue,
        newValue: events.newValue
      };
    }
  }
  function formatMutationType(type) {
    switch (type) {
      case MutationType.direct:
        return "mutation";
      case MutationType.patchFunction:
        return "$patch";
      case MutationType.patchObject:
        return "$patch";
      default:
        return "unknown";
    }
  }
  let isTimelineActive = true;
  const componentStateTypes = [];
  const MUTATIONS_LAYER_ID = "pinia:mutations";
  const INSPECTOR_ID = "pinia";
  const { assign: assign$1 } = Object;
  const getStoreType = (id) => "🍍 " + id;
  function registerPiniaDevtools(app, pinia) {
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app
    }, (api) => {
      if (typeof api.now !== "function") {
        toastMessage("You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html.");
      }
      api.addTimelineLayer({
        id: MUTATIONS_LAYER_ID,
        label: `Pinia 🍍`,
        color: 15064968
      });
      api.addInspector({
        id: INSPECTOR_ID,
        label: "Pinia 🍍",
        icon: "storage",
        treeFilterPlaceholder: "Search stores",
        actions: [
          {
            icon: "content_copy",
            action: () => {
              actionGlobalCopyState(pinia);
            },
            tooltip: "Serialize and copy the state"
          },
          {
            icon: "content_paste",
            action: async () => {
              await actionGlobalPasteState(pinia);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Replace the state with the content of your clipboard"
          },
          {
            icon: "save",
            action: () => {
              actionGlobalSaveState(pinia);
            },
            tooltip: "Save the state as a JSON file"
          },
          {
            icon: "folder_open",
            action: async () => {
              await actionGlobalOpenStateFile(pinia);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Import the state from a JSON file"
          }
        ],
        nodeActions: [
          {
            icon: "restore",
            tooltip: "Reset the state (option store only)",
            action: (nodeId) => {
              const store = pinia._s.get(nodeId);
              if (!store) {
                toastMessage(`Cannot reset "${nodeId}" store because it wasn't found.`, "warn");
              } else if (!store._isOptionsAPI) {
                toastMessage(`Cannot reset "${nodeId}" store because it's a setup store.`, "warn");
              } else {
                store.$reset();
                toastMessage(`Store "${nodeId}" reset.`);
              }
            }
          }
        ]
      });
      api.on.inspectComponent((payload, ctx) => {
        const proxy = payload.componentInstance && payload.componentInstance.proxy;
        if (proxy && proxy._pStores) {
          const piniaStores = payload.componentInstance.proxy._pStores;
          Object.values(piniaStores).forEach((store) => {
            payload.instanceData.state.push({
              type: getStoreType(store.$id),
              key: "state",
              editable: true,
              value: store._isOptionsAPI ? {
                _custom: {
                  value: vue.toRaw(store.$state),
                  actions: [
                    {
                      icon: "restore",
                      tooltip: "Reset the state of this store",
                      action: () => store.$reset()
                    }
                  ]
                }
              } : (
                // NOTE: workaround to unwrap transferred refs
                Object.keys(store.$state).reduce((state, key) => {
                  state[key] = store.$state[key];
                  return state;
                }, {})
              )
            });
            if (store._getters && store._getters.length) {
              payload.instanceData.state.push({
                type: getStoreType(store.$id),
                key: "getters",
                editable: false,
                value: store._getters.reduce((getters, key) => {
                  try {
                    getters[key] = store[key];
                  } catch (error2) {
                    getters[key] = error2;
                  }
                  return getters;
                }, {})
              });
            }
          });
        }
      });
      api.on.getInspectorTree((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          let stores = [pinia];
          stores = stores.concat(Array.from(pinia._s.values()));
          payload.rootNodes = (payload.filter ? stores.filter((store) => "$id" in store ? store.$id.toLowerCase().includes(payload.filter.toLowerCase()) : PINIA_ROOT_LABEL.toLowerCase().includes(payload.filter.toLowerCase())) : stores).map(formatStoreForInspectorTree);
        }
      });
      api.on.getInspectorState((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
          if (!inspectedStore) {
            return;
          }
          if (inspectedStore) {
            payload.state = formatStoreForInspectorState(inspectedStore);
          }
        }
      });
      api.on.editInspectorState((payload, ctx) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia : pinia._s.get(payload.nodeId);
          if (!inspectedStore) {
            return toastMessage(`store "${payload.nodeId}" not found`, "error");
          }
          const { path } = payload;
          if (!isPinia(inspectedStore)) {
            if (path.length !== 1 || !inspectedStore._customProperties.has(path[0]) || path[0] in inspectedStore.$state) {
              path.unshift("$state");
            }
          } else {
            path.unshift("state");
          }
          isTimelineActive = false;
          payload.set(inspectedStore, path, payload.state.value);
          isTimelineActive = true;
        }
      });
      api.on.editComponentState((payload) => {
        if (payload.type.startsWith("🍍")) {
          const storeId = payload.type.replace(/^🍍\s*/, "");
          const store = pinia._s.get(storeId);
          if (!store) {
            return toastMessage(`store "${storeId}" not found`, "error");
          }
          const { path } = payload;
          if (path[0] !== "state") {
            return toastMessage(`Invalid path for store "${storeId}":
${path}
Only state can be modified.`);
          }
          path[0] = "$state";
          isTimelineActive = false;
          payload.set(store, path, payload.state.value);
          isTimelineActive = true;
        }
      });
    });
  }
  function addStoreToDevtools(app, store) {
    if (!componentStateTypes.includes(getStoreType(store.$id))) {
      componentStateTypes.push(getStoreType(store.$id));
    }
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app,
      settings: {
        logStoreChanges: {
          label: "Notify about new/deleted stores",
          type: "boolean",
          defaultValue: true
        }
        // useEmojis: {
        //   label: 'Use emojis in messages ⚡️',
        //   type: 'boolean',
        //   defaultValue: true,
        // },
      }
    }, (api) => {
      const now2 = typeof api.now === "function" ? api.now.bind(api) : Date.now;
      store.$onAction(({ after, onError, name, args }) => {
        const groupId = runningActionId++;
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🛫 " + name,
            subtitle: "start",
            data: {
              store: formatDisplay(store.$id),
              action: formatDisplay(name),
              args
            },
            groupId
          }
        });
        after((result) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              title: "🛬 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                result
              },
              groupId
            }
          });
        });
        onError((error2) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              logType: "error",
              title: "💥 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                error: error2
              },
              groupId
            }
          });
        });
      }, true);
      store._customProperties.forEach((name) => {
        vue.watch(() => vue.unref(store[name]), (newValue, oldValue) => {
          api.notifyComponentUpdate();
          api.sendInspectorState(INSPECTOR_ID);
          if (isTimelineActive) {
            api.addTimelineEvent({
              layerId: MUTATIONS_LAYER_ID,
              event: {
                time: now2(),
                title: "Change",
                subtitle: name,
                data: {
                  newValue,
                  oldValue
                },
                groupId: activeAction
              }
            });
          }
        }, { deep: true });
      });
      store.$subscribe(({ events, type }, state) => {
        api.notifyComponentUpdate();
        api.sendInspectorState(INSPECTOR_ID);
        if (!isTimelineActive)
          return;
        const eventData = {
          time: now2(),
          title: formatMutationType(type),
          data: assign$1({ store: formatDisplay(store.$id) }, formatEventData(events)),
          groupId: activeAction
        };
        activeAction = void 0;
        if (type === MutationType.patchFunction) {
          eventData.subtitle = "⤵️";
        } else if (type === MutationType.patchObject) {
          eventData.subtitle = "🧩";
        } else if (events && !Array.isArray(events)) {
          eventData.subtitle = events.type;
        }
        if (events) {
          eventData.data["rawEvent(s)"] = {
            _custom: {
              display: "DebuggerEvent",
              type: "object",
              tooltip: "raw DebuggerEvent[]",
              value: events
            }
          };
        }
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: eventData
        });
      }, { detached: true, flush: "sync" });
      const hotUpdate = store._hotUpdate;
      store._hotUpdate = vue.markRaw((newStore) => {
        hotUpdate(newStore);
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🔥 " + store.$id,
            subtitle: "HMR update",
            data: {
              store: formatDisplay(store.$id),
              info: formatDisplay(`HMR update`)
            }
          }
        });
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
      });
      const { $dispose } = store;
      store.$dispose = () => {
        $dispose();
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
        api.getSettings().logStoreChanges && toastMessage(`Disposed "${store.$id}" store 🗑`);
      };
      api.notifyComponentUpdate();
      api.sendInspectorTree(INSPECTOR_ID);
      api.sendInspectorState(INSPECTOR_ID);
      api.getSettings().logStoreChanges && toastMessage(`"${store.$id}" store installed 🆕`);
    });
  }
  let runningActionId = 0;
  let activeAction;
  function patchActionForGrouping(store, actionNames) {
    const actions = actionNames.reduce((storeActions, actionName) => {
      storeActions[actionName] = vue.toRaw(store)[actionName];
      return storeActions;
    }, {});
    for (const actionName in actions) {
      store[actionName] = function() {
        const _actionId = runningActionId;
        const trackedStore = new Proxy(store, {
          get(...args) {
            activeAction = _actionId;
            return Reflect.get(...args);
          },
          set(...args) {
            activeAction = _actionId;
            return Reflect.set(...args);
          }
        });
        return actions[actionName].apply(trackedStore, arguments);
      };
    }
  }
  function devtoolsPlugin({ app, store, options }) {
    if (store.$id.startsWith("__hot:")) {
      return;
    }
    if (options.state) {
      store._isOptionsAPI = true;
    }
    if (typeof options.state === "function") {
      patchActionForGrouping(
        // @ts-expect-error: can cast the store...
        store,
        Object.keys(options.actions)
      );
      const originalHotUpdate = store._hotUpdate;
      vue.toRaw(store)._hotUpdate = function(newStore) {
        originalHotUpdate.apply(this, arguments);
        patchActionForGrouping(store, Object.keys(newStore._hmrPayload.actions));
      };
    }
    addStoreToDevtools(
      app,
      // FIXME: is there a way to allow the assignment from Store<Id, S, G, A> to StoreGeneric?
      store
    );
  }
  function createPinia() {
    const scope = vue.effectScope(true);
    const state = scope.run(() => vue.ref({}));
    let _p = [];
    let toBeInstalled = [];
    const pinia = vue.markRaw({
      install(app) {
        setActivePinia(pinia);
        {
          pinia._a = app;
          app.provide(piniaSymbol, pinia);
          app.config.globalProperties.$pinia = pinia;
          if (USE_DEVTOOLS) {
            registerPiniaDevtools(app, pinia);
          }
          toBeInstalled.forEach((plugin) => _p.push(plugin));
          toBeInstalled = [];
        }
      },
      use(plugin) {
        if (!this._a && !isVue2) {
          toBeInstalled.push(plugin);
        } else {
          _p.push(plugin);
        }
        return this;
      },
      _p,
      // it's actually undefined here
      // @ts-expect-error
      _a: null,
      _e: scope,
      _s: /* @__PURE__ */ new Map(),
      state
    });
    if (USE_DEVTOOLS && typeof Proxy !== "undefined") {
      pinia.use(devtoolsPlugin);
    }
    return pinia;
  }
  function patchObject(newState, oldState) {
    for (const key in oldState) {
      const subPatch = oldState[key];
      if (!(key in newState)) {
        continue;
      }
      const targetValue = newState[key];
      if (isPlainObject$1(targetValue) && isPlainObject$1(subPatch) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        newState[key] = patchObject(targetValue, subPatch);
      } else {
        {
          newState[key] = subPatch;
        }
      }
    }
    return newState;
  }
  const noop = () => {
  };
  function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
    subscriptions.push(callback);
    const removeSubscription = () => {
      const idx = subscriptions.indexOf(callback);
      if (idx > -1) {
        subscriptions.splice(idx, 1);
        onCleanup();
      }
    };
    if (!detached && vue.getCurrentScope()) {
      vue.onScopeDispose(removeSubscription);
    }
    return removeSubscription;
  }
  function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.slice().forEach((callback) => {
      callback(...args);
    });
  }
  function mergeReactiveObjects(target, patchToApply) {
    if (target instanceof Map && patchToApply instanceof Map) {
      patchToApply.forEach((value, key) => target.set(key, value));
    }
    if (target instanceof Set && patchToApply instanceof Set) {
      patchToApply.forEach(target.add, target);
    }
    for (const key in patchToApply) {
      if (!patchToApply.hasOwnProperty(key))
        continue;
      const subPatch = patchToApply[key];
      const targetValue = target[key];
      if (isPlainObject$1(targetValue) && isPlainObject$1(subPatch) && target.hasOwnProperty(key) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        target[key] = mergeReactiveObjects(targetValue, subPatch);
      } else {
        target[key] = subPatch;
      }
    }
    return target;
  }
  const skipHydrateSymbol = Symbol("pinia:skipHydration");
  function shouldHydrate(obj) {
    return !isPlainObject$1(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
  }
  const { assign } = Object;
  function isComputed(o) {
    return !!(vue.isRef(o) && o.effect);
  }
  function createOptionsStore(id, options, pinia, hot) {
    const { state, actions, getters } = options;
    const initialState = pinia.state.value[id];
    let store;
    function setup() {
      if (!initialState && !hot) {
        {
          pinia.state.value[id] = state ? state() : {};
        }
      }
      const localState = hot ? (
        // use ref() to unwrap refs inside state TODO: check if this is still necessary
        vue.toRefs(vue.ref(state ? state() : {}).value)
      ) : vue.toRefs(pinia.state.value[id]);
      return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
        if (name in localState) {
          console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`);
        }
        computedGetters[name] = vue.markRaw(vue.computed(() => {
          setActivePinia(pinia);
          const store2 = pinia._s.get(id);
          return getters[name].call(store2, store2);
        }));
        return computedGetters;
      }, {}));
    }
    store = createSetupStore(id, setup, options, pinia, hot, true);
    return store;
  }
  function createSetupStore($id, setup, options = {}, pinia, hot, isOptionsStore) {
    let scope;
    const optionsForPlugin = assign({ actions: {} }, options);
    if (!pinia._e.active) {
      throw new Error("Pinia destroyed");
    }
    const $subscribeOptions = {
      deep: true
      // flush: 'post',
    };
    {
      $subscribeOptions.onTrigger = (event) => {
        if (isListening) {
          debuggerEvents = event;
        } else if (isListening == false && !store._hotUpdating) {
          if (Array.isArray(debuggerEvents)) {
            debuggerEvents.push(event);
          } else {
            console.error("🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.");
          }
        }
      };
    }
    let isListening;
    let isSyncListening;
    let subscriptions = vue.markRaw([]);
    let actionSubscriptions = vue.markRaw([]);
    let debuggerEvents;
    const initialState = pinia.state.value[$id];
    if (!isOptionsStore && !initialState && !hot) {
      {
        pinia.state.value[$id] = {};
      }
    }
    const hotState = vue.ref({});
    let activeListener;
    function $patch(partialStateOrMutator) {
      let subscriptionMutation;
      isListening = isSyncListening = false;
      {
        debuggerEvents = [];
      }
      if (typeof partialStateOrMutator === "function") {
        partialStateOrMutator(pinia.state.value[$id]);
        subscriptionMutation = {
          type: MutationType.patchFunction,
          storeId: $id,
          events: debuggerEvents
        };
      } else {
        mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator);
        subscriptionMutation = {
          type: MutationType.patchObject,
          payload: partialStateOrMutator,
          storeId: $id,
          events: debuggerEvents
        };
      }
      const myListenerId = activeListener = Symbol();
      vue.nextTick().then(() => {
        if (activeListener === myListenerId) {
          isListening = true;
        }
      });
      isSyncListening = true;
      triggerSubscriptions(subscriptions, subscriptionMutation, pinia.state.value[$id]);
    }
    const $reset = isOptionsStore ? function $reset2() {
      const { state } = options;
      const newState = state ? state() : {};
      this.$patch(($state) => {
        assign($state, newState);
      });
    } : (
      /* istanbul ignore next */
      () => {
        throw new Error(`🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`);
      }
    );
    function $dispose() {
      scope.stop();
      subscriptions = [];
      actionSubscriptions = [];
      pinia._s.delete($id);
    }
    function wrapAction(name, action) {
      return function() {
        setActivePinia(pinia);
        const args = Array.from(arguments);
        const afterCallbackList = [];
        const onErrorCallbackList = [];
        function after(callback) {
          afterCallbackList.push(callback);
        }
        function onError(callback) {
          onErrorCallbackList.push(callback);
        }
        triggerSubscriptions(actionSubscriptions, {
          args,
          name,
          store,
          after,
          onError
        });
        let ret;
        try {
          ret = action.apply(this && this.$id === $id ? this : store, args);
        } catch (error2) {
          triggerSubscriptions(onErrorCallbackList, error2);
          throw error2;
        }
        if (ret instanceof Promise) {
          return ret.then((value) => {
            triggerSubscriptions(afterCallbackList, value);
            return value;
          }).catch((error2) => {
            triggerSubscriptions(onErrorCallbackList, error2);
            return Promise.reject(error2);
          });
        }
        triggerSubscriptions(afterCallbackList, ret);
        return ret;
      };
    }
    const _hmrPayload = /* @__PURE__ */ vue.markRaw({
      actions: {},
      getters: {},
      state: [],
      hotState
    });
    const partialStore = {
      _p: pinia,
      // _s: scope,
      $id,
      $onAction: addSubscription.bind(null, actionSubscriptions),
      $patch,
      $reset,
      $subscribe(callback, options2 = {}) {
        const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
        const stopWatcher = scope.run(() => vue.watch(() => pinia.state.value[$id], (state) => {
          if (options2.flush === "sync" ? isSyncListening : isListening) {
            callback({
              storeId: $id,
              type: MutationType.direct,
              events: debuggerEvents
            }, state);
          }
        }, assign({}, $subscribeOptions, options2)));
        return removeSubscription;
      },
      $dispose
    };
    const store = vue.reactive(
      assign(
        {
          _hmrPayload,
          _customProperties: vue.markRaw(/* @__PURE__ */ new Set())
          // devtools custom properties
        },
        partialStore
        // must be added later
        // setupStore
      )
    );
    pinia._s.set($id, store);
    const setupStore = pinia._e.run(() => {
      scope = vue.effectScope();
      return scope.run(() => setup());
    });
    for (const key in setupStore) {
      const prop = setupStore[key];
      if (vue.isRef(prop) && !isComputed(prop) || vue.isReactive(prop)) {
        if (hot) {
          set(hotState.value, key, vue.toRef(setupStore, key));
        } else if (!isOptionsStore) {
          if (initialState && shouldHydrate(prop)) {
            if (vue.isRef(prop)) {
              prop.value = initialState[key];
            } else {
              mergeReactiveObjects(prop, initialState[key]);
            }
          }
          {
            pinia.state.value[$id][key] = prop;
          }
        }
        {
          _hmrPayload.state.push(key);
        }
      } else if (typeof prop === "function") {
        const actionValue = hot ? prop : wrapAction(key, prop);
        {
          setupStore[key] = actionValue;
        }
        {
          _hmrPayload.actions[key] = prop;
        }
        optionsForPlugin.actions[key] = prop;
      } else {
        if (isComputed(prop)) {
          _hmrPayload.getters[key] = isOptionsStore ? (
            // @ts-expect-error
            options.getters[key]
          ) : prop;
          if (IS_CLIENT) {
            const getters = setupStore._getters || // @ts-expect-error: same
            (setupStore._getters = vue.markRaw([]));
            getters.push(key);
          }
        }
      }
    }
    {
      assign(store, setupStore);
      assign(vue.toRaw(store), setupStore);
    }
    Object.defineProperty(store, "$state", {
      get: () => hot ? hotState.value : pinia.state.value[$id],
      set: (state) => {
        if (hot) {
          throw new Error("cannot set hotState");
        }
        $patch(($state) => {
          assign($state, state);
        });
      }
    });
    {
      store._hotUpdate = vue.markRaw((newStore) => {
        store._hotUpdating = true;
        newStore._hmrPayload.state.forEach((stateKey) => {
          if (stateKey in store.$state) {
            const newStateTarget = newStore.$state[stateKey];
            const oldStateSource = store.$state[stateKey];
            if (typeof newStateTarget === "object" && isPlainObject$1(newStateTarget) && isPlainObject$1(oldStateSource)) {
              patchObject(newStateTarget, oldStateSource);
            } else {
              newStore.$state[stateKey] = oldStateSource;
            }
          }
          set(store, stateKey, vue.toRef(newStore.$state, stateKey));
        });
        Object.keys(store.$state).forEach((stateKey) => {
          if (!(stateKey in newStore.$state)) {
            del(store, stateKey);
          }
        });
        isListening = false;
        isSyncListening = false;
        pinia.state.value[$id] = vue.toRef(newStore._hmrPayload, "hotState");
        isSyncListening = true;
        vue.nextTick().then(() => {
          isListening = true;
        });
        for (const actionName in newStore._hmrPayload.actions) {
          const action = newStore[actionName];
          set(store, actionName, wrapAction(actionName, action));
        }
        for (const getterName in newStore._hmrPayload.getters) {
          const getter = newStore._hmrPayload.getters[getterName];
          const getterValue = isOptionsStore ? (
            // special handling of options api
            vue.computed(() => {
              setActivePinia(pinia);
              return getter.call(store, store);
            })
          ) : getter;
          set(store, getterName, getterValue);
        }
        Object.keys(store._hmrPayload.getters).forEach((key) => {
          if (!(key in newStore._hmrPayload.getters)) {
            del(store, key);
          }
        });
        Object.keys(store._hmrPayload.actions).forEach((key) => {
          if (!(key in newStore._hmrPayload.actions)) {
            del(store, key);
          }
        });
        store._hmrPayload = newStore._hmrPayload;
        store._getters = newStore._getters;
        store._hotUpdating = false;
      });
    }
    if (USE_DEVTOOLS) {
      const nonEnumerable = {
        writable: true,
        configurable: true,
        // avoid warning on devtools trying to display this property
        enumerable: false
      };
      ["_p", "_hmrPayload", "_getters", "_customProperties"].forEach((p) => {
        Object.defineProperty(store, p, assign({ value: store[p] }, nonEnumerable));
      });
    }
    pinia._p.forEach((extender) => {
      if (USE_DEVTOOLS) {
        const extensions = scope.run(() => extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        }));
        Object.keys(extensions || {}).forEach((key) => store._customProperties.add(key));
        assign(store, extensions);
      } else {
        assign(store, scope.run(() => extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        })));
      }
    });
    if (store.$state && typeof store.$state === "object" && typeof store.$state.constructor === "function" && !store.$state.constructor.toString().includes("[native code]")) {
      console.warn(`[🍍]: The "state" must be a plain object. It cannot be
	state: () => new MyClass()
Found in store "${store.$id}".`);
    }
    if (initialState && isOptionsStore && options.hydrate) {
      options.hydrate(store.$state, initialState);
    }
    isListening = true;
    isSyncListening = true;
    return store;
  }
  function defineStore(idOrOptions, setup, setupOptions) {
    let id;
    let options;
    const isSetupStore = typeof setup === "function";
    if (typeof idOrOptions === "string") {
      id = idOrOptions;
      options = isSetupStore ? setupOptions : setup;
    } else {
      options = idOrOptions;
      id = idOrOptions.id;
    }
    function useStore(pinia, hot) {
      const currentInstance = vue.getCurrentInstance();
      pinia = // in test mode, ignore the argument provided as we can always retrieve a
      // pinia instance with getActivePinia()
      pinia || currentInstance && vue.inject(piniaSymbol, null);
      if (pinia)
        setActivePinia(pinia);
      if (!activePinia) {
        throw new Error(`[🍍]: getActivePinia was called with no active Pinia. Did you forget to install pinia?
	const pinia = createPinia()
	app.use(pinia)
This will fail in production.`);
      }
      pinia = activePinia;
      if (!pinia._s.has(id)) {
        if (isSetupStore) {
          createSetupStore(id, setup, options, pinia);
        } else {
          createOptionsStore(id, options, pinia);
        }
        {
          useStore._pinia = pinia;
        }
      }
      const store = pinia._s.get(id);
      if (hot) {
        const hotId = "__hot:" + id;
        const newStore = isSetupStore ? createSetupStore(hotId, setup, options, pinia, true) : createOptionsStore(hotId, assign({}, options), pinia, true);
        hot._hotUpdate(newStore);
        delete pinia.state.value[hotId];
        pinia._s.delete(hotId);
      }
      if (IS_CLIENT && currentInstance && currentInstance.proxy && // avoid adding stores that are just built for hot module replacement
      !hot) {
        const vm = currentInstance.proxy;
        const cache = "_pStores" in vm ? vm._pStores : vm._pStores = {};
        cache[id] = store;
      }
      return store;
    }
    useStore.$id = id;
    return useStore;
  }
  const useUserStore = defineStore("user", () => {
    const token = vue.ref(uni.getStorageSync("token") || "");
    const isLogin = vue.computed(() => !!token.value);
    function login(newToken) {
      token.value = newToken;
      uni.setStorageSync("token", newToken);
    }
    function logout() {
      token.value = "";
      uni.removeStorageSync("token");
    }
    return {
      token,
      isLogin,
      login,
      logout
    };
  });
  const icons = {
    "uicon-level": "",
    "uicon-column-line": "",
    "uicon-checkbox-mark": "",
    "uicon-folder": "",
    "uicon-movie": "",
    "uicon-star-fill": "",
    "uicon-star": "",
    "uicon-phone-fill": "",
    "uicon-phone": "",
    "uicon-apple-fill": "",
    "uicon-chrome-circle-fill": "",
    "uicon-backspace": "",
    "uicon-attach": "",
    "uicon-cut": "",
    "uicon-empty-car": "",
    "uicon-empty-coupon": "",
    "uicon-empty-address": "",
    "uicon-empty-favor": "",
    "uicon-empty-permission": "",
    "uicon-empty-news": "",
    "uicon-empty-search": "",
    "uicon-github-circle-fill": "",
    "uicon-rmb": "",
    "uicon-person-delete-fill": "",
    "uicon-reload": "",
    "uicon-order": "",
    "uicon-server-man": "",
    "uicon-search": "",
    "uicon-fingerprint": "",
    "uicon-more-dot-fill": "",
    "uicon-scan": "",
    "uicon-share-square": "",
    "uicon-map": "",
    "uicon-map-fill": "",
    "uicon-tags": "",
    "uicon-tags-fill": "",
    "uicon-bookmark-fill": "",
    "uicon-bookmark": "",
    "uicon-eye": "",
    "uicon-eye-fill": "",
    "uicon-mic": "",
    "uicon-mic-off": "",
    "uicon-calendar": "",
    "uicon-calendar-fill": "",
    "uicon-trash": "",
    "uicon-trash-fill": "",
    "uicon-play-left": "",
    "uicon-play-right": "",
    "uicon-minus": "",
    "uicon-plus": "",
    "uicon-info": "",
    "uicon-info-circle": "",
    "uicon-info-circle-fill": "",
    "uicon-question": "",
    "uicon-error": "",
    "uicon-close": "",
    "uicon-checkmark": "",
    "uicon-android-circle-fill": "",
    "uicon-android-fill": "",
    "uicon-ie": "",
    "uicon-IE-circle-fill": "",
    "uicon-google": "",
    "uicon-google-circle-fill": "",
    "uicon-setting-fill": "",
    "uicon-setting": "",
    "uicon-minus-square-fill": "",
    "uicon-plus-square-fill": "",
    "uicon-heart": "",
    "uicon-heart-fill": "",
    "uicon-camera": "",
    "uicon-camera-fill": "",
    "uicon-more-circle": "",
    "uicon-more-circle-fill": "",
    "uicon-chat": "",
    "uicon-chat-fill": "",
    "uicon-bag-fill": "",
    "uicon-bag": "",
    "uicon-error-circle-fill": "",
    "uicon-error-circle": "",
    "uicon-close-circle": "",
    "uicon-close-circle-fill": "",
    "uicon-checkmark-circle": "",
    "uicon-checkmark-circle-fill": "",
    "uicon-question-circle-fill": "",
    "uicon-question-circle": "",
    "uicon-share": "",
    "uicon-share-fill": "",
    "uicon-shopping-cart": "",
    "uicon-shopping-cart-fill": "",
    "uicon-bell": "",
    "uicon-bell-fill": "",
    "uicon-list": "",
    "uicon-list-dot": "",
    "uicon-zhihu": "",
    "uicon-zhihu-circle-fill": "",
    "uicon-zhifubao": "",
    "uicon-zhifubao-circle-fill": "",
    "uicon-weixin-circle-fill": "",
    "uicon-weixin-fill": "",
    "uicon-twitter-circle-fill": "",
    "uicon-twitter": "",
    "uicon-taobao-circle-fill": "",
    "uicon-taobao": "",
    "uicon-weibo-circle-fill": "",
    "uicon-weibo": "",
    "uicon-qq-fill": "",
    "uicon-qq-circle-fill": "",
    "uicon-moments-circel-fill": "",
    "uicon-moments": "",
    "uicon-qzone": "",
    "uicon-qzone-circle-fill": "",
    "uicon-baidu-circle-fill": "",
    "uicon-baidu": "",
    "uicon-facebook-circle-fill": "",
    "uicon-facebook": "",
    "uicon-car": "",
    "uicon-car-fill": "",
    "uicon-warning-fill": "",
    "uicon-warning": "",
    "uicon-clock-fill": "",
    "uicon-clock": "",
    "uicon-edit-pen": "",
    "uicon-edit-pen-fill": "",
    "uicon-email": "",
    "uicon-email-fill": "",
    "uicon-minus-circle": "",
    "uicon-minus-circle-fill": "",
    "uicon-plus-circle": "",
    "uicon-plus-circle-fill": "",
    "uicon-file-text": "",
    "uicon-file-text-fill": "",
    "uicon-pushpin": "",
    "uicon-pushpin-fill": "",
    "uicon-grid": "",
    "uicon-grid-fill": "",
    "uicon-play-circle": "",
    "uicon-play-circle-fill": "",
    "uicon-pause-circle-fill": "",
    "uicon-pause": "",
    "uicon-pause-circle": "",
    "uicon-eye-off": "",
    "uicon-eye-off-outline": "",
    "uicon-gift-fill": "",
    "uicon-gift": "",
    "uicon-rmb-circle-fill": "",
    "uicon-rmb-circle": "",
    "uicon-kefu-ermai": "",
    "uicon-server-fill": "",
    "uicon-coupon-fill": "",
    "uicon-coupon": "",
    "uicon-integral": "",
    "uicon-integral-fill": "",
    "uicon-home-fill": "",
    "uicon-home": "",
    "uicon-hourglass-half-fill": "",
    "uicon-hourglass": "",
    "uicon-account": "",
    "uicon-plus-people-fill": "",
    "uicon-minus-people-fill": "",
    "uicon-account-fill": "",
    "uicon-thumb-down-fill": "",
    "uicon-thumb-down": "",
    "uicon-thumb-up": "",
    "uicon-thumb-up-fill": "",
    "uicon-lock-fill": "",
    "uicon-lock-open": "",
    "uicon-lock-opened-fill": "",
    "uicon-lock": "",
    "uicon-red-packet-fill": "",
    "uicon-photo-fill": "",
    "uicon-photo": "",
    "uicon-volume-off-fill": "",
    "uicon-volume-off": "",
    "uicon-volume-fill": "",
    "uicon-volume": "",
    "uicon-red-packet": "",
    "uicon-download": "",
    "uicon-arrow-up-fill": "",
    "uicon-arrow-down-fill": "",
    "uicon-play-left-fill": "",
    "uicon-play-right-fill": "",
    "uicon-rewind-left-fill": "",
    "uicon-rewind-right-fill": "",
    "uicon-arrow-downward": "",
    "uicon-arrow-leftward": "",
    "uicon-arrow-rightward": "",
    "uicon-arrow-upward": "",
    "uicon-arrow-down": "",
    "uicon-arrow-right": "",
    "uicon-arrow-left": "",
    "uicon-arrow-up": "",
    "uicon-skip-back-left": "",
    "uicon-skip-forward-right": "",
    "uicon-rewind-right": "",
    "uicon-rewind-left": "",
    "uicon-arrow-right-double": "",
    "uicon-arrow-left-double": "",
    "uicon-wifi-off": "",
    "uicon-wifi": "",
    "uicon-empty-data": "",
    "uicon-empty-history": "",
    "uicon-empty-list": "",
    "uicon-empty-page": "",
    "uicon-empty-order": "",
    "uicon-man": "",
    "uicon-woman": "",
    "uicon-man-add": "",
    "uicon-man-add-fill": "",
    "uicon-man-delete": "",
    "uicon-man-delete-fill": "",
    "uicon-zh": "",
    "uicon-en": ""
  };
  const version = "3.1.6";
  {
    formatAppLog("log", "at node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/libs/config/config.js:6", `
 %c uview-plus V${version} %c https://uiadmin.net/uview-plus 

`, "color: #ffffff; background: #3c9cff; padding:5px 0;", "color: #3c9cff;background: #ffffff; padding:5px 0;");
  }
  const config = {
    v: version,
    version,
    // 主题名称
    type: [
      "primary",
      "success",
      "info",
      "error",
      "warning"
    ],
    // 颜色部分，本来可以通过scss的:export导出供js使用，但是奈何nvue不支持
    color: {
      "u-primary": "#2979ff",
      "u-warning": "#ff9900",
      "u-success": "#19be6b",
      "u-error": "#fa3534",
      "u-info": "#909399",
      "u-main-color": "#303133",
      "u-content-color": "#606266",
      "u-tips-color": "#909399",
      "u-light-color": "#c0c4cc"
    },
    // 默认单位，可以通过配置为rpx，那么在用于传入组件大小参数为数值时，就默认为rpx
    unit: "px"
  };
  const ActionSheet = {
    // action-sheet组件
    actionSheet: {
      show: false,
      title: "",
      description: "",
      actions: () => [],
      index: "",
      cancelText: "",
      closeOnClickAction: true,
      safeAreaInsetBottom: true,
      openType: "",
      closeOnClickOverlay: true,
      round: 0
    }
  };
  const Album = {
    // album 组件
    album: {
      urls: () => [],
      keyName: "",
      singleSize: 180,
      multipleSize: 70,
      space: 6,
      singleMode: "scaleToFill",
      multipleMode: "aspectFill",
      maxCount: 9,
      previewFullImage: true,
      rowCount: 3,
      showMore: true
    }
  };
  const Alert = {
    // alert警告组件
    alert: {
      title: "",
      type: "warning",
      description: "",
      closable: false,
      showIcon: false,
      effect: "light",
      center: false,
      fontSize: 14
    }
  };
  const Avatar = {
    // avatar 组件
    avatar: {
      src: "",
      shape: "circle",
      size: 40,
      mode: "scaleToFill",
      text: "",
      bgColor: "#c0c4cc",
      color: "#ffffff",
      fontSize: 18,
      icon: "",
      mpAvatar: false,
      randomBgColor: false,
      defaultUrl: "",
      colorIndex: "",
      name: ""
    }
  };
  const AvatarGroup = {
    // avatarGroup 组件
    avatarGroup: {
      urls: () => [],
      maxCount: 5,
      shape: "circle",
      mode: "scaleToFill",
      showMore: true,
      size: 40,
      keyName: "",
      gap: 0.5,
      extraValue: 0
    }
  };
  const Backtop = {
    // backtop组件
    backtop: {
      mode: "circle",
      icon: "arrow-upward",
      text: "",
      duration: 100,
      scrollTop: 0,
      top: 400,
      bottom: 100,
      right: 20,
      zIndex: 9,
      iconStyle: () => ({
        color: "#909399",
        fontSize: "19px"
      })
    }
  };
  const Badge = {
    // 徽标数组件
    badge: {
      isDot: false,
      value: "",
      show: true,
      max: 999,
      type: "error",
      showZero: false,
      bgColor: null,
      color: null,
      shape: "circle",
      numberType: "overflow",
      offset: () => [],
      inverted: false,
      absolute: false
    }
  };
  const Button = {
    // button组件
    button: {
      hairline: false,
      type: "info",
      size: "normal",
      shape: "square",
      plain: false,
      disabled: false,
      loading: false,
      loadingText: "",
      loadingMode: "spinner",
      loadingSize: 15,
      openType: "",
      formType: "",
      appParameter: "",
      hoverStopPropagation: true,
      lang: "en",
      sessionFrom: "",
      sendMessageTitle: "",
      sendMessagePath: "",
      sendMessageImg: "",
      showMessageCard: false,
      dataName: "",
      throttleTime: 0,
      hoverStartTime: 0,
      hoverStayTime: 200,
      text: "",
      icon: "",
      iconColor: "",
      color: ""
    }
  };
  const Calendar = {
    // calendar 组件
    calendar: {
      title: "日期选择",
      showTitle: true,
      showSubtitle: true,
      mode: "single",
      startText: "开始",
      endText: "结束",
      customList: () => [],
      color: "#3c9cff",
      minDate: 0,
      maxDate: 0,
      defaultDate: null,
      maxCount: Number.MAX_SAFE_INTEGER,
      // Infinity
      rowHeight: 56,
      formatter: null,
      showLunar: false,
      showMark: true,
      confirmText: "确定",
      confirmDisabledText: "确定",
      show: false,
      closeOnClickOverlay: false,
      readonly: false,
      showConfirm: true,
      maxRange: Number.MAX_SAFE_INTEGER,
      // Infinity
      rangePrompt: "",
      showRangePrompt: true,
      allowSameDay: false,
      round: 0,
      monthNum: 3
    }
  };
  const CarKeyboard = {
    // 车牌号键盘
    carKeyboard: {
      random: false
    }
  };
  const Cell = {
    // cell组件的props
    cell: {
      customClass: "",
      title: "",
      label: "",
      value: "",
      icon: "",
      disabled: false,
      border: true,
      center: false,
      url: "",
      linkType: "navigateTo",
      clickable: false,
      isLink: false,
      required: false,
      arrowDirection: "",
      iconStyle: {},
      rightIconStyle: {},
      rightIcon: "arrow-right",
      titleStyle: {},
      size: "",
      stop: true,
      name: ""
    }
  };
  const CellGroup = {
    // cell-group组件的props
    cellGroup: {
      title: "",
      border: true,
      customStyle: {}
    }
  };
  const Checkbox = {
    // checkbox组件
    checkbox: {
      name: "",
      shape: "",
      size: "",
      checkbox: false,
      disabled: "",
      activeColor: "",
      inactiveColor: "",
      iconSize: "",
      iconColor: "",
      label: "",
      labelSize: "",
      labelColor: "",
      labelDisabled: ""
    }
  };
  const CheckboxGroup = {
    // checkbox-group组件
    checkboxGroup: {
      name: "",
      value: () => [],
      shape: "square",
      disabled: false,
      activeColor: "#2979ff",
      inactiveColor: "#c8c9cc",
      size: 18,
      placement: "row",
      labelSize: 14,
      labelColor: "#303133",
      labelDisabled: false,
      iconColor: "#ffffff",
      iconSize: 12,
      iconPlacement: "left",
      borderBottom: false
    }
  };
  const CircleProgress = {
    // circleProgress 组件
    circleProgress: {
      percentage: 30
    }
  };
  const Code = {
    // code 组件
    code: {
      seconds: 60,
      startText: "获取验证码",
      changeText: "X秒重新获取",
      endText: "重新获取",
      keepRunning: false,
      uniqueKey: ""
    }
  };
  const CodeInput = {
    // codeInput 组件
    codeInput: {
      adjustPosition: true,
      maxlength: 6,
      dot: false,
      mode: "box",
      hairline: false,
      space: 10,
      value: "",
      focus: false,
      bold: false,
      color: "#606266",
      fontSize: 18,
      size: 35,
      disabledKeyboard: false,
      borderColor: "#c9cacc",
      disabledDot: true
    }
  };
  const Col = {
    // col 组件
    col: {
      span: 12,
      offset: 0,
      justify: "start",
      align: "stretch",
      textAlign: "left"
    }
  };
  const Collapse = {
    // collapse 组件
    collapse: {
      value: null,
      accordion: false,
      border: true
    }
  };
  const CollapseItem = {
    // collapseItem 组件
    collapseItem: {
      title: "",
      value: "",
      label: "",
      disabled: false,
      isLink: true,
      clickable: true,
      border: true,
      align: "left",
      name: "",
      icon: "",
      duration: 300
    }
  };
  const ColumnNotice = {
    // columnNotice 组件
    columnNotice: {
      text: "",
      icon: "volume",
      mode: "",
      color: "#f9ae3d",
      bgColor: "#fdf6ec",
      fontSize: 14,
      speed: 80,
      step: false,
      duration: 1500,
      disableTouch: true
    }
  };
  const CountDown = {
    // u-count-down 计时器组件
    countDown: {
      time: 0,
      format: "HH:mm:ss",
      autoStart: true,
      millisecond: false
    }
  };
  const CountTo = {
    // countTo 组件
    countTo: {
      startVal: 0,
      endVal: 0,
      duration: 2e3,
      autoplay: true,
      decimals: 0,
      useEasing: true,
      decimal: ".",
      color: "#606266",
      fontSize: 22,
      bold: false,
      separator: ""
    }
  };
  const DatetimePicker = {
    // datetimePicker 组件
    datetimePicker: {
      show: false,
      showToolbar: true,
      value: "",
      title: "",
      mode: "datetime",
      maxDate: new Date((/* @__PURE__ */ new Date()).getFullYear() + 10, 0, 1).getTime(),
      minDate: new Date((/* @__PURE__ */ new Date()).getFullYear() - 10, 0, 1).getTime(),
      minHour: 0,
      maxHour: 23,
      minMinute: 0,
      maxMinute: 59,
      filter: null,
      formatter: null,
      loading: false,
      itemHeight: 44,
      cancelText: "取消",
      confirmText: "确认",
      cancelColor: "#909193",
      confirmColor: "#3c9cff",
      visibleItemCount: 5,
      closeOnClickOverlay: false,
      defaultIndex: () => []
    }
  };
  const Divider = {
    // divider组件
    divider: {
      dashed: false,
      hairline: true,
      dot: false,
      textPosition: "center",
      text: "",
      textSize: 14,
      textColor: "#909399",
      lineColor: "#dcdfe6"
    }
  };
  const Empty = {
    // empty组件
    empty: {
      icon: "",
      text: "",
      textColor: "#c0c4cc",
      textSize: 14,
      iconColor: "#c0c4cc",
      iconSize: 90,
      mode: "data",
      width: 160,
      height: 160,
      show: true,
      marginTop: 0
    }
  };
  const Form = {
    // form 组件
    form: {
      model: () => ({}),
      rules: () => ({}),
      errorType: "message",
      borderBottom: true,
      labelPosition: "left",
      labelWidth: 45,
      labelAlign: "left",
      labelStyle: () => ({})
    }
  };
  const GormItem = {
    // formItem 组件
    formItem: {
      label: "",
      prop: "",
      borderBottom: "",
      labelWidth: "",
      rightIcon: "",
      leftIcon: "",
      required: false,
      leftIconStyle: ""
    }
  };
  const Gap = {
    // gap组件
    gap: {
      bgColor: "transparent",
      height: 20,
      marginTop: 0,
      marginBottom: 0,
      customStyle: {}
    }
  };
  const Grid = {
    // grid组件
    grid: {
      col: 3,
      border: false,
      align: "left"
    }
  };
  const GridItem = {
    // grid-item组件
    gridItem: {
      name: null,
      bgColor: "transparent"
    }
  };
  const {
    color: color$3
  } = config;
  const Icon = {
    // icon组件
    icon: {
      name: "",
      color: color$3["u-content-color"],
      size: "16px",
      bold: false,
      index: "",
      hoverClass: "",
      customPrefix: "uicon",
      label: "",
      labelPos: "right",
      labelSize: "15px",
      labelColor: color$3["u-content-color"],
      space: "3px",
      imgMode: "",
      width: "",
      height: "",
      top: 0,
      stop: false
    }
  };
  const Image = {
    // image组件
    image: {
      src: "",
      mode: "aspectFill",
      width: "300",
      height: "225",
      shape: "square",
      radius: 0,
      lazyLoad: true,
      showMenuByLongpress: true,
      loadingIcon: "photo",
      errorIcon: "error-circle",
      showLoading: true,
      showError: true,
      fade: true,
      webp: false,
      duration: 500,
      bgColor: "#f3f4f6"
    }
  };
  const IndexAnchor = {
    // indexAnchor 组件
    indexAnchor: {
      text: "",
      color: "#606266",
      size: 14,
      bgColor: "#dedede",
      height: 32
    }
  };
  const IndexList = {
    // indexList 组件
    indexList: {
      inactiveColor: "#606266",
      activeColor: "#5677fc",
      indexList: () => [],
      sticky: true,
      customNavHeight: 0
    }
  };
  const Input = {
    // index 组件
    input: {
      value: "",
      type: "text",
      fixed: false,
      disabled: false,
      disabledColor: "#f5f7fa",
      clearable: false,
      password: false,
      maxlength: -1,
      placeholder: null,
      placeholderClass: "input-placeholder",
      placeholderStyle: "color: #c0c4cc",
      showWordLimit: false,
      confirmType: "done",
      confirmHold: false,
      holdKeyboard: false,
      focus: false,
      autoBlur: false,
      disableDefaultPadding: false,
      cursor: -1,
      cursorSpacing: 30,
      selectionStart: -1,
      selectionEnd: -1,
      adjustPosition: true,
      inputAlign: "left",
      fontSize: "15px",
      color: "#303133",
      prefixIcon: "",
      prefixIconStyle: "",
      suffixIcon: "",
      suffixIconStyle: "",
      border: "surround",
      readonly: false,
      shape: "square",
      formatter: null
    }
  };
  const Keyboard = {
    // 键盘组件
    keyboard: {
      mode: "number",
      dotDisabled: false,
      tooltip: true,
      showTips: true,
      tips: "",
      showCancel: true,
      showConfirm: true,
      random: false,
      safeAreaInsetBottom: true,
      closeOnClickOverlay: true,
      show: false,
      overlay: true,
      zIndex: 10075,
      cancelText: "取消",
      confirmText: "确定",
      autoChange: false
    }
  };
  const Line = {
    // line组件
    line: {
      color: "#d6d7d9",
      length: "100%",
      direction: "row",
      hairline: true,
      margin: 0,
      dashed: false
    }
  };
  const LineProgress = {
    // lineProgress 组件
    lineProgress: {
      activeColor: "#19be6b",
      inactiveColor: "#ececec",
      percentage: 0,
      showText: true,
      height: 12
    }
  };
  const {
    color: color$2
  } = config;
  const Link = {
    // link超链接组件props参数
    link: {
      color: color$2["u-primary"],
      fontSize: 15,
      underLine: false,
      href: "",
      mpTips: "链接已复制，请在浏览器打开",
      lineColor: "",
      text: ""
    }
  };
  const List = {
    // list 组件
    list: {
      showScrollbar: false,
      lowerThreshold: 50,
      upperThreshold: 0,
      scrollTop: 0,
      offsetAccuracy: 10,
      enableFlex: false,
      pagingEnabled: false,
      scrollable: true,
      scrollIntoView: "",
      scrollWithAnimation: false,
      enableBackToTop: false,
      height: 0,
      width: 0,
      preLoadScreen: 1
    }
  };
  const ListItem = {
    // listItem 组件
    listItem: {
      anchor: ""
    }
  };
  const {
    color: color$1
  } = config;
  const LoadingIcon = {
    // loading-icon加载中图标组件
    loadingIcon: {
      show: true,
      color: color$1["u-tips-color"],
      textColor: color$1["u-tips-color"],
      vertical: false,
      mode: "spinner",
      size: 24,
      textSize: 15,
      text: "",
      timingFunction: "ease-in-out",
      duration: 1200,
      inactiveColor: ""
    }
  };
  const LoadingPage = {
    // loading-page组件
    loadingPage: {
      loadingText: "正在加载",
      image: "",
      loadingMode: "circle",
      loading: false,
      bgColor: "#ffffff",
      color: "#C8C8C8",
      fontSize: 19,
      iconSize: 28,
      loadingColor: "#C8C8C8"
    }
  };
  const Loadmore = {
    // loadmore 组件
    loadmore: {
      status: "loadmore",
      bgColor: "transparent",
      icon: true,
      fontSize: 14,
      iconSize: 17,
      color: "#606266",
      loadingIcon: "spinner",
      loadmoreText: "加载更多",
      loadingText: "正在加载...",
      nomoreText: "没有更多了",
      isDot: false,
      iconColor: "#b7b7b7",
      marginTop: 10,
      marginBottom: 10,
      height: "auto",
      line: false,
      lineColor: "#E6E8EB",
      dashed: false
    }
  };
  const Modal = {
    // modal 组件
    modal: {
      show: false,
      title: "",
      content: "",
      confirmText: "确认",
      cancelText: "取消",
      showConfirmButton: true,
      showCancelButton: false,
      confirmColor: "#2979ff",
      cancelColor: "#606266",
      buttonReverse: false,
      zoom: true,
      asyncClose: false,
      closeOnClickOverlay: false,
      negativeTop: 0,
      width: "650rpx",
      confirmButtonShape: ""
    }
  };
  const color = {
    primary: "#3c9cff",
    info: "#909399",
    default: "#909399",
    warning: "#f9ae3d",
    error: "#f56c6c",
    success: "#5ac725",
    mainColor: "#303133",
    contentColor: "#606266",
    tipsColor: "#909399",
    lightColor: "#c0c4cc",
    borderColor: "#e4e7ed"
  };
  const Navbar = {
    // navbar 组件
    navbar: {
      safeAreaInsetTop: true,
      placeholder: false,
      fixed: true,
      border: false,
      leftIcon: "arrow-left",
      leftText: "",
      rightText: "",
      rightIcon: "",
      title: "",
      bgColor: "#ffffff",
      titleWidth: "400rpx",
      height: "44px",
      leftIconSize: 20,
      leftIconColor: color.mainColor,
      autoBack: false,
      titleStyle: ""
    }
  };
  const NoNetwork = {
    // noNetwork
    noNetwork: {
      tips: "哎呀，网络信号丢失",
      zIndex: "",
      image: "data:image/png;base64,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"
    }
  };
  const NoticeBar = {
    // noticeBar
    noticeBar: {
      text: () => [],
      direction: "row",
      step: false,
      icon: "volume",
      mode: "",
      color: "#f9ae3d",
      bgColor: "#fdf6ec",
      speed: 80,
      fontSize: 14,
      duration: 2e3,
      disableTouch: true,
      url: "",
      linkType: "navigateTo"
    }
  };
  const Notify = {
    // notify组件
    notify: {
      top: 0,
      type: "primary",
      color: "#ffffff",
      bgColor: "",
      message: "",
      duration: 3e3,
      fontSize: 15,
      safeAreaInsetTop: false
    }
  };
  const NumberBox = {
    // 步进器组件
    numberBox: {
      name: "",
      value: 0,
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
      step: 1,
      integer: false,
      disabled: false,
      disabledInput: false,
      asyncChange: false,
      inputWidth: 35,
      showMinus: true,
      showPlus: true,
      decimalLength: null,
      longPress: true,
      color: "#323233",
      buttonSize: 30,
      bgColor: "#EBECEE",
      cursorSpacing: 100,
      disableMinus: false,
      disablePlus: false,
      iconStyle: ""
    }
  };
  const NumberKeyboard = {
    // 数字键盘
    numberKeyboard: {
      mode: "number",
      dotDisabled: false,
      random: false
    }
  };
  const Overlay = {
    // overlay组件
    overlay: {
      show: false,
      zIndex: 10070,
      duration: 300,
      opacity: 0.5
    }
  };
  const Parse = {
    // parse
    parse: {
      copyLink: true,
      errorImg: "",
      lazyLoad: false,
      loadingImg: "",
      pauseVideo: true,
      previewImg: true,
      setTitle: true,
      showImgMenu: true
    }
  };
  const Picker = {
    // picker
    picker: {
      show: false,
      showToolbar: true,
      title: "",
      columns: () => [],
      loading: false,
      itemHeight: 44,
      cancelText: "取消",
      confirmText: "确定",
      cancelColor: "#909193",
      confirmColor: "#3c9cff",
      visibleItemCount: 5,
      keyName: "text",
      closeOnClickOverlay: false,
      defaultIndex: () => [],
      immediateChange: false
    }
  };
  const Popup = {
    // popup组件
    popup: {
      show: false,
      overlay: true,
      mode: "bottom",
      duration: 300,
      closeable: false,
      overlayStyle: () => {
      },
      closeOnClickOverlay: true,
      zIndex: 10075,
      safeAreaInsetBottom: true,
      safeAreaInsetTop: false,
      closeIconPos: "top-right",
      round: 0,
      zoom: true,
      bgColor: "",
      overlayOpacity: 0.5
    }
  };
  const Radio = {
    // radio组件
    radio: {
      name: "",
      shape: "",
      disabled: "",
      labelDisabled: "",
      activeColor: "",
      inactiveColor: "",
      iconSize: "",
      labelSize: "",
      label: "",
      labelColor: "",
      size: "",
      iconColor: "",
      placement: ""
    }
  };
  const RadioGroup = {
    // radio-group组件
    radioGroup: {
      value: "",
      disabled: false,
      shape: "circle",
      activeColor: "#2979ff",
      inactiveColor: "#c8c9cc",
      name: "",
      size: 18,
      placement: "row",
      label: "",
      labelColor: "#303133",
      labelSize: 14,
      labelDisabled: false,
      iconColor: "#ffffff",
      iconSize: 12,
      borderBottom: false,
      iconPlacement: "left"
    }
  };
  const Rate = {
    // rate组件
    rate: {
      value: 1,
      count: 5,
      disabled: false,
      size: 18,
      inactiveColor: "#b2b2b2",
      activeColor: "#FA3534",
      gutter: 4,
      minCount: 1,
      allowHalf: false,
      activeIcon: "star-fill",
      inactiveIcon: "star",
      touchable: true
    }
  };
  const ReadMore = {
    // readMore
    readMore: {
      showHeight: 400,
      toggle: false,
      closeText: "展开阅读全文",
      openText: "收起",
      color: "#2979ff",
      fontSize: 14,
      textIndent: "2em",
      name: ""
    }
  };
  const Row = {
    // row
    row: {
      gutter: 0,
      justify: "start",
      align: "center"
    }
  };
  const RowNotice = {
    // rowNotice
    rowNotice: {
      text: "",
      icon: "volume",
      mode: "",
      color: "#f9ae3d",
      bgColor: "#fdf6ec",
      fontSize: 14,
      speed: 80
    }
  };
  const ScrollList = {
    // scrollList
    scrollList: {
      indicatorWidth: 50,
      indicatorBarWidth: 20,
      indicator: true,
      indicatorColor: "#f2f2f2",
      indicatorActiveColor: "#3c9cff",
      indicatorStyle: ""
    }
  };
  const Search = {
    // search
    search: {
      shape: "round",
      bgColor: "#f2f2f2",
      placeholder: "请输入关键字",
      clearabled: true,
      focus: false,
      showAction: true,
      actionStyle: () => ({}),
      actionText: "搜索",
      inputAlign: "left",
      inputStyle: () => ({}),
      disabled: false,
      borderColor: "transparent",
      searchIconColor: "#909399",
      searchIconSize: 22,
      color: "#606266",
      placeholderColor: "#909399",
      searchIcon: "search",
      margin: "0",
      animation: false,
      value: "",
      maxlength: "-1",
      height: 32,
      label: null
    }
  };
  const Section = {
    // u-section组件
    section: {
      title: "",
      subTitle: "更多",
      right: true,
      fontSize: 15,
      bold: true,
      color: "#303133",
      subColor: "#909399",
      showLine: true,
      lineColor: "",
      arrow: true
    }
  };
  const Skeleton = {
    // skeleton
    skeleton: {
      loading: true,
      animate: true,
      rows: 0,
      rowsWidth: "100%",
      rowsHeight: 18,
      title: true,
      titleWidth: "50%",
      titleHeight: 18,
      avatar: false,
      avatarSize: 32,
      avatarShape: "circle"
    }
  };
  const Slider = {
    // slider组件
    slider: {
      value: 0,
      blockSize: 18,
      min: 0,
      max: 100,
      step: 1,
      activeColor: "#2979ff",
      inactiveColor: "#c0c4cc",
      blockColor: "#ffffff",
      showValue: false,
      disabled: false,
      blockStyle: () => {
      }
    }
  };
  const StatusBar = {
    // statusBar
    statusBar: {
      bgColor: "transparent"
    }
  };
  const Steps = {
    // steps组件
    steps: {
      direction: "row",
      current: 0,
      activeColor: "#3c9cff",
      inactiveColor: "#969799",
      activeIcon: "",
      inactiveIcon: "",
      dot: false
    }
  };
  const StepsItem = {
    // steps-item组件
    stepsItem: {
      title: "",
      desc: "",
      iconSize: 17,
      error: false
    }
  };
  const Sticky = {
    // sticky组件
    sticky: {
      offsetTop: 0,
      customNavHeight: 0,
      disabled: false,
      bgColor: "transparent",
      zIndex: "",
      index: ""
    }
  };
  const Subsection = {
    // subsection组件
    subsection: {
      list: [],
      current: 0,
      activeColor: "#3c9cff",
      inactiveColor: "#303133",
      mode: "button",
      fontSize: 12,
      bold: true,
      bgColor: "#eeeeef",
      keyName: "name"
    }
  };
  const SwipeAction = {
    // swipe-action组件
    swipeAction: {
      autoClose: true
    }
  };
  const SwipeActionItem = {
    // swipeActionItem 组件
    swipeActionItem: {
      show: false,
      name: "",
      disabled: false,
      threshold: 20,
      autoClose: true,
      options: [],
      duration: 300
    }
  };
  const Swiper = {
    // swiper 组件
    swiper: {
      list: () => [],
      indicator: false,
      indicatorActiveColor: "#FFFFFF",
      indicatorInactiveColor: "rgba(255, 255, 255, 0.35)",
      indicatorStyle: "",
      indicatorMode: "line",
      autoplay: true,
      current: 0,
      currentItemId: "",
      interval: 3e3,
      duration: 300,
      circular: false,
      previousMargin: 0,
      nextMargin: 0,
      acceleration: false,
      displayMultipleItems: 1,
      easingFunction: "default",
      keyName: "url",
      imgMode: "aspectFill",
      height: 130,
      bgColor: "#f3f4f6",
      radius: 4,
      loading: false,
      showTitle: false
    }
  };
  const SwipterIndicator = {
    // swiperIndicator 组件
    swiperIndicator: {
      length: 0,
      current: 0,
      indicatorActiveColor: "",
      indicatorInactiveColor: "",
      indicatorMode: "line"
    }
  };
  const Switch = {
    // switch
    switch: {
      loading: false,
      disabled: false,
      size: 25,
      activeColor: "#2979ff",
      inactiveColor: "#ffffff",
      value: false,
      activeValue: true,
      inactiveValue: false,
      asyncChange: false,
      space: 0
    }
  };
  const Tabbar = {
    // tabbar
    tabbar: {
      value: null,
      safeAreaInsetBottom: true,
      border: true,
      zIndex: 1,
      activeColor: "#1989fa",
      inactiveColor: "#7d7e80",
      fixed: true,
      placeholder: true
    }
  };
  const TabbarItem = {
    //
    tabbarItem: {
      name: null,
      icon: "",
      badge: null,
      dot: false,
      text: "",
      badgeStyle: "top: 6px;right:2px;"
    }
  };
  const Tabs = {
    //
    tabs: {
      duration: 300,
      list: () => [],
      lineColor: "#3c9cff",
      activeStyle: () => ({
        color: "#303133"
      }),
      inactiveStyle: () => ({
        color: "#606266"
      }),
      lineWidth: 20,
      lineHeight: 3,
      lineBgSize: "cover",
      itemStyle: () => ({
        height: "44px"
      }),
      scrollable: true,
      current: 0,
      keyName: "name"
    }
  };
  const Tag = {
    // tag 组件
    tag: {
      type: "primary",
      disabled: false,
      size: "medium",
      shape: "square",
      text: "",
      bgColor: "",
      color: "",
      borderColor: "",
      closeColor: "#C6C7CB",
      name: "",
      plainFill: false,
      plain: false,
      closable: false,
      show: true,
      icon: ""
    }
  };
  const Text = {
    // text 组件
    text: {
      type: "",
      show: true,
      text: "",
      prefixIcon: "",
      suffixIcon: "",
      mode: "",
      href: "",
      format: "",
      call: false,
      openType: "",
      bold: false,
      block: false,
      lines: "",
      color: "#303133",
      size: 15,
      iconStyle: () => ({
        fontSize: "15px"
      }),
      decoration: "none",
      margin: 0,
      lineHeight: "",
      align: "left",
      wordWrap: "normal"
    }
  };
  const Textarea = {
    // textarea 组件
    textarea: {
      value: "",
      placeholder: "",
      placeholderClass: "textarea-placeholder",
      placeholderStyle: "color: #c0c4cc",
      height: 70,
      confirmType: "done",
      disabled: false,
      count: false,
      focus: false,
      autoHeight: false,
      fixed: false,
      cursorSpacing: 0,
      cursor: "",
      showConfirmBar: true,
      selectionStart: -1,
      selectionEnd: -1,
      adjustPosition: true,
      disableDefaultPadding: false,
      holdKeyboard: false,
      maxlength: 140,
      border: "surround",
      formatter: null
    }
  };
  const Toast = {
    // toast组件
    toast: {
      zIndex: 10090,
      loading: false,
      text: "",
      icon: "",
      type: "",
      loadingMode: "",
      show: "",
      overlay: false,
      position: "center",
      params: () => {
      },
      duration: 2e3,
      isTab: false,
      url: "",
      callback: null,
      back: false
    }
  };
  const Toolbar = {
    // toolbar 组件
    toolbar: {
      show: true,
      cancelText: "取消",
      confirmText: "确认",
      cancelColor: "#909193",
      confirmColor: "#3c9cff",
      title: ""
    }
  };
  const Tooltip = {
    // tooltip 组件
    tooltip: {
      text: "",
      copyText: "",
      size: 14,
      color: "#606266",
      bgColor: "transparent",
      direction: "top",
      zIndex: 10071,
      showCopy: true,
      buttons: () => [],
      overlay: true,
      showToast: true
    }
  };
  const Transition = {
    // transition动画组件的props
    transition: {
      show: false,
      mode: "fade",
      duration: "300",
      timingFunction: "ease-out"
    }
  };
  const Upload = {
    // upload组件
    upload: {
      accept: "image",
      capture: () => ["album", "camera"],
      compressed: true,
      camera: "back",
      maxDuration: 60,
      uploadIcon: "camera-fill",
      uploadIconColor: "#D3D4D6",
      useBeforeRead: false,
      previewFullImage: true,
      maxCount: 52,
      disabled: false,
      imageMode: "aspectFill",
      name: "",
      sizeType: () => ["original", "compressed"],
      multiple: false,
      deletable: true,
      maxSize: Number.MAX_VALUE,
      fileList: () => [],
      uploadText: "",
      width: 80,
      height: 80,
      previewImage: true
    }
  };
  const props$f = {
    ...ActionSheet,
    ...Album,
    ...Alert,
    ...Avatar,
    ...AvatarGroup,
    ...Backtop,
    ...Badge,
    ...Button,
    ...Calendar,
    ...CarKeyboard,
    ...Cell,
    ...CellGroup,
    ...Checkbox,
    ...CheckboxGroup,
    ...CircleProgress,
    ...Code,
    ...CodeInput,
    ...Col,
    ...Collapse,
    ...CollapseItem,
    ...ColumnNotice,
    ...CountDown,
    ...CountTo,
    ...DatetimePicker,
    ...Divider,
    ...Empty,
    ...Form,
    ...GormItem,
    ...Gap,
    ...Grid,
    ...GridItem,
    ...Icon,
    ...Image,
    ...IndexAnchor,
    ...IndexList,
    ...Input,
    ...Keyboard,
    ...Line,
    ...LineProgress,
    ...Link,
    ...List,
    ...ListItem,
    ...LoadingIcon,
    ...LoadingPage,
    ...Loadmore,
    ...Modal,
    ...Navbar,
    ...NoNetwork,
    ...NoticeBar,
    ...Notify,
    ...NumberBox,
    ...NumberKeyboard,
    ...Overlay,
    ...Parse,
    ...Picker,
    ...Popup,
    ...Radio,
    ...RadioGroup,
    ...Rate,
    ...ReadMore,
    ...Row,
    ...RowNotice,
    ...ScrollList,
    ...Search,
    ...Section,
    ...Skeleton,
    ...Slider,
    ...StatusBar,
    ...Steps,
    ...StepsItem,
    ...Sticky,
    ...Subsection,
    ...SwipeAction,
    ...SwipeActionItem,
    ...Swiper,
    ...SwipterIndicator,
    ...Switch,
    ...Tabbar,
    ...TabbarItem,
    ...Tabs,
    ...Tag,
    ...Text,
    ...Textarea,
    ...Toast,
    ...Toolbar,
    ...Tooltip,
    ...Transition,
    ...Upload
  };
  const props$e = {
    props: {
      // 图标类名
      name: {
        type: String,
        default: props$f.icon.name
      },
      // 图标颜色，可接受主题色
      color: {
        type: String,
        default: props$f.icon.color
      },
      // 字体大小，单位px
      size: {
        type: [String, Number],
        default: props$f.icon.size
      },
      // 是否显示粗体
      bold: {
        type: Boolean,
        default: props$f.icon.bold
      },
      // 点击图标的时候传递事件出去的index（用于区分点击了哪一个）
      index: {
        type: [String, Number],
        default: props$f.icon.index
      },
      // 触摸图标时的类名
      hoverClass: {
        type: String,
        default: props$f.icon.hoverClass
      },
      // 自定义扩展前缀，方便用户扩展自己的图标库
      customPrefix: {
        type: String,
        default: props$f.icon.customPrefix
      },
      // 图标右边或者下面的文字
      label: {
        type: [String, Number],
        default: props$f.icon.label
      },
      // label的位置，只能右边或者下边
      labelPos: {
        type: String,
        default: props$f.icon.labelPos
      },
      // label的大小
      labelSize: {
        type: [String, Number],
        default: props$f.icon.labelSize
      },
      // label的颜色
      labelColor: {
        type: String,
        default: props$f.icon.labelColor
      },
      // label与图标的距离
      space: {
        type: [String, Number],
        default: props$f.icon.space
      },
      // 图片的mode
      imgMode: {
        type: String,
        default: props$f.icon.imgMode
      },
      // 用于显示图片小图标时，图片的宽度
      width: {
        type: [String, Number],
        default: props$f.icon.width
      },
      // 用于显示图片小图标时，图片的高度
      height: {
        type: [String, Number],
        default: props$f.icon.height
      },
      // 用于解决某些情况下，让图标垂直居中的用途
      top: {
        type: [String, Number],
        default: props$f.icon.top
      },
      // 是否阻止事件传播
      stop: {
        type: Boolean,
        default: props$f.icon.stop
      }
    }
  };
  const mpMixin = {};
  const mixin = {
    // 定义每个组件都可能需要用到的外部样式以及类名
    props: {
      // 每个组件都有的父组件传递的样式，可以为字符串或者对象形式
      customStyle: {
        type: [Object, String],
        default: () => ({})
      },
      customClass: {
        type: String,
        default: ""
      },
      // 跳转的页面路径
      url: {
        type: String,
        default: ""
      },
      // 页面跳转的类型
      linkType: {
        type: String,
        default: "navigateTo"
      }
    },
    data() {
      return {};
    },
    onLoad() {
      this.$u.getRect = this.$uGetRect;
    },
    created() {
      this.$u.getRect = this.$uGetRect;
    },
    computed: {
      // 在2.x版本中，将会把$u挂载到uni对象下，导致在模板中无法使用uni.$u.xxx形式
      // 所以这里通过computed计算属性将其附加到this.$u上，就可以在模板或者js中使用uni.$u.xxx
      // 只在nvue环境通过此方式引入完整的$u，其他平台会出现性能问题，非nvue则按需引入（主要原因是props过大）
      $u() {
        return uni.$u.deepMerge(uni.$u, {
          props: void 0,
          http: void 0,
          mixin: void 0
        });
      },
      /**
       * 生成bem规则类名
       * 由于微信小程序，H5，nvue之间绑定class的差异，无法通过:class="[bem()]"的形式进行同用
       * 故采用如下折中做法，最后返回的是数组（一般平台）或字符串（支付宝和字节跳动平台），类似['a', 'b', 'c']或'a b c'的形式
       * @param {String} name 组件名称
       * @param {Array} fixed 一直会存在的类名
       * @param {Array} change 会根据变量值为true或者false而出现或者隐藏的类名
       * @returns {Array|string}
       */
      bem() {
        return function(name, fixed, change) {
          const prefix = `u-${name}--`;
          const classes = {};
          if (fixed) {
            fixed.map((item) => {
              classes[prefix + this[item]] = true;
            });
          }
          if (change) {
            change.map((item) => {
              this[item] ? classes[prefix + item] = this[item] : delete classes[prefix + item];
            });
          }
          return Object.keys(classes);
        };
      }
    },
    methods: {
      // 跳转某一个页面
      openPage(urlKey = "url") {
        const url2 = this[urlKey];
        if (url2) {
          this.$u.route({ type: this.linkType, url: url2 });
        }
      },
      // 查询节点信息
      // 目前此方法在支付宝小程序中无法获取组件跟接点的尺寸，为支付宝的bug(2020-07-21)
      // 解决办法为在组件根部再套一个没有任何作用的view元素
      $uGetRect(selector, all) {
        return new Promise((resolve) => {
          uni.createSelectorQuery().in(this)[all ? "selectAll" : "select"](selector).boundingClientRect((rect) => {
            if (all && Array.isArray(rect) && rect.length) {
              resolve(rect);
            }
            if (!all && rect) {
              resolve(rect);
            }
          }).exec();
        });
      },
      getParentData(parentName = "") {
        if (!this.parent)
          this.parent = {};
        this.parent = uni.$u.$parent.call(this, parentName);
        if (this.parent.children) {
          this.parent.children.indexOf(this) === -1 && this.parent.children.push(this);
        }
        if (this.parent && this.parentData) {
          Object.keys(this.parentData).map((key) => {
            this.parentData[key] = this.parent[key];
          });
        }
      },
      // 阻止事件冒泡
      preventEvent(e) {
        e && typeof e.stopPropagation === "function" && e.stopPropagation();
      },
      // 空操作
      noop(e) {
        this.preventEvent(e);
      }
    },
    onReachBottom() {
      uni.$emit("uOnReachBottom");
    },
    beforeDestroy() {
      if (this.parent && uni.$u.test.array(this.parent.children)) {
        const childrenList = this.parent.children;
        childrenList.map((child, index2) => {
          if (child === this) {
            childrenList.splice(index2, 1);
          }
        });
      }
    }
  };
  const _export_sfc = (sfc, props2) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props2) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$_ = {
    name: "u-icon",
    data() {
      return {};
    },
    emits: ["click"],
    mixins: [mpMixin, mixin, props$e],
    computed: {
      uClasses() {
        let classes = [];
        classes.push(this.customPrefix + "-" + this.name);
        if (this.color && uni.$u.config.type.includes(this.color))
          classes.push("u-icon__icon--" + this.color);
        return classes;
      },
      iconStyle() {
        let style = {};
        style = {
          fontSize: uni.$u.addUnit(this.size),
          lineHeight: uni.$u.addUnit(this.size),
          fontWeight: this.bold ? "bold" : "normal",
          // 某些特殊情况需要设置一个到顶部的距离，才能更好的垂直居中
          top: uni.$u.addUnit(this.top)
        };
        if (this.color && !uni.$u.config.type.includes(this.color))
          style.color = this.color;
        return style;
      },
      // 判断传入的name属性，是否图片路径，只要带有"/"均认为是图片形式
      isImg() {
        return this.name.indexOf("/") !== -1;
      },
      imgStyle() {
        let style = {};
        style.width = this.width ? uni.$u.addUnit(this.width) : uni.$u.addUnit(this.size);
        style.height = this.height ? uni.$u.addUnit(this.height) : uni.$u.addUnit(this.size);
        return style;
      },
      // 通过图标名，查找对应的图标
      icon() {
        return icons["uicon-" + this.name] || this.name;
      }
    },
    methods: {
      clickHandler(e) {
        this.$emit("click", this.index);
        this.stop && this.preventEvent(e);
      }
    }
  };
  function _sfc_render$l(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-icon", ["u-icon--" + _ctx.labelPos]]),
        onClick: _cache[0] || (_cache[0] = (...args) => $options.clickHandler && $options.clickHandler(...args))
      },
      [
        $options.isImg ? (vue.openBlock(), vue.createElementBlock("image", {
          key: 0,
          class: "u-icon__img",
          src: _ctx.name,
          mode: _ctx.imgMode,
          style: vue.normalizeStyle([$options.imgStyle, _ctx.$u.addStyle(_ctx.customStyle)])
        }, null, 12, ["src", "mode"])) : (vue.openBlock(), vue.createElementBlock("text", {
          key: 1,
          class: vue.normalizeClass(["u-icon__icon", $options.uClasses]),
          style: vue.normalizeStyle([$options.iconStyle, _ctx.$u.addStyle(_ctx.customStyle)]),
          "hover-class": _ctx.hoverClass
        }, vue.toDisplayString($options.icon), 15, ["hover-class"])),
        vue.createCommentVNode(' 这里进行空字符串判断，如果仅仅是v-if="label"，可能会出现传递0的时候，结果也无法显示 '),
        _ctx.label !== "" ? (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 2,
            class: "u-icon__label",
            style: vue.normalizeStyle({
              color: _ctx.labelColor,
              fontSize: _ctx.$u.addUnit(_ctx.labelSize),
              marginLeft: _ctx.labelPos == "right" ? _ctx.$u.addUnit(_ctx.space) : 0,
              marginTop: _ctx.labelPos == "bottom" ? _ctx.$u.addUnit(_ctx.space) : 0,
              marginRight: _ctx.labelPos == "left" ? _ctx.$u.addUnit(_ctx.space) : 0,
              marginBottom: _ctx.labelPos == "top" ? _ctx.$u.addUnit(_ctx.space) : 0
            })
          },
          vue.toDisplayString(_ctx.label),
          5
          /* TEXT, STYLE */
        )) : vue.createCommentVNode("v-if", true)
      ],
      2
      /* CLASS */
    );
  }
  const __easycom_0$5 = /* @__PURE__ */ _export_sfc(_sfc_main$_, [["render", _sfc_render$l], ["__scopeId", "data-v-bedad649"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-icon/u-icon.vue"]]);
  const props$d = {
    props: {
      // checkbox的名称
      name: {
        type: [String, Number, Boolean],
        default: props$f.checkbox.name
      },
      // 形状，square为方形，circle为圆型
      shape: {
        type: String,
        default: props$f.checkbox.shape
      },
      // 整体的大小
      size: {
        type: [String, Number],
        default: props$f.checkbox.size
      },
      // 是否默认选中
      checked: {
        type: Boolean,
        default: props$f.checkbox.checked
      },
      // 是否禁用
      disabled: {
        type: [String, Boolean],
        default: props$f.checkbox.disabled
      },
      // 选中状态下的颜色，如设置此值，将会覆盖parent的activeColor值
      activeColor: {
        type: String,
        default: props$f.checkbox.activeColor
      },
      // 未选中的颜色
      inactiveColor: {
        type: String,
        default: props$f.checkbox.inactiveColor
      },
      // 图标的大小，单位px
      iconSize: {
        type: [String, Number],
        default: props$f.checkbox.iconSize
      },
      // 图标颜色
      iconColor: {
        type: String,
        default: props$f.checkbox.iconColor
      },
      // label提示文字，因为nvue下，直接slot进来的文字，由于特殊的结构，无法修改样式
      label: {
        type: [String, Number],
        default: props$f.checkbox.label
      },
      // label的字体大小，px单位
      labelSize: {
        type: [String, Number],
        default: props$f.checkbox.labelSize
      },
      // label的颜色
      labelColor: {
        type: String,
        default: props$f.checkbox.labelColor
      },
      // 是否禁止点击提示语选中复选框
      labelDisabled: {
        type: [String, Boolean],
        default: props$f.checkbox.labelDisabled
      }
    }
  };
  const _sfc_main$Z = {
    name: "u-checkbox",
    mixins: [mpMixin, mixin, props$d],
    data() {
      return {
        isChecked: false,
        // 父组件的默认值，因为头条小程序不支持在computed中使用this.parent.shape的形式
        // 故只能使用如此方法
        parentData: {
          iconSize: 12,
          labelDisabled: null,
          disabled: null,
          shape: "square",
          activeColor: null,
          inactiveColor: null,
          size: 18,
          modelValue: null,
          iconColor: null,
          placement: "row",
          borderBottom: false,
          iconPlacement: "left"
        }
      };
    },
    computed: {
      // 是否禁用，如果父组件u-raios-group禁用的话，将会忽略子组件的配置
      elDisabled() {
        return this.disabled !== "" ? this.disabled : this.parentData.disabled !== null ? this.parentData.disabled : false;
      },
      // 是否禁用label点击
      elLabelDisabled() {
        return this.labelDisabled !== "" ? this.labelDisabled : this.parentData.labelDisabled !== null ? this.parentData.labelDisabled : false;
      },
      // 组件尺寸，对应size的值，默认值为21px
      elSize() {
        return this.size ? this.size : this.parentData.size ? this.parentData.size : 21;
      },
      // 组件的勾选图标的尺寸，默认12px
      elIconSize() {
        return this.iconSize ? this.iconSize : this.parentData.iconSize ? this.parentData.iconSize : 12;
      },
      // 组件选中激活时的颜色
      elActiveColor() {
        return this.activeColor ? this.activeColor : this.parentData.activeColor ? this.parentData.activeColor : "#2979ff";
      },
      // 组件选未中激活时的颜色
      elInactiveColor() {
        return this.inactiveColor ? this.inactiveColor : this.parentData.inactiveColor ? this.parentData.inactiveColor : "#c8c9cc";
      },
      // label的颜色
      elLabelColor() {
        return this.labelColor ? this.labelColor : this.parentData.labelColor ? this.parentData.labelColor : "#606266";
      },
      // 组件的形状
      elShape() {
        return this.shape ? this.shape : this.parentData.shape ? this.parentData.shape : "circle";
      },
      // label大小
      elLabelSize() {
        return uni.$u.addUnit(this.labelSize ? this.labelSize : this.parentData.labelSize ? this.parentData.labelSize : "15");
      },
      elIconColor() {
        const iconColor = this.iconColor ? this.iconColor : this.parentData.iconColor ? this.parentData.iconColor : "#ffffff";
        if (this.elDisabled) {
          return this.isChecked ? this.elInactiveColor : "transparent";
        } else {
          return this.isChecked ? iconColor : "transparent";
        }
      },
      iconClasses() {
        let classes = [];
        classes.push("u-checkbox__icon-wrap--" + this.elShape);
        if (this.elDisabled) {
          classes.push("u-checkbox__icon-wrap--disabled");
        }
        if (this.isChecked && this.elDisabled) {
          classes.push("u-checkbox__icon-wrap--disabled--checked");
        }
        return classes;
      },
      iconWrapStyle() {
        const style = {};
        style.backgroundColor = this.isChecked && !this.elDisabled ? this.elActiveColor : "#ffffff";
        style.borderColor = this.isChecked && !this.elDisabled ? this.elActiveColor : this.elInactiveColor;
        style.width = uni.$u.addUnit(this.elSize);
        style.height = uni.$u.addUnit(this.elSize);
        if (this.parentData.iconPlacement === "right") {
          style.marginRight = 0;
        }
        return style;
      },
      checkboxStyle() {
        const style = {};
        if (this.parentData.borderBottom && this.parentData.placement === "row") {
          uni.$u.error("检测到您将borderBottom设置为true，需要同时将u-checkbox-group的placement设置为column才有效");
        }
        if (this.parentData.borderBottom && this.parentData.placement === "column") {
          style.paddingBottom = "8px";
        }
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      }
    },
    mounted() {
      this.init();
    },
    methods: {
      init() {
        this.updateParentData();
        if (!this.parent) {
          uni.$u.error("u-checkbox必须搭配u-checkbox-group组件使用");
        }
        const value = this.parentData.modelValue;
        if (this.checked) {
          this.isChecked = true;
        } else if (uni.$u.test.array(value)) {
          this.isChecked = value.some((item) => {
            return item === this.name;
          });
        }
      },
      updateParentData() {
        this.getParentData("u-checkbox-group");
      },
      // 横向两端排列时，点击组件即可触发选中事件
      wrapperClickHandler(e) {
        this.parentData.iconPlacement === "right" && this.iconClickHandler(e);
      },
      // 点击图标
      iconClickHandler(e) {
        this.preventEvent(e);
        if (!this.elDisabled) {
          this.setRadioCheckedStatus();
        }
      },
      // 点击label
      labelClickHandler(e) {
        this.preventEvent(e);
        if (!this.elLabelDisabled && !this.elDisabled) {
          this.setRadioCheckedStatus();
        }
      },
      emitEvent() {
        this.$emit("change", this.isChecked);
        this.$nextTick(() => {
          uni.$u.formValidate(this, "change");
        });
      },
      // 改变组件选中状态
      // 这里的改变的依据是，更改本组件的checked值为true，同时通过父组件遍历所有u-checkbox实例
      // 将本组件外的其他u-checkbox的checked都设置为false(都被取消选中状态)，因而只剩下一个为选中状态
      setRadioCheckedStatus() {
        this.isChecked = !this.isChecked;
        this.emitEvent();
        typeof this.parent.unCheckedOther === "function" && this.parent.unCheckedOther(this);
      }
    },
    watch: {
      checked() {
        this.isChecked = this.checked;
      }
    }
  };
  function _sfc_render$k(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-checkbox", [`u-checkbox-label--${$data.parentData.iconPlacement}`, $data.parentData.borderBottom && $data.parentData.placement === "column" && "u-border-bottom"]]),
        style: vue.normalizeStyle([$options.checkboxStyle]),
        onClick: _cache[2] || (_cache[2] = vue.withModifiers((...args) => $options.wrapperClickHandler && $options.wrapperClickHandler(...args), ["stop"]))
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["u-checkbox__icon-wrap", $options.iconClasses]),
            onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $options.iconClickHandler && $options.iconClickHandler(...args), ["stop"])),
            style: vue.normalizeStyle([$options.iconWrapStyle])
          },
          [
            vue.renderSlot(_ctx.$slots, "icon", {}, () => [
              vue.createVNode(_component_u_icon, {
                class: "u-checkbox__icon-wrap__icon",
                name: "checkbox-mark",
                size: $options.elIconSize,
                color: $options.elIconColor
              }, null, 8, ["size", "color"])
            ], true)
          ],
          6
          /* CLASS, STYLE */
        ),
        vue.createElementVNode(
          "text",
          {
            onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => $options.labelClickHandler && $options.labelClickHandler(...args), ["stop"])),
            style: vue.normalizeStyle({
              color: $options.elDisabled ? $options.elInactiveColor : $options.elLabelColor,
              fontSize: $options.elLabelSize,
              lineHeight: $options.elLabelSize
            })
          },
          vue.toDisplayString(_ctx.label),
          5
          /* TEXT, STYLE */
        )
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_0$4 = /* @__PURE__ */ _export_sfc(_sfc_main$Z, [["render", _sfc_render$k], ["__scopeId", "data-v-8b7c3dc7"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-checkbox/u-checkbox.vue"]]);
  const props$c = {
    props: {
      // 标识符
      name: {
        type: String,
        default: props$f.checkboxGroup.name
      },
      // 绑定的值
      modelValue: {
        type: Array,
        default: props$f.checkboxGroup.value
      },
      // 形状，circle-圆形，square-方形
      shape: {
        type: String,
        default: props$f.checkboxGroup.shape
      },
      // 是否禁用全部checkbox
      disabled: {
        type: Boolean,
        default: props$f.checkboxGroup.disabled
      },
      // 选中状态下的颜色，如设置此值，将会覆盖parent的activeColor值
      activeColor: {
        type: String,
        default: props$f.checkboxGroup.activeColor
      },
      // 未选中的颜色
      inactiveColor: {
        type: String,
        default: props$f.checkboxGroup.inactiveColor
      },
      // 整个组件的尺寸，默认px
      size: {
        type: [String, Number],
        default: props$f.checkboxGroup.size
      },
      // 布局方式，row-横向，column-纵向
      placement: {
        type: String,
        default: props$f.checkboxGroup.placement
      },
      // label的字体大小，px单位
      labelSize: {
        type: [String, Number],
        default: props$f.checkboxGroup.labelSize
      },
      // label的字体颜色
      labelColor: {
        type: [String],
        default: props$f.checkboxGroup.labelColor
      },
      // 是否禁止点击文本操作
      labelDisabled: {
        type: Boolean,
        default: props$f.checkboxGroup.labelDisabled
      },
      // 图标颜色
      iconColor: {
        type: String,
        default: props$f.checkboxGroup.iconColor
      },
      // 图标的大小，单位px
      iconSize: {
        type: [String, Number],
        default: props$f.checkboxGroup.iconSize
      },
      // 勾选图标的对齐方式，left-左边，right-右边
      iconPlacement: {
        type: String,
        default: props$f.checkboxGroup.iconPlacement
      },
      // 竖向配列时，是否显示下划线
      borderBottom: {
        type: Boolean,
        default: props$f.checkboxGroup.borderBottom
      }
    }
  };
  const _sfc_main$Y = {
    name: "u-checkbox-group",
    mixins: [mpMixin, mixin, props$c],
    computed: {
      // 这里computed的变量，都是子组件u-checkbox需要用到的，由于头条小程序的兼容性差异，子组件无法实时监听父组件参数的变化
      // 所以需要手动通知子组件，这里返回一个parentData变量，供watch监听，在其中去通知每一个子组件重新从父组件(u-checkbox-group)
      // 拉取父组件新的变化后的参数
      parentData() {
        return [
          this.modelValue,
          this.disabled,
          this.inactiveColor,
          this.activeColor,
          this.size,
          this.labelDisabled,
          this.shape,
          this.iconSize,
          this.borderBottom,
          this.placement
        ];
      },
      bemClass() {
        return this.bem("checkbox-group", ["placement"]);
      }
    },
    watch: {
      // 当父组件需要子组件需要共享的参数发生了变化，手动通知子组件
      parentData: {
        handler() {
          if (this.children.length) {
            this.children.map((child) => {
              typeof child.init === "function" && child.init();
            });
          }
        },
        deep: true
      }
    },
    data() {
      return {};
    },
    created() {
      this.children = [];
    },
    emits: ["update:modelValue", "change"],
    methods: {
      // 将其他的checkbox设置为未选中的状态
      unCheckedOther(childInstance) {
        const values = [];
        this.children.map((child) => {
          if (child.isChecked) {
            values.push(child.name);
          }
        });
        this.$emit("change", values);
        this.$emit("update:modelValue", values);
      }
    }
  };
  function _sfc_render$j(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-checkbox-group", $options.bemClass])
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      2
      /* CLASS */
    );
  }
  const __easycom_1$3 = /* @__PURE__ */ _export_sfc(_sfc_main$Y, [["render", _sfc_render$j], ["__scopeId", "data-v-bffd0d93"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-checkbox-group/u-checkbox-group.vue"]]);
  class Http {
    constructor({
      baseURL = "http://192.168.1.246:8082",
      timeout: timeout2 = 1e4,
      // 10秒超时
      headers = { "Content-Type": "application/json" }
    } = {}) {
      this.baseURL = baseURL;
      this.timeout = timeout2;
      this.headers = headers;
      this.requestInterceptors = [];
      this.responseInterceptors = [];
    }
    // 添加请求拦截器，返回 config 或 Promise.reject(error)
    addRequestInterceptor(fn) {
      this.requestInterceptors.push(fn);
    }
    // 添加响应拦截器，返回 response 或 Promise.reject(error)
    addResponseInterceptor(fn) {
      this.responseInterceptors.push(fn);
    }
    // 内部调用请求拦截器
    async runRequestInterceptors(config2) {
      let cfg = { ...config2 };
      for (const interceptor of this.requestInterceptors) {
        cfg = await interceptor(cfg);
      }
      return cfg;
    }
    // 内部调用响应拦截器
    async runResponseInterceptors(response) {
      let res = response;
      for (const interceptor of this.responseInterceptors) {
        res = await interceptor(res);
      }
      return res;
    }
    // 发送请求核心
    async request(url2, options = {}) {
      let config2 = {
        method: "GET",
        headers: { ...this.headers },
        ...options
      };
      const fullUrl = this.baseURL + url2;
      config2 = await this.runRequestInterceptors(config2);
      const controller = new AbortController();
      config2.signal = controller.signal;
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      try {
        const response = await fetch(fullUrl, config2);
        clearTimeout(timeoutId);
        const interceptedResponse = await this.runResponseInterceptors(response);
        if (!interceptedResponse.ok) {
          let errorMsg = `HTTP错误: ${interceptedResponse.status}`;
          try {
            const errJson = await interceptedResponse.json();
            errorMsg = errJson.message || errorMsg;
          } catch {
          }
          const error2 = new Error(errorMsg);
          error2.status = interceptedResponse.status;
          throw error2;
        }
        const contentType = interceptedResponse.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          return interceptedResponse.json();
        } else {
          return interceptedResponse.text();
        }
      } catch (error2) {
        clearTimeout(timeoutId);
        if (error2.name === "AbortError") {
          throw new Error("请求超时或被取消");
        }
        throw error2;
      }
    }
    // GET 请求，支持 params 参数
    get(url2, params = {}, options = {}) {
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = queryString ? `${url2}?${queryString}` : url2;
      return this.request(fullUrl, {
        method: "GET",
        ...options
      });
    }
    // POST 请求，自动序列化 JSON
    post(url2, data = {}, options = {}) {
      const config2 = {
        method: "POST",
        body: JSON.stringify(data),
        ...options
      };
      return this.request(url2, config2);
    }
    put(url2, data = {}, options = {}) {
      const config2 = {
        method: "PUT",
        body: JSON.stringify(data),
        ...options
      };
      return this.request(url2, config2);
    }
    delete(url2, data = {}, options = {}) {
      const config2 = {
        method: "DELETE",
        body: JSON.stringify(data),
        ...options
      };
      return this.request(url2, config2);
    }
  }
  const http = new Http({
    baseURL: "http://ai.sitoai.cn",
    timeout: 15e3
    // 15秒超时
  });
  http.addRequestInterceptor(async (config2) => {
    const token = localStorage.getItem("token") || "";
    if (token) {
      config2.headers["Authorization"] = `Bearer ${token}`;
    }
    return config2;
  });
  http.addResponseInterceptor(async (response) => {
    if (response.status === 401) {
      localStorage.removeItem("token");
      throw new Error("未授权，请重新登录");
    }
    return response;
  });
  const _sfc_main$X = {
    __name: "login",
    setup(__props) {
      const phone = vue.ref("");
      vue.ref(false);
      const countdown = vue.ref(0);
      const selectedAreaCode = vue.ref("86");
      const areaCodes = ["86", "852", "853", "886"];
      const agreeList = vue.ref([]);
      let timer = null;
      function isAgreed() {
        return agreeList.value.includes("agree");
      }
      function onAreaChange(e) {
        selectedAreaCode.value = areaCodes[e.detail.value];
      }
      function getVerifyCode() {
        if (!phone.value) {
          return uni.showToast({ title: "请输入手机号", icon: "none" });
        }
        if (!isAgreed()) {
          return uni.showToast({ title: "请先同意协议", icon: "none" });
        }
        const fullPhone = `+${selectedAreaCode.value} ${phone.value}`;
        var result = http.post("/user/getCaptcha", {
          phonenumber: phone.value
        });
        formatAppLog("log", "at pages/login/login.vue:89", result);
        uni.navigateTo({
          url: `/pages/login/verify?phone=${encodeURIComponent(fullPhone)}`
        });
        countdown.value = 60;
        timer = setInterval(() => {
          countdown.value--;
          if (countdown.value <= 0) {
            clearInterval(timer);
          }
        }, 1e3);
      }
      function openAgreement() {
        uni.navigateTo({ url: "/pages/agreement/user" });
      }
      function openPrivacy() {
        uni.navigateTo({ url: "/pages/agreement/privacy" });
      }
      vue.onUnmounted(() => {
        clearInterval(timer);
      });
      return (_ctx, _cache) => {
        const _component_u_checkbox = resolveEasycom(vue.resolveDynamicComponent("u-checkbox"), __easycom_0$4);
        const _component_u_checkbox_group = resolveEasycom(vue.resolveDynamicComponent("u-checkbox-group"), __easycom_1$3);
        return vue.openBlock(), vue.createElementBlock("view", { class: "login-page" }, [
          vue.createCommentVNode(" 顶部 Logo "),
          vue.createElementVNode("view", { class: "top-logo-row" }, [
            vue.createElementVNode("image", {
              class: "logo",
              src: "/static/logo.png",
              mode: "widthFix"
            })
          ]),
          vue.createCommentVNode(" 标题 "),
          vue.createElementVNode("view", { class: "title" }, "手机号验证码登录"),
          vue.createElementVNode("view", { class: "subtitle" }, "未注册手机号验证后即自动注册账号"),
          vue.createCommentVNode(" 手机号输入区域 "),
          vue.createElementVNode("view", { class: "phone-input-row" }, [
            vue.createElementVNode(
              "picker",
              {
                mode: "selector",
                range: areaCodes,
                onChange: onAreaChange
              },
              [
                vue.createElementVNode(
                  "view",
                  { class: "area-code" },
                  "+" + vue.toDisplayString(selectedAreaCode.value),
                  1
                  /* TEXT */
                )
              ],
              32
              /* HYDRATE_EVENTS */
            ),
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "phone-input",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => phone.value = $event),
                type: "number",
                maxlength: "11",
                placeholder: "请输入手机号"
              },
              null,
              512
              /* NEED_PATCH */
            ), [
              [vue.vModelText, phone.value]
            ])
          ]),
          vue.createCommentVNode(" 获取验证码按钮 "),
          vue.createElementVNode("button", {
            class: "verify-btn",
            disabled: countdown.value > 0,
            onClick: getVerifyCode
          }, vue.toDisplayString(countdown.value > 0 ? `${countdown.value}s后重新获取` : "获取短信验证码"), 9, ["disabled"]),
          vue.createCommentVNode(" 协议勾选 "),
          vue.createElementVNode("view", { class: "agreement-row" }, [
            vue.createVNode(_component_u_checkbox_group, {
              modelValue: agreeList.value,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => agreeList.value = $event)
            }, {
              default: vue.withCtx(() => [
                vue.createVNode(_component_u_checkbox, {
                  name: "agree",
                  shape: "circle",
                  activeColor: "#007AFF"
                })
              ]),
              _: 1
              /* STABLE */
            }, 8, ["modelValue"]),
            vue.createElementVNode("text", { class: "agreement-text" }, [
              vue.createTextVNode(" 我已阅读并同意 "),
              vue.createElementVNode("text", {
                class: "link",
                onClick: openAgreement
              }, "《用户协议》"),
              vue.createTextVNode(" 和 "),
              vue.createElementVNode("text", {
                class: "link",
                onClick: openPrivacy
              }, "《隐私政策》")
            ])
          ])
        ]);
      };
    }
  };
  const PagesLoginLogin = /* @__PURE__ */ _export_sfc(_sfc_main$X, [["__scopeId", "data-v-e4e4508d"], ["__file", "F:/LiveHand/LiveHands/pages/login/login.vue"]]);
  const props$b = {
    props: {
      // 是否展示组件
      show: {
        type: Boolean,
        default: props$f.transition.show
      },
      // 使用的动画模式
      mode: {
        type: String,
        default: props$f.transition.mode
      },
      // 动画的执行时间，单位ms
      duration: {
        type: [String, Number],
        default: props$f.transition.duration
      },
      // 使用的动画过渡函数
      timingFunction: {
        type: String,
        default: props$f.transition.timingFunction
      }
    }
  };
  const getClassNames = (name) => ({
    enter: `u-${name}-enter u-${name}-enter-active`,
    "enter-to": `u-${name}-enter-to u-${name}-enter-active`,
    leave: `u-${name}-leave u-${name}-leave-active`,
    "leave-to": `u-${name}-leave-to u-${name}-leave-active`
  });
  const transition = {
    methods: {
      // 组件被点击发出事件
      clickHandler() {
        this.$emit("click");
      },
      // vue版本的组件进场处理
      vueEnter() {
        const classNames = getClassNames(this.mode);
        this.status = "enter";
        this.$emit("beforeEnter");
        this.inited = true;
        this.display = true;
        this.classes = classNames.enter;
        this.$nextTick(async () => {
          this.$emit("enter");
          this.transitionEnded = false;
          this.$emit("afterEnter");
          this.classes = classNames["enter-to"];
        });
      },
      // 动画离场处理
      vueLeave() {
        if (!this.display)
          return;
        const classNames = getClassNames(this.mode);
        this.status = "leave";
        this.$emit("beforeLeave");
        this.classes = classNames.leave;
        this.$nextTick(() => {
          this.transitionEnded = false;
          this.$emit("leave");
          setTimeout(this.onTransitionEnd, this.duration);
          this.classes = classNames["leave-to"];
        });
      },
      // 完成过渡后触发
      onTransitionEnd() {
        if (this.transitionEnded)
          return;
        this.transitionEnded = true;
        this.$emit(this.status === "leave" ? "afterLeave" : "afterEnter");
        if (!this.show && this.display) {
          this.display = false;
          this.inited = false;
        }
      }
    }
  };
  const _sfc_main$W = {
    name: "u-transition",
    data() {
      return {
        inited: false,
        // 是否显示/隐藏组件
        viewStyle: {},
        // 组件内部的样式
        status: "",
        // 记录组件动画的状态
        transitionEnded: false,
        // 组件是否结束的标记
        display: false,
        // 组件是否展示
        classes: ""
        // 应用的类名
      };
    },
    computed: {
      mergeStyle() {
        const { viewStyle, customStyle } = this;
        return {
          transitionDuration: `${this.duration}ms`,
          // display: `${this.display ? '' : 'none'}`,
          transitionTimingFunction: this.timingFunction,
          // 避免自定义样式影响到动画属性，所以写在viewStyle前面
          ...uni.$u.addStyle(customStyle),
          ...viewStyle
        };
      }
    },
    // 将mixin挂在到组件中，uni.$u.mixin实际上为一个vue格式对象
    mixins: [mpMixin, mixin, transition, props$b],
    watch: {
      show: {
        handler(newVal) {
          newVal ? this.vueEnter() : this.vueLeave();
        },
        // 表示同时监听初始化时的props的show的意思
        immediate: true
      }
    }
  };
  function _sfc_render$i(_ctx, _cache, $props, $setup, $data, $options) {
    return $data.inited ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["u-transition", $data.classes]),
        ref: "u-transition",
        onClick: _cache[0] || (_cache[0] = (...args) => _ctx.clickHandler && _ctx.clickHandler(...args)),
        style: vue.normalizeStyle([$options.mergeStyle]),
        onTouchmove: _cache[1] || (_cache[1] = (...args) => _ctx.noop && _ctx.noop(...args))
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      38
      /* CLASS, STYLE, HYDRATE_EVENTS */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_4$1 = /* @__PURE__ */ _export_sfc(_sfc_main$W, [["render", _sfc_render$i], ["__scopeId", "data-v-e9c9b9ef"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-transition/u-transition.vue"]]);
  const props$a = {
    props: {
      // 标签类型info、primary、success、warning、error
      type: {
        type: String,
        default: props$f.tag.type
      },
      // 不可用
      disabled: {
        type: [Boolean, String],
        default: props$f.tag.disabled
      },
      // 标签的大小，large，medium，mini
      size: {
        type: String,
        default: props$f.tag.size
      },
      // tag的形状，circle（两边半圆形）, square（方形，带圆角）
      shape: {
        type: String,
        default: props$f.tag.shape
      },
      // 标签文字
      text: {
        type: [String, Number],
        default: props$f.tag.text
      },
      // 背景颜色，默认为空字符串，即不处理
      bgColor: {
        type: String,
        default: props$f.tag.bgColor
      },
      // 标签字体颜色，默认为空字符串，即不处理
      color: {
        type: String,
        default: props$f.tag.color
      },
      // 标签的边框颜色
      borderColor: {
        type: String,
        default: props$f.tag.borderColor
      },
      // 关闭按钮图标的颜色
      closeColor: {
        type: String,
        default: props$f.tag.closeColor
      },
      // 点击时返回的索引值，用于区分例遍的数组哪个元素被点击了
      name: {
        type: [String, Number],
        default: props$f.tag.name
      },
      // // 模式选择，dark|light|plain
      // mode: {
      // 	type: String,
      // 	default: 'light'
      // },
      // 镂空时是否填充背景色
      plainFill: {
        type: Boolean,
        default: props$f.tag.plainFill
      },
      // 是否镂空
      plain: {
        type: Boolean,
        default: props$f.tag.plain
      },
      // 是否可关闭
      closable: {
        type: Boolean,
        default: props$f.tag.closable
      },
      // 是否显示
      show: {
        type: Boolean,
        default: props$f.tag.show
      },
      // 内置图标，或绝对路径的图片
      icon: {
        type: String,
        default: props$f.tag.icon
      }
    }
  };
  const _sfc_main$V = {
    name: "u-tag",
    mixins: [mpMixin, mixin, props$a],
    data() {
      return {};
    },
    computed: {
      style() {
        const style = {};
        if (this.bgColor) {
          style.backgroundColor = this.bgColor;
        }
        if (this.color) {
          style.color = this.color;
        }
        if (this.borderColor) {
          style.borderColor = this.borderColor;
        }
        return style;
      },
      // nvue下，文本颜色无法继承父元素
      textColor() {
        const style = {};
        if (this.color) {
          style.color = this.color;
        }
        return style;
      },
      imgStyle() {
        const width = this.size === "large" ? "17px" : this.size === "medium" ? "15px" : "13px";
        return {
          width,
          height: width
        };
      },
      // 文本的样式
      closeSize() {
        const size = this.size === "large" ? 15 : this.size === "medium" ? 13 : 12;
        return size;
      },
      // 图标大小
      iconSize() {
        const size = this.size === "large" ? 21 : this.size === "medium" ? 19 : 16;
        return size;
      },
      // 图标颜色
      elIconColor() {
        return this.iconColor ? this.iconColor : this.plain ? this.type : "#ffffff";
      }
    },
    methods: {
      // 点击关闭按钮
      closeHandler() {
        this.$emit("close", this.name);
      },
      // 点击标签
      clickHandler() {
        this.$emit("click", this.name);
      }
    }
  };
  function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
    const _component_u_transition = resolveEasycom(vue.resolveDynamicComponent("u-transition"), __easycom_4$1);
    return vue.openBlock(), vue.createBlock(_component_u_transition, {
      mode: "fade",
      show: _ctx.show,
      style: { "display": "inline-flex" }
    }, {
      default: vue.withCtx(() => [
        vue.createElementVNode("view", { class: "u-tag-wrapper" }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["u-tag", [`u-tag--${_ctx.shape}`, !_ctx.plain && `u-tag--${_ctx.type}`, _ctx.plain && `u-tag--${_ctx.type}--plain`, `u-tag--${_ctx.size}`, _ctx.plain && _ctx.plainFill && `u-tag--${_ctx.type}--plain--fill`]]),
              onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $options.clickHandler && $options.clickHandler(...args), ["stop"])),
              style: vue.normalizeStyle([{
                marginRight: _ctx.closable ? "10px" : 0,
                marginTop: _ctx.closable ? "10px" : 0
              }, $options.style])
            },
            [
              vue.renderSlot(_ctx.$slots, "icon", {}, () => [
                _ctx.icon ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "u-tag__icon"
                }, [
                  _ctx.$u.test.image(_ctx.icon) ? (vue.openBlock(), vue.createElementBlock("image", {
                    key: 0,
                    src: _ctx.icon,
                    style: vue.normalizeStyle([$options.imgStyle])
                  }, null, 12, ["src"])) : (vue.openBlock(), vue.createBlock(_component_u_icon, {
                    key: 1,
                    color: $options.elIconColor,
                    name: _ctx.icon,
                    size: $options.iconSize
                  }, null, 8, ["color", "name", "size"]))
                ])) : vue.createCommentVNode("v-if", true)
              ], true),
              vue.createElementVNode(
                "text",
                {
                  class: vue.normalizeClass(["u-tag__text", [`u-tag__text--${_ctx.type}`, _ctx.plain && `u-tag__text--${_ctx.type}--plain`, `u-tag__text--${_ctx.size}`]]),
                  style: vue.normalizeStyle([$options.textColor])
                },
                vue.toDisplayString(_ctx.text),
                7
                /* TEXT, CLASS, STYLE */
              )
            ],
            6
            /* CLASS, STYLE */
          ),
          _ctx.closable ? (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 0,
              class: vue.normalizeClass(["u-tag__close", [`u-tag__close--${_ctx.size}`]]),
              onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => $options.closeHandler && $options.closeHandler(...args), ["stop"])),
              style: vue.normalizeStyle({ backgroundColor: _ctx.closeColor })
            },
            [
              vue.createVNode(_component_u_icon, {
                name: "close",
                size: $options.closeSize,
                color: "#ffffff"
              }, null, 8, ["size"])
            ],
            6
            /* CLASS, STYLE */
          )) : vue.createCommentVNode("v-if", true)
        ])
      ]),
      _: 3
      /* FORWARDED */
    }, 8, ["show"]);
  }
  const __easycom_1$2 = /* @__PURE__ */ _export_sfc(_sfc_main$V, [["render", _sfc_render$h], ["__scopeId", "data-v-26344075"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-tag/u-tag.vue"]]);
  const props$9 = {
    props: {
      color: {
        type: String,
        default: props$f.line.color
      },
      // 长度，竖向时表现为高度，横向时表现为长度，可以为百分比，带px单位的值等
      length: {
        type: [String, Number],
        default: props$f.line.length
      },
      // 线条方向，col-竖向，row-横向
      direction: {
        type: String,
        default: props$f.line.direction
      },
      // 是否显示细边框
      hairline: {
        type: Boolean,
        default: props$f.line.hairline
      },
      // 线条与上下左右元素的间距，字符串形式，如"30px"、"20px 30px"
      margin: {
        type: [String, Number],
        default: props$f.line.margin
      },
      // 是否虚线，true-虚线，false-实线
      dashed: {
        type: Boolean,
        default: props$f.line.dashed
      }
    }
  };
  const _sfc_main$U = {
    name: "u-line",
    mixins: [mpMixin, mixin, props$9],
    computed: {
      lineStyle() {
        const style = {};
        style.margin = this.margin;
        if (this.direction === "row") {
          style.borderBottomWidth = "1px";
          style.borderBottomStyle = this.dashed ? "dashed" : "solid";
          style.width = uni.$u.addUnit(this.length);
          if (this.hairline)
            style.transform = "scaleY(0.5)";
        } else {
          style.borderLeftWidth = "1px";
          style.borderLeftStyle = this.dashed ? "dashed" : "solid";
          style.height = uni.$u.addUnit(this.length);
          if (this.hairline)
            style.transform = "scaleX(0.5)";
        }
        style.borderColor = this.color;
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      }
    }
  };
  function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "u-line",
        style: vue.normalizeStyle([$options.lineStyle])
      },
      null,
      4
      /* STYLE */
    );
  }
  const __easycom_0$3 = /* @__PURE__ */ _export_sfc(_sfc_main$U, [["render", _sfc_render$g], ["__scopeId", "data-v-9bcb2aa0"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-line/u-line.vue"]]);
  const props$8 = {
    props: {
      // 是否显示组件
      show: {
        type: Boolean,
        default: props$f.loadingIcon.show
      },
      // 颜色
      color: {
        type: String,
        default: props$f.loadingIcon.color
      },
      // 提示文字颜色
      textColor: {
        type: String,
        default: props$f.loadingIcon.textColor
      },
      // 文字和图标是否垂直排列
      vertical: {
        type: Boolean,
        default: props$f.loadingIcon.vertical
      },
      // 模式选择，circle-圆形，spinner-花朵形，semicircle-半圆形
      mode: {
        type: String,
        default: props$f.loadingIcon.mode
      },
      // 图标大小，单位默认px
      size: {
        type: [String, Number],
        default: props$f.loadingIcon.size
      },
      // 文字大小
      textSize: {
        type: [String, Number],
        default: props$f.loadingIcon.textSize
      },
      // 文字内容
      text: {
        type: [String, Number],
        default: props$f.loadingIcon.text
      },
      // 动画模式
      timingFunction: {
        type: String,
        default: props$f.loadingIcon.timingFunction
      },
      // 动画执行周期时间
      duration: {
        type: [String, Number],
        default: props$f.loadingIcon.duration
      },
      // mode=circle时的暗边颜色
      inactiveColor: {
        type: String,
        default: props$f.loadingIcon.inactiveColor
      }
    }
  };
  const _sfc_main$T = {
    name: "u-loading-icon",
    mixins: [mpMixin, mixin, props$8],
    data() {
      return {
        // Array.form可以通过一个伪数组对象创建指定长度的数组
        // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/from
        array12: Array.from({
          length: 12
        }),
        // 这里需要设置默认值为360，否则在安卓nvue上，会延迟一个duration周期后才执行
        // 在iOS nvue上，则会一开始默认执行两个周期的动画
        aniAngel: 360,
        // 动画旋转角度
        webviewHide: false,
        // 监听webview的状态，如果隐藏了页面，则停止动画，以免性能消耗
        loading: false
        // 是否运行中，针对nvue使用
      };
    },
    computed: {
      // 当为circle类型时，给其另外三边设置一个更轻一些的颜色
      // 之所以需要这么做的原因是，比如父组件传了color为红色，那么需要另外的三个边为浅红色
      // 而不能是固定的某一个其他颜色(因为这个固定的颜色可能浅蓝，导致效果没有那么细腻良好)
      otherBorderColor() {
        const lightColor = uni.$u.colorGradient(this.color, "#ffffff", 100)[80];
        if (this.mode === "circle") {
          return this.inactiveColor ? this.inactiveColor : lightColor;
        } else {
          return "transparent";
        }
      }
    },
    watch: {
      show(n) {
      }
    },
    mounted() {
      this.init();
    },
    methods: {
      init() {
        setTimeout(() => {
          this.show && this.addEventListenerToWebview();
        }, 20);
      },
      // 监听webview的显示与隐藏
      addEventListenerToWebview() {
        const pages2 = getCurrentPages();
        const page2 = pages2[pages2.length - 1];
        const currentWebview = page2.$getAppWebview();
        currentWebview.addEventListener("hide", () => {
          this.webviewHide = true;
        });
        currentWebview.addEventListener("show", () => {
          this.webviewHide = false;
        });
      }
    }
  };
  function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
    return _ctx.show ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["u-loading-icon", [_ctx.vertical && "u-loading-icon--vertical"]]),
        style: vue.normalizeStyle([_ctx.$u.addStyle(_ctx.customStyle)])
      },
      [
        !$data.webviewHide ? (vue.openBlock(), vue.createElementBlock(
          "view",
          {
            key: 0,
            class: vue.normalizeClass(["u-loading-icon__spinner", [`u-loading-icon__spinner--${_ctx.mode}`]]),
            ref: "ani",
            style: vue.normalizeStyle({
              color: _ctx.color,
              width: _ctx.$u.addUnit(_ctx.size),
              height: _ctx.$u.addUnit(_ctx.size),
              borderTopColor: _ctx.color,
              borderBottomColor: $options.otherBorderColor,
              borderLeftColor: $options.otherBorderColor,
              borderRightColor: $options.otherBorderColor,
              "animation-duration": `${_ctx.duration}ms`,
              "animation-timing-function": _ctx.mode === "semicircle" || _ctx.mode === "circle" ? _ctx.timingFunction : ""
            })
          },
          [
            _ctx.mode === "spinner" ? (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              { key: 0 },
              vue.renderList($data.array12, (item, index2) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index2,
                  class: "u-loading-icon__dot"
                });
              }),
              128
              /* KEYED_FRAGMENT */
            )) : vue.createCommentVNode("v-if", true)
          ],
          6
          /* CLASS, STYLE */
        )) : vue.createCommentVNode("v-if", true),
        _ctx.text ? (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 1,
            class: "u-loading-icon__text",
            style: vue.normalizeStyle({
              fontSize: _ctx.$u.addUnit(_ctx.textSize),
              color: _ctx.textColor
            })
          },
          vue.toDisplayString(_ctx.text),
          5
          /* TEXT, STYLE */
        )) : vue.createCommentVNode("v-if", true)
      ],
      6
      /* CLASS, STYLE */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_0$2 = /* @__PURE__ */ _export_sfc(_sfc_main$T, [["render", _sfc_render$f], ["__scopeId", "data-v-c3ec5695"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-loading-icon/u-loading-icon.vue"]]);
  const props$7 = {
    props: {
      // 是否显示遮罩
      show: {
        type: Boolean,
        default: props$f.overlay.show
      },
      // 层级z-index
      zIndex: {
        type: [String, Number],
        default: props$f.overlay.zIndex
      },
      // 遮罩的过渡时间，单位为ms
      duration: {
        type: [String, Number],
        default: props$f.overlay.duration
      },
      // 不透明度值，当做rgba的第四个参数
      opacity: {
        type: [String, Number],
        default: props$f.overlay.opacity
      }
    }
  };
  const _sfc_main$S = {
    name: "u-overlay",
    mixins: [mpMixin, mixin, props$7],
    computed: {
      overlayStyle() {
        const style = {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: this.zIndex,
          bottom: 0,
          "background-color": `rgba(0, 0, 0, ${this.opacity})`
        };
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      }
    },
    methods: {
      clickHandler() {
        this.$emit("click");
      }
    }
  };
  function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_transition = resolveEasycom(vue.resolveDynamicComponent("u-transition"), __easycom_4$1);
    return vue.openBlock(), vue.createBlock(_component_u_transition, {
      show: _ctx.show,
      "custom-class": "u-overlay",
      duration: _ctx.duration,
      "custom-style": $options.overlayStyle,
      onClick: $options.clickHandler
    }, {
      default: vue.withCtx(() => [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ]),
      _: 3
      /* FORWARDED */
    }, 8, ["show", "duration", "custom-style", "onClick"]);
  }
  const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$S, [["render", _sfc_render$e], ["__scopeId", "data-v-38c77267"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-overlay/u-overlay.vue"]]);
  const props$6 = {
    props: {
      bgColor: {
        type: String,
        default: props$f.statusBar.bgColor
      }
    }
  };
  const _sfc_main$R = {
    name: "u-status-bar",
    mixins: [mpMixin, mixin, props$6],
    data() {
      return {};
    },
    computed: {
      style() {
        const style = {};
        style.height = uni.$u.addUnit(uni.$u.sys().statusBarHeight, "px");
        style.backgroundColor = this.bgColor;
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      }
    }
  };
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        style: vue.normalizeStyle([$options.style]),
        class: "u-status-bar"
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      4
      /* STYLE */
    );
  }
  const __easycom_1$1 = /* @__PURE__ */ _export_sfc(_sfc_main$R, [["render", _sfc_render$d], ["__scopeId", "data-v-7dbb0f3a"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-status-bar/u-status-bar.vue"]]);
  const props$5 = {
    props: {}
  };
  const _sfc_main$Q = {
    name: "u-safe-bottom",
    mixins: [mpMixin, mixin, props$5],
    data() {
      return {
        safeAreaBottomHeight: 0,
        isNvue: false
      };
    },
    computed: {
      style() {
        const style = {};
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      }
    },
    mounted() {
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-safe-bottom", [!$data.isNvue && "u-safe-area-inset-bottom"]]),
        style: vue.normalizeStyle([$options.style])
      },
      null,
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_3$1 = /* @__PURE__ */ _export_sfc(_sfc_main$Q, [["render", _sfc_render$c], ["__scopeId", "data-v-82d264d4"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-safe-bottom/u-safe-bottom.vue"]]);
  const props$4 = {
    props: {
      // 是否展示弹窗
      show: {
        type: Boolean,
        default: props$f.popup.show
      },
      // 是否显示遮罩
      overlay: {
        type: Boolean,
        default: props$f.popup.overlay
      },
      // 弹出的方向，可选值为 top bottom right left center
      mode: {
        type: String,
        default: props$f.popup.mode
      },
      // 动画时长，单位ms
      duration: {
        type: [String, Number],
        default: props$f.popup.duration
      },
      // 是否显示关闭图标
      closeable: {
        type: Boolean,
        default: props$f.popup.closeable
      },
      // 自定义遮罩的样式
      overlayStyle: {
        type: [Object, String],
        default: props$f.popup.overlayStyle
      },
      // 点击遮罩是否关闭弹窗
      closeOnClickOverlay: {
        type: Boolean,
        default: props$f.popup.closeOnClickOverlay
      },
      // 层级
      zIndex: {
        type: [String, Number],
        default: props$f.popup.zIndex
      },
      // 是否为iPhoneX留出底部安全距离
      safeAreaInsetBottom: {
        type: Boolean,
        default: props$f.popup.safeAreaInsetBottom
      },
      // 是否留出顶部安全距离（状态栏高度）
      safeAreaInsetTop: {
        type: Boolean,
        default: props$f.popup.safeAreaInsetTop
      },
      // 自定义关闭图标位置，top-left为左上角，top-right为右上角，bottom-left为左下角，bottom-right为右下角
      closeIconPos: {
        type: String,
        default: props$f.popup.closeIconPos
      },
      // 是否显示圆角
      round: {
        type: [Boolean, String, Number],
        default: props$f.popup.round
      },
      // mode=center，也即中部弹出时，是否使用缩放模式
      zoom: {
        type: Boolean,
        default: props$f.popup.zoom
      },
      // 弹窗背景色，设置为transparent可去除白色背景
      bgColor: {
        type: String,
        default: props$f.popup.bgColor
      },
      // 遮罩的透明度，0-1之间
      overlayOpacity: {
        type: [Number, String],
        default: props$f.popup.overlayOpacity
      }
    }
  };
  const _sfc_main$P = {
    name: "u-popup",
    mixins: [mpMixin, mixin, props$4],
    data() {
      return {
        overlayDuration: this.duration + 50
      };
    },
    watch: {
      show(newValue, oldValue) {
      }
    },
    computed: {
      transitionStyle() {
        const style = {
          zIndex: this.zIndex,
          position: "fixed",
          display: "flex"
        };
        style[this.mode] = 0;
        if (this.mode === "left") {
          return uni.$u.deepMerge(style, {
            bottom: 0,
            top: 0
          });
        } else if (this.mode === "right") {
          return uni.$u.deepMerge(style, {
            bottom: 0,
            top: 0
          });
        } else if (this.mode === "top") {
          return uni.$u.deepMerge(style, {
            left: 0,
            right: 0
          });
        } else if (this.mode === "bottom") {
          return uni.$u.deepMerge(style, {
            left: 0,
            right: 0
          });
        } else if (this.mode === "center") {
          return uni.$u.deepMerge(style, {
            alignItems: "center",
            "justify-content": "center",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          });
        }
      },
      contentStyle() {
        const style = {};
        uni.$u.sys();
        if (this.mode !== "center") {
          style.flex = 1;
        }
        if (this.bgColor) {
          style.backgroundColor = this.bgColor;
        }
        if (this.round) {
          const value = uni.$u.addUnit(this.round);
          if (this.mode === "top") {
            style.borderBottomLeftRadius = value;
            style.borderBottomRightRadius = value;
          } else if (this.mode === "bottom") {
            style.borderTopLeftRadius = value;
            style.borderTopRightRadius = value;
          } else if (this.mode === "center") {
            style.borderRadius = value;
          }
        }
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      },
      position() {
        if (this.mode === "center") {
          return this.zoom ? "fade-zoom" : "fade";
        }
        if (this.mode === "left") {
          return "slide-left";
        }
        if (this.mode === "right") {
          return "slide-right";
        }
        if (this.mode === "bottom") {
          return "slide-up";
        }
        if (this.mode === "top") {
          return "slide-down";
        }
      }
    },
    methods: {
      // 点击遮罩
      overlayClick() {
        if (this.closeOnClickOverlay) {
          this.$emit("close");
        }
      },
      close(e) {
        this.$emit("close");
      },
      afterEnter() {
        this.$emit("open");
      },
      clickHandler() {
        if (this.mode === "center") {
          this.overlayClick();
        }
        this.$emit("click");
      }
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_overlay = resolveEasycom(vue.resolveDynamicComponent("u-overlay"), __easycom_0$1);
    const _component_u_status_bar = resolveEasycom(vue.resolveDynamicComponent("u-status-bar"), __easycom_1$1);
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
    const _component_u_safe_bottom = resolveEasycom(vue.resolveDynamicComponent("u-safe-bottom"), __easycom_3$1);
    const _component_u_transition = resolveEasycom(vue.resolveDynamicComponent("u-transition"), __easycom_4$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "u-popup" }, [
      _ctx.overlay ? (vue.openBlock(), vue.createBlock(_component_u_overlay, {
        key: 0,
        show: _ctx.show,
        onClick: $options.overlayClick,
        duration: $data.overlayDuration,
        customStyle: _ctx.overlayStyle,
        opacity: _ctx.overlayOpacity
      }, null, 8, ["show", "onClick", "duration", "customStyle", "opacity"])) : vue.createCommentVNode("v-if", true),
      vue.createVNode(_component_u_transition, {
        show: _ctx.show,
        customStyle: $options.transitionStyle,
        mode: $options.position,
        duration: _ctx.duration,
        onAfterEnter: $options.afterEnter,
        onClick: $options.clickHandler
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode(
            "view",
            {
              class: "u-popup__content",
              style: vue.normalizeStyle([$options.contentStyle]),
              onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => _ctx.noop && _ctx.noop(...args), ["stop"]))
            },
            [
              _ctx.safeAreaInsetTop ? (vue.openBlock(), vue.createBlock(_component_u_status_bar, { key: 0 })) : vue.createCommentVNode("v-if", true),
              vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
              _ctx.closeable ? (vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  key: 1,
                  onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $options.close && $options.close(...args), ["stop"])),
                  class: vue.normalizeClass(["u-popup__content__close", ["u-popup__content__close--" + _ctx.closeIconPos]]),
                  "hover-class": "u-popup__content__close--hover",
                  "hover-stay-time": "150"
                },
                [
                  vue.createVNode(_component_u_icon, {
                    name: "close",
                    color: "#909399",
                    size: "18",
                    bold: ""
                  })
                ],
                2
                /* CLASS */
              )) : vue.createCommentVNode("v-if", true),
              _ctx.safeAreaInsetBottom ? (vue.openBlock(), vue.createBlock(_component_u_safe_bottom, { key: 2 })) : vue.createCommentVNode("v-if", true)
            ],
            4
            /* STYLE */
          )
        ]),
        _: 3
        /* FORWARDED */
      }, 8, ["show", "customStyle", "mode", "duration", "onAfterEnter", "onClick"])
    ]);
  }
  const __easycom_3 = /* @__PURE__ */ _export_sfc(_sfc_main$P, [["render", _sfc_render$b], ["__scopeId", "data-v-5f94edb8"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-popup/u-popup.vue"]]);
  const props$3 = {
    props: {
      // 是否展示modal
      show: {
        type: Boolean,
        default: props$f.modal.show
      },
      // 标题
      title: {
        type: [String],
        default: props$f.modal.title
      },
      // 弹窗内容
      content: {
        type: String,
        default: props$f.modal.content
      },
      // 确认文案
      confirmText: {
        type: String,
        default: props$f.modal.confirmText
      },
      // 取消文案
      cancelText: {
        type: String,
        default: props$f.modal.cancelText
      },
      // 是否显示确认按钮
      showConfirmButton: {
        type: Boolean,
        default: props$f.modal.showConfirmButton
      },
      // 是否显示取消按钮
      showCancelButton: {
        type: Boolean,
        default: props$f.modal.showCancelButton
      },
      // 确认按钮颜色
      confirmColor: {
        type: String,
        default: props$f.modal.confirmColor
      },
      // 取消文字颜色
      cancelColor: {
        type: String,
        default: props$f.modal.cancelColor
      },
      // 对调确认和取消的位置
      buttonReverse: {
        type: Boolean,
        default: props$f.modal.buttonReverse
      },
      // 是否开启缩放效果
      zoom: {
        type: Boolean,
        default: props$f.modal.zoom
      },
      // 是否异步关闭，只对确定按钮有效
      asyncClose: {
        type: Boolean,
        default: props$f.modal.asyncClose
      },
      // 是否允许点击遮罩关闭modal
      closeOnClickOverlay: {
        type: Boolean,
        default: props$f.modal.closeOnClickOverlay
      },
      // 给一个负的margin-top，往上偏移，避免和键盘重合的情况
      negativeTop: {
        type: [String, Number],
        default: props$f.modal.negativeTop
      },
      // modal宽度，不支持百分比，可以数值，px，rpx单位
      width: {
        type: [String, Number],
        default: props$f.modal.width
      },
      // 确认按钮的样式，circle-圆形，square-方形，如设置，将不会显示取消按钮
      confirmButtonShape: {
        type: String,
        default: props$f.modal.confirmButtonShape
      }
    }
  };
  const _sfc_main$O = {
    name: "u-modal",
    mixins: [mpMixin, mixin, props$3],
    data() {
      return {
        loading: false
      };
    },
    watch: {
      show(n) {
        if (n && this.loading)
          this.loading = false;
      }
    },
    methods: {
      // 点击确定按钮
      confirmHandler() {
        if (this.asyncClose) {
          this.loading = true;
        }
        this.$emit("confirm");
      },
      // 点击取消按钮
      cancelHandler() {
        this.$emit("cancel");
      },
      // 点击遮罩
      // 从原理上来说，modal的遮罩点击，并不是真的点击到了遮罩
      // 因为modal依赖于popup的中部弹窗类型，中部弹窗比较特殊，虽有然遮罩，但是为了让弹窗内容能flex居中
      // 多了一个透明的遮罩，此透明的遮罩会覆盖在灰色的遮罩上，所以实际上是点击不到灰色遮罩的，popup内部在
      // 透明遮罩的子元素做了.stop处理，所以点击内容区，也不会导致误触发
      clickHandler() {
        if (this.closeOnClickOverlay) {
          this.$emit("close");
        }
      }
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_line = resolveEasycom(vue.resolveDynamicComponent("u-line"), __easycom_0$3);
    const _component_u_loading_icon = resolveEasycom(vue.resolveDynamicComponent("u-loading-icon"), __easycom_0$2);
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
    return vue.openBlock(), vue.createBlock(_component_u_popup, {
      mode: "center",
      zoom: _ctx.zoom,
      show: _ctx.show,
      customStyle: {
        borderRadius: "6px",
        overflow: "hidden",
        marginTop: `-${_ctx.$u.addUnit(_ctx.negativeTop)}`
      },
      closeOnClickOverlay: _ctx.closeOnClickOverlay,
      safeAreaInsetBottom: false,
      duration: 400,
      onClick: $options.clickHandler
    }, {
      default: vue.withCtx(() => [
        vue.createElementVNode(
          "view",
          {
            class: "u-modal",
            style: vue.normalizeStyle({
              width: _ctx.$u.addUnit(_ctx.width)
            })
          },
          [
            _ctx.title ? (vue.openBlock(), vue.createElementBlock(
              "text",
              {
                key: 0,
                class: "u-modal__title"
              },
              vue.toDisplayString(_ctx.title),
              1
              /* TEXT */
            )) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode(
              "view",
              {
                class: "u-modal__content",
                style: vue.normalizeStyle({
                  paddingTop: `${_ctx.title ? 12 : 25}px`
                })
              },
              [
                vue.renderSlot(_ctx.$slots, "default", {}, () => [
                  vue.createElementVNode(
                    "text",
                    { class: "u-modal__content__text" },
                    vue.toDisplayString(_ctx.content),
                    1
                    /* TEXT */
                  )
                ], true)
              ],
              4
              /* STYLE */
            ),
            _ctx.$slots.confirmButton ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "u-modal__button-group--confirm-button"
            }, [
              vue.renderSlot(_ctx.$slots, "confirmButton", {}, void 0, true)
            ])) : (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              { key: 2 },
              [
                vue.createVNode(_component_u_line),
                vue.createElementVNode(
                  "view",
                  {
                    class: "u-modal__button-group",
                    style: vue.normalizeStyle({
                      flexDirection: _ctx.buttonReverse ? "row-reverse" : "row"
                    })
                  },
                  [
                    _ctx.showCancelButton ? (vue.openBlock(), vue.createElementBlock(
                      "view",
                      {
                        key: 0,
                        class: vue.normalizeClass(["u-modal__button-group__wrapper u-modal__button-group__wrapper--cancel", [_ctx.showCancelButton && !_ctx.showConfirmButton && "u-modal__button-group__wrapper--only-cancel"]]),
                        "hover-stay-time": 150,
                        "hover-class": "u-modal__button-group__wrapper--hover",
                        onClick: _cache[0] || (_cache[0] = (...args) => $options.cancelHandler && $options.cancelHandler(...args))
                      },
                      [
                        vue.createElementVNode(
                          "text",
                          {
                            class: "u-modal__button-group__wrapper__text",
                            style: vue.normalizeStyle({
                              color: _ctx.cancelColor
                            })
                          },
                          vue.toDisplayString(_ctx.cancelText),
                          5
                          /* TEXT, STYLE */
                        )
                      ],
                      2
                      /* CLASS */
                    )) : vue.createCommentVNode("v-if", true),
                    _ctx.showConfirmButton && _ctx.showCancelButton ? (vue.openBlock(), vue.createBlock(_component_u_line, {
                      key: 1,
                      direction: "column"
                    })) : vue.createCommentVNode("v-if", true),
                    _ctx.showConfirmButton ? (vue.openBlock(), vue.createElementBlock(
                      "view",
                      {
                        key: 2,
                        class: vue.normalizeClass(["u-modal__button-group__wrapper u-modal__button-group__wrapper--confirm", [!_ctx.showCancelButton && _ctx.showConfirmButton && "u-modal__button-group__wrapper--only-confirm"]]),
                        "hover-stay-time": 150,
                        "hover-class": "u-modal__button-group__wrapper--hover",
                        onClick: _cache[1] || (_cache[1] = (...args) => $options.confirmHandler && $options.confirmHandler(...args))
                      },
                      [
                        $data.loading ? (vue.openBlock(), vue.createBlock(_component_u_loading_icon, { key: 0 })) : (vue.openBlock(), vue.createElementBlock(
                          "text",
                          {
                            key: 1,
                            class: "u-modal__button-group__wrapper__text",
                            style: vue.normalizeStyle({
                              color: _ctx.confirmColor
                            })
                          },
                          vue.toDisplayString(_ctx.confirmText),
                          5
                          /* TEXT, STYLE */
                        ))
                      ],
                      2
                      /* CLASS */
                    )) : vue.createCommentVNode("v-if", true)
                  ],
                  4
                  /* STYLE */
                )
              ],
              64
              /* STABLE_FRAGMENT */
            ))
          ],
          4
          /* STYLE */
        )
      ]),
      _: 3
      /* FORWARDED */
    }, 8, ["zoom", "show", "customStyle", "closeOnClickOverlay", "onClick"]);
  }
  const __easycom_4 = /* @__PURE__ */ _export_sfc(_sfc_main$O, [["render", _sfc_render$a], ["__scopeId", "data-v-ce0c51d9"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-modal/u-modal.vue"]]);
  const _sfc_main$N = {
    __name: "NoteCard",
    props: {
      title: { type: String, default: "无标题笔记" },
      time: { type: String, default: "2025-06-26" },
      content: { type: String, default: "这里是笔记的内容区域，超过部分会被省略显示，保持卡片整洁。" },
      repo: { type: String, default: "默认知识库" },
      tags: {
        type: Array,
        default: () => [
          { text: "标签一", type: "warning" },
          { text: "标签二", type: "success" },
          { text: "标签三", type: "primary" }
        ]
      }
    },
    setup(__props) {
      const props2 = __props;
      const showSetting = vue.ref(false);
      const showTags = vue.ref(false);
      const showDelete = vue.ref(false);
      function openDetails() {
        formatAppLog("log", "at components/cards/NoteCard.vue:107", "666");
        uni.navigateTo({
          url: `/pages/details/NoteDetails/NoteDetails?title=${encodeURIComponent(props2.title)}&time=${props2.time}&content=${encodeURIComponent(props2.content)}&repo=${encodeURIComponent(props2.repo)}&tags=${encodeURIComponent(JSON.stringify(props2.tags))}`
        });
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_tag = resolveEasycom(vue.resolveDynamicComponent("u-tag"), __easycom_1$2);
        const _component_u_modal = resolveEasycom(vue.resolveDynamicComponent("u-modal"), __easycom_4);
        return vue.openBlock(), vue.createElementBlock("div", { class: "note-card" }, [
          vue.createCommentVNode(" 顶部信息 "),
          vue.createElementVNode("div", { class: "note-top" }, [
            vue.createElementVNode("div", {
              class: "note-title",
              onClick: vue.withModifiers(openDetails, ["stop"])
            }, vue.toDisplayString(__props.title), 9, ["onClick"]),
            vue.createElementVNode(
              "div",
              { class: "note-time" },
              vue.toDisplayString(__props.time),
              1
              /* TEXT */
            )
          ]),
          vue.createCommentVNode(" 分割线 "),
          vue.createElementVNode("div", { class: "note-divider" }),
          vue.createCommentVNode(" 主体内容 + 底部区域 "),
          vue.createElementVNode("div", { class: "note-main" }, [
            vue.createElementVNode("div", {
              class: "note-content",
              onClick: vue.withModifiers(openDetails, ["stop"])
            }, vue.toDisplayString(__props.content), 9, ["onClick"]),
            vue.createElementVNode("div", { class: "note-bottom-divider" }),
            vue.createElementVNode("div", { class: "note-footer" }, [
              vue.createElementVNode("div", { class: "note-repo" }, [
                vue.createElementVNode("div", {
                  class: "repo-know",
                  onClick: _cache[0] || (_cache[0] = vue.withModifiers(() => {
                  }, ["stop"]))
                }, [
                  vue.createVNode(_component_u_icon, {
                    name: "bag",
                    size: "18",
                    color: "#666"
                  }),
                  vue.createElementVNode(
                    "span",
                    { class: "repo-name" },
                    vue.toDisplayString(__props.repo),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", {
                  class: "repo-tags",
                  onClick: _cache[1] || (_cache[1] = vue.withModifiers(() => {
                  }, ["stop"]))
                }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(__props.tags, (tag, index2) => {
                      return vue.openBlock(), vue.createBlock(_component_u_tag, {
                        key: index2,
                        text: tag.text,
                        type: tag.type,
                        plain: "",
                        size: "mini",
                        class: "note-tag"
                      }, null, 8, ["text", "type"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])
              ]),
              vue.createElementVNode("div", { class: "footer-icons" }, [
                vue.createVNode(_component_u_icon, {
                  name: "list-dot",
                  color: "#2979ff",
                  size: "22",
                  onClick: _cache[2] || (_cache[2] = vue.withModifiers(($event) => showSetting.value = true, ["stop"]))
                }),
                vue.createVNode(_component_u_icon, {
                  name: "tags",
                  color: "#2979ff",
                  size: "22",
                  onClick: _cache[3] || (_cache[3] = vue.withModifiers(($event) => showTags.value = true, ["stop"]))
                }),
                vue.createVNode(_component_u_icon, {
                  name: "trash",
                  color: "#2979ff",
                  size: "22",
                  onClick: _cache[4] || (_cache[4] = vue.withModifiers(($event) => showDelete.value = true, ["stop"]))
                })
              ])
            ])
          ]),
          vue.createCommentVNode(" 模态框们 "),
          vue.createElementVNode("view", { class: "modal-wrapper" }, [
            vue.createVNode(_component_u_modal, {
              show: showSetting.value,
              title: "设置",
              onConfirm: _cache[5] || (_cache[5] = ($event) => showSetting.value = false),
              onCancel: _cache[6] || (_cache[6] = ($event) => showSetting.value = false)
            }, {
              default: vue.withCtx(() => [
                vue.createElementVNode("view", { style: { "padding": "20px" } }, "这里是设置模态框内容")
              ]),
              _: 1
              /* STABLE */
            }, 8, ["show"])
          ]),
          vue.createElementVNode("view", { class: "modal-wrapper" }, [
            vue.createVNode(_component_u_modal, {
              show: showTags.value,
              title: "标签",
              onConfirm: _cache[7] || (_cache[7] = ($event) => showTags.value = false),
              onCancel: _cache[8] || (_cache[8] = ($event) => showTags.value = false)
            }, {
              default: vue.withCtx(() => [
                vue.createElementVNode("view", { style: { "padding": "20px" } }, "这里是标签模态框内容")
              ]),
              _: 1
              /* STABLE */
            }, 8, ["show"])
          ]),
          vue.createElementVNode("view", { class: "modal-wrapper" }, [
            vue.createVNode(_component_u_modal, {
              show: showDelete.value,
              title: "删除",
              showCancelButton: true,
              onConfirm: _cache[9] || (_cache[9] = ($event) => showDelete.value = false),
              onCancel: _cache[10] || (_cache[10] = ($event) => showDelete.value = false)
            }, {
              default: vue.withCtx(() => [
                vue.createElementVNode("view", { style: { "padding": "20px" } }, "确定要删除这个笔记吗？")
              ]),
              _: 1
              /* STABLE */
            }, 8, ["show"])
          ])
        ]);
      };
    }
  };
  const NoteCard = /* @__PURE__ */ _export_sfc(_sfc_main$N, [["__scopeId", "data-v-ac0fe255"], ["__file", "F:/LiveHand/LiveHands/components/cards/NoteCard.vue"]]);
  const _sfc_main$M = {
    __name: "notes",
    setup(__props) {
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", { class: "notes-container" }, [
          (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList(20, (n) => {
              return vue.createVNode(
                NoteCard,
                {
                  key: n,
                  title: "AI研究记录",
                  time: "2025-06-26 13:32",
                  content: "西安视途科技有限公司是一家专注于 AI Agent 和 大模型核心技术研发 的人工智能企业，成立于2024年，总部位于西安市经济技术开发区。我们致力于提供本地化部署能力、行业适配性强的智能体平台解决方案，产品涵盖 智能知识管理、自动化调研、多形态智能体客户端 等领域，已服务政务、能源、企业IT、交通等多个行业客户。",
                  repo: "大模型研究",
                  tags: [
                    { text: "AI", type: "warning" },
                    { text: "技术", type: "success" }
                  ]
                },
                {
                  default: vue.withCtx(() => [
                    vue.createTextVNode(
                      " 笔记卡片 " + vue.toDisplayString(n),
                      1
                      /* TEXT */
                    )
                  ]),
                  _: 2
                  /* DYNAMIC */
                },
                1024
                /* DYNAMIC_SLOTS */
              );
            }),
            64
            /* STABLE_FRAGMENT */
          ))
        ]);
      };
    }
  };
  const PagesIndexNotesNotes = /* @__PURE__ */ _export_sfc(_sfc_main$M, [["__scopeId", "data-v-8b89ac5f"], ["__file", "F:/LiveHand/LiveHands/pages/index/notes/notes.vue"]]);
  const _sfc_main$L = {
    __name: "KnowCard",
    props: {
      name: String,
      user: String,
      prompt: String,
      count: Number,
      users: Number,
      time: String,
      tags: {
        type: Array,
        default: () => [
          { text: "标签一", type: "warning" },
          { text: "标签二", type: "success" },
          { text: "标签三", type: "primary" }
        ]
      }
    },
    setup(__props) {
      const props2 = __props;
      const onShare = () => {
        formatAppLog("log", "at components/cards/KnowCard.vue:66", "点击了分享");
      };
      const onDelete = () => {
        formatAppLog("log", "at components/cards/KnowCard.vue:70", "点击了删除");
      };
      function openDetails() {
        uni.navigateTo({
          url: `/pages/details/KnowDetails/KnowDetails?name=${encodeURIComponent(props2.name)}&user=${encodeURIComponent(props2.user)}&prompt=${encodeURIComponent(props2.prompt)}&count=${props2.count}&users=${props2.users}&time=${props2.time}&tags=${encodeURIComponent(JSON.stringify(props2.tags))}`
        });
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_tag = resolveEasycom(vue.resolveDynamicComponent("u-tag"), __easycom_1$2);
        return vue.openBlock(), vue.createElementBlock("div", {
          class: "know-card",
          onClick: openDetails
        }, [
          vue.createCommentVNode(" 顶部信息 "),
          vue.createElementVNode("div", { class: "know-top" }, [
            vue.createElementVNode("div", { class: "know-title-block" }, [
              vue.createElementVNode(
                "div",
                { class: "know-title" },
                vue.toDisplayString(__props.name),
                1
                /* TEXT */
              ),
              vue.createElementVNode("div", { class: "know-icons" }, [
                vue.createVNode(_component_u_icon, {
                  name: "share",
                  size: "20",
                  color: "#666",
                  onClick: vue.withModifiers(onShare, ["stop"])
                }, null, 8, ["onClick"]),
                vue.createVNode(_component_u_icon, {
                  name: "trash",
                  size: "20",
                  color: "#666",
                  onClick: vue.withModifiers(onDelete, ["stop"])
                }, null, 8, ["onClick"])
              ])
            ]),
            vue.createElementVNode(
              "div",
              { class: "know-user" },
              "@" + vue.toDisplayString(__props.user),
              1
              /* TEXT */
            )
          ]),
          vue.createCommentVNode(" 主体内容 + 底部区域 "),
          vue.createElementVNode("div", { class: "know-main" }, [
            vue.createElementVNode(
              "div",
              { class: "know-content" },
              vue.toDisplayString(__props.prompt),
              1
              /* TEXT */
            ),
            vue.createElementVNode("div", { class: "know-bottom-divider" }),
            vue.createElementVNode("div", { class: "know-footer" }, [
              vue.createElementVNode("div", { class: "know-info" }, [
                vue.createElementVNode(
                  "span",
                  { class: "know-time" },
                  vue.toDisplayString(__props.time),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("span", { class: "know-separator" }, "|"),
                vue.createElementVNode(
                  "span",
                  { class: "know-usage" },
                  vue.toDisplayString(__props.count) + "个内容 · " + vue.toDisplayString(__props.users) + "人在用",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("div", { class: "know-tags" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(__props.tags, (tag, index2) => {
                    return vue.openBlock(), vue.createBlock(_component_u_tag, {
                      key: index2,
                      text: tag.text,
                      type: tag.type,
                      size: "mini",
                      plain: "",
                      class: "tag-item"
                    }, null, 8, ["text", "type"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ])
          ])
        ]);
      };
    }
  };
  const KnowCard = /* @__PURE__ */ _export_sfc(_sfc_main$L, [["__scopeId", "data-v-6e18014a"], ["__file", "F:/LiveHand/LiveHands/components/cards/KnowCard.vue"]]);
  const _sfc_main$K = {
    __name: "knows",
    setup(__props) {
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", { class: "knows-container" }, [
          (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList(30, (n) => {
              return vue.createVNode(
                KnowCard,
                {
                  key: n,
                  name: "法律知识库",
                  user: "lihua",
                  prompt: "'西安视途科技有限公司致力于通过本运营方案，明确公司在文化传媒领域的发展方向和战略目标。本方案涵盖《大国典藏》文创项目、《长安梦华录》文创项目、《长安梦华录》动画电影项目，以及旨在培养新兴导演人才的雏鹰计划。《大国典藏》文创项目，旨在记录和传播非物质文化遗产，强化民族文化自信。《长安梦华录》文创项目，将深入挖掘长安的历史文化资源，通过视频形式讲述长安的故事。《长安梦华录》动画电影项目，通过动画电影这一创新载体，吸引年轻观众，拓宽文化影响力。雏鹰计划为年轻导演提供技术、资金支持，以及创作平台，旨在发掘和培养具有潜力的导演人才，共同创作出有深度、有影响力的作品。通过这一计划，公司将促进内部创新，同时为行业输送新鲜血液。'",
                  count: 123,
                  users: 48,
                  time: "2025-06-26"
                },
                {
                  default: vue.withCtx(() => [
                    vue.createTextVNode(
                      " 知识库卡片 " + vue.toDisplayString(n),
                      1
                      /* TEXT */
                    )
                  ]),
                  _: 2
                  /* DYNAMIC */
                },
                1024
                /* DYNAMIC_SLOTS */
              );
            }),
            64
            /* STABLE_FRAGMENT */
          ))
        ]);
      };
    }
  };
  const PagesIndexKnowsKnows = /* @__PURE__ */ _export_sfc(_sfc_main$K, [["__scopeId", "data-v-652c3fcc"], ["__file", "F:/LiveHand/LiveHands/pages/index/knows/knows.vue"]]);
  const _sfc_main$J = {
    data() {
      return {};
    },
    methods: {}
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, " 调研智能体 ");
  }
  const Research = /* @__PURE__ */ _export_sfc(_sfc_main$J, [["render", _sfc_render$9], ["__file", "F:/LiveHand/LiveHands/pages/index/agents/research/research.vue"]]);
  const _sfc_main$I = {
    data() {
      return {};
    },
    methods: {}
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, " 简历智能体 ");
  }
  const Resume = /* @__PURE__ */ _export_sfc(_sfc_main$I, [["render", _sfc_render$8], ["__file", "F:/LiveHand/LiveHands/pages/index/agents/resume/resume.vue"]]);
  const _sfc_main$H = {
    data() {
      return {};
    },
    methods: {}
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", null, " 新闻智能体 ");
  }
  const News = /* @__PURE__ */ _export_sfc(_sfc_main$H, [["render", _sfc_render$7], ["__file", "F:/LiveHand/LiveHands/pages/index/agents/news/news.vue"]]);
  const _sfc_main$G = {
    __name: "SubTabBar",
    props: {
      modelValue: Number
    },
    emits: ["update:modelValue", "change"],
    setup(__props, { emit }) {
      const props2 = __props;
      const activeIndex = vue.computed({
        get() {
          return props2.modelValue;
        },
        set(val) {
          emit("update:modelValue", val);
          emit("change", val);
        }
      });
      function onTabClick(index2) {
        activeIndex.value = index2;
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "subtabbar" }, [
          (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList(["新闻", "调研", "简历"], (tab, i) => {
              return vue.createElementVNode("view", {
                key: i,
                class: vue.normalizeClass(["subtab", { active: vue.unref(activeIndex) === i }]),
                onClick: ($event) => onTabClick(i)
              }, [
                vue.createTextVNode(
                  vue.toDisplayString(tab) + " ",
                  1
                  /* TEXT */
                ),
                vue.unref(activeIndex) === i ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "active-line"
                })) : vue.createCommentVNode("v-if", true)
              ], 10, ["onClick"]);
            }),
            64
            /* STABLE_FRAGMENT */
          ))
        ]);
      };
    }
  };
  const SubTabBar = /* @__PURE__ */ _export_sfc(_sfc_main$G, [["__scopeId", "data-v-25def7fe"], ["__file", "F:/LiveHand/LiveHands/components/SubTabBar.vue"]]);
  const _sfc_main$F = {
    __name: "layout",
    setup(__props) {
      const activeTab = vue.ref(0);
      const lastTab = vue.ref(0);
      function handleTabChange(index2) {
        lastTab.value = activeTab.value;
        activeTab.value = index2;
      }
      function onSwiperChange(e) {
        lastTab.value = activeTab.value;
        activeTab.value = e.detail.current;
      }
      const swipeLeftFromFirstPage = () => {
        if (activeTab.value === 0) {
          uni.$emit("swipeFromInnerFirstTab");
        }
      };
      let startX = 0;
      let startY = 0;
      let startTabIndex = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTabIndex = activeTab.value;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 50 && deltaY < 30 && startTabIndex === 0 && activeTab.value === 0) {
          swipeLeftFromFirstPage();
        }
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "sub-index-page" }, [
          vue.createElementVNode("view", { class: "sub-index-header" }, [
            vue.createVNode(SubTabBar, {
              modelValue: activeTab.value,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => activeTab.value = $event),
              onChange: handleTabChange
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode(
            "view",
            {
              class: "sub-index-content",
              onTouchstart: onTouchStart,
              onTouchend: onTouchEnd
            },
            [
              vue.createElementVNode("swiper", {
                current: activeTab.value,
                onChange: onSwiperChange,
                "indicator-dots": false,
                class: "sub-swiper"
              }, [
                vue.createElementVNode("swiper-item", null, [
                  vue.createVNode(News, { class: "sub-index-container" })
                ]),
                vue.createElementVNode("swiper-item", null, [
                  vue.createVNode(Resume, { class: "sub-index-container" })
                ]),
                vue.createElementVNode("swiper-item", null, [
                  vue.createVNode(Research, { class: "sub-index-container" })
                ])
              ], 40, ["current"])
            ],
            32
            /* HYDRATE_EVENTS */
          )
        ]);
      };
    }
  };
  const PagesIndexAgentsLayout = /* @__PURE__ */ _export_sfc(_sfc_main$F, [["__scopeId", "data-v-1ce95d4b"], ["__file", "F:/LiveHand/LiveHands/pages/index/agents/layout.vue"]]);
  const _sfc_main$E = {
    __name: "TabBar",
    props: {
      modelValue: Number
    },
    emits: ["update:modelValue", "change"],
    setup(__props, { emit }) {
      const props2 = __props;
      const activeIndex = vue.computed({
        get() {
          return props2.modelValue;
        },
        set(val) {
          emit("update:modelValue", val);
          emit("change", val);
        }
      });
      function onTabClick(index2) {
        activeIndex.value = index2;
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "tabbar" }, [
          (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList(["笔记", "知识库", "智能体"], (tab, i) => {
              return vue.createElementVNode("view", {
                key: i,
                class: vue.normalizeClass(["tab", { active: vue.unref(activeIndex) === i }]),
                onClick: ($event) => onTabClick(i)
              }, [
                vue.createTextVNode(
                  vue.toDisplayString(tab) + " ",
                  1
                  /* TEXT */
                ),
                vue.unref(activeIndex) === i ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "active-line"
                })) : vue.createCommentVNode("v-if", true)
              ], 10, ["onClick"]);
            }),
            64
            /* STABLE_FRAGMENT */
          ))
        ]);
      };
    }
  };
  const TabBar = /* @__PURE__ */ _export_sfc(_sfc_main$E, [["__scopeId", "data-v-89ca1f91"], ["__file", "F:/LiveHand/LiveHands/components/TabBar.vue"]]);
  const props$2 = {
    props: {
      // 是否细边框
      hairline: {
        type: Boolean,
        default: props$f.button.hairline
      },
      // 按钮的预置样式，info，primary，error，warning，success
      type: {
        type: String,
        default: props$f.button.type
      },
      // 按钮尺寸，large，normal，small，mini
      size: {
        type: String,
        default: props$f.button.size
      },
      // 按钮形状，circle（两边为半圆），square（带圆角）
      shape: {
        type: String,
        default: props$f.button.shape
      },
      // 按钮是否镂空
      plain: {
        type: Boolean,
        default: props$f.button.plain
      },
      // 是否禁止状态
      disabled: {
        type: Boolean,
        default: props$f.button.disabled
      },
      // 是否加载中
      loading: {
        type: Boolean,
        default: props$f.button.loading
      },
      // 加载中提示文字
      loadingText: {
        type: [String, Number],
        default: props$f.button.loadingText
      },
      // 加载状态图标类型
      loadingMode: {
        type: String,
        default: props$f.button.loadingMode
      },
      // 加载图标大小
      loadingSize: {
        type: [String, Number],
        default: props$f.button.loadingSize
      },
      // 开放能力，具体请看uniapp稳定关于button组件部分说明
      // https://uniapp.dcloud.io/component/button
      openType: {
        type: String,
        default: props$f.button.openType
      },
      // 用于 <form> 组件，点击分别会触发 <form> 组件的 submit/reset 事件
      // 取值为submit（提交表单），reset（重置表单）
      formType: {
        type: String,
        default: props$f.button.formType
      },
      // 打开 APP 时，向 APP 传递的参数，open-type=launchApp时有效
      // 只微信小程序、QQ小程序有效
      appParameter: {
        type: String,
        default: props$f.button.appParameter
      },
      // 指定是否阻止本节点的祖先节点出现点击态，微信小程序有效
      hoverStopPropagation: {
        type: Boolean,
        default: props$f.button.hoverStopPropagation
      },
      // 指定返回用户信息的语言，zh_CN 简体中文，zh_TW 繁体中文，en 英文。只微信小程序有效
      lang: {
        type: String,
        default: props$f.button.lang
      },
      // 会话来源，open-type="contact"时有效。只微信小程序有效
      sessionFrom: {
        type: String,
        default: props$f.button.sessionFrom
      },
      // 会话内消息卡片标题，open-type="contact"时有效
      // 默认当前标题，只微信小程序有效
      sendMessageTitle: {
        type: String,
        default: props$f.button.sendMessageTitle
      },
      // 会话内消息卡片点击跳转小程序路径，open-type="contact"时有效
      // 默认当前分享路径，只微信小程序有效
      sendMessagePath: {
        type: String,
        default: props$f.button.sendMessagePath
      },
      // 会话内消息卡片图片，open-type="contact"时有效
      // 默认当前页面截图，只微信小程序有效
      sendMessageImg: {
        type: String,
        default: props$f.button.sendMessageImg
      },
      // 是否显示会话内消息卡片，设置此参数为 true，用户进入客服会话会在右下角显示"可能要发送的小程序"提示，
      // 用户点击后可以快速发送小程序消息，open-type="contact"时有效
      showMessageCard: {
        type: Boolean,
        default: props$f.button.showMessageCard
      },
      // 额外传参参数，用于小程序的data-xxx属性，通过target.dataset.name获取
      dataName: {
        type: String,
        default: props$f.button.dataName
      },
      // 节流，一定时间内只能触发一次
      throttleTime: {
        type: [String, Number],
        default: props$f.button.throttleTime
      },
      // 按住后多久出现点击态，单位毫秒
      hoverStartTime: {
        type: [String, Number],
        default: props$f.button.hoverStartTime
      },
      // 手指松开后点击态保留时间，单位毫秒
      hoverStayTime: {
        type: [String, Number],
        default: props$f.button.hoverStayTime
      },
      // 按钮文字，之所以通过props传入，是因为slot传入的话
      // nvue中无法控制文字的样式
      text: {
        type: [String, Number],
        default: props$f.button.text
      },
      // 按钮图标
      icon: {
        type: String,
        default: props$f.button.icon
      },
      // 按钮图标
      iconColor: {
        type: String,
        default: props$f.button.icon
      },
      // 按钮颜色，支持传入linear-gradient渐变色
      color: {
        type: String,
        default: props$f.button.color
      }
    }
  };
  const _sfc_main$D = {
    name: "u-button",
    mixins: [mpMixin, mixin, props$2],
    data() {
      return {};
    },
    computed: {
      // 生成bem风格的类名
      bemClass() {
        if (!this.color) {
          return this.bem(
            "button",
            ["type", "shape", "size"],
            ["disabled", "plain", "hairline"]
          );
        } else {
          return this.bem(
            "button",
            ["shape", "size"],
            ["disabled", "plain", "hairline"]
          );
        }
      },
      loadingColor() {
        if (this.plain) {
          return this.color ? this.color : uni.$u.config.color[`u-${this.type}`];
        }
        if (this.type === "info") {
          return "#c9c9c9";
        }
        return "rgb(200, 200, 200)";
      },
      iconColorCom() {
        if (this.iconColor)
          return this.iconColor;
        if (this.plain) {
          return this.color ? this.color : this.type;
        } else {
          return this.type === "info" ? "#000000" : "#ffffff";
        }
      },
      baseColor() {
        let style = {};
        if (this.color) {
          style.color = this.plain ? this.color : "white";
          if (!this.plain) {
            style["background-color"] = this.color;
          }
          if (this.color.indexOf("gradient") !== -1) {
            style.borderTopWidth = 0;
            style.borderRightWidth = 0;
            style.borderBottomWidth = 0;
            style.borderLeftWidth = 0;
            if (!this.plain) {
              style.backgroundImage = this.color;
            }
          } else {
            style.borderColor = this.color;
            style.borderWidth = "1px";
            style.borderStyle = "solid";
          }
        }
        return style;
      },
      // nvue版本按钮的字体不会继承父组件的颜色，需要对每一个text组件进行单独的设置
      nvueTextStyle() {
        let style = {};
        if (this.type === "info") {
          style.color = "#323233";
        }
        if (this.color) {
          style.color = this.plain ? this.color : "white";
        }
        style.fontSize = this.textSize + "px";
        return style;
      },
      // 字体大小
      textSize() {
        let fontSize = 14, { size } = this;
        if (size === "large")
          fontSize = 16;
        if (size === "normal")
          fontSize = 14;
        if (size === "small")
          fontSize = 12;
        if (size === "mini")
          fontSize = 10;
        return fontSize;
      }
    },
    emits: [
      "click",
      "getphonenumber",
      "getuserinfo",
      "error",
      "opensetting",
      "launchapp"
    ],
    methods: {
      clickHandler() {
        if (!this.disabled && !this.loading) {
          uni.$u.throttle(() => {
            this.$emit("click");
          }, this.throttleTime);
        }
      },
      // 下面为对接uniapp官方按钮开放能力事件回调的对接
      getphonenumber(res) {
        this.$emit("getphonenumber", res);
      },
      getuserinfo(res) {
        this.$emit("getuserinfo", res);
      },
      error(res) {
        this.$emit("error", res);
      },
      opensetting(res) {
        this.$emit("opensetting", res);
      },
      launchapp(res) {
        this.$emit("launchapp", res);
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_loading_icon = resolveEasycom(vue.resolveDynamicComponent("u-loading-icon"), __easycom_0$2);
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
    return vue.openBlock(), vue.createElementBlock("button", {
      "hover-start-time": Number(_ctx.hoverStartTime),
      "hover-stay-time": Number(_ctx.hoverStayTime),
      "form-type": _ctx.formType,
      "open-type": _ctx.openType,
      "app-parameter": _ctx.appParameter,
      "hover-stop-propagation": _ctx.hoverStopPropagation,
      "send-message-title": _ctx.sendMessageTitle,
      "send-message-path": _ctx.sendMessagePath,
      lang: _ctx.lang,
      "data-name": _ctx.dataName,
      "session-from": _ctx.sessionFrom,
      "send-message-img": _ctx.sendMessageImg,
      "show-message-card": _ctx.showMessageCard,
      onGetphonenumber: _cache[0] || (_cache[0] = (...args) => $options.getphonenumber && $options.getphonenumber(...args)),
      onGetuserinfo: _cache[1] || (_cache[1] = (...args) => $options.getuserinfo && $options.getuserinfo(...args)),
      onError: _cache[2] || (_cache[2] = (...args) => $options.error && $options.error(...args)),
      onOpensetting: _cache[3] || (_cache[3] = (...args) => $options.opensetting && $options.opensetting(...args)),
      onLaunchapp: _cache[4] || (_cache[4] = (...args) => $options.launchapp && $options.launchapp(...args)),
      "hover-class": !_ctx.disabled && !_ctx.loading ? "u-button--active" : "",
      class: vue.normalizeClass(["u-button u-reset-button", $options.bemClass]),
      style: vue.normalizeStyle([$options.baseColor, _ctx.$u.addStyle(_ctx.customStyle)]),
      onClick: _cache[5] || (_cache[5] = (...args) => $options.clickHandler && $options.clickHandler(...args))
    }, [
      _ctx.loading ? (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 0 },
        [
          vue.createVNode(_component_u_loading_icon, {
            mode: _ctx.loadingMode,
            size: _ctx.loadingSize * 1.15,
            color: $options.loadingColor
          }, null, 8, ["mode", "size", "color"]),
          vue.createElementVNode(
            "text",
            {
              class: "u-button__loading-text",
              style: vue.normalizeStyle([{ fontSize: $options.textSize + "px" }])
            },
            vue.toDisplayString(_ctx.loadingText || _ctx.text),
            5
            /* TEXT, STYLE */
          )
        ],
        64
        /* STABLE_FRAGMENT */
      )) : (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        [
          _ctx.icon ? (vue.openBlock(), vue.createBlock(_component_u_icon, {
            key: 0,
            name: _ctx.icon,
            color: $options.iconColorCom,
            size: $options.textSize * 1.35,
            customStyle: { marginRight: "2px" }
          }, null, 8, ["name", "color", "size"])) : vue.createCommentVNode("v-if", true),
          vue.renderSlot(_ctx.$slots, "default", {}, () => [
            vue.createElementVNode(
              "text",
              {
                class: "u-button__text",
                style: vue.normalizeStyle([{ fontSize: $options.textSize + "px" }])
              },
              vue.toDisplayString(_ctx.text),
              5
              /* TEXT, STYLE */
            )
          ], true)
        ],
        64
        /* STABLE_FRAGMENT */
      ))
    ], 46, ["hover-start-time", "hover-stay-time", "form-type", "open-type", "app-parameter", "hover-stop-propagation", "send-message-title", "send-message-path", "lang", "data-name", "session-from", "send-message-img", "show-message-card", "hover-class"]);
  }
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$D, [["render", _sfc_render$6], ["__scopeId", "data-v-c6ff829e"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-button/u-button.vue"]]);
  const _sfc_main$C = {};
  function _sfc_render$5(_ctx, _cache) {
    return null;
  }
  const Member = /* @__PURE__ */ _export_sfc(_sfc_main$C, [["render", _sfc_render$5], ["__file", "F:/LiveHand/LiveHands/components/children/Member.vue"]]);
  const _sfc_main$B = {};
  function _sfc_render$4(_ctx, _cache) {
    return null;
  }
  const UnMember = /* @__PURE__ */ _export_sfc(_sfc_main$B, [["render", _sfc_render$4], ["__file", "F:/LiveHand/LiveHands/components/children/UnMember.vue"]]);
  const _sfc_main$A = {
    __name: "MenuItem",
    props: {
      title: String,
      icon: String,
      isOk: Boolean
    },
    setup(__props) {
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        return vue.openBlock(), vue.createElementBlock("view", {
          class: "menu-item",
          onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("click"))
        }, [
          vue.createVNode(_component_u_icon, {
            name: __props.icon,
            size: "20",
            class: "menu-icon"
          }, null, 8, ["name"]),
          vue.createElementVNode(
            "text",
            { class: "menu-text" },
            vue.toDisplayString(__props.title),
            1
            /* TEXT */
          ),
          __props.isOk ? (vue.openBlock(), vue.createBlock(_component_u_icon, {
            key: 0,
            name: "arrow-right",
            size: "16",
            class: "arrow-icon"
          })) : (vue.openBlock(), vue.createElementBlock("text", {
            key: 1,
            class: "wait-later"
          }, "敬请期待"))
        ]);
      };
    }
  };
  const MenuItem = /* @__PURE__ */ _export_sfc(_sfc_main$A, [["__scopeId", "data-v-a609ad39"], ["__file", "F:/LiveHand/LiveHands/components/children/MenuItem.vue"]]);
  const _sfc_main$z = {
    __name: "WidgetManager",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 小组件 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const WidgetManagerPanel = /* @__PURE__ */ _export_sfc(_sfc_main$z, [["__scopeId", "data-v-9ba83672"], ["__file", "F:/LiveHand/LiveHands/pages/static/WidgetManager.vue"]]);
  const _sfc_main$y = {
    __name: "ImportNotes",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 导入笔记 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const ImportNotesPanel = /* @__PURE__ */ _export_sfc(_sfc_main$y, [["__scopeId", "data-v-39f41623"], ["__file", "F:/LiveHand/LiveHands/pages/static/ImportNotes.vue"]]);
  const _sfc_main$x = {
    __name: "Sync",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 同步到LiveKnowledge ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const SyncPanel = /* @__PURE__ */ _export_sfc(_sfc_main$x, [["__scopeId", "data-v-dbdaee1d"], ["__file", "F:/LiveHand/LiveHands/pages/static/Sync.vue"]]);
  const _sfc_main$w = {
    __name: "HistoryLog",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 历史记录 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const HistoryLogPanel = /* @__PURE__ */ _export_sfc(_sfc_main$w, [["__scopeId", "data-v-f6b79373"], ["__file", "F:/LiveHand/LiveHands/pages/static/HistoryLog.vue"]]);
  const _sfc_main$v = {
    __name: "Tags",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 预设标签 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const TagsPanel = /* @__PURE__ */ _export_sfc(_sfc_main$v, [["__scopeId", "data-v-5403c959"], ["__file", "F:/LiveHand/LiveHands/pages/static/Tags.vue"]]);
  const _sfc_main$u = {
    __name: "FileManager",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 20 && deltaY < 10) {
          formatAppLog("log", "at pages/static/FileManager.vue:58", "现在是手势从左往右滑动，即将关闭当前页面回到通用设置页面");
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 文件管理器 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const FileManagerPanel = /* @__PURE__ */ _export_sfc(_sfc_main$u, [["__scopeId", "data-v-8af38d0a"], ["__file", "F:/LiveHand/LiveHands/pages/static/FileManager.vue"]]);
  const _sfc_main$t = {
    __name: "Rate",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 去商城给好评 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const RatePanel = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["__scopeId", "data-v-c7bbae96"], ["__file", "F:/LiveHand/LiveHands/pages/static/Rate.vue"]]);
  const _sfc_main$s = {
    __name: "Share",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 分享给好友 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const SharePanel = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["__scopeId", "data-v-dbd63f1d"], ["__file", "F:/LiveHand/LiveHands/pages/static/Share.vue"]]);
  const _sfc_main$r = {
    __name: "FollowWeChat",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 关注微信 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const FollowWeChatPanel = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["__scopeId", "data-v-7a4df1a6"], ["__file", "F:/LiveHand/LiveHands/pages/static/FollowWeChat.vue"]]);
  const _sfc_main$q = {
    __name: "FollowRedBook",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 关注小红书 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const FollowRedBookPanel = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["__scopeId", "data-v-19efe357"], ["__file", "F:/LiveHand/LiveHands/pages/static/FollowRedBook.vue"]]);
  const _sfc_main$p = {
    __name: "Feedback",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 吐槽一下 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const FeedbackPanel = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["__scopeId", "data-v-fc0b6d1d"], ["__file", "F:/LiveHand/LiveHands/pages/static/Feedback.vue"]]);
  const _sfc_main$o = {
    __name: "Update",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 版本更新 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const UpdatePanel = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["__scopeId", "data-v-456d7568"], ["__file", "F:/LiveHand/LiveHands/pages/static/Update.vue"]]);
  const _sfc_main$n = {
    __name: "Intro",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 版本介绍 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const IntroPanel = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["__scopeId", "data-v-0baab9c7"], ["__file", "F:/LiveHand/LiveHands/pages/static/Intro.vue"]]);
  const _sfc_main$m = {
    __name: "Docs",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "static-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "static-body" }, " 使用文档 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const DocsPanel = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["__scopeId", "data-v-6a6864cc"], ["__file", "F:/LiveHand/LiveHands/pages/static/Docs.vue"]]);
  const _sfc_main$l = {
    __name: "About",
    props: { show: Boolean },
    emits: ["update:show"],
    setup(__props, { emit }) {
      const version2 = vue.ref("2.0.1");
      const showUserPanel = vue.ref(false);
      const showPrivacyPanel = vue.ref(false);
      const showCertificationPanel = vue.ref(false);
      let startX = 0, startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const deltaX = e.changedTouches[0].clientX - startX;
        const deltaY = Math.abs(e.changedTouches[0].clientY - startY);
        if (deltaX < -60 && deltaY < 30)
          closePanel();
      }
      function closePanel() {
        emit("update:show", false);
      }
      function openUser() {
        showUserPanel.value = true;
      }
      function openPrivacy() {
        showPrivacyPanel.value = true;
      }
      function openCertification() {
        showCertificationPanel.value = true;
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          "close-on-click-overlay": false,
          show: __props.show,
          mode: "left",
          overlay: true,
          closeable: false,
          "safe-area-inset-left": true,
          onClose: closePanel,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val))
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" 顶部栏 "),
                vue.createElementVNode("view", { class: "panel-header" }, [
                  vue.createElementVNode("text", { class: "header-title" }, "关于我们"),
                  vue.createVNode(_component_u_icon, {
                    name: "close-circle",
                    size: "28",
                    onClick: closePanel
                  })
                ]),
                vue.createCommentVNode(" 内容区域 "),
                vue.createElementVNode("scroll-view", {
                  "scroll-y": "",
                  class: "common-wrapper"
                }, [
                  vue.createCommentVNode(" Logo & 版本 "),
                  vue.createElementVNode("view", { class: "logo-section" }, [
                    vue.createElementVNode("image", {
                      class: "logo",
                      src: "/static/logo.png",
                      mode: "widthFix"
                    }),
                    vue.createElementVNode("text", { class: "app-name" }, "LiveHand"),
                    vue.createElementVNode(
                      "text",
                      { class: "version" },
                      "v" + vue.toDisplayString(version2.value),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createCommentVNode(" 菜单列表 "),
                  vue.createElementVNode("view", { class: "section" }, [
                    vue.createElementVNode("view", { class: "section-title" }, "法律信息"),
                    vue.createElementVNode("view", { class: "section-body" }, [
                      vue.createElementVNode("view", { onClick: openUser }, [
                        vue.createVNode(MenuItem, {
                          title: "用户服务协议",
                          icon: "document",
                          isOk: true
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openPrivacy }, [
                        vue.createVNode(MenuItem, {
                          title: "隐私政策",
                          icon: "lock",
                          isOk: true
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openCertification }, [
                        vue.createVNode(MenuItem, {
                          title: "证照中心",
                          icon: "certificate",
                          isOk: true
                        })
                      ])
                    ])
                  ]),
                  vue.createCommentVNode('        <view class="section">\n          <view class="section-title">公司信息</view>\n          <view class="section-body">\n            <view @click="openCompanyInfo"><MenuItem title="公司简介" icon="building" :isOk="true" /></view>\n            <view @click="openTeam"><MenuItem title="研发团队" icon="users" :isOk="true" /></view>\n            <view @click="openContactUs"><MenuItem title="联系我们" icon="phone" :isOk="true" /></view>\n          </view>\n        </view> ')
                ]),
                vue.createCommentVNode(" 底部信息 "),
                vue.createElementVNode("view", { class: "somthing-info" }, [
                  vue.createElementVNode("text", null, "西安视途科技有限公司 版权所有 © 2025")
                ])
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const AboutPanel = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["__scopeId", "data-v-9d4e19e4"], ["__file", "F:/LiveHand/LiveHands/pages/static/About.vue"]]);
  const _sfc_main$k = {
    __name: "CommonPanel",
    props: { show: Boolean },
    emits: ["update:show"],
    setup(__props, { emit }) {
      const showWidgetManagerPanel = vue.ref(false);
      const showImportNotesPanel = vue.ref(false);
      const showSyncPanel = vue.ref(false);
      const showHistoryLogPanel = vue.ref(false);
      const showTagsPanel = vue.ref(false);
      const showFileManagerPanel = vue.ref(false);
      const showRatePanel = vue.ref(false);
      const showSharePanel = vue.ref(false);
      const showFollowWeChatPanel = vue.ref(false);
      const showFollowRedBookPanel = vue.ref(false);
      const showFeedbackPanel = vue.ref(false);
      const showUpdatePanel = vue.ref(false);
      const showIntroPanel = vue.ref(false);
      const showDocsPanel = vue.ref(false);
      const showAboutPanel = vue.ref(false);
      const isMember = vue.ref(false);
      const userStore = useUserStore();
      function closePanel() {
        emit("update:show", false);
      }
      function logout() {
        userStore.logout();
        emit("update:show", false);
        setTimeout(() => {
          uni.reLaunch({ url: "/pages/layout" });
        }, 300);
      }
      let startX = 0, startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const deltaX = e.changedTouches[0].clientX - startX;
        const deltaY = Math.abs(e.changedTouches[0].clientY - startY);
        if (deltaX < -60 && deltaY < 30)
          closePanel();
      }
      function openWidgetManager() {
        showWidgetManagerPanel.value = false;
      }
      function openImportNotes() {
        showImportNotesPanel.value = false;
      }
      function openSync() {
        showSyncPanel.value = false;
      }
      function openHistoryLog() {
        showHistoryLogPanel.value = true;
      }
      function openTags() {
        showTagsPanel.value = true;
      }
      function openFileManager() {
        showFileManagerPanel.value = true;
      }
      function openRate() {
        showRatePanel.value = false;
      }
      function openShare() {
        showSharePanel.value = true;
      }
      function openFollowWechat() {
        showFileManagerPanel.value = true;
      }
      function openFollowRedBook() {
        showFollowRedBookPanel.value = true;
      }
      function openFeedback() {
        showFeedbackPanel.value = true;
      }
      function openUpdate() {
        showUpdatePanel.value = true;
      }
      function openIntro() {
        showIntroPanel.value = true;
      }
      function openDocs() {
        showDocsPanel.value = true;
      }
      function openAbout() {
        showAboutPanel.value = true;
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_button = resolveEasycom(vue.resolveDynamicComponent("u-button"), __easycom_1);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          "close-on-click-overlay": false,
          show: __props.show,
          mode: "left",
          overlay: true,
          closeable: false,
          "safe-area-inset-left": true,
          onClose: closePanel,
          "onUpdate:show": _cache[15] || (_cache[15] = (val) => emit("update:show", val))
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" 顶部栏 "),
                vue.createElementVNode("view", { class: "panel-header" }, [
                  vue.createElementVNode("text", { class: "header-title" }, "通用"),
                  vue.createVNode(_component_u_icon, {
                    name: "close-circle",
                    size: "28",
                    onClick: closePanel
                  })
                ]),
                vue.createCommentVNode(" 内容区域 "),
                vue.createElementVNode("scroll-view", {
                  "scroll-y": "",
                  class: "common-wrapper"
                }, [
                  isMember.value ? (vue.openBlock(), vue.createBlock(Member, { key: 0 })) : (vue.openBlock(), vue.createBlock(UnMember, { key: 1 })),
                  vue.createCommentVNode(" 快捷操作 "),
                  vue.createElementVNode("view", { class: "section" }, [
                    vue.createElementVNode("view", { class: "section-title" }, "快捷操作"),
                    vue.createElementVNode("view", { class: "section-body" }, [
                      vue.createElementVNode("view", { onClick: openWidgetManager }, [
                        vue.createVNode(MenuItem, {
                          title: "小组件",
                          icon: "attach"
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openImportNotes }, [
                        vue.createVNode(MenuItem, {
                          title: "导入笔记",
                          icon: "plus-circle"
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openSync }, [
                        vue.createVNode(MenuItem, {
                          title: "同步 LiveKnowledge",
                          icon: "reload"
                        })
                      ])
                    ])
                  ]),
                  vue.createCommentVNode(" 个性化设置 "),
                  vue.createElementVNode("view", { class: "section" }, [
                    vue.createElementVNode("view", { class: "section-title" }, "个性化设置"),
                    vue.createElementVNode("view", { class: "section-body" }, [
                      vue.createElementVNode("view", { onClick: openHistoryLog }, [
                        vue.createVNode(MenuItem, {
                          title: "历史记录",
                          icon: "clock",
                          isOk: true
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openTags }, [
                        vue.createVNode(MenuItem, {
                          title: "预设标签",
                          icon: "tags",
                          isOk: true
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openFileManager }, [
                        vue.createVNode(MenuItem, {
                          title: "文件管理器",
                          icon: "folder",
                          isOk: true
                        })
                      ])
                    ])
                  ]),
                  vue.createCommentVNode(" 需要你的帮助 "),
                  vue.createElementVNode("view", { class: "section" }, [
                    vue.createElementVNode("view", { class: "section-title" }, "需要你的帮助"),
                    vue.createElementVNode("view", { class: "section-body" }, [
                      vue.createElementVNode("view", { onClick: openRate }, [
                        vue.createVNode(MenuItem, {
                          title: "去应用商城给个好评",
                          icon: "star"
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openShare }, [
                        vue.createVNode(MenuItem, {
                          title: "分享 LiveHands 给好友",
                          icon: "share",
                          isOk: true
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openFollowWechat }, [
                        vue.createVNode(MenuItem, {
                          title: "关注官方公众号",
                          icon: "weixin-fill",
                          isOk: true
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openFollowRedBook }, [
                        vue.createVNode(MenuItem, {
                          title: "关注官方小红书",
                          icon: "heart",
                          isOk: true
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openFeedback }, [
                        vue.createVNode(MenuItem, {
                          title: "吐槽专用",
                          icon: "chat",
                          isOk: true
                        })
                      ])
                    ])
                  ]),
                  vue.createCommentVNode(" 版本信息 "),
                  vue.createElementVNode("view", { class: "section" }, [
                    vue.createElementVNode("view", { class: "section-title" }, "版本信息"),
                    vue.createElementVNode("view", { class: "section-body" }, [
                      vue.createElementVNode("view", { onClick: openUpdate }, [
                        vue.createVNode(MenuItem, {
                          title: "版本更新",
                          icon: "checkmark-circle",
                          isOk: true
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openIntro }, [
                        vue.createVNode(MenuItem, {
                          title: "版本介绍",
                          icon: "info-circle",
                          isOk: true
                        })
                      ])
                    ])
                  ]),
                  vue.createCommentVNode(" 帮助中心 "),
                  vue.createElementVNode("view", { class: "section" }, [
                    vue.createElementVNode("view", { class: "section-title" }, "帮助中心"),
                    vue.createElementVNode("view", { class: "section-body" }, [
                      vue.createElementVNode("view", { onClick: openDocs }, [
                        vue.createVNode(MenuItem, {
                          title: "使用文档",
                          icon: "file-text",
                          isOk: true
                        })
                      ]),
                      vue.createElementVNode("view", { onClick: openAbout }, [
                        vue.createVNode(MenuItem, {
                          title: "关于我们",
                          icon: "integral",
                          isOk: true
                        })
                      ])
                    ])
                  ]),
                  vue.createCommentVNode(" 退出登录 "),
                  vue.createElementVNode("view", { class: "logout-wrapper" }, [
                    vue.createVNode(_component_u_button, {
                      type: "error",
                      shape: "circle",
                      size: "medium",
                      text: "退出登录",
                      onClick: logout
                    })
                  ]),
                  vue.createElementVNode("view", { class: "somthing-info" }, [
                    vue.createElementVNode("text", null, "西安视途科技有限公司 AI 技术支撑")
                  ]),
                  vue.createCommentVNode(" Panel "),
                  vue.createVNode(WidgetManagerPanel, {
                    show: showWidgetManagerPanel.value,
                    "onUpdate:show": _cache[0] || (_cache[0] = ($event) => showWidgetManagerPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(ImportNotesPanel, {
                    show: showImportNotesPanel.value,
                    "onUpdate:show": _cache[1] || (_cache[1] = ($event) => showImportNotesPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(SyncPanel, {
                    show: showSyncPanel.value,
                    "onUpdate:show": _cache[2] || (_cache[2] = ($event) => showSyncPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(HistoryLogPanel, {
                    show: showHistoryLogPanel.value,
                    "onUpdate:show": _cache[3] || (_cache[3] = ($event) => showHistoryLogPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(TagsPanel, {
                    show: showTagsPanel.value,
                    "onUpdate:show": _cache[4] || (_cache[4] = ($event) => showTagsPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(FileManagerPanel, {
                    show: showFileManagerPanel.value,
                    "onUpdate:show": _cache[5] || (_cache[5] = ($event) => showFileManagerPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(RatePanel, {
                    show: showRatePanel.value,
                    "onUpdate:show": _cache[6] || (_cache[6] = ($event) => showRatePanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(SharePanel, {
                    show: showSharePanel.value,
                    "onUpdate:show": _cache[7] || (_cache[7] = ($event) => showSharePanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(FollowWeChatPanel, {
                    show: showFollowWeChatPanel.value,
                    "onUpdate:show": _cache[8] || (_cache[8] = ($event) => showFollowWeChatPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(FollowRedBookPanel, {
                    show: showFollowRedBookPanel.value,
                    "onUpdate:show": _cache[9] || (_cache[9] = ($event) => showFollowRedBookPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(FeedbackPanel, {
                    show: showFeedbackPanel.value,
                    "onUpdate:show": _cache[10] || (_cache[10] = ($event) => showFeedbackPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(UpdatePanel, {
                    show: showUpdatePanel.value,
                    "onUpdate:show": _cache[11] || (_cache[11] = ($event) => showUpdatePanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(IntroPanel, {
                    show: showIntroPanel.value,
                    "onUpdate:show": _cache[12] || (_cache[12] = ($event) => showIntroPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(DocsPanel, {
                    show: showDocsPanel.value,
                    "onUpdate:show": _cache[13] || (_cache[13] = ($event) => showDocsPanel.value = $event)
                  }, null, 8, ["show"]),
                  vue.createVNode(AboutPanel, {
                    show: showAboutPanel.value,
                    "onUpdate:show": _cache[14] || (_cache[14] = ($event) => showAboutPanel.value = $event)
                  }, null, 8, ["show"])
                ])
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const CommonPanel = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["__scopeId", "data-v-b1900e2d"], ["__file", "F:/LiveHand/LiveHands/components/CommonPanel.vue"]]);
  const _sfc_main$j = {
    __name: "SearchInput",
    props: {
      modelValue: String,
      placeholder: String
    },
    emits: ["update:modelValue", "search", "back", "change"],
    setup(__props, { emit }) {
      const props2 = __props;
      const inputValue = vue.ref(props2.modelValue || "");
      vue.watch(() => props2.modelValue, (val) => {
        inputValue.value = val;
      });
      function handleInput() {
        emit("update:modelValue", inputValue.value);
        emit("change", inputValue.value);
      }
      function clearInput() {
        inputValue.value = "";
        emit("update:modelValue", "");
        emit("change", "");
      }
      function onVoice() {
        formatAppLog("log", "at components/children/SearchInput.vue:57", "现在是在SearchPanel组件里面语音搜索");
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "search-header" }, [
          vue.createVNode(_component_u_icon, {
            name: "arrow-left",
            size: "28",
            onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("back"))
          }),
          vue.createElementVNode("view", { class: "search-box" }, [
            vue.createVNode(_component_u_icon, {
              name: "search",
              size: "18"
            }),
            vue.withDirectives(vue.createElementVNode("input", {
              class: "input",
              placeholder: __props.placeholder,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => inputValue.value = $event),
              onInput: handleInput
            }, null, 40, ["placeholder"]), [
              [vue.vModelText, inputValue.value]
            ]),
            vue.createCommentVNode(" 语音 or 清除按钮 "),
            inputValue.value ? (vue.openBlock(), vue.createBlock(_component_u_icon, {
              key: 0,
              name: "close-circle",
              size: "18",
              onClick: clearInput
            })) : (vue.openBlock(), vue.createBlock(_component_u_icon, {
              key: 1,
              name: "mic",
              size: "18",
              onClick: onVoice
            }))
          ]),
          vue.createElementVNode("text", {
            class: "search-btn",
            onClick: _cache[2] || (_cache[2] = ($event) => emit("search", inputValue.value))
          }, "搜索")
        ]);
      };
    }
  };
  const SearchInput = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["__scopeId", "data-v-e7fd4a42"], ["__file", "F:/LiveHand/LiveHands/components/children/SearchInput.vue"]]);
  const _sfc_main$i = {
    __name: "SearchTag",
    props: {
      tags: {
        type: Array,
        default: () => []
      }
    },
    setup(__props) {
      function onEditClick() {
        formatAppLog("log", "at components/children/SearchTag.vue:30", "搜索界面编辑标签icon被点击");
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_tag = resolveEasycom(vue.resolveDynamicComponent("u-tag"), __easycom_1$2);
        return vue.openBlock(), vue.createElementBlock("view", { class: "tag-wrapper" }, [
          vue.createElementVNode("view", { class: "tag-header" }, [
            vue.createElementVNode("text", { class: "tag-title" }, "笔记标签"),
            vue.createVNode(_component_u_icon, {
              name: "edit-pen",
              size: "20",
              onClick: onEditClick
            })
          ]),
          vue.createElementVNode("view", { class: "tag-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(__props.tags, (item, index2) => {
                return vue.openBlock(), vue.createBlock(_component_u_tag, {
                  key: index2,
                  text: item,
                  plain: "",
                  size: "mini",
                  type: "primary",
                  onClick: ($event) => _ctx.$emit("search", item)
                }, null, 8, ["text", "onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]);
      };
    }
  };
  const SearchTag = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["__scopeId", "data-v-ae7bcd03"], ["__file", "F:/LiveHand/LiveHands/components/children/SearchTag.vue"]]);
  const _sfc_main$h = {
    __name: "SearchHistory",
    props: {
      history: {
        type: Array,
        default: () => []
      }
    },
    setup(__props) {
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "history-wrapper" }, [
          vue.createElementVNode("view", { class: "history-header" }, [
            vue.createElementVNode("text", { class: "history-title" }, "历史记录"),
            vue.createVNode(_component_u_icon, {
              name: "trash",
              size: "18",
              onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("clear"))
            })
          ]),
          __props.history.length > 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "history-list"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(__props.history, (item, index2) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index2,
                  class: "history-item",
                  onClick: ($event) => _ctx.$emit("search", item)
                }, vue.toDisplayString(item), 9, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "no-history"
          }, [
            vue.createElementVNode("text", null, "暂无历史记录")
          ]))
        ]);
      };
    }
  };
  const SearchHistory = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["__scopeId", "data-v-eef68dde"], ["__file", "F:/LiveHand/LiveHands/components/children/SearchHistory.vue"]]);
  const _sfc_main$g = {
    __name: "SearchResultItem",
    props: {
      title: String,
      desc: String
    },
    setup(__props) {
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", { class: "item-card" }, [
          vue.createElementVNode(
            "text",
            { class: "title" },
            vue.toDisplayString(__props.title),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "desc" },
            vue.toDisplayString(__props.desc),
            1
            /* TEXT */
          )
        ]);
      };
    }
  };
  const SearchResultItem = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__scopeId", "data-v-2cd435a1"], ["__file", "F:/LiveHand/LiveHands/components/children/SearchResultItem.vue"]]);
  const _sfc_main$f = {
    __name: "SearchPanel",
    props: {
      show: Boolean,
      placeholder: { type: String, default: "请输入搜索内容" }
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      const isSearched = vue.ref(false);
      const keyword = vue.ref("");
      const modelValue = vue.ref("");
      function closePopup() {
        emit("update:show", false);
        keyword.value = "";
        isSearched.value = false;
      }
      function onSearch(val) {
        keyword.value = val;
        modelValue.value = val;
        isSearched.value = val.trim().length > 0;
        formatAppLog("log", "at components/SearchPanel.vue:78", "搜索内容：", val);
      }
      function clearHistory() {
        searchHistory.value = [];
      }
      function onInputChange(val) {
        isSearched.value = val.trim().length > 0;
      }
      const searchResults = vue.ref([
        { title: "搜索结果一", desc: "这是第一个结果的描述" },
        { title: "搜索结果二", desc: "这是第二个结果的描述" },
        { title: "搜索结果三", desc: "这是第三个结果的描述" }
      ]);
      const searchHistory = vue.ref(["AI智能", "Vue3组件", "笔记标签", "语音识别"]);
      const tagList = vue.ref(["AIGC", "Agent", "LLM", "VLM"]);
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        formatAppLog("log", "at components/SearchPanel.vue:105", e);
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        formatAppLog("log", "at components/SearchPanel.vue:111", e);
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        formatAppLog("log", "at components/SearchPanel.vue:116", deltaX);
        formatAppLog("log", "at components/SearchPanel.vue:117", deltaY);
        if (deltaX > -60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          duration: 300,
          onClose: closePopup,
          "onUpdate:show": _cache[1] || (_cache[1] = (val) => emit("update:show", val))
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode("view", {
              class: "panel-wrapper",
              onTouchstart: vue.withModifiers(onTouchStart, ["stop"]),
              onTouchend: vue.withModifiers(onTouchEnd, ["stop"])
            }, [
              vue.createCommentVNode(" 搜索栏 "),
              vue.createVNode(SearchInput, {
                modelValue: modelValue.value,
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => modelValue.value = $event),
                placeholder: __props.placeholder,
                onBack: closePopup,
                onSearch,
                onChange: onInputChange
              }, null, 8, ["modelValue", "placeholder"]),
              vue.createCommentVNode(" 主体区域 "),
              vue.createElementVNode("view", { class: "search-body" }, [
                vue.createCommentVNode(" 未搜索状态 "),
                !isSearched.value ? (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  { key: 0 },
                  [
                    vue.createVNode(SearchTag, {
                      tags: tagList.value,
                      onSearch
                    }, null, 8, ["tags"]),
                    vue.createVNode(SearchHistory, {
                      history: searchHistory.value,
                      onSearch,
                      onClear: clearHistory
                    }, null, 8, ["history"])
                  ],
                  64
                  /* STABLE_FRAGMENT */
                )) : (vue.openBlock(), vue.createElementBlock(
                  vue.Fragment,
                  { key: 1 },
                  [
                    vue.createCommentVNode(" 搜索结果区域 "),
                    (vue.openBlock(true), vue.createElementBlock(
                      vue.Fragment,
                      null,
                      vue.renderList(searchResults.value, (item, index2) => {
                        return vue.openBlock(), vue.createBlock(SearchResultItem, {
                          key: index2,
                          title: item.title,
                          desc: item.desc
                        }, null, 8, ["title", "desc"]);
                      }),
                      128
                      /* KEYED_FRAGMENT */
                    ))
                  ],
                  64
                  /* STABLE_FRAGMENT */
                ))
              ])
            ], 40, ["onTouchstart", "onTouchend"])
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const SearchPanel = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["__scopeId", "data-v-53dcec99"], ["__file", "F:/LiveHand/LiveHands/components/SearchPanel.vue"]]);
  const _sfc_main$e = {
    __name: "ChatPanel",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "chat-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "chat-body" }, " 聊天界面 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const ChatPanel = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["__scopeId", "data-v-2c15c3a8"], ["__file", "F:/LiveHand/LiveHands/components/ChatPanel.vue"]]);
  const _sfc_main$d = {
    __name: "MainNav",
    props: {
      label: {
        type: Number,
        required: true
      }
    },
    emits: ["click"],
    setup(__props, { emit }) {
      const props2 = __props;
      function handleClick() {
        emit("click", props2.label);
      }
      const labelText = vue.computed(() => {
        switch (props2.label) {
          case 0:
            return "资料";
          case 1:
            return "知识库";
          default:
            return "内容";
        }
      });
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        return vue.openBlock(), vue.createElementBlock("button", { onClick: handleClick }, [
          vue.createElementVNode("span", null, [
            vue.createVNode(_component_u_icon, {
              name: "plus-circle",
              size: "20",
              color: "#fff"
            }),
            vue.createTextVNode(
              " 创建" + vue.toDisplayString(vue.unref(labelText)),
              1
              /* TEXT */
            )
          ])
        ]);
      };
    }
  };
  const MainNav = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["__scopeId", "data-v-f4ed81d8"], ["__file", "F:/LiveHand/LiveHands/components/MainNav.vue"]]);
  const _sfc_main$c = {
    __name: "SelectionPanel",
    props: {
      show: Boolean,
      title: Number,
      items: {
        type: Array,
        default: () => []
      }
    },
    emits: ["update:show", "select"],
    setup(__props, { emit }) {
      function handleSelect(item) {
        emit("select", item);
        emit("update:show", false);
      }
      const startY = vue.ref(0);
      const isMoving = vue.ref(false);
      function onTouchStart(e) {
        startY.value = e.touches[0].clientY;
        isMoving.value = true;
      }
      function onTouchMove(e) {
        if (!isMoving.value)
          return;
        const currentY = e.touches[0].clientY;
        currentY - startY.value;
      }
      function onTouchEnd(e) {
        if (!isMoving.value)
          return;
        isMoving.value = false;
        const endY = e.changedTouches[0].clientY;
        const deltaY = endY - startY.value;
        if (deltaY > 50) {
          emit("update:show", false);
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "bottom",
          round: 10,
          closeOnClickOverlay: "",
          overlay: ""
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "popup-panel",
                onTouchstart: onTouchStart,
                onTouchmove: onTouchMove,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" 顶部滑动把手 "),
                vue.createElementVNode("view", { class: "drag-handle" }),
                vue.createCommentVNode(" 头部 "),
                vue.createElementVNode("view", { class: "popup-header" }, [
                  vue.createElementVNode(
                    "view",
                    { class: "header-title" },
                    vue.toDisplayString(__props.title),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", {
                    class: "header-close",
                    onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("update:show", false))
                  }, [
                    vue.createVNode(_component_u_icon, {
                      name: "close",
                      size: "20",
                      color: "#fff"
                    })
                  ])
                ]),
                vue.createCommentVNode(" 列表 "),
                vue.createElementVNode("view", { class: "popup-list" }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(__props.items, (item, index2) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        key: index2,
                        class: "popup-item",
                        onClick: ($event) => handleSelect(item)
                      }, [
                        vue.createElementVNode("view", { class: "item-left-icon" }, [
                          vue.createVNode(_component_u_icon, {
                            name: item.icon,
                            size: "24",
                            color: "#666"
                          }, null, 8, ["name"])
                        ]),
                        vue.createElementVNode("view", { class: "item-right-content" }, [
                          vue.createElementVNode(
                            "view",
                            { class: "item-title" },
                            vue.toDisplayString(item.title),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode(
                            "view",
                            { class: "item-desc" },
                            vue.toDisplayString(item.desc),
                            1
                            /* TEXT */
                          )
                        ])
                      ], 8, ["onClick"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const SelectionPanel = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["__scopeId", "data-v-33aa29a6"], ["__file", "F:/LiveHand/LiveHands/components/SelectionPanel.vue"]]);
  const _sfc_main$b = {
    __name: "layout",
    setup(__props) {
      const activeTab = vue.ref(0);
      const lastTab = vue.ref(0);
      const showCommonPanel = vue.ref(false);
      const showSearchPanel = vue.ref(false);
      const showChatPanel = vue.ref(false);
      const popupVisible = vue.ref(false);
      const popupItems = vue.ref([]);
      vue.onMounted(() => {
        uni.$on("swipeFromInnerFirstTab", () => {
          if (activeTab.value > 0) {
            activeTab.value--;
          }
        });
      });
      function handleCreateClick(label) {
        formatAppLog("log", "at pages/index/layout.vue:93", "handleCreateClick");
        popupVisible.value = true;
        popupItems.value = label === 0 ? [
          // { title: '新建文件夹', desc: '创建一个新的空文件夹', icon: 'folder' },
          { title: "粘贴链接", desc: "从剪贴板粘贴链接内容", icon: "attach" },
          { title: "拍照", desc: "打开相机拍摄照片", icon: "camera" },
          { title: "上传图片", desc: "从相册选择图片上传", icon: "photo" },
          { title: "实时录音", desc: "录制语音备忘", icon: "mic" },
          { title: "导入音视频", desc: "导入本地音视频文件", icon: "play-circle" },
          { title: "上传文件", desc: "上传各种文件", icon: "file-text" }
        ] : [
          // { title: '新建文件夹', desc: '创建一个新的空文件夹', icon: 'folder' },
          { title: "新建知识库", desc: "创建新的知识库空间", icon: "bag" },
          { title: "导入知识库", desc: "导入已有的知识库数据", icon: "coupon" },
          { title: "新增资料", desc: "添加新的资料内容", icon: "plus" }
        ];
      }
      function handleItemSelect(item) {
        popupVisible.value = false;
        formatAppLog("log", "at pages/index/layout.vue:115", "你点击了：", item);
      }
      function handleTabChange(index2) {
        lastTab.value = activeTab.value;
        activeTab.value = index2;
      }
      function onSwiperChange(e) {
        lastTab.value = activeTab.value;
        activeTab.value = e.detail.current;
      }
      function onSearchClick() {
        if (activeTab.value === 0) {
          showSearchPanel.value = true;
        } else if (activeTab.value === 1) {
          showChatPanel.value = true;
        }
      }
      function onAIClickInAgent() {
        formatAppLog("log", "at pages/index/layout.vue:137", "你现在点击的是智能体页面的 搜索按钮");
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        formatAppLog("log", "at pages/index/layout.vue:154", deltaX);
        formatAppLog("log", "at pages/index/layout.vue:155", deltaY);
        if (deltaX > 30 && activeTab.value === 0 && lastTab.value === 0) {
          showCommonPanel.value = true;
        }
        if (deltaX < 30 && activeTab.value === 2 && lastTab.value === 2)
          ;
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "index-page" }, [
          vue.createElementVNode("view", { class: "index-header" }, [
            vue.createVNode(_component_u_icon, {
              name: "list",
              size: "28",
              onClick: _cache[0] || (_cache[0] = ($event) => showCommonPanel.value = true)
            }),
            vue.createVNode(TabBar, {
              modelValue: activeTab.value,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => activeTab.value = $event),
              onChange: handleTabChange
            }, null, 8, ["modelValue"]),
            activeTab.value == 0 ? (vue.openBlock(), vue.createBlock(_component_u_icon, {
              key: 0,
              name: "search",
              size: "28",
              onClick: onSearchClick
            })) : activeTab.value == 1 ? (vue.openBlock(), vue.createBlock(_component_u_icon, {
              key: 1,
              name: "chat",
              size: "28",
              onClick: onSearchClick
            })) : (vue.openBlock(), vue.createBlock(_component_u_icon, {
              key: 2,
              name: "grid",
              size: "28",
              onClick: onAIClickInAgent
            }))
          ]),
          vue.createElementVNode(
            "view",
            {
              class: "index-content",
              onTouchstart: onTouchStart,
              onTouchend: onTouchEnd
            },
            [
              vue.createVNode(CommonPanel, {
                show: showCommonPanel.value,
                "onUpdate:show": _cache[2] || (_cache[2] = ($event) => showCommonPanel.value = $event)
              }, null, 8, ["show"]),
              activeTab.value === 0 ? (vue.openBlock(), vue.createBlock(SearchPanel, {
                key: 0,
                show: showSearchPanel.value,
                "onUpdate:show": _cache[3] || (_cache[3] = ($event) => showSearchPanel.value = $event)
              }, null, 8, ["show"])) : vue.createCommentVNode("v-if", true),
              activeTab.value === 1 ? (vue.openBlock(), vue.createBlock(ChatPanel, {
                key: 1,
                show: showChatPanel.value,
                "onUpdate:show": _cache[4] || (_cache[4] = ($event) => showChatPanel.value = $event)
              }, null, 8, ["show"])) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode("swiper", {
                current: activeTab.value,
                onChange: onSwiperChange,
                "indicator-dots": false,
                class: "main-swiper"
              }, [
                vue.createElementVNode("swiper-item", null, [
                  vue.createVNode(PagesIndexNotesNotes, { class: "index-container" })
                ]),
                vue.createElementVNode("swiper-item", null, [
                  vue.createVNode(PagesIndexKnowsKnows, { class: "index-container" })
                ]),
                vue.createElementVNode("swiper-item", null, [
                  vue.createVNode(PagesIndexAgentsLayout, { class: "index-container" })
                ])
              ], 40, ["current"])
            ],
            32
            /* HYDRATE_EVENTS */
          ),
          activeTab.value !== 2 ? (vue.openBlock(), vue.createBlock(MainNav, {
            key: 0,
            class: "main-nav",
            label: activeTab.value,
            onClick: handleCreateClick
          }, null, 8, ["label"])) : vue.createCommentVNode("v-if", true),
          vue.createVNode(SelectionPanel, {
            show: popupVisible.value,
            "onUpdate:show": _cache[5] || (_cache[5] = (val) => popupVisible.value = val),
            items: popupItems.value,
            onSelect: handleItemSelect
          }, null, 8, ["show", "items"])
        ]);
      };
    }
  };
  const PagesIndexLayout = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["__scopeId", "data-v-3bba2919"], ["__file", "F:/LiveHand/LiveHands/pages/index/layout.vue"]]);
  const _sfc_main$a = {
    __name: "layout",
    setup(__props) {
      const userStore = useUserStore();
      const isLogin = vue.computed(() => userStore.isLogin);
      formatAppLog("log", "at pages/layout.vue:17", "isLogin", isLogin.value);
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", null, [
          !vue.unref(isLogin) ? (vue.openBlock(), vue.createBlock(PagesLoginLogin, { key: 0 })) : (vue.openBlock(), vue.createBlock(PagesIndexLayout, {
            key: 1,
            class: "index-layout"
          }))
        ]);
      };
    }
  };
  const PagesLayout = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-6df82059"], ["__file", "F:/LiveHand/LiveHands/pages/layout.vue"]]);
  const _sfc_main$9 = {
    data() {
      return {};
    },
    methods: {}
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view");
  }
  const Pages404404 = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$3], ["__file", "F:/LiveHand/LiveHands/pages/404/404.vue"]]);
  const _sfc_main$8 = {
    __name: "verify",
    setup(__props) {
      const phone = vue.ref("");
      const code2 = vue.ref("");
      const countdown = vue.ref(0);
      let timer = null;
      const userStore = useUserStore();
      onLoad((options) => {
        if (options.phone) {
          phone.value = decodeURIComponent(options.phone);
        }
      });
      function goBack() {
        uni.navigateBack();
      }
      function resendCode() {
        uni.showToast({ title: "正在重新获取验证码", icon: "none" });
        countdown.value = 60;
        timer = setInterval(() => {
          countdown.value--;
          if (countdown.value <= 0) {
            clearInterval(timer);
          }
        }, 1e3);
      }
      function onInput() {
        if (code2.value.length === 6) {
          if (code2.value === "123456") {
            const fakeToken = "token_" + Date.now();
            userStore.login(fakeToken);
            uni.reLaunch({ url: "/pages/index/layout" });
          } else {
            uni.showToast({ title: "验证码错误", icon: "error" });
          }
        }
      }
      vue.onUnmounted(() => {
        clearInterval(timer);
      });
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "verify-page" }, [
          vue.createCommentVNode(" 顶部返回按钮 "),
          vue.createElementVNode("view", { class: "top-bar" }, [
            vue.createVNode(_component_u_icon, {
              name: "arrow-left",
              size: "32",
              onClick: goBack
            })
          ]),
          vue.createCommentVNode(" 顶部空白占位（原logo位置空出来） "),
          vue.createElementVNode("view", { class: "top-logo-placeholder" }),
          vue.createCommentVNode(" 标题 "),
          vue.createElementVNode("view", { class: "title" }, "请输入验证码"),
          vue.createCommentVNode(" 提示手机号 "),
          vue.createElementVNode(
            "view",
            { class: "subtitle" },
            " 验证码已经通过短信发送至 " + vue.toDisplayString(phone.value),
            1
            /* TEXT */
          ),
          vue.createCommentVNode(" 验证码输入框 "),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "code-input",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => code2.value = $event),
              maxlength: "6",
              type: "number",
              placeholder: "请输入6位验证码",
              onInput
            },
            null,
            544
            /* HYDRATE_EVENTS, NEED_PATCH */
          ), [
            [vue.vModelText, code2.value]
          ]),
          vue.createCommentVNode(" 重新获取按钮 "),
          vue.createElementVNode("button", {
            class: "resend-btn",
            disabled: countdown.value > 0,
            onClick: resendCode
          }, vue.toDisplayString(countdown.value > 0 ? `${countdown.value}s后重新获取` : "重新获取验证码"), 9, ["disabled"])
        ]);
      };
    }
  };
  const PagesLoginVerify = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-8f8fa650"], ["__file", "F:/LiveHand/LiveHands/pages/login/verify.vue"]]);
  const props$1 = {
    props: {
      // 是否显示圆点
      isDot: {
        type: Boolean,
        default: props$f.badge.isDot
      },
      // 显示的内容
      value: {
        type: [Number, String],
        default: props$f.badge.value
      },
      // 显示的内容
      modelValue: {
        type: [Number, String],
        default: props$f.badge.modelValue
      },
      // 是否显示
      show: {
        type: Boolean,
        default: props$f.badge.show
      },
      // 最大值，超过最大值会显示 '{max}+'
      max: {
        type: [Number, String],
        default: props$f.badge.max
      },
      // 主题类型，error|warning|success|primary
      type: {
        type: String,
        default: props$f.badge.type
      },
      // 当数值为 0 时，是否展示 Badge
      showZero: {
        type: Boolean,
        default: props$f.badge.showZero
      },
      // 背景颜色，优先级比type高，如设置，type参数会失效
      bgColor: {
        type: [String, null],
        default: props$f.badge.bgColor
      },
      // 字体颜色
      color: {
        type: [String, null],
        default: props$f.badge.color
      },
      // 徽标形状，circle-四角均为圆角，horn-左下角为直角
      shape: {
        type: String,
        default: props$f.badge.shape
      },
      // 设置数字的显示方式，overflow|ellipsis|limit
      // overflow会根据max字段判断，超出显示`${max}+`
      // ellipsis会根据max判断，超出显示`${max}...`
      // limit会依据1000作为判断条件，超出1000，显示`${value/1000}K`，比如2.2k、3.34w，最多保留2位小数
      numberType: {
        type: String,
        default: props$f.badge.numberType
      },
      // 设置badge的位置偏移，格式为 [x, y]，也即设置的为top和right的值，absolute为true时有效
      offset: {
        type: Array,
        default: props$f.badge.offset
      },
      // 是否反转背景和字体颜色
      inverted: {
        type: Boolean,
        default: props$f.badge.inverted
      },
      // 是否绝对定位
      absolute: {
        type: Boolean,
        default: props$f.badge.absolute
      }
    }
  };
  const _sfc_main$7 = {
    name: "u-badge",
    mixins: [mpMixin, props$1, mixin],
    computed: {
      // 是否将badge中心与父组件右上角重合
      boxStyle() {
        let style = {};
        return style;
      },
      // 整个组件的样式
      badgeStyle() {
        const style = {};
        if (this.color) {
          style.color = this.color;
        }
        if (this.bgColor && !this.inverted) {
          style.backgroundColor = this.bgColor;
        }
        if (this.absolute) {
          style.position = "absolute";
          if (this.offset.length) {
            const top = this.offset[0];
            const right = this.offset[1] || top;
            style.top = uni.$u.addUnit(top);
            style.right = uni.$u.addUnit(right);
          }
        }
        return style;
      },
      showValue() {
        switch (this.numberType) {
          case "overflow":
            return Number(this.value) > Number(this.max) ? this.max + "+" : this.value;
          case "ellipsis":
            return Number(this.value) > Number(this.max) ? "..." : this.value;
          case "limit":
            return Number(this.value) > 999 ? Number(this.value) >= 9999 ? Math.floor(this.value / 1e4 * 100) / 100 + "w" : Math.floor(this.value / 1e3 * 100) / 100 + "k" : this.value;
          default:
            return Number(this.value);
        }
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return _ctx.show && ((Number(_ctx.value) === 0 ? _ctx.showZero : true) || _ctx.isDot) ? (vue.openBlock(), vue.createElementBlock(
      "text",
      {
        key: 0,
        class: vue.normalizeClass([[_ctx.isDot ? "u-badge--dot" : "u-badge--not-dot", _ctx.inverted && "u-badge--inverted", _ctx.shape === "horn" && "u-badge--horn", `u-badge--${_ctx.type}${_ctx.inverted ? "--inverted" : ""}`], "u-badge"]),
        style: vue.normalizeStyle([_ctx.$u.addStyle(_ctx.customStyle), $options.badgeStyle])
      },
      vue.toDisplayString(_ctx.isDot ? "" : $options.showValue),
      7
      /* TEXT, CLASS, STYLE */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$2], ["__scopeId", "data-v-55e551d7"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-badge/u-badge.vue"]]);
  const props = {
    props: {
      // 滑块的移动过渡时间，单位ms
      duration: {
        type: Number,
        default: props$f.tabs.duration
      },
      // tabs标签数组
      list: {
        type: Array,
        default: props$f.tabs.list
      },
      // 滑块颜色
      lineColor: {
        type: String,
        default: props$f.tabs.lineColor
      },
      // 菜单选择中时的样式
      activeStyle: {
        type: [String, Object],
        default: props$f.tabs.activeStyle
      },
      // 菜单非选中时的样式
      inactiveStyle: {
        type: [String, Object],
        default: props$f.tabs.inactiveStyle
      },
      // 滑块长度
      lineWidth: {
        type: [String, Number],
        default: props$f.tabs.lineWidth
      },
      // 滑块高度
      lineHeight: {
        type: [String, Number],
        default: props$f.tabs.lineHeight
      },
      // 滑块背景显示大小，当滑块背景设置为图片时使用
      lineBgSize: {
        type: String,
        default: props$f.tabs.lineBgSize
      },
      // 菜单item的样式
      itemStyle: {
        type: [String, Object],
        default: props$f.tabs.itemStyle
      },
      // 菜单是否可滚动
      scrollable: {
        type: Boolean,
        default: props$f.tabs.scrollable
      },
      // 当前选中标签的索引
      current: {
        type: [Number, String],
        default: props$f.tabs.current
      },
      // 默认读取的键名
      keyName: {
        type: String,
        default: props$f.tabs.keyName
      }
    }
  };
  const _sfc_main$6 = {
    name: "u-tabs",
    mixins: [mpMixin, mixin, props],
    data() {
      return {
        firstTime: true,
        scrollLeft: 0,
        scrollViewWidth: 0,
        lineOffsetLeft: 0,
        tabsRect: {
          left: 0
        },
        innerCurrent: 0,
        moving: false
      };
    },
    watch: {
      current: {
        immediate: true,
        handler(newValue, oldValue) {
          if (newValue !== this.innerCurrent) {
            this.innerCurrent = newValue;
            this.$nextTick(() => {
              this.resize();
            });
          }
        }
      },
      // list变化时，重新渲染list各项信息
      list() {
        this.$nextTick(() => {
          this.resize();
        });
      }
    },
    computed: {
      textStyle() {
        return (index2) => {
          const style = {};
          const customeStyle = index2 === this.innerCurrent ? uni.$u.addStyle(this.activeStyle) : uni.$u.addStyle(
            this.inactiveStyle
          );
          if (this.list[index2].disabled) {
            style.color = "#c8c9cc";
          }
          return uni.$u.deepMerge(customeStyle, style);
        };
      },
      propsBadge() {
        return uni.$u.props.badge;
      }
    },
    async mounted() {
      this.init();
    },
    emits: ["click", "change"],
    methods: {
      setLineLeft() {
        const tabItem = this.list[this.innerCurrent];
        if (!tabItem) {
          return;
        }
        let lineOffsetLeft = this.list.slice(0, this.innerCurrent).reduce((total, curr) => total + curr.rect.width, 0);
        const lineWidth = uni.$u.getPx(this.lineWidth);
        this.lineOffsetLeft = lineOffsetLeft + (tabItem.rect.width - lineWidth) / 2;
        if (this.firstTime) {
          setTimeout(() => {
            this.firstTime = false;
          }, 10);
        }
      },
      // nvue下设置滑块的位置
      animation(x, duration = 0) {
      },
      // 点击某一个标签
      clickHandler(item, index2) {
        this.$emit("click", {
          ...item,
          index: index2
        });
        if (item.disabled)
          return;
        this.innerCurrent = index2;
        this.resize();
        this.$emit("change", {
          ...item,
          index: index2
        });
      },
      init() {
        uni.$u.sleep().then(() => {
          this.resize();
        });
      },
      setScrollLeft() {
        const tabRect = this.list[this.innerCurrent];
        const offsetLeft = this.list.slice(0, this.innerCurrent).reduce((total, curr) => {
          return total + curr.rect.width;
        }, 0);
        const windowWidth = uni.$u.sys().windowWidth;
        let scrollLeft = offsetLeft - (this.tabsRect.width - tabRect.rect.width) / 2 - (windowWidth - this.tabsRect.right) / 2 + this.tabsRect.left / 2;
        scrollLeft = Math.min(scrollLeft, this.scrollViewWidth - this.tabsRect.width);
        this.scrollLeft = Math.max(0, scrollLeft);
      },
      // 获取所有标签的尺寸
      resize() {
        if (this.list.length === 0) {
          return;
        }
        Promise.all([this.getTabsRect(), this.getAllItemRect()]).then(([tabsRect, itemRect = []]) => {
          this.tabsRect = tabsRect;
          this.scrollViewWidth = 0;
          itemRect.map((item, index2) => {
            this.scrollViewWidth += item.width;
            this.list[index2].rect = item;
          });
          this.setLineLeft();
          this.setScrollLeft();
        });
      },
      // 获取导航菜单的尺寸
      getTabsRect() {
        return new Promise((resolve) => {
          this.queryRect("u-tabs__wrapper__scroll-view").then((size) => resolve(size));
        });
      },
      // 获取所有标签的尺寸
      getAllItemRect() {
        return new Promise((resolve) => {
          const promiseAllArr = this.list.map((item, index2) => this.queryRect(
            `u-tabs__wrapper__nav__item-${index2}`,
            true
          ));
          Promise.all(promiseAllArr).then((sizes) => resolve(sizes));
        });
      },
      // 获取各个标签的尺寸
      queryRect(el, item) {
        return new Promise((resolve) => {
          this.$uGetRect(`.${el}`).then((size) => {
            resolve(size);
          });
        });
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_badge = resolveEasycom(vue.resolveDynamicComponent("u-badge"), __easycom_0);
    return vue.openBlock(), vue.createElementBlock("view", { class: "u-tabs" }, [
      vue.createElementVNode("view", { class: "u-tabs__wrapper" }, [
        vue.renderSlot(_ctx.$slots, "left", {}, void 0, true),
        vue.createElementVNode("view", { class: "u-tabs__wrapper__scroll-view-wrapper" }, [
          vue.createElementVNode("scroll-view", {
            "scroll-x": _ctx.scrollable,
            "scroll-left": $data.scrollLeft,
            "scroll-with-animation": "",
            class: "u-tabs__wrapper__scroll-view",
            "show-scrollbar": false,
            ref: "u-tabs__wrapper__scroll-view"
          }, [
            vue.createElementVNode(
              "view",
              {
                class: "u-tabs__wrapper__nav",
                ref: "u-tabs__wrapper__nav"
              },
              [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(_ctx.list, (item, index2) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: vue.normalizeClass(["u-tabs__wrapper__nav__item", [`u-tabs__wrapper__nav__item-${index2}`, item.disabled && "u-tabs__wrapper__nav__item--disabled"]]),
                      key: index2,
                      onClick: ($event) => $options.clickHandler(item, index2),
                      ref_for: true,
                      ref: `u-tabs__wrapper__nav__item-${index2}`,
                      style: vue.normalizeStyle([_ctx.$u.addStyle(_ctx.itemStyle), { flex: _ctx.scrollable ? "" : 1 }])
                    }, [
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass([[item.disabled && "u-tabs__wrapper__nav__item__text--disabled"], "u-tabs__wrapper__nav__item__text"]),
                          style: vue.normalizeStyle([$options.textStyle(index2)])
                        },
                        vue.toDisplayString(item[_ctx.keyName]),
                        7
                        /* TEXT, CLASS, STYLE */
                      ),
                      vue.createVNode(_component_u_badge, {
                        show: !!(item.badge && (item.badge.show || item.badge.isDot || item.badge.value)),
                        isDot: item.badge && item.badge.isDot || $options.propsBadge.isDot,
                        value: item.badge && item.badge.value || $options.propsBadge.value,
                        max: item.badge && item.badge.max || $options.propsBadge.max,
                        type: item.badge && item.badge.type || $options.propsBadge.type,
                        showZero: item.badge && item.badge.showZero || $options.propsBadge.showZero,
                        bgColor: item.badge && item.badge.bgColor || $options.propsBadge.bgColor,
                        color: item.badge && item.badge.color || $options.propsBadge.color,
                        shape: item.badge && item.badge.shape || $options.propsBadge.shape,
                        numberType: item.badge && item.badge.numberType || $options.propsBadge.numberType,
                        inverted: item.badge && item.badge.inverted || $options.propsBadge.inverted,
                        customStyle: "margin-left: 4px;"
                      }, null, 8, ["show", "isDot", "value", "max", "type", "showZero", "bgColor", "color", "shape", "numberType", "inverted"])
                    ], 14, ["onClick"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                )),
                vue.createElementVNode(
                  "view",
                  {
                    class: "u-tabs__wrapper__nav__line",
                    ref: "u-tabs__wrapper__nav__line",
                    style: vue.normalizeStyle([{
                      width: _ctx.$u.addUnit(_ctx.lineWidth),
                      transform: `translate(${$data.lineOffsetLeft}px)`,
                      transitionDuration: `${$data.firstTime ? 0 : _ctx.duration}ms`,
                      height: _ctx.$u.addUnit(_ctx.lineHeight),
                      background: _ctx.lineColor,
                      backgroundSize: _ctx.lineBgSize
                    }])
                  },
                  null,
                  4
                  /* STYLE */
                )
              ],
              512
              /* NEED_PATCH */
            )
          ], 8, ["scroll-x", "scroll-left"])
        ]),
        vue.renderSlot(_ctx.$slots, "right", {}, void 0, true)
      ])
    ]);
  }
  const __easycom_2 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$1], ["__scopeId", "data-v-33d80d51"], ["__file", "F:/LiveHand/LiveHands/node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/components/u-tabs/u-tabs.vue"]]);
  const _sfc_main$5 = {
    __name: "NoteDetailSumTab",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "chat-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "chat-body" }, " 聊天界面 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const NoteDetailSumTab = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-5ef07a45"], ["__file", "F:/LiveHand/LiveHands/components/tabs/NoteDetailSumTab.vue"]]);
  const _sfc_main$4 = {
    __name: "NoteDetailPosterTab",
    props: {
      show: Boolean,
      tab: Number
    },
    emits: ["update:show"],
    setup(__props, { emit }) {
      function closePopup() {
        emit("update:show", false);
      }
      let startX = 0;
      let startY = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (deltaX > 60 && deltaY < 30) {
          closePopup();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.openBlock(), vue.createBlock(_component_u_popup, {
          show: __props.show,
          mode: "right",
          overlay: true,
          closeable: false,
          onClose: closePopup,
          "onUpdate:show": _cache[0] || (_cache[0] = (val) => emit("update:show", val)),
          duration: 300
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "panel-wrapper",
                onTouchstart: onTouchStart,
                onTouchend: onTouchEnd
              },
              [
                vue.createCommentVNode(" ✅ 顶部返回按钮 "),
                vue.createElementVNode("view", { class: "chat-header" }, [
                  vue.createVNode(_component_u_icon, {
                    name: "arrow-left",
                    size: "24",
                    onClick: closePopup
                  })
                ]),
                vue.createCommentVNode(" 聊天区域 "),
                vue.createElementVNode("view", { class: "chat-body" }, " 聊天界面 ")
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ]),
          _: 1
          /* STABLE */
        }, 8, ["show"]);
      };
    }
  };
  const NoteDetailPosterTab = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-617c8a5c"], ["__file", "F:/LiveHand/LiveHands/components/tabs/NoteDetailPosterTab.vue"]]);
  const _sfc_main$3 = {};
  function _sfc_render(_ctx, _cache) {
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
    return vue.openBlock(), vue.createElementBlock("button", {
      type: "button",
      class: "talk-button"
    }, [
      vue.createVNode(_component_u_icon, {
        name: "phone",
        color: "#ffffff",
        size: "20"
      }),
      vue.createTextVNode(" 语音聊天 ")
    ]);
  }
  const TalkButton = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render], ["__scopeId", "data-v-7d79bddb"], ["__file", "F:/LiveHand/LiveHands/components/children/TalkButton.vue"]]);
  const _sfc_main$2 = {
    __name: "NoteDetails",
    setup(__props) {
      const activeTab = vue.ref(0);
      const lastTab = vue.ref(0);
      const tabList = [
        { name: "总结" },
        { name: "手抄" }
      ];
      const showMore = vue.ref(false);
      const showEdit = vue.ref(false);
      const chatPopupVisible = vue.ref(false);
      const title = vue.ref("");
      const time = vue.ref("");
      const repo = vue.ref("");
      const tags = vue.ref([]);
      onLoad((options) => {
        title.value = decodeURIComponent(options.title || "");
        time.value = options.time || "";
        repo.value = decodeURIComponent(options.repo || "");
        try {
          tags.value = JSON.parse(decodeURIComponent(options.tags || "[]"));
        } catch (e) {
          tags.value = [];
        }
      });
      function onTalkWithAI() {
        formatAppLog("log", "at pages/details/NoteDetails/NoteDetails.vue:135", "功能暂未开放");
      }
      function goBack() {
        uni.navigateBack();
      }
      function onShare() {
        uni.showToast({ title: "点击分享", icon: "none" });
      }
      function handleTabChange(index2) {
        lastTab.value = activeTab.value;
        activeTab.value = index2;
      }
      function onSwiperChange(e) {
        lastTab.value = activeTab.value;
        activeTab.value = e.detail.current;
      }
      let startX = 0;
      let startY = 0;
      let startTabIndex = 0;
      function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTabIndex = activeTab.value;
      }
      function onTouchEnd(e) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = Math.abs(endY - startY);
        if (startTabIndex === 0 && activeTab.value === 0 && deltaX > 50 && deltaY < 30) {
          goBack();
        }
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        const _component_u_tag = resolveEasycom(vue.resolveDynamicComponent("u-tag"), __easycom_1$2);
        const _component_u_tabs = resolveEasycom(vue.resolveDynamicComponent("u-tabs"), __easycom_2);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        const _component_u_modal = resolveEasycom(vue.resolveDynamicComponent("u-modal"), __easycom_4);
        return vue.openBlock(), vue.createElementBlock("view", { class: "note-details-page" }, [
          vue.createCommentVNode(" 顶部固定区域：图标、Header、Tabs "),
          vue.createElementVNode("view", { class: "top-fixed-header" }, [
            vue.createCommentVNode(" 顶部图标 "),
            vue.createElementVNode("view", { class: "top-icon-row" }, [
              vue.createVNode(_component_u_icon, {
                name: "arrow-left",
                size: "24",
                onClick: goBack
              }),
              vue.createElementVNode("view", { class: "right-icons" }, [
                vue.createVNode(_component_u_icon, {
                  name: "share",
                  size: "22",
                  onClick: onShare
                }),
                vue.createVNode(_component_u_icon, {
                  name: "more-dot-fill",
                  size: "22",
                  onClick: _cache[0] || (_cache[0] = ($event) => showMore.value = true)
                })
              ])
            ]),
            vue.createCommentVNode(" Header 卡片 "),
            vue.createElementVNode("view", { class: "note-header-card" }, [
              vue.createElementVNode("view", { class: "note-title-row" }, [
                vue.createElementVNode(
                  "text",
                  { class: "note-title" },
                  vue.toDisplayString(title.value),
                  1
                  /* TEXT */
                ),
                vue.createVNode(_component_u_icon, {
                  name: "edit-pen",
                  size: "18",
                  onClick: _cache[1] || (_cache[1] = ($event) => showEdit.value = true)
                })
              ]),
              vue.createElementVNode("view", { class: "note-meta" }, [
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString(time.value),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "note-separator" }, "|"),
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString(repo.value),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "note-tags" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(tags.value, (tag, i) => {
                    return vue.openBlock(), vue.createBlock(_component_u_tag, {
                      key: i,
                      text: tag.text,
                      type: tag.type,
                      size: "mini",
                      plain: ""
                    }, null, 8, ["text", "type"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ]),
            vue.createCommentVNode(" Tabs栏 "),
            vue.createVNode(_component_u_tabs, {
              list: tabList,
              current: activeTab.value,
              onChange: handleTabChange
            }, null, 8, ["current"])
          ]),
          vue.createCommentVNode(" Swiper 内容区 "),
          vue.createElementVNode(
            "view",
            {
              class: "tab-content-wrapper",
              onTouchstart: onTouchStart,
              onTouchend: onTouchEnd
            },
            [
              vue.createElementVNode("swiper", {
                class: "tab-swiper",
                current: activeTab.value,
                onChange: onSwiperChange,
                "indicator-dots": false
              }, [
                vue.createElementVNode("swiper-item", null, [
                  vue.createElementVNode("scroll-view", {
                    "scroll-y": "",
                    class: "tab-inner-scroll"
                  }, [
                    vue.createVNode(NoteDetailSumTab)
                  ])
                ]),
                vue.createElementVNode("swiper-item", null, [
                  vue.createElementVNode("scroll-view", {
                    "scroll-y": "",
                    class: "tab-inner-scroll"
                  }, [
                    vue.createVNode(NoteDetailPosterTab)
                  ])
                ])
              ], 40, ["current"])
            ],
            32
            /* HYDRATE_EVENTS */
          ),
          vue.createCommentVNode(" 底部聊天栏 "),
          !chatPopupVisible.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "chatbar"
          }, [
            vue.createElementVNode("view", {
              class: "fake-input",
              onClick: _cache[2] || (_cache[2] = ($event) => chatPopupVisible.value = true)
            }, [
              vue.createVNode(_component_u_icon, {
                name: "star",
                size: "22"
              }),
              vue.createElementVNode("text", { class: "fake-input-text" }, "向LiveHands提问...")
            ]),
            vue.createVNode(TalkButton, { onClick: onTalkWithAI }, {
              default: vue.withCtx(() => [
                vue.createTextVNode("发送")
              ]),
              _: 1
              /* STABLE */
            })
          ])) : vue.createCommentVNode("v-if", true),
          vue.createCommentVNode(" 更多操作 popup "),
          vue.createVNode(_component_u_popup, {
            show: showMore.value,
            mode: "bottom",
            onClose: _cache[3] || (_cache[3] = ($event) => showMore.value = false)
          }, null, 8, ["show"]),
          vue.createCommentVNode(" 编辑弹窗 "),
          vue.createVNode(_component_u_modal, {
            show: showEdit.value,
            title: "编辑笔记",
            onConfirm: _cache[4] || (_cache[4] = ($event) => showEdit.value = false),
            onCancel: _cache[5] || (_cache[5] = ($event) => showEdit.value = false)
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("view", { style: { "padding": "20px" } }, "编辑笔记弹窗内容")
            ]),
            _: 1
            /* STABLE */
          }, 8, ["show"]),
          vue.createCommentVNode(" 聊天 popup "),
          vue.createVNode(_component_u_popup, {
            show: chatPopupVisible.value,
            mode: "bottom",
            "safe-area-inset-bottom": true,
            overlay: true,
            "custom-style": { height: "95vh" },
            onClose: _cache[6] || (_cache[6] = ($event) => chatPopupVisible.value = false)
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("scroll-view", {
                style: { "height": "100%" },
                "scroll-y": ""
              }, [
                vue.createElementVNode("view", { style: { "padding": "20px" } }, "AI 聊天内容区域")
              ])
            ]),
            _: 1
            /* STABLE */
          }, 8, ["show"])
        ]);
      };
    }
  };
  const PagesDetailsNoteDetailsNoteDetails = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-ae9b0f4e"], ["__file", "F:/LiveHand/LiveHands/pages/details/NoteDetails/NoteDetails.vue"]]);
  const _sfc_main$1 = {
    __name: "KnowDetails",
    setup(__props) {
      const name = vue.ref("");
      const user = vue.ref("");
      const prompt = vue.ref("");
      const count = vue.ref(0);
      const users = vue.ref(0);
      const time = vue.ref("");
      const tags = vue.ref([]);
      onLoad((options) => {
        name.value = decodeURIComponent(options.name || "");
        user.value = decodeURIComponent(options.user || "");
        prompt.value = decodeURIComponent(options.prompt || "");
        count.value = Number(options.count || 0);
        users.value = Number(options.users || 0);
        time.value = options.time || "";
        try {
          tags.value = JSON.parse(decodeURIComponent(options.tags || "[]"));
        } catch (e) {
          tags.value = [];
        }
      });
      function goBack() {
        uni.navigateBack();
      }
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "know-details" }, [
          vue.createElementVNode("view", { class: "details-header" }, [
            vue.createVNode(_component_u_icon, {
              name: "arrow-left",
              size: "24",
              onClick: goBack
            }),
            vue.createElementVNode(
              "text",
              { class: "details-title" },
              vue.toDisplayString(name.value),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "details-body" }, [
            vue.createElementVNode("text", null, "这里是知识库详情页，目前仅展示基础信息。")
          ])
        ]);
      };
    }
  };
  const PagesDetailsKnowDetailsKnowDetails = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-b4b682e0"], ["__file", "F:/LiveHand/LiveHands/pages/details/KnowDetails/KnowDetails.vue"]]);
  __definePage("pages/layout", PagesLayout);
  __definePage("pages/login/login", PagesLoginLogin);
  __definePage("pages/index/layout", PagesIndexLayout);
  __definePage("pages/index/notes/notes", PagesIndexNotesNotes);
  __definePage("pages/index/knows/knows", PagesIndexKnowsKnows);
  __definePage("pages/index/agents/layout", PagesIndexAgentsLayout);
  __definePage("pages/404/404", Pages404404);
  __definePage("pages/login/verify", PagesLoginVerify);
  __definePage("pages/details/NoteDetails/NoteDetails", PagesDetailsNoteDetailsNoteDetails);
  __definePage("pages/details/KnowDetails/KnowDetails", PagesDetailsKnowDetailsKnowDetails);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "F:/LiveHand/LiveHands/App.vue"]]);
  const { toString } = Object.prototype;
  function isArray(val) {
    return toString.call(val) === "[object Array]";
  }
  function isObject(val) {
    return val !== null && typeof val === "object";
  }
  function isDate(val) {
    return toString.call(val) === "[object Date]";
  }
  function isURLSearchParams(val) {
    return typeof URLSearchParams !== "undefined" && val instanceof URLSearchParams;
  }
  function forEach(obj, fn) {
    if (obj === null || typeof obj === "undefined") {
      return;
    }
    if (typeof obj !== "object") {
      obj = [obj];
    }
    if (isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          fn.call(null, obj[key], key, obj);
        }
      }
    }
  }
  function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }
  function deepMerge$1() {
    const result = {};
    function assignValue(val, key) {
      if (typeof result[key] === "object" && typeof val === "object") {
        result[key] = deepMerge$1(result[key], val);
      } else if (typeof val === "object") {
        result[key] = deepMerge$1({}, val);
      } else {
        result[key] = val;
      }
    }
    for (let i = 0, l = arguments.length; i < l; i++) {
      forEach(arguments[i], assignValue);
    }
    return result;
  }
  function isUndefined(val) {
    return typeof val === "undefined";
  }
  function encode(val) {
    return encodeURIComponent(val).replace(/%40/gi, "@").replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
  }
  function buildURL(url2, params) {
    if (!params) {
      return url2;
    }
    let serializedParams;
    if (isURLSearchParams(params)) {
      serializedParams = params.toString();
    } else {
      const parts = [];
      forEach(params, (val, key) => {
        if (val === null || typeof val === "undefined") {
          return;
        }
        if (isArray(val)) {
          key = `${key}[]`;
        } else {
          val = [val];
        }
        forEach(val, (v) => {
          if (isDate(v)) {
            v = v.toISOString();
          } else if (isObject(v)) {
            v = JSON.stringify(v);
          }
          parts.push(`${encode(key)}=${encode(v)}`);
        });
      });
      serializedParams = parts.join("&");
    }
    if (serializedParams) {
      const hashmarkIndex = url2.indexOf("#");
      if (hashmarkIndex !== -1) {
        url2 = url2.slice(0, hashmarkIndex);
      }
      url2 += (url2.indexOf("?") === -1 ? "?" : "&") + serializedParams;
    }
    return url2;
  }
  function isAbsoluteURL(url2) {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url2);
  }
  function combineURLs(baseURL, relativeURL) {
    return relativeURL ? `${baseURL.replace(/\/+$/, "")}/${relativeURL.replace(/^\/+/, "")}` : baseURL;
  }
  function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
      return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
  }
  function settle(resolve, reject, response) {
    const { validateStatus } = response.config;
    const status = response.statusCode;
    if (status && (!validateStatus || validateStatus(status))) {
      resolve(response);
    } else {
      reject(response);
    }
  }
  const mergeKeys$1 = (keys, config2) => {
    const config3 = {};
    keys.forEach((prop) => {
      if (!isUndefined(config2[prop])) {
        config3[prop] = config2[prop];
      }
    });
    return config3;
  };
  const adapter = (config2) => new Promise((resolve, reject) => {
    const fullPath = buildURL(buildFullPath(config2.baseURL, config2.url), config2.params);
    const _config = {
      url: fullPath,
      header: config2.header,
      complete: (response) => {
        config2.fullPath = fullPath;
        response.config = config2;
        try {
          if (typeof response.data === "string") {
            response.data = JSON.parse(response.data);
          }
        } catch (e) {
        }
        settle(resolve, reject, response);
      }
    };
    let requestTask;
    if (config2.method === "UPLOAD") {
      delete _config.header["content-type"];
      delete _config.header["Content-Type"];
      const otherConfig = {
        filePath: config2.filePath,
        name: config2.name
      };
      const optionalKeys = [
        "files",
        "timeout",
        "formData"
      ];
      requestTask = uni.uploadFile({ ..._config, ...otherConfig, ...mergeKeys$1(optionalKeys, config2) });
    } else if (config2.method === "DOWNLOAD") {
      if (!isUndefined(config2.timeout)) {
        _config.timeout = config2.timeout;
      }
      requestTask = uni.downloadFile(_config);
    } else {
      const optionalKeys = [
        "data",
        "method",
        "timeout",
        "dataType",
        "responseType",
        "sslVerify",
        "firstIpv4"
      ];
      requestTask = uni.request({ ..._config, ...mergeKeys$1(optionalKeys, config2) });
    }
    if (config2.getTask) {
      config2.getTask(requestTask, config2);
    }
  });
  const dispatchRequest = (config2) => adapter(config2);
  function InterceptorManager() {
    this.handlers = [];
  }
  InterceptorManager.prototype.use = function use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled,
      rejected
    });
    return this.handlers.length - 1;
  };
  InterceptorManager.prototype.eject = function eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  };
  InterceptorManager.prototype.forEach = function forEach2(fn) {
    this.handlers.forEach((h) => {
      if (h !== null) {
        fn(h);
      }
    });
  };
  const mergeKeys = (keys, globalsConfig, config2) => {
    const config3 = {};
    keys.forEach((prop) => {
      if (!isUndefined(config2[prop])) {
        config3[prop] = config2[prop];
      } else if (!isUndefined(globalsConfig[prop])) {
        config3[prop] = globalsConfig[prop];
      }
    });
    return config3;
  };
  const mergeConfig = (globalsConfig, config2 = {}) => {
    const method = config2.method || globalsConfig.method || "GET";
    let config3 = {
      baseURL: globalsConfig.baseURL || "",
      method,
      url: config2.url || "",
      params: config2.params || {},
      custom: { ...globalsConfig.custom || {}, ...config2.custom || {} },
      header: deepMerge$1(globalsConfig.header || {}, config2.header || {})
    };
    const defaultToConfig2Keys = ["getTask", "validateStatus"];
    config3 = { ...config3, ...mergeKeys(defaultToConfig2Keys, globalsConfig, config2) };
    if (method === "DOWNLOAD") {
      if (!isUndefined(config2.timeout)) {
        config3.timeout = config2.timeout;
      } else if (!isUndefined(globalsConfig.timeout)) {
        config3.timeout = globalsConfig.timeout;
      }
    } else if (method === "UPLOAD") {
      delete config3.header["content-type"];
      delete config3.header["Content-Type"];
      const uploadKeys = [
        "files",
        "filePath",
        "name",
        "timeout",
        "formData"
      ];
      uploadKeys.forEach((prop) => {
        if (!isUndefined(config2[prop])) {
          config3[prop] = config2[prop];
        }
      });
      if (isUndefined(config3.timeout) && !isUndefined(globalsConfig.timeout)) {
        config3.timeout = globalsConfig.timeout;
      }
    } else {
      const defaultsKeys = [
        "data",
        "timeout",
        "dataType",
        "responseType",
        "sslVerify",
        "firstIpv4"
      ];
      config3 = { ...config3, ...mergeKeys(defaultsKeys, globalsConfig, config2) };
    }
    return config3;
  };
  const defaults = {
    baseURL: "",
    header: {},
    method: "GET",
    dataType: "json",
    responseType: "text",
    custom: {},
    timeout: 6e4,
    sslVerify: true,
    firstIpv4: false,
    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    }
  };
  var clone = function() {
    function _instanceof(obj, type) {
      return type != null && obj instanceof type;
    }
    var nativeMap;
    try {
      nativeMap = Map;
    } catch (_) {
      nativeMap = function() {
      };
    }
    var nativeSet;
    try {
      nativeSet = Set;
    } catch (_) {
      nativeSet = function() {
      };
    }
    var nativePromise;
    try {
      nativePromise = Promise;
    } catch (_) {
      nativePromise = function() {
      };
    }
    function clone2(parent, circular, depth, prototype, includeNonEnumerable) {
      if (typeof circular === "object") {
        depth = circular.depth;
        prototype = circular.prototype;
        includeNonEnumerable = circular.includeNonEnumerable;
        circular = circular.circular;
      }
      var allParents = [];
      var allChildren = [];
      var useBuffer = typeof Buffer != "undefined";
      if (typeof circular == "undefined")
        circular = true;
      if (typeof depth == "undefined")
        depth = Infinity;
      function _clone(parent2, depth2) {
        if (parent2 === null)
          return null;
        if (depth2 === 0)
          return parent2;
        var child;
        var proto;
        if (typeof parent2 != "object") {
          return parent2;
        }
        if (_instanceof(parent2, nativeMap)) {
          child = new nativeMap();
        } else if (_instanceof(parent2, nativeSet)) {
          child = new nativeSet();
        } else if (_instanceof(parent2, nativePromise)) {
          child = new nativePromise(function(resolve, reject) {
            parent2.then(function(value) {
              resolve(_clone(value, depth2 - 1));
            }, function(err) {
              reject(_clone(err, depth2 - 1));
            });
          });
        } else if (clone2.__isArray(parent2)) {
          child = [];
        } else if (clone2.__isRegExp(parent2)) {
          child = new RegExp(parent2.source, __getRegExpFlags(parent2));
          if (parent2.lastIndex)
            child.lastIndex = parent2.lastIndex;
        } else if (clone2.__isDate(parent2)) {
          child = new Date(parent2.getTime());
        } else if (useBuffer && Buffer.isBuffer(parent2)) {
          if (Buffer.from) {
            child = Buffer.from(parent2);
          } else {
            child = new Buffer(parent2.length);
            parent2.copy(child);
          }
          return child;
        } else if (_instanceof(parent2, Error)) {
          child = Object.create(parent2);
        } else {
          if (typeof prototype == "undefined") {
            proto = Object.getPrototypeOf(parent2);
            child = Object.create(proto);
          } else {
            child = Object.create(prototype);
            proto = prototype;
          }
        }
        if (circular) {
          var index2 = allParents.indexOf(parent2);
          if (index2 != -1) {
            return allChildren[index2];
          }
          allParents.push(parent2);
          allChildren.push(child);
        }
        if (_instanceof(parent2, nativeMap)) {
          parent2.forEach(function(value, key) {
            var keyChild = _clone(key, depth2 - 1);
            var valueChild = _clone(value, depth2 - 1);
            child.set(keyChild, valueChild);
          });
        }
        if (_instanceof(parent2, nativeSet)) {
          parent2.forEach(function(value) {
            var entryChild = _clone(value, depth2 - 1);
            child.add(entryChild);
          });
        }
        for (var i in parent2) {
          var attrs = Object.getOwnPropertyDescriptor(parent2, i);
          if (attrs) {
            child[i] = _clone(parent2[i], depth2 - 1);
          }
          try {
            var objProperty = Object.getOwnPropertyDescriptor(parent2, i);
            if (objProperty.set === "undefined") {
              continue;
            }
            child[i] = _clone(parent2[i], depth2 - 1);
          } catch (e) {
            if (e instanceof TypeError) {
              continue;
            } else if (e instanceof ReferenceError) {
              continue;
            }
          }
        }
        if (Object.getOwnPropertySymbols) {
          var symbols = Object.getOwnPropertySymbols(parent2);
          for (var i = 0; i < symbols.length; i++) {
            var symbol = symbols[i];
            var descriptor = Object.getOwnPropertyDescriptor(parent2, symbol);
            if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
              continue;
            }
            child[symbol] = _clone(parent2[symbol], depth2 - 1);
            Object.defineProperty(child, symbol, descriptor);
          }
        }
        if (includeNonEnumerable) {
          var allPropertyNames = Object.getOwnPropertyNames(parent2);
          for (var i = 0; i < allPropertyNames.length; i++) {
            var propertyName = allPropertyNames[i];
            var descriptor = Object.getOwnPropertyDescriptor(parent2, propertyName);
            if (descriptor && descriptor.enumerable) {
              continue;
            }
            child[propertyName] = _clone(parent2[propertyName], depth2 - 1);
            Object.defineProperty(child, propertyName, descriptor);
          }
        }
        return child;
      }
      return _clone(parent, depth);
    }
    clone2.clonePrototype = function clonePrototype(parent) {
      if (parent === null)
        return null;
      var c = function() {
      };
      c.prototype = parent;
      return new c();
    };
    function __objToStr(o) {
      return Object.prototype.toString.call(o);
    }
    clone2.__objToStr = __objToStr;
    function __isDate(o) {
      return typeof o === "object" && __objToStr(o) === "[object Date]";
    }
    clone2.__isDate = __isDate;
    function __isArray(o) {
      return typeof o === "object" && __objToStr(o) === "[object Array]";
    }
    clone2.__isArray = __isArray;
    function __isRegExp(o) {
      return typeof o === "object" && __objToStr(o) === "[object RegExp]";
    }
    clone2.__isRegExp = __isRegExp;
    function __getRegExpFlags(re) {
      var flags = "";
      if (re.global)
        flags += "g";
      if (re.ignoreCase)
        flags += "i";
      if (re.multiline)
        flags += "m";
      return flags;
    }
    clone2.__getRegExpFlags = __getRegExpFlags;
    return clone2;
  }();
  class Request {
    /**
    * @param {Object} arg - 全局配置
    * @param {String} arg.baseURL - 全局根路径
    * @param {Object} arg.header - 全局header
    * @param {String} arg.method = [GET|POST|PUT|DELETE|CONNECT|HEAD|OPTIONS|TRACE] - 全局默认请求方式
    * @param {String} arg.dataType = [json] - 全局默认的dataType
    * @param {String} arg.responseType = [text|arraybuffer] - 全局默认的responseType。支付宝小程序不支持
    * @param {Object} arg.custom - 全局默认的自定义参数
    * @param {Number} arg.timeout - 全局默认的超时时间，单位 ms。默认60000。H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)、微信小程序（2.10.0）、支付宝小程序
    * @param {Boolean} arg.sslVerify - 全局默认的是否验证 ssl 证书。默认true.仅App安卓端支持（HBuilderX 2.3.3+）
    * @param {Boolean} arg.withCredentials - 全局默认的跨域请求时是否携带凭证（cookies）。默认false。仅H5支持（HBuilderX 2.6.15+）
    * @param {Boolean} arg.firstIpv4 - 全DNS解析时优先使用ipv4。默认false。仅 App-Android 支持 (HBuilderX 2.8.0+)
    * @param {Function(statusCode):Boolean} arg.validateStatus - 全局默认的自定义验证器。默认statusCode >= 200 && statusCode < 300
    */
    constructor(arg = {}) {
      if (!isPlainObject(arg)) {
        arg = {};
        formatAppLog("warn", "at node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/libs/luch-request/core/Request.js:39", "设置全局参数必须接收一个Object");
      }
      this.config = clone({ ...defaults, ...arg });
      this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
      };
    }
    /**
    * @Function
    * @param {Request~setConfigCallback} f - 设置全局默认配置
    */
    setConfig(f) {
      this.config = f(this.config);
    }
    middleware(config2) {
      config2 = mergeConfig(this.config, config2);
      const chain = [dispatchRequest, void 0];
      let promise2 = Promise.resolve(config2);
      this.interceptors.request.forEach((interceptor) => {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });
      this.interceptors.response.forEach((interceptor) => {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });
      while (chain.length) {
        promise2 = promise2.then(chain.shift(), chain.shift());
      }
      return promise2;
    }
    /**
    * @Function
    * @param {Object} config - 请求配置项
    * @prop {String} options.url - 请求路径
    * @prop {Object} options.data - 请求参数
    * @prop {Object} [options.responseType = config.responseType] [text|arraybuffer] - 响应的数据类型
    * @prop {Object} [options.dataType = config.dataType] - 如果设为 json，会尝试对返回的数据做一次 JSON.parse
    * @prop {Object} [options.header = config.header] - 请求header
    * @prop {Object} [options.method = config.method] - 请求方法
    * @returns {Promise<unknown>}
    */
    request(config2 = {}) {
      return this.middleware(config2);
    }
    get(url2, options = {}) {
      return this.middleware({
        url: url2,
        method: "GET",
        ...options
      });
    }
    post(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "POST",
        ...options
      });
    }
    put(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "PUT",
        ...options
      });
    }
    delete(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "DELETE",
        ...options
      });
    }
    options(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "OPTIONS",
        ...options
      });
    }
    upload(url2, config2 = {}) {
      config2.url = url2;
      config2.method = "UPLOAD";
      return this.middleware(config2);
    }
    download(url2, config2 = {}) {
      config2.url = url2;
      config2.method = "DOWNLOAD";
      return this.middleware(config2);
    }
  }
  class Router {
    constructor() {
      this.config = {
        type: "navigateTo",
        url: "",
        delta: 1,
        // navigateBack页面后退时,回退的层数
        params: {},
        // 传递的参数
        animationType: "pop-in",
        // 窗口动画,只在APP有效
        animationDuration: 300,
        // 窗口动画持续时间,单位毫秒,只在APP有效
        intercept: false
        // 是否需要拦截
      };
      this.route = this.route.bind(this);
    }
    // 判断url前面是否有"/"，如果没有则加上，否则无法跳转
    addRootPath(url2) {
      return url2[0] === "/" ? url2 : `/${url2}`;
    }
    // 整合路由参数
    mixinParam(url2, params) {
      url2 = url2 && this.addRootPath(url2);
      let query = "";
      if (/.*\/.*\?.*=.*/.test(url2)) {
        query = uni.$u.queryParams(params, false);
        return url2 += `&${query}`;
      }
      query = uni.$u.queryParams(params);
      return url2 += query;
    }
    // 对外的方法名称
    async route(options = {}, params = {}) {
      let mergeConfig2 = {};
      if (typeof options === "string") {
        mergeConfig2.url = this.mixinParam(options, params);
        mergeConfig2.type = "navigateTo";
      } else {
        mergeConfig2 = uni.$u.deepMerge(this.config, options);
        mergeConfig2.url = this.mixinParam(options.url, options.params);
      }
      if (mergeConfig2.url === uni.$u.page())
        return;
      if (params.intercept) {
        this.config.intercept = params.intercept;
      }
      mergeConfig2.params = params;
      mergeConfig2 = uni.$u.deepMerge(this.config, mergeConfig2);
      if (typeof uni.$u.routeIntercept === "function") {
        const isNext = await new Promise((resolve, reject) => {
          uni.$u.routeIntercept(mergeConfig2, resolve);
        });
        isNext && this.openPage(mergeConfig2);
      } else {
        this.openPage(mergeConfig2);
      }
    }
    // 执行路由跳转
    openPage(config2) {
      const {
        url: url2,
        type,
        delta,
        animationType,
        animationDuration
      } = config2;
      if (config2.type == "navigateTo" || config2.type == "to") {
        uni.navigateTo({
          url: url2,
          animationType,
          animationDuration
        });
      }
      if (config2.type == "redirectTo" || config2.type == "redirect") {
        uni.redirectTo({
          url: url2
        });
      }
      if (config2.type == "switchTab" || config2.type == "tab") {
        uni.switchTab({
          url: url2
        });
      }
      if (config2.type == "reLaunch" || config2.type == "launch") {
        uni.reLaunch({
          url: url2
        });
      }
      if (config2.type == "navigateBack" || config2.type == "back") {
        uni.navigateBack({
          delta
        });
      }
    }
  }
  const route = new Router().route;
  function colorGradient(startColor = "rgb(0, 0, 0)", endColor = "rgb(255, 255, 255)", step = 10) {
    const startRGB = hexToRgb(startColor, false);
    const startR = startRGB[0];
    const startG = startRGB[1];
    const startB = startRGB[2];
    const endRGB = hexToRgb(endColor, false);
    const endR = endRGB[0];
    const endG = endRGB[1];
    const endB = endRGB[2];
    const sR = (endR - startR) / step;
    const sG = (endG - startG) / step;
    const sB = (endB - startB) / step;
    const colorArr = [];
    for (let i = 0; i < step; i++) {
      let hex = rgbToHex(`rgb(${Math.round(sR * i + startR)},${Math.round(sG * i + startG)},${Math.round(sB * i + startB)})`);
      if (i === 0)
        hex = rgbToHex(startColor);
      if (i === step - 1)
        hex = rgbToHex(endColor);
      colorArr.push(hex);
    }
    return colorArr;
  }
  function hexToRgb(sColor, str = true) {
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    sColor = String(sColor).toLowerCase();
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        let sColorNew = "#";
        for (let i = 1; i < 4; i += 1) {
          sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
      }
      const sColorChange = [];
      for (let i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt(`0x${sColor.slice(i, i + 2)}`));
      }
      if (!str) {
        return sColorChange;
      }
      return `rgb(${sColorChange[0]},${sColorChange[1]},${sColorChange[2]})`;
    }
    if (/^(rgb|RGB)/.test(sColor)) {
      const arr = sColor.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
      return arr.map((val) => Number(val));
    }
    return sColor;
  }
  function rgbToHex(rgb) {
    const _this = rgb;
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    if (/^(rgb|RGB)/.test(_this)) {
      const aColor = _this.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
      let strHex = "#";
      for (let i = 0; i < aColor.length; i++) {
        let hex = Number(aColor[i]).toString(16);
        hex = String(hex).length == 1 ? `${0}${hex}` : hex;
        if (hex === "0") {
          hex += hex;
        }
        strHex += hex;
      }
      if (strHex.length !== 7) {
        strHex = _this;
      }
      return strHex;
    }
    if (reg.test(_this)) {
      const aNum = _this.replace(/#/, "").split("");
      if (aNum.length === 6) {
        return _this;
      }
      if (aNum.length === 3) {
        let numHex = "#";
        for (let i = 0; i < aNum.length; i += 1) {
          numHex += aNum[i] + aNum[i];
        }
        return numHex;
      }
    } else {
      return _this;
    }
  }
  function colorToRgba(color2, alpha) {
    color2 = rgbToHex(color2);
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    let sColor = String(color2).toLowerCase();
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        let sColorNew = "#";
        for (let i = 1; i < 4; i += 1) {
          sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
      }
      const sColorChange = [];
      for (let i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt(`0x${sColor.slice(i, i + 2)}`));
      }
      return `rgba(${sColorChange.join(",")},${alpha})`;
    }
    return sColor;
  }
  const colorGradient$1 = {
    colorGradient,
    hexToRgb,
    rgbToHex,
    colorToRgba
  };
  function email(value) {
    return /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(value);
  }
  function mobile(value) {
    return /^1[23456789]\d{9}$/.test(value);
  }
  function url(value) {
    return /^((https|http|ftp|rtsp|mms):\/\/)(([0-9a-zA-Z_!~*'().&=+$%-]+: )?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z].[a-zA-Z]{2,6})(:[0-9]{1,4})?((\/?)|(\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]+)+\/?)$/.test(value);
  }
  function date(value) {
    if (!value)
      return false;
    if (number(value))
      value = +value;
    return !/Invalid|NaN/.test(new Date(value).toString());
  }
  function dateISO(value) {
    return /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value);
  }
  function number(value) {
    return /^[\+-]?(\d+\.?\d*|\.\d+|\d\.\d+e\+\d+)$/.test(value);
  }
  function string(value) {
    return typeof value === "string";
  }
  function digits(value) {
    return /^\d+$/.test(value);
  }
  function idCard(value) {
    return /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/.test(
      value
    );
  }
  function carNo(value) {
    const xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF]$)|([DF][A-HJ-NP-Z0-9][0-9]{4}$))/;
    const creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
    if (value.length === 7) {
      return creg.test(value);
    }
    if (value.length === 8) {
      return xreg.test(value);
    }
    return false;
  }
  function amount(value) {
    return /^[1-9]\d*(,\d{3})*(\.\d{1,2})?$|^0\.\d{1,2}$/.test(value);
  }
  function chinese(value) {
    const reg = /^[\u4e00-\u9fa5]+$/gi;
    return reg.test(value);
  }
  function letter(value) {
    return /^[a-zA-Z]*$/.test(value);
  }
  function enOrNum(value) {
    const reg = /^[0-9a-zA-Z]*$/g;
    return reg.test(value);
  }
  function contains(value, param) {
    return value.indexOf(param) >= 0;
  }
  function range$1(value, param) {
    return value >= param[0] && value <= param[1];
  }
  function rangeLength(value, param) {
    return value.length >= param[0] && value.length <= param[1];
  }
  function landline(value) {
    const reg = /^\d{3,4}-\d{7,8}(-\d{3,4})?$/;
    return reg.test(value);
  }
  function empty(value) {
    switch (typeof value) {
      case "undefined":
        return true;
      case "string":
        if (value.replace(/(^[ \t\n\r]*)|([ \t\n\r]*$)/g, "").length == 0)
          return true;
        break;
      case "boolean":
        if (!value)
          return true;
        break;
      case "number":
        if (value === 0 || isNaN(value))
          return true;
        break;
      case "object":
        if (value === null || value.length === 0)
          return true;
        for (const i in value) {
          return false;
        }
        return true;
    }
    return false;
  }
  function jsonString(value) {
    if (typeof value === "string") {
      try {
        const obj = JSON.parse(value);
        if (typeof obj === "object" && obj) {
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
  function array(value) {
    if (typeof Array.isArray === "function") {
      return Array.isArray(value);
    }
    return Object.prototype.toString.call(value) === "[object Array]";
  }
  function object(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }
  function code(value, len = 6) {
    return new RegExp(`^\\d{${len}}$`).test(value);
  }
  function func(value) {
    return typeof value === "function";
  }
  function promise(value) {
    return object(value) && func(value.then) && func(value.catch);
  }
  function image(value) {
    const newValue = value.split("?")[0];
    const IMAGE_REGEXP = /\.(jpeg|jpg|gif|png|svg|webp|jfif|bmp|dpg)/i;
    return IMAGE_REGEXP.test(newValue);
  }
  function video(value) {
    const VIDEO_REGEXP = /\.(mp4|mpg|mpeg|dat|asf|avi|rm|rmvb|mov|wmv|flv|mkv|m3u8)/i;
    return VIDEO_REGEXP.test(value);
  }
  function regExp(o) {
    return o && Object.prototype.toString.call(o) === "[object RegExp]";
  }
  const test = {
    email,
    mobile,
    url,
    date,
    dateISO,
    number,
    digits,
    idCard,
    carNo,
    amount,
    chinese,
    letter,
    enOrNum,
    contains,
    range: range$1,
    rangeLength,
    empty,
    isEmpty: empty,
    jsonString,
    landline,
    object,
    array,
    code,
    func,
    promise,
    video,
    image,
    regExp,
    string
  };
  let timeout = null;
  function debounce(func2, wait = 500, immediate = false) {
    if (timeout !== null)
      clearTimeout(timeout);
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if (callNow)
        typeof func2 === "function" && func2();
    } else {
      timeout = setTimeout(() => {
        typeof func2 === "function" && func2();
      }, wait);
    }
  }
  let flag;
  function throttle(func2, wait = 500, immediate = true) {
    if (immediate) {
      if (!flag) {
        flag = true;
        typeof func2 === "function" && func2();
        setTimeout(() => {
          flag = false;
        }, wait);
      }
    } else if (!flag) {
      flag = true;
      setTimeout(() => {
        flag = false;
        typeof func2 === "function" && func2();
      }, wait);
    }
  }
  function strip(num, precision = 15) {
    return +parseFloat(Number(num).toPrecision(precision));
  }
  function digitLength(num) {
    const eSplit = num.toString().split(/[eE]/);
    const len = (eSplit[0].split(".")[1] || "").length - +(eSplit[1] || 0);
    return len > 0 ? len : 0;
  }
  function float2Fixed(num) {
    if (num.toString().indexOf("e") === -1) {
      return Number(num.toString().replace(".", ""));
    }
    const dLen = digitLength(num);
    return dLen > 0 ? strip(Number(num) * Math.pow(10, dLen)) : Number(num);
  }
  function checkBoundary(num) {
    {
      if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
        formatAppLog("warn", "at node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/libs/function/digit.js:45", `${num} 超出了精度限制，结果可能不正确`);
      }
    }
  }
  function iteratorOperation(arr, operation) {
    const [num1, num2, ...others] = arr;
    let res = operation(num1, num2);
    others.forEach((num) => {
      res = operation(res, num);
    });
    return res;
  }
  function times(...nums) {
    if (nums.length > 2) {
      return iteratorOperation(nums, times);
    }
    const [num1, num2] = nums;
    const num1Changed = float2Fixed(num1);
    const num2Changed = float2Fixed(num2);
    const baseNum = digitLength(num1) + digitLength(num2);
    const leftValue = num1Changed * num2Changed;
    checkBoundary(leftValue);
    return leftValue / Math.pow(10, baseNum);
  }
  function divide(...nums) {
    if (nums.length > 2) {
      return iteratorOperation(nums, divide);
    }
    const [num1, num2] = nums;
    const num1Changed = float2Fixed(num1);
    const num2Changed = float2Fixed(num2);
    checkBoundary(num1Changed);
    checkBoundary(num2Changed);
    return times(num1Changed / num2Changed, strip(Math.pow(10, digitLength(num2) - digitLength(num1))));
  }
  function round(num, ratio) {
    const base = Math.pow(10, ratio);
    let result = divide(Math.round(Math.abs(times(num, base))), base);
    if (num < 0 && result !== 0) {
      result = times(result, -1);
    }
    return result;
  }
  function range(min = 0, max = 0, value = 0) {
    return Math.max(min, Math.min(max, Number(value)));
  }
  function getPx(value, unit = false) {
    if (test.number(value)) {
      return unit ? `${value}px` : Number(value);
    }
    if (/(rpx|upx)$/.test(value)) {
      return unit ? `${uni.upx2px(parseInt(value))}px` : Number(uni.upx2px(parseInt(value)));
    }
    return unit ? `${parseInt(value)}px` : parseInt(value);
  }
  function sleep(value = 30) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, value);
    });
  }
  function os() {
    return uni.getSystemInfoSync().platform.toLowerCase();
  }
  function sys() {
    return uni.getSystemInfoSync();
  }
  function random(min, max) {
    if (min >= 0 && max > 0 && max >= min) {
      const gab = max - min + 1;
      return Math.floor(Math.random() * gab + min);
    }
    return 0;
  }
  function guid(len = 32, firstU = true, radix = null) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    const uuid = [];
    radix = radix || chars.length;
    if (len) {
      for (let i = 0; i < len; i++)
        uuid[i] = chars[0 | Math.random() * radix];
    } else {
      let r;
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
      uuid[14] = "4";
      for (let i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16;
          uuid[i] = chars[i == 19 ? r & 3 | 8 : r];
        }
      }
    }
    if (firstU) {
      uuid.shift();
      return `u${uuid.join("")}`;
    }
    return uuid.join("");
  }
  function $parent(name = void 0) {
    let parent = this.$parent;
    while (parent) {
      if (parent.$options && parent.$options.name !== name) {
        parent = parent.$parent;
      } else {
        return parent;
      }
    }
    return false;
  }
  function addStyle(customStyle, target = "object") {
    if (test.empty(customStyle) || typeof customStyle === "object" && target === "object" || target === "string" && typeof customStyle === "string") {
      return customStyle;
    }
    if (target === "object") {
      customStyle = trim(customStyle);
      const styleArray = customStyle.split(";");
      const style = {};
      for (let i = 0; i < styleArray.length; i++) {
        if (styleArray[i]) {
          const item = styleArray[i].split(":");
          style[trim(item[0])] = trim(item[1]);
        }
      }
      return style;
    }
    let string2 = "";
    for (const i in customStyle) {
      const key = i.replace(/([A-Z])/g, "-$1").toLowerCase();
      string2 += `${key}:${customStyle[i]};`;
    }
    return trim(string2);
  }
  function addUnit(value = "auto", unit = "") {
    if (!unit) {
      unit = uni.$u.config.unit || "px";
    }
    value = String(value);
    return test.number(value) ? `${value}${unit}` : value;
  }
  function deepClone(obj) {
    if ([null, void 0, NaN, false].includes(obj))
      return obj;
    if (typeof obj !== "object" && typeof obj !== "function") {
      return obj;
    }
    const o = test.array(obj) ? [] : {};
    for (const i in obj) {
      if (obj.hasOwnProperty(i)) {
        o[i] = typeof obj[i] === "object" ? deepClone(obj[i]) : obj[i];
      }
    }
    return o;
  }
  function deepMerge(target = {}, source = {}) {
    target = deepClone(target);
    if (typeof target !== "object" || typeof source !== "object")
      return false;
    for (const prop in source) {
      if (!source.hasOwnProperty(prop))
        continue;
      if (prop in target) {
        if (typeof target[prop] !== "object") {
          target[prop] = source[prop];
        } else if (typeof source[prop] !== "object") {
          target[prop] = source[prop];
        } else if (target[prop].concat && source[prop].concat) {
          target[prop] = target[prop].concat(source[prop]);
        } else {
          target[prop] = deepMerge(target[prop], source[prop]);
        }
      } else {
        target[prop] = source[prop];
      }
    }
    return target;
  }
  function error(err) {
    {
      formatAppLog("error", "at node_modules/.pnpm/uview-plus@3.1.23/node_modules/uview-plus/libs/function/index.js:238", `uView提示：${err}`);
    }
  }
  function randomArray(array2 = []) {
    return array2.sort(() => Math.random() - 0.5);
  }
  if (!String.prototype.padStart) {
    String.prototype.padStart = function(maxLength, fillString = " ") {
      if (Object.prototype.toString.call(fillString) !== "[object String]") {
        throw new TypeError(
          "fillString must be String"
        );
      }
      const str = this;
      if (str.length >= maxLength)
        return String(str);
      const fillLength = maxLength - str.length;
      let times2 = Math.ceil(fillLength / fillString.length);
      while (times2 >>= 1) {
        fillString += fillString;
        if (times2 === 1) {
          fillString += fillString;
        }
      }
      return fillString.slice(0, fillLength) + str;
    };
  }
  function timeFormat(dateTime = null, formatStr = "yyyy-mm-dd") {
    let date2;
    if (!dateTime) {
      date2 = /* @__PURE__ */ new Date();
    } else if (/^\d{10}$/.test(dateTime.toString().trim())) {
      date2 = new Date(dateTime * 1e3);
    } else if (typeof dateTime === "string" && /^\d+$/.test(dateTime.trim())) {
      date2 = new Date(Number(dateTime));
    } else {
      date2 = new Date(
        typeof dateTime === "string" ? dateTime.replace(/-/g, "/") : dateTime
      );
    }
    const timeSource = {
      "y": date2.getFullYear().toString(),
      // 年
      "m": (date2.getMonth() + 1).toString().padStart(2, "0"),
      // 月
      "d": date2.getDate().toString().padStart(2, "0"),
      // 日
      "h": date2.getHours().toString().padStart(2, "0"),
      // 时
      "M": date2.getMinutes().toString().padStart(2, "0"),
      // 分
      "s": date2.getSeconds().toString().padStart(2, "0")
      // 秒
      // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (const key in timeSource) {
      const [ret] = new RegExp(`${key}+`).exec(formatStr) || [];
      if (ret) {
        const beginIndex = key === "y" && ret.length === 2 ? 2 : 0;
        formatStr = formatStr.replace(ret, timeSource[key].slice(beginIndex));
      }
    }
    return formatStr;
  }
  function timeFrom(timestamp = null, format = "yyyy-mm-dd") {
    if (timestamp == null)
      timestamp = Number(/* @__PURE__ */ new Date());
    timestamp = parseInt(timestamp);
    if (timestamp.toString().length == 10)
      timestamp *= 1e3;
    let timer = (/* @__PURE__ */ new Date()).getTime() - timestamp;
    timer = parseInt(timer / 1e3);
    let tips = "";
    switch (true) {
      case timer < 300:
        tips = "刚刚";
        break;
      case (timer >= 300 && timer < 3600):
        tips = `${parseInt(timer / 60)}分钟前`;
        break;
      case (timer >= 3600 && timer < 86400):
        tips = `${parseInt(timer / 3600)}小时前`;
        break;
      case (timer >= 86400 && timer < 2592e3):
        tips = `${parseInt(timer / 86400)}天前`;
        break;
      default:
        if (format === false) {
          if (timer >= 2592e3 && timer < 365 * 86400) {
            tips = `${parseInt(timer / (86400 * 30))}个月前`;
          } else {
            tips = `${parseInt(timer / (86400 * 365))}年前`;
          }
        } else {
          tips = timeFormat(timestamp, format);
        }
    }
    return tips;
  }
  function trim(str, pos = "both") {
    str = String(str);
    if (pos == "both") {
      return str.replace(/^\s+|\s+$/g, "");
    }
    if (pos == "left") {
      return str.replace(/^\s*/, "");
    }
    if (pos == "right") {
      return str.replace(/(\s*$)/g, "");
    }
    if (pos == "all") {
      return str.replace(/\s+/g, "");
    }
    return str;
  }
  function queryParams(data = {}, isPrefix = true, arrayFormat = "brackets") {
    const prefix = isPrefix ? "?" : "";
    const _result = [];
    if (["indices", "brackets", "repeat", "comma"].indexOf(arrayFormat) == -1)
      arrayFormat = "brackets";
    for (const key in data) {
      const value = data[key];
      if (["", void 0, null].indexOf(value) >= 0) {
        continue;
      }
      if (value.constructor === Array) {
        switch (arrayFormat) {
          case "indices":
            for (let i = 0; i < value.length; i++) {
              _result.push(`${key}[${i}]=${value[i]}`);
            }
            break;
          case "brackets":
            value.forEach((_value) => {
              _result.push(`${key}[]=${_value}`);
            });
            break;
          case "repeat":
            value.forEach((_value) => {
              _result.push(`${key}=${_value}`);
            });
            break;
          case "comma":
            let commaStr = "";
            value.forEach((_value) => {
              commaStr += (commaStr ? "," : "") + _value;
            });
            _result.push(`${key}=${commaStr}`);
            break;
          default:
            value.forEach((_value) => {
              _result.push(`${key}[]=${_value}`);
            });
        }
      } else {
        _result.push(`${key}=${value}`);
      }
    }
    return _result.length ? prefix + _result.join("&") : "";
  }
  function toast(title, duration = 2e3) {
    uni.showToast({
      title: String(title),
      icon: "none",
      duration
    });
  }
  function type2icon(type = "success", fill = false) {
    if (["primary", "info", "error", "warning", "success"].indexOf(type) == -1)
      type = "success";
    let iconName = "";
    switch (type) {
      case "primary":
        iconName = "info-circle";
        break;
      case "info":
        iconName = "info-circle";
        break;
      case "error":
        iconName = "close-circle";
        break;
      case "warning":
        iconName = "error-circle";
        break;
      case "success":
        iconName = "checkmark-circle";
        break;
      default:
        iconName = "checkmark-circle";
    }
    if (fill)
      iconName += "-fill";
    return iconName;
  }
  function priceFormat(number2, decimals = 0, decimalPoint = ".", thousandsSeparator = ",") {
    number2 = `${number2}`.replace(/[^0-9+-Ee.]/g, "");
    const n = !isFinite(+number2) ? 0 : +number2;
    const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
    const sep = typeof thousandsSeparator === "undefined" ? "," : thousandsSeparator;
    const dec = typeof decimalPoint === "undefined" ? "." : decimalPoint;
    let s = "";
    s = (prec ? round(n, prec) + "" : `${Math.round(n)}`).split(".");
    const re = /(-?\d+)(\d{3})/;
    while (re.test(s[0])) {
      s[0] = s[0].replace(re, `$1${sep}$2`);
    }
    if ((s[1] || "").length < prec) {
      s[1] = s[1] || "";
      s[1] += new Array(prec - s[1].length + 1).join("0");
    }
    return s.join(dec);
  }
  function getDuration(value, unit = true) {
    const valueNum = parseInt(value);
    if (unit) {
      if (/s$/.test(value))
        return value;
      return value > 30 ? `${value}ms` : `${value}s`;
    }
    if (/ms$/.test(value))
      return valueNum;
    if (/s$/.test(value))
      return valueNum > 30 ? valueNum : valueNum * 1e3;
    return valueNum;
  }
  function padZero(value) {
    return `00${value}`.slice(-2);
  }
  function formValidate(instance, event) {
    const formItem = uni.$u.$parent.call(instance, "u-form-item");
    const form = uni.$u.$parent.call(instance, "u-form");
    if (formItem && form) {
      form.validateField(formItem.prop, () => {
      }, event);
    }
  }
  function getProperty(obj, key) {
    if (!obj) {
      return;
    }
    if (typeof key !== "string" || key === "") {
      return "";
    }
    if (key.indexOf(".") !== -1) {
      const keys = key.split(".");
      let firstObj = obj[keys[0]] || {};
      for (let i = 1; i < keys.length; i++) {
        if (firstObj) {
          firstObj = firstObj[keys[i]];
        }
      }
      return firstObj;
    }
    return obj[key];
  }
  function setProperty(obj, key, value) {
    if (!obj) {
      return;
    }
    const inFn = function(_obj, keys, v) {
      if (keys.length === 1) {
        _obj[keys[0]] = v;
        return;
      }
      while (keys.length > 1) {
        const k = keys[0];
        if (!_obj[k] || typeof _obj[k] !== "object") {
          _obj[k] = {};
        }
        keys.shift();
        inFn(_obj[k], keys, v);
      }
    };
    if (typeof key !== "string" || key === "")
      ;
    else if (key.indexOf(".") !== -1) {
      const keys = key.split(".");
      inFn(obj, keys, value);
    } else {
      obj[key] = value;
    }
  }
  function page() {
    const pages2 = getCurrentPages();
    return `/${pages2[pages2.length - 1].route || ""}`;
  }
  function pages() {
    const pages2 = getCurrentPages();
    return pages2;
  }
  function setConfig({
    props: props2 = {},
    config: config2 = {},
    color: color2 = {},
    zIndex: zIndex2 = {}
  }) {
    const {
      deepMerge: deepMerge2
    } = uni.$u;
    uni.$u.config = deepMerge2(uni.$u.config, config2);
    uni.$u.props = deepMerge2(uni.$u.props, props2);
    uni.$u.color = deepMerge2(uni.$u.color, color2);
    uni.$u.zIndex = deepMerge2(uni.$u.zIndex, zIndex2);
  }
  const index = {
    range,
    getPx,
    sleep,
    os,
    sys,
    random,
    guid,
    $parent,
    addStyle,
    addUnit,
    deepClone,
    deepMerge,
    error,
    randomArray,
    timeFormat,
    timeFrom,
    trim,
    queryParams,
    toast,
    type2icon,
    priceFormat,
    getDuration,
    padZero,
    formValidate,
    getProperty,
    setProperty,
    page,
    pages,
    setConfig
  };
  const zIndex = {
    toast: 10090,
    noNetwork: 10080,
    // popup包含popup，actionsheet，keyboard，picker的值
    popup: 10075,
    mask: 10070,
    navbar: 980,
    topTips: 975,
    sticky: 970,
    indexListSticky: 965
  };
  let platform = "none";
  platform = "vue3";
  platform = "plus";
  const platform$1 = platform;
  const $u = {
    route,
    date: index.timeFormat,
    // 另名date
    colorGradient: colorGradient$1.colorGradient,
    hexToRgb: colorGradient$1.hexToRgb,
    rgbToHex: colorGradient$1.rgbToHex,
    colorToRgba: colorGradient$1.colorToRgba,
    test,
    type: ["primary", "success", "error", "warning", "info"],
    http: new Request(),
    config,
    // uView配置信息相关，比如版本号
    zIndex,
    debounce,
    throttle,
    mixin,
    mpMixin,
    props: props$f,
    ...index,
    color,
    platform: platform$1
  };
  uni.$u = $u;
  const install = (Vue2) => {
    Vue2.config.globalProperties.$u = $u;
    Vue2.config.globalProperties.$nextTick = (cb) => {
      cb();
    };
    Vue2.mixin(mixin);
  };
  const uviewPlus = {
    install
  };
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(uviewPlus);
    app.use(createPinia());
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue, uni.VueShared);
