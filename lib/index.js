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
Object.defineProperty(exports, "__esModule", { value: true });
exports.dumpTree = exports.prettyPrint = exports.Item = exports.Parser = exports.Tokenizer = exports.Token = void 0;
var colors = require("colors/safe");
var ESCAPE_CHAR = '@';
var TokenPosition = /** @class */ (function () {
    function TokenPosition() {
        this.column = 0;
        this.lineNumber = 0;
        this.cursor = 0;
    }
    TokenPosition.prototype.docLocation = function () {
        return "\"".concat(this.srcPath, ":").concat(this.lineNumber + 1, ":").concat(this.column + 1, "\"");
    };
    TokenPosition.prototype.copy = function () {
        var copy = new TokenPosition();
        copy.srcPath = this.srcPath;
        copy.column = this.column;
        copy.lineNumber = this.lineNumber;
        copy.cursor = this.cursor;
        return copy;
    };
    return TokenPosition;
}());
var Token = /** @class */ (function () {
    function Token() {
        this.type = 'unknown';
        this.text = '';
    }
    Token.prototype.docLocation = function () {
        return this.pos.docLocation();
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
    Token.LITERAL_TOKENS = ['!{', '}', '[', '!]', '"', '@'];
    return Token;
}());
exports.Token = Token;
var Tokenizer = /** @class */ (function () {
    function Tokenizer(srcText, srcPath) {
        this.srcLength = 0;
        this.tokens = [];
        this.src = srcText;
        this.srcPath = srcPath;
        this.srcLength = this.src.length;
    }
    Tokenizer.prototype.startsWith = function (text, pos) {
        return this.src.startsWith(text, pos.cursor);
    };
    Tokenizer.prototype.advance = function (textLength, pos) {
        var newTokenPos = pos.copy();
        if (pos.cursor >= this.srcLength) {
            return ["", newTokenPos, true];
        }
        var text = this.src.slice(pos.cursor, pos.cursor + textLength);
        for (var i = 0; i < text.length; i++) {
            if (text[i] == '\n') {
                newTokenPos.lineNumber++;
                newTokenPos.column = 0;
            }
            else {
                newTokenPos.column++;
            }
            newTokenPos.cursor++;
        }
        return [text, newTokenPos, newTokenPos.cursor >= this.srcLength];
    };
    Tokenizer.prototype.createToken = function (type, pos) {
        var token = new Token();
        token.pos = pos.copy();
        token.type = type;
        return token;
    };
    Tokenizer.prototype.pushText = function (text, pos) {
        if (this.tokens.length == 0 || this.tokens[this.tokens.length - 1].type !== 'text') {
            var token = this.createToken('text', pos);
            token.text = text;
            this.tokens.push(token);
        }
        else {
            this.tokens[this.tokens.length - 1].text += text;
        }
    };
    Tokenizer.prototype.tokenize = function () {
        var e_1, _a, _b;
        var reachedEnd = false;
        var currentPos = new TokenPosition();
        currentPos.srcPath = this.srcPath;
        while (!reachedEnd) {
            //first escape the escape character
            if (this.startsWith(ESCAPE_CHAR + ESCAPE_CHAR, currentPos)) {
                this.pushText(ESCAPE_CHAR, currentPos);
                //we are doing this way instead of using advance method
                //because we already know what is infront of cursor ahead of time
                currentPos.cursor += ESCAPE_CHAR.length;
                currentPos.column += ESCAPE_CHAR.length;
                continue;
            }
            var foundLiteralToken = false;
            try {
                //else check for literal tokens
                for (var _c = (e_1 = void 0, __values(Token.LITERAL_TOKENS)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var t = _d.value;
                    if (this.startsWith(t, currentPos)) {
                        this.tokens.push(this.createToken(t, currentPos));
                        //we are doing this way instead of using advance method
                        //because we already know what is infront of cursor ahead of time
                        currentPos.cursor += t.length;
                        currentPos.column += t.length;
                        foundLiteralToken = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (foundLiteralToken) {
                continue;
            }
            //everything else we will just treat them as texts
            var text = '';
            var newPos = void 0;
            _b = __read(this.advance(1, currentPos), 3), text = _b[0], newPos = _b[1], reachedEnd = _b[2];
            //this is here to prevent empty text being pushed in to the body
            //while that is relatively harmless but it does get in the way 
            //when we are trying to dump the tree
            if (reachedEnd && text.length <= 0) {
                continue;
            }
            this.pushText(text, currentPos);
            currentPos = newPos;
        }
        return this.tokens;
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
function stringToWords(str) {
    var e_2, _a;
    var arr = [];
    try {
        for (var _b = __values(str.matchAll(/\S+/g)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var match = _c.value;
            arr.push(match[0]);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return arr;
}
var Parser = /** @class */ (function () {
    function Parser(tokens) {
        this.tkCursor = 0;
        this.root = new Item();
        this.items = [this.root];
        this.printInColor = true;
        this.tokens = tokens;
    }
    Parser.prototype.inRed = function (str) {
        if (this.printInColor) {
            return colors.red(str);
        }
        else {
            return str;
        }
    };
    Parser.prototype.checkType = function (token, possibleTypes) {
        var e_3, _a;
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
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (possibleTypes_1_1 && !possibleTypes_1_1.done && (_a = possibleTypes_1.return)) _a.call(possibleTypes_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        var errorMsg = this.errorWrongType(token, possibleTypes);
        return errorMsg;
    };
    Parser.prototype.checkSeriesOfType = function (tokens, start, typeArr) {
        var expectedLength = typeArr.length;
        var i = 0;
        while (start < tokens.length && i < typeArr.length) {
            expectedLength--;
            var token = tokens[start++];
            var errorMsg = this.checkType(token, typeArr[i++]);
            if (errorMsg) {
                return errorMsg;
            }
        }
        //we lack tokens
        if (expectedLength > 0) {
            var errorMsg = this.errorSuddenEnd();
            return errorMsg;
        }
        return null;
    };
    Parser.prototype.errorUnexpectedType = function (token) {
        return this.inRed("Error at ".concat(token.docLocation(), " : unexpected ").concat(token.type));
    };
    Parser.prototype.errorWrongType = function (token, expectedTypes) {
        var errorMsg = "Error at ".concat(token.docLocation(), " : expecting ");
        if (typeof expectedTypes === 'string') {
            expectedTypes = [expectedTypes];
        }
        for (var i = 0; i < expectedTypes.length; i++) {
            errorMsg += "".concat(expectedTypes[i], " ");
            if (i !== expectedTypes.length - 1) {
                errorMsg += 'or ';
            }
        }
        errorMsg += "but got ".concat(token.type);
        return this.inRed(errorMsg);
    };
    Parser.prototype.errorSuddenEnd = function () {
        return this.inRed('Error : source unexpectedly ended');
    };
    Parser.prototype.errorUnknowType = function (token) {
        return this.inRed("Error at ".concat(token.docLocation(), " : weird token..."));
    };
    Parser.prototype.parse = function (errorInColor) {
        this.printInColor = errorInColor;
        if (this.tokens.length <= 0) {
            return [this.root, null];
        }
        var insideAttributes = false;
        var insideQuote = false;
        var attributeString = '';
        while (this.tkCursor < this.tokens.length) {
            var itemNow = this.items[this.items.length - 1];
            var tokenNow = this.tokens[this.tkCursor++];
            var nextToken = this.tkCursor >= this.tokens.length ? null : this.tokens[this.tkCursor];
            if (tokenNow.type === 'unknown') {
                return [this.root, this.errorUnknowType(tokenNow)];
            }
            if (insideAttributes) {
                if (nextToken === null) {
                    return [this.root, this.errorSuddenEnd()];
                }
                if (insideQuote) {
                    switch (tokenNow.type) {
                        case ESCAPE_CHAR:
                            {
                                if (nextToken.type === '"') {
                                    attributeString += nextToken.type;
                                    this.tkCursor++;
                                }
                                else {
                                    continue;
                                }
                            }
                            break;
                        case 'text':
                            {
                                attributeString += tokenNow.text;
                            }
                            break;
                        case '"':
                            {
                                itemNow.attributes.push(attributeString);
                                attributeString = '';
                                insideQuote = false;
                            }
                            break;
                        default: {
                            attributeString += tokenNow.type;
                        }
                    }
                }
                else {
                    switch (tokenNow.type) {
                        case ESCAPE_CHAR:
                            {
                                if (nextToken.type === '}' || nextToken.type === '"') {
                                    attributeString += nextToken.type;
                                    this.tkCursor++;
                                }
                                else {
                                    continue;
                                }
                            }
                            break;
                        case '}':
                            {
                                if (nextToken.type === '[') {
                                    this.tkCursor++;
                                }
                                else {
                                    this.checkSeriesOfType(this.tokens, this.tkCursor, ['text', '[']);
                                    if (!nextToken.isWhiteSpace()) {
                                        return [this.root, this.inRed("Error at ".concat(nextToken.docLocation(), " : ") +
                                                "there can be only whitespaces between } and [")];
                                    }
                                    this.tkCursor += 2;
                                }
                                insideAttributes = false;
                                itemNow.attributes = itemNow.attributes.concat(stringToWords(attributeString));
                                attributeString = '';
                            }
                            break;
                        case 'text':
                            {
                                attributeString += tokenNow.text;
                            }
                            break;
                        case '"':
                            {
                                itemNow.attributes = itemNow.attributes.concat(stringToWords(attributeString));
                                attributeString = '';
                                insideQuote = true;
                            }
                            break;
                        default:
                            {
                                attributeString += tokenNow.type;
                            }
                            break;
                    }
                }
            }
            else {
                switch (tokenNow.type) {
                    case ESCAPE_CHAR:
                        {
                            if (nextToken.type === '!{' || nextToken.type === '!]') {
                                itemNow.appendTextToBody(nextToken.type);
                                this.tkCursor++;
                            }
                            else {
                                continue;
                            }
                        }
                        break;
                    case '!{':
                        {
                            //add new item
                            var newItem = new Item();
                            this.items.push(newItem);
                            //and add them to current item's body
                            newItem.parent = itemNow;
                            itemNow.body.push(newItem);
                            //we are now inside items attributes
                            insideAttributes = true;
                            if (nextToken === null) {
                                return [this.root, this.errorSuddenEnd()];
                            }
                        }
                        break;
                    case '!]':
                        {
                            //pop the current item
                            //prevent popping root from item stack
                            //this happens when src text has mismatching '[' and '!]'
                            if (this.items.length <= 1) {
                                return [this.root, this.errorUnexpectedType(tokenNow)];
                            }
                            this.items.pop();
                        }
                        break;
                    case 'text':
                        {
                            itemNow.appendTextToBody(tokenNow.text);
                        }
                        break;
                    //rest of them have no meaning when they are not
                    //in attribute so just treat it as a plain text
                    default:
                        {
                            itemNow.appendTextToBody(tokenNow.type);
                        }
                        break;
                }
            }
        }
        return [this.root, null];
    };
    return Parser;
}());
exports.Parser = Parser;
function prettyPrint(item, inColor, level) {
    var e_4, _a;
    if (inColor === void 0) { inColor = true; }
    if (level === void 0) { level = 0; }
    var inGreen = colors.green;
    var inBlue = colors.blue;
    if (!inColor) {
        inGreen = function (str) { return str; };
        inBlue = function (str) { return str; };
    }
    var TAB = 4;
    var singleTab = '';
    for (var i = 0; i < TAB; i++) {
        singleTab += ' ';
    }
    var indent = '';
    for (var i = 0; i < level; i++) {
        indent += singleTab;
    }
    var toPrint = '';
    toPrint += indent + inBlue('[ {');
    for (var i = 0, l = item.attributes.length; i < l; i++) {
        var attr = item.attributes[i];
        toPrint += inGreen("\"".concat(attr.replace(/\"/g, '\\"'), "\""));
        if (i < l - 1) {
            toPrint += ', ';
        }
    }
    toPrint += inBlue('}');
    if (item.body.length === 1 && typeof item.body[0] === 'string') {
        return toPrint += ' "' + item.body[0].replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n') + '"' + inBlue(']');
    }
    else {
        toPrint += '\n';
        try {
            for (var _b = __values(item.body), _c = _b.next(); !_c.done; _c = _b.next()) {
                var child = _c.value;
                if (typeof child === 'string') {
                    toPrint += indent + singleTab + '"' + child.replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n') + '"' + '\n';
                }
                else {
                    toPrint += prettyPrint(child, inColor, level + 1) + '\n';
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
    }
    return toPrint + indent + inBlue(']');
}
exports.prettyPrint = prettyPrint;
function dumpTree(item) {
    var e_5, _a, e_6, _b;
    var text = "!{";
    try {
        for (var _c = __values(item.attributes), _d = _c.next(); !_d.done; _d = _c.next()) {
            var attr = _d.value;
            text += " ".concat(attr);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_5) throw e_5.error; }
    }
    text += ' }[';
    try {
        for (var _e = __values(item.body), _f = _e.next(); !_f.done; _f = _e.next()) {
            var child = _f.value;
            if (typeof child === 'string') {
                text += child;
            }
            else {
                text += dumpTree(child);
            }
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
        }
        finally { if (e_6) throw e_6.error; }
    }
    text += '!]';
    return text;
}
exports.dumpTree = dumpTree;
//# sourceMappingURL=index.js.map