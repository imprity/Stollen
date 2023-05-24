"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var st = require("./stollen");
var srcPath = './test.st';
var src = fs.readFileSync(srcPath, { encoding: 'utf-8' });
var tokenizer = new st.Tokenizer(src, srcPath);
var tokens = tokenizer.tokenize();
//console.log('----------------')
//console.log(tokens);
//console.log('----------------')
var parser = new st.Parser(tokens);
var root = parser.parse();
console.log(st.dumpTree(root));
///////////////////////////////////////
//render the object tree
///////////////////////////////////////
//it is not the library's role to render the object tree
//rather library user who decides how to use the object tree
//this is just a test to see how library functions
function render(root) {
    var e_1, _a;
    var rendered = "";
    if (root.isRoot()) {
        rendered += "<p>\n";
    }
    else {
        rendered += "<".concat(root.attributes[0], ">");
    }
    try {
        for (var _b = __values(root.body), _c = _b.next(); !_c.done; _c = _b.next()) {
            var child = _c.value;
            if (typeof child === 'string') {
                rendered += child;
            }
            else {
                rendered += render(child);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (root.isRoot()) {
        rendered += "\n</p>";
    }
    else {
        rendered += "</".concat(root.attributes[0], ">");
    }
    return rendered;
}
fs.writeFileSync('./index.html', render(root));
