# Twos for PopClip

![Twos website header with a preview of the Today page](source/Twos.popclipext/_images/twos-header.png)

Capture selected text to Today or another existing list in [Twos](https://www.twosapp.com/) (previously NewTwos).

Choose **Today**, or choose **Other…** in the extension settings and enter a list name or ID. Click **2s** in PopClip to save the selection as one thing. The saved destination applies to future captures.

Requires **PopClip 2026.8.1 (build 6221) or later**, internet access, and a Twos personal API key with **write:things** permission. No additional executable or running Twos app is needed.

## Install

Open `source/Twos.popclipext` with PopClip, approve the unsigned source extension, and enter your API key in the extension settings.

See the [extension readme](source/Twos.popclipext/README.md) for full setup, destination behavior, data handling, and troubleshooting.

## Directory submission

Source repository: [ma-burke/twos-popclip](https://github.com/ma-burke/twos-popclip).

Initial release: **v1.0.0**. The PopClip Directory app is installed for this repository. The repository owner approved its access and the submission agreement on 3 November 2026. The tagged commit's **Submission Check** and directory-app comment are the authoritative submission status; directory publication requires human review.

The [submission guide](SUBMISSION.md) follows [PopClip's official submission process](https://www.popclip.app/extensions/submit). The submission is the readable `source/Twos.popclipext` directory, not a zipped installer.

## Development and validation

Run the local checks from this repository's root:

```sh
node tests/verify.mjs
```

Node.js is needed only for these development checks, not for using the extension. The checks use simulated API responses and do not contact Twos or modify an account.

Verified locally: 25 simulated capture scenarios, destination routing, text preservation, error handling, metadata, referenced files, and PopClip submission file-size limits. The maintainer reported a successful live test of the extension on 3 November 2026. That live result was reported by the maintainer, rather than independently observed by the preparer.

The extension uses PopClip's bundled Axios library to send one request to the [Twos API](https://www.twosapp.com/api/v1/openapi.json). No API key is included in this repository.

## License and attribution

[MIT](LICENSE). Independent extension; not an official Twos or PopClip product. The PopClip directory credits the owner of the submitting GitHub repository automatically.

Banner screenshot: [Twos public website](https://www.twosapp.com/), © Twos Technologies Inc. The MIT license applies to this extension's code.
