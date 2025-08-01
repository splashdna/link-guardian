# Link Guardian 🛡️

A privacy-first Thunderbird add-on that protects users from unsafe or unapproved links in email messages.

## Features
- Blocks links not on a central whitelist.
- Highlights blocked links in red with a strikethrough.
- Optional override mode via Ctrl + Alt + Shift + S.
- Manual "Update Whitelist" button.
- Whitelist stored remotely and cached for offline use.

## Getting Started

1. Clone or download this repository.
2. Open Thunderbird and go to `Tools → Add-ons and Themes → Extensions`.
3. Click the gear icon → `Install Add-on From File...`
4. Select the `.zip` of this folder (you can zip it with manifest + JS files).
5. Done! 🎉

## Server Whitelist (Optional)
If you want to host your own whitelist:
- Use `whitelist.php` as a simple endpoint.
- Expected output: a JSON array of approved domains.

## License
MIT © 2025 Edgar Robarts