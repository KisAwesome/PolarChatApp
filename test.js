const MimeTypes = require('mime-types')
const fs = require('fs')
const Path = require("path");
const {google} = require('googleapis');

const drive = google.drive({
    version:"v3",
    auth:'AIzaSyCEBXM7F-VAUpF3Ryhik2v7OvLRJRUlnqI'
})



function uploadFile(path){
    var fileMetadata = {
        
        'name': Path.basename(path)
    };
    var media = {
        mimeType: MimeTypes.lookup(path),
        body: fs.createReadStream(path)
    };
    drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, function (err, file) {
        if (err) {
            console.error(err);
        } else {
            console.log('File Id: ', file.id);
        }
    });
}
uploadFile('./server.js')