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
exports.treeToJsonText = exports.treeToText = exports.treeToPrettyText = exports.parse = exports.Item = void 0;
var colors = require("colors/safe");
//////////////////////////////////
//Helper Functions
//////////////////////////////////
function last(arr) {
    if (arr.length === 0) {
        return null;
    }
    return arr[arr.length - 1];
}
function first(arr) {
    if (arr.length === 0) {
        return null;
    }
    return arr[0];
}
//////////////////////////////////
//Token Stuff
//////////////////////////////////
var ESCAPE_CHAR = '@';
var DocLocation = /** @class */ (function () {
    function DocLocation() {
        this.column = 0;
        this.lineNumber = 0;
        this.cursor = 0;
    }
    DocLocation.prototype.toString = function () {
        return "\"".concat(this.srcPath, ":").concat(this.lineNumber + 1, ":").concat(this.column + 1, "\"");
    };
    DocLocation.prototype.copy = function () {
        var copy = new DocLocation();
        copy.srcPath = this.srcPath;
        copy.column = this.column;
        copy.lineNumber = this.lineNumber;
        copy.cursor = this.cursor;
        return copy;
    };
    return DocLocation;
}());
var Token = /** @class */ (function () {
    function Token() {
        this.type = 'unknown';
        this.text = '';
    }
    Token.createToken = function (type, pos) {
        var token = new Token();
        token.type = type;
        token.pos = pos.copy();
        return token;
    };
    Token.createTextToken = function (pos, text) {
        var token = new Token();
        token.type = 'text';
        token.pos = pos.copy();
        token.text = text;
        return token;
    };
    Token.prototype.docLocation = function () {
        return this.pos.toString();
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
    Token.LITERAL_TOKENS = ['{|', ":", '}', '[', '[|', '|]', '"'].sort(function (a, b) { return b.length - a.length; }
    // we need to sort them from longest to shortest
    // because we tokenizer might read [| and think it's a [ token when it should be [|
    );
    return Token;
}());
function pushTextTokenToTokenArray(tokenArray, textToken) {
    if (tokenArray.length <= 0 || last(tokenArray).type !== 'text') {
        tokenArray.push(textToken);
    }
    else {
        last(tokenArray).text += textToken.text;
    }
}
function pushTextToTokenArray(tokenArray, text, pos) {
    if (text.length === 0) {
        return;
    }
    if (tokenArray.length <= 0 || last(tokenArray).type !== 'text') {
        tokenArray.push(Token.createTextToken(pos, text));
    }
    else {
        last(tokenArray).text += text;
    }
}
function consumeTextUntil(text, start, type) {
    var e_1, _a;
    if (typeof type === 'string') {
        type = [type];
    }
    var consumedText = "";
    var found = false;
    var foundType = null;
    var newPos = start.copy();
    while (newPos.cursor < text.length) {
        try {
            for (var type_1 = (e_1 = void 0, __values(type)), type_1_1 = type_1.next(); !type_1_1.done; type_1_1 = type_1.next()) {
                var t = type_1_1.value;
                if (text.startsWith(t, newPos.cursor)) {
                    found = true;
                    foundType = t;
                    break;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (type_1_1 && !type_1_1.done && (_a = type_1.return)) _a.call(type_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (found) {
            break;
        }
        var char = text[newPos.cursor];
        if (char === '\n') {
            newPos.column = 0;
            newPos.lineNumber++;
        }
        else {
            newPos.column++;
        }
        consumedText += char;
        newPos.cursor++;
    }
    return {
        consumedText: consumedText,
        foundType: foundType,
        newPos: newPos,
    };
}
function consumeWhiteSpace(text, start) {
    var consumedText = "";
    var newPos = start.copy();
    var re = /\S/;
    var match = re.exec(text.slice(start.cursor));
    if (match === null) {
        consumedText = text.slice(start.cursor);
    }
    else {
        consumedText = text.slice(start.cursor, match.index);
    }
    for (var i = 0; i < consumedText.length; i++) {
        var char = consumedText[i];
        if (char === '\n') {
            newPos.column = 0;
            newPos.lineNumber++;
        }
        else {
            newPos.column++;
        }
        newPos.cursor++;
    }
    return {
        consumedText: consumedText,
        newPos: newPos
    };
}
var TOKENIZER_STATES = [
    {
        toExtpect: ['@', '{|', '[|', '|]',],
        onToken: new Map([['@', 0], ['{|', 1], ['[|', 0], ['|]', 0]])
    },
    {
        toExtpect: ['@', ':', '"', '}'],
        onToken: new Map([['@', 1], [':', 1], ['"', 2], ['}', 3]])
    },
    {
        toExtpect: ['@', '"'],
        onToken: new Map([['@', 2], ['"', 1]])
    },
    {
        toExtpect: ['@', '['],
        onToken: new Map([['@', 3], ['[', 0]])
    }
];
function tokenize(srcText, srcPath) {
    var e_2, _a;
    var tokens = [];
    var currentPos = new DocLocation();
    currentPos.srcPath = srcPath;
    var state = TOKENIZER_STATES[0];
    var toExpect = state.toExtpect;
    while (currentPos.cursor < srcText.length) {
        var got = consumeTextUntil(srcText, currentPos, toExpect);
        pushTextToTokenArray(tokens, got.consumedText, currentPos);
        currentPos = got.newPos;
        if (got.foundType !== null) {
            if (got.foundType === '@') {
                //escape following token
                currentPos.cursor += ESCAPE_CHAR.length;
                currentPos.column += ESCAPE_CHAR.length;
                if (srcText.startsWith(ESCAPE_CHAR, currentPos.cursor)) {
                    pushTextToTokenArray(tokens, ESCAPE_CHAR, currentPos);
                    currentPos.cursor += ESCAPE_CHAR.length;
                    currentPos.column += ESCAPE_CHAR.length;
                }
                else {
                    try {
                        for (var _b = (e_2 = void 0, __values(Token.LITERAL_TOKENS)), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var tokenStr = _c.value;
                            if (srcText.startsWith(tokenStr, currentPos.cursor)) {
                                pushTextToTokenArray(tokens, tokenStr, currentPos);
                                currentPos.cursor += tokenStr.length;
                                currentPos.column += tokenStr.length;
                                break;
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
            }
            else {
                tokens.push(Token.createToken(got.foundType, currentPos));
                currentPos.cursor += got.foundType.length;
                currentPos.column += got.foundType.length;
                state = TOKENIZER_STATES[state.onToken.get(got.foundType)];
                toExpect = state.toExtpect;
            }
        }
    }
    return tokens;
}
/**
 * this function does many things (which is bad I know...)
 * 1. ensure body is properly opened and closed
 * 2. ensure attribute is properly opened and closed
 * 3. ensure quotes are properly opened and closed
 * 4. convert any tokens inside attribute and quotes to text token
 * 5. remove whitespace token between } and [
 *
 * @param tokens tokens to refine
 * @returns refined tokens and string if error
 */
function checkMatchAndRefineTokens(tokens) {
    var newTokens = [];
    var openBodyStack = [];
    var tokenCursor = 0;
    var insideBody = true;
    var insideQuote = false;
    var attributeOpenedAt = null;
    var quoteOpenedAt = null;
    var _loop_1 = function () {
        var tokenNow = tokens[tokenCursor++];
        if (tokenNow.type === 'unknown') {
            return { value: [newTokens, errorUnknowType(tokenNow)] };
        }
        if (insideBody) {
            switch (tokenNow.type) {
                case 'text':
                    {
                        pushTextTokenToTokenArray(newTokens, tokenNow);
                    }
                    break;
                case '{|':
                    {
                        insideBody = false;
                        newTokens.push(tokenNow);
                        attributeOpenedAt = tokenNow;
                    }
                    break;
                case '[|':
                    {
                        openBodyStack.push(tokenNow);
                        newTokens.push(tokenNow);
                    }
                    break;
                case '|]':
                    {
                        if (openBodyStack.length <= 0) {
                            return { value: [newTokens, errorUnexpectedType(tokenNow)] };
                        }
                        var popped = openBodyStack.pop();
                        if (popped.type !== '[|' && popped.type !== '[') {
                            return { value: [newTokens, errorUnclosed(popped)] };
                        }
                        newTokens.push(tokenNow);
                    }
                    break;
                default:
                    {
                        pushTextToTokenArray(newTokens, tokenNow.type, tokenNow.pos);
                    }
                    break;
            }
        }
        else { //inside attributes
            switch (tokenNow.type) {
                case 'text':
                    {
                        pushTextTokenToTokenArray(newTokens, tokenNow);
                    }
                    break;
                case '"':
                    {
                        if (!insideQuote) {
                            quoteOpenedAt = tokenNow;
                        }
                        insideQuote = !insideQuote;
                        newTokens.push(tokenNow);
                    }
                    break;
                case ':':
                    {
                        newTokens.push(tokenNow);
                    }
                    break;
                case '}':
                    {
                        if (insideQuote) {
                            pushTextToTokenArray(newTokens, tokenNow.type, tokenNow.pos);
                        }
                        else {
                            newTokens.push(tokenNow);
                            var consumedTokenCount = 0;
                            var mismatchFail_1 = false;
                            var suddenEndFail_1 = false;
                            checkTypes(tokens, tokenCursor, ['['], function (expected, got, index) { mismatchFail_1 = true; }, function (expected, index) { suddenEndFail_1 = true; });
                            if (suddenEndFail_1) {
                                return { value: [newTokens, errorSuddenEndAfterAttributeClose(tokenNow)] };
                            }
                            if (!mismatchFail_1) {
                                newTokens.push(tokens[tokenCursor]);
                                openBodyStack.push(tokens[tokenCursor]);
                                consumedTokenCount = 1;
                            }
                            else {
                                mismatchFail_1 = false;
                                suddenEndFail_1 = false;
                                var errorMsg_1 = "";
                                checkTypes(tokens, tokenCursor, ['whitespace', '['], function (expected, got, index) {
                                    mismatchFail_1 = true;
                                    errorMsg_1 = errorWrongType(got, expected);
                                }, function (expected, index) {
                                    suddenEndFail_1 = true;
                                    errorMsg_1 = errorSuddenEndAfterAttributeClose(tokenNow);
                                });
                                if (mismatchFail_1 || suddenEndFail_1) {
                                    return { value: [tokens, errorMsg_1] };
                                }
                                newTokens.push(tokens[tokenCursor + 1]);
                                openBodyStack.push(tokens[tokenCursor + 1]);
                                consumedTokenCount = 2;
                            }
                            tokenCursor += (consumedTokenCount);
                            insideBody = true;
                        }
                    }
                    break;
                default:
                    {
                        pushTextToTokenArray(newTokens, tokenNow.type, tokenNow.pos);
                    }
                    break;
            }
        }
    };
    while (tokenCursor < tokens.length) {
        var state_1 = _loop_1();
        if (typeof state_1 === "object")
            return state_1.value;
    }
    if (insideQuote && quoteOpenedAt !== null) {
        return [newTokens, errorUnclosed(quoteOpenedAt)];
    }
    if (!insideBody && attributeOpenedAt !== null) {
        return [newTokens, errorUnclosed(attributeOpenedAt)];
    }
    if (openBodyStack.length > 0) {
        return [newTokens, errorUnclosed(last(openBodyStack))];
    }
    return [newTokens, null];
}
//////////////////////////////////
//Item Stuff
//////////////////////////////////
var Item = /** @class */ (function () {
    function Item() {
        this.attributeList = [];
        this.attributeMap = new Map();
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
    Item.prototype.appendItemToBody = function (childItem) {
        childItem.parent = this;
        this.body.push(childItem);
    };
    return Item;
}());
exports.Item = Item;
function convertTokensToItems(tokens) {
    var root = new Item();
    var objectStack = [root];
    var tokenCursor = 0;
    var insideBody = true;
    var attributeTokens = [];
    while (tokenCursor < tokens.length) {
        var tokenNow = tokens[tokenCursor++];
        var itemNow = last(objectStack);
        if (insideBody) {
            switch (tokenNow.type) {
                case 'text':
                    {
                        itemNow.appendTextToBody(tokenNow.text);
                    }
                    break;
                case '{|':
                    {
                        var newItem = new Item();
                        itemNow.appendItemToBody(newItem);
                        objectStack.push(newItem);
                        attributeTokens = [];
                        insideBody = false;
                    }
                    break;
                case '[|':
                    {
                        var newItem = new Item();
                        itemNow.appendItemToBody(newItem);
                        objectStack.push(newItem);
                    }
                    break;
                case '|]':
                    {
                        objectStack.pop();
                    }
                    break;
            }
        }
        else {
            if (tokenNow.type === '}') {
                //parse tokens inside attributes to item attributes
                var insideQuote = false;
                var words = [];
                var colonPositions = []; // where : is
                // say in words array we have "a b c" and : was between b and c "a b : c"
                // then we push colonPosition array position of b 1
                //for example "a : b c : d e"
                //colonPositions = [0, 2]
                var colonTokens = [];
                for (var i = 0; i < attributeTokens.length; i++) {
                    var tokenInAttr = attributeTokens[i];
                    switch (tokenInAttr.type) {
                        case 'text':
                            {
                                if (insideQuote) {
                                    words.push(tokenInAttr.text);
                                }
                                else {
                                    words = words.concat(stringToWords(tokenInAttr.text));
                                }
                            }
                            break;
                        case '"':
                            {
                                insideQuote = !insideQuote;
                            }
                            break;
                        case ':':
                            {
                                colonPositions.push(words.length - 1);
                                colonTokens.push(tokenInAttr);
                            }
                            break;
                    }
                }
                var wordIsAttribute = Array(words.length).fill(false);
                //for (const pos of colonPositions) {
                for (var i = 0; i < colonPositions.length; i++) {
                    var pos = colonPositions[i];
                    var colonToken = colonTokens[i];
                    if (i >= 1 && (colonPositions[i - 1] + 1 === pos)) {
                        //this is for the cases like this a : b : c
                        return [root, errorMissingTextNextColon(colonToken, true)];
                    }
                    if (pos < 0) {
                        return [root, errorMissingTextNextColon(colonToken, true)];
                    }
                    else if (pos + 1 >= wordIsAttribute.length) {
                        return [root, errorMissingTextNextColon(colonToken, false)];
                    }
                    wordIsAttribute[pos] = true;
                    wordIsAttribute[pos + 1] = true;
                    var wordAtLeft = words[pos];
                    var wordAtRight = words[pos + 1];
                    itemNow.attributeMap.set(wordAtLeft, wordAtRight);
                }
                for (var i = 0; i < words.length; i++) {
                    if (!wordIsAttribute[i]) {
                        itemNow.attributeList.push(words[i]);
                    }
                }
                attributeTokens = [];
                tokenCursor += 1; // after { here, ignore [ 
                insideBody = true;
            }
            else {
                attributeTokens.push(tokenNow);
            }
        }
    }
    return [root, null];
}
function parse(srcText, srcPath, option) {
    var _a, _b;
    if (option === void 0) { option = {
        errorInColor: true,
        normalizeLineEnding: false
    }; }
    if (option.errorInColor === undefined ||
        option.errorInColor === null) {
        option.errorInColor = true;
    }
    if (option.normalizeLineEnding === undefined ||
        option.normalizeLineEnding === null) {
        option.normalizeLineEnding = false;
    }
    if (option.normalizeLineEnding) {
        srcText = srcText.replace(/\r\n/g, '\n');
    }
    var root = null;
    IN_COLOR = option.errorInColor;
    var tokens = tokenize(srcText, srcPath);
    var errorMsg = null;
    _a = __read(checkMatchAndRefineTokens(tokens), 2), tokens = _a[0], errorMsg = _a[1];
    if (errorMsg) {
        return [root, errorMsg];
    }
    _b = __read(convertTokensToItems(tokens), 2), root = _b[0], errorMsg = _b[1];
    if (errorMsg) {
        return [root, errorMsg];
    }
    removeIndentAndBar(root);
    removeNewLineAtBeginningAndEndOfBody(root);
    removeEmptyStringFromBody(root);
    return [root, errorMsg];
}
exports.parse = parse;
function checkTypes(tokens, start, typeArr, onTypeMisMatch, onSuddenEnd) {
    if (onTypeMisMatch === void 0) { onTypeMisMatch = function () { }; }
    if (onSuddenEnd === void 0) { onSuddenEnd = function () { }; }
    var expectedLength = typeArr.length;
    var i = 0;
    while (start < tokens.length && i < typeArr.length) {
        expectedLength--;
        var token = tokens[start++];
        var expectedType = typeArr[i++];
        if (expectedType === 'whitespace') {
            if (token.type !== 'text' || !token.isWhiteSpace()) {
                onTypeMisMatch(expectedType, token, i);
                return false;
            }
        }
        else if (expectedType !== token.type) {
            onTypeMisMatch(expectedType, token, i);
            return false;
        }
    }
    //we lack tokens
    if (expectedLength > 0) {
        onSuddenEnd(typeArr[i], i);
        return false;
    }
    return true;
}
function stringToWords(str) {
    var e_3, _a;
    var arr = [];
    try {
        for (var _b = __values(str.matchAll(/\S+/g)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var match = _c.value;
            arr.push(match[0]);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return arr;
}
/*
we are trying to guess how much indent
object has inside the body and remove them

we do this by getting how much indent the first line has
so for example
    {|div}[
        hello world!
    |]
has 4 spaces as indent inside the body

but what about this case
    {|div}[
    \n
        hello world\n
    |]
it would be counter intuitive to say that above example has no indentation
so we should ignore the lines that are just whitespaces

and we also have to account for the cases like this
    {|div}[
        {|h1}[title|]
            hello world\n
    |]
this div will start with the line that consists only of white spaces
so if just ignore the lines that only have whitespaces,
we will incorrectly guess the indent
*/
function removeIndentAndBar(root) {
    if (root.body.length <= 0) {
        return;
    }
    var gotIndentString = false;
    var indentString = "";
    for (var i = 0; i < root.body.length; i++) {
        var child = root.body[i];
        if (typeof child !== 'string') {
            removeIndentAndBar(child);
            continue;
        }
        if (!child.includes('\n')) {
            continue;
        }
        if (!gotIndentString) {
            var lines = child.split('\n');
            for (var j = 1; j < lines.length; j++) {
                var line = lines[j];
                if (line.match(/\S/) === null) { //line is just a white space
                    if (j === (lines.length - 1) && //this is the last line
                        root.body.length > i + 1 //we have a next item
                    ) {
                        //we assume that next item is not a string
                        //we will throw error if it's a string
                        //TODO : either change the logic to handle the case where
                        //next item is a string
                        //or merge consecutive texts before doing all of this
                        if (typeof root.body[i + 1] === 'string') {
                            throw new Error('Internal bug in stollen. Text should not be next to each other');
                        }
                        var carriageReturnIndex = line.indexOf('\r');
                        if (carriageReturnIndex >= 0) {
                            indentString = line.slice(0, carriageReturnIndex);
                        }
                        else {
                            indentString = line;
                        }
                        gotIndentString = true;
                        break;
                    }
                }
                else {
                    var re = /[\S\r]/; //carraige return or non whitespace
                    var match = re.exec(line);
                    indentString = line.slice(0, match.index);
                    gotIndentString = true;
                    break;
                }
            }
        }
        if (gotIndentString && indentString.length > 0) {
            var newString = "";
            var indentStringIndex = 0;
            var ignoringIndent = false;
            for (var j = 0; j < child.length; j++) {
                if (child[j] === '\n') {
                    ignoringIndent = true;
                    newString += child[j];
                    indentStringIndex = 0;
                    continue;
                }
                if (ignoringIndent) {
                    if (indentStringIndex >= indentString.length
                        || child[j] !== indentString[indentStringIndex++]) {
                        ignoringIndent = false;
                        //we are at the first character after indent
                        //if it starts with '|' we skip that
                        if (child[j] !== '|') {
                            newString += child[j];
                        }
                        indentStringIndex = 0;
                    }
                }
                else {
                    newString += child[j];
                }
            }
            root.body[i] = newString;
        }
    }
}
function removeNewLineAtBeginningAndEndOfBody(root) {
    //we will remove the new line at the 
    //[       ]
    // ^ and ^
    var e_4, _a;
    if (root.body.length <= 0) {
        return;
    }
    var first = function () { return root.body[0]; };
    var last = function () { return root.body[root.body.length - 1]; };
    //remove new line at the start
    if (typeof first() === 'string') {
        if (first().startsWith('\r\n')) {
            root.body[0] = first().slice(2);
        }
        else if (first().startsWith('\n')) {
            root.body[0] = first().slice(1);
        }
    }
    //remove new line at the end
    if (typeof last() === 'string') {
        if (last().endsWith('\r\n')) {
            root.body[root.body.length - 1] = last().slice(0, -2);
        }
        else if (last().endsWith('\n')) {
            root.body[root.body.length - 1] = last().slice(0, -1);
        }
    }
    try {
        //recurse down to children in the body
        for (var _b = __values(root.body), _c = _b.next(); !_c.done; _c = _b.next()) {
            var child = _c.value;
            if (typeof child === 'object') {
                removeNewLineAtBeginningAndEndOfBody(child);
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
function removeEmptyStringFromBody(item) {
    var e_5, _a;
    item.body = item.body.filter(function (child) {
        if (typeof child === "string" && child.length === 0) {
            return false;
        }
        return true;
    });
    try {
        for (var _b = __values(item.body), _c = _b.next(); !_c.done; _c = _b.next()) {
            var child = _c.value;
            if (typeof child !== 'string') {
                removeEmptyStringFromBody(child);
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
}
//////////////////////////////////
//Color Setting
//////////////////////////////////
var IN_COLOR = false;
function inRed(str) {
    if (IN_COLOR) {
        return colors.red(str);
    }
    else {
        return str;
    }
}
function inGreen(str) {
    if (IN_COLOR) {
        return colors.green(str);
    }
    else {
        return str;
    }
}
function inBlue(str) {
    if (IN_COLOR) {
        return colors.blue(str);
    }
    else {
        return str;
    }
}
//////////////////////////////////
//Tree Printing Functions
//////////////////////////////////
function treeToPrettyText(root, inColor, level) {
    var e_6, _a, e_7, _b;
    if (inColor === void 0) { inColor = true; }
    if (level === void 0) { level = 0; }
    IN_COLOR = inColor;
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
    for (var i = 0, l = root.attributeList.length; i < l; i++) {
        var attr = root.attributeList[i];
        toPrint += inGreen("\"".concat(attr.replace(/\"/g, '\\"'), "\""));
        if (i < l - 1) {
            toPrint += ', ';
        }
    }
    if (root.attributeMap.size > 0 && root.attributeList.length > 0) {
        toPrint += ', ';
    }
    {
        var i = 0;
        try {
            for (var _c = __values(root.attributeMap), _d = _c.next(); !_d.done; _d = _c.next()) {
                var _e = __read(_d.value, 2), key = _e[0], value = _e[1];
                toPrint += inGreen("\"".concat(key.replace(/\"/g, '\\"'), "\""));
                toPrint += ' : ';
                toPrint += inGreen("\"".concat(value.replace(/\"/g, '\\"'), "\""));
                if (i < root.attributeMap.size - 1) {
                    toPrint += ', ';
                }
                i++;
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_6) throw e_6.error; }
        }
    }
    toPrint += inBlue('}');
    if (root.body.length === 1 && typeof root.body[0] === 'string') {
        return toPrint += ' "' + root.body[0].replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n') + '"' + inBlue(']');
    }
    else {
        toPrint += '\n';
        try {
            for (var _f = __values(root.body), _g = _f.next(); !_g.done; _g = _f.next()) {
                var child = _g.value;
                if (typeof child === 'string') {
                    toPrint += indent + singleTab + '"' + child.replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n') + '"' + '\n';
                }
                else {
                    toPrint += treeToPrettyText(child, inColor, level + 1) + '\n';
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
            }
            finally { if (e_7) throw e_7.error; }
        }
    }
    return toPrint + indent + inBlue(']');
}
exports.treeToPrettyText = treeToPrettyText;
function treeToText(root, inColor) {
    var e_8, _a, e_9, _b, e_10, _c;
    if (inColor === void 0) { inColor = false; }
    IN_COLOR = inColor;
    var text = inBlue("{|");
    try {
        for (var _d = __values(root.attributeList), _e = _d.next(); !_e.done; _e = _d.next()) {
            var attr = _e.value;
            var attrStr = inGreen("\"".concat(attr.replace(/"/g, '\\"'), "\""));
            text += " ".concat(attrStr);
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
        }
        finally { if (e_8) throw e_8.error; }
    }
    try {
        for (var _f = __values(root.attributeMap), _g = _f.next(); !_g.done; _g = _f.next()) {
            var _h = __read(_g.value, 2), key = _h[0], value = _h[1];
            var keyStr = inGreen("\"".concat(key.replace(/"/g, '\\"'), "\""));
            var valueStr = inGreen("\"".concat(value.replace(/"/g, '\\"'), "\""));
            text += " ".concat(keyStr, " : ").concat(valueStr);
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
        }
        finally { if (e_9) throw e_9.error; }
    }
    text += ' ' + inBlue('}[');
    try {
        for (var _j = __values(root.body), _k = _j.next(); !_k.done; _k = _j.next()) {
            var child = _k.value;
            if (typeof child === 'string') {
                text += child;
            }
            else {
                text += treeToText(child, inColor);
            }
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
        }
        finally { if (e_10) throw e_10.error; }
    }
    text += inBlue('|]');
    return text;
}
exports.treeToText = treeToText;
function makeCloneForeJSONprinting(root) {
    var e_11, _a, e_12, _b;
    var copy = new Item();
    copy.attributeList = copy.attributeList.concat(root.attributeList);
    copy.attributeMap = {};
    try {
        for (var _c = __values(root.attributeMap), _d = _c.next(); !_d.done; _d = _c.next()) {
            var _e = __read(_d.value, 2), key = _e[0], value = _e[1];
            copy.attributeMap[key] = value;
        }
    }
    catch (e_11_1) { e_11 = { error: e_11_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_11) throw e_11.error; }
    }
    delete copy.parent;
    try {
        for (var _f = __values(root.body), _g = _f.next(); !_g.done; _g = _f.next()) {
            var child = _g.value;
            if (typeof child === 'string') {
                copy.body.push(child);
            }
            else {
                copy.body.push(makeCloneForeJSONprinting(child));
            }
        }
    }
    catch (e_12_1) { e_12 = { error: e_12_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
        }
        finally { if (e_12) throw e_12.error; }
    }
    return copy;
}
function treeToJsonText(root) {
    var clone = makeCloneForeJSONprinting(root);
    return JSON.stringify(clone, null, 4);
}
exports.treeToJsonText = treeToJsonText;
//////////////////////////////////
//Error Printing Functions
//////////////////////////////////
function errorUnexpectedType(token) {
    return inRed("Error at ".concat(token.docLocation(), " : unexpected ").concat(token.type));
}
function errorWrongType(token, expectedTypes) {
    var errorMsg = "Error at ".concat(token.docLocation(), " : expected ");
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
    return inRed(errorMsg);
}
function errorUnknowType(token) {
    return inRed("Error at ".concat(token.docLocation(), " : weird token..."));
}
function errorUnclosed(openendAt) {
    return inRed("Error : unclosed ".concat(openendAt.type, " at ").concat(openendAt.docLocation()));
}
function errorSuddenEndAfterAttributeClose(attributeCloseToken) {
    return inRed("Error : text unexpectedly ended after } at ".concat(attributeCloseToken.docLocation()));
}
function errorMissingTextNextColon(colonToken, missingAtLeft) {
    var leftOrRight = missingAtLeft ? 'left' : 'right';
    return inRed("Error : missing word at ".concat(leftOrRight, " for ':' at ").concat(colonToken.docLocation()));
}
//# sourceMappingURL=index.js.map