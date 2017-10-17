#r "System.Net.Http"
#r "Newtonsoft.Json"

open System.Net
open System.Net.Http
open Newtonsoft.Json

let Run(req: HttpRequestMessage, log: TraceWriter) =
    async {
        return req.CreateResponse(HttpStatusCode.OK, "Never pack me");
    } |> Async.RunSynchronously
