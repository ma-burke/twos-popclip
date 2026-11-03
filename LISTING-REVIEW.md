# PopClip listing review

Reviewed on 3 November 2026 against the [listing guidelines](https://www.popclip.app/extensions/submit#listing-guidelines) and [app metadata reference](https://www.popclip.app/dev/actions#the-app-dictionary).

| Guideline | Review result |
| --- | --- |
| Clear single purpose | One action: add selected text to Today or a saved list in Twos. Type and tag settings configure that same capture action. Name: Twos. Description: “Add selected text to Today or another list in Twos.” |
| Good presentation | Official proportional transparent Twos mark; concise description; setup, usage, permissions, privacy, failure handling, changelog, inline GIF, and silent MP4 demonstration. Artwork attribution is separate from the code license. |
| No helper executables | Runtime is readable JavaScript using Axios supplied by PopClip. No shell scripts, Python, Node.js, Xcode tools, or installed Twos desktop app are required for capture. PopClip, internet access, a Twos account, and an API key are required. Node.js is only a developer test dependency. |
| Open-source license | MIT LICENSE present at the repository root and in the extension package. |
| App metadata | app.name = Twos; app.link = https://www.twosapp.com/; app.bundleIdentifiers includes com.ionicframework.up335358, verified from the installed official Mac app. checkInstalled = false because the REST API works without the native app. |
| Linked-app signing and notarization | **Exact Developer ID/notarization wording not independently established.** The official [Mac download](https://www.twosapp.com/download) currently links to the [Mac App Store](https://apps.apple.com/us/app/twos-quick-notes-lists/id1097350934?mt=12). The installed copy is Apple-signed and Gatekeeper-accepted with source “Mac App Store”; this is different evidence from a Developer ID signed, notarized standalone build. The directory maintainer must determine whether this App Store distribution satisfies the listing policy. |

## Signing evidence

Read-only checks on the installed Twos 1.21.3 app:

- Bundle identifier: com.ionicframework.up335358
- Signing authority: Apple Mac OS Application Signing → Apple Worldwide Developer Relations Certification Authority → Apple Root CA
- Team identifier: 6G79XK5AL4
- Gatekeeper assessment: accepted; source=Mac App Store

These results describe this installed build, not every historical Twos release. No standalone Developer ID build was offered by the official Mac download page at review time. No notarization claim has been inferred from App Store acceptance.

## Verification and remaining review

- Package metadata, limits, and 78 simulated API scenarios pass using `node tests/verify.mjs`.
- The maintainer reported a successful live test of original capture behavior. Live verification of the later type, tag, and sublist options remains outstanding; simulated checks are not live service tests.
- Source package path, identifier, and submission configuration remain stable.
- A higher version tag is required for the directory to ingest metadata changes.
- Publication and front-page listing are separate manual decisions. This audit does not guarantee either. The linked-app distribution point above remains for directory review.
