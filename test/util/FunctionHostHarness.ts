import * as debug from "debug";
import * as request from "supertest";
import { FunctionHost } from "./FunctionHost";

const log = debug("azure-functions-pack:FunctionHostHarness");

export class FunctionHostHarness {
    private host: FunctionHost;
    private request: request.SuperTest<request.Test>;

    constructor(funcRoot: string) {
        this.host = new FunctionHost(funcRoot);
        this.request = request("http://localhost:7071");

        this.host.on("error", (err: Error) => {
            log(err);
        });

        this.host.on("exit", (code: string) => {
            log(`Functions host exitted with status code: ${code}`);
        });
    }

    public test(name: string) {
        return this.request.post(`/api/${name}`);
    }

    public init(): Promise<{}> {
        const req = this.request;
        this.host.start();
        return new Promise((resolve, reject) => {
            const int = setInterval(() => {
                req.get("/admin/host/status")
                    .then((res) => {
                        if (res.status === 200) {
                            clearTimeout(int);
                            resolve();
                        }
                    }).catch((e) => log(e));
            }, 500);
        });
    }

    public stop() {
        this.host.stop();
    }
}
