var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { createSequenceHooksCollection, createGuardsCollection, createPipelineCollection } from "hookar";
import { createLogger } from "consolite";
import { createClient } from "@supabase/supabase-js";
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function validate_store(store, name) {
  if (store != null && typeof store.subscribe !== "function") {
    throw new Error(`'${name}' is not a store with a 'subscribe' method`);
  }
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
  let value;
  subscribe(store, (_) => value = _)();
  return value;
}
function compute_rest_props(props, keys) {
  const rest = {};
  keys = new Set(keys);
  for (const k in props)
    if (!keys.has(k) && k[0] !== "$")
      rest[k] = props[k];
  return rest;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
  return context;
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
Promise.resolve();
const boolean_attributes = /* @__PURE__ */ new Set([
  "allowfullscreen",
  "allowpaymentrequest",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
]);
const invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
function spread(args, attrs_to_add) {
  const attributes = Object.assign({}, ...args);
  if (attrs_to_add) {
    const classes_to_add = attrs_to_add.classes;
    const styles_to_add = attrs_to_add.styles;
    if (classes_to_add) {
      if (attributes.class == null) {
        attributes.class = classes_to_add;
      } else {
        attributes.class += " " + classes_to_add;
      }
    }
    if (styles_to_add) {
      if (attributes.style == null) {
        attributes.style = style_object_to_string(styles_to_add);
      } else {
        attributes.style = style_object_to_string(merge_ssr_styles(attributes.style, styles_to_add));
      }
    }
  }
  let str = "";
  Object.keys(attributes).forEach((name) => {
    if (invalid_attribute_name_character.test(name))
      return;
    const value = attributes[name];
    if (value === true)
      str += " " + name;
    else if (boolean_attributes.has(name.toLowerCase())) {
      if (value)
        str += " " + name;
    } else if (value != null) {
      str += ` ${name}="${value}"`;
    }
  });
  return str;
}
function merge_ssr_styles(style_attribute, style_directive) {
  const style_object = {};
  for (const individual_style of style_attribute.split(";")) {
    const colon_index = individual_style.indexOf(":");
    const name = individual_style.slice(0, colon_index).trim();
    const value = individual_style.slice(colon_index + 1).trim();
    if (!name)
      continue;
    style_object[name] = value;
  }
  for (const name in style_directive) {
    const value = style_directive[name];
    if (value) {
      style_object[name] = value;
    } else {
      delete style_object[name];
    }
  }
  return style_object;
}
const ATTR_REGEX = /[&"]/g;
const CONTENT_REGEX = /[&<]/g;
function escape(value, is_attr = false) {
  const str = String(value);
  const pattern = is_attr ? ATTR_REGEX : CONTENT_REGEX;
  pattern.lastIndex = 0;
  let escaped = "";
  let last = 0;
  while (pattern.test(str)) {
    const i = pattern.lastIndex - 1;
    const ch = str[i];
    escaped += str.substring(last, i) + (ch === "&" ? "&amp;" : ch === '"' ? "&quot;" : "&lt;");
    last = i + 1;
  }
  return escaped + str.substring(last);
}
function escape_attribute_value(value) {
  const should_escape = typeof value === "string" || value && typeof value === "object";
  return should_escape ? escape(value, true) : value;
}
function escape_object(obj) {
  const result = {};
  for (const key in obj) {
    result[key] = escape_attribute_value(obj[key]);
  }
  return result;
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules. Otherwise you may need to fix a <${name}>.`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(context || (parent_component ? parent_component.$$.context : [])),
      // these will be immediately discarded
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = /* @__PURE__ */ new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: /* @__PURE__ */ new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
          // TODO
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  const assignment = boolean && value === true ? "" : `="${escape(value, true)}"`;
  return ` ${name}${assignment}`;
}
function style_object_to_string(style_object) {
  return Object.keys(style_object).filter((key) => style_object[key]).map((key) => `${key}: ${escape_attribute_value(style_object[key])};`).join(" ");
}
const routes = {
  "meta": {},
  "id": "_default",
  "name": "",
  "file": {
    "path": "src/routes",
    "dir": "src",
    "base": "routes",
    "ext": "",
    "name": "routes"
  },
  "rootName": "default",
  "routifyDir": import.meta.url,
  "children": [
    {
      "meta": {},
      "id": "_default__layout_svelte",
      "name": "_layout",
      "file": {
        "path": "src/routes/_layout.svelte",
        "dir": "src/routes",
        "base": "_layout.svelte",
        "ext": ".svelte",
        "name": "_layout"
      },
      "asyncModule": () => Promise.resolve().then(() => _layout),
      "children": []
    },
    {
      "meta": {},
      "id": "_default_games_svelte",
      "name": "games",
      "file": {
        "path": "src/routes/games.svelte",
        "dir": "src/routes",
        "base": "games.svelte",
        "ext": ".svelte",
        "name": "games"
      },
      "asyncModule": () => Promise.resolve().then(() => games),
      "children": []
    },
    {
      "meta": {
        "isDefault": true
      },
      "id": "_default_index_svelte",
      "name": "index",
      "file": {
        "path": "src/routes/index.svelte",
        "dir": "src/routes",
        "base": "index.svelte",
        "ext": ".svelte",
        "name": "index"
      },
      "asyncModule": () => Promise.resolve().then(() => index),
      "children": []
    },
    {
      "meta": {
        "dynamic": true,
        "dynamicSpread": true,
        "order": false
      },
      "name": "[...404]",
      "file": {
        "path": ".routify/components/[...404].svelte",
        "dir": ".routify/components",
        "base": "[...404].svelte",
        "ext": ".svelte",
        "name": "[...404]"
      },
      "asyncModule": () => Promise.resolve().then(() => ____404_),
      "children": []
    }
  ]
};
const routes_default = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: routes
}, Symbol.toStringTag, { value: "Module" }));
const subscriber_queue = [];
function readable(value, start) {
  return {
    subscribe: writable(value, start).subscribe
  };
}
function writable(value, start = noop) {
  let stop;
  const subscribers = /* @__PURE__ */ new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function derived(stores, fn, initial_value) {
  const single = !Array.isArray(stores);
  const stores_array = single ? [stores] : stores;
  const auto = fn.length < 2;
  return readable(initial_value, (set) => {
    let inited = false;
    const values = [];
    let pending = 0;
    let cleanup = noop;
    const sync = () => {
      if (pending) {
        return;
      }
      cleanup();
      const result = fn(single ? values[0] : values, set);
      if (auto) {
        set(result);
      } else {
        cleanup = is_function(result) ? result : noop;
      }
    };
    const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
      values[i] = value;
      pending &= ~(1 << i);
      if (inited) {
        sync();
      }
    }, () => {
      pending |= 1 << i;
    }));
    inited = true;
    sync();
    return function stop() {
      run_all(unsubscribers);
      cleanup();
    };
  });
}
const log = createLogger("[rf3]");
log.register("verbose", console.log);
log.levels.verbose = 5;
const createRootLogger = () => {
  Object.assign(log, loadState());
  return new Proxy(log, {
    get: (target, prop) => target[prop],
    set: (target, prop, value) => {
      target[prop] = value;
      saveState(log);
      return true;
    }
  });
};
const loadState = () => {
  if (typeof window === "undefined") {
    const level = {}.DEBUG_LEVEL;
    const filter = {}.DEBUG_FILTER;
    return { level, filter };
  } else {
    return JSON.parse(localStorage.getItem("__routify.logState") || "{}");
  }
};
const saveState = (log2) => {
  const { level, filter } = log2;
  if (typeof window === "undefined") {
    level({}).DEBUG_FILTER = filter;
  } else
    localStorage.setItem("__routify.logState", JSON.stringify({ filter, level }));
};
const debugWrapper = (fn, msg) => (
  /** @ts-ignore */
  (...params) => {
    const result = fn(...params);
    log.debug(msg, { params, result });
    return result;
  }
);
const createBrowserAdapter = (opts) => {
  const delimiter = (opts == null ? void 0 : opts.delimiter) || ";";
  return {
    // Called by each router when the browser URL changes. Returns an internal URL for each respective router.
    toRouter: (url2, router2) => {
      const formatRE = router2.name ? `${router2.name}/(.+?)` : `(.+?)`;
      const RE = new RegExp(`(^|${delimiter})${formatRE}(${delimiter}|$)`);
      const matches = url2.match(RE);
      return matches ? matches[2] : "/";
    },
    // compiles all router URLS into a single URL for the browser.
    toBrowser: (routers) => routers.filter((r) => r.url.external() !== "" || !r.name).map((r) => (r.name ? `${r.name}` : "") + r.url.external()).join(delimiter)
  };
};
class AppInstance {
  constructor() {
    /** @type {RoutifyRuntime[]} */
    __publicField(this, "instances", []);
    /** @type {import('../helpers/preload.js').RoutesMap} */
    __publicField(this, "routeMaps", {});
    __publicField(this, "browserAdapter", createBrowserAdapter());
    /** @param {Router} router */
    __publicField(this, "urlFromBrowser", (router2) => {
      if (debugWrapper)
        return debugWrapper(
          this.browserAdapter.toRouter,
          "calling browserAdapter.toRouter"
        )(urlFromAddress(), router2);
      return this.browserAdapter.toRouter(urlFromAddress(), router2);
    });
    globalThis["__routify"] = this;
    this.log = createRootLogger();
  }
  /** @type {Router[]} */
  get routers() {
    return [].concat(...this.instances.map((instance) => instance.routers));
  }
  register(instance) {
    this.instances.push(instance);
    return this;
  }
}
const appInstance = new AppInstance();
const CTX = "routify-fragment-context";
const getRoutifyFragmentContext = () => getContext(CTX);
const getRoutifyFragmentContextMaybe = () => {
  try {
    const ctx = getRoutifyFragmentContext();
    return ctx;
  } catch (e) {
  }
};
const setRoutifyFragmentContext = (value) => setContext(CTX, value);
const shouldIgnoreClick = (event) => event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button || event.key && event.key !== "Enter" || event.defaultPrevented;
const parseValue = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};
const extractRoutifyStateData = (el) => {
  const routifyRouteState = {};
  for (let key in el.dataset) {
    if (key.startsWith("routifyRouteState")) {
      const shortKey = key.replace("routifyRouteState", "");
      const finalKey = shortKey.charAt(0).toLowerCase() + shortKey.slice(1);
      routifyRouteState[finalKey] = parseValue(el.dataset[key]);
    }
  }
  return routifyRouteState;
};
const getUrlFromEvent = (event) => {
  const el = event.target.closest("a");
  const href = el && el.href;
  if (!href || el.target || el.host !== location.host)
    return {};
  const urlObj = new URL(href);
  event.preventDefault();
  return {
    url: urlObj.pathname + urlObj.search + urlObj.hash,
    state: extractRoutifyStateData(el)
  };
};
const fromEntries = (iterable) => {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val;
    return obj;
  }, {});
};
const populateUrl = (path, params, overloadStringifier) => {
  const overloads = {};
  Object.entries(params).forEach(([param, value]) => {
    const RE = new RegExp(`\\[(...)?${param}\\]|\\:${param}`);
    value = Array.isArray(value) ? value.join("/") : value;
    if (path.match(RE))
      path = path.replace(RE, encodeURI(value));
    else
      overloads[param] = value;
  });
  const query = overloadStringifier(overloads);
  return path + query;
};
const urlFromAddress = () => (({ pathname, search, hash }) => pathname + search + hash)(window.location);
const getGlobalContext = () => {
  console.log("Using helpers outside router context is not supported. Use at own risk.");
  const router2 = appInstance.routers[0];
  const route = router2.activeRoute.get() || router2.pendingRoute.get();
  return {
    elem: null,
    anchorLocation: null,
    options: null,
    childFragments: writable(route.allFragments),
    node: router2.rootNode,
    fragment: route.allFragments[0],
    isActive: writable(false),
    isVisible: writable(false),
    inline: null,
    router: router2,
    route,
    parentContext: null,
    onDestroy: null,
    decorators: [],
    scrollBoundary: null,
    isInline: null,
    mounted: null
  };
};
const contexts = {
  /** @type {Router} */
  get router() {
    return (getRoutifyFragmentContext() || getGlobalContext()).router;
  },
  /** @type {RenderContext} */
  get fragment() {
    return getRoutifyFragmentContext() || getGlobalContext();
  }
};
const getable = (value, start) => {
  const store = writable(value, start);
  return Object.assign(store, { get: () => get_store_value(store) });
};
const identicalRoutes = (...routes2) => routes2.map((route) => JSON.stringify([route == null ? void 0 : route.allFragments, route == null ? void 0 : route.url])).reduce((prev, curr) => prev === curr && curr);
const isAnonFn = (input) => typeof input === "function" && !input.prototype;
const resolveIfAnonFn = (subject, params) => isAnonFn(subject) ? (
  /** @type {any} */
  subject(...params)
) : subject;
const pushToOrReplace = (arr, input) => {
  const _isAnonFn = isAnonFn(input);
  input = _isAnonFn || Array.isArray(input) ? input : [input];
  const res = _isAnonFn ? input([...arr]) : [...arr, ...input];
  if (!Array.isArray(res))
    throw new Error("anonymous callback did not return array");
  return res;
};
const waitFor = (store, cb) => new Promise((resolve, reject) => {
  try {
    const unsub = store.subscribe((val) => {
      if (cb(val)) {
        resolve(val);
        setTimeout(() => unsub);
      }
    });
  } catch (err) {
    reject(err);
  }
});
const createDeferredPromise = () => {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return Object.assign(promise, { resolve, reject });
};
const noRoutesMapProvided = (name) => `No routesMap provided. Make sure you've either created a router for the '${name}' route or provided a routesMap`;
const handleRebuildError = (context, childContexts) => {
  console.warn("Failed to rebuild routes", { context, childContexts });
  const msg = "Infinite loop detected while trying to compose components. This is likely an error in Routify.";
  const err = new Error(msg);
  throw err;
};
const getWindowUrl = () => typeof window === "undefined" ? "" : window.location.pathname + window.location.search + window.location.hash;
const preloadUrl = (urlOrOptions) => {
  var _a, _b;
  const options = typeof urlOrOptions === "string" || Array.isArray(urlOrOptions) ? { url: urlOrOptions } : urlOrOptions;
  let { url: url2, routesMap } = options;
  url2 = url2 ?? ((_a = import.meta["env"]) == null ? void 0 : _a.ROUTIFY_URL) ?? ((_b = import.meta["env"]) == null ? void 0 : _b.URL) ?? getWindowUrl();
  const urls = Array.isArray(url2) ? url2 : [url2];
  return Promise.all(
    urls.map((url3) => preloadUrlFromUrlPairs(getUrlSegments(url3), routesMap))
  );
};
const createNewRouter = async (name, url2, routesMap) => {
  const fullName = name || "default";
  if (!routesMap)
    console.error(noRoutesMapProvided(fullName));
  const getRoutes = routesMap[fullName];
  if (!getRoutes)
    return false;
  else
    console.log("[Routify] Pre-creating router", name, url2, routesMap);
  return createRouter({ name, url: url2, routes: await getRoutes() });
};
const preloadUrlFromUrlPairs = async (urlPairs, routesMap) => {
  const routerPromises = urlPairs.map(async ([name, url2]) => {
    const matchingRouter = appInstance.routers.find((router3) => router3.name === name);
    const router2 = matchingRouter || await createNewRouter(name, url2, routesMap);
    if (!router2)
      return false;
    const currentRoute = router2.pendingRoute.get() || router2.activeRoute.get();
    if ((currentRoute == null ? void 0 : currentRoute.url) !== url2)
      router2.url.replace(url2);
    return router2;
  });
  const routers = await Promise.all(routerPromises);
  await Promise.all(routers.map((router2) => router2 && router2.ready()));
  return routers.map((router2) => {
    var _a;
    return (_a = router2.activeRoute) == null ? void 0 : _a.get().load;
  });
};
const getUrlSegments = (compositeUrl) => compositeUrl.split(";").map(urlSegmentToRouterAndUrl);
const urlSegmentToRouterAndUrl = (urlSegment, index2) => {
  if (!index2)
    return ["", urlSegment];
  const matches = urlSegment.match(/([\w-]+?)\/(.*)/);
  return [matches[1], matches[2]];
};
const getMRCA = (node1, node2) => {
  const lineage1 = [node1, ...node1.ancestors];
  const lineage2 = [node2, ...node2.ancestors];
  return lineage1.find((node) => lineage2.includes(node));
};
const getPath = (node1, node2) => {
  const lineage1 = [node1, ...node1.ancestors];
  const lineage2 = [node2, ...node2.ancestors];
  const mrca = getMRCA(node1, node2);
  const backtrackSteps = lineage1.indexOf(mrca);
  const backtrackStr = backtrackSteps ? "../".repeat(backtrackSteps) : "";
  const forwardSteps = lineage2.indexOf(mrca);
  const forwardStepsStr = lineage2.slice(0, forwardSteps).reverse().map((n) => n.name).join("/");
  return backtrackStr + forwardStepsStr;
};
const _url = {
  subscribe: (run2, invalidate) => {
    const { fragment, router: router2 } = contexts;
    return derived(fragment.params, ($params) => {
      return createUrl(fragment.fragment, router2);
    }).subscribe(run2, invalidate);
  }
};
const url = {
  subscribe: (run2, invalidate) => {
    let InitialElem, initialParams, initialPath;
    const updateHref = ($url) => InitialElem.setAttribute("href", $url(initialPath, ...initialParams));
    return derived(_url, ($url) => {
      if (InitialElem) {
        updateHref($url);
      }
      return (pathOrElem, ...params) => {
        if (typeof pathOrElem != "object") {
          return $url(pathOrElem, ...params);
        }
        InitialElem = pathOrElem;
        initialParams = params;
        initialPath = InitialElem.getAttribute("href");
        updateHref($url);
      };
    }).subscribe(run2, invalidate);
  }
};
const createUrl = (fragment, router2) => (
  /** @type {UrlFromString} */
  (_inputPath, userParams = {}, options = {}) => {
    const route = fragment.route;
    const originNode = router2.rootNode.traverse(fragment.node.path);
    if (router2.rootNode.path !== "/" && _inputPath.startsWith(router2.rootNode.path))
      _inputPath = _inputPath.substring(router2.rootNode.path.length);
    const inputPath = _inputPath.replace("$leaf", (route == null ? void 0 : route.url) || fragment.node.path);
    const offset = inputPath.startsWith("/") ? router2.rootNode.path : "";
    const targetNode = originNode.traverse(
      offset + inputPath,
      // path
      !options.strict,
      // allowDynamic
      options.includeIndex,
      // includeIndex
      options.silent
      // silent
    );
    if (!targetNode) {
      console.error("could not find destination node", inputPath);
      return;
    }
    const mrca = getMRCA(targetNode, router2.rootNode);
    const path = ("/" + getPath(mrca, targetNode)).replace(/\/index$/, "/");
    const params = {
      ...inheritedParams(targetNode, route || router2.activeRoute.get()),
      ...userParams
    };
    const urlHandler = (obj) => router2.queryHandler.stringify(obj, route);
    const internalUrl = populateUrl(path, params, urlHandler);
    const externalUrl = router2.getExternalUrl(internalUrl).replace(/\/$/, "") || "/";
    return externalUrl;
  }
);
const inheritedParams = (node, route) => {
  const params = route.allFragments.map(
    // if node is a descendant of the fragment's node, return params
    (fragment) => fragment.node.getChainToNode(node) && fragment.params
  );
  return Object.assign({}, ...params);
};
const isActive = {
  subscribe: (run2, invalidate) => {
    const { fragment, router: router2 } = contexts;
    return derived(router2.activeRoute, () => isActiveUrl(fragment)).subscribe(
      run2,
      invalidate
    );
  }
};
const isActiveUrl = (renderContext) => {
  const { router: router2, fragment } = renderContext;
  return (path, params = {}, options = {}) => {
    const { recursive } = { recursive: true, ...options };
    const route = router2.activeRoute.get();
    if (router2.rootNode.path !== "/")
      path = path.substring(router2.rootNode.path.length);
    const chainOptions = {
      rootNode: router2.rootNode,
      allowDynamic: false,
      includeIndex: !recursive
    };
    const allWantedParamsAreInActiveChain = Object.entries(params).every(
      ([key, value]) => route.params[key] === value
    );
    if (!allWantedParamsAreInActiveChain)
      return false;
    const wantedNode = path.startsWith(".") ? fragment.node.traverse(path) : router2.rootNode.getChainTo(path, chainOptions).pop().node;
    const actNodes = [...route.fragments.map((fragment2) => fragment2.node)];
    return actNodes.includes(wantedNode);
  };
};
const uriDecodeStringOrArray = (strOrArr) => strOrArr instanceof Array ? (
  /** @type {T} */
  strOrArr.map(decodeURI)
) : (
  /** @type {T} */
  decodeURI(strOrArr)
);
const URIDecodeObject = (obj) => Object.entries(obj).reduce(
  (_return, [key, value]) => ({
    ..._return,
    [key]: uriDecodeStringOrArray(value)
  }),
  /** @type {T} */
  {}
);
class LoadCache {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  /**
   * Fetches data for the given ID and caches it.
   * @param {any} id
   * @param {LoadCacheFetchOptions<P>} options
   * @returns {Promise<P>}
   */
  async fetch(id2, options) {
    if (!this.map.has(id2))
      this.map.set(id2, options.hydrate());
    this._handlePromise(id2, options);
    return this.map.get(id2);
  }
  /**
   * Handles the Promise resolution, cache expiration, and cache clearing.
   * @param {any} id
   * @param {LoadCacheFetchOptions<P>} options
   */
  async _handlePromise(id2, options) {
    var _a;
    const value = await this.map.get(id2);
    const clear = (_a = options.clear) == null ? void 0 : _a.call(options, value);
    if (typeof clear === "number")
      setTimeout(() => this.map.delete(id2), clear);
    else if (clear)
      this.map.delete(id2);
  }
}
class RouteFragment {
  /**
   * @param {Route} route the route this fragment belongs to
   * @param {RNodeRuntime} node the node that corresponds to the fragment
   * @param {String=} urlFragment a fragment of the url (fragments = url.split('/'))
   * @param {Object<string, any>=} params
   */
  constructor(route, node, urlFragment = "", params = {}) {
    this.route = route;
    this.node = node;
    this.load = void 0;
    this.urlFragment = urlFragment;
    this.params = params;
    this.renderContext = createDeferredPromise();
    Object.defineProperty(this, "route", { enumerable: false });
    this.params = URIDecodeObject({ ...this.node.meta.isDefault, ...params });
  }
}
const URL_STATES = ["pushState", "replaceState", "popState"];
const loadCache = new LoadCache();
let id = 0;
class Route {
  /**
   * @param {Router} router
   * @param {string} url
   * @param {UrlState} mode
   * @param {Object} state a state to attach to the route
   */
  constructor(router2, url2, mode, state = {}) {
    /** @type {RouteFragment[]} */
    __publicField(this, "allFragments", []);
    /** @type {RouteFragment[]} only fragments with components */
    __publicField(this, "fragments", []);
    /** @type {RoutifyLoadReturn} */
    __publicField(this, "load", {
      status: 200,
      error: null,
      maxage: null,
      props: {},
      redirect: null
    });
    this.sourceUrl = typeof url2 === "string" ? new URL(url2, "http://localhost") : url2;
    this.router = router2;
    this.mode = mode;
    this.state = state;
    this.state.createdAt = /* @__PURE__ */ new Date();
    this.state.id = this.state.id ?? Date.now() + "-" + id++;
    if (!router2.rootNode) {
      const err = new Error(
        "Can't navigate without a rootNode. Have you imported routes?"
      );
      Object.assign(err, { routify: { router: router2 } });
      throw err;
    }
    if (!URL_STATES.includes(mode))
      throw new Error("url.mode must be pushState, replaceState or popState");
    this.allFragments = this._createFragments(this.sourceUrl.pathname);
    this.params = { ...this.queryParams, ...this.fragmentParams };
    this.fragments = this.router.transformFragments.run(this.allFragments);
    this.url = this._createUrl();
    this.log = router2.log.createChild("[route]");
    this.log.debug("created", this);
  }
  get fragmentParams() {
    return this.allFragments.reduce((acc, curr) => ({ ...acc, ...curr.params }), {});
  }
  get queryParams() {
    return this.router.queryHandler.parse(this.sourceUrl.search, this);
  }
  get leaf() {
    return [...this.fragments].pop();
  }
  get isPendingOrPrefetch() {
    return this === this.router.pendingRoute.get() || this.state.prefetch;
  }
  async loadRoute() {
    const pipeline = [
      this.runBeforeUrlChangeHooks,
      this.loadComponents,
      this.runPreloads
    ];
    for (const pretask of pipeline) {
      const passedPreTask = await pretask.bind(this)();
      if (!this.isPendingOrPrefetch || !passedPreTask)
        return false;
    }
    this.log.debug("loaded route", this);
    return true;
  }
  /**
   * converts async module functions to sync functions
   */
  async loadComponents() {
    this.log.debug("load components", this);
    const nodes = this.fragments.map((fragment) => fragment.node);
    const multiNodes = nodes.map((node) => node.children.find((node2) => node2.name === "_decorator")).filter(Boolean);
    await Promise.all([...nodes, ...multiNodes].map((node) => node.loadModule()));
    return true;
  }
  async runPreloads() {
    var _a;
    this.log.debug("run preloads", this);
    const prevRoute = this.router.activeRoute.get();
    for (const [index2, fragment] of this.fragments.entries()) {
      if (!this.isPendingOrPrefetch)
        return false;
      const prevFragmentInSpot = prevRoute == null ? void 0 : prevRoute.fragments[index2];
      const isSameBranch = fragment.node === (prevFragmentInSpot == null ? void 0 : prevFragmentInSpot.node);
      const ctx = {
        route: this,
        url: createUrl(fragment, this.router),
        prevRoute,
        isNew: !isSameBranch,
        fetch
      };
      if ((_a = fragment.node.module) == null ? void 0 : _a.load) {
        const cacheId = JSON.stringify([this.params, fragment.node.id]);
        const load2 = await loadCache.fetch(cacheId, {
          hydrate: () => fragment.node.module.load(ctx),
          // if no expire is set clear it on load, unless it's a prefetch
          clear: (res) => (res == null ? void 0 : res.expire) || !this.state.prefetch
        });
        fragment.load = {
          ...isSameBranch && prevFragmentInSpot.load,
          ...load2
        };
        Object.assign(this.load, fragment.load);
        if (this.load.redirect && !this.state.prefetch)
          return this.router.url.replace(this.load.redirect, {
            redirectedBy: this
          });
      }
    }
    return this;
  }
  async runBeforeUrlChangeHooks() {
    return await this.router.beforeUrlChange.run({ route: this });
  }
  get meta() {
    return this.fragments.reduce((acc, curr) => ({ ...acc, ...curr.node.meta }), {});
  }
  /**
   * @param {RNodeRuntime} node the node that corresponds to the fragment
   * @param {String=} urlFragment a fragment of the url (fragments = url.split('/'))
   * @param {Object<string, any>=} params
   */
  createFragment(node, urlFragment = "", params = {}) {
    return new RouteFragment(this, node, urlFragment, params);
  }
  /**
   * creates fragments. A fragment is the section between each / in the URL
   */
  _createFragments(pathname) {
    const rootNode = this.router.rootNode;
    const nodeChain = this.router.rootNode.getChainTo(pathname, {
      rootNode,
      allowDynamic: true,
      includeIndex: true,
      navigableChildrenOnly: true
    });
    const fragments = nodeChain.map(
      (nc) => this.createFragment(nc.node, nc.fragment, nc.params)
    );
    return fragments;
  }
  _createUrl() {
    const queryStringifier = (obj) => this.router.queryHandler.stringify(obj, this);
    const path = this.allFragments.map((f, i) => i ? f.node.name : "").join("/");
    const populatedUrl = populateUrl(path, this.params, queryStringifier);
    return populatedUrl.replace(/\/index$/, "") + this.sourceUrl.hash;
  }
}
class BaseReflector {
  /** @param {Router} router */
  constructor(router2) {
    this.router = router2;
    this.log = this.router.log;
  }
  install() {
  }
  uninstall() {
  }
  reflect() {
  }
}
const next = (store, wanted, strict) => new Promise((resolve) => {
  let unsub;
  unsub = store.subscribe((value) => {
    if (!unsub)
      return;
    if (typeof wanted === "undefined" || value === wanted || value == wanted && !strict || typeof wanted === "function" && /** @type {function} */
    wanted(value)) {
      resolve(value);
    }
  });
});
const lazySet = (store, value) => JSON.stringify(get_store_value(store)) !== JSON.stringify(value) && store.set(value);
const jsonClone = (obj) => JSON.parse(JSON.stringify(obj));
const initializeCache = (idGenerator, defaultContext) => {
  const functionCache = /* @__PURE__ */ new Map();
  const retrieveFromCache = (dataProducer, context) => {
    const uniqueId = idGenerator();
    if (!functionCache.has(dataProducer)) {
      functionCache.set(dataProducer, /* @__PURE__ */ new Map());
    }
    const cache = functionCache.get(dataProducer);
    if (!cache.has(uniqueId)) {
      cache.set(uniqueId, dataProducer.bind(defaultContext || context || globalThis)());
    }
    return cache.get(uniqueId);
  };
  retrieveFromCache.storage = functionCache;
  return retrieveFromCache;
};
class RNode {
  /**
   * @param {string} name
   * @param {ReservedCmpProps|string} module
   * @param {InstanceType} instance
   */
  constructor(name, module2, instance) {
    /** @type {InstanceType['NodeType']} */
    __publicField(this, "parent");
    /** @type {Object.<string, any>} */
    __publicField(this, "meta", {});
    /** @type {String} */
    __publicField(this, "id");
    this.instance = instance;
    this.name = name || "";
    instance.nodeIndex.push(this);
    this.module = module2;
    this._cacheByName = initializeCache(() => this.name, this);
    Object.defineProperty(this, "_cacheByName", { enumerable: false });
    Object.defineProperty(this, "instance", { enumerable: false });
    Object.defineProperty(this, "parent", { enumerable: false });
  }
  /** @param {InstanceType['NodeConstructor']['prototype']} child */
  appendChild(child) {
    if (child.instance)
      child.parent = this;
  }
  /**
   * Creates a new child node
   * Same as `node.appendChild(instance.createNode('my-node'))`
   * @param {string} name
   */
  createChild(name, module2) {
    const node = (
      /** @type {InstanceType['NodeConstructor']['prototype']} */
      this.instance.createNode(name, module2)
    );
    this.appendChild(node);
    return node;
  }
  /** @type {InstanceType['NodeConstructor']['prototype'][]} */
  get descendants() {
    return this.instance.nodeIndex.filter(
      (node) => node.ancestors.find((n) => n === this)
    );
  }
  remove() {
    const { nodeIndex } = this.instance;
    const index2 = nodeIndex.findIndex((node) => node === this);
    nodeIndex.splice(index2, 1);
  }
  /** @type {InstanceType['NodeConstructor']['prototype'][]} */
  get ancestors() {
    let node = this;
    const ancestors = [];
    while (node = node.parent)
      ancestors.push(node);
    return ancestors;
  }
  /** @type {InstanceType['NodeConstructor']['prototype']} */
  get root() {
    let node = this;
    while (node.parent)
      node = node.parent;
    return node;
  }
  get isRoot() {
    return this === this.root;
  }
  /** @type {InstanceType['NodeType'][]} */
  get children() {
    return this.instance.nodeIndex.filter((node) => node.parent === this).sort((prev, curr) => (prev.meta.order || 0) - (curr.meta.order || 0));
  }
  get navigableChildren() {
    return this.children.filter((node) => !node.meta.noRoute);
  }
  get linkableChildren() {
    return this.navigableChildren.filter((node) => node.meta.order != false);
  }
  /** @returns {number} */
  get level() {
    var _a;
    return (((_a = this.parent) == null ? void 0 : _a.level) || 0) + 1;
  }
  _getRegex() {
    return this.instance.utils.getRegexFromName(this.name);
  }
  get regex() {
    return this._cacheByName(this._getRegex);
  }
  _getParamKeys() {
    return this.instance.utils.getFieldsFromName(this.name);
  }
  get paramKeys() {
    return this._cacheByName(this._getParamKeys);
  }
  _getSpecificity() {
    return [this.name.replace(/\[.+?\]/g, "").length, this.paramKeys.length];
  }
  get specificity() {
    return this._cacheByName(this._getSpecificity);
  }
  /**
   * returns parameters for a given urlFragment
   * @param {string} urlFragment
   */
  getParams(urlFragment) {
    if (urlFragment.match(/^\.+$/))
      return {};
    const values = this.instance.utils.getValuesFromPath(this.regex, urlFragment);
    return this.instance.utils.mapFieldsWithValues(this.paramKeys, values);
  }
  /**
   * resolve a node relative to this node
   * @param {string} path
   * @param {boolean} allowDynamic allow traversing dynamic components (parameterized)
   * @param {boolean} includeIndex
   * @param {boolean} silent don't throw errors for 404s
   * @returns {this}
   */
  traverse(path, allowDynamic = false, includeIndex = false, silent = false) {
    var _a;
    const isNamed = !path.startsWith("/") && !path.startsWith(".");
    return isNamed ? this.root.instance.nodeIndex.find((node) => node.meta.name === path) : (_a = this.getChainTo(path, { allowDynamic, includeIndex, silent })) == null ? void 0 : _a.pop().node;
  }
  /**
   * Returns an array of steps to reach a path. Each path contains a node and params
   * @param {string} path
   * @param {object} [options]
   * @param {boolean} [options.allowDynamic=true]
   * @param {boolean} [options.includeIndex=true]
   * @param {boolean} [options.navigableChildrenOnly=false]
   * @param {boolean} [options.silent=false] don't throw errors for 404s
   * @param {this} [options.rootNode]
   
   */
  getChainTo(path, options) {
    options = {
      ...{ allowDynamic: true, includeIndex: true, navigableChildrenOnly: false },
      ...options
    };
    const targetChildren = options.navigableChildrenOnly ? "navigableChildren" : "children";
    const originNode = path.startsWith("/") ? options.rootNode || this.root : this;
    const stepsToLeaf = path.split("/").filter((snip) => snip !== ".").filter(Boolean);
    let currentNodeStep = {
      node: originNode,
      stepsToLeaf,
      params: {},
      fragment: ""
    };
    const nodeSteps = [currentNodeStep];
    let inStaticDeadEnd = false;
    let inDynamicDeadEnd = false;
    while (currentNodeStep.stepsToLeaf.length) {
      const [nextStep, ...restSteps] = currentNodeStep.stepsToLeaf;
      const nextNode = nextStep === ".." ? currentNodeStep.node.parent : !inStaticDeadEnd && currentNodeStep.node[targetChildren].find(
        (node) => node.name === nextStep
      ) || options.allowDynamic && !inDynamicDeadEnd && [...currentNodeStep.node[targetChildren]].sort(
        (a, b) => (
          // sort by static specificity, then dynamic specificity
          b.specificity[0] - a.specificity[0] || b.specificity[1] - a.specificity[1]
        )
      ).filter(({ meta }) => meta.dynamic && !meta.dynamicSpread).find((node) => node.regex.test(nextStep)) || options.allowDynamic && currentNodeStep.node[targetChildren].find(
        (node) => node.meta.dynamicSpread
      );
      if (nextNode) {
        const nodeStep = {
          node: nextNode,
          params: nextNode.meta.dynamicSpread ? [nextStep] : nextNode.meta.dynamic ? nextNode.getParams(nextStep) : {},
          stepsToLeaf: restSteps,
          fragment: nextStep
        };
        currentNodeStep = nodeStep;
        nodeSteps.push(nodeStep);
      } else if (!options.allowDynamic && options.silent)
        return null;
      else if (!options.allowDynamic && !options.silent)
        throw new Error(
          `${nodeSteps.map((ns) => ns.node.name || "root").join("/")} could not travel to ${nextStep}`
        );
      else if (currentNodeStep.node.meta.dynamicSpread) {
        currentNodeStep.params.push(nextStep);
        currentNodeStep.fragment += `/${nextStep}`;
        currentNodeStep.stepsToLeaf.shift();
        inDynamicDeadEnd = false;
        inStaticDeadEnd = false;
      } else {
        nodeSteps.pop();
        currentNodeStep = [...nodeSteps].pop();
        inDynamicDeadEnd = inStaticDeadEnd;
        inStaticDeadEnd = true;
        if (!currentNodeStep && options.silent)
          return null;
        else if (!currentNodeStep && !options.silent)
          throw new Error(`Could not find path "${path}" from ${this.name}`);
      }
    }
    try {
      const indexNode = options.includeIndex && currentNodeStep.node[targetChildren].find(
        (node) => node.name === "index" || node.meta.isDefault
      );
      if (indexNode)
        nodeSteps.push({
          node: indexNode,
          stepsToLeaf: [],
          params: {},
          fragment: ""
        });
    } catch (err) {
    }
    nodeSteps.forEach((ns) => {
      ns.params = Array.isArray(ns.params) ? { [ns.node.name.replace(/\[\.\.\.(.+)\]/, "$1")]: ns.params } : ns.params;
    });
    return nodeSteps;
  }
  getChainToNode(node) {
    const chain = [];
    do {
      chain.unshift(node);
      if (node === this)
        return chain;
    } while (node = node.parent);
  }
  /** @returns {InstanceType['NodeConstructor']['prototype']} */
  toJSON() {
    return {
      ...this,
      children: [...this.children]
    };
  }
  /** @returns {string} */
  get path() {
    return "/" + [this, ...this.ancestors].reverse().map((node) => node.name).filter(Boolean).join("/");
  }
}
const Node = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  var _a;
  let { node } = $$props;
  let { passthrough } = $$props;
  const context = { ...getRoutifyFragmentContext(), node };
  setRoutifyFragmentContext(context);
  let Component = (_a = node.module) == null ? void 0 : _a.default;
  if (!Component && node.asyncModule)
    node.asyncModule().then((r) => Component = r.default);
  if ($$props.node === void 0 && $$bindings.node && node !== void 0)
    $$bindings.node(node);
  if ($$props.passthrough === void 0 && $$bindings.passthrough && passthrough !== void 0)
    $$bindings.passthrough(passthrough);
  return `${Component ? `${validate_component(Component || missing_component, "svelte:component").$$render($$result, Object.assign(passthrough, { context }), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}` : `${slots.default ? slots.default({}) : ``}`}`;
});
class RNodeRuntime extends RNode {
  /**
   * @param {string} name
   * @param {ReservedCmpProps} module
   * @param {RoutifyRuntime} instance
   * @param {LoadSvelteModule=} asyncModule
   */
  constructor(name, module2, instance, asyncModule) {
    super(name, module2, instance);
    /** @type {LoadSvelteModule} */
    __publicField(this, "asyncModule");
    /**
     * @param {object} snapshotRoot
     */
    __publicField(this, "importTree", (snapshotRoot) => {
      const queue = [[this, snapshotRoot]];
      while (queue.length) {
        const [node, snapshot] = queue.pop();
        const { children, ...nodeSnapshot } = snapshot;
        Object.assign(node, nodeSnapshot);
        for (const childSnapshot of children) {
          const childNode = node.createChild(
            snapshot.name || snapshot.rootName || ""
          );
          queue.push([childNode, childSnapshot]);
        }
      }
      return this;
    });
    this.module = module2;
    this.asyncModule = asyncModule;
  }
  // TODO DEPRECATE
  get pages() {
    console.log("DEPRECATED node.pages: use .linkableChildren instead");
    return this.pagesWithIndex.filter((node) => node.name !== "index");
  }
  /**
   * Returns the title of the node. Looks for meta.title, falls back to capitalized name
   * Can be transformed with the router transformTitle hook
   * @returns {string}
   */
  get title() {
    const getPrettyName = () => this.name.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const getTitle = () => this.meta.title || getPrettyName();
    return getTitle();
  }
  // TODO DEPRECATE
  get pagesWithIndex() {
    console.log("DEPRECATED node.pagesWithIndex: use .linkableChildren instead");
    return this.children.filter((node) => !node.meta.fallback).filter((node) => !node.name.startsWith("_")).filter((node) => !node.name.includes("[")).filter((node) => {
      var _a;
      return !(((_a = node.meta) == null ? void 0 : _a.order) === false);
    });
  }
  get hasComponent() {
    return !!(this.module || this.asyncModule);
  }
  /** @ts-ignore SvelteComponentConstructor is only available in VSCode */
  /** @returns {Promise<SvelteComponentDev>} */
  async getRawComponent() {
    const module2 = await this.loadModule();
    return module2 == null ? void 0 : module2.default;
  }
  async loadModule() {
    if (!this.module && this.asyncModule) {
      let childPromises = [];
      if (this.meta.bundle || typeof window === "undefined")
        childPromises = this.navigableChildren.map((c) => c.loadModule());
      [this.module] = await Promise.all([this.asyncModule(), ...childPromises]);
    }
    return this.module;
  }
  /**
   * Returns in a sync/async component in a synchronous wrapper
   * @returns {() => Node}
   **/
  get component() {
    const node = this;
    return function(options) {
      options.props = {
        ...options.props,
        passthrough: options.props,
        node
      };
      return new Node({ ...options });
    };
  }
  get _fallback() {
    var _a;
    return this.children.find((node) => node.meta.fallback) || ((_a = this.parent) == null ? void 0 : _a._fallback);
  }
}
const defaultRe = /\[(.+?)\]/gm;
class UrlParamUtils {
  constructor(RE = defaultRe) {
    /**
     * returns ["slug", "id"] from "my[slug]and[id]"
     * @param {string} name
     * @returns {string[]}
     */
    __publicField(this, "getFieldsFromName", (name) => [...name.matchAll(this.RE)].map((v) => v[1]));
    /**
     * converts "my[slug]and[id]" to /my(.+)and(.+)/gm
     * @param {string} name
     * @returns {RegExp}
     */
    __publicField(this, "getRegexFromName", (name) => new RegExp("^" + name.replace(this.RE, "(.+)") + "$"));
    /**
     * returns an array of values matching a regular expression and path
     * @param {RegExp} re
     * @param {string} path
     * @returns {string[]}
     */
    __publicField(this, "getValuesFromPath", (re, path) => (path.match(re) || []).slice(1));
    /**
     * converts (['a', 'b', 'c'], [1, 2, 3]) to {a: 1, b: 2, c: 3}
     * @param {string[]} fields
     * @param {string[]} values
     * @returns
     */
    __publicField(this, "mapFieldsWithValues", (fields, values) => this.haveEqualLength(fields, values) && fields.reduce((map2, field, index2) => {
      map2[field] = values[index2];
      return map2;
    }, {}));
    __publicField(this, "haveEqualLength", (fields, values) => {
      if (fields.length !== values.length)
        throw new Error(
          `fields and values should be of same length
fields: ${JSON.stringify(fields)}
values: ${JSON.stringify(values)}`
        );
      return true;
    });
    this.RE = RE;
  }
}
class Routify {
  constructor() {
    /** @type {typeof RNode<any>} */
    __publicField(this, "NodeConstructor");
    /** @type {NodeConstructor['prototype']} */
    __publicField(this, "NodeType");
    /** @type {NodeConstructor['prototype'][]} */
    __publicField(this, "nodeIndex", []);
    /** @type {Object<string, NodeConstructor['prototype']>} */
    __publicField(this, "rootNodes", {});
    __publicField(this, "utils", new UrlParamUtils());
  }
  /**
   * @param {string=} name relative path for the node
   * @param {any|string=} module svelte component
   * @returns {this['NodeType']}
   */
  createNode(name, module2) {
    return new this.NodeConstructor(name, module2, this);
  }
}
class RoutifyRuntime extends Routify {
  constructor(options) {
    super();
    __publicField(this, "NodeConstructor", RNodeRuntime);
    __publicField(this, "mode", "runtime");
    /**@type {Router[]} routers this instance belongs to */
    __publicField(this, "routers", []);
    /** @type {Object<string, RNodeRuntime>} */
    __publicField(this, "rootNodes", {});
    this.options = options;
    if (options.routes) {
      this.rootNodes[options.routes.rootName || "unnamed"] = this.createNode(
        options.routes.rootName
      ).importTree(options.routes);
    }
    this.global = appInstance.register(this);
    Object.defineProperty(this, "routers", { enumerable: false });
    this.log = this.global.log;
  }
}
let reflectPending = false;
class AddressReflector extends BaseReflector {
  /** @param {Router} router */
  constructor(router2) {
    super(router2);
    __publicField(this, "_reflect", () => {
      const { mode } = get_store_value(this.router.activeRoute);
      const url2 = mode != "popState" ? this._getRouterUrl() : null;
      const state = this._createState();
      const method = mode === "popState" ? "replaceState" : mode;
      this.log.debug("pushing internal state to browser history", {
        mode,
        url: url2,
        state,
        currentBrowserUrl: urlFromAddress(),
        currentInternalUrl: this.router.url.internal()
      });
      history[`${method}Native`](state, "", url2);
    });
    const { instance, urlRewrites } = router2;
    const { urlFromBrowser, browserAdapter } = instance.global;
    if (!history["onPushstate"]) {
      this.log.debug("polyfill history hooks");
      polyfillHistory();
    }
    const createStateEventHandler = (method) => {
      return function(data, title, url2) {
        var _a;
        const routerName = ((_a = data == null ? void 0 : data.routify) == null ? void 0 : _a.router) ?? false;
        if (routerName === false)
          url2 = browserAdapter.toRouter(url2, router2);
        else if (routerName !== router2.name)
          return false;
        for (const rewrite of urlRewrites)
          url2 = rewrite.toInternal(url2, { router: router2 });
        router2.url[method](url2);
      };
    };
    this.absorb = () => {
      var _a, _b, _c;
      const state = (_c = (_b = (_a = history.state) == null ? void 0 : _a.routify) == null ? void 0 : _b.router) == null ? void 0 : _c[router2.name];
      router2.url.replace(urlFromBrowser(router2), state || {});
    };
    this._pushstateHandler = createStateEventHandler("push");
    this._replacestateHandler = createStateEventHandler("replace");
    this._popstateHandler = (event) => {
      var _a;
      return router2.url.pop(
        urlFromBrowser(router2),
        (_a = event.state.routify) == null ? void 0 : _a.router[router2.name]
      );
    };
  }
  install() {
    this.hooks = [
      history["onPushstate"](this._pushstateHandler),
      history["onReplacestate"](this._replacestateHandler),
      history["onPopstate"](this._popstateHandler)
    ];
    if (!this.router.activeRoute.get())
      this.absorb();
    else
      this.reflect();
  }
  uninstall() {
    this.hooks.forEach((unreg) => unreg());
    setTimeout(() => this.reflect());
  }
  reflect() {
    if (reflectPending)
      return;
    reflectPending = true;
    setTimeout(() => {
      reflectPending = false;
      this._reflect();
    });
  }
  _getRouterUrl() {
    const { routers, browserAdapter } = this.router.instance.global;
    const sameInstance = (router2) => router2.urlReflector instanceof this.constructor;
    const addressRouters = routers.filter(sameInstance);
    let url2 = browserAdapter.toBrowser(addressRouters) || "/";
    if (!/^(\/|#)/.test(url2))
      url2 = "/" + url2;
    return url2;
  }
  _createState() {
    var _a, _b;
    const routerState = { ...(_a = this.router.activeRoute.get()) == null ? void 0 : _a.state };
    routerState.redirectedBy = (_b = routerState.redirectedBy) == null ? void 0 : _b.url;
    const state = { ...history.state };
    state.routify = state.routify || { router: {} };
    state.routify.router[this.router.name] = routerState;
    return state;
  }
}
function polyfillHistory() {
  const hooks = {
    /** @type {import('hookar').HooksCollection<History['pushState']>} */
    onPushstate: createSequenceHooksCollection(),
    /** @type {import('hookar').HooksCollection<History['replaceState']>} */
    onReplacestate: createSequenceHooksCollection(),
    onPopstate: createSequenceHooksCollection()
  };
  Object.assign(history, hooks);
  const { pushState, replaceState } = history;
  history["pushStateNative"] = pushState;
  history["replaceStateNative"] = replaceState;
  history.pushState = hooks.onPushstate.run;
  history.replaceState = hooks.onReplacestate.run;
  window.addEventListener("popstate", hooks.onPopstate.run);
  return true;
}
class InternalReflector extends BaseReflector {
  install() {
    this.router.url.replace("/");
  }
}
const parseModuleName = (str) => {
  const matches = str.match(/^(.+?)(\+)?$/);
  const [, name, prepend] = matches;
  return { name, prepend };
};
const createHandlers = (fragments, route) => {
  const getIndexOf = (fragment) => fragments.indexOf(fragment);
  const handlers = {
    /**
     * @param {Boolean} _bool
     * @param {RouteFragment} fragment
     */
    boolean(_bool, fragment) {
      const index2 = getIndexOf(fragment);
      return handlers.number(index2, fragment);
    },
    /**
     * @param {Number} num
     * @param {RouteFragment} fragment
     */
    number(num, fragment) {
      const index2 = fragments.indexOf(fragment);
      const start = index2 - num;
      fragments.splice(start, num);
    },
    /**
     * @param {string} str
     * @param {RouteFragment} fragment
     */
    string(str, fragment) {
      const selfIndex = getIndexOf(fragment);
      const precedingFragments = fragments.slice(0, selfIndex + 1);
      let nextFragment;
      const { name, prepend } = parseModuleName(str);
      while (precedingFragments.length) {
        nextFragment = precedingFragments.pop();
        const matchingSiblingNode = nextFragment.node.children.find(
          (node) => node.meta.moduleName === name
        );
        if (matchingSiblingNode) {
          if (!prepend)
            fragments.splice(0, getIndexOf(fragment));
          fragments.unshift(route.createFragment(matchingSiblingNode));
          precedingFragments.splice(0);
        }
      }
    }
  };
  return handlers;
};
const handleFragment = (handlers) => (fragment) => {
  const { reset: reset2 } = fragment.node.meta;
  if (reset2)
    handlers[typeof reset2](reset2, fragment);
};
const reset = () => ({
  transformFragments: (_fragments) => {
    const { route } = _fragments[0];
    const fragments = [..._fragments];
    const handlers = createHandlers(fragments, route);
    _fragments.forEach(handleFragment(handlers));
    return fragments;
  }
});
const stripTrailingIndex = () => ({
  urlRewrite: [
    {
      toExternal: (url2) => url2.replace(/\/index(?=$|\?|#)/, ""),
      toInternal: (url2) => url2
    }
  ]
});
function findNextScrollableAncestor(element, boundaryElements = []) {
  const isScrollable = (elem) => elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight;
  if (element.parentElement && !boundaryElements.includes(element) && !element.dataset.hasOwnProperty("routifyScrollLock")) {
    if (isScrollable(element.parentElement) || element.parentElement === document.documentElement) {
      return element.parentElement;
    } else {
      return findNextScrollableAncestor(element.parentElement, boundaryElements);
    }
  } else {
    return null;
  }
}
function waitForScrollToComplete(elem) {
  let counter = 0;
  let lastPos = null;
  return new Promise((resolve) => {
    requestAnimationFrame(checkPos);
    function checkPos() {
      const { top, left } = elem.getBoundingClientRect();
      const newPos = top + "/" + left;
      counter++;
      if (newPos === lastPos && counter > 2) {
        resolve();
      } else {
        lastPos = newPos;
        requestAnimationFrame(checkPos);
      }
    }
  });
}
const observeDocument = (callback, runOnInit, timeout) => {
  if (runOnInit)
    callback();
  new ResizeObserver(() => {
  });
  const observer = new MutationObserver((mutations) => {
    const mutationsHasAddedOrRemovedANode = mutations.some(
      (mutation) => mutation.type === "childList" || mutation.type === "characterData"
    );
    if (mutationsHasAddedOrRemovedANode)
      callback();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  if (timeout)
    setTimeout(() => observer.disconnect(), timeout);
  return observer;
};
const backupScrollBehavior = (elem) => {
  elem.oldBehavior = elem.oldBehavior || elem.style.scrollBehavior;
};
const restoreScrollBehavior = (elem) => {
  if (elem.oldBehavior)
    elem.style.scrollBehavior = elem.oldBehavior;
  else
    elem.style.removeProperty("scroll-behavior");
  delete elem.oldBehavior;
};
const getAllAncestors = (elem) => {
  const ancestors = [];
  let parent = elem.parentElement;
  while (parent) {
    ancestors.push(parent);
    parent = parent.parentElement;
  }
  return ancestors;
};
class ScrollContext {
  /**
   * @param {RenderContext} context
   */
  constructor(context) {
    /** @type {HTMLElement} */
    __publicField(this, "elem");
    /** @type {RenderContext} */
    __publicField(this, "ctx");
    /** @type {boolean} */
    __publicField(this, "isInstant");
    /** @type {HTMLElement} */
    __publicField(this, "scrollTarget");
    this.ctx = context;
  }
  async getBoundary() {
    return resolveIfAnonFn(this.ctx.scrollBoundary, [this.ctx, this.scrollTarget]);
  }
  async init() {
    var _a, _b, _c, _d, _e;
    const { ctx } = this;
    const { anchor, parent } = await waitFor(ctx.elem, Boolean);
    this.scrollTarget = anchor || parent;
    const hashElem = ((_a = ctx.route) == null ? void 0 : _a.hash) && ((_c = globalThis.document) == null ? void 0 : _c.getElementById((_b = ctx.route) == null ? void 0 : _b.hash));
    this.elem = hashElem || this.scrollTarget;
    this.scrollToElem = ctx.isInline || ((_d = ctx.route) == null ? void 0 : _d.hash);
    this.isInstant = ((_e = ctx.route) == null ? void 0 : _e.state.dontsmoothscroll) || !ctx.wasVisible;
  }
  async handleScrollInstructions() {
    const { elem, isInstant, ctx } = this;
    const { scrollIntoView } = ctx.inline;
    const ancestors = getAllAncestors(elem);
    ancestors.forEach(backupScrollBehavior);
    if (isInstant)
      ancestors.forEach((ancestor) => ancestor.style.scrollBehavior = "auto");
    const observer = observeDocument(() => scrollIntoView(elem, isInstant), true);
    const timeout = isInstant ? 300 : 0;
    setTimeout(() => {
      observer.disconnect();
      ancestors.forEach(restoreScrollBehavior);
    }, timeout);
    return waitForScrollToComplete(elem);
  }
}
const defaultShouldScrollCallback = (_scrollContext, index2, ScrollContexts) => index2 === ScrollContexts.length - 1;
class ScrollQueue {
  constructor() {
    /** @type {ScrollContext[]} */
    __publicField(this, "queue", []);
  }
  /**
   * Adds an element to the queue with its respective callback function.
   * @param {ScrollContext} scrollContext
   */
  push(scrollContext) {
    var _a;
    if (scrollContext.ctx.route != ((_a = this.queue[0]) == null ? void 0 : _a.ctx.route))
      this.queue = [];
    this.queue.push(scrollContext);
  }
  /**
   * Processes the queue of elements and callbacks to execute them sequentially.
   * @return {Promise<void>} A promise that resolves when the entire queue has been processed.
   */
  async processQueue() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.queue = this.queue.filter(
      (scrollContext, index2, arr) => scrollContext.ctx.inline.shouldScroll(
        scrollContext,
        index2,
        arr,
        defaultShouldScrollCallback
      )
    );
    while (this.queue.length) {
      const scrollContext = this.queue.shift();
      await scrollContext.handleScrollInstructions();
    }
  }
}
const scrollQueue = new ScrollQueue();
const scrollToContext = async (context) => {
  const scrollContext = new ScrollContext(context);
  await scrollContext.init();
  if (!scrollContext.elem)
    ;
  else if (scrollContext.scrollToElem) {
    scrollQueue.push(scrollContext);
  } else
    scrollToTop(scrollContext.elem, await scrollContext.getBoundary());
};
const scrollToTop = (elem, boundary) => {
  let parent = findNextScrollableAncestor(elem, [boundary]);
  while (parent) {
    const oldBehavior = parent.style.scrollBehavior;
    parent.style.scrollBehavior = "auto";
    parent.scrollTo(0, 0);
    parent.style.scrollBehavior = oldBehavior;
    parent = findNextScrollableAncestor(parent, [boundary]);
  }
};
const getLineage = (context) => {
  const contexts2 = [];
  while (context) {
    contexts2.push(context);
    context = context.parentContext;
  }
  return contexts2;
};
const ScrollDecorator = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let route;
  let { context } = $$props;
  let { isRoot } = $$props;
  const routeHasHashAndWeAreAtTheLeaf = (route2) => route2.hash && route2.leaf === context.fragment;
  const contextLineageIsActive = () => getLineage(context).every((ctx) => get_store_value(ctx.isActive));
  const contextWasNotActive = () => {
    var _a;
    return context !== ((_a = context.parentContext) == null ? void 0 : _a.lastActiveChildContext);
  };
  if ($$props.context === void 0 && $$bindings.context && context !== void 0)
    $$bindings.context(context);
  if ($$props.isRoot === void 0 && $$bindings.isRoot && isRoot !== void 0)
    $$bindings.isRoot(isRoot);
  ({ route } = context);
  {
    if (route && !route.state.dontScroll && (routeHasHashAndWeAreAtTheLeaf(route) || contextLineageIsActive() && contextWasNotActive())) {
      console.log("scrolling to context", context.node.id || "unnamed", context);
      scrollToContext(context);
    }
  }
  return `${slots.default ? slots.default({}) : ``}`;
});
const scroller = () => ({
  onMount: ({ context }) => {
    context.decorators.push(ScrollDecorator);
  },
  afterRouteRendered: () => scrollQueue.processQueue()
});
const normalizeRouterOptions = (options, config) => {
  config = config || {
    name: "",
    beforeRouterInit: [],
    afterRouterInit: [],
    urlRewrite: [],
    beforeUrlChange: [],
    afterUrlChange: [],
    afterRouteRendered: [],
    transformFragments: [],
    onMount: [],
    onDestroy: []
  };
  const { plugins, ...optionsOnly } = options;
  const optionsGroups = [...plugins || [], optionsOnly];
  optionsGroups.forEach((pluginOptions) => {
    var _a;
    (_a = pluginOptions.plugins) == null ? void 0 : _a.forEach((plugin) => normalizeRouterOptions(plugin, config));
    delete pluginOptions.plugins;
    Object.entries(pluginOptions).forEach(([field, value]) => {
      if (Array.isArray(config[field]))
        config[field].push(...[value].flat().filter(Boolean));
      else
        config[field] = value || config[field];
    });
  });
  return config;
};
const stripNullFields = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
const defaultPlugins = [reset(), scroller(), stripTrailingIndex()];
const getName = (name) => {
  while (appInstance.routers.find((r) => r.name == name)) {
    name = name.replace(/(\d*)$/, (_, n) => n ? +n + 1 : 1);
  }
  return name;
};
class Router {
  /**
   * @param {Partial<RoutifyRuntimeOptions>} input
   */
  constructor(input) {
    /** @type { RouteStore } */
    __publicField(this, "pendingRoute", getable(null));
    /** @type { RouteStore } */
    __publicField(this, "activeRoute", getable(null));
    __publicField(this, "_urlReflector", null);
    __publicField(this, "_claimed", false);
    /** @type {UrlRewrite[]} */
    __publicField(this, "urlRewrites", []);
    /** @type { import('hookar').HooksCollection<RouterInitCallback> } */
    __publicField(this, "beforeRouterInit", createSequenceHooksCollection());
    /** @type { import('hookar').HooksCollection<RouterInitCallback> } */
    __publicField(this, "afterRouterInit", createSequenceHooksCollection());
    /** @type { import('hookar').HooksCollection<BeforeUrlChangeCallback> } */
    __publicField(this, "beforeUrlChange", createGuardsCollection());
    /** @type { import('hookar').HooksCollection<AfterUrlChangeCallback> } */
    __publicField(this, "afterUrlChange", createSequenceHooksCollection());
    /** @type { import('hookar').HooksCollection<AfterRouteRenderedCallback> } */
    __publicField(this, "afterRouteRendered", createSequenceHooksCollection());
    /** @type { import('hookar').HooksCollection<TransformFragmentsCallback> } */
    __publicField(this, "transformFragments", createPipelineCollection());
    __publicField(this, "onMount", createSequenceHooksCollection());
    /** @type { import('hookar').HooksCollection<OnDestroyRouterCallback> } */
    __publicField(this, "onDestroy", createSequenceHooksCollection());
    __publicField(this, "parentElem", null);
    /** @type {QueryHandler} */
    __publicField(this, "queryHandler", {
      parse: (search, route) => URIDecodeObject(fromEntries(new URLSearchParams(search))),
      stringify: (params, route) => {
        const query = new URLSearchParams(params).toString();
        return query ? `?${query}` : "";
      }
    });
    /** @type {ClickHandler} */
    __publicField(this, "clickHandler", {});
    __publicField(this, "url", {
      internal: () => this.url.getPending() || this.url.getActive(),
      external: () => this.getExternalUrl(),
      getActive: () => {
        var _a;
        return (_a = get_store_value(this.activeRoute)) == null ? void 0 : _a.url;
      },
      getPending: () => {
        var _a;
        return (_a = get_store_value(this.pendingRoute)) == null ? void 0 : _a.url;
      },
      toString: () => this.url.internal(),
      set: this._setUrl.bind(this),
      push: (url2, state = {}) => this._setUrl(url2, "pushState", false, state),
      replace: (url2, state = {}) => this._setUrl(url2, "replaceState", false, state),
      pop: (url2, state = {}) => this._setUrl(url2, "popState", false, state)
    });
    /**
     * function that resolves after the active route has changed
     * @returns {Promise<Route>} */
    __publicField(this, "ready", async () => !this.pendingRoute.get() && this.activeRoute.get() || next(this.activeRoute, (x) => !!x));
    /** @type {Map<string, Route>} */
    __publicField(this, "history", /* @__PURE__ */ new Map());
    /** @param {HTMLElement} elem */
    __publicField(this, "setParentElem", (elem) => {
      this.parentElem = elem;
    });
    /**
     * converts a URL or Routify's internal URL to an external URL (for the browser)
     * @param {string=} url
     * @returns
     */
    __publicField(this, "getExternalUrl", (url2) => {
      const route = get_store_value(this.pendingRoute) || get_store_value(this.activeRoute);
      url2 = url2 || (route == null ? void 0 : route.url);
      const result = this.urlRewrites.reduce(
        (_url2, rewrite) => rewrite.toExternal(_url2, { router: this }),
        url2
      );
      return result.replace(/\/index$/, "");
    });
    /**
     * converts an external URL (from the browser) to an internal URL
     * @param {string} url
     * @returns
     */
    __publicField(this, "getInternalUrl", (url2) => this.urlRewrites.reduce(
      (_url2, rewrite) => rewrite.toInternal(_url2, { router: this }),
      url2
    ));
    const matchingRouter = appInstance.routers.find((r) => r.name == (input.name || ""));
    if (matchingRouter) {
      if (!matchingRouter._claimed) {
        matchingRouter.init(input);
        return matchingRouter;
      }
      input.name = getName(input.name || "");
    }
    this.parentCmpCtx = getRoutifyFragmentContextMaybe();
    const { subscribe: subscribe2, set } = writable(this);
    this.subscribe = subscribe2;
    this.triggerStore = () => set(this);
    this.init(input);
    this.params = derived(this.activeRoute, ($activeRoute) => $activeRoute.params);
    this.afterRouteRendered.next(() => {
      this._urlReflector.reflect();
      this.afterUrlChange(() => this._urlReflector.reflect());
    });
    this.onDestroy(() => this._urlReflector.reflect());
    this.activeRoute.get = () => get_store_value(this.activeRoute);
    this.pendingRoute.get = () => get_store_value(this.pendingRoute);
  }
  /**
   * @param {Partial<RoutifyRuntimeOptions>} input
   */
  init(input) {
    var _a, _b, _c, _d;
    const firstInit = !this.options;
    input.plugins = [...defaultPlugins, ...input.plugins || []].filter(Boolean);
    input = stripNullFields(input);
    this.options = normalizeRouterOptions({ ...this.options, ...input });
    let {
      instance,
      rootNode,
      name,
      routes: routes2,
      urlRewrite,
      urlReflector,
      url: url2,
      passthrough,
      beforeUrlChange,
      afterUrlChange,
      afterRouteRendered,
      transformFragments,
      onMount,
      onDestroy: onDestroy2,
      beforeRouterInit,
      afterRouterInit,
      queryHandler,
      clickHandler
    } = this.options;
    if (queryHandler)
      this.queryHandler = queryHandler;
    if (clickHandler)
      this.clickHandler = clickHandler;
    beforeUrlChange.forEach(this.beforeUrlChange);
    transformFragments.forEach(this.transformFragments);
    afterUrlChange.forEach(this.afterUrlChange);
    afterRouteRendered.forEach(this.afterRouteRendered);
    onMount.forEach(this.onMount);
    onDestroy2.forEach(this.onDestroy);
    beforeRouterInit.forEach(this.beforeRouterInit);
    afterRouterInit.forEach(this.afterRouterInit);
    this.beforeRouterInit.run({ router: this, firstInit });
    this.instance = instance || this.instance || ((_c = (_b = (_a = this.parentCmpCtx) == null ? void 0 : _a.route) == null ? void 0 : _b.router) == null ? void 0 : _c.instance) || appInstance.instances[0] || new RoutifyRuntime({});
    this.name = name ?? this.name;
    this.urlRewrites = urlRewrite ?? this.urlRewrites;
    this.log = this.log || this.instance.log.createChild(this.name || "[unnamed instance]");
    if (passthrough && !(passthrough instanceof Router))
      passthrough = ((_d = this.parentCmpCtx) == null ? void 0 : _d.route.router) || passthrough;
    this.passthrough = passthrough || this.passthrough;
    appInstance.instances.forEach((inst) => {
      const index2 = inst.routers.indexOf(this);
      if (index2 !== -1)
        inst.routers.splice(index2, 1);
    });
    this.instance.routers.push(this);
    if (routes2 && !this.rootNode)
      this.importRoutes(routes2);
    this.rootNode = rootNode ?? this.rootNode ?? this.instance.rootNodes[this.name || "default"];
    this.log.debug("initiated router");
    if (this.url.getActive()) {
      this.log.debug("router was created with activeUrl");
      this._setUrl(this.url.getActive(), "pushState", true);
    }
    const shouldInstallUrlReflector = !this.urlReflector || urlReflector && !(this.urlReflector instanceof urlReflector);
    if (shouldInstallUrlReflector) {
      urlReflector = urlReflector || (typeof window != "undefined" ? AddressReflector : InternalReflector);
      this.setUrlReflector(urlReflector);
    }
    if (url2)
      this.url.replace(url2);
    this.triggerStore();
    this.afterRouterInit.run({ router: this, firstInit });
  }
  importRoutes(routes2) {
    this.rootNode = this.instance.createNode().importTree(routes2);
    this.instance.rootNodes[routes2.rootName || "unnamed"] = this.rootNode;
  }
  /**
   *
   * @param {string} url
   * @param {UrlState} mode pushState, replaceState or popState
   * @param {boolean} [isInternal=false] if the URL is already internal, skip rewrite.toInternal
   * @param {Object=} state a state to attach to the route
   * @returns {Promise<true|false>}
   */
  async _setUrl(url2, mode, isInternal, state = {}) {
    if (!isInternal)
      url2 = this.getInternalUrl(url2);
    state = state || {};
    const oldRoute = this.history.get(state.id);
    if (oldRoute == null ? void 0 : oldRoute.meta.history) {
      oldRoute.mode = "popState";
      oldRoute.state.cached = true;
      this.setActiveRoute(oldRoute);
      return true;
    }
    url2 = url2 || "/";
    url2 = url2.replace(/(.+)\/+([#?]|$)/, "$1$2");
    this.log.debug("set url", {
      url: url2,
      mode,
      prev: this.url.internal(),
      browserOld: globalThis.document && urlFromAddress(),
      state
    });
    const currentRoute = this.pendingRoute.get() || this.activeRoute.get();
    if (!this.rootNode && this.instance.global.routeMaps[this.name])
      this.importRoutes(await this.instance.global.routeMaps[this.name]());
    const route = new Route(this, url2, mode, state);
    const loadRoutePromise = route.loadRoute();
    if (state.prefetch)
      return;
    if (identicalRoutes(currentRoute, route)) {
      this.log.debug("current route is identical - skip", currentRoute, route);
      return false;
    } else {
      route.log.debug("set pending route", route);
      this.pendingRoute.set(route);
      const didLoadRoute = await loadRoutePromise;
      if (this.pendingRoute.get() === route)
        this.pendingRoute.set(null);
      if (didLoadRoute)
        this.setActiveRoute(route);
      await new Promise((resolve) => setTimeout(resolve));
      return true;
    }
  }
  setActiveRoute(route) {
    this.log.debug("set active route", this);
    this.history.set(route.state.id, route);
    if (this.history.size > 100)
      this.history.delete([...this.history.keys()][0]);
    this.activeRoute.set(route);
    this.afterUrlChange.run({
      route,
      history: [...this.history.values()].reverse()
    });
    Promise.all(
      route.fragments.map(
        (fragment) => fragment.renderContext.then((rc) => rc.mounted)
      )
    ).then(() => this.afterRouteRendered.run({ route }));
    this.log.debug("unset pending route", this);
  }
  destroy() {
    this.log.debug(`destroying router`);
    this.instance.routers = this.instance.routers.filter((router2) => router2 !== this);
    this.onDestroy.run({ router: this });
  }
  /** @type {BaseReflector} */
  get urlReflector() {
    return this._urlReflector;
  }
  /** @param {typeof BaseReflector} UrlReflector */
  setUrlReflector(UrlReflector) {
    var _a;
    (_a = this._urlReflector) == null ? void 0 : _a.uninstall();
    this._urlReflector = new UrlReflector(this);
    this._urlReflector.install();
    this.triggerStore();
  }
}
const createRouter = (options) => new Router(options);
const DecoratorWrapper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { decorators = null } = $$props;
  let { isRoot = true } = $$props;
  let { context } = $$props;
  decorators = decorators || context.decorators;
  let [decorator, ...restOfDecorators] = [...decorators];
  while (decorator && !(decorator == null ? void 0 : decorator.shouldRender({ context, isRoot, decorators })))
    [decorator, ...restOfDecorators] = [...restOfDecorators];
  if (isRoot)
    onDestroy(() => context.onDestroy.run());
  if ($$props.decorators === void 0 && $$bindings.decorators && decorators !== void 0)
    $$bindings.decorators(decorators);
  if ($$props.isRoot === void 0 && $$bindings.isRoot && isRoot !== void 0)
    $$bindings.isRoot(isRoot);
  if ($$props.context === void 0 && $$bindings.context && context !== void 0)
    $$bindings.context(context);
  return `


${decorator ? `${validate_component(decorator.component || missing_component, "svelte:component").$$render($$result, { context, isRoot }, {}, {
    default: () => {
      return `${validate_component(DecoratorWrapper, "svelte:self").$$render(
        $$result,
        {
          decorators: restOfDecorators,
          context,
          isRoot: false
        },
        {},
        {
          default: () => {
            return `${slots.default ? slots.default({}) : ``}`;
          }
        }
      )}`;
    }
  })}` : `${slots.default ? slots.default({}) : ``}`}`;
});
const Noop = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { context = null } = $$props;
  let { Parent = null } = $$props;
  if ($$props.context === void 0 && $$bindings.context && context !== void 0)
    $$bindings.context(context);
  if ($$props.Parent === void 0 && $$bindings.Parent && Parent !== void 0)
    $$bindings.Parent(Parent);
  return `${slots.default ? slots.default({}) : ``}`;
});
const AnchorDecorator = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["location", "onMount"]);
  let { location: location2 } = $$props;
  let { onMount = (x) => x } = $$props;
  let elem;
  if ($$props.location === void 0 && $$bindings.location && location2 !== void 0)
    $$bindings.location(location2);
  if ($$props.onMount === void 0 && $$bindings.onMount && onMount !== void 0)
    $$bindings.onMount(onMount);
  return `${location2 === "wrapper" ? `<div${spread([{ "data-routify-anchor-parent": true }, escape_object($$restProps)], {})}${add_attribute("this", elem, 0)}>${slots.default ? slots.default({}) : ``}</div>` : `${location2 === "header" ? `<div${spread([{ "data-routify-anchor-header": true }, escape_object($$restProps)], {})}${add_attribute("this", elem, 0)}></div>
    ${slots.default ? slots.default({}) : ``}` : `${`<div${spread(
    [
      { "data-routify-anchor-locator": true },
      { class: "anchor" },
      escape_object($$restProps)
    ],
    {}
  )}${add_attribute("this", elem, 0)}></div>`}
    ${slots.default ? slots.default({}) : ``}

    ${`<div class="${"anchor-backstop"}" data-routify-anchor-backstop></div>`}`}`}`;
});
const RenderFragment = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  var _a;
  let hasInlineChildren;
  let params;
  let load2;
  let compProps;
  let $isVisible, $$unsubscribe_isVisible;
  let $childFragments, $$unsubscribe_childFragments;
  let { context } = $$props;
  const { isVisible, childFragments } = context;
  validate_store(isVisible, "isVisible");
  $$unsubscribe_isVisible = subscribe(isVisible, (value) => $isVisible = value);
  validate_store(childFragments, "childFragments");
  $$unsubscribe_childFragments = subscribe(childFragments, (value) => $childFragments = value);
  let NodeComponent = ((_a = context.node.module) == null ? void 0 : _a.default) || context.node.asyncModule || Noop;
  setRoutifyFragmentContext(context);
  const updateRenderContext = (elem, newMeta) => {
    var _a2;
    if (elem)
      elem["__routify_meta"] = {
        ...elem && elem["__routify_meta"],
        renderContext: {
          ...(_a2 = elem["__routify_meta"]) == null ? void 0 : _a2.renderContext,
          ...newMeta
        }
      };
    return elem;
  };
  const initialize = async (parent, anchor) => {
    context.parentContext && await waitFor(context.parentContext.elem, Boolean);
    context.elem.set({ anchor, parent });
    parent = updateRenderContext(parent, { parent: context });
    if (anchor)
      anchor = updateRenderContext(anchor, { anchor: context });
  };
  if ($$props.context === void 0 && $$bindings.context && context !== void 0)
    $$bindings.context(context);
  hasInlineChildren = context.node.navigableChildren.some((child) => child.meta.inline);
  {
    if (isAnonFn(NodeComponent) && $isVisible)
      context.node.loadModule().then((r) => NodeComponent = r.default);
  }
  ({ params, load: load2 } = context.fragment);
  compProps = {
    ...params,
    ...load2 == null ? void 0 : load2.props,
    ...context.props
  };
  $$unsubscribe_isVisible();
  $$unsubscribe_childFragments();
  return `${$isVisible && !isAnonFn(NodeComponent) ? `
    
    ${validate_component(DecoratorWrapper, "DecoratorWrapper").$$render($$result, { context }, {}, {
    default: () => {
      return `${validate_component(AnchorDecorator, "AnchorDecorator").$$render(
        $$result,
        {
          location: context.anchorLocation,
          onMount: initialize
        },
        {},
        {
          default: () => {
            return `
            ${validate_component(NodeComponent || missing_component, "svelte:component").$$render($$result, Object.assign(compProps, context.props, { context }), {}, {
              default: ({ props, inline, multi, decorator, anchor, options, scrollBoundary }) => {
                var _a2;
                return `${$childFragments.length || (hasInlineChildren || inline || multi) && !((_a2 = inline || multi) == null ? void 0 : _a2.single) ? `
                    
                    ${validate_component(ComposeFragments, "Compose").$$render(
                  $$result,
                  {
                    options: {
                      inline: inline || multi,
                      decorator,
                      props,
                      options,
                      scrollBoundary,
                      anchor: anchor || context.anchorLocation
                    },
                    context
                  },
                  {},
                  {}
                )}
                ` : ``}`;
              }
            })}
            ${`<div></div>`}`;
          }
        }
      )}`;
    }
  })}` : ``}



`;
});
const coerceInlineInputToObject = (inlineInput) => {
  if (typeof inlineInput === "undefined")
    return {};
  return {
    // if inline is true, callback will return true
    isInline: () => !!inlineInput,
    // @ts-ignore
    ...inlineInput
  };
};
const normalizeInline = (inlineInput) => ({
  isInline: () => false,
  scrollIntoView: (elem) => elem.scrollIntoView(),
  context: "browser",
  params: {},
  ...inlineInput,
  // If a function is passed, it will be used as the callback.
  // If undefined, the callback will return true if it's the last element in the array.
  // Otherwise, it will return true if inline is true.
  shouldScroll: typeof inlineInput.shouldScroll === "function" ? inlineInput.shouldScroll : typeof inlineInput.shouldScroll === "undefined" ? (ctx, index2, arr, defaultCallback) => defaultCallback(ctx, index2, arr) : () => !!inlineInput.shouldScroll
});
const decoratorDefaults = { recursive: true, shouldRender: () => true };
const normalizeDecorator = (decorator) => {
  if ("component" in decorator)
    return { ...decoratorDefaults, ...decorator };
  else
    return { ...decoratorDefaults, component: decorator };
};
const shiftParams = (node, pool) => {
  const params = {};
  node.paramKeys.forEach((key) => {
    if (pool && key in pool) {
      params[key] = pool[key].shift();
    }
  });
  return params;
};
class RouterContext {
  /** @param {{router: Router}} params */
  constructor({ router: router2 }) {
    /** @type {import('svelte/store').Writable<RenderContext[]>} */
    __publicField(this, "childContexts", writable([]));
    /** @type {import('svelte/store').Writable<RouteFragment[]>} */
    __publicField(this, "childFragments", writable([]));
    /** @type {import('svelte/store').Writable<RenderContext>} */
    __publicField(this, "activeChildContext", writable(null));
    /** @type {RenderContext} */
    __publicField(this, "lastActiveChildContext", null);
    /** @type {Decorator[]} */
    __publicField(this, "decorators", []);
    this.router = router2;
    this.route = router2.activeRoute.get();
  }
  /**
   * @param {Partial<{inline: InlineInput, decorator:DecoratorInput, props, options, anchor: AnchorLocation, scrollBoundary: scrollBoundary}>} options
   *
   * */
  buildChildContexts(options, newDecorators) {
    var _a;
    const { childFragments } = this;
    const {
      inline: rawInlineInputFromSlot,
      decorator,
      props,
      anchor: anchorLocation,
      options: contextOptions,
      scrollBoundary = defaultscrollBoundary
    } = options;
    const refNode = (_a = get_store_value(childFragments)[0]) == null ? void 0 : _a.node;
    const node = (this == null ? void 0 : this["node"]) || refNode.parent;
    const matches = node ? node.children.filter(
      (_node) => _node === refNode || node.navigableChildren.includes(_node)
    ) : [refNode];
    const children = matches.length ? matches : refNode ? [refNode] : [];
    const paramsPool = jsonClone((rawInlineInputFromSlot == null ? void 0 : rawInlineInputFromSlot["params"]) || {});
    Object.entries(paramsPool).forEach(([key, values]) => {
      const sourceIndex = children.findIndex((node2) => node2.paramKeys.includes(key));
      const newChildNodes = new Array(values.length - 1).fill(children[sourceIndex]);
      children.splice(sourceIndex + 1, 0, ...newChildNodes);
    });
    const childContexts = children.map(
      (node2) => new RenderContext({
        node: node2,
        paramsPool,
        rawInlineInputFromSlot,
        parentContext: this,
        newDecorators,
        contextOptions,
        scrollBoundary,
        anchorLocation,
        props
      })
    );
    this.childContexts.set(childContexts);
  }
  updateChildren() {
    const activeChildContext = get_store_value(this.activeChildContext);
    get_store_value(this.childContexts).forEach((context) => context.update(activeChildContext));
  }
}
class RenderContext extends RouterContext {
  /**
   *
   * @param {{
   *   node: RNodeRuntime
   *   paramsPool: Object.<string, string[]>
   *   rawInlineInputFromSlot: InlineInput
   *   parentContext: RenderContext | RouterContext
   *   newDecorators: Decorator[]
   *   contextOptions: RenderContextOptions
   *   scrollBoundary: scrollBoundary
   *   anchorLocation: AnchorLocation
   *   router?: Router
   *   props: Object
   * }} param0
   */
  constructor({
    node,
    paramsPool,
    rawInlineInputFromSlot,
    parentContext,
    newDecorators,
    contextOptions,
    scrollBoundary,
    anchorLocation,
    router: router2,
    props
  }) {
    super({ router: router2 || parentContext.router });
    __publicField(this, "anchorLocation", "parent");
    /** @type {RNodeRuntime} */
    __publicField(this, "node");
    __publicField(this, "isActive", writable(false));
    __publicField(this, "isVisible", writable(false));
    __publicField(this, "wasVisible", false);
    __publicField(this, "isInline", false);
    /** @type {Inline} */
    __publicField(this, "inline");
    /** @type {import('svelte/store').Writable<{ parent: HTMLElement, anchor: HTMLElement }>} */
    __publicField(this, "elem", writable(null));
    /** @type {Route} */
    __publicField(this, "route");
    /** @type {import('svelte/store').Writable<RenderContext[]>} */
    __publicField(this, "childContexts", writable([]));
    __publicField(this, "onDestroy", createSequenceHooksCollection());
    __publicField(this, "mounted", createDeferredPromise());
    /** @type {RouterContext} */
    __publicField(this, "routerContext");
    this.anchorLocation = anchorLocation || "parent";
    this.node = node;
    this.props = props;
    if (!node)
      console.trace("node");
    const params = shiftParams(node, paramsPool);
    this.fragment = new RouteFragment(null, node, null, params);
    this.childFragments = writable(
      fetchIndexNode(node) ? [new RouteFragment(null, fetchIndexNode(node))] : []
    );
    this.params = writable({});
    this.inline = normalizeInline({
      ...coerceInlineInputToObject(rawInlineInputFromSlot),
      ...coerceInlineInputToObject(node.meta.inline)
    });
    if (parentContext instanceof RenderContext) {
      this.routerContext = parentContext.routerContext;
      this.parentContext = parentContext;
    } else
      this.routerContext = parentContext;
    this.decorators = newDecorators;
    this.options = contextOptions || {};
    this.scrollBoundary = scrollBoundary;
  }
  get parentOrRouterContext() {
    return this.parentContext || this.routerContext;
  }
  get ancestors() {
    const ancestors = [];
    let context = this.parentContext;
    while (context) {
      ancestors.push(context);
      context = context.parentContext;
    }
    return ancestors;
  }
  setToActive() {
    const parentContext = this.parentOrRouterContext;
    const [fragment, ...fragments] = get_store_value(parentContext.childFragments);
    this.fragment = fragment;
    this.childFragments.set(fragments);
    this.route = parentContext.route;
    fragment.renderContext.resolve(this);
    parentContext.lastActiveChildContext = get_store_value(parentContext.activeChildContext);
    parentContext.activeChildContext.set(this);
    this.isInline = this.inline.isInline(this.node, this);
  }
  update(activeSiblingContext) {
    this.router.log.verbose("updating renderContext", this.node.name);
    const environment = typeof window !== "undefined" ? "browser" : "ssr";
    this.isInline = this.inline.isInline(this.node, activeSiblingContext);
    const activeContextIsStandalone = activeSiblingContext && !activeSiblingContext.isInline;
    const envIsOkay = ["always", environment].includes(this.inline.context);
    const isIncluded = this.isInline && !activeContextIsStandalone && envIsOkay;
    const isDefault = !activeSiblingContext && this.node.name === "index";
    this.wasVisible = get_store_value(this.isVisible);
    lazySet(
      this.isActive,
      this === activeSiblingContext || !activeSiblingContext && this.node.meta.isDefault
    );
    lazySet(this.isVisible, get_store_value(this.isActive) || isIncluded || isDefault);
    if (!get_store_value(this.isVisible))
      this.elem.set(null);
    this.updateParams();
  }
  /** updates params with accumulated values, starting from the root context */
  updateParams() {
    let context = this;
    const contexts2 = [];
    while (context) {
      contexts2.push(context);
      context = context.parentContext;
    }
    contexts2.reverse();
    this.params.set(
      Object.assign({}, ...contexts2.map((context2) => context2.fragment.params))
    );
  }
}
const contextHasMatchingFragmentAndParams = (f) => (c) => f.node === c.node && Object.entries(f.params).every(([key, value]) => c.fragment.params[key] === value);
const fetchIndexNode = (node) => node.navigableChildren.find((node2) => node2.meta.isDefault);
const findDecorator = (node) => node == null ? void 0 : node.children.find((node2) => node2.name === "_decorator");
const addFolderDecorator = (decorators, context) => {
  const folderDecorator = findDecorator(context.node);
  if (!folderDecorator)
    return;
  if (!folderDecorator.module)
    return folderDecorator.loadModule().then(() => {
      console.warn(`Dynamic import of "${folderDecorator.id}" may cause issues.`);
      addFolderDecorator(decorators, context);
    });
  const options = folderDecorator.module["decorator"] || {};
  decorators.push({
    component: folderDecorator.module["default"],
    recursive: options.recursive ?? folderDecorator.meta.recursive ?? true,
    shouldRender: options.shouldRender ?? (() => true)
  });
};
function findNearestInlineContext(context) {
  return context ? context.isInline ? context : findNearestInlineContext(context.parentContext) : null;
}
const defaultscrollBoundary = (ownContext) => {
  var _a, _b;
  return !ownContext.isInline && ((_b = get_store_value((_a = findNearestInlineContext(ownContext)) == null ? void 0 : _a.elem)) == null ? void 0 : _b.parent);
};
const findActiveChildContext = (childContexts, fragment) => childContexts.find(contextHasMatchingFragmentAndParams(fragment)) || childContexts.find((s) => s.node === (fragment == null ? void 0 : fragment.node));
const ComposeFragments = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  var _a;
  let $childFragments, $$unsubscribe_childFragments;
  let $childContexts, $$unsubscribe_childContexts;
  let { context } = $$props;
  let { options } = $$props;
  const { childFragments } = context;
  validate_store(childFragments, "childFragments");
  $$unsubscribe_childFragments = subscribe(childFragments, (value) => $childFragments = value);
  const { decorator } = options;
  const recursiveDecorators = context.decorators.filter((deco) => deco.recursive);
  const newDecorators = pushToOrReplace(recursiveDecorators, decorator).filter(Boolean).map(normalizeDecorator);
  let decoratorReady = !((_a = addFolderDecorator(newDecorators, context)) == null ? void 0 : _a["then"](() => decoratorReady = true));
  context.buildChildContexts(options, newDecorators);
  const { childContexts } = context;
  validate_store(childContexts, "childContexts");
  $$unsubscribe_childContexts = subscribe(childContexts, (value) => $childContexts = value);
  const _handleChildren = (childFragments2) => {
    context.router.log.verbose("handle children", childFragments2);
    const setInactive = (cf) => cf.renderContext.then((rc) => rc.isActive.set(false));
    if (childFragments2.length && context.route)
      setActiveChildContext(context);
    else
      childFragments2.forEach(setInactive);
    context.updateChildren();
  };
  const setActiveChildContext = (context2, rebuild) => {
    const [fragment, ...childFragments2] = get_store_value(context2.childFragments);
    const childContexts2 = get_store_value(context2.childContexts);
    const toBeActiveChildContext = findActiveChildContext(childContexts2, fragment);
    if (!toBeActiveChildContext) {
      if (rebuild)
        handleRebuildError(context2, childContexts2);
      context2.buildChildContexts(options, newDecorators);
      return setActiveChildContext(context2, true);
    }
    toBeActiveChildContext.setToActive();
    context2.childContexts.set(childContexts2);
  };
  if ($$props.context === void 0 && $$bindings.context && context !== void 0)
    $$bindings.context(context);
  if ($$props.options === void 0 && $$bindings.options && options !== void 0)
    $$bindings.options(options);
  {
    _handleChildren($childFragments);
  }
  $$unsubscribe_childFragments();
  $$unsubscribe_childContexts();
  return `${decoratorReady ? `${each($childContexts, (context2) => {
    return `${validate_component(RenderFragment, "RenderFragment").$$render($$result, { context: context2 }, {}, {})}`;
  })}` : ``}`;
});
const Router_1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let activeRoute;
  let $activeRoute, $$unsubscribe_activeRoute = noop, $$subscribe_activeRoute = () => ($$unsubscribe_activeRoute(), $$unsubscribe_activeRoute = subscribe(activeRoute, ($$value) => $activeRoute = $$value), activeRoute);
  let { router: router2 = null } = $$props;
  let { routes: routes2 = null } = $$props;
  let { decorator = null } = $$props;
  let { urlReflector = null } = $$props;
  let { instance = null } = $$props;
  let { urlRewrite = null } = $$props;
  let { url: url2 = null } = $$props;
  let { name = null } = $$props;
  let { rootNode = null } = $$props;
  let { passthrough = null } = $$props;
  let { beforeRouterInit = null } = $$props;
  let { afterRouterInit = null } = $$props;
  let { beforeUrlChange = null } = $$props;
  let { afterUrlChange = null } = $$props;
  let { transformFragments = null } = $$props;
  let { onDestroy: onDestroy$1 = null } = $$props;
  let { plugins = null } = $$props;
  let { queryHandler = null } = $$props;
  let { anchor = "wrapper" } = $$props;
  let { clickHandler = {} } = $$props;
  const options = {
    instance,
    rootNode,
    name,
    routes: routes2,
    urlRewrite,
    urlReflector,
    passthrough,
    beforeRouterInit,
    afterRouterInit,
    beforeUrlChange,
    afterUrlChange,
    transformFragments,
    onDestroy: onDestroy$1,
    plugins,
    queryHandler,
    clickHandler
  };
  router2 = router2 || new Router(options);
  router2._claimed = true;
  const context = new RouterContext({ router: router2 });
  router2.onMount.run({ context, router: router2 });
  context.decorators = context.decorators.map(normalizeDecorator);
  const initialize = (elem) => {
    var _a;
    elem = anchor === "parent" || anchor === "wrapper" ? elem : elem.parentElement;
    router2.setParentElem(elem);
    elem["__routify_meta"] = { ...elem["__routify_meta"], router: router2 };
    let clickScopeElem = resolveIfAnonFn(((_a = router2.clickHandler) == null ? void 0 : _a.elem) || elem, [elem]);
    if (!router2.passthrough) {
      clickScopeElem.addEventListener("click", handleClick);
      clickScopeElem.addEventListener("keydown", handleClick);
      clickScopeElem.addEventListener("mouseover", handleHover);
    }
  };
  const handleHover = (event) => {
    var _a, _b, _c;
    let { url: url3, state } = getUrlFromEvent(event);
    const urlOrFalse = ((_b = (_a = router2.clickHandler).callback) == null ? void 0 : _b.call(_a, event, url3)) ?? url3;
    const shouldPrefetch = typeof urlOrFalse === "string" && ((_c = event.target.closest("[data-routify-prefetch-data]")) == null ? void 0 : _c.dataset.routifyPrefetchData) === "hover";
    if (shouldPrefetch)
      router2.url.push(urlOrFalse, { prefetch: true, ...state });
  };
  const handleClick = (event) => {
    var _a, _b;
    if (shouldIgnoreClick(event))
      return;
    const { url: eventUrl, state } = getUrlFromEvent(event);
    const url3 = ((_b = (_a = router2.clickHandler).callback) == null ? void 0 : _b.call(_a, event, eventUrl)) ?? eventUrl;
    if (typeof url3 === "string")
      router2.url.push(url3, state);
  };
  if (typeof window !== "undefined")
    onDestroy(() => router2.destroy());
  if ($$props.router === void 0 && $$bindings.router && router2 !== void 0)
    $$bindings.router(router2);
  if ($$props.routes === void 0 && $$bindings.routes && routes2 !== void 0)
    $$bindings.routes(routes2);
  if ($$props.decorator === void 0 && $$bindings.decorator && decorator !== void 0)
    $$bindings.decorator(decorator);
  if ($$props.urlReflector === void 0 && $$bindings.urlReflector && urlReflector !== void 0)
    $$bindings.urlReflector(urlReflector);
  if ($$props.instance === void 0 && $$bindings.instance && instance !== void 0)
    $$bindings.instance(instance);
  if ($$props.urlRewrite === void 0 && $$bindings.urlRewrite && urlRewrite !== void 0)
    $$bindings.urlRewrite(urlRewrite);
  if ($$props.url === void 0 && $$bindings.url && url2 !== void 0)
    $$bindings.url(url2);
  if ($$props.name === void 0 && $$bindings.name && name !== void 0)
    $$bindings.name(name);
  if ($$props.rootNode === void 0 && $$bindings.rootNode && rootNode !== void 0)
    $$bindings.rootNode(rootNode);
  if ($$props.passthrough === void 0 && $$bindings.passthrough && passthrough !== void 0)
    $$bindings.passthrough(passthrough);
  if ($$props.beforeRouterInit === void 0 && $$bindings.beforeRouterInit && beforeRouterInit !== void 0)
    $$bindings.beforeRouterInit(beforeRouterInit);
  if ($$props.afterRouterInit === void 0 && $$bindings.afterRouterInit && afterRouterInit !== void 0)
    $$bindings.afterRouterInit(afterRouterInit);
  if ($$props.beforeUrlChange === void 0 && $$bindings.beforeUrlChange && beforeUrlChange !== void 0)
    $$bindings.beforeUrlChange(beforeUrlChange);
  if ($$props.afterUrlChange === void 0 && $$bindings.afterUrlChange && afterUrlChange !== void 0)
    $$bindings.afterUrlChange(afterUrlChange);
  if ($$props.transformFragments === void 0 && $$bindings.transformFragments && transformFragments !== void 0)
    $$bindings.transformFragments(transformFragments);
  if ($$props.onDestroy === void 0 && $$bindings.onDestroy && onDestroy$1 !== void 0)
    $$bindings.onDestroy(onDestroy$1);
  if ($$props.plugins === void 0 && $$bindings.plugins && plugins !== void 0)
    $$bindings.plugins(plugins);
  if ($$props.queryHandler === void 0 && $$bindings.queryHandler && queryHandler !== void 0)
    $$bindings.queryHandler(queryHandler);
  if ($$props.anchor === void 0 && $$bindings.anchor && anchor !== void 0)
    $$bindings.anchor(anchor);
  if ($$props.clickHandler === void 0 && $$bindings.clickHandler && clickHandler !== void 0)
    $$bindings.clickHandler(clickHandler);
  {
    if (url2 && url2 !== router2.url.internal())
      router2.url.replace(url2);
  }
  $$subscribe_activeRoute(activeRoute = router2.activeRoute);
  context.route = $activeRoute;
  {
    context.childFragments.set(($activeRoute == null ? void 0 : $activeRoute.fragments) || []);
  }
  {
    router2.log.debug("before render", get_store_value(context.childFragments));
  }
  $$unsubscribe_activeRoute();
  return `${validate_component(AnchorDecorator, "AnchorDecorator").$$render(
    $$result,
    {
      onMount: initialize,
      style: "display: contents",
      location: anchor
    },
    {},
    {
      default: () => {
        return `${$activeRoute ? `${validate_component(ComposeFragments, "Component").$$render($$result, { context, options: { decorator } }, {}, {})}` : ``}`;
      }
    }
  )}`;
});
const killWarnings = () => {
  var originalWarn = console.warn;
  console.warn = function() {
    var args = Array.prototype.slice.call(arguments);
    if (args[0].match(/<.+> was created with unknown prop 'context'/))
      return;
    if (args[0].match(/<.+> was created with unknown prop 'isRoot'/))
      return;
    if (args[0].match(/<.+> received an unexpected slot "default"\./))
      return;
    var stackTrace = new Error().stack;
    var callSite = stackTrace.split("\n")[2];
    if (callSite) {
      args.push(callSite.trim());
    }
    originalWarn.apply(console, args);
  };
};
killWarnings();
const router = createRouter({ routes });
const App = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Router_1, "Router").$$render($$result, { router }, {}, {})}`;
});
const module = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App,
  router
}, Symbol.toStringTag, { value: "Module" }));
const polyfillFetch = async () => {
  const fetch2 = await import("node-fetch");
  globalThis.fetch = fetch2.default;
  globalThis.Headers = fetch2.Headers;
  globalThis.Request = fetch2.Request;
  globalThis.Response = fetch2.Response;
};
const renderModule = async (module2, urlOrOptions) => {
  var _a;
  await polyfillFetch();
  const render2 = ((_a = module2.default) == null ? void 0 : _a.render) || module2["render"];
  const url2 = urlOrOptions.url || urlOrOptions;
  const load2 = module2.load ? await module2.load(url2) : {};
  const preloadUrlLoad = await preloadUrl(urlOrOptions);
  return { status: 200, ...await render2(), ...load2, ...preloadUrlLoad == null ? void 0 : preloadUrlLoad.flat()[0] };
};
const map = {
  "default": () => Promise.resolve().then(() => routes_default).then((m) => m.default)
};
const render = (url2) => renderModule(module, { url: url2, routesMap: map });
const Header_svelte_svelte_type_style_lang = "";
const css$4 = {
  code: "header.s-c1MG4BWNDc59.s-c1MG4BWNDc59{position:relative;height:226px;background-image:url('./header.jpg');background-position:right}#logo.s-c1MG4BWNDc59.s-c1MG4BWNDc59{position:absolute;top:40px;left:50px}#logo.s-c1MG4BWNDc59 img.s-c1MG4BWNDc59{width:190px;height:90px}nav.s-c1MG4BWNDc59.s-c1MG4BWNDc59{position:absolute;bottom:0px;left:30px}nav.s-c1MG4BWNDc59 a.s-c1MG4BWNDc59{font-family:'Alegreya Sans';font-variation-settings:'wght' 600;display:inline-block;padding:13px 25px;text-decoration:none;font-size:16pt;color:#fff;text-shadow:2px 2px 2px #0003;opacity:0.8}nav.s-c1MG4BWNDc59 a.s-c1MG4BWNDc59:hover{opacity:1}nav.s-c1MG4BWNDc59 a.active.s-c1MG4BWNDc59{color:var(--text);background-color:var(--panel);border-radius:8px 8px 0px 0px;opacity:1;position:relative}.active.s-c1MG4BWNDc59.s-c1MG4BWNDc59:before,.active.s-c1MG4BWNDc59.s-c1MG4BWNDc59:after{content:'';position:absolute;height:8px;width:16px;bottom:0px}.active.s-c1MG4BWNDc59.s-c1MG4BWNDc59:after{right:-16px;border-radius:0 0 0 8px;box-shadow:-8px 0 0 0 var(--panel)}.active.s-c1MG4BWNDc59.s-c1MG4BWNDc59:before{left:-16px;border-radius:0 0 8px 0;box-shadow:8px 0 0 0 var(--panel)}",
  map: null
};
const Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $url, $$unsubscribe_url;
  let $isActive, $$unsubscribe_isActive;
  validate_store(url, "url");
  $$unsubscribe_url = subscribe(url, (value) => $url = value);
  validate_store(isActive, "isActive");
  $$unsubscribe_isActive = subscribe(isActive, (value) => $isActive = value);
  $$result.css.add(css$4);
  $$unsubscribe_url();
  $$unsubscribe_isActive();
  return `<header class="${"s-c1MG4BWNDc59"}"><a href="${"/"}" id="${"logo"}" class="${"s-c1MG4BWNDc59"}"><img src="${"./logo.png"}" alt="${"Andor2.cz logo"}" class="${"s-c1MG4BWNDc59"}"></a>
  <nav class="${"s-c1MG4BWNDc59"}"><a${add_attribute("href", $url("/"), 0)} class="${["s-c1MG4BWNDc59", $isActive("/index") ? "active" : ""].join(" ").trim()}">Novinky</a>
    <a${add_attribute("href", $url("/games"), 0)} class="${["s-c1MG4BWNDc59", $isActive("/games") ? "active" : ""].join(" ").trim()}">Hry</a></nav>
