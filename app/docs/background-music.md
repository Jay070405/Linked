# Background music

- Supplied by the user: `晴日の調べ.mp3`.
- Website copy: `clear-day-melody.mp3`; copied without re-encoding.
- Bytes: 4,304,503.
- SHA-256 (source and copy): `13C863F2F712621F0A483F79263D19D438B87FCE9EFDFD0ECFD248AD2DF87F9A`.
- Source metadata, Windows property reader: 181.896 seconds, 48,000 Hz, stereo, approximately 188 kbps. Browser decoded duration: 181.8535 seconds.

The user requested default quiet playback. The controller requests a 0.14 output level, fades in over 1.2 seconds, fades out over 0.55 seconds, and remembers an explicit on/off choice. Blocked autoplay is shown as WAIT until playback is actually available; the music button and a trusted first page interaction can retry. A closed preference is never re-enabled by incidental gestures. Page visibility pauses/resumes without seeking, and language or in-app route changes retain the single audio element.

Where HTML media volume is writable it controls the level directly. A GainNode is used only when a browser refuses media-volume changes. Safari `interrupted` and `suspended` contexts both use `resume()`. The gain fallback has controller tests; physical iOS hardware was not available for this pass.

Technical references: [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [play() Promise](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play), [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [interrupted audio contexts in Safari](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state#resuming_interrupted_play_states_in_ios_safari).

