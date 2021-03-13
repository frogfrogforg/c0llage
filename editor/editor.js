function main() {
    // Background image selection
    const inputElement = document.getElementById("background-image-input");
    const backgroundElement = document.getElementById("background");
    inputElement.addEventListener("change", setBackgroundImage, false);
    function setBackgroundImage() {
        const file = this.files[0];
        window.backgroundImageFilename = file.name;

        const reader = new FileReader();
        reader.onload = (
            function(aImg) {
                return function(e) {
                    aImg.src = e.target.result;
                };
            }
        )(backgroundElement);
        reader.readAsDataURL(file);
    }
}


function addHotspot() {
    const framesElement = document.getElementById("frames");
    const hotspotFrameElement = Frames.create(null, {});

    framesElement.appendChild(hotspotFrameElement);
}

// takes the current state and export an html file
function exportHtml() {
    const backgroundImageFilename = window.backgroundImageFilename;

    const frames = Array.from(document.getElementsByClassName("Frame")).filter((el) => !Frames.isHidden(el.attributes.id.value))

    const framesElement = document.getElementById("frames");
    const boundsWidth = framesElement.clientWidth;
    const boundsHeight = framesElement.clientHeight;

    const hotspotsHtml = frames.map((el) =>
        {
            // compute dimensions as percentages of the bounding box
            const style = window.getComputedStyle(el);
            const left = 100*parseFloat(style.getPropertyValue('left'))/boundsWidth;
            const top =  100*parseFloat(style.getPropertyValue('top'))/boundsHeight;
            const width =  100*parseFloat(style.getPropertyValue('width'))/boundsWidth;
            const height =  100*parseFloat(style.getPropertyValue('height'))/boundsHeight;

            return `<a class="hotspot" href="./REPLACE-THIS.html" style="left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%"></a>`
        }
    ).join("\n            ");

    const html = 
`<head>
    <link rel="stylesheet" href="common.css">
    <script src="common.js"></script>
</head>

<body>
    <div class="container">
        <main class="content">
            <img class="background" src="./images/${backgroundImageFilename}"></img>
            ${hotspotsHtml}
        </main>
    </div>
</body>
`
    saveHtmlFile('123.html', html);
}

function saveHtmlFile(filename, html) {
    // https://stackoverflow.com/a/20194533
    var a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([html], {type: 'text/html'}));
    a.download = filename;

    // Append anchor to body.
    document.body.appendChild(a);
    a.click();

    // Remove anchor from body
    document.body.removeChild(a);
}