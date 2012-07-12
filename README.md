# api-wrapper.js

## About

While SCORM is a standard in need of [some updating](http://scorm.com/tincan/), some of us still have to use it. The wrapper created by ADL was really only meant as a demo and doesn't include many of the features we think should be there.

  - LMS interaction is batched, instead of real-time. `LMSSetValue` will cache any data you want to send to the LMS. `LMSCommit` loops through the cache and sends the data. _(Why send `cmi.core.lesson_location` every time it changes, we the LMS really only cares about the last value?)_
  - If a learner's status is `not attempted`, automatically set her to `incomplete`.
  - Using an interval, check that the LMS connection is still active. If it is, call `LMSCommit`, if not, throw `onLMSConnectionError` (which you can define and kick the user out of the course).
  - Automatically handle setting `cmi.core.session_time`.
  - Refresh the LMS's "Course Status" page on `LMSFinish` (PeopleSoft ELM only).

At Verizon Wireless, we have a PeopleSoft based LMS and as with any enterprise software, there is just some general weirdness about it. Our wrapper attempts to deal with that. _(As of now, much of this is uncommented, but it shouldn't throw any errors in other LMS implementations.)_

## Usage

`api-wrapper.js` is intended to be a drop in replacement for ADL's wrapper. As a developer, you won't need to change any of your code. Simply overwrite your old API wrapper with this one. (You might need to rename it to `APIWrapper.js`, but the point is that your code doesn't need to change.)

## Limitations

This file attempts to support both `LMSInitialize` and `doLMSInitialize`, so the global namespace is very polluted.

## License

Released under the MIT License. Enjoy!