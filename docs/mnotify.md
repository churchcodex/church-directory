Quick Bulk SMS
Send SMS to clients/contacts using contacts that you have without storing in any group first.

HTTP Request
POST https://api.mnotify.com/api/sms/quick
_id is the id of the message sent. You can store this id somewhere to check the delivery status of your message. This id is also called campaign id


Schedule Quick Bulk SMS
When scheduling quick SMS, you must set is_schedule to true and include the date and time in schedule_date payload in the format YYYY-MM-DD hh:mm.

 Do not include the sms_otp field in the payload unless the message blast is specifically for OTP purposes. Including it unnecessarily may cause validation errors or unintended behavior.

 When sms_type: "otp" is included in your payload, a charge of 0.035 per campaign will be deducted from your main wallet.

Authorizations:
api_key
path Parameters
key
required
string
Your enabled api key

recipient
required
Array of arrays
Array of phone numbers eg. ['0241234567', '0201234567']

sender
required
string
Sender ID of the message. Must be at most 11 characters

message
required
text
Message content

is_schedule	
boolean
Schedule flag. True means schedule message

schedule_date	
datetime
date and time in YYYY-MM-DD hh:mm if is_schedule is true

sms_type	
string
type of the sms blast

Responses
200 Success

post
/sms/quick
Request samples
curlphppythonnodejs

Copy
curl -X POST "https://api.mnotify.com/api/sms/quick?key=YOUR_API_KEY" \
-H "Content-Type: application/json" \
-d '{
  "recipient": ["0241234567", "0201234567"],
  "sender": "mNotify",
  "message": "API messaging is fun!",
  "is_schedule": false,
  "schedule_date": "",
// uncomment the below line to send OTP sms 
//  When sms_type: "otp" is included in your payload, a charge of 0.035 per campaign will be deducted from your main wallet.
//  "sms_type": "otp" please do not include in payload when the purpose of the blast is not for otp
}'
Response samples
200
Content type
application/json

Copy
Expand allCollapse all
{
"status": "success",
"code": "2000",
"message": "messages sent successfully",
"summary": {
"_id": "A59CCB70-662D-45EF-9976-1EFAD249793D",
"type": "API QUICK SMS",
"total_sent": 2,
"contacts": 2,
"total_rejected": 0,
"numbers_sent": [],
"credit_used": 2,
"credit_left": 1483
}
}
Group Bulk SMS
Send SMS to clients/contacts using groups you created earlier which has contacts in them

HTTP Request

POST https://api.mnotify.com/api/sms/group
In our example, we will use message template id because we have already used message content when dealing with quick SMS

_id is the id of the message sent. You can store this id somewhere to check the delivery status of your message. This id is also called campaign id


Schedule Group Bulk SMS
When scheduling quick SMS, you must set is_schedule to true and include the date and time in schedule_date payload in the format YYYY-MM-DD hh:mm.
Authorizations:
api_key
path Parameters
key
required
string
Your enabled api key

group_id
required
Array of arrays
Array of group ids eg. ['1', '2']

sender
required
string
Sender ID of the message. Must be at most 11 characters

message
required
text
Message content

message_id
required
int
Message template id

is_schedule	
boolean
Schedule flag. True means schedule message

schedule_date	
datetime
date and time in YYYY-MM-DD hh:mm if is_schedule is true

Responses
200 Success

post
/sms/group
Request samples
curlphppythonnodejs

Copy
curl -X POST  "https://api.mnotify.com/api/sms/group?key=YOUR_API_KEY"
-H "Content-Type:application/json" 
-d '{"group_id":["1","2"], "sender":"mNotify", "message_id":"17481", "is_schedule":false, "schedule_date":""}'
Response samples
200
Content type
application/json

