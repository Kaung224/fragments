# POST a text/plain fragment with charset
POST http://localhost:8080/v1/fragments
Content-Type: text/plain; charset=utf-8
[BasicAuth]
user1@email.com:password1

`Hello World`

HTTP/1.1 201