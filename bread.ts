import * as fs from 'fs'
import * as st from './lib/'
import * as process from 'process'

const args = process.argv.slice(2);

if(args.length ===0 || args[0] === '-h'){
    console.log('parses the files passed to arguments and prints tree')
    console.log('-h : prints this message')
    process.exit(0);
}

for(const filePath of args){
    try{
        let content = fs.readFileSync(filePath, 'utf-8');
        let tokenizer = new st.Tokenizer(content, filePath);
        let parser = new st.Parser(tokenizer.tokenize());
        let [root, errorMsg] = parser.parse(Boolean(process.stdout.isTTY));

        if(errorMsg){
            console.error(errorMsg);
        }
        else{
            console.log(st.prettyPrint(root, Boolean(process.stdout.isTTY)));
        }
    }
    catch(err){
        console.error('failed to open the file', filePath);
    }
}