"use strict";
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var process = require("process");
var srcPath = './test.st';
var src = fs.readFileSync(srcPath, { encoding: 'utf-8' });
var ST_Token = /** @class */ (function () {
    function ST_Token() {
        this.type = 'unknown';
        this.text = '';
        this.column = 0;
        this.lineNumber = 0;
    }
    return ST_Token;
}());
var Lexer = /** @class */ (function () {
    function Lexer(src) {
        this.tokens = [];
        this.column = 0;
        this.lineNumber = 0;
        this.cursor = 0;
        this.srcLength = 0;
        this.src = src;
        this.srcLength = this.src.length;
    }
    Lexer.prototype.startsWith = function (text) {
        return src.startsWith(text, this.cursor);
    };
    Lexer.prototype.advance = function (textLength) {
        if (this.cursor >= this.srcLength) {
            return ["", true];
        }
        var text = this.src.slice(this.cursor, this.cursor + textLength);
        for (var i = 0; i < text.length; i++) {
            if (text[i] == '\n') {
                this.lineNumber++;
                this.column = 0;
            }
            else {
                this.column++;
            }
            this.cursor++;
        }
        return [text, this.cursor >= this.srcLength];
    };
    return Lexer;
}());
var lexer = new Lexer(src);
var reachedEnd = false;
while (!reachedEnd) {
    var token = new ST_Token();
    token.lineNumber = lexer.lineNumber;
    token.column = lexer.column;
    var literalTokens = ['!{', '}', '[', '!]'];
    var foundLiteralToken = false;
    for (var i = 0; i < literalTokens.length; i++) {
        var lt = literalTokens[i];
        if (lexer.startsWith(lt)) {
            foundLiteralToken = true;
            token.type = literalTokens[i];
            lexer.tokens.push(token);
            reachedEnd = lexer.advance(lt.length)[1];
            break;
        }
    }
    if (foundLiteralToken) {
        continue;
    }
    //it's a text
    var text = '';
    _a = __read(lexer.advance(1), 2), text = _a[0], reachedEnd = _a[1];
    if (lexer.tokens.length == 0 || lexer.tokens[lexer.tokens.length - 1].type !== 'text') {
        token.type = 'text';
        token.text = text;
        lexer.tokens.push(token);
        continue;
    }
    lexer.tokens[lexer.tokens.length - 1].text += text;
}
if (lexer.tokens.length <= 0) {
    console.log('no tokens');
    process.exit(0);
}
///////////////////////////////////////
//validate tokens and convert them to objects
///////////////////////////////////////
var ST_Object = /** @class */ (function () {
    function ST_Object() {
        this.attributes = [];
        this.body = [];
        this.parent = null;
    }
    return ST_Object;
}());
function lineToWords(str) {
    var e_1, _a;
    var arr = [];
    try {
        for (var _b = __values(str.matchAll(/\S+/g)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var match = _c.value;
            arr.push(match[0]);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return arr;
}
function checkType(token, possibleTypes, exitOnError) {
    var e_2, _a;
    if (exitOnError === void 0) { exitOnError = true; }
    if (typeof (possibleTypes) === 'string') {
        possibleTypes = [possibleTypes];
    }
    try {
        for (var possibleTypes_1 = __values(possibleTypes), possibleTypes_1_1 = possibleTypes_1.next(); !possibleTypes_1_1.done; possibleTypes_1_1 = possibleTypes_1.next()) {
            var type = possibleTypes_1_1.value;
            if (token.type === type) {
                return null;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (possibleTypes_1_1 && !possibleTypes_1_1.done && (_a = possibleTypes_1.return)) _a.call(possibleTypes_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var errorMsg = "Error at \"".concat(srcPath, ":").concat(token.lineNumber + 1, ":").concat(token.column + 1, "\" : expected ");
    for (var i = 0; i < possibleTypes.length; i++) {
        errorMsg += "".concat(possibleTypes[i], " ");
        if (i !== possibleTypes.length - 1) {
            errorMsg += 'or ';
        }
    }
    errorMsg += "but got ".concat(token.type);
    if (exitOnError) {
        console.error(errorMsg);
        process.exit(6969);
    }
    return errorMsg;
}
function checkSeriesOfType(tokens, start, typeArr, exitOnError) {
    if (exitOnError === void 0) { exitOnError = true; }
    var expectedLength = typeArr.length;
    var i = 0;
    while (start < tokens.length && i < typeArr.length) {
        expectedLength--;
        var token = tokens[start++];
        var errorMsg = checkType(token, typeArr[i++], exitOnError);
        if (errorMsg) {
            return errorMsg;
        }
    }
    //we lack tokens
    if (expectedLength > 0) {
        var errorMsg = 'Error : Unexpected End of File';
        if (exitOnError) {
            console.error(errorMsg);
            process.exit(6969);
        }
        return errorMsg;
    }
    return null;
}
var tokens = lexer.tokens.slice();
var tkCursor = 0;
var root = new ST_Object();
var objects = [root];
while (tkCursor < tokens.length) {
    var parent_1 = objects[objects.length - 1];
    var tokenNow = tokens[tkCursor++];
    switch (tokenNow.type) {
        case 'text':
            {
                if (parent_1.body.length <= 0 || typeof (parent_1.body[parent_1.body.length - 1]) !== 'string') {
                    parent_1.body.push(tokenNow.text);
                }
                else {
                    parent_1.body[parent_1.body.length - 1] += tokenNow.text;
                }
            }
            break;
        case '!{':
            {
                checkSeriesOfType(tokens, tkCursor, ['text', '}', '[']);
                var object = new ST_Object();
                object.attributes = lineToWords(tokens[tkCursor++].text);
                object.parent = parent_1;
                parent_1.body.push(object);
                objects.push(object);
                tkCursor += 2;
            }
            break;
        case '!]':
            {
                if (objects.length <= 1) {
                    console.log(objects);
                    console.error("Error at \"".concat(srcPath, ":").concat(tokenNow.lineNumber + 1, ":").concat(tokenNow.column + 1, "\" : unexpected ").concat(tokenNow.type));
                    process.exit(6969);
                }
                objects.pop();
            }
            break;
    }
}
if (objects.length > 1) {
    console.warn("Warning : ".concat(objects.length - 1, " missing '!]'"));
}
function dumpTree(object, level) {
    var e_3, _a, e_4, _b;
    if (level === void 0) { level = 0; }
    var indent = '';
    for (var i = 0; i < level; i++) {
        if (i % 4 == 0) {
            indent += '|';
        }
        indent += ' ';
    }
    indent += '|';
    var toPrint = indent;
    toPrint += '{';
    try {
        for (var _c = __values(object.attributes), _d = _c.next(); !_d.done; _d = _c.next()) {
            var attr = _d.value;
            toPrint += "".concat(attr, ",");
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_3) throw e_3.error; }
    }
    toPrint += '}[ ';
    try {
        for (var _e = __values(object.body), _f = _e.next(); !_f.done; _f = _e.next()) {
            var child = _f.value;
            if (typeof (child) === 'string') {
                toPrint += child.replace(/\r\n/g, ' \\r\\n ').replace(/\n/g, ' \\n ');
            }
            else {
                console.log(toPrint);
                toPrint = indent;
                dumpTree(child, level + 4);
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
        }
        finally { if (e_4) throw e_4.error; }
    }
    console.log(toPrint + ']');
}
dumpTree(root);
