const app = {};


//Initialise Function
app.init = function () {
    app.event();
}


//Query Call to Initliase Function
$(app.init);


//API Authentication
const clientId = 'd12d1d0c59e2496286961f98e3181ce3';
const clientSecret = '44e67f990f2c44039a0dbcb1195738b6';
var token = 'Bearer ';
app.apiurl = 'https://api.spotify.com/v1';

app.getToken = async () => {
    const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
    });

    const data = await result.json();
    token = token.concat(data.access_token);
}


//Function for processes the input query to the API Parameters
app.event = function () {
    app.getToken();

    $('form').on('submit', function(e){
        e.preventDefault();
        
        let artists = $('input[type=search]').val();
        $('.loader').addClass('show');
        artists = artists.split(',');
        
        let search = artists.map(artistName => app.searchArtist(artistName, token))
        app.getArtistId(search, token);
    });
}


//API Calls and Support Functions

//Searches for the inputed Artists
app.searchArtist = (artistName, token) => $.ajax({
    url: `${app.apiurl}/search`,
    method: 'GET',
    datatype: 'json',
    headers: {
        'Authorization' : token
    },
    data: {
        q: artistName,
        type: 'artist'
    }
});


//Returns the ID of the Artist from the API call returned Data
app.getArtistId = (artistName, token) => {
    $.when(...artistName)
        .then((...results) => {
            results = results.map(getFirstElement)
                .map(res => res.artists.items[0].id)
                .map(id => app.getArtistAlbum(id, token));

            app.getAlbumId(results, token);
        });
}


//Returns the Artist's Albums
app.getArtistAlbum = (artistId, token) =>  $.ajax ({
    url: `${app.apiurl}/artists/${artistId}/albums`,
    method: 'GET',
    headers: {
        'Authorization' : token
    },
    dataType: 'json',
    data: {
        album_type: 'album'
    }
});


//Returns the Album IDs from the API call returned Data.
app.getAlbumId = function(artistAlbums, token) {
    $.when(...artistAlbums)
        .then((...tracks) =>  {
            tracks = tracks.map(getFirstElement)
                .map(res => res.items)
                .reduce(flatten, [])
                .map(album => album.id)
                .map(id => app.getArtistTracks(id, token));
            
            app.buildPlaylist(tracks);
        });
}


//Gets the tracks from the Artist's Albums
app.getArtistTracks = (AlbumId, token) => $.ajax({
    url: `${app.apiurl}/albums/${AlbumId}/tracks`,
    method: 'GET',
    headers: {
        'Authorization' : token
    },
    datatype: 'json'
});


//Builds the playlist with tracks from the user inputed Artists
app.buildPlaylist = function (tracks) {
    $.when(...tracks)
        .then((...trackResults) => {
            trackResults = trackResults.map(getFirstElement)
                .map(trackItem => trackItem.items)
                .reduce(flatten, [])
                .map(item => item.id);

            const randTracks = [];
            for (var i = 0; i < 10; i++) {
                randTracks.push(getRandomTrack(trackResults));
                const plURL = `https://open.spotify.com/embed/track/${randTracks[i]}?utm_source=generator`;
                $(`.p${i+1}`).html(`<iframe src="${plURL}" height="50"></iframe`);
            }
        });
}


//helper functions

const getFirstElement = (item) => item[0];

const flatten = (prev, cur) => [...prev, ...cur];

const getRandomTrack = (trackRecord) => {
    const randNum = Math.floor(Math.random() * trackRecord.length);
    return trackRecord[randNum];
}