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

for(const filePath of args){
    if(filePath.startsWith('-')){
        continue;
    }
    try{
        let content = fs.readFileSync(filePath, 'utf-8');
        let [root, errorMsg] = st.parse(content, filePath, {errorInColor : Boolean(process.stdout.isTTY)})

        if(errorMsg){
            console.error(errorMsg);
        }
        else{
            switch (printMode){
                case 'pretty' : {
                    console.log(st.treeToPrettyText(root, Boolean(process.stdout.isTTY)));
                }break;
                case 'json' : {
                    console.log(st.treeToJsonText(root))
                }break;
                case 'dump' : {
                    console.log(st.treeToText(root, Boolean(process.stdout.isTTY)));
                }break;
            }
        }
    }
    catch(err){
        console.error('failed to open the file', filePath, err);
    }
}