

var localUserName;// user name which uses the chat
var selectedUserToChat;// user name which have been selected to chat with
var currentChatWith;// user name which the local user is talking with



//aux func for getting an element
var element = function (id) {
    return document.getElementById(id);
}

//validate login form request

function validateForm() {
    if ($("#userNameLogin").val().length < 1 || $("#userPasswordLogin").val().length < 1) {
        return false;
    }
    else {
        return true;
    }
}

//show error in case login detailes are incorrect

function showError(error) {
    $("#form-error").html(error);
    $("#form-error").show();
}

//func open's chat window when user selected from menu

function openChatWith(userName) {
    selectedUserToChat = userName;
    currentChatWith = userName;
    console.log("sleceted user to chat:");
    console.log(selectedUserToChat);
    console.log("current chat with:");
    console.log(currentChatWith);

  

    setTimeout(() => {
        $("#chat-box").show();
    }, 500);
}


$("#sign-in").on('click', function () {
    //sends the form for joining, shows error if something is not valid.
    if (validateForm()) {
        console.log("Form validated, now check detailes");
        socket.emit('new connection', {
            userName: $("#userNameLogin").val(),
            userPassword: $("#userPasswordLogin").val()
        }, function (valid) {
            if (valid) {
                $("#h2Hello").html("Hello "+ $("#userNameLogin").val() + "!");
                //saving the user name for this chap app
                localUserName = $("#userNameLogin").val();
                $("#form").fadeOut(1000, () => {
                    $("#chat-page").fadeIn(1000);
                });
            }
            else {
                showError('The user name or password is incorrect');
            }
        });
    }
    else {
        showError('Make sure your form is valid!');
    }
});


//Get Element
var connectedUsersList = element('connectedUsers');
var messages = element('messages');
var textarea = element('textarea');
var username = element('username');
var clear = element('clear');




//Connect to socket.io
var socket = io.connect();

//Check for connection
if (socket != undefined) {
    console.log('Connected to socket...');

    socket.on('update connected users', function (data) {
        connectedUsersList.textContent = "";

        if (data.connectedUsers.length > 1) {
            for (var userToChat in data.connectedUsers) {
                if (data.connectedUsers[userToChat] == localUserName) {
                    continue;
                }
                var connectedUser = document.createElement('a');
                connectedUser.setAttribute('class', 'list-group-item list-group-item-action list-group-item-primary');
                connectedUser.setAttribute('onclick', 'openChatWith("' + data.connectedUsers[userToChat] + '")');
                connectedUser.setAttribute('color', 'black');
                connectedUser.textContent = data.connectedUsers[userToChat];
                connectedUsersList.appendChild(connectedUser);
                connectedUsersList.insertBefore(connectedUser, connectedUsersList.firstChild);
            }

        } else {// no other users online
            var connectedUser = document.createElement('a');
            connectedUser.setAttribute('class', 'list-group-item list-group-item-action list-group-item-primary');
            connectedUser.textContent = "No other connected Users!";
            connectedUsersList.appendChild(connectedUser);
            connectedUsersList.insertBefore(connectedUser, connectedUsersList.firstChild);
        }
    });

    //Handle new message

    socket.on('new message', function (data) {
        if (data.from != localUserName) {
            currentChatWith = data.from;
        }
        if (data.message.length) {
            for (var messageBlock in data.message) {
                //Build out message div
                let userName = data.message[messageBlock][0];
                let theMessage = data.message[messageBlock][1];
                var message = document.createElement('div');
                message.setAttribute('class', 'chat-message');
                message.textContent = userName + ": " + theMessage;
                messages.appendChild(message);
                messages.insertBefore(message, messages.firstChild);
            }
            if (!$("#chat-box").is(":visible")) {
                setTimeout(() => {
                    $("#chat-box").show();
                }, 1000);
            }

        }
    });


    //Handle Output
    socket.on('output', function (data) {
        if (data.from != localUserName) {
            currentChatWith = data.from;
        }
        if (data.Messages.length) {
            for (var messageBlock in data.Messages) {
                //Build out message div
                let userName = data.Messages[messageBlock][0];
                let theMessage = data.Messages[messageBlock][1];
                var message = document.createElement('div');
                message.setAttribute('class', 'chat-message');
                message.textContent = userName + ": " + theMessage;
                messages.appendChild(message);
                messages.insertBefore(message, messages.firstChild);
            }

        }
    });



    //Handle Input
    textarea.addEventListener('keydown', function (event) {
        if (event.which === 13 && event.shiftKey == false) {
            console.log("pressed enter");

            //Emit to server input
            socket.emit('input', {
                message: textarea.value,
                from: localUserName,
                to: currentChatWith
            });

            $("#textarea").val('').blur();

            event.preventDefault();
        }
    });

    //Handle send button
    send.addEventListener('click', function () {
        socket.emit('input', {
            message: textarea.value,
            from: localUserName,
            to: currentChatWith
        });

        $("#textarea").val('').blur();
    });

    //Handle Chat Clear
    clear.addEventListener('click', function () {
        socket.emit('clear');
    });

    //clear message
    socket.on('cleared', function () {
        messages.textContent = "";
    });

}

