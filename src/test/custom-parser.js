const fs = require('fs');
const { JSDOM } = require('jsdom');
const axios = require('axios');
const xmlBuilder = require('xmlbuilder');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const jsPath = path.join(__dirname, '../../dist/script.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');
const esprima = require('esprima');
const calculator = require('../../dist/script');

class TestCaseResultDto {
    constructor(methodName, methodType, actualScore, earnedScore, status, isMandatory, errorMessage) {
        this.methodName = methodName;
        this.methodType = methodType;
        this.actualScore = actualScore;
        this.earnedScore = earnedScore;
        this.status = status;
        this.isMandatory = isMandatory;
        this.errorMessage = errorMessage;
    }
}

class TestResults {
    constructor() {
        this.testCaseResults = {};
        this.customData = '';
    }
}

function deleteOutputFiles() {
    ["./output_revised.txt", "./output_boundary_revised.txt", "./output_exception_revised.txt"].forEach(file => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
    });
}

function checkHtmlTags(htmlContent, requiredTags) {
    const dom = new JSDOM(htmlContent);
    const results = {};
    requiredTags.forEach(tag => {
        results[tag] = dom.window.document.getElementsByTagName(tag).length > 0 ? 'pass' : 'fail';
    });
    return results;
}

function checkHtmlAttributes(htmlContent, tagName, attributes) {
    const dom = new JSDOM(htmlContent);
    const elements = dom.window.document.getElementsByTagName(tagName);
    const attributeResults = {};
    attributes.forEach(attribute => {
        let found = false;
        for (let el of elements) {
            if (el.hasAttribute(attribute)) {
                found = true;
                break;
            }
        }
        attributeResults[attribute] = found ? 'pass' : 'fail';
    });
    return attributeResults;
}

function testClearVehicleFormFunction(scriptContent) {
    const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <form id="registerForm">
          <input type="text" id="ownerName" />
          <input type="text" id="makeModel" />
          <select id="vehicleType">
            <option value="">Select</option>
            <option value="SUV">SUV</option>
          </select>
          <input type="text" id="regNumber" />
          <input type="date" id="regDate" />
          <input type="checkbox" id="terms" />
          <button id="submitBtn"></button>

          <div id="outputMessage"></div>

          <div id="ownerNameError"></div>
          <div id="makeModelError"></div>
          <div id="vehicleTypeError"></div>
          <div id="regNumberError"></div>
          <div id="regDateError"></div>
          <div id="termsError"></div>
        </form>
      </body>
    </html>
  `, { runScripts: "dangerously", resources: "usable" });

    const { window } = dom;
    const { document } = window;

    const scriptEl = document.createElement("script");
    scriptEl.textContent = scriptContent;
    document.body.appendChild(scriptEl);

    return new Promise((resolve) => {
        dom.window.addEventListener("load", () => {
            const results = {};

            // Fill some values
            document.getElementById("ownerName").value = "Alice";
            document.getElementById("makeModel").value = "Hyundai";
            document.getElementById("vehicleType").value = "SUV";
            document.getElementById("regNumber").value = "XYZ 1234";
            document.getElementById("regDate").value = "2024-05-10";
            document.getElementById("terms").checked = true;
            document.getElementById("outputMessage").textContent = "Submitted!";
            document.getElementById("ownerNameError").textContent = "Required!";
            document.getElementById("submitBtn").disabled = false;

            // Call clearForm
            window.clearForm();

            // Validate
            results.exists = typeof window.clearForm === "function" ? "pass" : "fail";

            results.fieldsCleared =
                document.getElementById("ownerName").value === "" &&
                    document.getElementById("makeModel").value === "" &&
                    document.getElementById("vehicleType").value === "" &&
                    document.getElementById("regNumber").value === "" &&
                    document.getElementById("regDate").value === "" &&
                    document.getElementById("terms").checked === false
                    ? "pass"
                    : "fail";

            results.submitDisabled =
                document.getElementById("submitBtn").disabled === true ? "pass" : "fail";

            resolve(results);
        });
    });
}

function testValidateOnSubmitFunction(scriptContent) {
    const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <form id="registerForm">
          <input type="text" id="ownerName" />
          <input type="text" id="makeModel" />
          <select id="vehicleType">
            <option value="">Select</option>
            <option value="SUV">SUV</option>
          </select>
          <input type="text" id="regNumber" />
          <input type="date" id="regDate" />
          <input type="checkbox" id="terms" />
          <button id="submitBtn"></button>

          <div id="outputMessage"></div>
          <div id="ownerNameError"></div>
          <div id="makeModelError"></div>
          <div id="vehicleTypeError"></div>
          <div id="regNumberError"></div>
          <div id="regDateError"></div>
          <div id="termsError"></div>
        </form>
      </body>
    </html>
  `, { runScripts: "dangerously", resources: "usable" });

    const { window } = dom;
    const { document } = window;

    const scriptEl = document.createElement("script");
    scriptEl.textContent = scriptContent;
    document.body.appendChild(scriptEl);

    return new Promise((resolve) => {
        dom.window.addEventListener("load", () => {
            const results = {};

            // === CASE 1: Invalid (leave everything empty)
            window.validateOnSubmit();

            const outputError1 = document.getElementById("outputMessage").textContent;
            const outputClass1 = document.getElementById("outputMessage").className;
            results.invalidOutputText = outputError1 === "Please fix the errors above." ? "pass" : "fail";
            results.invalidOutputClass = outputClass1 === "error" ? "pass" : "fail";

            // === CASE 2: Fill all fields correctly
            document.getElementById("ownerName").value = "Alice";
            document.getElementById("makeModel").value = "Hyundai";
            document.getElementById("vehicleType").value = "SUV";
            document.getElementById("regNumber").value = "XYZ 1234";
            document.getElementById("regDate").value = "2024-05-10";
            document.getElementById("terms").checked = true;

            window.validateOnSubmit();

            const outputSuccess = document.getElementById("outputMessage").textContent;
            const outputClassSuccess = document.getElementById("outputMessage").className;
            results.validOutputText = outputSuccess === "Vehicle registration successful!" ? "pass" : "fail";
            results.validOutputClass = outputClassSuccess === "success" ? "pass" : "fail";

            resolve(results);
        });
    });
}

