/*
This is a simple example that demontrates how stollen can be used.

It compiles example.frt to index.html
*/

import * as fs from 'fs'
import * as st from '../lib'
import * as path from 'path'
import * as process from 'process'

const srcPath = path.join(__dirname, './example.frt');

const content = fs.readFileSync(srcPath, 'utf-8');

const [root, errorMsg] = st.parse(content, srcPath ,{ errorInColor : Boolean(process.stdout.isTTY), normalizeLineEnding : true});

if (errorMsg) {
    console.error(errorMsg);
    process.exit(6969)
}

function getTextsFromBody(item: st.Item) {
    let text = '';
    for (const child of item.body) {
        if (typeof child === 'string') {
            text += child;
        }
    }
    return text;
}

function renderHtml(item: st.Item): string {
    let render: string = ""
    const inlineTypes = ['a', 'i'];
    let opened = false;
    if (item.isRoot()) {
        render +=
        `<html>\n`+
        `<head>\n`+
        `<style> pre  {white-space : pre-wrap}</style>\n`+
        `</head>\n`+
        `<body>`;
        for (const child of item.body) {
            if (typeof child === 'string') {
                if(!opened){
                    render+= '<pre>'
                    opened = true;
                    render += `${child.trimStart()}`
                }
                else{
                    render += `${child}`
                }
            }
            else {
                if (child.attributes.length <= 0) {
                    console.error('Element with 0 attribtues that is not root!');
                    process.exit(6969);
                } else {
                    const elementType = child.attributes[0];

                    if (inlineTypes.includes(elementType)) { //check if child is inline element
                        render += renderHtml(child);
                    }
                    else {
                        if(opened){
                            render = render.trimEnd()
                            render+= '</pre>'
                            opened = false;
                        }
                        render += `\n${renderHtml(child)}\n`
                    }
                }
            }   
        }
        if(opened){
            render += '</pre>'
        }
        render += `\n`+
        `</body>\n`+
        `</html>`;
    }
    else {
        if (item.attributes.length <= 0) {
            console.error('Element with 0 attribtues that is not root!');
            process.exit(6969);
        } else {
            const elementType = item.attributes[0];
            switch (elementType) {
                case 'a': {
                    if (item.attributes.length >= 2) {
                        render += `<a href="${item.attributes[1]}">`;
                    }
                    else {
                        render += `<a href="">`;
                    }
                    render += getTextsFromBody(item);
                    render += '</a>'
                } break;
                case 'ul':
                case 'ol': {
                    render += `<${item.attributes[0]}>\n`
                    for (const child of item.body) {
                        if (
                            typeof child !== 'string' &&
                            child.attributes.length > 0 &&
                            child.attributes[0] == 'li'
                        ) {
                            render += `<li>${getTextsFromBody(child)}</li>\n`
                        }
                    }
                    render += `</${item.attributes[0]}>\n`
                }break;
                case 'code':{
                    render += '<pre><code>'
                    render += getTextsFromBody(item)
                    render += '</code></pre>'
                }break;
                default : {
                    render += `<${item.attributes[0]}>`
                    render += getTextsFromBody(item);
                    render += `</${item.attributes[0]}>`
                }break;
            }
        }
    }

    return render;
}

fs.writeFileSync(path.join(__dirname, './index.html'),renderHtml(root), 'utf-8');