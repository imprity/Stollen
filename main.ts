import * as fs from 'fs'
import * as st from './stollen'

const srcPath = './test.st'
const src: string = fs.readFileSync(srcPath, { encoding: 'utf-8' });

let tokenizer = new st.Tokenizer(src, srcPath);
let tokens = tokenizer.tokenize();

let parser = new st.Parser();
let root = parser.parse(tokens);

///////////////////////////////////////
//render the object tree
///////////////////////////////////////

//it is not the library's role to render the object tree
//rather library user who decides how to use the object tree
//this is just a test to see how library functions
function render(root : st.Item) : string{
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