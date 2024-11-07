// Handle the message inside the webview
window.addEventListener('message', async event => {
    const message = event.data; // The JSON data our extension sent
    const image_json = message.image_json;
    const image_data = document.querySelector('img');

    const texture = PIXI.Texture.from(image_data);
    const background = new PIXI.Sprite(texture);

    const app = new PIXI.Application();
    await app.init({ width: background.width, height: background.height, backgroundAlpha: 0 });

    app.stage.addChild(background);

    // add json coordinate
    Object.entries(image_json.frames).forEach((element, index) => {
        let text = new PIXI.Text({
            text: index,
            style: {
                stroke: {
                    color: 'black',
                    width: 5,
                },
                fontFamily: 'Arial',
                fontSize: 14,
                fill: "yellow",
                align: 'center'
            },
            x: element[1].frame.x,
            y: element[1].frame.y
        });

        app.stage.addChild(text);
    });

    document.body.appendChild(app.canvas);
});