Copy
Expand allCollapse all
{
"status": "success",
"code": "2000",
"message": "messages sent successfully",
"summary": {
"_id": "8C5D1052-9BD6-459A-96FF-5DC1516C05FD",
"type": "API GROUP SMS",
"total_sent": 3,
"contacts": 3,
"total_rejected": 0,
"numbers_sent": [],
"credit_used": 3,
"credit_left": 1480
}
}
Scheduled SMS
Get all scheduled messages

HTTP Request

POST https://api.mnotify.com/api/scheduled
You can store the id of the scheduled messages somewhere in case it needs to be updated

Authorizations:
api_key
path Parameters
key
required
string
Your enabled api key

Responses
200 Success

get
/scheduled
Request samples
curlphppythonnodejs

Copy
curl -X POST  "https://api.mnotify.com/api/scheduled?key=YOUR_API_KEY"
-H "Content-Type:application/json"
Response samples
200
Content type
application/json

Copy
Expand allCollapse all
{
"status": "success",
"code": "2000",
"message": "Data results found",
"summary": {
"id": 10094,
"message": "Your message has been updated",
"sender_id": "mNotify",
"date_time": "2023-10-25 13:30:00"
}
}
Update Scheduled SMS
Update scheduled SMS by passing id of scheduled SMS

HTTP Request

POST https://api.mnotify.com/api/schedule/<id>?key=YOUR_API_KEY
id of schedulded SMS can be obtained from Scheduled SMS endpoint which appears before this endpoint


Authorizations:
api_key
path Parameters
key
required
string
Your enabled api key

sender
required
string
Sender ID for scheduled SMS

message
required
text
Content of SMS

scheduled_date
required
datetime
date and time in YYYY-MM-DD hh:mm

Responses
200 Success

post
/scheduled/<id>?key=YOUR_API_KEY
Request samples
curlphppythonnodejs

Copy
curl -X POST  "https://api.mnotify.com/api/scheduled/<id>?key=YOUR_API_KEY"
-H "Content-Type:application/json" 
-d '{"sender":"mNotify", "message":"You are the best", "schedule_date":"2023-10-30 17:56:00"}'
Response samples
200
Content type
application/json

Copy
Expand allCollapse all
{
"status": "success",
"code": "2000",
"message": "Updated successfully",
"summary": {
"id": "10094",
"sender_id": "mNotify",
"message": "You are the best",
"schedule_date": "2023-12-30 17:56:00"
}
}
Sender ID Registration
Register your sender ids to send messages

HTTP Request

POST https://api.mnotify.com/api/senderid/register
Authorizations:
api_key
path Parameters
key
required
string
Your enabled api key

sender_name
required
string
Sender ID to be registered. Must be at most 11 characters

purpose
required
Array of arrays
Reason for registering the sender id. eg For Sending SMS Newsletters

Responses
200 Success

post
/senderid/register
Request samples
curlphppythonnodejs

Copy
curl -X POST  "https://api.mnotify.com/api/senderid/register?key=YOUR_API_KEY"
-H "Content-Type:application/json" 
-d '{"sender_name":"mNotify", "purpose" : "For Sending SMS Newsletters"}'
Response samples
200
Content type
application/json

Copy
Expand allCollapse all
{
"status": "success",
"code": "2000",
"message": "Sender ID Successfully Registered.",
"summary": {
"sender_name": "mNotify",
"purpose": "For Sending SMS Newsletters",
"status": "Pending"
}
}
Check Sender ID Status
Check status of your sender ids

HTTP Request

POST https://api.mnotify.com/api/senderid/status
Authorizations:
api_key
path Parameters
key
required
string
Your enabled api key

sender_name
required
string
Registered Sender ID.

Responses
200 Success

post
/senderid/status
Request samples
curlphppythonnodejs

Copy
curl --location --request POST 'https://api.mnotify.com/api/senderid/status/?key=YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data-raw '{"sender_name":"mNotify"}'
Response samples
200
Content type
application/json

Copy
Expand allCollapse all
{
"status": "success",
"code": "2000",
"summary": {
"sender name": "mNotify",
"status": "Approved"
}
}