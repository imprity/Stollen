import * as fs from 'fs'
import * as st from './lib/'
import * as process from 'process'

const args = process.argv.slice(2);

if(args.length ===0 || args[0] === '-h'){
    console.log('parses the files passed to arguments and prints tree')
    console.log('-h     : prints this message')
    console.log('--json : print as json')
    process.exit(0);
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
    if(filePath === '--json' || filePath === '-h' ){
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
            if(args.includes('--json')){
                let rootClone = new ItemWithoutPrent(root);
                console.log(JSON.stringify(rootClone, null, 4))
            }
            else{
                console.log(st.prettyPrint(root, Boolean(process.stdout.isTTY)));
            }
        }
    }
    catch(err){
        console.error('failed to open the file', filePath, err);
    }
}