POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`This is a fragment!`

HTTP/1.1 201
[Asserts]
header "Location" matches "^http://localhost:8080/v1/fragments/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" matches "^[0-9a-fA-F-]+$"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 19

[Captures]
url: header "Location"

