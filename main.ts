import * as fs from 'fs'
import * as process from 'process'

const srcPath = './test.st'

const src: string = fs.readFileSync(srcPath, { encoding: 'utf-8' });

type ST_TokenTypes = '!{' | '}' | '[' | '!]' | 'text' | 'unknown';

class ST_Token {
    type: ST_TokenTypes = 'unknown';
    text: string = '';
    column: number = 0;
    lineNumber: number = 0;
}

class Lexer {
    src: string;
    tokens: Array<ST_Token> = [];
    column: number = 0;
    lineNumber: number = 0;
    cursor: number = 0;
    srcLength: number = 0;

    constructor(src: string) {
        this.src = src;
        this.srcLength = this.src.length;
    }

    startsWith(text: string): boolean {
        return src.startsWith(text, this.cursor);
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
}

let lexer: Lexer = new Lexer(src);

let reachedEnd = false;

while (!reachedEnd) {
    let token = new ST_Token();

    token.lineNumber = lexer.lineNumber;
    token.column = lexer.column;

    let literalTokens: Array<ST_TokenTypes> = ['!{', '}', '[', '!]'];
    let foundLiteralToken = false;

    for (let i = 0; i < literalTokens.length; i++) {
        let lt = literalTokens[i];
        if (lexer.startsWith(lt)) {
            foundLiteralToken = true;

            token.type = literalTokens[i];

            lexer.tokens.push(token)

            reachedEnd = lexer.advance(lt.length)[1];
            break;
        }
    }

    if (foundLiteralToken) {
        continue
    }

    //it's a text
    let text = '';
    [text, reachedEnd] = lexer.advance(1);

    if (lexer.tokens.length == 0 || lexer.tokens[lexer.tokens.length - 1].type !== 'text') {
        token.type = 'text';
        token.text = text;

        lexer.tokens.push(token);

        continue;
    }
    lexer.tokens[lexer.tokens.length - 1].text += text;
}

if (lexer.tokens.length <= 0) {
    console.log('no tokens')
    process.exit(0);
}

///////////////////////////////////////
//validate tokens and convert them to objects
///////////////////////////////////////

class ST_Object {
    attributes: Array<string> = [];
    body: Array<string | ST_Object> = [];
    parent: ST_Object | null = null;
}

function lineToWords(str: string): Array<string> {
    let arr: Array<string> = [];
    for (const match of str.matchAll(/\S+/g)) {
        arr.push(match[0]);
    }
    return arr;
}

function checkType(
    token: ST_Token,
    possibleTypes: ST_TokenTypes[] | ST_TokenTypes,
    exitOnError: boolean = true): string | null {
    if (typeof (possibleTypes) === 'string') {
        possibleTypes = [possibleTypes];
    }

    for (const type of possibleTypes) {
        if (token.type === type) {
            return null;
        }
    }
    let errorMsg = `Error at "${srcPath}:${token.lineNumber + 1}:${token.column+1}" : expected `;

    for (let i = 0; i < possibleTypes.length; i++) {
        errorMsg += `${possibleTypes[i]} `
        if (i !== possibleTypes.length - 1) {
            errorMsg += 'or '
        }
    }

    errorMsg += `but got ${token.type}`;

    if (exitOnError) {
        console.error(errorMsg)
        process.exit(6969);
    }

    return errorMsg;
}

function checkSeriesOfType(
    tokens: ST_Token[],
    start: number,
    typeArr: (ST_TokenTypes[] | ST_TokenTypes)[],
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
            console.error(errorMsg);
            process.exit(6969);
        }
        return errorMsg;
    }

    return null;
}

let tokens = lexer.tokens.slice();
let tkCursor = 0;
let root = new ST_Object();
let objects: Array<ST_Object> = [root];

while (tkCursor < tokens.length) {
    let parent = objects[objects.length - 1];
    let tokenNow = tokens[tkCursor++];

    switch (tokenNow.type) {
        case 'text': {
            if (parent.body.length <= 0 || typeof (parent.body[parent.body.length-1]) !== 'string') {
                parent.body.push(tokenNow.text);
            }
            else {
                parent.body[parent.body.length-1] += tokenNow.text;
            }
        } break;
        case '!{': {
            checkSeriesOfType(tokens, tkCursor, ['text', '}', '[']);

            let object = new ST_Object();
            object.attributes = lineToWords(tokens[tkCursor++].text);

            object.parent = parent;
            parent.body.push(object);

            objects.push(object);

            tkCursor += 2;
        } break;
        case '!]':{
            if(objects.length <= 1){
                console.log(objects);
                console.error(`Error at "${srcPath}:${tokenNow.lineNumber + 1}:${tokenNow.column+1}" : unexpected ${tokenNow.type}`);
                process.exit(6969);
            }
            objects.pop();
        } break;
    }
}

if(objects.length > 1){
    console.warn(`Warning : ${objects.length - 1} missing '!]'`)
}

function dumpTree(object : ST_Object , level  = 0){
    let indent = ''
    for(let i=0; i<level; i++){
        if(i%4 == 0){
            indent += '|'
        }
        indent += ' ';
    }
    indent += '|'
    let toPrint = indent;

    toPrint += '{'
    for(const attr of object.attributes){
        toPrint += `${attr },`
    }
    toPrint += '}[ '

    for(let child of object.body){
        if(typeof(child) === 'string'){
            toPrint += child.replace(/\r\n/g, ' \\r\\n ').replace(/\n/g, ' \\n ');
        }
        else{
            console.log(toPrint);
            toPrint = indent;
            dumpTree(child, level+4);
        }
    }
    console.log(toPrint + ']')
}

dumpTree(root);
