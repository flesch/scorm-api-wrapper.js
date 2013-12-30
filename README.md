# api-wrapper.js

A drop-in replacement for ADL's original SCORM 1.2 API wrapper.

## About

**api-wrapper.js** includes several changes/improvements that help SCORM 1.2 courses better communicate with an LMS. Overwrite the API wrapper you're currently using with the minified version here - the signutare is the same as ADL's original API wrapper, so you shouldn't need to modify your existing SCORM code.

### Changes

* LMS interaction is batched, instead of real-time. `LMSSetValue` will cache any data you want to send to the LMS. `LMSCommit` loops through the cache and sends the data. _(Why send `cmi.core.lesson_location` every time it changes, we the LMS really only cares about the last value?)_
* If a learner's status is `not attempted`, automatically set them to `incomplete`.
* Using an interval, check that the LMS connection is still active. If it is, call `LMSCommit`, if not, throw `onLMSConnectionError` (which you can define and kick the user out of the course).
* Automatically handle setting `cmi.core.session_time`.
* Refresh the LMS's "Course Status" page on `LMSFinish` (PeopleSoft ELM only).

At Verizon Wireless, we have a PeopleSoft based LMS, and as with any enterprise software, there is just some general weirdness about it. Our wrapper attempts to deal with that. _(As of now, much of this is uncommented, but it shouldn't throw any errors in other LMS implementations.)_


## Developing

`api-wrapper.js` won't work direclty in a course. We're using **Browserify** to include **Underscore** so you need to create a build before testing.

```
$ browserify api-wrapper.js | uglifyjs > api-wrapper-min.js
```


## Limitations

This file attempts to support both `LMSInitialize` and `doLMSInitialize`, so the global namespace is very polluted.


## License

Released under the MIT License. Enjoy!