</header>`;
});
const Sidebar_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: "aside.s-G1Ow7ZVQ9xTC.s-G1Ow7ZVQ9xTC{width:280px;margin-left:20px;padding:20px;background-color:var(--panel);border-radius:0px 0px 10px 10px}aside.s-G1Ow7ZVQ9xTC a.s-G1Ow7ZVQ9xTC{font-family:'Alegreya Sans'}.w100.s-G1Ow7ZVQ9xTC.s-G1Ow7ZVQ9xTC{width:100%}",
  map: null
};
const Sidebar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { user: user2 } = $$props;
  let { profile } = $$props;
  if ($$props.user === void 0 && $$bindings.user && user2 !== void 0)
    $$bindings.user(user2);
  if ($$props.profile === void 0 && $$bindings.profile && profile !== void 0)
    $$bindings.profile(profile);
  $$result.css.add(css$3);
  return `<aside class="${"s-G1Ow7ZVQ9xTC"}">${profile ? `${escape(profile.name)}` : ``}
  ${user2 ? `${escape(user2.email)}<br><br>
    <a href="${"./api/auth/logout"}" class="${"s-G1Ow7ZVQ9xTC"}">Odhlásit</a>` : `<form action="${"/api/auth/login"}" method="${"post"}"><button value="${"google"}" name="${"provider"}" type="${"submit"}" class="${"google w100 s-G1Ow7ZVQ9xTC"}">Přihlásit přes Google</button></form>`}
