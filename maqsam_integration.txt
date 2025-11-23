# Maqsam Voice agent Integration

This document provides technical details for integrating your AI Voice agent with Maqsam
services, allowing your AI agent to handle incoming and outbound phone calls with customers.
The communication between Maqsam and your service happens over Websockets, Maqsam
always initiates the connection to a pre-configured Websocket endpoint from your side. Keep in
mind:

- All messages over this websocket connection (from and to your service) are in JSON
    format. All messages contain a JSON key "type" indicating the type of the message, and
    optional additional keys based on the message.
- Audio will be transmitted from and to your service over the Websocket connection
- Audio data is Base64 encoded and the only supported format is **_mulaw_** with **8000**
    sample rate.

# Call Direction

Your Customers will interact with your AI agent in two different ways:

## Inbound Calls:

You can configure your Maqsam IVR flow so that your AI agent handles answering inbound
calls, allowing it to answer customer inquiries and redirect to human agents when needed.

## Outbound Calls:

You can trigger outbound calls through Maqsam Campaigns. Campaign audience can either be
uploaded through the Maqsam Portal or pushed through the Audience API, along with context
variables.

# Call Flow

When a call needs to connect to an AI voice agent, Maqsam will initiate a Websocket
connection to a pre-configured URL for your service, this URL can include anything you need to
identify the appropriate AI agent to handle the call, in case you provide multiple voice agents to
multiple clients, you can use query parameters and/or path parameters to identify the
appropriate client and agent to handle this call. This can also help in cases where there are
different AI agents for each language, or for different functions (sales, support, etc).


JavaScript
Example URL is:

- wss://voice.service.ai/client_name?agent=ar
- wss://voice.service.ai/support
- wss://voice.service.ai/ksa

## Connection Establishment

The Websocket endpoint you provide will need to be authenticated, to ensure security of your
service. There are two recommended ways to secure a Websocket endpoint and Maqsam
provides support for both. You need to choose which authentication method you want to support
so that the integration is configured correctly.
Note:

- Both authentication methods use a token, so you will need to provide Maqsam (or your
    client using Maqsam) with the appropriate token. You can also contact Maqsam to
    generate a unique token and provide it instead.
- If your service provides multiple agents to different clients, you might also need to make
    sure that the client has proper access to the agent they are requesting. Authentication
    will help achieve that by providing a token that ensures the client has the proper access
    to the service.

## Authentication

There are two supported Authentication methods, ranked by Preference and Security:

### HTTP Auth Header

The WebSocket handshake is done with standard HTTP request and response, which supports
cookies, allowing to authenticate the request before establishing the connection. If configured,
the HTTP request from Maqsam to your WebSocket endpoint will include an "Auth" Header with
an authentication token.
**Example Node.js code** :
const WebSocket = require('ws');
const token = 'your-secret-token';
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws, req) => {


```
JSON
JavaScript
const authHeader = req.headers.auth;
if (!authHeader || authHeader !== token) {
ws.close( 1008 , 'Unauthorized');
return;
}
});
```
### Token Over Websocket

After the Websocket connection is established, an optional setup message will be sent,
containing an authentication token apiKey along with optional extra data if needed. The
message will follow the following format:
{
type: "session.setup",
apiKey: API_KEY,
data: { OPTIONAL_EXTRA_DATA }
}
**Example Node.js code** :
const WebSocket = require('ws');
const token = 'your-secret-token';
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
ws.on('message', message => {
const data = JSON.parse(message);
if (data.type === 'session.setup' && data.apiKey === apiKey) {
} else {
ws.close( 1002 );
}
});
});


```
JSON
JavaScript
```
## Setup Success Confirmation

After the connection is successfully established and all Authentication has been handled from
your side, you **must** send a Websocket message indicating that the setup is complete and you
are ready to start receiving the audio of the customer, if this message is not sent, the service will
not work.
The message is expected to have the following format:
{
type: "session.ready"
}
**Example Node.js code** :
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
// Handle Authentication (e.g., check headers, API key)
ws.send(JSON.stringify({ type: "session.ready" }));
});

## Call Context

Regardless of the chosen authentication method, the session.setup message will be sent at
the start of the session, including the context of the call.
The context can include:

1. **Internal Maqsam config** _(sent by default_ ): this includes data like the numbers and
    contacts of both parties of the call.
2. **Custom context** : can be found under the key custom in the message.


