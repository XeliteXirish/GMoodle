function login() {
    let username = $('#username').val();
    let password = $('#password').val();
    let moodleURL = $('#murl').val();

    let autoRenew = $('#autorenew').val();
    console.log(`Sending request so starting loading screen...`);

    toggleLoading(true);

    $.post(`/apply`, {
        musername: username,
        mpassword: password,
        murl: moodleURL
    }, function (data) {
        console.log(`Recieved data: ${data}`);

        console.log(`Turning loading screen off!`);
        toggleLoading(false);
    })
}

function toggleLoading(show) {
    if (show) $('#loading').attr('class', 'modal is-active');
    else $('#loading').attr('class', 'modal');
}