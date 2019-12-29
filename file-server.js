const http = require("http"), fs = require("fs"), mime = require("mime");
const methods = Object.create(null);
const FILE_HOME = "./uploaded_files"

http.createServer(function (request, response) {
    if(!fs.existsSync(FILE_HOME)){
        fs.mkdirSync(FILE_HOME);
        console.log("created dir: " + FILE_HOME);
    }
    function respond(code, body, type) {
        if (!type) type = "text/plain";
        response.writeHead(code, {"Content-Type": type});
        if (body && body.pipe) {
            body.pipe(response);
        } else {
            response.end(body);
        }
    }
    if (request.method in methods) {
        methods[request.method](urlToPath(request.url), respond, request);
    } else {
        console.log("Method not allowed");
        respond(405, "Method " + request.method + " not allowed");
    }
}).listen(8000);

function urlToPath(url) {
    let path = require("url").parse(url).pathname;
    return FILE_HOME + decodeURIComponent(path);
}

methods.GET = function (path, respond) {
    fs.stat(path, function (error, stats) {
        if (error && error.code == "ENOENT") {
            respond(404, "File not found");
        } else if (error) {
            respond(500, error.toString());
        } else if (stats.isDirectory()) {
            fs.readdir(path, function (error, files) {
                if (error) {
                    console.log("500 error: " + error.toString());
                    respond(500, error.toString());
                }
                else {
                    console.log("200: dir list successful")
                    respond(200, file.join("\n"));
                }

            });
        } else {
            console.log("200: returned file");
            respond(200, fs.createReadStream(path), mime.getType(path));
        }
    });
};

methods.DELETE = function (path, respond) {
    fs.stat(path, function (error, stats) {
        if (error && error.code == 'ENOENT') {
            console.log("500 error: " + error.toString());
            respond(500, error.toString());
        } else if (stats.isDirectory()) {
            fs.rmdir(path, respondErrorOrNothing(respond));
        } else {
            fs.unlink(path, respondErrorOrNothing(respond));
        }
    });
};


methods.PUT = function (path, respond, request) {
    var outStream = fs.createWriteStream(path);
    outStream.on("error", function (error) {
        console.log("500 error: " + error.toString());
        respond(500, error.toString());
    });
    outStream.on("finish", function () {
        console.log("204: file written");
        respond(204);
    });
    request.pipe(outStream);
    console.log("writing file...");
};

function respondErrorOrNothing(respond) {
    return function (error) {
        if (error) {
            console.log("500 error: " + error.toString());
            respond(500, error.toString());
        } else {
            console.log("204: file deleted");
            respond(204);
        }
    };
};