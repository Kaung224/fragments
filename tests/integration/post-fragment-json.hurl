# POST a JSON fragment
POST http://host.docker.internal:8080/v1/fragments
Content-Type: application/json
[BasicAuth]
user1@email.com:password1

{"hello":"world"}

HTTP/1.1 201