function checkCssFileStyles(cssContent, requiredStyles) {
    const result = {};

    requiredStyles.forEach(styleCheck => {
        const { selector, properties } = styleCheck;
        const blockRegex = new RegExp(`${selector}\\s*\\{([^}]+)\\}`, 'g');
        const match = blockRegex.exec(cssContent);

        if (!match) {
            result[selector] = 'fail';
            return;
        }

        const styleBlock = match[1];
        let allFound = true;

        for (const [prop, value] of Object.entries(properties)) {
            const propRegex = new RegExp(`${prop}\\s*:\\s*${value}\\s*;`);
            if (!propRegex.test(styleBlock)) {
                allFound = false;
                break;
            }
        }

        result[selector] = allFound ? 'pass' : 'fail';
    });

    return result;
}

function formatTestResults(results, methodName, methodType) {
    const result = new TestCaseResultDto(
        methodName,
        methodType,
        1,
        Object.values(results).includes('fail') ? 0 : 1,
        Object.values(results).includes('fail') ? 'Failed' : 'Passed',
        true,
        ''
    );
    const testResults = new TestResults();
    const id = uuidv4();
    testResults.testCaseResults[id] = result;
    testResults.customData = 'Simple Calculator HTML Test';
    return testResults;
}

function generateXmlReport(result) {
    return xmlBuilder.create('test-cases')
        .ele('case')
        .ele('test-case-type', result.status).up()
        .ele('name', result.methodName).up()
        .ele('status', result.status).up()
        .end({ pretty: true });
}

function writeOutputFiles(result, fileType) {
    let output = `${result.methodName}=${result.status === 'Passed' ? 'PASS' : 'FAIL'}\n`;
    const outputMap = {
        functional: "./output_revised.txt",
        boundary: "./output_boundary_revised.txt",
        exception: "./output_exception_revised.txt"
    };
    fs.appendFileSync(outputMap[fileType] || outputMap.functional, output);
}

