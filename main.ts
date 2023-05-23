import * as fs from 'fs'
import * as process from 'process'
const colors = require('colors');

const srcPath = './test.st'

const src: string = fs.readFileSync(srcPath, { encoding: 'utf-8' });

type ST_TokenTypes = '!{' | '}' | '[' | '!]' | '~' | 'text' | 'unknown';

class ST_Token {
    static readonly LITERAL_TOKENS :ST_TokenTypes[] = ['!{' , '}' , '[' , '!]' , '~'];
    type: ST_TokenTypes = 'unknown';
    text: string = '';
    column: number = 0;
    lineNumber: number = 0;

    docLocation(srcPath : string) : string{
        return `"${srcPath}:${this.lineNumber + 1}:${this.column+1}"`
    }
    
    isWhiteSpace() : boolean{
        if(this.type !== 'text'){
            console.warn(`Warning : asking token if it's white space when it's type is ${this.type}`)
            return false;
        }
        return this.text.match(/\S/) === null;
    }

    isLiteral() : boolean{
        return ST_Token.LITERAL_TOKENS.indexOf(this.type) >= 0;
    }
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

    let foundLiteralToken = false;

    for (let i = 0; i < ST_Token.LITERAL_TOKENS.length; i++) {
        let lt = ST_Token.LITERAL_TOKENS[i];
        if (lexer.startsWith(lt)) {
            foundLiteralToken = true;

            token.type = ST_Token.LITERAL_TOKENS[i];

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
    let errorMsg = `Error at ${token.docLocation(srcPath)} : expected `;

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
            console.error(colors.red(errorMsg));
            process.exit(6969);
        }
        return errorMsg;
    }

    return null;
}

class Parser{
    tkCursor = 0;
    root = new ST_Object();
    objects: Array<ST_Object> = [this.root];

    parse(tokens : ST_Token[]) : ST_Object{
        if(tokens.length <= 0){
            return root;
        }

        while (this.tkCursor < tokens.length) {
            let parent = this.objects[this.objects.length - 1];
            let lastToken = this.tkCursor >= 1 ? tokens[this.tkCursor-1] : new ST_Token()
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
                        checkSeriesOfType(tokens, this.tkCursor, ['text', '}', '['], false);
            
                        let object = new ST_Object();
                        object.attributes = textToAttributes(tokens[this.tkCursor++].text);
            
                        object.parent = parent;
                        parent.body.push(object);
            
                        this.objects.push(object);
            
                        this.tkCursor += 2;
                    }
                } break;
                case '!]':{
                    if(lastToken.type === '~'){
                        parent.appendTextToBody(tokenNow.type);
                    }
                    else{
                        if(this.objects.length <= 1){
                            console.error(colors.red(`Error at ${tokenNow.docLocation(srcPath)} : unexpected ${tokenNow.type}`));
                            process.exit(6969);
                        }
                        this.objects.pop();
                    }
                } break;
                case '[':
                case '}':
                case '~':{
                    parent.appendTextToBody(tokenNow.type);
                }break;
                default : {
                    console.error(colors.red(`Error at ${tokenNow.docLocation(srcPath)} : unknown token type : ${tokenNow.type}`));
                    process.exit(6969);
                }
            }
        }

        if(this.objects.length > 1){
            console.warn(colors.yellow(`Warning : ${this.objects.length - 1} missing '!]'`))
        }

        return this.root;
    }
}

let parser = new Parser();
let root = parser.parse(lexer.tokens);

function dumpTree(object : ST_Object , level  = 0){
    let indent = ''
    for(let i=0; i<level*4; i++){
        indent += ' ';
    }
    let toPrint = indent;

    toPrint += colors.blue('{')
    for(const attr of object.attributes){
        toPrint += colors.green(`${attr }, `);
    }
    toPrint += colors.blue('}[') + '"';

    for(let child of object.body){
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

dumpTree(root);

///////////////////////////////////////
//render the object tree
///////////////////////////////////////

//it is not the library's role to render the object tree
//rather library user who decides how to use the object tree
//this is just a test to see how library functions
function render(root : ST_Object) : string{
    let rendered = ""
    if(root.isRoot()){
        rendered += "<p><pre>\n"
    }
    else{
        switch(root.attributes[0]){
            case 'div':{
                rendered += '<div>\n'
            }break;
            case 'p':{
                rendered += '<p>'
            }break;
            default : {
                rendered += '<p>'
            }
        }
    }
    
    for(const child of root.body){
        if(typeof child === 'string'){
            rendered += child
        }
        else{
            rendered += render(child);
        }
    }
    
    if(root.isRoot()){
        rendered += "</pre></p>"
    }
    else{
        switch(root.attributes[0]){
            case 'div':{
                rendered += '\n</div>\n'
            }break;
            case 'p':{
                rendered += '</p>'
            }break;
            default : {
                rendered += '\n</p>'
            }
        }
    }

    return rendered;
}

fs.writeFileSync('./index.html', render(root))