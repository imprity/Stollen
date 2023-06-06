import * as fs from 'fs'
import * as st from '../lib/'
import * as path from 'path'
import { argv } from 'process';

const args = argv.slice(2);

function printHelp() {
    console.log('with out any arguments, parses the file that ends with .frt')
    console.log('and compared the output to .frt.test')
    console.log('')
    console.log('-u                     : update expected result for all the cases')
    console.log('-u [file1, file2, ...] : update result the specified test cases')
    console.log('-h                     : prints this message')
    console.log('-d                     : delete failed case files')
}

class TestCase {
    path = '';
    srcText = '';
    fileName = '';

    constructor(srcPath: string, srcText: string) {
        this.path = srcPath;
        this.fileName = path.basename(srcPath);
        this.srcText = srcText;
    }
}

//perform full test
if (args.length === 0) {
    let testCases: TestCase[] = getAllTheTestCases();

    let failedTestsLFlineEnding: TestCase[] = [];
    let failedTestsCRLFlineEnding : TestCase[] = [];

    for (const testCase of testCases) {
        let resultLF = parseSrcAndConvertToTestCase(testCase.srcText, testCase.fileName);
        let expectedResultLF = ''

        let resultCRLF = parseSrcAndConvertToTestCase(changeLFtoCRLF(testCase.srcText), testCase.fileName, '\r\n');
        let expectedResultCRLF = ''
        let readFile = false;
        try {
            expectedResultLF = fs.readFileSync(testCase.path + '.test', 'utf-8');
            expectedResultLF = normalizeLineEnding(expectedResultLF);

            expectedResultCRLF = changeLFtoCRLF(expectedResultLF);

            readFile = true;

        } catch (err) {
            console.error(`Failed to open expected test result for ${testCase.path}!`)
            console.error(`update the test result with -u option`)
            console.error(err.message);
        }

        if (readFile && resultLF !== expectedResultLF) {
            if(resultLF !== expectedResultLF){
                failedTestsLFlineEnding.push(testCase);
                try {
                    fs.writeFileSync(testCase.path + '.fail', resultLF, 'utf-8');
                }
                catch (err) {
                    console.error(`Failed to write actual output of ${testCase.path}!`)
                    console.error(err.message);
                }
            }
            if(resultLF === expectedResultLF && resultCRLF !== expectedResultCRLF){
                failedTestsCRLFlineEnding.push(testCase);
                let filePath = path.join(__dirname, 'crlf-fail', testCase.fileName + '.fail');
                try {
                    fs.writeFileSync(filePath, resultCRLF, 'utf-8');
                }
                catch (err) {
                    console.error(`Failed to write actual output of ${testCase.path}!`)
                    console.error(err.message);
                }
            }
        }
    }

    if (failedTestsLFlineEnding.length > 0) {
        console.log('')
        console.log(`${failedTestsLFlineEnding.length}/${testCases.length} failed!`)
        console.log(`failed tests are : `)
        for (const testFile of failedTestsLFlineEnding) {
            console.log(`    ${testFile.path}`);
        }
        console.log(`expected outputs were : `)
        for (const testFile of failedTestsLFlineEnding) {
            console.log(`    ${testFile.path + '.test'}`);
        }
        console.log(`actual outputs are : `)
        for (const testFile of failedTestsLFlineEnding) {
            console.log(`    ${testFile.path + '.fail'}`);
        }
    }

    if (failedTestsCRLFlineEnding.length > 0) {
        console.log(`${failedTestsCRLFlineEnding.length}/${testCases.length} failed when they had crlf ending!`)
        console.log(`failed tests are : `)
        for (const testFile of failedTestsCRLFlineEnding) {
            console.log(`    ${testFile.path}`);
        }
        console.log(`expected outputs were : `)
        for (const testFile of failedTestsCRLFlineEnding) {
            console.log(`    ${testFile.path + '.test'}`);
        }
        console.log(`actual outputs are : `)
        for (const testFile of failedTestsCRLFlineEnding) {
            let filePath = path.join(__dirname, 'crlf-fail', testFile.fileName + '.fail');
            console.log(`    ${filePath}`);
        }
    }

    if(failedTestsLFlineEnding.length === 0 && failedTestsCRLFlineEnding.length === 0) {
        console.log('Test Success!!!')
    }
    process.exit(0);
}

