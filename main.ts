import * as fs from 'fs'
import * as st from './stollen'

const srcPath = './test.st'
const src: string = fs.readFileSync(srcPath, { encoding: 'utf-8' });

let tokenizer = new st.Tokenizer(src, srcPath);
let tokens = tokenizer.tokenize();

//console.log('----------------')
//console.log(tokens);
//console.log('----------------')

let parser = new st.Parser(tokens);
let root = parser.parse();

console.log(st.dumpTree(root));

///////////////////////////////////////
//render the object tree
///////////////////////////////////////

//it is not the library's role to render the object tree
//rather library user who decides how to use the object tree
//this is just a test to see how library functions
function render(root : st.Item) : string{
    let rendered = ""
    if(root.isRoot()){
        rendered += "<p>\n"
    }
    else{
        rendered += `<${root.attributes[0]}>`
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
        rendered += "\n</p>"
    }
    else{
        rendered += `</${root.attributes[0]}>`
    }

    return rendered;
}

fs.writeFileSync('./index.html', render(root))