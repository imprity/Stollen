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
var e_1, _a, e_2, _b, e_3, _c, e_4, _d, e_5, _e, e_6, _f;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var st = require("../lib/");
var path = require("path");
var process_1 = require("process");
var args = process_1.argv.slice(2);
if (args.findIndex(function (str) { return str === '-h'; }) >= 0) {
    console.log('with out any arguments, parses the file that ends with .st');
    console.log('and compared the output to .st.test');
    console.log('');
    console.log('-u : update the test cases');
    console.log('-h : prints this message');
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
var testCases = new Map();
try {
    for (var files_1 = __values(files), files_1_1 = files_1.next(); !files_1_1.done; files_1_1 = files_1.next()) {
        var file = files_1_1.value;
        if (file.isFile() && file.name.endsWith('.st')) {
            var filePath = path.join(__dirname, file.name);
            var content = fs.readFileSync(filePath, 'utf-8');
            testCases.set(file.name, content.replace(/\r\n/, '\n'));
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
function parseSrcAndConvertToTestCase(src, srcPath) {
    var tokenizer = new st.Tokenizer(src, srcPath);
    var parser = new st.Parser(tokenizer.tokenize());
    var _a = __read(parser.parse(false), 2), root = _a[0], errorMsg = _a[1];
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
            var _g = __read(testCases_1_1.value, 2), fileName = _g[0], content = _g[1];
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
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (testCases_1_1 && !testCases_1_1.done && (_b = testCases_1.return)) _b.call(testCases_1);
        }
        finally { if (e_2) throw e_2.error; }
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
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (failedTests_1_1 && !failedTests_1_1.done && (_c = failedTests_1.return)) _c.call(failedTests_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        console.log("expected outputs were : ");
        try {
            for (var failedTests_2 = __values(failedTests), failedTests_2_1 = failedTests_2.next(); !failedTests_2_1.done; failedTests_2_1 = failedTests_2.next()) {
                var testFile = failedTests_2_1.value;
                console.log("    ".concat(path.join(__dirname, testFile + '.test')));
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (failedTests_2_1 && !failedTests_2_1.done && (_d = failedTests_2.return)) _d.call(failedTests_2);
            }
            finally { if (e_4) throw e_4.error; }
        }
        console.log("actual outputs are : ");
        try {
            for (var failedTests_3 = __values(failedTests), failedTests_3_1 = failedTests_3.next(); !failedTests_3_1.done; failedTests_3_1 = failedTests_3.next()) {
                var testFile = failedTests_3_1.value;
                console.log("    ".concat(path.join(__dirname, testFile + '.fail')));
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (failedTests_3_1 && !failedTests_3_1.done && (_e = failedTests_3.return)) _e.call(failedTests_3);
            }
            finally { if (e_5) throw e_5.error; }
        }
    }
    else {
        console.log('Test Success!!!');
    }
}
else if (args.findIndex(function (str) { return str === '-u'; }) >= 0) {
    try {
        for (var testCases_2 = __values(testCases), testCases_2_1 = testCases_2.next(); !testCases_2_1.done; testCases_2_1 = testCases_2.next()) {
            var _h = __read(testCases_2_1.value, 2), fileName = _h[0], content = _h[1];
            var parseOutput = parseSrcAndConvertToTestCase(content, fileName);
            fs.writeFileSync(path.join(__dirname, fileName + '.test'), parseOutput);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (testCases_2_1 && !testCases_2_1.done && (_f = testCases_2.return)) _f.call(testCases_2);
        }
        finally { if (e_6) throw e_6.error; }
    }
    console.log('done updating');
}
//# sourceMappingURL=test.js.map