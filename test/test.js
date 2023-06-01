"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e, e_6, _f, e_7, _g, e_8, _h, e_9, _j, e_10, _k, e_11, _l, e_12, _m;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var st = require("../lib/");
var path = require("path");
var process_1 = require("process");
var args = process_1.argv.slice(2);
function printHelp() {
    console.log('with out any arguments, parses the file that ends with .frt');
    console.log('and compared the output to .frt.test');
    console.log('');
    console.log('-u                     : update expected result for all the cases');
    console.log('-u [file1, file2, ...] : update result the specified test cases');
    console.log('-h                     : prints this message');
    console.log('-d                     : delete failed case files');
}
var TestCase = /** @class */ (function () {
    function TestCase(srcPath, srcText) {
        this.path = '';
        this.srcText = '';
        this.fileName = '';
        this.path = srcPath;
        this.fileName = path.basename(srcPath);
        this.srcText = srcText;
    }
    return TestCase;
}());
//perform full test
if (args.length === 0) {
    var testCases = getAllTheTestCases();
    var failedTestsLFlineEnding = [];
    var failedTestsCRLFlineEnding = [];
    try {
        for (var testCases_1 = __values(testCases), testCases_1_1 = testCases_1.next(); !testCases_1_1.done; testCases_1_1 = testCases_1.next()) {
            var testCase = testCases_1_1.value;
            var resultLF = parseSrcAndConvertToTestCase(testCase.srcText, testCase.fileName);
            var expectedResultLF = '';
            var resultCRLF = parseSrcAndConvertToTestCase(changeLFtoCRLF(testCase.srcText), testCase.fileName, '\r\n');
            var expectedResultCRLF = '';
            var readFile = false;
            try {
                expectedResultLF = fs.readFileSync(testCase.path + '.test', 'utf-8');
                expectedResultLF = normalizeLineEnding(expectedResultLF);
                expectedResultCRLF = changeLFtoCRLF(expectedResultLF);
                readFile = true;
            }
            catch (err) {
                console.error("Failed to open expected test result for ".concat(testCase.path, "!"));
                console.error("update the test result with -u option");
                console.error(err.message);
            }
            if (readFile && resultLF !== expectedResultLF) {
                if (resultLF !== expectedResultLF) {
                    failedTestsLFlineEnding.push(testCase);
                    try {
                        fs.writeFileSync(testCase.path + '.fail', resultLF, 'utf-8');
                    }
                    catch (err) {
                        console.error("Failed to write actual output of ".concat(testCase.path, "!"));
                        console.error(err.message);
                    }
                }
                if (resultLF === expectedResultLF && resultCRLF !== expectedResultCRLF) {
                    failedTestsCRLFlineEnding.push(testCase);
                    var filePath = path.join(__dirname, 'crlf-fail', testCase.fileName + '.fail');
                    try {
                        fs.writeFileSync(filePath, resultCRLF, 'utf-8');
                    }
                    catch (err) {
                        console.error("Failed to write actual output of ".concat(testCase.path, "!"));
                        console.error(err.message);
                    }
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (testCases_1_1 && !testCases_1_1.done && (_a = testCases_1.return)) _a.call(testCases_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (failedTestsLFlineEnding.length > 0) {
        console.log('');
        console.log("".concat(failedTestsLFlineEnding.length, "/").concat(testCases.length, " failed!"));
        console.log("failed tests are : ");
        try {
            for (var failedTestsLFlineEnding_1 = __values(failedTestsLFlineEnding), failedTestsLFlineEnding_1_1 = failedTestsLFlineEnding_1.next(); !failedTestsLFlineEnding_1_1.done; failedTestsLFlineEnding_1_1 = failedTestsLFlineEnding_1.next()) {
                var testFile = failedTestsLFlineEnding_1_1.value;
                console.log("    ".concat(testFile.path));
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (failedTestsLFlineEnding_1_1 && !failedTestsLFlineEnding_1_1.done && (_b = failedTestsLFlineEnding_1.return)) _b.call(failedTestsLFlineEnding_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        console.log("expected outputs were : ");
        try {
            for (var failedTestsLFlineEnding_2 = __values(failedTestsLFlineEnding), failedTestsLFlineEnding_2_1 = failedTestsLFlineEnding_2.next(); !failedTestsLFlineEnding_2_1.done; failedTestsLFlineEnding_2_1 = failedTestsLFlineEnding_2.next()) {
                var testFile = failedTestsLFlineEnding_2_1.value;
                console.log("    ".concat(testFile.path + '.test'));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (failedTestsLFlineEnding_2_1 && !failedTestsLFlineEnding_2_1.done && (_c = failedTestsLFlineEnding_2.return)) _c.call(failedTestsLFlineEnding_2);
            }
            finally { if (e_3) throw e_3.error; }
        }
        console.log("actual outputs are : ");
        try {
            for (var failedTestsLFlineEnding_3 = __values(failedTestsLFlineEnding), failedTestsLFlineEnding_3_1 = failedTestsLFlineEnding_3.next(); !failedTestsLFlineEnding_3_1.done; failedTestsLFlineEnding_3_1 = failedTestsLFlineEnding_3.next()) {
                var testFile = failedTestsLFlineEnding_3_1.value;
                console.log("    ".concat(testFile.path + '.fail'));
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (failedTestsLFlineEnding_3_1 && !failedTestsLFlineEnding_3_1.done && (_d = failedTestsLFlineEnding_3.return)) _d.call(failedTestsLFlineEnding_3);
            }
            finally { if (e_4) throw e_4.error; }
        }
    }
    if (failedTestsCRLFlineEnding.length > 0) {
        console.log("".concat(failedTestsCRLFlineEnding.length, "/").concat(testCases.length, " failed when they had crlf ending!"));
        console.log("failed tests are : ");
        try {
            for (var failedTestsCRLFlineEnding_1 = __values(failedTestsCRLFlineEnding), failedTestsCRLFlineEnding_1_1 = failedTestsCRLFlineEnding_1.next(); !failedTestsCRLFlineEnding_1_1.done; failedTestsCRLFlineEnding_1_1 = failedTestsCRLFlineEnding_1.next()) {
                var testFile = failedTestsCRLFlineEnding_1_1.value;
                console.log("    ".concat(testFile.path));
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (failedTestsCRLFlineEnding_1_1 && !failedTestsCRLFlineEnding_1_1.done && (_e = failedTestsCRLFlineEnding_1.return)) _e.call(failedTestsCRLFlineEnding_1);
            }
            finally { if (e_5) throw e_5.error; }
        }
        console.log("expected outputs were : ");
        try {
            for (var failedTestsCRLFlineEnding_2 = __values(failedTestsCRLFlineEnding), failedTestsCRLFlineEnding_2_1 = failedTestsCRLFlineEnding_2.next(); !failedTestsCRLFlineEnding_2_1.done; failedTestsCRLFlineEnding_2_1 = failedTestsCRLFlineEnding_2.next()) {
                var testFile = failedTestsCRLFlineEnding_2_1.value;
                console.log("    ".concat(testFile.path + '.test'));
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (failedTestsCRLFlineEnding_2_1 && !failedTestsCRLFlineEnding_2_1.done && (_f = failedTestsCRLFlineEnding_2.return)) _f.call(failedTestsCRLFlineEnding_2);
            }
            finally { if (e_6) throw e_6.error; }
        }
        console.log("actual outputs are : ");
        try {
            for (var failedTestsCRLFlineEnding_3 = __values(failedTestsCRLFlineEnding), failedTestsCRLFlineEnding_3_1 = failedTestsCRLFlineEnding_3.next(); !failedTestsCRLFlineEnding_3_1.done; failedTestsCRLFlineEnding_3_1 = failedTestsCRLFlineEnding_3.next()) {
                var testFile = failedTestsCRLFlineEnding_3_1.value;
                var filePath = path.join(__dirname, 'crlf-fail', testFile.fileName + '.fail');
                console.log("    ".concat(filePath));
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (failedTestsCRLFlineEnding_3_1 && !failedTestsCRLFlineEnding_3_1.done && (_g = failedTestsCRLFlineEnding_3.return)) _g.call(failedTestsCRLFlineEnding_3);
            }
            finally { if (e_7) throw e_7.error; }
        }
    }
    if (failedTestsLFlineEnding.length === 0 && failedTestsCRLFlineEnding.length === 0) {
        console.log('Test Success!!!');
    }
    process.exit(0);
}
switch (args[0]) {
    case '-h':
        {
            printHelp();
            process.exit(0);
        }
        break;
    case '-u':
        {
            var testCasesToUpdate = [];
            if (args.length === 1) {
                testCasesToUpdate = getAllTheTestCases();
            }
            else if (args.length > 1) {
                try {
                    for (var _o = __values(args.slice(1)), _p = _o.next(); !_p.done; _p = _o.next()) {
                        var filePath = _p.value;
                        try {
                            var fileText = fs.readFileSync(filePath, 'utf-8');
                            testCasesToUpdate.push(new TestCase(filePath, normalizeLineEnding(fileText)));
                        }
                        catch (err) {
                            console.error("Failed to open file ".concat(filePath, "!"));
                            console.error(err.message);
                        }
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (_p && !_p.done && (_h = _o.return)) _h.call(_o);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            }
            try {
                for (var testCasesToUpdate_1 = __values(testCasesToUpdate), testCasesToUpdate_1_1 = testCasesToUpdate_1.next(); !testCasesToUpdate_1_1.done; testCasesToUpdate_1_1 = testCasesToUpdate_1.next()) {
                    var testCase = testCasesToUpdate_1_1.value;
                    var testResult = parseSrcAndConvertToTestCase(testCase.srcText, testCase.fileName);
                    var pathToWrite = testCase.path + '.test';
                    try {
                        fs.writeFileSync(pathToWrite, testResult, 'utf-8');
                    }
                    catch (err) {
                        console.error("Failed to write to ".concat(pathToWrite, "!"));
                        console.error(err.message);
                    }
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (testCasesToUpdate_1_1 && !testCasesToUpdate_1_1.done && (_j = testCasesToUpdate_1.return)) _j.call(testCasesToUpdate_1);
                }
                finally { if (e_9) throw e_9.error; }
            }
        }
        break;
    case "-d":
        {
            var fileToDelete = [];
            try {
                for (var _q = __values(getAllFilesWithExtInDir(__dirname, '.frt.fail')), _r = _q.next(); !_r.done; _r = _q.next()) {
                    var dirent = _r.value;
                    fileToDelete.push(path.join(__dirname, dirent.name));
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (_r && !_r.done && (_k = _q.return)) _k.call(_q);
                }
                finally { if (e_10) throw e_10.error; }
            }
            try {
                for (var _s = __values(getAllFilesWithExtInDir(path.join(__dirname, 'crlf-fail'), '.frt.fail')), _t = _s.next(); !_t.done; _t = _s.next()) {
                    var dirent = _t.value;
                    fileToDelete.push(path.join(__dirname, 'crlf-fail', dirent.name));
                }
            }
            catch (e_11_1) { e_11 = { error: e_11_1 }; }
            finally {
                try {
                    if (_t && !_t.done && (_l = _s.return)) _l.call(_s);
                }
                finally { if (e_11) throw e_11.error; }
            }
            try {
                for (var fileToDelete_1 = __values(fileToDelete), fileToDelete_1_1 = fileToDelete_1.next(); !fileToDelete_1_1.done; fileToDelete_1_1 = fileToDelete_1.next()) {
                    var filePath = fileToDelete_1_1.value;
                    try {
                        fs.unlinkSync(filePath);
                    }
                    catch (err) {
                        console.error("Failed to delete file ".concat(filePath));
                        console.error(err.message);
                    }
                }
            }
            catch (e_12_1) { e_12 = { error: e_12_1 }; }
            finally {
                try {
                    if (fileToDelete_1_1 && !fileToDelete_1_1.done && (_m = fileToDelete_1.return)) _m.call(fileToDelete_1);
                }
                finally { if (e_12) throw e_12.error; }
            }
        }
        break;
    default:
        {
            console.error("Unknow flag ".concat(args[0]));
            console.log('');
            console.log('You can read help blow : ');
            printHelp();
            process.exit(6969);
        }
        break;
}
function getAllTheTestCases() {
    var e_13, _a;
    var testCases = [];
    try {
        for (var _b = __values(getAllFilesWithExtInDir(__dirname, '.frt')), _c = _b.next(); !_c.done; _c = _b.next()) {
            var dirent = _c.value;
            var filePath = path.join(__dirname, dirent.name);
            try {
                var fileText = fs.readFileSync(filePath, 'utf-8');
                var testCase = new TestCase(filePath, normalizeLineEnding(fileText));
                testCases.push(testCase);
            }
            catch (err) {
                console.error("Failed to open file ".concat(filePath, "!"));
                console.error(err.message);
            }
        }
    }
    catch (e_13_1) { e_13 = { error: e_13_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_13) throw e_13.error; }
    }
    return testCases;
}
function parseSrcAndConvertToTestCase(src, srcPath, eol) {
    if (eol === void 0) { eol = '\n'; }
    var _a = __read(st.parse(src, srcPath, { errorInColor: false }), 2), root = _a[0], errorMsg = _a[1];
    var testCase = "";
    if (errorMsg !== null) {
        testCase = 'ERROR' + eol + errorMsg;
    }
    else {
        testCase = 'OUTPUT' + eol + st.dumpTree(root);
    }
    return testCase;
}
function normalizeLineEnding(text) {
    return text.replace(/\r\n/g, '\n');
}
function changeLFtoCRLF(text) {
    var newText = '';
    for (var i = 0; i < text.length; i++) {
        if (text[i] === '\n' && i >= 1 && text[i - 1] !== '\r') {
            newText += '\r\n';
        }
        else {
            newText += text[i];
        }
    }
    return newText;
}
function getAllFilesWithExtInDir(dirPath, extension) {
    var dir = fs.opendirSync(dirPath);
    var dirents = [];
    while (true) {
        var file = dir.readSync();
        if (file === null) {
            break;
        }
        if (file.isFile() && file.name.endsWith(extension)) {
            dirents.push(file);
        }
    }
    dir.closeSync();
    return dirents;
}
//# sourceMappingURL=test.js.map