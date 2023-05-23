import * as process from 'process'
const colors = require('colors');

type TokenTypes = '!{' | '}' | '[' | '!]' | '~' | 'text' | 'unknown';

class Token {
    static readonly LITERAL_TOKENS: TokenTypes[] = ['!{', '}', '[', '!]', '~'];
    type: TokenTypes = 'unknown';
    text: string = '';
    column: number = 0;
    lineNumber: number = 0;
    srcPath = '';

    docLocation(): string {
        return `"${this.srcPath}:${this.lineNumber + 1}:${this.column + 1}"`
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
    srcPath : string
    column: number = 0;
    lineNumber: number = 0;
    cursor: number = 0;
    srcLength: number = 0;

    constructor(srcText: string, srcPath : string) {
        this.src = srcText;
        this.srcPath = srcPath;
        this.srcLength = this.src.length;
    }

    startsWith(text: string): boolean {
        return this.src.startsWith(text, this.cursor);
    }

    advance(textLength: number): [string, boolean] {
        if (this.cursor >= this.srcLength) {
            return ["", true];
        }
        let text = this.src.slice(this.cursor, this.cursor + textLength);
        for (let i = 0; i < text.length; i++) {
            if (text[i] == '\n') {
                this.lineNumber++;
                this.column = 0;
            }
            else {
                this.column++;
            }
            this.cursor++;
        }
        return [text, this.cursor >= this.srcLength]
    }

    tokenize() :Token[] {

        let tokens : Token[] = [];

        let reachedEnd = false;

        while (!reachedEnd) {
            let token = new Token();

            token.srcPath = this.srcPath;

            token.lineNumber = this.lineNumber;
            token.column = this.column;

            let foundLiteralToken = false;

            for (let i = 0; i < Token.LITERAL_TOKENS.length; i++) {
                let lt = Token.LITERAL_TOKENS[i];
                if (this.startsWith(lt)) {
                    foundLiteralToken = true;

                    token.type = Token.LITERAL_TOKENS[i];

                    tokens.push(token)

                    reachedEnd = this.advance(lt.length)[1];
                    break;
                }
            }

            if (foundLiteralToken) {
                continue
            }

            //it's a text
            let text = '';
            [text, reachedEnd] = this.advance(1);

            if (tokens.length == 0 || tokens[tokens.length - 1].type !== 'text') {
                token.type = 'text';
                token.text = text;

                tokens.push(token);

                continue;
            }
            tokens[tokens.length - 1].text += text;
        }

        return tokens;
    }
}

class Item {
    attributes: Array<string> = [];
    body: Array<string | Item> = [];
    parent: Item | null = null;

    isRoot() : boolean{
        return this.parent === null;
    }
    appendTextToBody(text : string){
        //if last element of body is not text or just empty, then append new string element
        if (this.body.length <= 0 || typeof (this.body[this.body.length-1]) !== 'string') {
            this.body.push(text);
        }
        //else we appen text to existing element
        else {
            this.body[this.body.length-1] += text;
        }
    }
}

function textToAttributes(str: string): Array<string> {
    let arr: Array<string> = [];
    for (const match of str.matchAll(/\S+/g)) {
        arr.push(match[0]);
    }
    return arr;
}

function checkType(
    token: Token,
    possibleTypes: TokenTypes[] | TokenTypes,
    exitOnError: boolean = true): string | null {
    if (typeof (possibleTypes) === 'string') {
        possibleTypes = [possibleTypes];
    }

    for (const type of possibleTypes) {
        if (token.type === type) {
            return null;
        }
    }
    let errorMsg = `Error at ${token.docLocation()} : expected `;

    for (let i = 0; i < possibleTypes.length; i++) {
        errorMsg += `${possibleTypes[i]} `
        if (i !== possibleTypes.length - 1) {
            errorMsg += 'or '
        }
    }

    errorMsg += `but got ${token.type}`;

    if (exitOnError) {
        console.error(colors.red(errorMsg))
        process.exit(6969);
    }

    return errorMsg;
}

function checkSeriesOfType(
    tokens: Token[],
    start: number,
    typeArr: (TokenTypes[] | TokenTypes)[],
    exitOnError: boolean = true) : string | null {

    let expectedLength = typeArr.length;

    let i=0;
    while(start < tokens.length && i < typeArr.length){
        expectedLength--;

        let token = tokens[start++];

        let errorMsg = checkType(token, typeArr[i++], exitOnError);
        
        if(errorMsg){
            return errorMsg;
        }
    }
    //we lack tokens
    if(expectedLength > 0){
        let errorMsg = 'Error : Unexpected End of File';
        if(exitOnError){
            console.error(colors.red(errorMsg));
            process.exit(6969);
        }
        return errorMsg;
    }

    return null;
}

class Parser{
    tkCursor = 0;
    root = new Item();
    items: Array<Item> = [this.root];