async function handleTestCase(filePath, testCaseName, testCaseType, testLogic, extraParams = {}) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');

        // Run the test logic
        const results = Array.isArray(extraParams)
            ? await testLogic(data, ...extraParams)
            : await testLogic(data, ...Object.values(extraParams));

        // Build test result structure
        const testResults = formatTestResults(results, testCaseName, testCaseType);
        const customFilePath = path.join(__dirname, '../../../custom.ih');
        testResults.customData = fs.readFileSync(customFilePath, 'utf8');

        // console.log(`${testCaseType} Results:`, results);
        const chalkRed = (text) => `\x1b[31m${text}\x1b[0m`; // red
        const chalkGreen = (text) => `\x1b[32m${text}\x1b[0m`; // green

        console.log(`${testCaseType} Results:`);

        for (const [key, value] of Object.entries(results)) {
            if (value === 'fail') {
                console.log(`  ${key}: ${chalkRed('FAIL')}`);
            } else {
                console.log(`  ${key}: ${chalkGreen('PASS')}`);
            }
        }

        console.log("=================");
        console.log(testResults);

        // Send to results server
        const response = await axios.post(
            'https://compiler.techademy.com/v1/mfa-results/push',
            testResults,
            { headers: { 'Content-Type': 'application/json' } }
        );
        console.log(`${testCaseType} Test Case Server Response:`, response.data);

        // Write XML + output files
        const testCaseId = Object.keys(testResults.testCaseResults)[0];
        const xml = generateXmlReport(testResults.testCaseResults[testCaseId]);
        fs.writeFileSync(`${testCaseType.toLowerCase().replace(' ', '-')}-test-report.xml`, xml);

        writeOutputFiles(testResults.testCaseResults[testCaseId], 'functional');

    } catch (err) {
        console.error(`Error executing ${testCaseType} test case:`, err);
    }
}

// Updated execution flow
function executeAllTestCases() {
    deleteOutputFiles();

    const filePath = path.join(__dirname, '../index.html');
    const jsPath = path.join(__dirname, '../../dist/script.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    const cssFilePath = path.join(__dirname, '../style.css');
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');

    const htmlTagsTestCase = {
        testCaseName: 'HTML Tags Test',
        testCaseType: 'boundary',
        testLogic: checkHtmlTags,
        extraParams: [['title', 'link', 'h2', 'div', 'label', 'input', 'select', 'option', 'button', 'script']]
    };

    const linkAttrTestCase = {
        testCaseName: 'Link Tag Attribute Test',
        testCaseType: 'boundary',
        testLogic: checkHtmlAttributes,
        extraParams: ['link', ['rel', 'href']]
    };

    const scriptAttrTestCase = {
        testCaseName: 'Script Tag Attribute Test',
        testCaseType: 'boundary',
        testLogic: checkHtmlAttributes,
        extraParams: ['script', ['src']]
    };

    const inputAttrTestCase = {
        testCaseName: 'Input Tag Attribute Test',
        testCaseType: 'boundary',
        testLogic: checkHtmlAttributes,
        extraParams: ['input', ['type']]
    };

    const validateOnSubmitFunctionTestCase = {
        testCaseName: 'Validate Form Function Test',
        testCaseType: 'functional',
        testLogic: testValidateOnSubmitFunction
    };

    const clearFormTestCase = {
        testCaseName: 'Clear Form Function Test',
        testCaseType: 'functional',
        testLogic: testClearVehicleFormFunction
    };

    const cssFileStyleTestCase = {
        testCaseName: 'CSS File Style Test',
        testCaseType: 'boundary',
        testLogic: checkCssFileStyles,
        extraParams: [[
            { selector: 'body', properties: { 'font-family': 'Arial, sans-serif', 'background': '#f4f4f4' } },
            { selector: 'form', properties: { 'background': 'white', 'padding': '2rem', 'border-radius': '12px' } },
            { selector: 'h2', properties: { 'text-align': 'center' } },
            { selector: 'button:disabled', properties: { 'background-color': '#ccc !important', 'color': '#666 !important' } },
        ]]
    };

    [
        htmlTagsTestCase,
        linkAttrTestCase,
        scriptAttrTestCase,
        inputAttrTestCase,
        validateOnSubmitFunctionTestCase,
        clearFormTestCase,
        cssFileStyleTestCase,
    ].forEach(tc =>
        handleTestCase(
            tc.testLogic === testValidateOnSubmitFunction ||
                tc.testLogic === testClearVehicleFormFunction ? jsPath :
                tc.testLogic === checkCssFileStyles ? cssFilePath :
                    filePath,
            tc.testCaseName,
            tc.testCaseType,
            tc.testLogic,
            tc.extraParams || {})
    );
}

executeAllTestCases();
