import * as fs from 'fs'
import * as st from '../lib/'
import * as path from 'path'
import { argv } from 'process';

const args = argv.slice(2);

if (args.findIndex((str) => {return str === '-h' }) >= 0) {
    console.log('with out any arguments, parses the file that ends with .frt')
    console.log('and compared the output to .frt.test')
    console.log('')
    console.log('-u : update the test cases')
    console.log('-h : prints this message')
    console.log('-d : delete failed case files')
    process.exit(0);
}

let dir = fs.opendirSync(__dirname);

let files: fs.Dirent[] = [];

while (true) {
    let file: fs.Dirent | null = dir.readSync();
    if (file === null) {
        break;
    }
    files.push(file);
}

dir.closeSync();

if (args.findIndex((str) => { return str === '-d' }) >= 0) {
    console.log('deleting failed test cases')
    let deletedFiles = [];

    for (const file of files) {
        if (file.isFile() && file.name.endsWith('.frt.fail')) {
            let fullPath = path.join(__dirname, file.name);
            try{
                fs.unlinkSync(fullPath);
            }catch(err){
                console.error(`Error : failed to delete the file ${fullPath}`);
                console.error(err);
            }finally{
                deletedFiles.push(fullPath);
            }
        }
    }
    
    console.log(`deleted ${deletedFiles.length} files`)
    for(const file of deletedFiles){
        console.log(file);
    }

    process.exit(0);
}

let testCases: Map<string, string> = new Map<string, string>();

for (const file of files) {
    if (file.isFile() && file.name.endsWith('.frt')) {
        let filePath = path.join(__dirname, file.name);
        let content = fs.readFileSync(filePath, 'utf-8' );

        testCases.set(file.name, content.replace(/\r\n/g, '\n'));
    }
}

function parseSrcAndConvertToTestCase(src: string, srcPath: string) : string{
    let tokenizer = new st.Tokenizer(src, srcPath);
    let parser = new st.Parser(tokenizer.tokenize());
    let [root, errorMsg] = parser.parse(false);

    let testCase = "";

    if (errorMsg !== null) {
        testCase =  'ERROR\n' + errorMsg;
    }
    else {
        testCase =  'OUTPUT\n' + st.dumpTree(root);
    }

    return testCase;
}

if (args.length == 0) {
    let failedTests = [];
    for (const [fileName, content] of testCases) {
        let parsedOutput = parseSrcAndConvertToTestCase(content, fileName);
        
        let testOutput = "";
        try{
            testOutput = fs.readFileSync(path.join(__dirname, fileName + '.test'), 'utf8');
        }catch(error){
            console.error(`test case for ${path.join(__dirname, fileName)} doesn't exist!`)
            console.error(`update the test cases with -u option`)
            continue;
        }

        let failed = false;
        if(testOutput.length !== parsedOutput.length){
            failed = true;
        }
        for(let i=0; i<testOutput.length; i++){
            if(testOutput[i] !== parsedOutput[i]){
                failed = true;
                break;
            }
        }

        if(failed){
            fs.writeFileSync(path.join(__dirname, fileName + '.fail'), parsedOutput, 'utf-8');
            failedTests.push(fileName);
        }
    }

    if(failedTests.length > 0){
        console.log(`${failedTests.length}/${testCases.size} failed!`)
        console.log(`failed tests are : `)
        for(const testFile of failedTests){
            console.log(`    ${path.join(__dirname, testFile)}`);
        }
        console.log(`expected outputs were : `)
        for(const testFile of failedTests){
            console.log(`    ${path.join(__dirname, testFile + '.test')}`);
        }
        console.log(`actual outputs are : `)
        for(const testFile of failedTests){
            console.log(`    ${path.join(__dirname, testFile + '.fail')}`);
        }
    }
    else{
        console.log('Test Success!!!')
    }
}
else if (args.findIndex((str) => { return str === '-u' }) >= 0) {
    for (const [fileName, content] of testCases) {
        let parseOutput = parseSrcAndConvertToTestCase(content, fileName);

        fs.writeFileSync(path.join(__dirname, fileName + '.test'), parseOutput);
    }
    console.log('done updating')
}