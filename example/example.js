"use strict";
/*
This is a simple example that demontrates how stollen can be used.

It compiles example.frt to index.html
*/
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
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
var st = require("../lib");
var path = require("path");
var process = require("process");
var srcPath = path.join(__dirname, './example.frt');
var content = fs.readFileSync(srcPath, 'utf-8');
var _a = __read(st.parse(content, srcPath, { errorInColor: Boolean(process.stdout.isTTY), normalizeLineEnding: true }), 2), root = _a[0], errorMsg = _a[1];
if (errorMsg) {
    console.error(errorMsg);
    process.exit(6969);
}
function getTextsFromBody(item) {
    var e_1, _a;
    var text = '';
    try {
        for (var _b = __values(item.body), _c = _b.next(); !_c.done; _c = _b.next()) {
            var child = _c.value;
            if (typeof child === 'string') {
                text += child;
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
    return text;
}
function renderHtml(item) {
    var e_2, _a, e_3, _b;
    var render = "";
    var inlineTypes = ['a', 'i'];
    var opened = false;
    if (item.isRoot()) {
        render +=
            "<html>\n" +
                "<head>\n" +
                "<style> pre  {white-space : pre-wrap}</style>\n" +
                "</head>\n" +
                "<body>";
        try {
            for (var _c = __values(item.body), _d = _c.next(); !_d.done; _d = _c.next()) {
                var child = _d.value;
                if (typeof child === 'string') {
                    if (!opened) {
                        render += '<pre>';
                        opened = true;
                        render += "".concat(child.trimStart());
                    }
                    else {
                        render += "".concat(child);
                    }
                }
                else {
                    if (child.attributeList.length <= 0) {
                        console.error('Element with 0 attribtues that is not root!');
                        process.exit(6969);
                    }
                    else {
                        var elementType = child.attributeList[0];
                        if (inlineTypes.includes(elementType)) { //check if child is inline element
                            render += renderHtml(child);
                        }
                        else {
                            if (opened) {
                                render = render.trimEnd();
                                render += '</pre>';
                                opened = false;
                            }
                            render += "\n".concat(renderHtml(child), "\n");
                        }
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_2) throw e_2.error; }
        }
        if (opened) {
            render += '</pre>';
        }
        render += "\n" +
            "</body>\n" +
            "</html>";
    }
    else {
        if (item.attributeList.length <= 0) {
            console.error('Element with 0 attribtues that is not root!');
            process.exit(6969);
        }
        else {
            var elementType = item.attributeList[0];
            switch (elementType) {
                case 'a':
                    {
                        if (item.attributeList.length >= 2) {
                            render += "<a href=\"".concat(item.attributeList[1], "\">");
                        }
                        else {
                            render += "<a href=\"\">";
                        }
                        render += getTextsFromBody(item);
                        render += '</a>';
                    }
                    break;
                case 'ul':
                case 'ol':
                    {
                        render += "<".concat(item.attributeList[0], ">\n");
                        try {
                            for (var _e = __values(item.body), _f = _e.next(); !_f.done; _f = _e.next()) {
                                var child = _f.value;
                                if (typeof child !== 'string' &&
                                    child.attributeList.length > 0 &&
                                    child.attributeList[0] == 'li') {
                                    render += "<li>".concat(getTextsFromBody(child), "</li>\n");
                                }
                            }
                        }
                        catch (e_3_1) { e_3 = { error: e_3_1 }; }
                        finally {
                            try {
                                if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                            }
                            finally { if (e_3) throw e_3.error; }
                        }
                        render += "</".concat(item.attributeList[0], ">\n");
                    }
                    break;
                case 'code':
                    {
                        render += '<pre><code>';
                        render += getTextsFromBody(item);
                        render += '</code></pre>';
                    }
                    break;
                default:
                    {
                        render += "<".concat(item.attributeList[0], ">");
                        render += getTextsFromBody(item);
                        render += "</".concat(item.attributeList[0], ">");
                    }
                    break;
            }
        }
    }
    return render;
}
fs.writeFileSync(path.join(__dirname, './index.html'), renderHtml(root), 'utf-8');
//# sourceMappingURL=example.js.map