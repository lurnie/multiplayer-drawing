# Multiplayer Drawing
A website to draw together with others. A prompt is randomly chosen, and you have 2 minutes to draw before the canvas resets.
## Use
To use, you will need to self-host the project. Download the repository, then navigate into the project directory and type `npm install` in the terminal. Finally, navigate to the `server` directory and use [node.js](https://nodejs.org/en) by typing `node .` or `node index.js`. The website should be available on http://localhost:3000/. You can use a service such as [TryCloudFlare](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) to generate a free temporary url so that others can use it with you.

## Known bugs
- On mobile, using more than 2 fingers to draw doesn't work correctly
- Some people get disconnected right when they start drawing, which stops their drawings from being visible