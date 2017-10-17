import { ChildProcess, exec, spawn } from "child_process";
import * as debug from "debug";

// tslint:disable-next-line:no-var-requires
const ps = require("ps-node");

const log = debug("azure-functions-pack:ProcessHelper");

export class ProcessHelper {
    public static run(commands: string[], cwd: string): Promise<IProcessResults> {
        return new Promise<IProcessResults>((resolve, reject) => {
            exec(commands.join(" "), { cwd }, (err: Error, stdout: string, stderr: string) => {
                log(stdout);
                log(stderr);
                const results: IProcessResults = {
                    didError: err ? true : false,
                    error: err,
                    stderr,
                    stdout,
                };
                if (err) {
                    log(err);
                    reject(err);
                    return;
                }
                resolve(results);
            });
        });
    }

    public static killAllFunctionsHosts(): Promise<{}> {
        return new Promise((resolve, reject) => {
            ps.lookup({
                command: "dotnet",
            }, (err: any, processes: any) => {
                const promises: any[] = [];
                processes.forEach((p: any) => {
                    log(JSON.stringify(p, null, " "));
                    p.arguments.forEach((a: any) => {
                        if (a.includes("bin/Azure.Functions.Cli.dll")) {
                            promises.push(ProcessHelper.kill(p.pid));
                        }
                    });
                });
                Promise.all(promises).then(resolve).catch((e) => { log(e); resolve(); });
            });
        });
    }

    public static kill(pid: number): Promise<{}> {
        return new Promise((resolve, reject) => {
            ps.kill(pid, "SIGKILL", (e: Error) => {
                if (e) {
                    resolve(e);
                } else {
                    reject();
                }
            });
        });
    }
}

export interface IProcessResults {
    exitCode?: string;
    stdout?: string;
    stderr?: string;
    didError?: boolean;
    error?: Error;
}
