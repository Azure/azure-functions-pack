import { ChildProcess, spawn } from "child_process";
import * as debug from "debug";
import * as events from "events";

// tslint:disable-next-line:no-var-requires
const ps = require("ps-node");

type ps = any;

const log = debug("azure-functions-pack:FunctionHost");

export class FunctionHost extends events.EventEmitter {
    private child: ChildProcess;
    private funcRoot: string;

    constructor(funcRoot: string) {
        super();
        this.funcRoot = funcRoot;
    }

    public start() {
        const commands = ["func host start"];
        log(`Running ${commands.join(" ")} in ${this.funcRoot}`);

        const isWin = /^win/.test(process.platform);
        commands.unshift(isWin ? "/c" : "-c");

        this.child = spawn(isWin ? "cmd" : "sh", commands, {
            cwd: this.funcRoot,
        });
        if (process.env.DEBUG
            && (process.env.DEBUG.includes("azure-functions-pack:*")
                || process.env.DEBUG.includes("azure-functions-pack:FunctionHost"))) {
            this.child.stdout.pipe(process.stdout);
            this.child.stderr.pipe(process.stderr);
        }
        this.child.on("error", (err: Error) => {
            this.emit("error", err);
        });
        this.child.on("exit", (code: string) => {
            this.emit("exit", code);
        });
    }

    public stop(): Promise<{}> {
        return new Promise((resolve, reject) => {
            ps.kill(this.child.pid, (err: Error) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}
