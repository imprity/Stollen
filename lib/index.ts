import * as colors from 'colors/safe'

const ESCAPE_CHAR = '@'
type TokenTypes = '!{' | '}' | '[' | '!]' | '"' | typeof ESCAPE_CHAR | 'text' | 'unknown';

class TokenPosition {
    srcPath: string
    column: number = 0;
    lineNumber: number = 0;
    cursor: number = 0;

    docLocation(): string {
        return `"${this.srcPath}:${this.lineNumber + 1}:${this.column + 1}"`
    }

    copy(): TokenPosition {
        let copy = new TokenPosition();
        copy.srcPath = this.srcPath;
        copy.column = this.column;
        copy.lineNumber = this.lineNumber;
        copy.cursor = this.cursor;
        return copy;
    }
}

class Token {
    static readonly LITERAL_TOKENS: TokenTypes[] = ['!{', '}', '[', '!]', '"', '@'];
    type: TokenTypes = 'unknown';
    text: string = '';
    pos: TokenPosition;

    docLocation(): string {
        return this.pos.docLocation();
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

class Tokenizer {
    src: string;
    srcPath: string
    srcLength: number = 0;
    tokens: Token[] = [];

    static readonly

    constructor(srcText: string, srcPath: string) {
        this.src = srcText;
        this.srcPath = srcPath;
        this.srcLength = this.src.length;
    }

    startsWith(text: string, pos: TokenPosition): boolean {
        return this.src.startsWith(text, pos.cursor);
    }

    advance(textLength: number, pos: TokenPosition): [string, TokenPosition, boolean] {
        let newTokenPos: TokenPosition = pos.copy();

        if (pos.cursor >= this.srcLength) {
            return ["", newTokenPos, true];
        }
        let text = this.src.slice(pos.cursor, pos.cursor + textLength);
        for (let i = 0; i < text.length; i++) {
            if (text[i] == '\n') {
                newTokenPos.lineNumber++;
                newTokenPos.column = 0;
            }
            else {
                newTokenPos.column++;
            }
            newTokenPos.cursor++;
        }
        return [text, newTokenPos, newTokenPos.cursor >= this.srcLength]
    }

    createToken(type: TokenTypes, pos: TokenPosition) {
        let token = new Token();
        token.pos = pos.copy();
        token.type = type;

        return token;
    }

    pushText(text: string, pos: TokenPosition) {
        if (this.tokens.length == 0 || this.tokens[this.tokens.length - 1].type !== 'text') {
            let token = this.createToken('text', pos);
            token.text = text;

            this.tokens.push(token);
        }
        else {
            this.tokens[this.tokens.length - 1].text += text;
        }
    }

    tokenize(): Token[] {
        let reachedEnd = false;

        let currentPos = new TokenPosition();
        currentPos.srcPath = this.srcPath

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

            let foundLiteralToken = false;
            //else check for literal tokens
            for (const t of Token.LITERAL_TOKENS) {
                if (this.startsWith(t, currentPos)) {
                    this.tokens.push(this.createToken(t, currentPos))

                    //we are doing this way instead of using advance method
                    //because we already know what is infront of cursor ahead of time
                    currentPos.cursor += t.length;
                    currentPos.column += t.length;

                    foundLiteralToken = true;
                }
            }
            if (foundLiteralToken) {
                continue;
            }

            //everything else we will just treat them as texts
            let text = '';
            let newPos: TokenPosition;
            [text, newPos, reachedEnd] = this.advance(1, currentPos);


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
    }
}

class Item {
    attributes: Array<string> = [];
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
}

function stringToWords(str: string): Array<string> {
    let arr: Array<string> = [];
    for (const match of str.matchAll(/\S+/g)) {
        arr.push(match[0]);
    }
    return arr;
}

type TokenTypeOrWhiteSpace = TokenTypes | "whitespace"

class Parser {
    tkCursor = 0;
    root = new Item();
    items: Array<Item> = [this.root];
    tokens: Token[];

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    printInColor :boolean = true;

    inRed(str) : string{
        if(this.printInColor){
            return colors.red(str);
        }
        else{
            return str;
        }
    }

    checkType(
        token: Token,
        possibleTypes: TokenTypeOrWhiteSpace[] | TokenTypeOrWhiteSpace,
        ): string | null {
        if (typeof (possibleTypes) === 'string') {
            possibleTypes = [possibleTypes];
        }

        for (const type of possibleTypes) {
            if(type === 'whitespace' && token.isWhiteSpace()){
                return null;
            }
            else if (token.type === type) {
                return null;
            }
        }
        let errorMsg = this.errorWrongType(token, possibleTypes);

        return errorMsg;
    }

    checkSeriesOfType(
        tokens: Token[],
        start: number,
        typeArr: (TokenTypeOrWhiteSpace[] | TokenTypeOrWhiteSpace)[]): string | null {

        let expectedLength = typeArr.length;

        let i = 0;
        while (start < tokens.length && i < typeArr.length) {
            expectedLength--;

            let token = tokens[start++];

            let errorMsg = this.checkType(token, typeArr[i++]);

            if (errorMsg) {
                return errorMsg;
            }
        }
        //we lack tokens
        if (expectedLength > 0) {
            let errorMsg = this.errorSuddenEnd();
            return errorMsg;
        }

        return null;
    }

    errorUnexpectedType(token: Token): string {
        return this.inRed(`Error at ${token.docLocation()} : unexpected ${token.type}`);
    }
    errorWrongType(token: Token, expectedTypes: TokenTypeOrWhiteSpace | TokenTypeOrWhiteSpace[]): string {
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

        return this.inRed(errorMsg);
    }
    errorSuddenEnd(): string {
        return this.inRed('Error : source unexpectedly ended')
    }
    errorUnknowType(token: Token): string {
        return this.inRed(`Error at ${token.docLocation()} : weird token...`);
    }

    parse(errorInColor : boolean): [Item , string | null] {

        this.printInColor = errorInColor;

        if (this.tokens.length <= 0) {
            return [this.root, null];
        }

        let insideAttributes = false;
        let insideQuote = false;
        let attributeString: string = '';

        while (this.tkCursor < this.tokens.length) {
            let itemNow = this.items[this.items.length - 1];
            let tokenNow = this.tokens[this.tkCursor++];

            let nextToken: null | Token = this.tkCursor >= this.tokens.length ? null : this.tokens[this.tkCursor];

            if (tokenNow.type === 'unknown') {
                return [this.root, this.errorUnknowType(tokenNow)]
            }

            if (insideAttributes) {
                if (nextToken === null) {
                    return [this.root, this.errorSuddenEnd()]
                }

                if (insideQuote) {
                    switch (tokenNow.type) {
                        case ESCAPE_CHAR: {
                            if (nextToken.type === '"') {
                                attributeString += nextToken.type;
                                this.tkCursor++;
                            } else {
                                continue;
                            }
                        } break;
                        case 'text': {
                            attributeString += tokenNow.text;
                        } break;
                        case '"': {
                            itemNow.attributes.push(attributeString);
                            attributeString = '';
                            insideQuote = false;
                        } break;
                        default: {
                            attributeString += tokenNow.type;
                        }
                    }
                } else {
                    switch (tokenNow.type) {
                        case ESCAPE_CHAR: {
                            if (nextToken.type === '}' || nextToken.type === '"') {
                                attributeString += nextToken.type;
                                this.tkCursor++;
                            } else {
                                continue;
                            }
                        } break;
                        case '}': {
                            if (nextToken.type === '[') {
                                this.tkCursor++;
                            } else {
                                let errorMsg = this.checkSeriesOfType(this.tokens, this.tkCursor, ['whitespace', '['])
                                if (errorMsg) {
                                    return [this.root, errorMsg]
                                }
                                this.tkCursor += 2;
                            }

                            insideAttributes = false;

                            itemNow.attributes = itemNow.attributes.concat(stringToWords(attributeString))
                            attributeString = '';
                        } break;
                        case 'text': {
                            attributeString += tokenNow.text;
                        } break;
                        case '"': {
                            itemNow.attributes = itemNow.attributes.concat(stringToWords(attributeString))
                            attributeString = '';
                            insideQuote = true;
                        } break;
                        default: {
                            attributeString += tokenNow.type;
                        } break;
                    }
                }
            }
            else {
                switch (tokenNow.type) {
                    case ESCAPE_CHAR: {
                        if (nextToken.type === '!{' || nextToken.type === '!]') {
                            itemNow.appendTextToBody(nextToken.type);
                            this.tkCursor++;
                        } else {
                            continue;
                        }
                    } break;
                    case '!{': {
                        //add new item
                        let newItem = new Item();
                        this.items.push(newItem);

                        //and add them to current item's body
                        newItem.parent = itemNow;
                        itemNow.body.push(newItem);

                        //we are now inside items attributes
                        insideAttributes = true;

                        if (nextToken === null) {
                            return [this.root, this.errorSuddenEnd()]
                        }
                    } break;
                    case '!]': {
                        //pop the current item

                        //prevent popping root from item stack
                        //this happens when src text has mismatching '[' and '!]'
                        if (this.items.length <= 1) {
                            return [this.root, this.errorUnexpectedType(tokenNow)]
                        }
                        this.items.pop();
                    } break;
                    case 'text': {
                        itemNow.appendTextToBody(tokenNow.text);
                    } break;
                    //rest of them have no meaning when they are not
                    //in attribute so just treat it as a plain text
                    default: {
                        itemNow.appendTextToBody(tokenNow.type);
                    } break;
                }
            }
        }

        return [this.root, null];
    }
}

function prettyPrint(item: Item, inColor : boolean = true , level = 0): string {
    let inGreen = colors.green;
    let inBlue = colors.blue;
    if(!inColor){
        inGreen = (str : string)=>{return str}
        inBlue = (str : string)=>{return str}
    }
    
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

    for (let i = 0, l = item.attributes.length; i < l; i++) {
        const attr = item.attributes[i];
        toPrint += inGreen(`"${attr.replace(/\"/g, '\\"')}"`);
        if (i < l - 1) {
            toPrint += ', '
        }
    }

    toPrint += inBlue('}');

    if (item.body.length === 1 && typeof item.body[0] === 'string') {
        return toPrint += ' "' + item.body[0].replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n') + '"' + inBlue(']');
    }
    else {
        toPrint += '\n'

        for (const child of item.body) {
            if (typeof child === 'string') {
                toPrint += indent  + singleTab + '"' + child.replace(/\r\n/g, '\\r\\n').replace(/\n/g, '\\n') + '"' + '\n';
            }
            else {
                toPrint += prettyPrint(child, inColor, level + 1) + '\n';
            }
        }
    }


    return toPrint + indent + inBlue(']');
}

function dumpTree(item : Item) : string{
    let text = "!{";
    for(const attr of item.attributes){
        text += ` ${attr}`
    }
    text += ' }['
    for (const child of item.body) {
        if (typeof child === 'string') {
            text += child;
        }
        else {
            text += dumpTree(child);
        }
    }
    text += '!]';

    return text;
}

export { Token, TokenTypes, Tokenizer, Parser, Item, prettyPrint, dumpTree}