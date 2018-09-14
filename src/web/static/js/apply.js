function login() {
    let username = $('#username').val();
    let password = $('#password').val();
    let moodleURL = $('#murl').val();

    let autoRenew = $('#autorenew').val();
    console.log(`Sending request so starting loading screen...`);

    toggleLoading(true);
    toggleSuccessfulNotification(false);
    toggleErrorNotification(false);

    $.post(`/apply`, {
        musername: username,
        mpassword: password,
        murl: moodleURL
    }, function (res) {
        console.log(`Received data: ${res}`);

        toggleErrorNotification(false);
        toggleSuccessfulNotification(true, res);

        console.log(`Turning loading screen off!`);
        toggleLoading(false);
    }).fail(res => {
        console.error(`Apply error'd with response: ${res.responseText}`);

        toggleSuccessfulNotification(false);
        toggleErrorNotification(true, res.responseText);

        console.log(`Turning loading screen off!`);
        toggleLoading(false);
    })
}

function toggleLoading(show) {
    if (show) $('#loading').attr('class', 'modal is-active');
    else $('#loading').attr('class', 'modal');
}

function toggleSuccessfulNotification(show, text) {
    const notif = $('#infoNotification');
    if (show) notif.show();
    else notif.hide();

    notif.text(`Successful: ${text}`);
}

function toggleErrorNotification(show, text) {
    const notif = $('#errorNotification');
    if (show) notif.show();
    else notif.hide();


    notif.text(`An error occurred: ${text}`);
}