    parse(tokens : Token[]) : Item{
        if(tokens.length <= 0){
            return this.root;
        }

        while (this.tkCursor < tokens.length) {
            let parent = this.items[this.items.length - 1];
            let lastToken = this.tkCursor >= 1 ? tokens[this.tkCursor-1] : new Token()
            let tokenNow = tokens[this.tkCursor++];
        
            switch (tokenNow.type) {
                case 'text': {
                    parent.appendTextToBody(tokenNow.text)
                } break;
                case '!{': {
                    if(lastToken.type === '~'){
                        parent.appendTextToBody(tokenNow.type);
                    }
                    else{
                        let amountToAdvance = 0;
                        let errorMsg = checkSeriesOfType(tokens, this.tkCursor, ['text', '}', '['], false);
                        
                        if(errorMsg){
                            checkSeriesOfType(tokens, this.tkCursor, ['text', '}', 'text', '['], true);

                            let textBetweenBraces = tokens[this.tkCursor + 2];
                            if(!textBetweenBraces.isWhiteSpace()){
                                console.error(colors.red(`Error at ${textBetweenBraces.docLocation()} : there can be only white spaces between } and [`));
                                process.exit(6969);
                            }
                            amountToAdvance = 4;
                        }
                        else{
                            amountToAdvance = 3;
                        }

                        let item = new Item()

                        item.attributes = textToAttributes(tokens[this.tkCursor].text);
                
                        item.parent = parent;
                        parent.body.push(item);
            
                        this.items.push(item);
            
                        this.tkCursor += amountToAdvance;
                    }
                } break;
                case '!]':{
                    if(lastToken.type === '~'){
                        parent.appendTextToBody(tokenNow.type);
                    }
                    else{
                        if(this.items.length <= 1){
                            console.error(colors.red(`Error at ${tokenNow.docLocation()} : unexpected ${tokenNow.type}`));
                            process.exit(6969);
                        }
                        this.items.pop();
                    }
                } break;
                case '[':
                case '}':
                case '~':{
                    parent.appendTextToBody(tokenNow.type);
                }break;
                default : {
                    console.error(colors.red(`Error at ${tokenNow.docLocation()} : unknown token type : ${tokenNow.type}`));
                    process.exit(6969);
                }
            }
        }

        if(this.items.length > 1){
            console.warn(colors.yellow(`Warning : ${this.items.length - 1} missing '!]'`))
        }

        return this.root;
    }
}

function dumpTree(item : Item , level  = 0){
    let indent = ''
    for(let i=0; i<level*4; i++){
        indent += ' ';
    }
    let toPrint = indent;

    toPrint += colors.blue('{')
    //for(const attr of object.attributes){
    for(let i=0, l=item.attributes.length; i<l; i++){
        const attr = item.attributes[i];
        toPrint += colors.green(`${attr}`);
        if(i < l-1){
            toPrint += colors.green(', ')
        }
    }
    toPrint += colors.blue('}[') + '"';

    for(let child of item.body){
        if(typeof(child) === 'string'){
            toPrint += child.replace(/\r\n/g, ' \\r\\n ').replace(/\n/g, ' \\n ');
        }
        else{
            console.log(toPrint+ '"');
            toPrint = indent + '"';
            dumpTree(child, level+1);
        }
    }
    console.log(toPrint + '"' +colors.blue(']'))
}

export {Token, TokenTypes, Tokenizer, Parser, Item, dumpTree}