var notification = {
    senderId: '164032443416',

    notificationBase: function (title, message) {
        this.type = 'basic';
        this.iconUrl = 'icon.png';
    },

    turnOn: function (type) {
        formStorage.retrieve('gcm-registered', function (registered) {
            var registeredOperation = function () {
                formStorage.save(type + '-notification', true);
            }

            if (!registered) {
                chrome.gcm.register([notification.senderId], function (result) {
                    if (chrome.runtime.lastError) {
                        console.log('gcm register error:' + chrome.runtime.lastError);
                    } else {
                        formStorage.retrieve(type + '-form-preset', function (data) {
                            $.ajax({
                                url: 'https://gnibirpandvisaappointmentservice.azurewebsites.net/api/Subscribe',
                                method: 'POST',
                                data: JSON.stringify({
                                    gcmToken: result
                                }),
                                dataType: "json",
                                contentType: 'application/json',
                                success: function () {
                                    formStorage.save("gcmToken", result, function () {
                                        //Add GCM message listener
                                        chrome.gcm.onMessage.addListener(function (message) {
                                            //Create chrome notification
                                            chrome.notifications.create('2018', {
                                                type: "basic",
                                                iconUrl: 'icon.png',
                                                title: message.data.title,
                                                message: message.data.information,
                                                buttons: [{
                                                    title: "Appoint"
                                                }, {
                                                    title: "Ignore"
                                                }],
                                                isClickable: true
                                            });
                                            //Listen notification button
                                            chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
                                                chrome.notifications.clear(notificationId);
                                            });
                                        });

                                        registeredOperation();
                                    });
                                }
                            });
                        });
                    }
                });
            } else {
                registeredOperation();
            }
        });
    },

    turnOff: function (type) {
        chrome.gcm.unregister(function () {
            formStorage.retrieve("gcmToken", function (gcmToken) {
                var unsubscribeUrl = "https://gnibirpandvisaappointmentservice.azurewebsites.net/api/Unsubscribe/{type}/{key}?code=Ho4tYiGSvGcsQmOtUE77ln9SIB7B2zbrjCZDfWumqltbKRFmPjNlDw==";
                unsubscribeUrl = unsubscribeUrl.replace("{type}", "GCM").replace("{key}", gcmToken);
                $.post(unsubscribeUrl, function () {
                    formStorage.save(type + '-notification', false);
                })
            });
        });
    },

    getStatus: function (type, callback) {
        formStorage.retrieve(type + '-notification', callback);
    },

    setSwitch: function (input) {
        if (input.type == 'checkbox') {
            var type = input.getAttribute('notification-type');

            notification.getStatus(type, function (currentStatus) {
                input.checked = currentStatus;
                $(input).change(function () {
                    notification[input.checked ? 'turnOn' : 'turnOff'](type); 
                });
            });
        }
    }
}