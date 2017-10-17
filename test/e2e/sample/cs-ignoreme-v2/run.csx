#r "Newtonsoft.Json"

using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json;
using System.Net;

public static IActionResult Run(HttpRequest req, TraceWriter log)
{
    return (ActionResult)new OkObjectResult("never pack me");
}