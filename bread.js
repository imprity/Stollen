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
var e_1, _a;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var st = require("./lib/");
var process = require("process");
var args = process.argv.slice(2);
if (args.length === 0 || args[0] === '-h') {
    console.log('parses the files passed to arguments and prints tree');
    console.log('');
    console.log('usage : file1.frt file2.frt file3.frt [--json, --dump]');
    console.log('');
    console.log('-h     : prints this message');
    console.log('--json : print as json');
    console.log('--dump : dump without formatting');
    process.exit(0);
}
var printMode = 'pretty';
{
    var lastArg = args[args.length - 1];
    if (lastArg === '--json') {
        printMode = 'json';
    }
    else if (lastArg === '--dump') {
        printMode = 'dump';
    }
}
var ItemWithoutPrent = /** @class */ (function () {
    function ItemWithoutPrent(item) {
        var e_2, _a;
        this.attributes = [];
        this.body = [];
        this.attributes = item.attributeList;
        try {
            for (var _b = __values(item.body), _c = _b.next(); !_c.done; _c = _b.next()) {
                var child = _c.value;
                if (typeof child === 'string') {
                    this.body.push(child);
                }
                else {
                    var cloneChild = new ItemWithoutPrent(child);
                    this.body.push(cloneChild);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    return ItemWithoutPrent;
}());
try {
    for (var args_1 = __values(args), args_1_1 = args_1.next(); !args_1_1.done; args_1_1 = args_1.next()) {
        var filePath = args_1_1.value;
        if (filePath.startsWith('-')) {
            continue;
        }
        try {
            var content = fs.readFileSync(filePath, 'utf-8');
            var _b = __read(st.parse(content, filePath, { errorInColor: Boolean(process.stdout.isTTY) }), 2), root = _b[0], errorMsg = _b[1];
            if (errorMsg) {
                console.error(errorMsg);
            }
            else {
                switch (printMode) {
                    case 'pretty':
                        {
                            console.log(st.prettyPrint(root, Boolean(process.stdout.isTTY)));
                        }
                        break;
                    case 'json':
                        {
                            var rootClone = new ItemWithoutPrent(root);
                            console.log(JSON.stringify(rootClone, null, 4));
                        }
                        break;
                    case 'dump':
                        {
                            console.log(st.dumpTree(root, Boolean(process.stdout.isTTY)));
                        }
                        break;
                }
            }
        }
        catch (err) {
            console.error('failed to open the file', filePath, err);
        }
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (args_1_1 && !args_1_1.done && (_a = args_1.return)) _a.call(args_1);
    }
    finally { if (e_1) throw e_1.error; }
}
//# sourceMappingURL=bread.js.map