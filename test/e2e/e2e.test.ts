import * as chai from "chai";
import { spawn } from "child_process";
import * as debug from "debug";
import "mocha";
import * as os from "os";
import * as path from "path";
import { FileHelper } from "../../src/utils/index";
import { FunctionHostHarness } from "../util/FunctionHostHarness";
import { ProcessHelper } from "../util/ProcessHelper";

const log = debug("azure-functions-pack:e2e.test");

const expect = chai.expect;
const sampleRoot = path.resolve(__dirname, "./sample/");

describe("e2e tests", function() {

    describe("funcpack pack .", function() {
        const randomNumber = Math.floor(Math.random() * 10000);
        const testRoot = path.resolve(os.tmpdir(), `./AzureFunctionsPackTest${randomNumber}`);
        log(`Using temp dir: ${testRoot}`);
        describe("cli", function() {
            before(async function() {
                this.timeout(60000);
                return await FileHelper.cp(sampleRoot, testRoot);
            });

            after(async function() {
                this.timeout(60000);
                if (process.env.FUNCPACK_TESTS_CLEAN) {
                    return await FileHelper.rimraf(testRoot);
                } else {
                    return Promise.resolve();
                }
            });

            it("should run successfully", async function() {
                this.timeout(60000);
                try {
                    const results = await ProcessHelper.run(["node",
                        path.resolve(__dirname, "../../lib/main.js"), "pack", "."], testRoot);
                    expect(results.didError).to.be.equal(false, "funcpack pack did not exit successfully");
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            });
        });

        describe("host", function() {
            let host: FunctionHostHarness;

            before(async function() {
                this.timeout(60000);
                await ProcessHelper.killAllFunctionsHosts();
                if (!await FileHelper.exists(testRoot)) {
                    await FileHelper.cp(sampleRoot, testRoot);
                }
                await ProcessHelper.run(["node",
                    path.resolve(__dirname, "../../lib/main.js"), "pack", "."], testRoot);
                host = new FunctionHostHarness(testRoot);
                await host.init();
                return new Promise((resolve, reject) => {
                    const int = setInterval(() => {
                        host.test("simple")
                            .then((res: any) => {
                                log(JSON.stringify(res));
                                if (res.status === 200) {
                                    clearTimeout(int);
                                    resolve();
                                }
                            }).catch((e) => log(e));
                    }, 500);
                });
            });

            after(async function() {
                this.timeout(60000);
                host.stop();
                await ProcessHelper.killAllFunctionsHosts();
                if (process.env.FUNCPACK_TESTS_CLEAN) {
                    return await FileHelper.rimraf(testRoot);
                } else {
                    return Promise.resolve();
                }
            });

            it("should ignore non-js files", function(done) {
                const funcname = process.env.FUNCPACK_TESTS_V2 ? "cs-ignoreme-v2" : "cs-ignoreme";
                host.test(funcname)
                    .expect(200, done);
            });

            it("should obey entryPoint setting", function(done) {
                host.test("entryPoint")
                    .expect(200, done);
            });

            it("should obey excluded setting", function(done) {
                host.test("excluded")
                    .expect(200, done);
            });

            it("should work with external script files", function(done) {
                host.test("externalScriptFile")
                    .expect(200, done);
            });

            it("should work with large imports", function(done) {
                host.test("largeimport")
                    .expect(200, done);
            });

            it("should work with local libs", function(done) {
                host.test("libimport")
                    .expect(200, done);
            });

            it("should obey scriptFile setting", function(done) {
                host.test("scriptFile")
                    .expect(200, done);
            });

            it("should work with simple functions", function(done) {
                host.test("simple")
                    .expect(200, done);
            });

            it("should work with simple imports", function(done) {
                host.test("simpleimport")
                    .expect(200, done);
            });
        });

    });

    describe("funcpack pack -c .", function() {
        const randomNumber = Math.floor(Math.random() * 10000);
        const testRoot = path.resolve(os.tmpdir(), `./AzureFunctionsPackTest${randomNumber}`);
        log(`Using temp dir: ${testRoot}`);
        describe("cli", function() {

            before(async function() {
                this.timeout(60000);
                return await FileHelper.cp(sampleRoot, testRoot);
            });

            after(async function() {
                this.timeout(60000);
                if (process.env.FUNCPACK_TESTS_CLEAN) {
                    return await FileHelper.rimraf(testRoot);
                } else {
                    return Promise.resolve();
                }
            });

            it("should run successfully", async function() {
                this.timeout(60000);
                try {
                    const results = await ProcessHelper.run(["node",
                        path.resolve(__dirname, "../../lib/main.js"), "pack", "-c", "."], testRoot);
                    expect(results.didError).to.be.equal(false, "funcpack pack did not exit successfully");
                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            });
        });

        describe("host", function() {
            let host: FunctionHostHarness;

            before(async function() {
                this.timeout(60000);
                await ProcessHelper.killAllFunctionsHosts();
                if (!await FileHelper.exists(testRoot)) {
                    await FileHelper.cp(sampleRoot, testRoot);
                }
                await ProcessHelper.run(["node",
                    path.resolve(__dirname, "../../lib/main.js"), "pack", "-c", "."], testRoot);
                const testRunRoot = path.resolve(testRoot, ".funcpack");
                log(`Starting host in ${testRunRoot}`);
                host = new FunctionHostHarness(testRunRoot);
                await host.init();
                return new Promise((resolve, reject) => {
                    const int = setInterval(() => {
                        host.test("simple")
                            .then((res: any) => {
                                log(JSON.stringify(res, null, " "));
                                if (res.status === 200) {
                                    clearTimeout(int);
                                    resolve();
                                }
                            }).catch((e) => log(e));
                    }, 500);
                });
            });

            after(async function() {
                this.timeout(60000);
                host.stop();
                await ProcessHelper.killAllFunctionsHosts();
                if (process.env.FUNCPACK_TESTS_CLEAN) {
                    return await FileHelper.rimraf(testRoot);
                } else {
                    return Promise.resolve();
                }
            });

            it("should ignore non-js files", function(done) {
                const funcname = process.env.FUNCPACK_TESTS_V2 ? "cs-ignoreme-v2" : "cs-ignoreme";
                host.test(funcname)
                    .expect(200, done);
            });

            it("should obey entryPoint setting", function(done) {
                host.test("entryPoint")
                    .expect(200, done);
            });

            it("should obey excluded setting", function(done) {
                host.test("excluded")
                    .expect(200, done);
            });

            it("should work with external script files", function(done) {
                host.test("externalScriptFile")
                    .expect(200, done);
            });

            it("should work with large imports", function(done) {
                host.test("largeimport")
                    .expect(200, done);
            });

            it("should work with local libs", function(done) {
                host.test("libimport")
                    .expect(200, done);
            });

            it("should obey scriptFile setting", function(done) {
                host.test("scriptFile")
                    .expect(200, done);
            });

            it("should work with simple functions", function(done) {
                host.test("simple")
                    .expect(200, done);
            });

            it("should work with simple imports", function(done) {
                host.test("simpleimport")
                    .expect(200, done);
            });
        });
    });

    describe("funcpack pack -w . ", function() {
        const randomNumber = Math.floor(Math.random() * 10000);
        const testRoot = path.resolve(os.tmpdir(), `./AzureFunctionsPackTest${randomNumber}`);
        log(`Using temp dir: ${testRoot}`);
        describe("cli", function() {
            before(async function() {
                this.timeout(60000);
                return await FileHelper.cp(sampleRoot, testRoot);
            });

            after(async function() {
                this.timeout(60000);
                if (process.env.FUNCPACK_TESTS_CLEAN) {
                    return await FileHelper.rimraf(testRoot);
                } else {
                    return Promise.resolve();
                }
            });

            it("should run successfully", async function() {
                this.timeout(60000);
                try {
                    const childProcess = spawn("node",
                        [path.resolve(__dirname, "../../lib/main.js"), "pack", "-w", "."], { cwd: testRoot });

                    const waitForWatch = await new Promise<boolean>((resolve, reject) => {
                        childProcess.stdout.on("data", (data: string) => {
                            if (data.toString().includes ("Webpack compiled successfully. Watching for changes.")) {
                                resolve(true);
                                childProcess.kill();
                            }
                        });

                        childProcess.stderr.on("data", (data: string) => {
                            reject(data.toString());
                            childProcess.kill();
                        });
                    });

                    return Promise.resolve();
                } catch (e) {
                    return Promise.reject(e);
                }
            });
        });

        describe("host", function() {
            let host: FunctionHostHarness;

            before(async function() {
                this.timeout(90000);
                await ProcessHelper.killAllFunctionsHosts();
                if (!await FileHelper.exists(testRoot)) {
                    await FileHelper.cp(sampleRoot, testRoot);
                }
                const childProcess = spawn("node",
                [path.resolve(__dirname, "../../lib/main.js"), "pack", "-w", "."], { cwd: testRoot });

                const waitForWatch = await new Promise<boolean>((resolve, reject) => {
                    childProcess.stdout.on("data", (data: string) => {
                        if (data.toString().includes ("Webpack compiled successfully. Watching for changes.")) {
                            resolve(true);
                            childProcess.kill();
                        }
                    });

                    childProcess.stderr.on("data", (data: string) => {
                        reject(data.toString());
                        childProcess.kill();
                    });
                });

                host = new FunctionHostHarness(testRoot);
                await host.init();
                return new Promise((resolve, reject) => {
                    const int = setInterval(() => {
                        host.test("simple")
                            .then((res: any) => {
                                log(JSON.stringify(res));
                                if (res.status === 200) {
                                    clearTimeout(int);
                                    resolve();
                                }
                            }).catch((e) => log(e));
                    }, 500);
                });
            });

            after(async function() {
                this.timeout(60000);
                host.stop();
                await ProcessHelper.killAllFunctionsHosts();
                if (process.env.FUNCPACK_TESTS_CLEAN) {
                    return await FileHelper.rimraf(testRoot);
                } else {
                    return Promise.resolve();
                }
            });

            it("should ignore non-js files", function(done) {
                const funcname = process.env.FUNCPACK_TESTS_V2 ? "cs-ignoreme-v2" : "cs-ignoreme";
                host.test(funcname)
                    .expect(200, done);
            });

            it("should obey entryPoint setting", function(done) {
                host.test("entryPoint")
                    .expect(200, done);
            });

            it("should obey excluded setting", function(done) {
                host.test("excluded")
                    .expect(200, done);
            });

            it("should work with external script files", function(done) {
                host.test("externalScriptFile")
                    .expect(200, done);
            });

            it("should work with large imports", function(done) {
                host.test("largeimport")
                    .expect(200, done);
            });

            it("should work with local libs", function(done) {
                host.test("libimport")
                    .expect(200, done);
            });

            it("should obey scriptFile setting", function(done) {
                host.test("scriptFile")
                    .expect(200, done);
            });

            it("should work with simple functions", function(done) {
                host.test("simple")
                    .expect(200, done);
            });

            it("should work with simple imports", function(done) {
                host.test("simpleimport")
                    .expect(200, done);
            });
        });

    });

});
