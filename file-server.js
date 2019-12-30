const http = require("http"), fs = require("fs"), mime = require("mime");
const logger = require('pino')();
const methods = Object.create(null);
const FILE_HOME = "./uploaded_files";
const PORT = 8000;

const server = http.createServer(function (request, response) {
    if(fs.existsSync(FILE_HOME)) {
        logger.info("file home: " + FILE_HOME);
    } else {
        fs.mkdirSync(FILE_HOME);
        logger.info("created file home dir: " + FILE_HOME);
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
        logger.info("Method not allowed");
        respond(405, "Method " + request.method + " not allowed");
    }
});

start();

function start(){
    server.listen(PORT);
    logger.info("Started server on port: " + PORT);
};


function urlToPath(url) {
    let path = require("url").parse(url).pathname;
    return FILE_HOME + decodeURIComponent(path);
}

methods.GET = function (path, respond) {
    fs.stat(path, function (error, stats) {
        if (error && error.code == "ENOENT") {
            logger.info("404: File not found");
            respond(404, "File not found");
        } else if (error) {
            logger.info("500: " + error.toString());
            respond(500, error.toString());
        } else if (stats.isDirectory()) {
            fs.readdir(path, function (error, files) {
                if (error) {
                    logger.info("500 error: " + error.toString());
                    respond(500, error.toString());
                }
                else {
                    logger.info("200: dir list successful");
                    respond(200, file.join("\n"));
                }

            });
        } else {
            logger.info("200: returned file");
            respond(200, fs.createReadStream(path), mime.getType(path));
        }
    });
};

methods.DELETE = function (path, respond) {
    fs.stat(path, function (error, stats) {
        if (error && error.code == 'ENOENT') {
            logger.info("500 error: " + error.toString());
            respond(500, error.toString());
        } else if (stats.isDirectory()) {
            fs.rmdir(path, respondErrorOrNothing(respond));
        } else {
            fs.unlink(path, respondErrorOrNothing(respond));
        }
    });
};


methods.PUT = function (path, respond, request) {
    let outStream = fs.createWriteStream(path);
    outStream.on("error", function (error) {
        logger.info("500 error: " + error.toString());
        respond(500, error.toString());
    });
    outStream.on("finish", function () {
        logger.info("204: file written");
        respond(204);
    });
    request.pipe(outStream);
    logger.info("writing file...");
};

methods.MKCOL = function (path, respond){
    fs.mkdir(path, respondErrorOrNothing(respond));
};

function respondErrorOrNothing(respond) {
    return function (error) {
        if (error) {
            logger.info("500 error: " + error.toString());
            respond(500, error.toString());
        } else {
            logger.info("204: operation successful");
            respond(204);
        }
    };
};