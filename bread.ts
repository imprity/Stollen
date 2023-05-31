import * as fs from 'fs'
import * as st from './lib/'
import * as process from 'process'

const args = process.argv.slice(2);

if(args.length ===0 || args[0] === '-h'){
    console.log('parses the files passed to arguments and prints tree')
    console.log('');
    console.log('usage : file1.frt file2.frt file3.frt [--json, --dump]');
    console.log('');
    console.log('-h     : prints this message')
    console.log('--json : print as json')
    console.log('--dump : dump without formatting')
    process.exit(0);
}

type PrintMode = 'json' | 'dump' | 'pretty'

let printMode : PrintMode = 'pretty'

{
    const lastArg = args[args.length - 1];
    if(lastArg === '--json'){
        printMode = 'json';
    }
    else if(lastArg === '--dump'){
        printMode = 'dump'
    }
}

class ItemWithoutPrent{
    attributes: Array<string> = [];
    body: Array<string | ItemWithoutPrent> = [];

    constructor(item : st.Item){
        this.attributes = item.attributes;
        for(const child of item.body){
            if(typeof child === 'string'){
                this.body.push(child)
            }
            else{
                let cloneChild = new ItemWithoutPrent(child);
                this.body.push(cloneChild);
            }
        }
    }
}

for(const filePath of args){
    if(filePath.startsWith('-')){
        continue;
    }
    try{
        let content = fs.readFileSync(filePath, 'utf-8');
        let tokenizer = new st.Tokenizer(content, filePath);
        let parser = new st.Parser(tokenizer.tokenize());
        let [root, errorMsg] = parser.parse(Boolean(process.stdout.isTTY));

        if(errorMsg){
            console.error(errorMsg);
        }
        else{
            switch (printMode){
                case 'pretty' : {
                    console.log(st.prettyPrint(root, Boolean(process.stdout.isTTY)));
                }break;
                case 'json' : {
                    let rootClone = new ItemWithoutPrent(root);
                    console.log(JSON.stringify(rootClone, null, 4))
                }break;
                case 'dump' : {
                    console.log(st.dumpTree(root, Boolean(process.stdout.isTTY)))
                }break;
            }
        }
    }
    catch(err){
        console.error('failed to open the file', filePath, err);
    }
}