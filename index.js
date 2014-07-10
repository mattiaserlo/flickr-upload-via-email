var MailListener = require('mail-listener2');
var flickrApi = require('flickr-oauth-and-upload');
var fs = require('fs');

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
 * // This will monitor youremailaddress@gmail.com
 * // and check if subject of incoming emails strictly
 * // matches either of words 'upload' or 'flickr'. If
 * // it does, and if the incoming email is sent
 * // from address youremailaddress@gmail.com,
 * // any attached images will be automatically
 * // uploaded to Flickr.
 * 
 * var listener = require('./index.js');
 * 
 * var arg = {
 *   emailUsername: 'youremailaddress@gmail.com',
 *   emailPassword: '...',
 *   emailHost: 'imap.gmail.com',
 *   emailPort: 993,
 *   flickrConsumerKey: '31...',
 *   flickrConsumerKeySecret: 'aa...',
 *   flickrOauthToken: '11...',
 *   flickrOauthTokenSecret: '22...',
 *   subjects: 'upload,flickr',
 *   strict: 1,
 *   from: 'youremailaddress@gmail.com',
 *   cleanup: 1,
 *   callback: function (err, photoId) {
 *     if (!err) {
 *       console.log('uploaded photo. photoId=' + photoId);
 *     }
 *   }
 * };
 * 
 * listener.createListener(arg);
 * 
 */
var createListener = function (arg) {
  // Read email related args
  var emailUsername = arg['emailUsername'];
  var emailPassword = arg['emailPassword'];
  var emailHost = arg['emailHost'];
  var emailPort = arg['emailPort'] || 993;
  var emailMailbox = arg['emailMailbox'] || 'INBOX';
  // Read Flickr related args
  var flickrConsumerKey = arg['flickrConsumerKey'];
  var flickrConsumerKeySecret = arg['flickrConsumerKeySecret'];
  var flickrOauthToken = arg['flickrOauthToken'];
  var flickrOauthTokenSecret = arg['flickrOauthTokenSecret'];
  // Read optional args
  var subjects = arg['subjects'] || null;
  if (subjects) {
    subjects = subjects.split(',');
  }
  var from = arg['from'] || null;
  if (from) {
    from = from.split(',');
  }
  var cleanup = arg['cleanup'] || null;
  var strict = arg['strict'] || null;
  var callback = arg['callback'] || null;

  var mailListener = new MailListener({
    username: emailUsername,
    password: emailPassword,
    host: emailHost,
    port: emailPort,
    tls: true,
    tlsOptions: { rejectUnauthorized: true },
    mailbox: emailMailbox,
    markSeen: true,
    attachmentOptions: {directory: './'},
    mailParserOptions: {streamAttachments: true}
  });

  console.log('maillistener start');
  mailListener.start();

  mailListener.on('server:connected', function () {
    console.log('imap connected');
  });

  mailListener.on('server:disconnected', function () {
    console.log('imap disconnected');
  });

  mailListener.on('mail:arrived', function (id) {
    console.log('new mail arrived with id:' + id);
  });

  var matches = function (str, key) {
    if (strict) {
      return str === key;
    } else {
      if (str.toLowerCase().indexOf(key.toLowerCase()) > -1) {
        return true;
      } else {
        return false;
      }
    }
  };

  mailListener.on('mail', function (mail, seqno, attributes) {
    var i, j;
    var upload = true;

    console.log('mail arrived');

    // If there is a from filter, check who the mail comes from
    if (from) {
      upload = false;
      var fromArray = mail['from'];
      var firstElem = fromArray[0];
 
      for (i=0; i<from.length; i++) {
        if (firstElem['address'].toLowerCase().indexOf(from[i].toLowerCase()) > -1) {
          upload = true;
          break;
        }
      }
    }

    if (upload) {
      for (i=0; i<mail.attachments.length; i++) {
        if (subjects) {
          for (j=0; j<subjects.length; j++) {
            if (mail.subject &&
                matches(mail.subject, subjects[j])) {
              mail.attachments[i].doUpload = true;
            }
          }
        } else {
          // No subject filter selected
          mail.attachments[i].doUpload = true;
        }
      }
    }
  });

  mailListener.on('attachment', function (attachment) {
    if (attachment.doUpload && attachment.contentType.indexOf('image') > -1) {
      upload(attachment.path, attachment.fileName);
    }
  });

  var upload = function (path, fileName) {
    console.log('upload ' + path);
    var myCallback = function (err, photoId) {
      if (!err) {
        console.log('done uploading ' + path);
        if (cleanup) {
          fs.unlink(path, function () {
            console.log('deleted ' + path);
          });
        }
        if (callback && (callback instanceof Function)) {
          callback(null, photoId);
        }
      } else {
        if (callback && (callback instanceof Function)) {
          callback(err, null);
        }
      }
    };

    var args = {
      path: path,
      flickrConsumerKey: flickrConsumerKey,
      flickrConsumerKeySecret: flickrConsumerKeySecret,
      oauthToken: flickrOauthToken,
      oauthTokenSecret: flickrOauthTokenSecret,
      callback: myCallback,
      optionalArgs: {title: fileName}
    };

    flickrApi.uploadPhoto(args);
  };
};

exports.createListener = createListener;