</aside>`;
});
const _layout_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: "#wrapper.s-3prGgWTksqJq{width:100%;margin:auto;display:flex}main.s-3prGgWTksqJq{flex:1;background-color:var(--panel);border-radius:0px 0px 10px 10px}footer.s-3prGgWTksqJq{margin-top:20px;padding:20px;text-align:center}#content.s-3prGgWTksqJq{padding:40px 60px 60px 60px}",
  map: null
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$2);
  return `<div id="${"wrapper"}" class="${"s-3prGgWTksqJq"}"><main class="${"s-3prGgWTksqJq"}">${validate_component(Header, "Header").$$render($$result, {}, {}, {})}
    <div id="${"content"}" class="${"s-3prGgWTksqJq"}">${slots.default ? slots.default({}) : ``}</div></main>
  ${validate_component(Sidebar, "Sidebar").$$render($$result, {}, {}, {})}</div>
<footer class="${"s-3prGgWTksqJq"}">v ${escape(window.__APP_VERSION__)}</footer>`;
});
const _layout = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Layout
}, Symbol.toStringTag, { value: "Module" }));
const user = writable(false);
console.log('"production"', "production");
console.log("({}).SUPABASE_URL", "http://127.0.0.1:54321");
console.log("({}).SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0");
const supabase = createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  { auth: { flowType: "pkce" } }
);
const games_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".headline.s-DNskTdhA0Gjg.s-DNskTdhA0Gjg{justify-content:space-between}#games.s-DNskTdhA0Gjg.s-DNskTdhA0Gjg{width:100%;border-collapse:separate;border-spacing:0 2px}th.s-DNskTdhA0Gjg.s-DNskTdhA0Gjg{text-align:left;padding:10px 0px;font-variation-settings:'wght' 300;color:var(--dim)}th.s-DNskTdhA0Gjg.s-DNskTdhA0Gjg:first-child{padding-left:20px}td.s-DNskTdhA0Gjg.s-DNskTdhA0Gjg{background-color:var(--block);margin-bottom:2px}.name.s-DNskTdhA0Gjg a.s-DNskTdhA0Gjg{display:inline-block;width:100%;height:100%;padding:20px}.name.s-DNskTdhA0Gjg a.s-DNskTdhA0Gjg:first-letter{text-transform:uppercase}",
  map: null
};
const load$1 = async () => {
  return { props: { games: await getGames() } };
};
async function getGames() {
  const { data, error } = await supabase.from("games").select("*");
  console.log("games", data);
  return data;
}
const Games = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $user, $$unsubscribe_user;
  validate_store(user, "user");
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  let { games: games2 = [] } = $$props;
  if ($$props.games === void 0 && $$bindings.games && games2 !== void 0)
    $$bindings.games(games2);
  $$result.css.add(css$1);
  $$unsubscribe_user();
  return `${$$result.head += `<!-- HEAD_svelte-x01zt2_START -->${$$result.title = `<title>Andor: Hry - Textové hry na role, TTRPG online</title>`, ""}<!-- HEAD_svelte-x01zt2_END -->`, ""}

