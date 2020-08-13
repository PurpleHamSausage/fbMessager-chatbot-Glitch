//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');

var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<script src=\"https://button.glitch.me/button.js\" data-style=\"glitch\"></script><div class=\"glitchButton\" style=\"position:fixed;top:20px;right:20px;\"></div></body></html>";

// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post('/webhook', function (req, res) {
  console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);   
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});
let type = {
  defalut : 0,
  askInfo : 1,
}
let userInfo = {
  name : null,
  age : -1,
  email : null,
}
let currentType = type.default;
let currentUserInfo = userInfo;
// Incoming events handling
async function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var msg = message.text;
  var messageAttachments = message.attachments;
  if (msg) {
    
    markAsSeen(senderID);
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    if(currentType == type.default){
          if(msg.includes('generic')){
        sendGenericMessage(senderID);

      }else if(msg.includes('rumu')){
          sendTextMessage(senderID , '喂，如牧創新你好');

      }else if(msg.includes('PFTween')){
          typing(senderID,true);
          await delayTime(2);
          sendTextMessage(senderID, 'https://github.com/pofulu/sparkar-pftween');

      }else if(nonCaps(msg, 'video')){
          sendVideo(senderID, 'https://i.imgur.com/YcxVeNy.mp4');

      }else if(nonCaps(msg, '大叫')){
          sendTextMessage(senderID, 'YOOOOOO');

      }else if(nonCaps(msg, 'image')){
          sendImage(senderID, 'https://i.imgur.com/atCLtms.jpeg');

      }else if(nonCaps(msg ,'test')){
        sendTextMessage(senderID, 'Start Testing');
        currentUserInfo = userInfo;
        currentType = type.askInfo;
        await delayTime(.5);
        sendTextMessage(senderID, 'Enter anything');
      }
      else{
          typing(senderID,true);
          await delayTime(2);
          sendTextMessage(senderID, msg);
      
      }
    }else if(currentType == type.askInfo){
      if(currentUserInfo.name == null){
        sendTextMessage(senderID, 'enter your name');
        currentUserInfo.name = 'Unknown';
      }else if(currentUserInfo.age == -1){
        currentUserInfo.name = msg;
        sendTextMessage(senderID, 'enter your age');
        currentUserInfo.age = -2;
      }else if(currentUserInfo.email == null){
        // if(type(parseInt(msg)) === 'number'){
          currentUserInfo.age = parseInt(msg);
        // }
      // else{
      //     sendTextMessage(senderID, 'Not effective data, please enter an integer');
      //     currentUserInfo.age = -1;
      //   }

        sendTextMessage(senderID, 'enter your email address');
        currentUserInfo.email = 'Unknown Email';
      }else{
        currentUserInfo.email = msg;
          sendTextMessage(senderID, 'your name: '+ currentUserInfo.name +'\n your age: '+ currentUserInfo.age +'\n your email: '+ currentUserInfo.email.toString());
          currentType = type.default;
          delayTime(1.5);
          sendTextMessage(senderID, 'Test End')
      }
    }

    
  }else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
} 
  
}

function markAsSeen(senderID){
    var readMessage = {
    "recipient":{
      "id": senderID
    },
      "sender_action":"mark_seen"//已讀
  };
  callSendAPI(readMessage);
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  if(payload.includes('payload0') ){
      sendTextMessage(senderID, "你按第零個按鈕幹嘛");
  }else if(payload.includes('payload1')){
       sendTextMessage(senderID, "你按第一個按鈕幹嘛");
  }
}

function nonCaps(msg, text){//忽略大小寫
  var _msg = msg.toLowerCase();
  var _text = text.toLowerCase();
  if(_msg.includes(_text)){
    return true;
  }
  return false;
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    },
  };

  callSendAPI(messageData);
}

function typing(senderID,active){
  if(active){
    var messageData = {
      "recipient":{
      "id": senderID
    },
      "sender_action":"typing_on"//正在輸入文字的效果，當輸入文字時或是二十秒後會自動停止
  };
  callSendAPI(messageData);

  }
  else{
    var messageData = {
      "recipient":{
      "id": senderID
    },
      "sender_action":"typing_off"//手動停止
  };
  callSendAPI(messageData);

  }
}

function sendImage(senderID, url){
  var messageData = {
    "recipient": {
      "id": senderID
    },
    "message": {
      "attachment": {
        "type": "image",
        "payload": {
        "url": url, 
        }
      }
    },
  }
  callSendAPI(messageData);

}

const sleep = delay => {
  return new Promise(function(resolve) {
    setTimeout(resolve, delay);
  });
};

async function delayTime(sec = 1){//延遲
      await sleep(sec * 1000);
}

function sendVideo(senderID, url){
  var messageData = {
    "recipient": {
      "id": senderID
    },
    "message": {
      "attachment": {
        "type": "video",
        "payload": {
        "url": url, 
        }
      }
    },
  }
  callSendAPI(messageData);

}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "想學東西點我",
            item_url: "https://www.google.com.tw",               
            image_url: "https://i.pinimg.com/originals/01/4c/cf/014ccf7549554c496c6099c4f4f1a6fc.jpg",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "payload0",
            }],
          }, {
            title: "touch",
            subtitle: "想看東西點我",
            item_url: "https://www.youtube.com/",               
            image_url: "https://i.pinimg.com/564x/d7/bd/25/d7bd256379eb355cf6f06cea6a9d2b75.jpg",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "payload1",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}


function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});
