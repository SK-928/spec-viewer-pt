import { getCurrentInstance, getCurrentScope, hasInjectionContext, inject, watch, onMounted, nextTick, onUnmounted, isRef, onScopeDispose, toValue, toRef as toRef$1, readonly, customRef, ref, shallowReadonly, shallowRef, watchEffect, computed, reactive, unref, markRaw, defineComponent, h } from "vue";
function deserializeFunctions(r) {
  return Array.isArray(r) ? r.map(deserializeFunctions) : typeof r == "object" && r !== null ? Object.keys(r).reduce((t, n) => (t[n] = deserializeFunctions(r[n]), t), {}) : typeof r == "string" && r.startsWith("_vp-fn_") ? new Function(`return ${r.slice(7)}`)() : r;
}
const siteData = deserializeFunctions(JSON.parse('{"lang":"en-US","dir":"ltr","title":"SpecViewer","description":"設計書を閲覧するためのサイトです","base":"/","head":[],"router":{"prefetchLinks":true},"appearance":true,"themeConfig":{"nav":[{"text":"Home","link":"/"},{"text":"Examples","link":"/markdown-examples"}],"sidebar":[{"text":"Examples","items":[{"text":"Markdown Examples","link":"/markdown-examples"},{"text":"Runtime API Examples","link":"/api-examples"}]}],"socialLinks":[{"icon":"github","link":"https://github.com/vuejs/vitepress"}]},"locales":{},"scrollOffset":134,"cleanUrls":false,"additionalConfig":{}}'));
function tryOnScopeDispose(fn, failSilently) {
  if (getCurrentScope()) {
    onScopeDispose(fn, failSilently);
    return true;
  }
  return false;
}
const localProvidedStateMap = /* @__PURE__ */ new WeakMap();
const injectLocal = /* @__NO_SIDE_EFFECTS__ */ (...args) => {
  var _getCurrentInstance;
  const key = args[0];
  const instance = (_getCurrentInstance = getCurrentInstance()) === null || _getCurrentInstance === void 0 ? void 0 : _getCurrentInstance.proxy;
  const owner = instance !== null && instance !== void 0 ? instance : getCurrentScope();
  if (owner == null && !hasInjectionContext()) throw new Error("injectLocal must be called in setup");
  if (owner && localProvidedStateMap.has(owner) && key in localProvidedStateMap.get(owner)) return localProvidedStateMap.get(owner)[key];
  return inject(...args);
};
const isClient = typeof window !== "undefined" && typeof document !== "undefined";
typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope;
const notNullish = (val) => val != null;
const toString = Object.prototype.toString;
const isObject$1 = (val) => toString.call(val) === "[object Object]";
const noop = () => {
};
function toRef(...args) {
  if (args.length !== 1) return toRef$1(...args);
  const r = args[0];
  return typeof r === "function" ? readonly(customRef(() => ({
    get: r,
    set: noop
  }))) : ref(r);
}
function createFilterWrapper(filter, fn) {
  function wrapper(...args) {
    return new Promise((resolve, reject) => {
      Promise.resolve(filter(() => fn.apply(this, args), {
        fn,
        thisArg: this,
        args
      })).then(resolve).catch(reject);
    });
  }
  return wrapper;
}
const bypassFilter = (invoke) => {
  return invoke();
};
function debounceFilter(ms, options = {}) {
  let timer;
  let maxTimer;
  let lastRejector = noop;
  const _clearTimeout = (timer2) => {
    clearTimeout(timer2);
    lastRejector();
    lastRejector = noop;
  };
  let lastInvoker;
  const filter = (invoke) => {
    const duration = toValue(ms);
    const maxDuration = toValue(options.maxWait);
    if (timer) _clearTimeout(timer);
    if (duration <= 0 || maxDuration !== void 0 && maxDuration <= 0) {
      if (maxTimer) {
        _clearTimeout(maxTimer);
        maxTimer = void 0;
      }
      return Promise.resolve(invoke());
    }
    return new Promise((resolve, reject) => {
      lastRejector = options.rejectOnCancel ? reject : resolve;
      lastInvoker = invoke;
      if (maxDuration && !maxTimer) maxTimer = setTimeout(() => {
        if (timer) _clearTimeout(timer);
        maxTimer = void 0;
        resolve(lastInvoker());
      }, maxDuration);
      timer = setTimeout(() => {
        if (maxTimer) _clearTimeout(maxTimer);
        maxTimer = void 0;
        resolve(invoke());
      }, duration);
    });
  };
  return filter;
}
function throttleFilter(...args) {
  let lastExec = 0;
  let timer;
  let isLeading = true;
  let lastRejector = noop;
  let lastValue;
  let ms;
  let trailing;
  let leading;
  let rejectOnCancel;
  if (!isRef(args[0]) && typeof args[0] === "object") ({ delay: ms, trailing = true, leading = true, rejectOnCancel = false } = args[0]);
  else [ms, trailing = true, leading = true, rejectOnCancel = false] = args;
  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = void 0;
      lastRejector();
      lastRejector = noop;
    }
  };
  const filter = (_invoke) => {
    const duration = toValue(ms);
    const elapsed = Date.now() - lastExec;
    const invoke = () => {
      return lastValue = _invoke();
    };
    clear();
    if (duration <= 0) {
      lastExec = Date.now();
      return invoke();
    }
    if (elapsed > duration) {
      lastExec = Date.now();
      if (leading || !isLeading) invoke();
    } else if (trailing) lastValue = new Promise((resolve, reject) => {
      lastRejector = rejectOnCancel ? reject : resolve;
      timer = setTimeout(() => {
        lastExec = Date.now();
        isLeading = true;
        resolve(invoke());
        clear();
      }, Math.max(0, duration - elapsed));
    });
    if (!leading && !timer) timer = setTimeout(() => isLeading = true, duration);
    isLeading = false;
    return lastValue;
  };
  return filter;
}
function pausableFilter(extendFilter = bypassFilter, options = {}) {
  const { initialState = "active" } = options;
  const isActive2 = toRef(initialState === "active");
  function pause() {
    isActive2.value = false;
  }
  function resume() {
    isActive2.value = true;
  }
  const eventFilter = (...args) => {
    if (isActive2.value) extendFilter(...args);
  };
  return {
    isActive: shallowReadonly(isActive2),
    pause,
    resume,
    eventFilter
  };
}
function pxValue(px) {
  return px.endsWith("rem") ? Number.parseFloat(px) * 16 : Number.parseFloat(px);
}
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}
function getLifeCycleTarget(target) {
  return getCurrentInstance();
}
// @__NO_SIDE_EFFECTS__
function useDebounceFn(fn, ms = 200, options = {}) {
  return createFilterWrapper(debounceFilter(ms, options), fn);
}
// @__NO_SIDE_EFFECTS__
function useThrottleFn(fn, ms = 200, trailing = false, leading = true, rejectOnCancel = false) {
  return createFilterWrapper(throttleFilter(ms, trailing, leading, rejectOnCancel), fn);
}
function watchWithFilter(source, cb, options = {}) {
  const { eventFilter = bypassFilter, ...watchOptions } = options;
  return watch(source, createFilterWrapper(eventFilter, cb), watchOptions);
}
function watchPausable(source, cb, options = {}) {
  const { eventFilter: filter, initialState = "active", ...watchOptions } = options;
  const { eventFilter, pause, resume, isActive: isActive2 } = pausableFilter(filter, { initialState });
  return {
    stop: watchWithFilter(source, cb, {
      ...watchOptions,
      eventFilter
    }),
    pause,
    resume,
    isActive: isActive2
  };
}
function tryOnMounted(fn, sync = true, target) {
  if (getLifeCycleTarget()) onMounted(fn, target);
  else if (sync) fn();
  else nextTick(fn);
}
function tryOnUnmounted(fn, target) {
  if (getLifeCycleTarget()) onUnmounted(fn, target);
}
function watchImmediate(source, cb, options) {
  return watch(source, cb, {
    ...options,
    immediate: true
  });
}
const defaultWindow = isClient ? window : void 0;
function unrefElement(elRef) {
  var _$el;
  const plain = toValue(elRef);
  return (_$el = plain === null || plain === void 0 ? void 0 : plain.$el) !== null && _$el !== void 0 ? _$el : plain;
}
function useEventListener(...args) {
  const register = (el, event, listener, options) => {
    el.addEventListener(event, listener, options);
    return () => el.removeEventListener(event, listener, options);
  };
  const firstParamTargets = computed(() => {
    const test = toArray(toValue(args[0])).filter((e) => e != null);
    return test.every((e) => typeof e !== "string") ? test : void 0;
  });
  return watchImmediate(() => {
    var _firstParamTargets$va, _firstParamTargets$va2;
    return [
      (_firstParamTargets$va = (_firstParamTargets$va2 = firstParamTargets.value) === null || _firstParamTargets$va2 === void 0 ? void 0 : _firstParamTargets$va2.map((e) => unrefElement(e))) !== null && _firstParamTargets$va !== void 0 ? _firstParamTargets$va : [defaultWindow].filter((e) => e != null),
      toArray(toValue(firstParamTargets.value ? args[1] : args[0])),
      toArray(unref(firstParamTargets.value ? args[2] : args[1])),
      toValue(firstParamTargets.value ? args[3] : args[2])
    ];
  }, ([raw_targets, raw_events, raw_listeners, raw_options], _, onCleanup) => {
    if (!(raw_targets === null || raw_targets === void 0 ? void 0 : raw_targets.length) || !(raw_events === null || raw_events === void 0 ? void 0 : raw_events.length) || !(raw_listeners === null || raw_listeners === void 0 ? void 0 : raw_listeners.length)) return;
    const optionsClone = isObject$1(raw_options) ? { ...raw_options } : raw_options;
    const cleanups = raw_targets.flatMap((el) => raw_events.flatMap((event) => raw_listeners.map((listener) => register(el, event, listener, optionsClone))));
    onCleanup(() => {
      cleanups.forEach((fn) => fn());
    });
  }, { flush: "post" });
}
// @__NO_SIDE_EFFECTS__
function useMounted() {
  const isMounted = shallowRef(false);
  const instance = getCurrentInstance();
  if (instance) onMounted(() => {
    isMounted.value = true;
  }, instance);
  return isMounted;
}
// @__NO_SIDE_EFFECTS__
function useSupported(callback) {
  const isMounted = /* @__PURE__ */ useMounted();
  return computed(() => {
    isMounted.value;
    return Boolean(callback());
  });
}
function useMutationObserver(target, callback, options = {}) {
  const { window: window2 = defaultWindow, ...mutationOptions } = options;
  let observer;
  const isSupported = /* @__PURE__ */ useSupported(() => window2 && "MutationObserver" in window2);
  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = void 0;
    }
  };
  const stopWatch = watch(computed(() => {
    const items = toArray(toValue(target)).map(unrefElement).filter(notNullish);
    return new Set(items);
  }), (newTargets) => {
    cleanup();
    if (isSupported.value && newTargets.size) {
      observer = new MutationObserver(callback);
      newTargets.forEach((el) => observer.observe(el, mutationOptions));
    }
  }, {
    immediate: true,
    flush: "post"
  });
  const takeRecords = () => {
    return observer === null || observer === void 0 ? void 0 : observer.takeRecords();
  };
  const stop = () => {
    stopWatch();
    cleanup();
  };
  tryOnScopeDispose(stop);
  return {
    isSupported,
    stop,
    takeRecords
  };
}
function createKeyPredicate(keyFilter) {
  if (typeof keyFilter === "function") return keyFilter;
  else if (typeof keyFilter === "string") return (event) => event.key === keyFilter;
  else if (Array.isArray(keyFilter)) return (event) => keyFilter.includes(event.key);
  return () => true;
}
function onKeyStroke(...args) {
  let key;
  let handler;
  let options = {};
  if (args.length === 3) {
    key = args[0];
    handler = args[1];
    options = args[2];
  } else if (args.length === 2) if (typeof args[1] === "object") {
    key = true;
    handler = args[0];
    options = args[1];
  } else {
    key = args[0];
    handler = args[1];
  }
  else {
    key = true;
    handler = args[0];
  }
  const { target = defaultWindow, eventName = "keydown", passive = false, dedupe = false } = options;
  const predicate = createKeyPredicate(key);
  const listener = (e) => {
    if (e.repeat && toValue(dedupe)) return;
    if (predicate(e)) handler(e);
  };
  return useEventListener(target, eventName, listener, passive);
}
const ssrWidthSymbol = /* @__PURE__ */ Symbol("vueuse-ssr-width");
// @__NO_SIDE_EFFECTS__
function useSSRWidth() {
  const ssrWidth = hasInjectionContext() ? /* @__PURE__ */ injectLocal(ssrWidthSymbol, null) : null;
  return typeof ssrWidth === "number" ? ssrWidth : void 0;
}
function useMediaQuery(query, options = {}) {
  const { window: window2 = defaultWindow, ssrWidth = /* @__PURE__ */ useSSRWidth() } = options;
  const isSupported = /* @__PURE__ */ useSupported(() => window2 && "matchMedia" in window2 && typeof window2.matchMedia === "function");
  const ssrSupport = shallowRef(typeof ssrWidth === "number");
  const mediaQuery = shallowRef();
  const matches = shallowRef(false);
  const handler = (event) => {
    matches.value = event.matches;
  };
  watchEffect(() => {
    if (ssrSupport.value) {
      ssrSupport.value = !isSupported.value;
      matches.value = toValue(query).split(",").some((queryString) => {
        const not = queryString.includes("not all");
        const minWidth = queryString.match(/\(\s*min-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/);
        const maxWidth = queryString.match(/\(\s*max-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/);
        let res = Boolean(minWidth || maxWidth);
        if (minWidth && res) res = ssrWidth >= pxValue(minWidth[1]);
        if (maxWidth && res) res = ssrWidth <= pxValue(maxWidth[1]);
        return not ? !res : res;
      });
      return;
    }
    if (!isSupported.value) return;
    mediaQuery.value = window2.matchMedia(toValue(query));
    matches.value = mediaQuery.value.matches;
  });
  useEventListener(mediaQuery, "change", handler, { passive: true });
  return computed(() => matches.value);
}
const _global = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey = "__vueuse_ssr_handlers__";
const handlers = /* @__PURE__ */ getHandlers();
function getHandlers() {
  if (!(globalKey in _global)) _global[globalKey] = _global[globalKey] || {};
  return _global[globalKey];
}
function getSSRHandler(key, fallback) {
  return handlers[key] || fallback;
}
// @__NO_SIDE_EFFECTS__
function usePreferredDark(options) {
  return useMediaQuery("(prefers-color-scheme: dark)", options);
}
function guessSerializerType(rawInit) {
  return rawInit == null ? "any" : rawInit instanceof Set ? "set" : rawInit instanceof Map ? "map" : rawInit instanceof Date ? "date" : typeof rawInit === "boolean" ? "boolean" : typeof rawInit === "string" ? "string" : typeof rawInit === "object" ? "object" : !Number.isNaN(rawInit) ? "number" : "any";
}
const StorageSerializers = {
  boolean: {
    read: (v) => v === "true",
    write: (v) => String(v)
  },
  object: {
    read: (v) => JSON.parse(v),
    write: (v) => JSON.stringify(v)
  },
  number: {
    read: (v) => Number.parseFloat(v),
    write: (v) => String(v)
  },
  any: {
    read: (v) => v,
    write: (v) => String(v)
  },
  string: {
    read: (v) => v,
    write: (v) => String(v)
  },
  map: {
    read: (v) => new Map(JSON.parse(v)),
    write: (v) => JSON.stringify(Array.from(v.entries()))
  },
  set: {
    read: (v) => new Set(JSON.parse(v)),
    write: (v) => JSON.stringify(Array.from(v))
  },
  date: {
    read: (v) => new Date(v),
    write: (v) => v.toISOString()
  }
};
const customStorageEventName = "vueuse-storage";
function useStorage(key, defaults, storage, options = {}) {
  var _options$serializer;
  const { flush = "pre", deep = true, listenToStorageChanges = true, writeDefaults = true, mergeDefaults = false, shallow, window: window2 = defaultWindow, eventFilter, onError = (e) => {
    console.error(e);
  }, initOnMounted } = options;
  const data = (shallow ? shallowRef : ref)(typeof defaults === "function" ? defaults() : defaults);
  const keyComputed = computed(() => toValue(key));
  if (!storage) try {
    storage = getSSRHandler("getDefaultStorage", () => defaultWindow === null || defaultWindow === void 0 ? void 0 : defaultWindow.localStorage)();
  } catch (e) {
    onError(e);
  }
  if (!storage) return data;
  const rawInit = toValue(defaults);
  const type = guessSerializerType(rawInit);
  const serializer = (_options$serializer = options.serializer) !== null && _options$serializer !== void 0 ? _options$serializer : StorageSerializers[type];
  const { pause: pauseWatch, resume: resumeWatch } = watchPausable(data, (newValue) => write(newValue), {
    flush,
    deep,
    eventFilter
  });
  watch(keyComputed, () => update(), { flush });
  let firstMounted = false;
  const onStorageEvent = (ev) => {
    if (initOnMounted && !firstMounted) return;
    update(ev);
  };
  const onStorageCustomEvent = (ev) => {
    if (initOnMounted && !firstMounted) return;
    updateFromCustomEvent(ev);
  };
  if (window2 && listenToStorageChanges) if (storage instanceof Storage) useEventListener(window2, "storage", onStorageEvent, { passive: true });
  else useEventListener(window2, customStorageEventName, onStorageCustomEvent);
  if (initOnMounted) tryOnMounted(() => {
    firstMounted = true;
    update();
  });
  else update();
  function dispatchWriteEvent(oldValue, newValue) {
    if (window2) {
      const payload = {
        key: keyComputed.value,
        oldValue,
        newValue,
        storageArea: storage
      };
      window2.dispatchEvent(storage instanceof Storage ? new StorageEvent("storage", payload) : new CustomEvent(customStorageEventName, { detail: payload }));
    }
  }
  function write(v) {
    try {
      const oldValue = storage.getItem(keyComputed.value);
      if (v == null) {
        dispatchWriteEvent(oldValue, null);
        storage.removeItem(keyComputed.value);
      } else {
        const serialized = serializer.write(v);
        if (oldValue !== serialized) {
          storage.setItem(keyComputed.value, serialized);
          dispatchWriteEvent(oldValue, serialized);
        }
      }
    } catch (e) {
      onError(e);
    }
  }
  function read(event) {
    const rawValue = event ? event.newValue : storage.getItem(keyComputed.value);
    if (rawValue == null) {
      if (writeDefaults && rawInit != null) storage.setItem(keyComputed.value, serializer.write(rawInit));
      return rawInit;
    } else if (!event && mergeDefaults) {
      const value = serializer.read(rawValue);
      if (typeof mergeDefaults === "function") return mergeDefaults(value, rawInit);
      else if (type === "object" && !Array.isArray(value)) return {
        ...rawInit,
        ...value
      };
      return value;
    } else if (typeof rawValue !== "string") return rawValue;
    else return serializer.read(rawValue);
  }
  function update(event) {
    if (event && event.storageArea !== storage) return;
    if (event && event.key == null) {
      data.value = rawInit;
      return;
    }
    if (event && event.key !== keyComputed.value) return;
    pauseWatch();
    try {
      const serializedData = serializer.write(data.value);
      if (event === void 0 || (event === null || event === void 0 ? void 0 : event.newValue) !== serializedData) data.value = read(event);
    } catch (e) {
      onError(e);
    } finally {
      if (event) nextTick(resumeWatch);
      else resumeWatch();
    }
  }
  function updateFromCustomEvent(event) {
    update(event.detail);
  }
  return data;
}
const CSS_DISABLE_TRANS = "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}";
function useColorMode(options = {}) {
  const { selector = "html", attribute = "class", initialValue = "auto", window: window2 = defaultWindow, storage, storageKey = "vueuse-color-scheme", listenToStorageChanges = true, storageRef, emitAuto, disableTransition = true } = options;
  const modes = {
    auto: "",
    light: "light",
    dark: "dark",
    ...options.modes || {}
  };
  const preferredDark = /* @__PURE__ */ usePreferredDark({ window: window2 });
  const system = computed(() => preferredDark.value ? "dark" : "light");
  const store = storageRef || (storageKey == null ? toRef(initialValue) : useStorage(storageKey, initialValue, storage, {
    window: window2,
    listenToStorageChanges
  }));
  const state = computed(() => store.value === "auto" ? system.value : store.value);
  const updateHTMLAttrs = getSSRHandler("updateHTMLAttrs", (selector2, attribute2, value) => {
    const el = typeof selector2 === "string" ? window2 === null || window2 === void 0 ? void 0 : window2.document.querySelector(selector2) : unrefElement(selector2);
    if (!el) return;
    const classesToAdd = /* @__PURE__ */ new Set();
    const classesToRemove = /* @__PURE__ */ new Set();
    let attributeToChange = null;
    if (attribute2 === "class") {
      const current = value.split(/\s/g);
      Object.values(modes).flatMap((i) => (i || "").split(/\s/g)).filter(Boolean).forEach((v) => {
        if (current.includes(v)) classesToAdd.add(v);
        else classesToRemove.add(v);
      });
    } else attributeToChange = {
      key: attribute2,
      value
    };
    if (classesToAdd.size === 0 && classesToRemove.size === 0 && attributeToChange === null) return;
    let style;
    if (disableTransition) {
      style = window2.document.createElement("style");
      style.appendChild(document.createTextNode(CSS_DISABLE_TRANS));
      window2.document.head.appendChild(style);
    }
    for (const c of classesToAdd) el.classList.add(c);
    for (const c of classesToRemove) el.classList.remove(c);
    if (attributeToChange) el.setAttribute(attributeToChange.key, attributeToChange.value);
    if (disableTransition) {
      window2.getComputedStyle(style).opacity;
      document.head.removeChild(style);
    }
  });
  function defaultOnChanged(mode) {
    var _modes$mode;
    updateHTMLAttrs(selector, attribute, (_modes$mode = modes[mode]) !== null && _modes$mode !== void 0 ? _modes$mode : mode);
  }
  function onChanged(mode) {
    if (options.onChanged) options.onChanged(mode, defaultOnChanged);
    else defaultOnChanged(mode);
  }
  watch(state, onChanged, {
    flush: "post",
    immediate: true
  });
  tryOnMounted(() => onChanged(state.value));
  const auto = computed({
    get() {
      return emitAuto ? store.value : state.value;
    },
    set(v) {
      store.value = v;
    }
  });
  return Object.assign(auto, {
    store,
    system,
    state
  });
}
function useDark(options = {}) {
  const { valueDark = "dark", valueLight = "" } = options;
  const mode = useColorMode({
    ...options,
    onChanged: (mode2, defaultHandler) => {
      var _options$onChanged;
      if (options.onChanged) (_options$onChanged = options.onChanged) === null || _options$onChanged === void 0 || _options$onChanged.call(options, mode2 === "dark", defaultHandler, mode2);
      else defaultHandler(mode2);
    },
    modes: {
      dark: valueDark,
      light: valueLight
    }
  });
  const system = computed(() => mode.system.value);
  return computed({
    get() {
      return mode.value === "dark";
    },
    set(v) {
      const modeVal = v ? "dark" : "light";
      if (system.value === modeVal) mode.value = "auto";
      else mode.value = modeVal;
    }
  });
}
function resolveElement(el) {
  if (typeof Window !== "undefined" && el instanceof Window) return el.document.documentElement;
  if (typeof Document !== "undefined" && el instanceof Document) return el.documentElement;
  return el;
}
const ARRIVED_STATE_THRESHOLD_PIXELS = 1;
function useScroll(element, options = {}) {
  const { throttle = 0, idle = 200, onStop = noop, onScroll = noop, offset = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }, observe: _observe = { mutation: false }, eventListenerOptions = {
    capture: false,
    passive: true
  }, behavior = "auto", window: window2 = defaultWindow, onError = (e) => {
    console.error(e);
  } } = options;
  const observe = typeof _observe === "boolean" ? { mutation: _observe } : _observe;
  const internalX = shallowRef(0);
  const internalY = shallowRef(0);
  const x = computed({
    get() {
      return internalX.value;
    },
    set(x2) {
      scrollTo2(x2, void 0);
    }
  });
  const y = computed({
    get() {
      return internalY.value;
    },
    set(y2) {
      scrollTo2(void 0, y2);
    }
  });
  function scrollTo2(_x, _y) {
    var _ref, _toValue, _toValue2, _document;
    if (!window2) return;
    const _element = toValue(element);
    if (!_element) return;
    (_ref = _element instanceof Document ? window2.document.body : _element) === null || _ref === void 0 || _ref.scrollTo({
      top: (_toValue = toValue(_y)) !== null && _toValue !== void 0 ? _toValue : y.value,
      left: (_toValue2 = toValue(_x)) !== null && _toValue2 !== void 0 ? _toValue2 : x.value,
      behavior: toValue(behavior)
    });
    const scrollContainer = (_element === null || _element === void 0 || (_document = _element.document) === null || _document === void 0 ? void 0 : _document.documentElement) || (_element === null || _element === void 0 ? void 0 : _element.documentElement) || _element;
    if (x != null) internalX.value = scrollContainer.scrollLeft;
    if (y != null) internalY.value = scrollContainer.scrollTop;
  }
  const isScrolling = shallowRef(false);
  const arrivedState = reactive({
    left: true,
    right: false,
    top: true,
    bottom: false
  });
  const directions = reactive({
    left: false,
    right: false,
    top: false,
    bottom: false
  });
  const onScrollEnd = (e) => {
    if (!isScrolling.value) return;
    isScrolling.value = false;
    directions.left = false;
    directions.right = false;
    directions.top = false;
    directions.bottom = false;
    onStop(e);
  };
  const onScrollEndDebounced = /* @__PURE__ */ useDebounceFn(onScrollEnd, throttle + idle);
  const setArrivedState = (target) => {
    var _document2;
    if (!window2) return;
    const el = (target === null || target === void 0 || (_document2 = target.document) === null || _document2 === void 0 ? void 0 : _document2.documentElement) || (target === null || target === void 0 ? void 0 : target.documentElement) || unrefElement(target);
    const { display, flexDirection, direction } = window2.getComputedStyle(el);
    const directionMultipler = direction === "rtl" ? -1 : 1;
    const scrollLeft = el.scrollLeft;
    directions.left = scrollLeft < internalX.value;
    directions.right = scrollLeft > internalX.value;
    const left = Math.abs(scrollLeft * directionMultipler) <= (offset.left || 0);
    const right = Math.abs(scrollLeft * directionMultipler) + el.clientWidth >= el.scrollWidth - (offset.right || 0) - ARRIVED_STATE_THRESHOLD_PIXELS;
    if (display === "flex" && flexDirection === "row-reverse") {
      arrivedState.left = right;
      arrivedState.right = left;
    } else {
      arrivedState.left = left;
      arrivedState.right = right;
    }
    internalX.value = scrollLeft;
    let scrollTop = el.scrollTop;
    if (target === window2.document && !scrollTop) scrollTop = window2.document.body.scrollTop;
    directions.top = scrollTop < internalY.value;
    directions.bottom = scrollTop > internalY.value;
    const top = Math.abs(scrollTop) <= (offset.top || 0);
    const bottom = Math.abs(scrollTop) + el.clientHeight >= el.scrollHeight - (offset.bottom || 0) - ARRIVED_STATE_THRESHOLD_PIXELS;
    if (display === "flex" && flexDirection === "column-reverse") {
      arrivedState.top = bottom;
      arrivedState.bottom = top;
    } else {
      arrivedState.top = top;
      arrivedState.bottom = bottom;
    }
    internalY.value = scrollTop;
  };
  const onScrollHandler = (e) => {
    var _documentElement;
    if (!window2) return;
    setArrivedState((_documentElement = e.target.documentElement) !== null && _documentElement !== void 0 ? _documentElement : e.target);
    isScrolling.value = true;
    onScrollEndDebounced(e);
    onScroll(e);
  };
  useEventListener(element, "scroll", throttle ? /* @__PURE__ */ useThrottleFn(onScrollHandler, throttle, true, false) : onScrollHandler, eventListenerOptions);
  tryOnMounted(() => {
    try {
      const _element = toValue(element);
      if (!_element) return;
      setArrivedState(_element);
    } catch (e) {
      onError(e);
    }
  });
  if ((observe === null || observe === void 0 ? void 0 : observe.mutation) && element != null && element !== window2 && element !== document) useMutationObserver(element, () => {
    const _element = toValue(element);
    if (!_element) return;
    setArrivedState(_element);
  }, {
    attributes: true,
    childList: true,
    subtree: true
  });
  useEventListener(element, "scrollend", onScrollEnd, eventListenerOptions);
  return {
    x,
    y,
    isScrolling,
    arrivedState,
    directions,
    measure() {
      const _element = toValue(element);
      if (window2 && _element) setArrivedState(_element);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function useNavigatorLanguage(options = {}) {
  const { window: window2 = defaultWindow } = options;
  const navigator = window2 === null || window2 === void 0 ? void 0 : window2.navigator;
  const isSupported = /* @__PURE__ */ useSupported(() => navigator && "language" in navigator);
  const language = shallowRef(navigator === null || navigator === void 0 ? void 0 : navigator.language);
  useEventListener(window2, "languagechange", () => {
    if (navigator) language.value = navigator.language;
  }, { passive: true });
  return {
    isSupported,
    language
  };
}
const elInitialOverflow = /* @__PURE__ */ new WeakMap();
function useScrollLock(element, initialState = false) {
  const isLocked = shallowRef(initialState);
  let initialOverflow = "";
  watch(toRef(element), (el) => {
    const target = resolveElement(toValue(el));
    if (target) {
      const ele = target;
      if (!elInitialOverflow.get(ele)) elInitialOverflow.set(ele, ele.style.overflow);
      if (ele.style.overflow !== "hidden") initialOverflow = ele.style.overflow;
      if (ele.style.overflow === "hidden") return isLocked.value = true;
      if (isLocked.value) return ele.style.overflow = "hidden";
    }
  }, { immediate: true });
  const lock = () => {
    const el = resolveElement(toValue(element));
    if (!el || isLocked.value) return;
    el.style.overflow = "hidden";
    isLocked.value = true;
  };
  const unlock = () => {
    const el = resolveElement(toValue(element));
    if (!el || !isLocked.value) return;
    el.style.overflow = initialOverflow;
    elInitialOverflow.delete(el);
    isLocked.value = false;
  };
  tryOnScopeDispose(unlock);
  return computed({
    get() {
      return isLocked.value;
    },
    set(v) {
      if (v) lock();
      else unlock();
    }
  });
}
function useWindowScroll(options = {}) {
  const { window: window2 = defaultWindow, ...rest } = options;
  return useScroll(window2, rest);
}
// @__NO_SIDE_EFFECTS__
function useWindowSize(options = {}) {
  const { window: window2 = defaultWindow, initialWidth = Number.POSITIVE_INFINITY, initialHeight = Number.POSITIVE_INFINITY, listenOrientation = true, includeScrollbar = true, type = "inner" } = options;
  const width = shallowRef(initialWidth);
  const height = shallowRef(initialHeight);
  const update = () => {
    if (window2) if (type === "outer") {
      width.value = window2.outerWidth;
      height.value = window2.outerHeight;
    } else if (type === "visual" && window2.visualViewport) {
      const { width: visualViewportWidth, height: visualViewportHeight, scale } = window2.visualViewport;
      width.value = Math.round(visualViewportWidth * scale);
      height.value = Math.round(visualViewportHeight * scale);
    } else if (includeScrollbar) {
      width.value = window2.innerWidth;
      height.value = window2.innerHeight;
    } else {
      width.value = window2.document.documentElement.clientWidth;
      height.value = window2.document.documentElement.clientHeight;
    }
  };
  update();
  tryOnMounted(update);
  const listenerOptions = { passive: true };
  useEventListener("resize", update, listenerOptions);
  if (window2 && type === "visual" && window2.visualViewport) useEventListener(window2.visualViewport, "resize", update, listenerOptions);
  if (listenOrientation) watch(useMediaQuery("(orientation: portrait)"), () => update());
  return {
    width,
    height
  };
}
const __vite_import_meta_env__ = {};
const EXTERNAL_URL_RE = /^(?:[a-z]+:|\/\/)/i;
const APPEARANCE_KEY = "vitepress-theme-appearance";
const UnpackStackView = /* @__PURE__ */ Symbol("stack-view:unpack");
const HASH_WITHOUT_FRAGMENT_RE = /#.*?(?=:~:|$)/;
const HASH_OR_QUERY_RE = /[?#].*$/;
const INDEX_OR_EXT_RE = /(?:(^|\/)index)?\.(?:md|html)$/;
const inBrowser = typeof document !== "undefined";
const notFoundPageData = {
  relativePath: "404.md",
  filePath: "",
  title: "404",
  description: "Not Found",
  headers: [],
  frontmatter: { sidebar: false, layout: "page" },
  lastUpdated: 0,
  isNotFound: true
};
function isActive(currentPath, matchPath, asRegex = false) {
  if (matchPath === void 0) {
    return false;
  }
  currentPath = normalize(`/${currentPath}`);
  if (asRegex) {
    return new RegExp(matchPath).test(currentPath);
  }
  if (normalize(matchPath) !== currentPath) {
    return false;
  }
  const hashMatch = matchPath.match(HASH_WITHOUT_FRAGMENT_RE);
  if (hashMatch) {
    return (inBrowser ? location.hash : "") === hashMatch[0];
  }
  return true;
}
function normalize(path) {
  return decodeURI(path).replace(HASH_OR_QUERY_RE, "").replace(INDEX_OR_EXT_RE, "$1");
}
function isExternal(path) {
  return EXTERNAL_URL_RE.test(path);
}
function getLocaleForPath(siteData2, relativePath) {
  return Object.keys(siteData2?.locales || {}).find((key) => key !== "root" && !isExternal(key) && isActive(relativePath, `^/${key}/`, true)) || "root";
}
function resolveSiteDataByRoute(siteData2, relativePath) {
  const localeIndex = getLocaleForPath(siteData2, relativePath);
  const { label, link, ...localeConfig } = siteData2.locales[localeIndex] ?? {};
  Object.assign(localeConfig, { localeIndex });
  const additionalConfigs = resolveAdditionalConfig(siteData2, relativePath);
  const topLayer = {
    head: mergeHead(siteData2.head ?? [], localeConfig.head ?? [], ...additionalConfigs.map((data) => data.head ?? []).reverse())
  };
  return stackView(topLayer, ...additionalConfigs, localeConfig, siteData2);
}
function createTitle(siteData2, pageData) {
  const title = pageData.title || siteData2.title;
  const template = pageData.titleTemplate ?? siteData2.titleTemplate;
  if (typeof template === "string" && template.includes(":title")) {
    return template.replace(/:title/g, title);
  }
  const templateString = createTitleTemplate(siteData2.title, template);
  if (title === templateString.slice(3)) {
    return title;
  }
  return `${title}${templateString}`;
}
function createTitleTemplate(siteTitle, template) {
  if (template === false) {
    return "";
  }
  if (template === true || template === void 0) {
    return ` | ${siteTitle}`;
  }
  if (siteTitle === template) {
    return "";
  }
  return ` | ${template}`;
}
function mergeHead(...headArrays) {
  const merged = [];
  const metaKeyMap = /* @__PURE__ */ new Map();
  for (const current of headArrays) {
    for (const tag of current) {
      const [type, attrs] = tag;
      const keyAttr = Object.entries(attrs)[0];
      if (type !== "meta" || !keyAttr) {
        merged.push(tag);
        continue;
      }
      const key = `${keyAttr[0]}=${keyAttr[1]}`;
      const existingIndex = metaKeyMap.get(key);
      if (existingIndex != null) {
        merged[existingIndex] = tag;
      } else {
        metaKeyMap.set(key, merged.length);
        merged.push(tag);
      }
    }
  }
  return merged;
}
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$&*+,:;<=>?[\]^`{|}\u007F]/g;
const DRIVE_LETTER_REGEX = /^[a-z]:/i;
function sanitizeFileName(name) {
  const match = DRIVE_LETTER_REGEX.exec(name);
  const driveLetter = match ? match[0] : "";
  return driveLetter + name.slice(driveLetter.length).replace(INVALID_CHAR_REGEX, "_").replace(/(^|\/)_+(?=[^/]*$)/, "$1");
}
const KNOWN_EXTENSIONS = /* @__PURE__ */ new Set();
function treatAsHtml(filename) {
  if (KNOWN_EXTENSIONS.size === 0) {
    const extraExts = typeof process === "object" && process.env?.VITE_EXTRA_EXTENSIONS || __vite_import_meta_env__?.VITE_EXTRA_EXTENSIONS || "";
    ("3g2,3gp,aac,ai,apng,au,avif,bin,bmp,cer,class,conf,crl,css,csv,dll,doc,eps,epub,exe,gif,gz,ics,ief,jar,jpe,jpeg,jpg,js,json,jsonld,m4a,man,mid,midi,mjs,mov,mp2,mp3,mp4,mpe,mpeg,mpg,mpp,oga,ogg,ogv,ogx,opus,otf,p10,p7c,p7m,p7s,pdf,png,ps,qt,roff,rtf,rtx,ser,svg,t,tif,tiff,tr,ts,tsv,ttf,txt,vtt,wav,weba,webm,webp,woff,woff2,xhtml,xml,yaml,yml,zip" + (extraExts && typeof extraExts === "string" ? "," + extraExts : "")).split(",").forEach((ext2) => KNOWN_EXTENSIONS.add(ext2));
  }
  const ext = filename.split(".").pop();
  return ext == null || !KNOWN_EXTENSIONS.has(ext.toLowerCase());
}
function resolveAdditionalConfig({ additionalConfig }, path) {
  if (additionalConfig === void 0)
    return [];
  if (typeof additionalConfig === "function")
    return additionalConfig(path) ?? [];
  const configs = [];
  const segments = path.split("/").slice(0, -1);
  while (segments.length) {
    const key = `/${segments.join("/")}/`;
    configs.push(additionalConfig[key]);
    segments.pop();
  }
  configs.push(additionalConfig["/"]);
  return configs.filter((config) => config !== void 0);
}
function stackView(..._layers) {
  const layers = _layers.filter((layer) => isObject(layer));
  if (layers.length <= 1)
    return _layers[0];
  const allKeys = new Set(layers.flatMap((layer) => Reflect.ownKeys(layer)));
  const allKeysArray = [...allKeys];
  return new Proxy({}, {
    // TODO: optimize for performance, this is a hot path
    get(_, prop) {
      if (prop === UnpackStackView)
        return layers;
      return stackView(...layers.map((layer) => layer[prop]).filter((v) => v !== void 0));
    },
    set() {
      throw new Error("StackView is read-only and cannot be mutated.");
    },
    has(_, prop) {
      return allKeys.has(prop);
    },
    ownKeys() {
      return allKeysArray;
    },
    getOwnPropertyDescriptor(_, prop) {
      for (const layer of layers) {
        const descriptor = Object.getOwnPropertyDescriptor(layer, prop);
        if (descriptor)
          return descriptor;
      }
    }
  });
}
stackView.unpack = function(obj) {
  return obj?.[UnpackStackView];
};
function isObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}
const shellLangs = ["shellscript", "shell", "bash", "sh", "zsh"];
function isShell(lang) {
  return shellLangs.includes(lang);
}
const dataSymbol = /* @__PURE__ */ Symbol();
const siteDataRef = shallowRef(readonly(siteData));
function initData(route) {
  const site = computed(() => resolveSiteDataByRoute(siteDataRef.value, route.data.relativePath));
  const appearance = site.value.appearance;
  const isDark = appearance === "force-dark" ? ref(true) : appearance === "force-auto" ? /* @__PURE__ */ usePreferredDark() : appearance ? useDark({
    storageKey: APPEARANCE_KEY,
    initialValue: () => appearance === "dark" ? "dark" : "auto",
    ...typeof appearance === "object" ? appearance : {}
  }) : ref(false);
  const hashRef = ref(inBrowser ? location.hash : "");
  if (inBrowser) {
    window.addEventListener("hashchange", () => {
      hashRef.value = location.hash;
    });
  }
  watch(() => route.data, () => {
    hashRef.value = inBrowser ? location.hash : "";
  });
  return {
    site,
    theme: computed(() => site.value.themeConfig),
    page: computed(() => route.data),
    frontmatter: computed(() => route.data.frontmatter),
    params: computed(() => route.data.params),
    lang: computed(() => site.value.lang),
    dir: computed(() => route.data.frontmatter.dir || site.value.dir),
    localeIndex: computed(() => site.value.localeIndex || "root"),
    title: computed(() => createTitle(site.value, route.data)),
    description: computed(() => route.data.description || site.value.description),
    isDark,
    hash: computed(() => hashRef.value)
  };
}
function useData() {
  const data = inject(dataSymbol);
  if (!data) {
    throw new Error("vitepress data not properly injected in app");
  }
  return data;
}
function joinPath(base, path) {
  return `${base}${path}`.replace(/\/+/g, "/");
}
function withBase(path) {
  return EXTERNAL_URL_RE.test(path) || !path.startsWith("/") ? path : joinPath(siteDataRef.value.base, path);
}
function pathToFile(path) {
  let pagePath = path.replace(/\.html$/, "");
  pagePath = decodeURIComponent(pagePath);
  pagePath = pagePath.replace(/\/$/, "/index");
  {
    if (inBrowser) {
      const base = "/";
      pagePath = sanitizeFileName(pagePath.slice(base.length).replace(/\//g, "_") || "index") + ".md";
      let pageHash = __VP_HASH_MAP__[pagePath.toLowerCase()];
      if (!pageHash) {
        pagePath = pagePath.endsWith("_index.md") ? pagePath.slice(0, -9) + ".md" : pagePath.slice(0, -3) + "_index.md";
        pageHash = __VP_HASH_MAP__[pagePath.toLowerCase()];
      }
      if (!pageHash)
        return null;
      pagePath = `${base}${"assets"}/${pagePath}.${pageHash}.js`;
    } else {
      pagePath = `./${sanitizeFileName(pagePath.slice(1).replace(/\//g, "_"))}.md.js`;
    }
  }
  return pagePath;
}
let contentUpdatedCallbacks = [];
function onContentUpdated(fn) {
  contentUpdatedCallbacks.push(fn);
  tryOnUnmounted(() => {
    contentUpdatedCallbacks = contentUpdatedCallbacks.filter((f) => f !== fn);
  });
}
function getScrollOffset() {
  let scrollOffset = siteDataRef.value.scrollOffset;
  let offset = 0;
  let padding = 24;
  if (typeof scrollOffset === "object" && "padding" in scrollOffset) {
    padding = scrollOffset.padding;
    scrollOffset = scrollOffset.selector;
  }
  if (typeof scrollOffset === "number") {
    offset = scrollOffset;
  } else if (typeof scrollOffset === "string") {
    offset = tryOffsetSelector(scrollOffset, padding);
  } else if (Array.isArray(scrollOffset)) {
    for (const selector of scrollOffset) {
      const res = tryOffsetSelector(selector, padding);
      if (res) {
        offset = res;
        break;
      }
    }
  }
  return offset;
}
function tryOffsetSelector(selector, padding) {
  const el = document.querySelector(selector);
  if (!el)
    return 0;
  const bot = el.getBoundingClientRect().bottom;
  if (bot < 0)
    return 0;
  return bot + padding;
}
const RouterSymbol = /* @__PURE__ */ Symbol();
const fakeHost = "http://a.com";
const getDefaultRoute = () => ({
  path: "/",
  hash: "",
  query: "",
  component: null,
  data: notFoundPageData
});
function createRouter(loadPageModule, fallbackComponent) {
  const route = reactive(getDefaultRoute());
  const router = {
    route,
    async go(href, options) {
      const { hash } = new URL(href, fakeHost);
      const hasTextFragment = inBrowser && document.fragmentDirective && hash.includes(":~:");
      href = normalizeHref(href);
      if (await router.onBeforeRouteChange?.(href) === false)
        return;
      if (!inBrowser || await changeRoute(href, { ...options, hasTextFragment })) {
        await loadPage(href, { initialLoad: !!options?.initialLoad });
      }
      if (hasTextFragment) {
        location.hash = hash;
      }
      syncRouteQueryAndHash();
      await router.onAfterRouteChange?.(href);
    }
  };
  let latestPendingPath = null;
  async function loadPage(href, { scrollPosition = 0, isRetry = false, initialLoad = false } = {}) {
    if (await router.onBeforePageLoad?.(href) === false)
      return;
    const targetLoc = new URL(href, fakeHost);
    const pendingPath = latestPendingPath = targetLoc.pathname;
    try {
      let page = await loadPageModule(pendingPath);
      if (!page)
        throw new Error(`Page not found: ${pendingPath}`);
      if (latestPendingPath === pendingPath) {
        latestPendingPath = null;
        const { default: comp, __pageData } = page;
        if (!comp)
          throw new Error(`Invalid route component: ${comp}`);
        await router.onAfterPageLoad?.(href);
        route.path = inBrowser ? pendingPath : withBase(pendingPath);
        route.component = markRaw(comp);
        route.data = true ? markRaw(__pageData) : readonly(__pageData);
        syncRouteQueryAndHash(targetLoc);
        if (inBrowser) {
          nextTick(() => {
            let actualPathname = siteDataRef.value.base + __pageData.relativePath.replace(/(?:(^|\/)index)?\.md$/, "$1");
            if (!siteDataRef.value.cleanUrls && !actualPathname.endsWith("/")) {
              actualPathname += ".html";
            }
            if (actualPathname !== targetLoc.pathname) {
              targetLoc.pathname = actualPathname;
              href = actualPathname + targetLoc.search + targetLoc.hash;
              history.replaceState({}, "", href);
            }
            if (!initialLoad)
              scrollTo(targetLoc.hash, false, scrollPosition);
          });
        }
      }
    } catch (err) {
      if (!/fetch|Page not found/.test(err.message) && !/^\/404(\.html|\/)?$/.test(href)) {
        console.error(err);
      }
      if (!isRetry) {
        try {
          const res = await fetch(siteDataRef.value.base + "hashmap.json");
          window.__VP_HASH_MAP__ = await res.json();
          await loadPage(href, { scrollPosition, isRetry: true, initialLoad });
          return;
        } catch (e) {
        }
      }
      if (latestPendingPath === pendingPath) {
        latestPendingPath = null;
        route.path = inBrowser ? pendingPath : withBase(pendingPath);
        route.component = fallbackComponent ? markRaw(fallbackComponent) : null;
        const relativePath = inBrowser ? route.path.replace(/(^|\/)$/, "$1index").replace(/(\.html)?$/, ".md").slice(siteDataRef.value.base.length) : "404.md";
        route.data = { ...notFoundPageData, relativePath };
        syncRouteQueryAndHash(targetLoc);
      }
    }
  }
  function syncRouteQueryAndHash(loc = inBrowser ? location : { search: "", hash: "" }) {
    route.query = loc.search;
    route.hash = decodeURIComponent(loc.hash);
  }
  if (inBrowser) {
    if (history.state === null)
      history.replaceState({}, "");
    window.addEventListener("click", (e) => {
      if (e.defaultPrevented || !(e.target instanceof Element) || e.target.closest("button") || // temporary fix for docsearch action buttons
      e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
        return;
      }
      const link = e.target.closest("a");
      if (!link || link.closest(".vp-raw") || link.hasAttribute("download") || link.hasAttribute("target")) {
        return;
      }
      const linkHref = link.getAttribute("href") ?? (link instanceof SVGAElement ? link.getAttribute("xlink:href") : null);
      if (linkHref == null)
        return;
      const { href, origin, pathname } = new URL(linkHref, link.baseURI);
      const currentLoc = new URL(location.href);
      if (origin === currentLoc.origin && treatAsHtml(pathname)) {
        e.preventDefault();
        router.go(href, {
          // use smooth scroll when clicking on header anchor links
          smoothScroll: link.classList.contains("header-anchor")
        });
      }
    }, { capture: true });
    window.addEventListener("popstate", async (e) => {
      if (e.state === null)
        return;
      const href = normalizeHref(location.href);
      await loadPage(href, { scrollPosition: e.state.scrollPosition || 0 });
      syncRouteQueryAndHash();
      await router.onAfterRouteChange?.(href);
    });
    window.addEventListener("hashchange", (e) => {
      e.preventDefault();
      syncRouteQueryAndHash();
    });
  }
  return router;
}
function useRouter() {
  const router = inject(RouterSymbol);
  if (!router)
    throw new Error("useRouter() is called without provider.");
  return router;
}
function useRoute() {
  return useRouter().route;
}
function scrollTo(hash, smooth = false, scrollPosition = 0) {
  if (!hash || scrollPosition) {
    window.scrollTo(0, scrollPosition);
    return;
  }
  let target = null;
  try {
    target = document.getElementById(decodeURIComponent(hash).slice(1));
  } catch (e) {
    console.warn(e);
  }
  if (!target)
    return;
  const targetTop = window.scrollY + target.getBoundingClientRect().top - getScrollOffset() + Number.parseInt(window.getComputedStyle(target).paddingTop, 10) || 0;
  const behavior = window.matchMedia("(prefers-reduced-motion)").matches ? "instant" : (
    // only smooth scroll if distance is smaller than screen height
    smooth && Math.abs(targetTop - window.scrollY) <= window.innerHeight ? "smooth" : "auto"
  );
  const scrollToTarget = () => {
    window.scrollTo({ left: 0, top: targetTop, behavior });
    target.focus({ preventScroll: true });
    if (document.activeElement === target)
      return;
    if (target.hasAttribute("tabindex"))
      return;
    const restoreTabindex = () => {
      target.removeAttribute("tabindex");
      target.removeEventListener("blur", restoreTabindex);
    };
    target.setAttribute("tabindex", "-1");
    target.addEventListener("blur", restoreTabindex);
    target.focus({ preventScroll: true });
    if (document.activeElement !== target)
      restoreTabindex();
  };
  requestAnimationFrame(scrollToTarget);
}
function normalizeHref(href) {
  const url = new URL(href, fakeHost);
  url.pathname = url.pathname.replace(/(^|\/)index(\.html)?$/, "$1");
  if (siteDataRef.value.cleanUrls) {
    url.pathname = url.pathname.replace(/\.html$/, "");
  } else if (!url.pathname.endsWith("/") && !url.pathname.endsWith(".html")) {
    url.pathname += ".html";
  }
  return url.pathname + url.search + url.hash.split(":~:")[0];
}
async function changeRoute(href, { smoothScroll = false, initialLoad = false, replace = false, hasTextFragment = false } = {}) {
  const loc = normalizeHref(location.href);
  const nextUrl = new URL(href, location.origin);
  const currentUrl = new URL(loc, location.origin);
  if (href === loc) {
    if (!initialLoad) {
      if (!hasTextFragment)
        scrollTo(nextUrl.hash, smoothScroll);
      return false;
    }
  } else {
    if (replace) {
      history.replaceState({}, "", href);
    } else {
      history.replaceState({ scrollPosition: window.scrollY }, "");
      history.pushState({}, "", href);
    }
    if (nextUrl.pathname === currentUrl.pathname) {
      if (nextUrl.hash !== currentUrl.hash) {
        window.dispatchEvent(new HashChangeEvent("hashchange", {
          oldURL: currentUrl.href,
          newURL: nextUrl.href
        }));
        if (!hasTextFragment)
          scrollTo(nextUrl.hash, smoothScroll);
      }
      return false;
    }
  }
  return true;
}
const runCbs = () => contentUpdatedCallbacks.forEach((fn) => fn());
const Content = defineComponent({
  name: "VitePressContent",
  props: {
    as: { type: [Object, String], default: "div" }
  },
  setup(props) {
    const route = useRoute();
    const { frontmatter, site } = useData();
    watch(frontmatter, runCbs, { deep: true, flush: "post" });
    return () => h(props.as, site.value.contentProps ?? { style: { position: "relative" } }, [
      route.component ? h(route.component, {
        onVnodeMounted: runCbs,
        onVnodeUpdated: runCbs,
        onVnodeUnmounted: runCbs
      }) : "404 Page Not Found"
    ]);
  }
});
export {
  Content as C,
  EXTERNAL_URL_RE as E,
  RouterSymbol as R,
  isActive as a,
  useMediaQuery as b,
  inBrowser as c,
  useRoute as d,
  useNavigatorLanguage as e,
  useWindowSize as f,
  getScrollOffset as g,
  onKeyStroke as h,
  isExternal as i,
  useWindowScroll as j,
  isObject as k,
  useScrollLock as l,
  isShell as m,
  createTitle as n,
  onContentUpdated as o,
  mergeHead as p,
  pathToFile as q,
  initData as r,
  dataSymbol as s,
  treatAsHtml as t,
  useData as u,
  siteDataRef as v,
  withBase as w,
  createRouter as x
};
