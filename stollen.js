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
Object.defineProperty(exports, "__esModule", { value: true });
exports.dumpTree = exports.Item = exports.Parser = exports.Tokenizer = exports.Token = void 0;
var process = require("process");
var colors = require('colors');
var Token = /** @class */ (function () {
    function Token() {
        this.type = 'unknown';
        this.text = '';
        this.column = 0;
        this.lineNumber = 0;
        this.srcPath = '';
    }
    Token.prototype.docLocation = function () {
        return "\"".concat(this.srcPath, ":").concat(this.lineNumber + 1, ":").concat(this.column + 1, "\"");
    };
    Token.prototype.isWhiteSpace = function () {
        if (this.type !== 'text') {
            console.warn(colors.yellow("Warning : asking token if it's white space when it's type is ".concat(this.type)));
            return false;
        }
        return this.text.match(/\S/) === null;
    };
    Token.prototype.isLiteral = function () {
        return Token.LITERAL_TOKENS.indexOf(this.type) >= 0;
    };
    Token.LITERAL_TOKENS = ['!{', '}', '[', '!]', '~'];
    return Token;
}());
exports.Token = Token;
var Tokenizer = /** @class */ (function () {
    function Tokenizer(srcText, srcPath) {
        this.column = 0;
        this.lineNumber = 0;
        this.cursor = 0;
        this.srcLength = 0;
        this.src = srcText;
        this.srcPath = srcPath;
        this.srcLength = this.src.length;
    }
    Tokenizer.prototype.startsWith = function (text) {
        return this.src.startsWith(text, this.cursor);
    };
    Tokenizer.prototype.advance = function (textLength) {
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
    Tokenizer.prototype.tokenize = function () {
        var _a;
        var tokens = [];
        var reachedEnd = false;
        while (!reachedEnd) {
            var token = new Token();
            token.srcPath = this.srcPath;
            token.lineNumber = this.lineNumber;
            token.column = this.column;
            var foundLiteralToken = false;
            for (var i = 0; i < Token.LITERAL_TOKENS.length; i++) {
                var lt = Token.LITERAL_TOKENS[i];
                if (this.startsWith(lt)) {
                    foundLiteralToken = true;
                    token.type = Token.LITERAL_TOKENS[i];
                    tokens.push(token);
                    reachedEnd = this.advance(lt.length)[1];
                    break;
                }
            }
            if (foundLiteralToken) {
                continue;
            }
            //it's a text
            var text = '';
            _a = __read(this.advance(1), 2), text = _a[0], reachedEnd = _a[1];
            if (tokens.length == 0 || tokens[tokens.length - 1].type !== 'text') {
                token.type = 'text';
                token.text = text;
                tokens.push(token);
                continue;
            }
            tokens[tokens.length - 1].text += text;
        }
        return tokens;
    };
    return Tokenizer;
}());
exports.Tokenizer = Tokenizer;
var Item = /** @class */ (function () {
    function Item() {
        this.attributes = [];
        this.body = [];
        this.parent = null;
    }
    Item.prototype.isRoot = function () {
        return this.parent === null;
    };
    Item.prototype.appendTextToBody = function (text) {
        //if last element of body is not text or just empty, then append new string element
        if (this.body.length <= 0 || typeof (this.body[this.body.length - 1]) !== 'string') {
            this.body.push(text);
        }
        //else we appen text to existing element
        else {
            this.body[this.body.length - 1] += text;
        }
    };
    return Item;
}());
exports.Item = Item;
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
    var errorMsg = "Error at ".concat(token.docLocation(), " : expected ");
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
        this.root = new Item();
        this.items = [this.root];
    }
    Parser.prototype.parse = function (tokens) {
        if (tokens.length <= 0) {
            return this.root;
        }
        while (this.tkCursor < tokens.length) {
            var parent_1 = this.items[this.items.length - 1];
            var lastToken = this.tkCursor >= 1 ? tokens[this.tkCursor - 1] : new Token();
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
                            var amountToAdvance = 0;
                            var errorMsg = checkSeriesOfType(tokens, this.tkCursor, ['text', '}', '['], false);
                            if (errorMsg) {
                                checkSeriesOfType(tokens, this.tkCursor, ['text', '}', 'text', '['], true);
                                var textBetweenBraces = tokens[this.tkCursor + 2];
                                if (!textBetweenBraces.isWhiteSpace()) {
                                    console.error(colors.red("Error at ".concat(textBetweenBraces.docLocation(), " : there can be only white spaces between } and [")));
                                    process.exit(6969);
                                }
                                amountToAdvance = 4;
                            }
                            else {
                                amountToAdvance = 3;
                            }
                            var item = new Item();
                            item.attributes = textToAttributes(tokens[this.tkCursor].text);
                            item.parent = parent_1;
                            parent_1.body.push(item);
                            this.items.push(item);
                            this.tkCursor += amountToAdvance;
                        }
                    }
                    break;
                case '!]':
                    {
                        if (lastToken.type === '~') {
                            parent_1.appendTextToBody(tokenNow.type);
                        }
                        else {
                            if (this.items.length <= 1) {
                                console.error(colors.red("Error at ".concat(tokenNow.docLocation(), " : unexpected ").concat(tokenNow.type)));
                                process.exit(6969);
                            }
                            this.items.pop();
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
                    console.error(colors.red("Error at ".concat(tokenNow.docLocation(), " : unknown token type : ").concat(tokenNow.type)));
                    process.exit(6969);
                }
            }
        }
        if (this.items.length > 1) {
            console.warn(colors.yellow("Warning : ".concat(this.items.length - 1, " missing '!]'")));
        }
        return this.root;
    };
    return Parser;
}());
exports.Parser = Parser;
function dumpTree(item, level) {
    var e_3, _a;
    if (level === void 0) { level = 0; }
    var indent = '';
    for (var i = 0; i < level * 4; i++) {
        indent += ' ';
    }
    var toPrint = indent;
    toPrint += colors.blue('{');
    //for(const attr of object.attributes){
    for (var i = 0, l = item.attributes.length; i < l; i++) {
        var attr = item.attributes[i];
        toPrint += colors.green("".concat(attr));
        if (i < l - 1) {
            toPrint += colors.green(', ');
        }
    }
    toPrint += colors.blue('}[') + '"';
    try {
        for (var _b = __values(item.body), _c = _b.next(); !_c.done; _c = _b.next()) {
            var child = _c.value;
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
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    console.log(toPrint + '"' + colors.blue(']'));
}
exports.dumpTree = dumpTree;
