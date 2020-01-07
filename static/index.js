$(document).ready(async () => {
    // Create identity
    const identity = `tab-${Math.random().toString(36).substring(7)}`;
    $('#tab-identity').text(identity);
    document.title = `${identity}: ${document.title}`;
    console.log('Identity:', identity);

    // Get JWT token
    const getJwtToken = async () => new Promise((resolve, reject) => {
        $('#badge-status').text("Getting token");
        $('#tab-status').text(`Acquiring JWT token for ${identity}`);
    
        $.get(`/token/${identity}`)
            .done(response => {
                console.log("Token: ", response.token);
                $('#tab-status').html(`Got JWT token: <code>${response.token}</code>`);
                resolve(response.token);
            })
            .fail(err => {
                $('#tab-status').text(`Failed to get JWT token: ${JSON.stringify(err)}`);
                $('#badge-status').text("Error");
                console.error("Can't get token:", err);
            });
    });

    // Connect to Sync
    const createSyncClient = async token => new Promise((resolve, reject) => {
        const client = new Twilio.Sync.Client(token, { logLevel: 'info' });

        client.on('connectionStateChanged', function(state) {
            if (state == 'connected') {
                $('#badge-status').text("Connected");
                $('#tab-status').text("Connected, getting current state...");
                resolve(client);
            } else {
                $('#badge-status').text("Error");
                const error = `State changed to '${state}' instead of 'connected'`;
                $('#tab-status').text(error);
                reject(error);
            }
        });
    });

    const token = await getJwtToken();

    const syncClient = await createSyncClient(token);

    // Getting Sync document and subscribing to updates
    syncClient.document('co-browsing').then(doc => {
        if (doc.value.author) {
            $('#input-name').val(doc.value.name);
            $('#input-surname').val(doc.value.surname);
            $('#tab-status').html(`Got values from edited by '${doc.value.author}'`);
        } else {
            $('#tab-status').html(`No one updated values yet`);
        }

        doc.on('updated', () => {
            if (doc.value.author !== identity) {
                $('#input-name').val(doc.value.name);
                $('#input-surname').val(doc.value.surname);
                $('#tab-status').html(`Got values from edited by '${doc.value.author}'`);
            }
        });

        // Listening local changes
        const onUpdate = () => {
            doc.set({
                author: identity,
                name: $('#input-name').val(),
                surname: $('#input-surname').val()
            });
            $('#tab-status').html(`Updated values`);
        };
        $("#input-name").on('input', onUpdate);
        $("#input-surname").on('input', onUpdate);
    });
});