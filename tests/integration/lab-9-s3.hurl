# -------------------------------
# Lab 9 – S3 Integration Test
# -------------------------------

# 1. POST a new text fragment
POST http://localhost:8080/v1/fragments
Content-Type: text/plain
[BasicAuth]
user1@email.com:password1

`This is a fragment!`

HTTP/1.1 201
[Asserts]
header "Location" matches "^http://localhost:8080/v1/fragments/[A-Za-z0-9_-]+$"
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"
jsonpath "$.fragment.size" == 19

# 🔥 Capture ONLY the ID 
[Captures]
fragmentId: header "Location" regex ".*/fragments/([A-Za-z0-9_-]+)$"

# -------------------------------

# 2. GET the fragment 
GET http://localhost:8080/v1/fragments/{{fragmentId}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
header "Content-Type" == "text/plain"
body == "This is a fragment!"

# -------------------------------

# 3. DELETE the fragment
DELETE http://localhost:8080/v1/fragments/{{fragmentId}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 200
[Asserts]
jsonpath "$.status" == "ok"

# -------------------------------

# 4. GET again → should now be 404
GET http://localhost:8080/v1/fragments/{{fragmentId}}
[BasicAuth]
user1@email.com:password1

HTTP/1.1 404
[Asserts]
jsonpath "$.status" == "error"