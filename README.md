create file

`curl -X PUT -d "hello world" http://localhost:8000/file.txt`

retrieve file

`curl -X http://localhost:8000/file.txt`

delete file

`curl -X DELETE http://localhost:8000/file.txt`

create dir

`curl -X MKCOL http://localhost:8000/folder1`
