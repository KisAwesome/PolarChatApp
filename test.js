const MimeTypes = require('mime-types')
const fs = require('fs')
const Path = require("path");
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive', 'profile'];


const auth = new google.auth.GoogleAuth({
    keyFile: './polarbeach-chatapp-d834d6552ed7.json',
    scopes: SCOPES
});
const driveService = google.drive({version: 'v3', auth});



function uploadFile(path){
    var fileMetadata = {
        name: Path.basename(path)
    };
    var media = {
        mimeType: MimeTypes.lookup(path),
        body: fs.createReadStream(path)
    };


    console.log(media.mimeType)
    driveService.files.create({
        resource: fileMetadata, 
        media: media,
        fields: 'id'
    }, function (err, file) {
        if (err) {
            console.error(err);
        } else {
            console.log('File Id: ', file.data.id);
        }
    });
}



uploadFile('./server.js')
// async function x(){

//     let fid = '1QJ3WG_YZy34W9MvtfUs4hH4AvQRcSiNx'
    
//     const res = await driveService.files.get({
//         fileId:fid,
//         fields:'webContentLink, webViewLink'
//     })
    
//     console.log(res)
// }
// x()