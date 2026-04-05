POST http://fragments:8080/v1/fragments
Content-Type: application/xml
[BasicAuth]
user1@email.com:password1


<note><body>Hello</body></note>

HTTP/1.1 415