JSON
An example message:
{
type: "session.setup",
data: {
context: {
id: 123 ,
caller_number: "9621234567",
callee_number: "9621234566",
caller: "Noor",
callee: "Yomna",
inputs: ["AI", "Sales"],
direction: "inbound",
timestamp: "2025-04-07 10:00:00"
custom: {
order_id: 123 ,
order_amount: 100 ,
order_status: "pending"
}
}
}
}

## Audio Flow

After authentication and setup success confirmation, Maqsam is ready to exchange Audio and
other messages with your service. This will include:

1. The customer's voice being transmitted over Websocket to your service
2. The AI Voice bot audio being transmitted from your service to the customer
Note:
- The customer's voice will always be transmitted, even if they are silent. Your service
should be able to detect when the customer is talking and when they are not.
The audio messages will follow the following formats, note that AUDIO represents the Base
encoded Audio, audio format **must** be ulaw with 8000 sample rate.


```
JSON
JSON
JSON
```
### Audio message from Maqsam

```
{
type: "audio.input",
data: {
audio: AUDIO,
},
}
```
### Audio message from your service to Maqsam

```
{
type: "response.stream",
data: {
audio: AUDIO,
},
}
```
## Supported Features

### A. Customer interruption

If the customer interrupts the AI Voice agent in the middle of a response, it is possible to stop
playing Audio to the customer even if this audio was already sent from your service to Maqsam.
For this to work, when your service detects the customer voice, it needs to send the following
message to Maqsam:
{
type: "speech.started"
}

### B. Redirect to Human

Based on the conversation between the customer and your service, the AI Voice Agent may
decide that the customer wants to be redirected to a Human agent to discuss things further.


JSON
JSON
JSON
Maqsam will then disconnect the call with your service and continue serving the customer and
connecting them with a Human Agent if available.
For this to work, your service needs to send the following message when the AI Voice Agent
decides to redirect to a human:
{
type: "call.redirect"
}

### C. Mark events

Sometimes, your service would need to know when the audio response it sent has finished
playing to the customer. This helps maintain a natural flow of conversation, and could also be
used in the case of interruption to know if the customer listened to a piece of information in the
response or not.
To use mark events, send the following message
{
type: "call.mark",
data: {
label: LABEL
}
}
The mark will be sent back your service, after all the audio prior to sending the mark has played
successfully to the customer. The event sent to your service will follow this structure:
{
type: "call.mark",
data: {
label: LABEL
}
}


```
JSON
JavaScript
```
### D. DTMF

When the customer is talking to the AI agent, they might input numbers on their phone through
the dialpad, e.g.. for an AI agent that tracks customer orders, you might need the customer to
input their order ID. Digits entered by the customer will be sent to your AI agent (each message
contains a single digit) in the following formats:
{
type: "call.dtmf",
data: {
digit: {{digit}}
}
}

## Ending the Call

A call between Maqsam and your service will end if one of these conditions take place:

1. The customer hangs up the call, if this happens, Maqsam will disconnect the Websocket
    connection with your service.
2. Your service disconnects the Websocket connection, if this happens, Maqsam will
    assume this means the conversation with the AI Voice Agent is complete, and will
    resume handling the call in Maqsam based on a pre-configured flow.
3. Your service sends one of the supported events indicating the end of a call: a.
    call.redirect as mentioned above b. call.hangup, to indicate a normal hang up,
    this behaves exactly similar to your service disconnecting the Websocket connection.
**Example Node.js code** :
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
// Handle Authentication (e.g., check headers, API key)
ws.on('message', message => {
try {
const data = JSON.parse(message);
if (data.type === 'session.setup') {
// Handle session setup
} else if (data.type === 'audio.input') {


// Handle incoming audio
}
} catch (e) {
ws.close( 1002 );
}
});
ws.send(JSON.stringify({ type: "session.ready" }));
// To send Base64 encoded Audio to Maqsam
function sendAudioResponse(audio) {
ws.send(JSON.stringify({ type: "response.stream", data: { audio } }));
}
// Optional: To interrupt the agent when the customer is talking
function sendSpeechStarted() {
ws.send(JSON.stringify({ type: "speech.started" }));
}
// Optional: To redirect the customer to an agent
function sendCallRedirect() {
ws.send(JSON.stringify({ type: "call.redirect" }));
}
// Optional: to hangup the call, the alternative is: ws.close()
function sendCallHangup() {
ws.send(JSON.stringify({ type: "call.hangup" }));
}
});


