# Splat Booth on Facebook Instant Games

`splat-booth-instant.zip` is the game packaged for Facebook. Upload it as it is.

## What's different in the Facebook version
- It loads Facebook's Instant Games SDK (version 8.0) and starts the game when Facebook says it's ready.
- The high score is saved to the player's Facebook game data, so it follows them across devices.
- After a round, a **Share score** button posts a score card image. The card never includes the uploaded face, so nobody's photo gets shared.
- **Leaderboard:** when the game is opened from a chat or group, each round's score is posted to that chat's leaderboard (Facebook keeps every player's best). The **Leaderboard** button shows the Top 10 and your own rank. Meta only offers per-chat ("contextual") boards now, so in solo play the button stays hidden. With SDK 8.0 Facebook no longer gives games the players' names, so other rows show "Player" and your row shows "You".
- Fonts are bundled inside the zip, so the game loads nothing from outside Facebook.

The browser version (`../index.html`) is the same game. It switches these features on only when it runs inside Facebook.

## Rebuild after changing the game
```
python3 splat-booth/instant/build.py
```
This rewrites `splat-booth-instant.zip`. Edit `../index.html`, never the copy in `dist/`.

## Getting it onto Facebook
Images, listing text and the privacy policy link are ready in `LAUNCH.md`.
You'll need a computer for these steps.

1. **Create a developer account** at developers.facebook.com (free) and verify it.
2. **Create an app.** Choose the gaming / Instant Games option and name it "Splat Booth".
3. **Apply to the Approved Partner Program.** This is a one-time application Meta requires before any Instant Game can go live.
4. **Create the leaderboard.** In the app dashboard go to Use cases → Launch an Instant Game → Leaderboards, and under "Create contextual leaderboard" enter:
   - Name: `splat_booth_best` (exactly this, or the game can't find it)
   - Sort order: higher is better
   - Score format: numeric
5. **Upload the bundle.** In the app dashboard go to Instant Games → Web Hosting, upload `splat-booth-instant.zip`, then click **Push to Testing**.
6. **Test on your phone.** Add yourself as a tester and open the game from the Facebook app. Check:
   - Upload face opens the photo picker inside Facebook's app (this can't be tested outside Facebook)
   - the high score is still there after closing and reopening the game
   - Share score posts the score card
   - when opened from a chat or group, the Leaderboard button shows your score and rank after a round
7. **Fill in the listing:** an icon, screenshots, a description, a category, and a **privacy policy URL** (required, because players can pick photos).
8. **Submit for review.** Once it's approved, move the build from Testing to **Production**.

## Review tips
Meta's rules forbid bullying and harassment, so present the game as playful stress relief:
- Use the sample cartoon face and the Cartoon filter in your screenshots, not a real person.
- In the description, say photos stay on the device and are never uploaded or shared.
- Keep the "only use faces you have permission to use" note in the game.

## Fonts
Bungee and Rubik are from Google Fonts, under the SIL Open Font License 1.1, which allows bundling them with the game.
