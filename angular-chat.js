/***
 * File: angular-chat.js
 * Author: Jade Krafsig
 * Source: design1online.com, LLC
 * License: GNU Public License
 ***/

/***
 * Purpose: load bootstrap ui angular modules
 * Precondition: none
 * Postcondition: modules loaded
 ***/
angular.module('angular_chat', ['ui.bootstrap', 'directive.colorPicker']);

/***
 * Purpose: load the existing chat logs
 * Precondition: none
 * Postcondition: chat logs have been loaded
 ***/
function chatCtrl($scope, $http) { 
  
  /***
   * Configurable global variables
   ***/
  $scope.messageLimit = 50;
  $scope.defaultUsername = "Guest";
  $scope.selectedColor = "#000000";
  
  $scope.chatChannels = [
    {
      text: "Basic Channel",
      value: "angular_chat", 
      default: true
    },
    {
      text: "Advanced Channel",
      value: "angular_chat_advanced"
    },
  ];
  
  $scope.emoticon_url = "http://www.freesmileys.org/smileys/smiley-basic/";
  $scope.emoticons = {
    ':-)' : 'biggrin.gif',
    ':)' : 'biggrin.gif',
    ':D' : 'laugh.gif',
    ':-D' : 'laugh.gif',
    ':-|' : 'mellow.gif',
    ':|' : 'mellow.gif',
    ':-p' : 'tongue.gif',
    ':p' : 'tongue.gif',
    ':-(' : 'sad.gif',
    ':(' : 'sad.gif'
  };
  
  /***
   * Static global variables, do not change
   ***/
  $scope.loggedIn = false;
  $scope.errorMsg;
  $scope.realtimeStatus = 0;
  $scope.toggleEmoticons = false;
  
  /***
   * Purpose: clear the message object
   * Precondition: none
   * Postcondition: message object has been reset
   ***/
  $scope.clearMsg = function() {
    $scope.message = {
      username: $scope.defaultUsername,
      email: 'n/a',
      text: ''
    };
  }
  
  /***
   * Purpose: listen for a font color change broadcast
   * Precondition: color value
   * Postcondition: selected color has been set
   ***/
  $scope.$on('colorChange', function(obj, color){
    $scope.selectedColor = color;
  });    
  
  /***
   * Purpose: load the existing chat logs
   * Precondition: none
   * Postcondition: chat logs have been loaded
   ***/
  $scope.chatLogs = function() {
    PUBNUB.history( {
      channel : $scope.selectedChannel,
      limit   : $scope.messageLimit
    }, function(messages) {
      // Shows All Messages
      $scope.$apply(function(){
        $scope.chatMessages = messages.reverse();          
      }); 
    });
   }
  
  /***
   * Purpose: load the existing chat logs
   * Precondition: none
   * Postcondition: chat logs have been loaded
   ***/
   $scope.attemptLogin = function() {
    $scope.errorMsg = "";
    
    if (!$scope.message.username) {
      $scope.errorMsg = "You must enter a username.";
      return;
    }

    if (!$scope.realtimeStatus) {
      $scope.errorMsg = "You're not connect to PubNub.";
      return;
    }

    $scope.loggedIn = true;
   }

  /***
   * Purpose: remove error message formatting when the message input changes
   * Precondition: none
   * Postcondition: error message class removed from message input
   ***/
  $scope.$watch('message.text', function(newValue, oldValue) {
    if (newValue) {
      $("#inputMessage").removeClass("error");
      $scope.errorMsg = "";
    }
  }, true);
  
  /***
   * Purpose: trying to post a message to the chat
   * Precondition: loggedIn
   * Postcondition: message added to chatMessages and sent to chatLog
   ***/
  $scope.postMessage = function() {

    //make sure they are logged in
    if (!$scope.loggedIn) {
      $scope.errorMsg = "You must login first.";
      return;
    }
    
    //make sure they enter a chat message
    if (!$scope.message.text) {
      $scope.errorMsg = "You must enter a message.";
      $("#inputMessage").addClass("error");
      return;
    }
    
    //set the message date
    d = new Date();
    $scope.message.date = d.getDay() + "/" + d.getMonth() + "/" + d.getFullYear();
    $scope.message.time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
   
    //change font color
    $scope.message.color = $scope.selectedColor;
    
    //replace hyperlinks with clickable urls
    $scope.message.text = $scope.replaceURLWithLink($scope.message.text);
    
    //replace smileys
    $scope.message.text = $scope.replaceEmoticons($scope.message.text);

    //send the message to the selected channel
    PUBNUB.publish({
      channel : $scope.selectedChannel,
      message : $scope.message
    });
    
    //reset the message input box
    $scope.message.text = "";
  };
  
  /***
   * Purpose: connect and access pubnub channel
   * Preconditions: pubnub js file init
   * Postconditions: pubnub is waiting and ready
   ***/
  $scope.initChat = function(newChannel) {
    if (newChannel)
      $scope.selectedChannel = newChannel;
      
    if (!$scope.chatChannels.length) {
      $scope.errorMsg = "Missing chat channels, check config.";
      return;
    }
    
    if (!$scope.selectedChannel) {
      $scope.errorMsg = "You must select a channel.";
      return;
    }
    
    //clear out any chat messages from a previous channel
    $scope.chatMessages = Array();
    
    //unsubscribe to the active channel
    angular.forEach($scope.chatChannels, function(channel, key){
      PUBNUB.unsubscribe({channel: channel.value});
    });
    
    //subscribe to the selected channel
    PUBNUB.subscribe({
      channel    : $scope.selectedChannel,
      restore    : false, 
      callback   : function(message) { 
          //update messages with the new message
          $scope.$apply(function(){
          $scope.chatMessages.unshift(message);          
        }); 
      },
      
      error      : function(data) {
        $scope.errorMsg = data;
      },
      
      disconnect : function() {   
        $scope.$apply(function(){
          $scope.realtimeStatus = 0;
        });
      },
  
      reconnect  : function() {   
        $scope.$apply(function(){
          $scope.realtimeStatus = 1;
        });
      },
  
      connect    : function() {
        $scope.$apply(function(){
          $scope.realtimeStatus = 2;
          //load the chat logs
          $scope.chatLogs();
        });
      }
    });
  }
  
  /***
   * Purpose: trying to post a message to the chat
   * Precondition: loggedIn
   * Postcondition: message added to chatMessages and sent to chatLog
   ***/
  $scope.attemptLogout = function() {
    $("#inputMessage").removeClass("error");
    $scope.clearMsg();
    $scope.loggedIn = false;
  }
  
  /***
   * Purpose: set the chat channel to the default channel value
   * Precondition: at least one channel defined
   * Postcondition: selectedChannel set to the default
   ***/
  $scope.defaultChannel = function() {
    var chatChannel;
    
    angular.forEach($scope.chatChannels, function(channel, key){

     if (!chatChannel)
      chatChannel = channel;
    
     if (channel.default) {
      chatChannel = channel;
      return;
     }
    });

    $scope.selectedChannel = chatChannel.value;
  }
  
  /***
   * Purpose: add an emoticon to the message input
   * Precondition: emoticon has been selected
   * Postcondition: emoticon value appended to message input
   ***/
  $scope.insertEmoticon = function(selected) {
    $scope.message.text = $scope.message.text + " " + selected + " ";
  }
  
  /***
   * Purpose: regex to replace emoticons with image html
   * Precondition: text to replace emoticons in
   * Postcondition: any emoticons found have been replaced with html images
   ***/
  $scope.replaceEmoticons = function(text) {
    patterns = [];
    metachars = /[[\]{}()*+?.\\|^$\-,&#\s]/g;
  
    // build a regex pattern for each defined property
    for (var i in $scope.emoticons) {
      if ($scope.emoticons.hasOwnProperty(i)){ // escape metacharacters
        patterns.push('('+i.replace(metachars, "\\$&")+')');
      }
    }
  
    // build the regular expression and replace
    return text.replace(new RegExp(patterns.join('|'),'g'), function (match) {
      return typeof $scope.emoticons[match] != 'undefined' ?
        '<img src="'+$scope.emoticon_url+$scope.emoticons[match]+'"/>' :
        match;
    });
  }
  
  /***
   * Purpose: replace url text with a clickable link (opens in a new window)
   * Precondition: text to replace urls in
   * Postcondition: urls have been replaced with a clickable hyperlink
   ***/
  $scope.replaceURLWithLink = function(text) {
    var exp = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp,"<a href='$1' target='_blank'>$1</a>"); 
  }

  /***
   * Purpose: Initialize the chatroom
   * Preconditions: none
   * Postconditions: none
   ***/
  $scope.clearMsg();
  $scope.defaultChannel();
  $scope.initChat();

}
