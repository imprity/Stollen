import * as colors from 'colors/safe'

//////////////////////////////////
//Helper Functions
//////////////////////////////////

function last<T>(arr: T[]): T | null {
    if (arr.length === 0) {
        return null;
    }
    return arr[arr.length - 1]
}

function first<T>(arr: T[]): T | null {
    if (arr.length === 0) {
        return null;
    }
    return arr[0]
}

//////////////////////////////////
//Token Stuff
//////////////////////////////////

const ESCAPE_CHAR = '@'
type TokenTypes = '{|' | ":" | '}' | '[' | '[|' | '|]' | '"' | 'text' | 'unknown';

class DocLocation {
    srcPath: string
    column: number = 0;
    lineNumber: number = 0;
    cursor: number = 0;

    toString() : string{
        return `"${this.srcPath}:${this.lineNumber + 1}:${this.column + 1}"`
    }

    copy(): DocLocation {
        let copy = new DocLocation();
        copy.srcPath = this.srcPath;
        copy.column = this.column;
        copy.lineNumber = this.lineNumber;
        copy.cursor = this.cursor;
        return copy;
    }


}

class Token {
    static readonly LITERAL_TOKENS: TokenTypes[] = ['{|', ":", '}', '[', '[|', '|]', '"'].sort(
        (a, b) => { return b.length - a.length }
        // we need to sort them from longest to shortest
        // because we tokenizer might read [| and think it's a [ token when it should be [|
    ) as TokenTypes[];

    type: TokenTypes = 'unknown';
    text: string = '';
    pos: DocLocation;

    docLocation(): string {
        return this.pos.toString();
    }

    isWhiteSpace(): boolean {
        if (this.type !== 'text') {
            console.warn(colors.yellow(`Warning : asking token if it's white space when it's type is ${this.type}`))
            return false;
        }
        return this.text.match(/\S/) === null;
    }

    isLiteral(): boolean {
        return Token.LITERAL_TOKENS.indexOf(this.type) >= 0;
    }
}

function pushTextTokenToTokenArray(tokenArray: Token[], textToken: Token) {
    if (tokenArray.length <= 0 || last(tokenArray).type !== 'text') {
        tokenArray.push(textToken);
    }
    else {
        last(tokenArray).text += textToken.text;
    }
}

function pushTextToTokenArray(tokenArray: Token[], text: string, pos: DocLocation) {
    if (tokenArray.length <= 0 || last(tokenArray).type !== 'text') {

        let textToken = new Token();
        textToken.type = 'text';
        textToken.pos = pos.copy();
        textToken.text = text;

        tokenArray.push(textToken);
    }
    else {
        last(tokenArray).text += text;
    }
}

