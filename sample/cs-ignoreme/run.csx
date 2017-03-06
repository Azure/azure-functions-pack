using System.Net;

public static async Task<HttpResponseMessage> Run(HttpRequestMessage req, TraceWriter log)
{
    return req.CreateResponse(HttpStatusCode.OK, "Never pack me");
}