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
var colors = require('colors');
var srcPath = './test.st';
var src = fs.readFileSync(srcPath, { encoding: 'utf-8' });
var ST_Token = /** @class */ (function () {
    function ST_Token() {
        this.type = 'unknown';
        this.text = '';
        this.column = 0;
        this.lineNumber = 0;
    }
    ST_Token.prototype.docLocation = function (srcPath) {
        return "\"".concat(srcPath, ":").concat(this.lineNumber + 1, ":").concat(this.column + 1, "\"");
    };
    ST_Token.prototype.isWhiteSpace = function () {
        if (this.type !== 'text') {
            console.warn("Warning : asking token if it's white space when it's type is ".concat(this.type));
            return false;
        }
        return this.text.match(/\S/) === null;
    };
    ST_Token.prototype.isLiteral = function () {
        return ST_Token.LITERAL_TOKENS.indexOf(this.type) >= 0;
    };
    ST_Token.LITERAL_TOKENS = ['!{', '}', '[', '!]', '~'];
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
    var foundLiteralToken = false;
    for (var i = 0; i < ST_Token.LITERAL_TOKENS.length; i++) {
        var lt = ST_Token.LITERAL_TOKENS[i];
        if (lexer.startsWith(lt)) {
            foundLiteralToken = true;
            token.type = ST_Token.LITERAL_TOKENS[i];
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
    ST_Object.prototype.isRoot = function () {
        return this.parent === null;
    };
    ST_Object.prototype.appendTextToBody = function (text) {
        //if last element of body is not text or just empty, then append new string element
        if (this.body.length <= 0 || typeof (this.body[this.body.length - 1]) !== 'string') {
            this.body.push(text);
        }
        //else we appen text to existing element
        else {
            this.body[this.body.length - 1] += text;
        }
    };
    return ST_Object;
}());
function textToAttributes(str) {
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
    var errorMsg = "Error at ".concat(token.docLocation(srcPath), " : expected ");
    for (var i = 0; i < possibleTypes.length; i++) {
        errorMsg += "".concat(possibleTypes[i], " ");
        if (i !== possibleTypes.length - 1) {
            errorMsg += 'or ';
        }
    }
    errorMsg += "but got ".concat(token.type);
    if (exitOnError) {
        console.error(colors.red(errorMsg));
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
            console.error(colors.red(errorMsg));
            process.exit(6969);
        }
        return errorMsg;
    }
    return null;
}
var Parser = /** @class */ (function () {
    function Parser() {
        this.tkCursor = 0;
        this.root = new ST_Object();
        this.objects = [this.root];
    }
    Parser.prototype.parse = function (tokens) {
        if (tokens.length <= 0) {
            return root;
        }
        while (this.tkCursor < tokens.length) {
            var parent_1 = this.objects[this.objects.length - 1];
            var lastToken = this.tkCursor >= 1 ? tokens[this.tkCursor - 1] : new ST_Token();
            var tokenNow = tokens[this.tkCursor++];
            switch (tokenNow.type) {
                case 'text':
                    {
                        parent_1.appendTextToBody(tokenNow.text);
                    }
                    break;
                case '!{':
                    {
                        if (lastToken.type === '~') {
                            parent_1.appendTextToBody(tokenNow.type);
                        }
                        else {
                            checkSeriesOfType(tokens, this.tkCursor, ['text', '}', '[']);
                            var object = new ST_Object();
                            object.attributes = textToAttributes(tokens[this.tkCursor++].text);
                            object.parent = parent_1;
                            parent_1.body.push(object);
                            this.objects.push(object);
                            this.tkCursor += 2;
                        }
                    }
                    break;
                case '!]':
                    {
                        if (lastToken.type === '~') {
                            parent_1.appendTextToBody(tokenNow.type);
                        }
                        else {
                            if (this.objects.length <= 1) {
                                console.error(colors.red("Error at ".concat(tokenNow.docLocation(srcPath), " : unexpected ").concat(tokenNow.type)));
                                process.exit(6969);
                            }
                            this.objects.pop();
                        }
                    }
                    break;
                case '[':
                case '}':
                case '~':
                    {
                        parent_1.appendTextToBody(tokenNow.type);
                    }
                    break;
                default: {
                    console.error(colors.red("Error at ".concat(tokenNow.docLocation(srcPath), " : unknown token type : ").concat(tokenNow.type)));
                    process.exit(6969);
                }
            }
        }
        if (this.objects.length > 1) {
            console.warn(colors.yellow("Warning : ".concat(this.objects.length - 1, " missing '!]'")));
        }
        return this.root;
    };
    return Parser;
}());
var parser = new Parser();
var root = parser.parse(lexer.tokens);
function dumpTree(object, level) {
    var e_3, _a, e_4, _b;
    if (level === void 0) { level = 0; }
    var indent = '';
    for (var i = 0; i < level * 4; i++) {
        indent += ' ';
    }
    var toPrint = indent;
    toPrint += colors.blue('{');
    try {
        for (var _c = __values(object.attributes), _d = _c.next(); !_d.done; _d = _c.next()) {
            var attr = _d.value;
            toPrint += colors.green("".concat(attr, ", "));
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_3) throw e_3.error; }
    }
    toPrint += colors.blue('}[') + '"';
    try {
        for (var _e = __values(object.body), _f = _e.next(); !_f.done; _f = _e.next()) {
            var child = _f.value;
            if (typeof (child) === 'string') {
                toPrint += child.replace(/\r\n/g, ' \\r\\n ').replace(/\n/g, ' \\n ');
            }
            else {
                console.log(toPrint + '"');
                toPrint = indent + '"';
                dumpTree(child, level + 1);
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
    console.log(toPrint + '"' + colors.blue(']'));
}
dumpTree(root);
///////////////////////////////////////
//render the object tree
///////////////////////////////////////
//it is not the library's role to render the object tree
//rather library user who decides how to use the object tree
//this is just a test to see how library functions
function render(root) {
    var e_5, _a;
    var rendered = "";
    if (root.isRoot()) {
        rendered += "<p><pre>\n";
    }
    else {
        switch (root.attributes[0]) {
            case 'div':
                {
                    rendered += '<div>\n';
                }
                break;
            case 'p':
                {
                    rendered += '<p>';
                }
                break;
            default: {
                rendered += '<p>';
            }
        }
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
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_5) throw e_5.error; }
    }
    if (root.isRoot()) {
        rendered += "</pre></p>";
    }
    else {
        switch (root.attributes[0]) {
            case 'div':
                {
                    rendered += '\n</div>\n';
                }
                break;
            case 'p':
                {
                    rendered += '</p>';
                }
                break;
            default: {
                rendered += '\n</p>';
            }
        }
    }
    return rendered;
}
fs.writeFileSync('./index.html', render(root));