<div class="${"headline flex s-DNskTdhA0Gjg"}"><h1>Hry</h1>
  ${$user ? `<div><a href="${"/new-game"}" class="${"button"}">Vytvořit novou hru</a></div>` : ``}</div>

<table id="${"games"}" class="${"s-DNskTdhA0Gjg"}"><tr><th class="${"s-DNskTdhA0Gjg"}">název</th>
    <th class="${"s-DNskTdhA0Gjg"}">autor</th></tr>
  ${games2.length ? each(games2, (game) => {
    return `<tr class="${"game"}"><td class="${"s-DNskTdhA0Gjg"}"><div class="${"name s-DNskTdhA0Gjg"}"><a href="${"/game?id="}" class="${"s-DNskTdhA0Gjg"}">${escape(game.name)}</a></div></td>
      <td class="${"s-DNskTdhA0Gjg"}"><div class="${"author"}">${escape(game.author)}</div></td>
    </tr>`;
  }) : `Žádné hry nenalezeny`}
</table>`;
});
const games = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Games,
  load: load$1
}, Symbol.toStringTag, { value: "Module" }));
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-2ru6t6_START -->${$$result.title = `<title>Andor: Hlavní strana - Textové hry na role, TTRPG online</title>`, ""}<!-- HEAD_svelte-2ru6t6_END -->`, ""}

