flickr-upload-via-email
=======================

Library that monitors an IMAP email account and auto-uploads image attachments to Flickr  
  
## Installation

    npm install flickr-upload-via-email --save

## Usage

    /**
     * This function creates an imap email listener that monitors
     * incoming emails to a certain user, and uploads attached
     * images to Flickr.
     *
     * You can set a filter so that only emails coming from certain
     * addresses are handled, and/or emails with certain subjects.
     *
     * Note that to use this, you must have access to authorized
     * oauth token and oauth token secret for the Flickr user you
     * wish the images to be uploaded to. You also need to create
     * a Flickr app on Flickr's developer pages, so that you get
     * access to 'Flickr app consumer key' and 'Flickr app consumer
     * key secret' credentials.
     * See https://www.flickr.com/services/developer/
     *
     * If you want help with getting access to authorized oauth
     * token and oauth token secret credentials, see
     * https://www.npmjs.org/package/flickr-oauth-and-upload
     * 
     * For parameters and example usage, see below.
     * 
     * Optional parameters:
     * 'subjects': an optional comma-separated list of words
     * to look for in the subject line. If this is set, and
     * subject does not match, the image will not be used
     * for upload.
     * 'strict': if set to 1, the email subject will have
     * to strictly match any of the 'subjects'.
     *  (Non-strict matching means case insensitive and
     * string length insensitive.)
     * 'from': a comma-separated list of email addresses to
     * look for. If this is set, and if 'from' addresses do
     * not match, the email will not be used for upload.
     * 'cleanup': if set to 1, the attached images will be
     * stored only temporarily on the file system, and as
     * soon as an image has been uploaded it will be locally
     * deleted.
     * 'callback': an optional callback with two arguments,
     * err and photoId. In the successful case, the callback
     * will be called with photoId set to the unique Flickr
     * photo id that has been assigned to the uploaded image.
     *
     *
     * Example of usage:
     * 
     * This will monitor youremailaddress@gmail.com
     * and check if subject of incoming emails strictly
     * matches either of words 'upload' or 'flickr'. If
     * it does, and if the incoming email is sent
     * from address youremailaddress@gmail.com,
     * any attached images will be automatically
     * uploaded to Flickr.
     */ 
     var listener = require('flickr-upload-via-email');
     
     var arg = {
       emailUsername: 'youremailaddress@gmail.com',
       emailPassword: '...',
       emailHost: 'imap.gmail.com',
       emailPort: 993,
       flickrConsumerKey: '31...',
       flickrConsumerKeySecret: 'aa...',
       flickrOauthToken: '11...',
       flickrOauthTokenSecret: '22...',
       subjects: 'upload,flickr',
       strict: 1,
       from: 'youremailaddress@gmail.com',
       cleanup: 1,
       callback: function (err, photoId) {
         if (!err) {
           console.log('uploaded photo. photoId=' + photoId);
         }
       }
     };
     
     listener.createListener(arg);
  
  
## Notes / TODO
  
  
## Tests

npm test  
TODO write test cases

## License

BSD-2-Clause

## Release History

* 0.1.1 Documentation
* 0.1.0 Initial release

