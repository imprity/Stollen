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
var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e, e_6, _f, e_7, _g, e_8, _h;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var st = require("../lib/");
var path = require("path");
var process_1 = require("process");
var args = process_1.argv.slice(2);
if (args.findIndex(function (str) { return str === '-h'; }) >= 0) {
    console.log('with out any arguments, parses the file that ends with .frt');
    console.log('and compared the output to .frt.test');
    console.log('');
    console.log('-u : update the test cases');
    console.log('-h : prints this message');
    console.log('-d : delete failed case files');
    process.exit(0);
}
var dir = fs.opendirSync(__dirname);
var files = [];
while (true) {
    var file = dir.readSync();
    if (file === null) {
        break;
    }
    files.push(file);
}
dir.closeSync();
if (args.findIndex(function (str) { return str === '-d'; }) >= 0) {
    console.log('deleting failed test cases');
    var deletedFiles = [];
    try {
        for (var files_1 = __values(files), files_1_1 = files_1.next(); !files_1_1.done; files_1_1 = files_1.next()) {
            var file = files_1_1.value;
            if (file.isFile() && file.name.endsWith('.frt.fail')) {
                var fullPath = path.join(__dirname, file.name);
                try {
                    fs.unlinkSync(fullPath);
                }
                catch (err) {
                    console.error("Error : failed to delete the file ".concat(fullPath));
                    console.error(err);
                }
                finally {
                    deletedFiles.push(fullPath);
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (files_1_1 && !files_1_1.done && (_a = files_1.return)) _a.call(files_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    console.log("deleted ".concat(deletedFiles.length, " files"));
    try {
        for (var deletedFiles_1 = __values(deletedFiles), deletedFiles_1_1 = deletedFiles_1.next(); !deletedFiles_1_1.done; deletedFiles_1_1 = deletedFiles_1.next()) {
            var file = deletedFiles_1_1.value;
            console.log(file);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (deletedFiles_1_1 && !deletedFiles_1_1.done && (_b = deletedFiles_1.return)) _b.call(deletedFiles_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    process.exit(0);
}
var testCases = new Map();
try {
    for (var files_2 = __values(files), files_2_1 = files_2.next(); !files_2_1.done; files_2_1 = files_2.next()) {
        var file = files_2_1.value;
        if (file.isFile() && file.name.endsWith('.frt')) {
            var filePath = path.join(__dirname, file.name);
            var content = fs.readFileSync(filePath, 'utf-8');
            testCases.set(file.name, content.replace(/\r\n/g, '\n'));
        }
    }
}
catch (e_3_1) { e_3 = { error: e_3_1 }; }
finally {
    try {
        if (files_2_1 && !files_2_1.done && (_c = files_2.return)) _c.call(files_2);
    }
    finally { if (e_3) throw e_3.error; }
}
function parseSrcAndConvertToTestCase(src, srcPath) {
    var _a = __read(st.parse(src, srcPath, { errorInColor: false }), 2), root = _a[0], errorMsg = _a[1];
    var testCase = "";
    if (errorMsg !== null) {
        testCase = 'ERROR\n' + errorMsg;
    }
    else {
        testCase = 'OUTPUT\n' + st.dumpTree(root);
    }
    return testCase;
}
if (args.length == 0) {
    var failedTests = [];
    try {
        for (var testCases_1 = __values(testCases), testCases_1_1 = testCases_1.next(); !testCases_1_1.done; testCases_1_1 = testCases_1.next()) {
            var _j = __read(testCases_1_1.value, 2), fileName = _j[0], content = _j[1];
            var parsedOutput = parseSrcAndConvertToTestCase(content, fileName);
            var testOutput = "";
            try {
                testOutput = fs.readFileSync(path.join(__dirname, fileName + '.test'), 'utf8');
            }
            catch (error) {
                console.error("test case for ".concat(path.join(__dirname, fileName), " doesn't exist!"));
                console.error("update the test cases with -u option");
                continue;
            }
            var failed = false;
            if (testOutput.length !== parsedOutput.length) {
                failed = true;
            }
            for (var i = 0; i < testOutput.length; i++) {
                if (testOutput[i] !== parsedOutput[i]) {
                    failed = true;
                    break;
                }
            }
            if (failed) {
                fs.writeFileSync(path.join(__dirname, fileName + '.fail'), parsedOutput, 'utf-8');
                failedTests.push(fileName);
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (testCases_1_1 && !testCases_1_1.done && (_d = testCases_1.return)) _d.call(testCases_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    if (failedTests.length > 0) {
        console.log("".concat(failedTests.length, "/").concat(testCases.size, " failed!"));
        console.log("failed tests are : ");
        try {
            for (var failedTests_1 = __values(failedTests), failedTests_1_1 = failedTests_1.next(); !failedTests_1_1.done; failedTests_1_1 = failedTests_1.next()) {
                var testFile = failedTests_1_1.value;
                console.log("    ".concat(path.join(__dirname, testFile)));
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (failedTests_1_1 && !failedTests_1_1.done && (_e = failedTests_1.return)) _e.call(failedTests_1);
            }
            finally { if (e_5) throw e_5.error; }
        }
        console.log("expected outputs were : ");
        try {
            for (var failedTests_2 = __values(failedTests), failedTests_2_1 = failedTests_2.next(); !failedTests_2_1.done; failedTests_2_1 = failedTests_2.next()) {
                var testFile = failedTests_2_1.value;
                console.log("    ".concat(path.join(__dirname, testFile + '.test')));
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (failedTests_2_1 && !failedTests_2_1.done && (_f = failedTests_2.return)) _f.call(failedTests_2);
            }
            finally { if (e_6) throw e_6.error; }
        }
        console.log("actual outputs are : ");
        try {
            for (var failedTests_3 = __values(failedTests), failedTests_3_1 = failedTests_3.next(); !failedTests_3_1.done; failedTests_3_1 = failedTests_3.next()) {
                var testFile = failedTests_3_1.value;
                console.log("    ".concat(path.join(__dirname, testFile + '.fail')));
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (failedTests_3_1 && !failedTests_3_1.done && (_g = failedTests_3.return)) _g.call(failedTests_3);
            }
            finally { if (e_7) throw e_7.error; }
        }
    }
    else {
        console.log('Test Success!!!');
    }
}
else if (args.findIndex(function (str) { return str === '-u'; }) >= 0) {
    try {
        for (var testCases_2 = __values(testCases), testCases_2_1 = testCases_2.next(); !testCases_2_1.done; testCases_2_1 = testCases_2.next()) {
            var _k = __read(testCases_2_1.value, 2), fileName = _k[0], content = _k[1];
            var parseOutput = parseSrcAndConvertToTestCase(content, fileName);
            fs.writeFileSync(path.join(__dirname, fileName + '.test'), parseOutput);
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (testCases_2_1 && !testCases_2_1.done && (_h = testCases_2.return)) _h.call(testCases_2);
        }
        finally { if (e_8) throw e_8.error; }
    }
    console.log('done updating');
}
//# sourceMappingURL=test.js.map