function tokenize(srcText: string, srcPath: string): Token[] {
    let tokens: Token[] = [];
    let currentPos: DocLocation = new DocLocation();

    currentPos.srcPath = srcPath;

    while (currentPos.cursor < srcText.length) {
        //first check escape characters
        let escapedToken = false;

        if (srcText.startsWith(ESCAPE_CHAR, currentPos.cursor)) {
            escapedToken = true;

            currentPos.cursor += ESCAPE_CHAR.length;
            currentPos.column += ESCAPE_CHAR.length;

            if (srcText.startsWith(ESCAPE_CHAR, currentPos.cursor)) {
                pushTextToTokenArray(tokens, ESCAPE_CHAR, currentPos);
                currentPos.cursor += ESCAPE_CHAR.length;
                currentPos.column += ESCAPE_CHAR.length;
            } else {
                for (const tokenStr of Token.LITERAL_TOKENS) {
                    if (srcText.startsWith(tokenStr, currentPos.cursor)) {
                        pushTextToTokenArray(tokens, tokenStr, currentPos);
                        currentPos.cursor += tokenStr.length;
                        currentPos.column += tokenStr.length;
                        break;
                    }
                }
            }
        }

        if (escapedToken) {
            continue;
        }

        //check if string starts with token literal
        let tokenLiteralFound = false;

        for (const tokenStr of Token.LITERAL_TOKENS) {
            if (srcText.startsWith(tokenStr, currentPos.cursor)) {
                let token = new Token();
                token.type = tokenStr;
                token.pos = currentPos.copy();

                tokens.push(token);

                currentPos.cursor += tokenStr.length;
                currentPos.column += tokenStr.length;

                tokenLiteralFound = true;
                break;
            }
        }

        if (tokenLiteralFound) {
            continue;
        }

        //everything else we just treat them as text
        let currentChar = srcText[currentPos.cursor];
        pushTextToTokenArray(tokens, currentChar, currentPos);
        currentPos.cursor++;

        if (currentChar === '\n') {
            currentPos.column = 0;
            currentPos.lineNumber++;
        } else {
            currentPos.column++
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
function checkMatchAndRefineTokens(tokens: Token[]): [Token[], string | null] {
    const newTokens = [];

    const openBodyStack: Token[] = [];
    let tokenCursor = 0;
    let insideBody = true;
    let insideQuote = false;

    let attributeOpenedAt: Token | null = null;
    let quoteOpenedAt: Token | null = null;

    while (tokenCursor < tokens.length) {
        let tokenNow = tokens[tokenCursor++];

        if (tokenNow.type === 'unknown') {
            return [newTokens, errorUnknowType(tokenNow)];
        }

        if (insideBody) {
            switch (tokenNow.type) {
                case 'text': {
                    pushTextTokenToTokenArray(newTokens, tokenNow);
                } break;
                case '{|': {
                    insideBody = false;
                    newTokens.push(tokenNow);
                    attributeOpenedAt = tokenNow;
                } break;
                case '[|': {
                    openBodyStack.push(tokenNow);
                    newTokens.push(tokenNow);
                } break;
                case '|]': {
                    if (openBodyStack.length <= 0) {
                        return [newTokens, errorUnexpectedType(tokenNow)];
                    }

                    let popped = openBodyStack.pop();
                    if (popped.type !== '[|' && popped.type !== '[') {
                        return [newTokens, errorUnclosed(popped)];
                    }

                    newTokens.push(tokenNow);
                } break;
                default: {
                    pushTextToTokenArray(newTokens, tokenNow.type, tokenNow.pos);
                } break;
            }
        } else { //inside attributes
            switch (tokenNow.type) {
                case 'text': {
                    pushTextTokenToTokenArray(newTokens, tokenNow);
                } break;
                case '"': {
                    if (!insideQuote) {
                        quoteOpenedAt = tokenNow;
                    }
                    insideQuote = !insideQuote;
                    newTokens.push(tokenNow);
                } break;
                case ':': {
                    newTokens.push(tokenNow);
                }break;
                case '}': {
                    if (insideQuote) {
                        pushTextToTokenArray(newTokens, tokenNow.type, tokenNow.pos)
                    } else {
                        newTokens.push(tokenNow);

                        let consumedTokenCount = 0;

                        let mismatchFail = false;
                        let suddenEndFail = false;

                        checkTypes(tokens, tokenCursor, ['['],
                            (expected, got, index) => { mismatchFail = true },
                            (expected, index) => { suddenEndFail = true; }
                        )

                        if (suddenEndFail) {
                            return [newTokens, errorSuddenEndAfterAttributeClose(tokenNow)]
                        }

                        if (!mismatchFail) {
                            newTokens.push(tokens[tokenCursor])
                            openBodyStack.push(tokens[tokenCursor])
                            consumedTokenCount = 1;
                        } else {
                            mismatchFail = false;
                            suddenEndFail = false;
                            let errorMsg = "";

                            checkTypes(tokens, tokenCursor, ['whitespace', '['],
                                (expected, got, index) => {
                                    mismatchFail = true;
                                    errorMsg = errorWrongType(got, expected);
                                },
                                (expected, index) => {
                                    suddenEndFail = true;
                                    errorMsg = errorSuddenEndAfterAttributeClose(tokenNow);
                                }
                            )

                            if (mismatchFail || suddenEndFail) {
                                return [tokens, errorMsg];
                            }

                            newTokens.push(tokens[tokenCursor + 1])
                            openBodyStack.push(tokens[tokenCursor + 1])
                            consumedTokenCount = 2;
                        }
                        tokenCursor += (consumedTokenCount);
                        insideBody = true;
                    }
                } break;
                default: {
                    pushTextToTokenArray(newTokens, tokenNow.type, tokenNow.pos);
                } break;
            }
        }
    }

    if (insideQuote && quoteOpenedAt !== null) {
        return [newTokens, errorUnclosed(quoteOpenedAt)]
    }

    if (!insideBody && attributeOpenedAt !== null) {
        return [newTokens, errorUnclosed(attributeOpenedAt)]
    }

    if (openBodyStack.length > 0) {
        return [newTokens, errorUnclosed(last(openBodyStack))]
    }

    return [newTokens, null];
}

//////////////////////////////////
//Item Stuff
//////////////////////////////////

class Item {
    attributeList: Array<string> = [];
    attributeMap: Map<String, String> = new Map<string, string>();

    body: Array<string | Item> = [];
    parent: Item | null = null;

    isRoot(): boolean {
        return this.parent === null;
    }
    appendTextToBody(text: string) {
        //if last element of body is not text or just empty, then append new string element
        if (this.body.length <= 0 || typeof (this.body[this.body.length - 1]) !== 'string') {
            this.body.push(text);
        }
        //else we appen text to existing element
        else {
            this.body[this.body.length - 1] += text;
        }
    }

    appendItemToBody(childItem: Item) {
        childItem.parent = this;
        this.body.push(childItem);
    }
}

function convertTokensToItems(tokens: Token[]): [Item, string | null] {
    const root = new Item();

    const objectStack: Item[] = [root];

    let tokenCursor = 0;
    let insideBody = true;

    let attributeTokens: Token[] = [];

    while (tokenCursor < tokens.length) {
        let tokenNow = tokens[tokenCursor++];
        let itemNow = last(objectStack);

        if (insideBody) {
            switch (tokenNow.type) {
                case 'text': {
                    itemNow.appendTextToBody(tokenNow.text);
                } break;
                case '{|': {
                    let newItem = new Item();

                    itemNow.appendItemToBody(newItem);
                    objectStack.push(newItem);

                    attributeTokens = [];
                    insideBody = false;
                } break;
                case '[|': {
                    let newItem = new Item();

                    itemNow.appendItemToBody(newItem);
                    objectStack.push(newItem);
                } break;
                case '|]': {
                    objectStack.pop();
                } break;
            }
        } else {
            if (tokenNow.type === '}') {
                //parse tokens inside attributes to item attributes
                let insideQuote = false;

                let words : string[]= [];

                let colonPositions : number[] = []; // where : is
                // say in words array we have "a b c" and : was between b and c "a b : c"
                // then we push colonPosition array position of b 1

                //for example "a : b c : d e"
                //colonPositions = [0, 2]

                for (let i = 0; i < attributeTokens.length; i++) {
                    let tokenInAttr = attributeTokens[i];

                    switch (tokenInAttr.type) {
                        case 'text': {
                            if (insideQuote) {
                                words.push(tokenInAttr.text);
                            } else {
                                words = words.concat(stringToWords(tokenInAttr.text));
                            }
                        }break;
                        case '"': {
                            insideQuote = !insideQuote;
                        }break;
                        case ':': {
                            if(i == 0){
                                return [root, errorMissingTextNextColon(tokenInAttr, true)];
                            }else if(i >= attributeTokens.length -1){
                                return [root, errorMissingTextNextColon(tokenInAttr, false)];
                            }

                            colonPositions.push(words.length - 1);
                        }break;
                    }
                }
                let wordIsAttribute : boolean[] = Array(words.length).fill(false);

                for(const pos of colonPositions){
                    wordIsAttribute[pos] = true;
                    wordIsAttribute[pos+1] = true;

                    let wordAtLeft : string = words[pos];
                    let wordAtRight : string = words[pos+1];
                    
                    itemNow.attributeMap.set(wordAtLeft, wordAtRight);
                }

                for(let i=0; i<words.length; i++){
                    if(!wordIsAttribute[i]){
                        itemNow.attributeList.push(words[i]);
                    }
                }

                attributeTokens = [];
                tokenCursor += 1; // after { here, ignore [ 
                insideBody = true; 
            } else {
                attributeTokens.push(tokenNow);
            }
        }
    }

    return [root, null];
}

function parse(srcText: string, srcPath: string,
    option:
        {
            errorInColor?: boolean,
            normalizeLineEnding?: boolean
        } =
        {
            errorInColor: true,
            normalizeLineEnding: false
        }
): [Item | null, string | null] {

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

    let root: Item | null = null;

    IN_COLOR = option.errorInColor;

    let tokens = tokenize(srcText, srcPath);
    let errorMsg: string | null = null;

    [tokens, errorMsg] = checkMatchAndRefineTokens(tokens)

    if (errorMsg) {
        return [root, errorMsg];
    }
    
    [root, errorMsg] = convertTokensToItems(tokens);

    if (errorMsg) {
        return [root, errorMsg];
    }

    removeIndentAndBar(root)
    removeNewLineAtBeginningAndEndOfBody(root);
    removeEmptyStringFromBody(root);

    return [root, errorMsg];
}

//////////////////////////////////
//Type Checking Functions
//////////////////////////////////

type TokenTypeOrWhiteSpace = TokenTypes | "whitespace"

function checkTypes(
    tokens: Token[],
    start: number,
    typeArr: TokenTypeOrWhiteSpace[],
    onTypeMisMatch: (expected: TokenTypeOrWhiteSpace, got: Token, index: number) => any = () => { },
    onSuddenEnd: (expected: TokenTypeOrWhiteSpace, index: number) => any = () => { }
): boolean {

    let expectedLength = typeArr.length;

    let i = 0;
    while (start < tokens.length && i < typeArr.length) {
        expectedLength--;

        let token = tokens[start++];
        let expectedType = typeArr[i++]

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

function stringToWords(str: string): Array<string> {
    let arr: Array<string> = [];
    for (const match of str.matchAll(/\S+/g)) {
        arr.push(match[0]);
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
function removeIndentAndBar(root: Item) {
    if (root.body.length <= 0) {
        return;
    }

    let gotIndentString = false;
    let indentString: string = "";

    for (let i = 0; i < root.body.length; i++) {
        const child = root.body[i];
        if (typeof child !== 'string') {
            removeIndentAndBar(child)
            continue;
        }
        if (!child.includes('\n')) {
            continue;
        }
        if (!gotIndentString) {
            let lines = child.split('\n')
            for (let j = 1; j < lines.length; j++) {
                const line = lines[j];

                if (line.match(/\S/) === null) { //line is just a white space
                    if (
                        j === (lines.length - 1) &&   //this is the last line
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

                        let carriageReturnIndex = line.indexOf('\r');

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
                    let re = /[\S\r]/ //carraige return or non whitespace
                    let match = re.exec(line);

                    indentString = line.slice(0, match.index);
                    gotIndentString = true;
                    break;
                }
            }
        }

        if (gotIndentString && indentString.length > 0) {
            let newString = "";

            let indentStringIndex = 0;
            let ignoringIndent = false;

            for (let j = 0; j < child.length; j++) {
                if (child[j] === '\n') {
                    ignoringIndent = true;
                    newString += child[j]
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
                } else {
                    newString += child[j]
                }
            }

            root.body[i] = newString;
        }
    }
}

function removeNewLineAtBeginningAndEndOfBody(root: Item) {
    //we will remove the new line at the 
    //[       ]
    // ^ and ^

    if (root.body.length <= 0) {
        return;
    }

    let first: () => any = () => root.body[0];
    let last: () => any = () => root.body[root.body.length - 1];

    //remove new line at the start
    if (typeof first() === 'string') {
        if (first().startsWith('\r\n')) {
            root.body[0] = first().slice(2)
        } else if (first().startsWith('\n')) {
            root.body[0] = first().slice(1)
        }
    }
    //remove new line at the end
    if (typeof last() === 'string') {
        if (last().endsWith('\r\n')) {
            root.body[root.body.length - 1] = last().slice(0, -2)
        } else if (last().endsWith('\n')) {
            root.body[root.body.length - 1] = last().slice(0, -1)
        }
    }

    //recurse down to children in the body
    for (const child of root.body) {
        if (typeof child === 'object') {
            removeNewLineAtBeginningAndEndOfBody(child)
        }
    }
}

function removeEmptyStringFromBody(item: Item) {
    item.body = item.body.filter((child) => {
        if (typeof child === "string" && child.length === 0) {
            return false;
        }
        return true;
    })

    for (const child of item.body) {
        if (typeof child !== 'string') {
            removeEmptyStringFromBody(child);
        }
    }
}

//////////////////////////////////
//Color Setting
//////////////////////////////////

let IN_COLOR = false;

function inRed(str: string): string {
    if (IN_COLOR) {
        return colors.red(str);
    } else {
        return str;
    }
}

function inGreen(str: string): string {
    if (IN_COLOR) {
        return colors.green(str);
    } else {
        return str;
    }
}

function inBlue(str: string): string {
    if (IN_COLOR) {
        return colors.blue(str);
    } else {
        return str;
    }
}

//////////////////////////////////
//Tree Printing Functions
//////////////////////////////////
function treeToPrettyText(root: Item, inColor: boolean = true, level = 0): string {
    IN_COLOR = inColor;

    const TAB = 4;

    let singleTab = '';

    for (let i = 0; i < TAB; i++) {
        singleTab += ' ';
    }

    let indent = '';

    for (let i = 0; i < level; i++) {
        indent += singleTab;
    }

    let toPrint = ''

    toPrint += indent + inBlue('[ {')

    for (let i = 0, l = root.attributeList.length; i < l; i++) {
        const attr = root.attributeList[i];
        toPrint += inGreen(`"${attr.replace(/\"/g, '\\"')}"`);
        if (i < l - 1) {
            toPrint += ', '
        }
    }

    toPrint += inBlue('}');

    if (root.body.length === 1 && typeof root.body[0] === 'string') {
        return toPrint += ' "' + root.body[0].replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n') + '"' + inBlue(']');
    }
    else {
        toPrint += '\n'

        for (const child of root.body) {
            if (typeof child === 'string') {
                toPrint += indent + singleTab + '"' + child.replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n') + '"' + '\n';
            }
            else {
                toPrint += treeToPrettyText(child, inColor, level + 1) + '\n';
            }
        }
    }


    return toPrint + indent + inBlue(']');
}

function treeToText(root: Item, inColor: boolean = false): string {
    IN_COLOR = inColor;

    let text = inBlue("{|");
    for (const attr of root.attributeList) {
        const attrStr = inGreen(`"${attr.replace(/"/g, '\\"')}"`);
        text += ` ${attrStr}`
    }
    text += ' ' + inBlue('}[')
    for (const child of root.body) {
        if (typeof child === 'string') {
            text += child;
        }
        else {
            text += treeToText(child, inColor);
        }
    }
    text += inBlue('|]');

    return text;
}

//////////////////////////////////
//Error Printing Functions
//////////////////////////////////

function errorUnexpectedType(token: Token): string {
    return inRed(`Error at ${token.docLocation()} : unexpected ${token.type}`);
}

function errorWrongType(token: Token, expectedTypes: TokenTypeOrWhiteSpace | TokenTypeOrWhiteSpace[]): string {
    let errorMsg = `Error at ${token.docLocation()} : expected `

    if (typeof expectedTypes === 'string') {
        expectedTypes = [expectedTypes];
    }

    for (let i = 0; i < expectedTypes.length; i++) {
        errorMsg += `${expectedTypes[i]} `
        if (i !== expectedTypes.length - 1) {
            errorMsg += 'or '
        }
    }

    errorMsg += `but got ${token.type}`

    return inRed(errorMsg);
}

function errorUnknowType(token: Token): string {
    return inRed(`Error at ${token.docLocation()} : weird token...`);
}

function errorUnclosed(openendAt: Token): string {
    return inRed(`Error : unclosed ${openendAt.type} at ${openendAt.docLocation()}`);
}

function errorSuddenEndAfterAttributeClose(attributeCloseToken: Token) {
    return inRed(`Error : text unexpectedly ended after } at ${attributeCloseToken.docLocation()}`);
}

function errorMissingTextNextColon(colonToken: Token, missingAtLeft: boolean) {
    let leftOrRight = missingAtLeft ? 'left' : 'right'
    return inRed(`Error : missing word at ${leftOrRight} for ':' at ${colonToken.docLocation()}`);
}

export { Item, parse, treeToPrettyText , treeToText }