# Submit Twos to the PopClip directory

Prepared on 3 November 2026 against the [official submission instructions](https://www.popclip.app/extensions/submit).

## Prepared files

```text
twos-popclip/
├── LICENSE
├── README.md
├── SUBMISSION.md
├── popclip-directory.yaml
├── source/
│   └── Twos.popclipext/
│       ├── Config.json
│       ├── add.js
│       ├── LICENSE
│       └── README.md
└── tests/
    └── verify.mjs
```

A `.gitignore` is also included. Upload the contents of this folder as the repository root, so `popclip-directory.yaml` is at the root rather than inside an extra folder.

The source package contains the required name, unique identifier, description, and minimum PopClip build. It includes an app website link, keywords, the official Twos logo as a transparent PNG icon, readable JavaScript, a listing readme with a changelog and data-transmission disclosure, a banner, and an MIT license. It uses JavaScript rather than shell scripts and needs no helper executables.

`demo.mp4` is a compressed version of the maintainer's recording. It is 10 seconds long, silent, and framed at 3:2 to fit PopClip's documented Featured demo proportions. It shows text selection, the PopClip action, and the result on Today. The directory automatically detects this file and excludes it from the downloaded installer. Placement in Featured remains at the directory maintainer's discretion.

## Listing guideline review

See [LISTING-REVIEW.md](LISTING-REVIEW.md) for the six-point audit, verified bundle identifier, and Apple signing evidence. The official Mac download is an App Store distribution; a separate Developer ID/notarized build has not been verified, so this exact listing requirement remains for the directory maintainer to assess.

## 1. Live validation

On 3 November 2026, the maintainer confirmed successful testing of the original capture behavior. The preparer did not independently observe that live test. All 78 simulated scenarios pass for version 1.1.0; live verification of its new type, tag, and sublist settings remains outstanding. Use the following checklist:

1. Open `source/Twos.popclipext` with PopClip 2026.8.1 or later. Confirm the extension loads and both API key and destination settings appear.
2. Create a Twos API key with `write:things` permission and, for Sublist, `write:lists`; enter it directly into PopClip's API key field.
3. Select a short test sentence, choose **Today**, and click the **Twos logo**. Confirm the success tick and that exactly one new thing appears on today's Twos list.
4. Choose **Other…**, enter a distinct existing list's exact name, capture a second sentence, and confirm it appears there. If needed, repeat using the list's 24-character ID.
5. Capture text containing line breaks, quotation marks, an ampersand, and an emoji. Confirm it arrives as one thing. Twos may interpret Markdown; the extension does not preserve source rich text.
6. Reopen extension settings and confirm the destination is retained.
7. Try each ordinary type: Dash, To-do, Bullet, Number, and Note. Confirm each saved thing has the selected type.
8. Set the default tag to `reading`, then `#reading`; confirm each capture gets one `#reading` tag. Try text that already includes `#reading` and confirm no duplicate is appended. Clear the setting and confirm no default tag is added.
9. Choose Sublist and capture a short title. Confirm a new list is linked inside the chosen destination. With a default tag, confirm it appears in the title and parent entry. A new list is created on each successful click.

For future updates, record the tested PopClip/macOS versions and observed results when available. Record code changes in the package changelog before tagging.

## 2. Public source repository

The public repository is [ma-burke/twos-popclip](https://github.com/ma-burke/twos-popclip). These source files belong at its root. Repository creation and source upload are separate from submitting the extension to the directory.

Keep the package path `source/Twos.popclipext` and identifier `local.twos.capture.01a1a08c` stable. PopClip permanently associates a submitted extension with its repository, package path, and identifier. The initial personal installer uses the same identifier.

Do not upload your personal API key. It belongs in PopClip's secret setting only.

## 3. Review the agreement and install the GitHub app

The repository owner approved the [submission agreement](https://www.popclip.app/extensions/submit#submission-agreement) and installation on 3 November 2026. It covers permission to distribute, responsibility for maintenance, and the review process.

The [PopClip Directory GitHub app](https://github.com/apps/popclip-directory) is installed with only `ma-burke/twos-popclip` selected. Its permissions are read access to code and metadata and read/write access to checks; it cannot modify the code. Keep this scope when updating the installation.

## 4. Submit version 1.0.0

After the repository files are uploaded and the GitHub app is installed, create a GitHub release with a new tag **v1.0.0** targeting the commit containing these files. Suggested release title: **Twos 1.0.0**.

Suggested release notes:

> Initial release: capture selected text to Today or an existing list in Twos. Includes a saved destination setting, a Keychain-stored API key, and handling for API and connection failures. Requires PopClip 2026.8.1 or later and a Twos API key with write:things permission.

The `v` prefix matches `versionPrefix: v` in `popclip-directory.yaml`. For a local Git workflow with an `origin` already configured and a branch named `main`, the equivalent is:

```sh
git tag v1.0.0
git push origin main v1.0.0
```

This is the submission step. A local tag or uploaded `.popclipextz` alone does not submit the extension.

## 5. Check the result

Open the tagged commit on GitHub and look for **Submission Check** and a comment from the directory app.

- **Received**: automated validation passed; queued for human review.
- **Could not be processed**: read the reported error, fix the source, and push a higher version tag, such as `v1.0.1`.
- **Published**: the comment provides the live extension link. Update the repository README with that link and the publication status.

The directory reads each tag once. Use a new, higher version tag for every resubmission or update. Human review may take several days or longer. Publication and front-page listing are separate decisions; a demo MP4 is needed only for Featured eligibility, not ordinary submission.