switch (args[0]) {
    case '-h': {
        printHelp();
        process.exit(0);
    } break;
    case '-u': {
        let testCasesToUpdate: TestCase[] = [];

        if (args.length === 1) {
            testCasesToUpdate = getAllTheTestCases();
        }
        else if (args.length > 1) {
            for (const filePath of args.slice(1)) {
                try {
                    let fileText = fs.readFileSync(filePath, 'utf-8');
                    testCasesToUpdate.push(new TestCase(filePath, normalizeLineEnding(fileText)));
                }
                catch (err) {
                    console.error(`Failed to open file ${filePath}!`);
                    console.error(err.message);
                }
            }
        }

        for (const testCase of testCasesToUpdate) {
            let testResult = parseSrcAndConvertToTestCase(testCase.srcText, testCase.fileName);
            let pathToWrite = testCase.path + '.test';
            try {
                fs.writeFileSync(pathToWrite, testResult, 'utf-8');
            }
            catch (err) {
                console.error(`Failed to write to ${pathToWrite}!`);
                console.error(err.message);
            }
        }
    } break;
    case "-d": {
        let fileToDelete = [];

        for(const dirent of getAllFilesWithExtInDir(__dirname, '.frt.fail')){
            fileToDelete.push(path.join(__dirname, dirent.name));
        }

        for(const dirent of getAllFilesWithExtInDir(path.join(__dirname, 'crlf-fail'), '.frt.fail')){
            fileToDelete.push(path.join(__dirname, 'crlf-fail', dirent.name));
        }

        for(const filePath of fileToDelete){
            try{
                fs.unlinkSync(filePath);
            }catch(err){
                console.error(`Failed to delete file ${filePath}`)
                console.error(err.message);
            }
        }
    } break;
    default : {
        console.error(`Unknow flag ${args[0]}`)
        console.log('')
        console.log('You can read help blow : ')
        printHelp();
        process.exit(6969);
    }break;
}

function getAllTheTestCases(): TestCase[] {
    let testCases: TestCase[] = [];
    for(const dirent of getAllFilesWithExtInDir(__dirname, '.frt')){
        let filePath = path.join(__dirname, dirent.name);
        try {
            let fileText = fs.readFileSync(filePath, 'utf-8');

            let testCase = new TestCase(filePath, normalizeLineEnding(fileText));
            testCases.push(testCase);
        }
        catch (err) {
            console.error(`Failed to open file ${filePath}!`);
            console.error(err.message);
        }
    }

    return testCases;
}

function parseSrcAndConvertToTestCase(src: string, srcPath: string, eol = '\n'): string {
    let [root, errorMsg] = st.parse(src, srcPath, { errorInColor: false })

    let testCase = "";

    if (errorMsg !== null) {
        testCase = 'ERROR' + eol + errorMsg;
    }
    else {
        testCase = 'OUTPUT' + eol + st.treeToText(root);
    }

    return testCase;
}

function normalizeLineEnding(text: string): string {
    return text.replace(/\r\n/g, '\n');
}

function changeLFtoCRLF(text : string) : string{
    let newText = '';

    for(let i=0; i<text.length; i++){
        if(text[i] === '\n' && i >= 1 && text[i-1] !=='\r'){
            newText += '\r\n'
        }
        else{
            newText += text[i]
        }
    }

    return newText;
}

function getAllFilesWithExtInDir(dirPath : string, extension : string) : fs.Dirent[]{
    let dir = fs.opendirSync(dirPath);
    let dirents : fs.Dirent[] = [];

    while (true) {
        let file: fs.Dirent | null = dir.readSync();
        if (file === null) {
            break;
        }
        if (file.isFile() && file.name.endsWith(extension)) {
            dirents.push(file)
        }
    }

    dir.closeSync();

    return dirents;
}