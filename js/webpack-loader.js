// js/webpack-loader.js
// SeeSo SDK(seeso.js)를 런타임 로드하기 위한 최소 Webpack 호환 로더
export async function loadWebpackModule(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch module: ${url} (HTTP ${res.status})`);
    const code = await res.text();
    const __webpack_exports__ = {};
    function __webpack_require__(_moduleId) { return {}; }
    __webpack_require__.d = (exports, definition) => {
        for (const key in definition) {
            if (Object.prototype.hasOwnProperty.call(definition, key) &&
                !Object.prototype.hasOwnProperty.call(exports, key)) {
                Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
            }
        }
    };
    __webpack_require__.r = (exports) => {
        if (typeof Symbol !== 'undefined' && Symbol.toStringTag)
            Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
        Object.defineProperty(exports, '__esModule', { value: true });
    };
    __webpack_require__.n = (module) => {
        const getter = module && module.__esModule ? () => module.default : () => module;
        __webpack_require__.d(getter, { a: getter });
        return getter;
    };
    const fn = new Function('__webpack_exports__', '__webpack_require__', `${code}\nreturn __webpack_exports__;`);
    return fn(__webpack_exports__, __webpack_require__);
}