<h1>Novinky</h1>

Tady bude zeď s novinkami.`;
});
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Routes
}, Symbol.toStringTag, { value: "Module" }));
const ____404__svelte_svelte_type_style_lang = "";
const css = {
  code: "div.s-MPoA-r58M5vu.s-MPoA-r58M5vu{display:flex;align-items:center;flex-direction:column;text-align:center}div.four04.s-MPoA-r58M5vu>.s-MPoA-r58M5vu{margin-top:1em}ul.s-MPoA-r58M5vu.s-MPoA-r58M5vu{padding:0}ul.s-MPoA-r58M5vu li.s-MPoA-r58M5vu{opacity:75%;list-style-type:none;padding:0;margin:0}",
  map: null
};
const load = ({ route }) => ({
  status: 404,
  error: "[Routify] Page could not be found.",
  props: { url: route.url }
});
const U5B_404u5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { url: url2 } = $$props;
  if ($$props.url === void 0 && $$bindings.url && url2 !== void 0)
    $$bindings.url(url2);
  $$result.css.add(css);
  return `
<div class="${"four04 s-MPoA-r58M5vu"}"><h1 class="${"s-MPoA-r58M5vu"}">404 - Page Not Found</h1>
    <p class="${"s-MPoA-r58M5vu"}">The page <code>${escape(url2)}</code> could not be found. Please check the URL or go back to
        the <a href="${"/"}">homepage</a>.
    </p>
    ${`<div class="${"s-MPoA-r58M5vu"}"><h5>Dev note:</h5>
            <ul class="${"s-MPoA-r58M5vu"}"><li class="${"s-MPoA-r58M5vu"}">To customize this page, create a
                    <code>[...404].svelte</code> file in the root of your project.
                </li>
                <li class="${"s-MPoA-r58M5vu"}">You can copy this file from <code>.routify/components/[...404].svelte</code>.
                </li>
                <li class="${"s-MPoA-r58M5vu"}">Custom 404 files can be created at any level of your project. For
                    example, in <code>src/pages/blog/[...404].svelte</code>.
                </li></ul></div>`}
</div>`;
});
const ____404_ = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: U5B_404u5D,
  load
}, Symbol.toStringTag, { value: "Module" }));
export {
  render
};
